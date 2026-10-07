import {beforeAll,afterAll,beforeEach,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {financeFixture,type FinanceFixture} from './fixtures/session-finance';
import {allowed,denied} from './fixtures/auth';
describe('Sprint3 independent transaction and recovery proofs',()=>{
 let f:FinanceFixture;beforeAll(async()=>{f=await financeFixture();});afterAll(async()=>f?.close());beforeEach(async()=>f.reset());
 async function actorTx(actor='managerA'){
  const c=await f.db.connect();await c.query('begin');await c.query('set local role authenticated');await c.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:f.users[actor].id,session_id:f.users[actor].session})]);return c;
 }
 const closeSql=(c:any,p:any)=>c.query('select public.close_table_session($1,$2,$3,$4,$5,$6) result',[p.id,p.session_version,p.payment_version,p.table_version,p.venue_version,'Confirmed transaction test']);
 it('S3-T19/T28 missing/stale versions and current-version terminal close never mutate',async()=>{
  const id=await f.start();const p=await f.preview(id);for(const key of ['p_expected_session_version','p_expected_table_version','p_expected_venue_version'])denied(await f.rpc('managerA','close_table_session',{...f.versions(p),[key]:null,p_reason:'Missing expected version'}));allowed(await f.cash(p,'1'));denied(await f.closeSession(p));const current=await f.preview(id);allowed(await f.closeSession(current));denied(await f.closeSession(current));denied(await f.closeSession(await f.preview(id)));expect((await f.db.query("select count(*)::int n from public.audit_events where action='TABLE_SESSION_CLOSED'")).rows[0].n).toBe(1);
 });
 it('S3-T21/T22 simultaneous USER/operator closes have exactly one committed result',async()=>{
  const id=await f.start('PAYMENT');const p=await f.preview(id);const r=await Promise.all([f.closeSession(p,'user1',true),f.closeSession(p,'staffA')]);expect(r.filter(x=>x.status===200)).toHaveLength(1);expect(r.find(x=>x.status!==200)?.data.message).toContain('VERSION_CONFLICT');expect((await f.db.query("select count(*)::int n from public.audit_events where action='TABLE_SESSION_CLOSED'")).rows[0].n).toBe(1);
 });
 it('S3-T23 close/release invisible before commit then new acquire wins safely',async()=>{
  const id=await f.start();const p=await f.preview(id);const c=await actorTx();let pending:ReturnType<typeof f.acquire>|undefined;
  try{await closeSql(c,p);expect((await f.view(id)).data.state).toBe('ACTIVE');pending=f.acquire('user2',f.tableA,randomUUID(),p.table_version);await f.db.query('select pg_sleep(0.1)');expect((await f.db.query("select count(*)::int n from public.table_sessions where table_id=$1 and state='PENDING_PAYMENT'",[f.tableA])).rows[0].n).toBe(0);await c.query('commit');allowed(await pending);}catch(e){await c.query('rollback');throw e;}finally{c.release();if(pending)await pending.catch(()=>{});}
 });
 it('S3-T25 old retry cannot touch a newer owner',async()=>{
  const id=await f.start();const p=await f.preview(id);allowed(await f.closeSession(p));const next=await f.acquire('user2',f.tableA,randomUUID(),p.table_version);allowed(next);const before=await f.row(next.data.session_id);denied(await f.closeSession(p));denied(await f.closeSession(await f.preview(id)));expect(await f.row(next.data.session_id)).toEqual(before);
 });
 for(const action of ['TABLE_SESSION_CLOSED','SESSION_CASH_RECORDED'])it('S3-T26/T56 '+action+' audit failure rolls all effects back',async()=>{
  const id=await f.start();const p=await f.preview(id);await f.db.query("create function private.sprint3_test_audit_fail() returns trigger language plpgsql as $$begin if new.action='"+action+"' then raise exception 'TEST_AUDIT_FAILURE';end if;return new;end$$; create trigger sprint3_test_audit_fail before insert on public.audit_events for each row execute function private.sprint3_test_audit_fail()");
  try{const r=action==='TABLE_SESSION_CLOSED'?await f.closeSession(p):await f.cash(p);denied(r);expect(r.data.message).toContain('TEST_AUDIT_FAILURE');const after=await f.preview(id);expect(after.state).toBe('ACTIVE');expect(after.session_version).toBe(p.session_version);expect(after.validated_received_vnd).toBe('0');expect(after.ended_at).toBeNull();}finally{await f.db.query('drop trigger sprint3_test_audit_fail on public.audit_events;drop function private.sprint3_test_audit_fail()');}
 });
 it('S3-T26 constraint failure rolls close/version/ownership/audit back',async()=>{
  const id=await f.start();const p=await f.preview(id);await f.db.query("alter table public.table_sessions add constraint sprint3_test_close_fail check(state<>'CLOSED') not valid");try{denied(await f.closeSession(p));expect((await f.preview(id)).session_version).toBe(p.session_version);expect((await f.db.query("select count(*)::int n from public.audit_events where action='TABLE_SESSION_CLOSED'")).rows[0].n).toBe(0);}finally{await f.db.query('alter table public.table_sessions drop constraint sprint3_test_close_fail');}allowed(await f.closeSession(p));
 });
 it('S3-T20/T27 rollback before commit versus lost response after commit recovers exact durable outcome',async()=>{
  const id=await f.start();const p=await f.preview(id);let c=await actorTx();try{await closeSql(c,p);await c.query('rollback');}finally{c.release();}expect((await f.preview(id)).state).toBe('ACTIVE');
  c=await actorTx();try{await closeSql(c,p);await c.query('commit');}finally{c.release();}const final=await f.preview(id);expect(final.state).toBe('CLOSED');denied(await f.closeSession(p));const reloaded=await f.preview(id);expect(reloaded.ended_at).toBe(final.ended_at);expect(reloaded.charge_vnd).toBe(final.charge_vnd);
 });
 it('S3-T24/T29 disable race enforces current auth and service CAS separately',async()=>{
  const id=await f.start();await f.login('staffA');const p=await f.preview(id,'staffA');const c=await f.db.connect();let pending:ReturnType<typeof f.closeSession>|undefined;
  try{await c.query('begin');await c.query('select pg_advisory_xact_lock(20261006,1)');pending=f.closeSession(p,'staffA');await c.query("update public.profiles set account_status='DISABLED',sessions_revoked_before=clock_timestamp(),version=version+1 where id=$1",[f.users.staffA.id]);await c.query('commit');denied(await pending);expect((await f.preview(id)).state).toBe('ACTIVE');}finally{await c.query('rollback');c.release();if(pending)await pending.catch(()=>{});}
 });
 it('S3-T30/T54 distinct CASH/bank credits survive serialized confirmation without lost money',async()=>{
  const id=await f.start('PAYMENT');await f.age(id,'5399');allowed(await f.closeSession(await f.preview(id)));const p=await f.preview(id);const s=await f.row(id);const key=randomUUID();const [cash]=await Promise.all([f.cash(p,'50001','managerA',key),f.neutral(f.event(s.reference,'50001'))]);if(cash.status!==200){expect(cash.data.message).toContain('VERSION_CONFLICT');allowed(await f.cash(await f.preview(id),'50001','managerA',key));}const result=await f.preview(id);expect(result.validated_received_vnd).toBe('200003');expect(result.unresolved_excess_vnd).toBe('50001');expect(result.state).toBe('CLOSED');
 });
 it('S3-T54/T56 duplicate CASH race adds one receipt; distinct identities both survive reconfirmation',async()=>{
  const id=await f.start();const p=await f.preview(id);const key=randomUUID();const rs=await Promise.all([f.cash(p,'1','managerA',key),f.cash(p,'1','managerA',key)]);expect(rs.filter(x=>x.status===200)).toHaveLength(1);const a=randomUUID(),b=randomUUID();const next=await f.preview(id);const results=await Promise.all([f.cash(next,'2','managerA',a),f.cash(next,'2','managerA',b)]);for(let i=0;i<results.length;i++)if(results[i].status!==200)allowed(await f.cash(await f.preview(id),'2','managerA',i===0?a:b));expect((await f.preview(id)).validated_received_vnd).toBe('5');expect((await f.db.query('select count(*)::int n from public.session_cash_receipts')).rows[0].n).toBe(3);
  const other=await f.start('MANUAL',f.tableA2);denied(await f.cash(await f.preview(other),'1','managerA',key));expect((await f.preview(other)).validated_received_vnd).toBe('0');
 });
 it('S3-T60 ACTIVE CASH racing close is exactly once before snapshot or later settlement',async()=>{
  const id=await f.start();const p=await f.preview(id);const key=randomUUID();const [cash,close]=await Promise.all([f.cash(p,'100','managerA',key),f.closeSession(p)]);expect([cash,close].filter(x=>x.status===200)).toHaveLength(1);if(close.status!==200)allowed(await f.closeSession(await f.preview(id)));if(cash.status!==200)allowed(await f.cash(await f.preview(id),'100','managerA',key));const result=await f.preview(id);expect(result.state).toBe('CLOSED');expect(result.validated_received_vnd).toBe('100');expect(result.charge_vnd).toBe('100001');
 });
 it('S3-T46 independent tables and several same-beneficiary sessions close exact targets',async()=>{
  const a=await f.start('MANUAL',f.tableA,f.users.user1.id),b=await f.start('MANUAL',f.tableA2,f.users.user1.id);const pa=await f.preview(a),pb=await f.preview(b);(await Promise.all([f.closeSession(pa),f.closeSession(pb,'staffA')])).forEach(allowed);expect((await f.preview(a)).state).toBe('CLOSED');expect((await f.preview(b)).state).toBe('CLOSED');
 });
 it('S3-T37 actual deadlock abort preserves zero-or-one close then safe retry',async()=>{
  const id=await f.start();const p=await f.preview(id);const a=await actorTx(),b=await f.db.connect();let committed=false;
  try{await b.query('begin');await a.query('select pg_advisory_xact_lock(993,1)');await b.query('select pg_advisory_xact_lock(993,2)');await closeSql(a,p);
   const x=a.query('select pg_advisory_xact_lock(993,2)').then(()=>true).catch(async(e:any)=>{expect(e.code).toBe('40P01');await a.query('rollback');return false;});
   const y=b.query('select pg_advisory_xact_lock(993,1)').then(()=>true).catch(async(e:any)=>{expect(e.code).toBe('40P01');await b.query('rollback');return false;});
   // Release the surviving transaction immediately so the other waiter can finish.
   const first=await Promise.race([x.then(ok=>({which:'a',ok})),y.then(ok=>({which:'b',ok}))]);if(first.ok){if(first.which==='a'){await a.query('commit');committed=true;}else await b.query('commit');}
   const [ar,br]=await Promise.all([x,y]);if(ar&&!committed){await a.query('commit');committed=true;}if(br)await b.query('commit');
  }finally{await a.query('rollback');await b.query('rollback');a.release();b.release();}
  if(!committed)allowed(await f.closeSession(await f.preview(id)));expect((await f.preview(id)).state).toBe('CLOSED');expect((await f.db.query("select count(*)::int n from public.audit_events where action='TABLE_SESSION_CLOSED'")).rows[0].n).toBe(1);
 });
});
