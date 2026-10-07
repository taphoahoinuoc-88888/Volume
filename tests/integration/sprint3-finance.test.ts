import {beforeAll,afterAll,beforeEach,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {financeFixture,type FinanceFixture} from './fixtures/session-finance';
import {allowed,denied} from './fixtures/auth';
describe('Sprint3 real financial lifecycle',()=>{
 let f:FinanceFixture;beforeAll(async()=>{f=await financeFixture();});afterAll(async()=>f?.close());beforeEach(async()=>f.reset());
 it('S3-T01/T02/T06/T07/T09/T47 minimum charge and frozen opening evidence',async()=>{
  const id=await f.start('PAYMENT');const opening=await f.row(id);const p=await f.preview(id,'user1',true);expect(p.charge_vnd).toBe('100001');expect(p.settlement_status).toBe('PAID');
  const c=await f.closeSession(p,'user1',true);allowed(c);expect(c.data.state).toBe('CLOSED');expect(c.data.charge_vnd).toBe('100001');expect(c.data.released).toBe(true);const after=await f.row(id);expect(after.payment_state).toBe('SUCCESS');expect(after.required_amount_vnd).toBe(opening.required_amount_vnd);expect(after.started_at).toEqual(opening.started_at);
 });
 it('S3-T03/T04/T35/T36/T44/T50 continuation, overnight and downtime never free time',async()=>{
  const id=await f.start();await f.age(id,'2592000');const p=await f.preview(id);expect(p.state).toBe('ACTIVE');expect(BigInt(p.billable_minutes)).toBeGreaterThanOrEqual(43200n);expect(BigInt(p.charge_vnd)).toBeGreaterThanOrEqual(72000720n);expect(p.is_estimate).toBe(true);
  expect((await f.db.query('select ended_at from public.table_sessions where id=$1',[id])).rows[0].ended_at).toBeNull();const c=await f.closeSession(p);allowed(c);expect(BigInt(c.data.charge_vnd)).toBeGreaterThanOrEqual(BigInt(p.charge_vnd));
 });
 it('S3-T05/T43 original acquired snapshot survives price edits and date change',async()=>{
  const id=await f.start('PAYMENT');await f.age(id,'5370');const t=(await f.db.query('select * from public.billiard_tables where id=$1',[f.tableA])).rows[0];allowed(await f.rpc('admin1','update_billiard_table',{p_table:t.id,p_expected_version:t.version,p_label:t.label,p_status:'ACTIVE',p_hourly_price_vnd:'900000',p_reason:'Later price'}));
  const p=await f.preview(id);expect(p.hourly_snapshot_vnd).toBe('100001');expect(p.charge_vnd).toBe('150002');allowed(await f.closeSession(p));expect((await f.row(id)).required_amount_vnd).toBe('100001');
 });
 it('S3-T06/T07/T10/T51/T52 unpaid walk-in closes/releases without fake payment then CASH settles partially and fully',async()=>{
  const id=await f.start();const p=await f.preview(id);expect(p.customer).toBeNull();expect(p.validated_received_vnd).toBe('0');expect(p.settlement_status).toBe('UNPAID');const c=await f.closeSession(p);allowed(c);expect(c.data.remaining_due_vnd).toBe('100001');
  expect((await f.db.query('select count(*)::int n from public.payments where session_id=$1',[id])).rows[0].n).toBe(0);allowed(await f.cash(c.data,'50000'));let next=await f.preview(id);expect(next.settlement_status).toBe('PARTIAL');expect(next.remaining_due_vnd).toBe('50001');allowed(await f.cash(next,'50001'));next=await f.preview(id);expect(next.settlement_status).toBe('PAID');expect(next.released).toBe(true);
 });
 it('S3-T08/T13/T42 integer cash rejects malformed/zero/fraction/overflow/client trust fields',async()=>{
  const id=await f.start();const p=await f.preview(id);for(const value of ['0','-1','1.5','1e3',' 1','9223372036854775808'])denied(await f.cash(p,value));
  denied(await f.rpc('managerA','close_table_session',{...f.versions(p),p_reason:'Forged clock',ended_at:'2000-01-01'}));expect((await f.preview(id)).state).toBe('ACTIVE');expect((await f.db.query('select count(*)::int n from public.session_cash_receipts')).rows[0].n).toBe(0);
 });
 it('S3-T11/T58/T61 ordinary debt is UNPAID/PARTIAL, excess is an explicit anomaly',async()=>{
  const id=await f.start();let p=await f.preview(id);expect(p.settlement_status).toBe('UNPAID');allowed(await f.cash(p,'1'));p=await f.preview(id);expect(p.settlement_status).toBe('PARTIAL');expect(p.remaining_due_vnd).toBe('100000');allowed(await f.cash(p,'100001'));p=await f.preview(id);expect(p.settlement_status).toBe('NEEDS_RESOLUTION');expect(p.unresolved_excess_vnd).toBe('1');expect(p.issues).toContain('EXCESS');
 });
 it('S3-T12/T53 same-session money only and immutable closure snapshot',async()=>{
  const a=await f.start(),b=await f.start('MANUAL',f.tableA2);let p=await f.preview(a);allowed(await f.closeSession(p));const original=await f.preview(a);allowed(await f.cash(await f.preview(b),'50000'));expect((await f.preview(a)).validated_received_vnd).toBe('0');allowed(await f.cash(original,'50000'));p=await f.preview(a);expect(p.ended_at).toBe(original.ended_at);expect(p.charge_vnd).toBe(original.charge_vnd);expect(p.closed_by).toBe(original.closed_by);expect(p.closure_financial).toEqual(original.closure_financial);expect(p.remaining_due_vnd).toBe('50001');
 });
 it('S3-T31 conflict and notices retain immutable money and independent review reason',async()=>{
  const id=await f.start('PAYMENT');const s=await f.row(id);const e=f.event(s.reference,'100');await f.neutral(e);const before=await f.preview(id);const conflict={...e,amount_vnd:'101'};expect((await f.neutral(conflict)).status).toBe('REJECTED_CONFLICT');const p=await f.preview(id);expect(p.validated_received_vnd).toBe(before.validated_received_vnd);expect(p.issues).toContain('PROVIDER_CONFLICT');await f.neutral(conflict);expect((await f.db.query('select count(*)::int n from public.session_financial_issues')).rows[0].n).toBe(1);
  await f.neutral(f.event(s.reference,'1',{kind:'REVERSAL_NOTICE',external_transaction_id:null}));expect((await f.preview(id)).issues).toContain('PROVIDER_NOTICE');
 });
 it('S3-T32/T53 late provider credit reduces exact old due and never touches new owner',async()=>{
  const id=await f.start('PAYMENT');await f.age(id,'5370');const p=await f.preview(id);allowed(await f.closeSession(p));const closed=await f.preview(id);const table=(await f.db.query('select version from public.billiard_tables where id=$1',[f.tableA])).rows[0];allowed(await f.acquire('user2',f.tableA,randomUUID(),table.version));const s=await f.row(id);await f.neutral(f.event(s.reference,'30000'));const after=await f.preview(id);expect(after.remaining_due_vnd).toBe('20001');expect(after.settlement_status).toBe('NEEDS_RESOLUTION');expect(after.issues).toContain('LATE_BANK');expect(after.ended_at).toBe(closed.ended_at);expect(after.charge_vnd).toBe(closed.charge_vnd);expect((await f.db.query("select count(*)::int n from public.table_sessions where table_id=$1 and state='PENDING_PAYMENT'",[f.tableA])).rows[0].n).toBe(1);
 });
 it('S3-T33/T34 provider unavailable does not block close or invent receipts',async()=>{
  const id=await f.start();const p=await f.preview(id);expect(p.provider_available).toBe(false);allowed(await f.closeSession(p));expect((await f.db.query('select count(*)::int n from public.payment_receipts')).rows[0].n).toBe(0);expect((await f.preview(id)).settlement_status).toBe('UNPAID');
 });
 it('S3-T42 final API numbers conserve exact V/C with no float',async()=>{
  const id=await f.start();allowed(await f.cash(await f.preview(id),'9223372036854775807'));const p=await f.preview(id);expect(BigInt(p.validated_received_vnd)).toBe(BigInt(p.applied_amount_vnd)+BigInt(p.unresolved_excess_vnd));expect(BigInt(p.charge_vnd)).toBe(BigInt(p.applied_amount_vnd)+BigInt(p.remaining_due_vnd));denied(await f.cash(p,'1'));expect((await f.preview(id)).validated_received_vnd).toBe('9223372036854775807');
 });
 it('S3-T49 time advances without a persisted version conflict or preview backdate',async()=>{
  const id=await f.start();await f.age(id,'3599');const p=await f.preview(id);expect(p.charge_vnd).toBe('100001');await f.db.query('select pg_sleep(1.1)');const c=await f.closeSession(p);allowed(c);expect(c.data.charge_vnd).toBe('101668');expect(Date.parse(c.data.ended_at)).toBeGreaterThan(Date.parse(p.server_now));
 });
 it('S3-T56 CASH duplicate requires current CAS and recovers by exact economic identity',async()=>{
  const id=await f.start();const p=await f.preview(id);const key=randomUUID();allowed(await f.cash(p,'50000','managerA',key));denied(await f.cash(p,'50000','managerA',key));const read=await f.rpc('managerA','session_cash_result',{p_session:id,p_receipt_id:key});allowed(read);expect(read.data.amount_vnd).toBe('50000');const replay=await f.cash(await f.preview(id),'50000','managerA',key);allowed(replay);expect(replay.data.status).toBe('NO_CHANGE');denied(await f.cash(await f.preview(id),'50001','managerA',key));expect((await f.db.query("select count(*)::int n from public.audit_events where action='SESSION_CASH_RECORDED'")).rows[0].n).toBe(1);
 });
 it('S3-T59 active CASH does not stop, freeze or release; later overtime still applies',async()=>{
  const id=await f.start();const before=await f.preview(id);allowed(await f.cash(before,'50000','staffA'));const after=await f.preview(id);expect(after.state).toBe('ACTIVE');expect(after.ended_at).toBeNull();expect(after.released).toBe(false);expect(after.started_at).toBe(before.started_at);await f.age(id,'5370');const c=await f.closeSession(await f.preview(id));allowed(c);expect(c.data.charge_vnd).toBe('150002');expect(c.data.remaining_due_vnd).toBe('100002');
 });
 it('S3-T62 excess can be absorbed by overtime but independent issue persists',async()=>{
  const id=await f.start('PAYMENT');const s=await f.row(id);const e=f.event(s.reference,'10000');await f.neutral(e);expect((await f.preview(id)).issues).toContain('EXCESS');await f.age(id,'5370');expect((await f.preview(id)).settlement_status).toBe('PARTIAL');await f.neutral({...e,amount_vnd:'10001'});const p=await f.preview(id);expect(p.unresolved_excess_vnd).toBe('0');expect(p.settlement_status).toBe('NEEDS_RESOLUTION');expect(p.remaining_due_vnd).toBe('40001');
 });
});
