import {beforeAll,afterAll,beforeEach,describe,it,expect} from 'vitest';
import {financeFixture,type FinanceFixture} from './fixtures/session-finance';
import {allowed,denied} from './fixtures/auth';
describe('Sprint3 current real-token permissions',()=>{
 let f:FinanceFixture;beforeAll(async()=>{f=await financeFixture();});afterAll(async()=>f?.close());beforeEach(async()=>f.reset());
 for(const actor of ['admin1','ceo','managerA','managerAB','staffA','hrA'])it('S3-T14/T55 '+actor+' in-scope close/CASH without new extras',async()=>{
  await f.login(actor);const id=await f.start();const p=await f.preview(id,actor);allowed(await f.cash(p,'1',actor));allowed(await f.closeSession(await f.preview(id,actor),actor));expect((await f.preview(id,actor)).state).toBe('CLOSED');
 });
 for(const actor of ['managerB','staffB','inactive','disabled','user1','user2'])it('S3-T15/T16/T17 '+actor+' cannot operate other/walk-in session',async()=>{
  const id=await f.start();const p=await f.preview(id);denied(await f.view(id,actor));denied(await f.cash(p,'1',actor));denied(await f.closeSession(p,actor));
 });
 it('S3-T16 own MANUAL readable but not self-close and no customer CASH',async()=>{
  const id=await f.start('MANUAL',f.tableA,f.users.user1.id);allowed(await f.view(id,'user1',true));const p=await f.preview(id,'user1',true);expect(p.can_close).toBe(false);expect(p.can_record_cash).toBe(false);denied(await f.closeSession(p,'user1',true));denied(await f.cash(p,'1','user1'));
 });
 it('S3-T18 cutoff/disabled account blocks old private reads, cash, close and recovery',async()=>{
  const id=await f.start();await f.login('staffA');const p=await f.preview(id,'staffA');allowed(await f.account('staffA','DISABLED'));denied(await f.view(id,'staffA'));denied(await f.closeSession(p,'staffA'));denied(await f.cash(p,'1','staffA'));denied(await f.rpc('staffA','session_cash_result',{p_session:id,p_receipt_id:crypto.randomUUID()}));
 });
 it('S3-T29 membership cutoff denies old session then new login still has no venue authority',async()=>{
  const id=await f.start();await f.login('staffA');const p=await f.preview(id,'staffA');const m=await f.membership('staffA');allowed(await f.changeRole('staffA','STAFF','admin1',[{id:m.id,venue_id:f.A,status:'INACTIVE',extra_permissions:[],expected_version:m.version}]));denied(await f.closeSession(p,'staffA'));await f.login('staffA');denied(await f.view(id,'staffA'));denied(await f.cash(p,'1','staffA'));
 });
 it('S3-T39/T40 own versus operations projections contain no raw Auth/bank/audit feed',async()=>{
  const id=await f.start('PAYMENT');const own=await f.preview(id,'user1',true);expect(own).not.toHaveProperty('closed_by');expect(own).not.toHaveProperty('close_reason');const op=await f.preview(id,'staffA');for(const value of [own,op]){const text=JSON.stringify(value);for(const key of ['sessions_revoked_before','external_transaction_id','recipient_scope','access_token','email','password','evidence_digest'])expect(text).not.toContain(key);}
  denied(await f.view(id,'user2',true));denied(await f.rpc(undefined,'own_session_financial',{p_session:id}));denied(await f.direct('staffA','session_cash_receipts?select=*'));denied(await f.direct('user1','session_financial_issues?select=*'));denied(await f.rpc('staffA','audit_feed',{p_venue:f.A}));
 });
 it('S3-T40 audited trusted actors and immutable receipt/closed facts',async()=>{
  const id=await f.start();allowed(await f.cash(await f.preview(id),'1','staffA'));allowed(await f.closeSession(await f.preview(id),'managerA'));const audits=(await f.db.query("select actor_id,actor_role,source,action,after_data from public.audit_events where action in ('SESSION_CASH_RECORDED','TABLE_SESSION_CLOSED') order by created_at")).rows;
  expect(audits[0].actor_id).toBe(f.users.staffA.id);expect(audits[1].actor_id).toBe(f.users.managerA.id);expect(audits.every(a=>a.source==='CONTROL_CENTER')).toBe(true);
  await expect(f.db.query('update public.session_cash_receipts set amount_vnd=2')).rejects.toThrow('IMMUTABLE_FINANCIAL_EVIDENCE');await expect(f.db.query('delete from public.session_cash_receipts')).rejects.toThrow('IMMUTABLE_FINANCIAL_EVIDENCE');await expect(f.db.query("update public.table_sessions set state='ACTIVE' where id=$1",[id])).rejects.toThrow();
 });
 it('S3-T45 all roles lack deferred corrections and raw financial mutation',async()=>{
  const id=await f.start();allowed(await f.closeSession(await f.preview(id)));for(const actor of ['admin1','ceo','managerA','staffA','user1']){denied(await f.direct(actor,'table_sessions?id=eq.'+id,'PATCH',{final_charge_vnd:1}));denied(await f.rpc(actor,'reopen_session',{p_session:id}));denied(await f.rpc(actor,'refund_session',{p_session:id}));}
 });
 for(const disabled of ['venue','table'])it('S3-T24/T57 '+disabled+' disable preserves existing service authority but prevents opening',async()=>{
  const id=await f.start();if(disabled==='venue')allowed(await f.rpc('admin1','update_venue',{p_id:f.A,expected_version:'1',p_code:'A',p_name:'Venue A',p_public_address:null,p_timezone:'Asia/Ho_Chi_Minh',p_is_public:true,p_is_enabled:false,p_reason:'Service disabled'}));
  else {const t=(await f.db.query('select * from public.billiard_tables where id=$1',[f.tableA])).rows[0];allowed(await f.rpc('admin1','update_billiard_table',{p_table:t.id,p_expected_version:t.version,p_label:t.label,p_status:'DISABLED',p_hourly_price_vnd:'100001',p_reason:'Service disabled'}));}
  const p=await f.preview(id,'staffA');allowed(await f.cash(p,'1','staffA'));allowed(await f.closeSession(await f.preview(id,'staffA'),'staffA'));const t=(await f.db.query('select version,status from public.billiard_tables where id=$1',[f.tableA])).rows[0];denied(await f.acquire('user1',f.tableA,crypto.randomUUID(),t.version));if(disabled==='table')expect(t.status).toBe('DISABLED');else expect((await f.db.query('select is_enabled from public.venues where id=$1',[f.A])).rows[0].is_enabled).toBe(false);
 });
 it('S3-T57 disabled customer denied while management closes historical session',async()=>{
  const id=await f.start('PAYMENT');const p=await f.preview(id,'user1',true);allowed(await f.account('user1','DISABLED'));denied(await f.closeSession(p,'user1',true));denied(await f.view(id,'user1',true));allowed(await f.closeSession(await f.preview(id),'staffA'));
 });
});
