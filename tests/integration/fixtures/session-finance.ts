import {randomUUID} from 'node:crypto';
import {paymentFixture,type PaymentFixture,allowed} from './payment';
export function financeTools(f:PaymentFixture){
 const view=(id:string,actor='managerA',own=false)=>f.rpc(actor,own?'own_session_financial':'session_financial',{p_session:id});
 async function preview(id:string,actor='managerA',own=false){const r=await view(id,actor,own);allowed(r);return r.data;}
 function versions(s:any){return {p_session:s.id,p_expected_session_version:s.session_version,p_expected_payment_version:s.payment_version,p_expected_table_version:s.table_version,p_expected_venue_version:s.venue_version};}
 const closeSession=(s:any,actor='managerA',own=false)=>f.rpc(actor,own?'close_own_table_session':'close_table_session',{...versions(s),...(!own?{p_reason:'Confirmed test close'}:{})});
 const cash=(s:any,amount='50000',actor='managerA',id=randomUUID(),reason='Confirmed test cash')=>f.rpc(actor,'record_session_cash',{...versions(s),p_receipt_id:id,p_amount_vnd:amount,p_reason:reason});
 async function start(method:'PAYMENT'|'MANUAL'='MANUAL',table=f.tableA,customer:string|null=null){
  const t=(await f.db.query('select version,status,label from public.billiard_tables where id=$1',[table])).rows[0];
  const price=await f.rpc('admin1','update_billiard_table',{p_table:table,p_expected_version:t.version,p_label:t.label,p_status:t.status,p_hourly_price_vnd:'100001',p_reason:'Isolated exact oracle rate'});allowed(price);
  const version=(await f.db.query('select version from public.billiard_tables where id=$1',[table])).rows[0].version;
  if(method==='MANUAL'){const r=await f.manual(table===f.tableB?'managerB':'managerA',table,customer,randomUUID(),version);allowed(r);return r.data.session_id as string;}
  const r=await f.acquire('user1',table,randomUUID(),version);allowed(r);const s=await f.row(r.data.session_id);await f.credit(f.event(s.reference,'100001'));return s.id as string;
 }
 async function age(id:string,seconds:string){
  // Isolated privileged historical fixture only. No runtime timestamp override.
  const c=await f.db.connect();try{await c.query('begin');
   const r=await c.query("with t as materialized(select clock_timestamp()-($2||' seconds')::interval n) update public.table_sessions set started_at=t.n,acquired_at=t.n-interval '1 second',expires_at=case when opening_method='PAYMENT' then t.n+interval '299 seconds' else null end from t where id=$1 and state='ACTIVE' returning started_at",[id,seconds]);
   if(r.rowCount!==1)throw Error('Only ACTIVE isolated fixture may be aged');
   await c.query("update public.payments p set payment_success_at=s.started_at from public.table_sessions s where p.session_id=s.id and s.id=$1 and p.state='SUCCESS'",[id]);await c.query('commit');
  }catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 async function neutral(e:object){const c=await f.db.connect();try{await c.query('begin');await c.query('set local role volume_payment_ingest');const r=await c.query('select private.sprint3_ingest_payment_event($1::jsonb) result',[JSON.stringify(e)]);await c.query('commit');return r.rows[0].result;}catch(e){await c.query('rollback');throw e;}finally{c.release();}}
 return {...f,view,preview,versions,closeSession,cash,start,age,neutral,get tableA(){return f.tableA;},get tableA2(){return f.tableA2;},get tableB(){return f.tableB;}};
}
export async function financeFixture(){return financeTools(await paymentFixture());}
export type FinanceFixture=Awaited<ReturnType<typeof financeFixture>>;
