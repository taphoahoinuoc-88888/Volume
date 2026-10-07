import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fixture,allowed,type Fixture} from './auth';
import {validateFinalReceipt,type VerifiedReceipt} from '../../../supabase/functions/_shared/payment-adapter';
/** Real local runtime setup, shared by API/browser fixtures. No mocked handler,
 * test-only payment authority, JWT disable flag or frozen workflow change. */
export async function startPaymentRuntime(f:Fixture):Promise<()=>void>{
 if(process.env.VOLUME_EDGE_RUNTIME_READY==='true')return()=>{};
 const child=spawn('supabase',['functions','serve','open-table-payment'],{stdio:['ignore','pipe','pipe']});
 let serving=false;let exited=false;let buffer='';
 const observe=(chunk:Buffer)=>{buffer=(buffer+chunk.toString()).slice(-4096);if(/Serving functions on|Listening on/.test(buffer))serving=true;};
 child.stdout.on('data',observe);child.stderr.on('data',observe);
 child.on('exit',()=>{exited=true;});child.on('error',()=>{exited=true;});
 const stop=()=>{child.kill('SIGTERM');child.stdout.destroy();child.stderr.destroy();};
 try{
  for(let attempt=0;attempt<100;attempt++){
   if(exited)throw new Error('LOCAL_EDGE_RUNTIME_START_FAILED');
   if(serving){try{const r=await fetch(f.base+'/functions/v1/open-table-payment',{headers:{apikey:f.anon,Authorization:'Bearer '+f.anon}});if(r.status===405)return stop;}catch{}}
   await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error('LOCAL_EDGE_RUNTIME_NOT_READY');
 }catch(e){stop();throw e;}
}
export async function paymentFixture(){
 const f=await fixture();try{const stop=await startPaymentRuntime(f);const p=paymentTools(f);p.close=async()=>{stop();await f.close();};return p;}catch(e){await f.close();throw e;}
}
export function paymentTools(f:Fixture){
 let tableA='',tableA2='',tableB='';
 const roles:Record<string,string>={admin1:'ADMIN',admin2:'ADMIN',ceo:'CEO',managerA:'MANAGER',managerB:'MANAGER',managerAB:'MANAGER',staffA:'STAFF',staffB:'STAFF',hrA:'STAFF',user1:'USER',user2:'USER',disabled:'USER',inactive:'STAFF'};
 async function reset(){
  const c=await f.db.connect();try{await c.query('begin');await c.query('select pg_advisory_xact_lock(20261006,1)');
   await c.query('truncate public.session_financial_issues,public.session_cash_receipts,public.payment_receipts,public.payments,public.table_sessions,public.billiard_tables,public.audit_events');
   for(const [name,role]of Object.entries(roles))await c.query('update public.profiles set role=$2,account_status=$3,version=1,sessions_revoked_before=null where id=$1',[f.users[name].id,role,name==='disabled'?'DISABLED':'ACTIVE']);
   await c.query("update public.staff_memberships set status=case when profile_id=$1 then 'INACTIVE' else 'ACTIVE' end,extra_permissions=case when profile_id=$2 then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end,version=1",[f.users.inactive.id,f.users.hrA.id]);
   await c.query("update public.venues set is_enabled=code<>'DISABLED',is_public=code='A',version=1,management_contact=null");await c.query('commit');
  }catch(e){await c.query('rollback');throw e;}finally{c.release();}
  async function create(venue:string,code:string){const r=await f.rpc('admin1','create_billiard_table',{p_venue:venue,p_code:code,p_label:'Bàn '+code,p_hourly_price_vnd:'100000',p_reason:'Isolated integration table'});allowed(r);return r.data.id as string;}
  tableA=await create(f.A,'A1');tableA2=await create(f.A,'A2');tableB=await create(f.B,'B1');
 }
 const acquire=(name='user1',table=tableA,key=randomUUID(),version='1')=>f.rpc(name,'acquire_table',{p_table:table,p_expected_table_version:version,p_request_key:key});
 async function row(session:string){return (await f.db.query('select s.*,p.id payment_id,p.reference,p.state payment_state,p.version payment_version,p.payment_success_at,p.resolution_reason from public.table_sessions s join public.payments p on p.session_id=s.id where s.id=$1',[session])).rows[0];}
 function event(reference:string,amount='100000',extra:Partial<VerifiedReceipt>={}):VerifiedReceipt{
  const id=randomUUID();return validateFinalReceipt({provider:'neutral-fixture',recipient_scope:'test-merchant',external_event_id:id,external_transaction_id:id,reference,kind:'CREDIT',amount_vnd:amount,currency:'VND',provider_occurred_at:new Date(Date.now()-1000).toISOString(),provider_callback_received_at:new Date().toISOString(),evidence_digest:'normalized-financial-facts',...extra},'test-merchant',true);
 }
 async function gateway<T>(method:'ingest_payment_event'|'fail_payment_attempt'|'expire_table_holds',args:unknown[]){
  const c=await f.db.connect();try{await c.query('begin');await c.query('set local role volume_payment_ingest');
   const result=await c.query('select private.'+method+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') as result',args);await c.query('commit');return result.rows[0].result as T;
  }catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 const credit=(e:VerifiedReceipt)=>gateway<{status:string;receipt_id:string;payment_id:string}>('ingest_payment_event',[JSON.stringify(e)]);
 const expire=()=>gateway<number>('expire_table_holds',[100]);
 const fail=(ref:string)=>gateway<void>('fail_payment_attempt',[ref,'QR_FAILED']);
 const manual=(name='managerA',table=tableA,customer:string|null=null,key=randomUUID(),version:string|null='1',reason='Authorized walk-in override')=>f.rpc(name,'open_table_manual',{p_table:table,p_customer:customer,p_expected_table_version:version,p_request_key:key,p_reason:reason});
 async function makeExpired(id:string){
  // Privileged fixture moves the entire immutable hold clock coherently, never
  // overrides the production processing clock/helper or grants client access.
  await f.db.query("with t as materialized(select clock_timestamp() n) update public.table_sessions set acquired_at=t.n-interval '301 seconds',expires_at=t.n-interval '1 second' from t where id=$1",[id]);
 }
 const cancel=async(name:string,id:string,sessionVersion?:string,paymentVersion?:string)=>{const r=await row(id);return f.rpc(name,'cancel_table_hold',{p_session:id,p_expected_session_version:sessionVersion??r.version,p_expected_payment_version:paymentVersion??r.payment_version});};
 const edge=async(name:string|undefined,body:object)=>{const r=await fetch(f.base+'/functions/v1/open-table-payment',{method:'POST',headers:{apikey:f.anon,'Content-Type':'application/json',...(name?{Authorization:'Bearer '+f.users[name].token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
 return {...f,reset,acquire,row,event,credit,expire,fail,manual,makeExpired,cancel,edge,get tableA(){return tableA;},get tableA2(){return tableA2;},get tableB(){return tableB;}};
}
export type PaymentFixture=Awaited<ReturnType<typeof paymentFixture>>;
export {allowed};
export type {Fixture};
