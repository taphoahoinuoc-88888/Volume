import {unconfiguredAdapter,preparationRequest,type Preparation} from '../_shared/payment-adapter.ts';
interface Opening {id:string;state:string;payment:null|{reference:string;state:string;remaining_amount_vnd:string}}
interface Dependencies {
 authenticate(token:string):Promise<void>;
 rpc<T>(token:string,name:string,body:Record<string,unknown>):Promise<T>;
 prepare(reference:string,amountVnd:string):Promise<Preparation>;
 fail(reference:string):Promise<void>;
}
// Structural contract avoids a bare Node type import in the Deno module graph.
interface DatabaseDriver {default:{Pool:new(options:{connectionString:string|undefined;max:number})=>{
 connect():Promise<{query(sql:string,values?:unknown[]):Promise<unknown>;release():void}>;
 end():Promise<void>;
}}}
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
function response(body:unknown,status=200){return new Response(status===204?null:JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});}
async function retrySafe<T>(operation:()=>Promise<T>):Promise<T>{
 for(let attempt=0;;attempt++){try{return await operation();}catch(e){
  const code=typeof e==='object'&&e!==null&&'code' in e?String(e.code):'';
  if(attempt>=2||!(e instanceof TypeError||['40001','40P01','ECONNRESET','ECONNREFUSED','ETIMEDOUT'].includes(code)))throw e;
  await new Promise(resolve=>setTimeout(resolve,50*(attempt+1)));
 }}
}
export function createOpeningHandler(d:Dependencies){return async(req:Request):Promise<Response>=>{
 if(req.method==='OPTIONS')return response(null,204);
 if(req.method!=='POST')return response({code:'METHOD_NOT_ALLOWED'},405);
 const token=req.headers.get('authorization')||'';
 if(!/^Bearer \S+$/.test(token))return response({code:'UNAUTHORIZED'},401);
 try{
  await d.authenticate(token);
  const body=await req.json();
  if(!body||typeof body!=='object'||Object.keys(body).some(k=>!['table_id','expected_version','request_key'].includes(k)))return response({code:'INVALID_REQUEST'},400);
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(typeof body.table_id!=='string'||!uuid.test(body.table_id)||typeof body.request_key!=='string'||!uuid.test(body.request_key)||typeof body.expected_version!=='string'||!/^\d+$/.test(body.expected_version)||BigInt(body.expected_version)<1n||BigInt(body.expected_version)>2n**63n-1n)return response({code:'INVALID_REQUEST'},400);
  const created=await retrySafe(()=>d.rpc<{session_id:string}>(token,'acquire_table',{p_table:body.table_id,p_expected_table_version:body.expected_version,p_request_key:body.request_key}));
  const current=(await d.rpc<Opening[]>(token,'own_table_sessions',{})).find(s=>s.id===created.session_id);
  if(!current)throw new Error('ACCESS_DENIED');
  if(current.state!=='PENDING_PAYMENT'||!current.payment||current.payment.state!=='WAITING')return response({session_id:current.id,state:current.state});
  try{
   const q=preparationRequest(current.payment.reference,current.payment.remaining_amount_vnd);
   const prepared=await d.prepare(q.reference,q.amountVnd);
   if(prepared.reference!==q.reference||prepared.amountVnd!==q.amountVnd||typeof prepared.qr!=='string'||!prepared.qr||prepared.qr.length>20000)throw new Error('INVALID_PREPARATION');
   // Final live read after preparation: authority/expiry/payment may have changed.
   const fresh=(await d.rpc<Opening[]>(token,'own_table_sessions',{})).find(s=>s.id===current.id);
   if(!fresh)throw new Error('ACCESS_DENIED');
   if(fresh.state!=='PENDING_PAYMENT'||fresh.payment?.remaining_amount_vnd!==q.amountVnd)return response({session_id:fresh.id,state:fresh.state,reload:true});
   return response({session_id:fresh.id,state:fresh.state,qr:prepared.qr,amount_vnd:q.amountVnd});
  }catch{
   // This trusted operation cannot cancel ACTIVE or discard real money. A failed
   // release returns failure, never a fake success ACK; same-key retry is safe.
   await retrySafe(()=>d.fail(current.payment!.reference));
   const final=(await d.rpc<Opening[]>(token,'own_table_sessions',{})).find(s=>s.id===current.id);
   if(final?.state==='ACTIVE')return response({session_id:final.id,state:final.state});
   return response({code:'PAYMENT_UNAVAILABLE',session_id:current.id,message:'Chưa thể tạo mã thanh toán. Vui lòng kiểm tra trạng thái phiên và thử lại sau.'},503);
  }
 }catch(e){
  const message=e instanceof Error?e.message:'';
  if(message.includes('ACCESS_DENIED')||message==='UNAUTHORIZED')return response({code:'ACCESS_DENIED'},403);
  if(message.includes('VERSION_CONFLICT'))return response({code:'VERSION_CONFLICT'},409);
  if(/TABLE_UNAVAILABLE|CUSTOMER_HOLD_EXISTS|IDEMPOTENCY_CONFLICT/.test(message))return response({code:'UNAVAILABLE'},409);
  return response({code:'REQUEST_FAILED'},503);
 }
};}
// Supabase owns JWT verification at the gateway; Auth confirms the current user.
// RPCs receive that same user token and enforce live Volume cutoff/eligibility.
declare const Deno:{env:{get(name:string):string|undefined};serve(handler:(req:Request)=>Promise<Response>):unknown};
if(typeof Deno!=='undefined'){
 const url=Deno.env.get('SUPABASE_URL')!;const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
 async function rpc<T>(token:string,name:string,body:Record<string,unknown>):Promise<T>{
  const r=await fetch(url+'/rest/v1/rpc/'+name,{method:'POST',headers:{Authorization:token,apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json();if(!r.ok)throw Object.assign(new Error(typeof data.message==='string'?data.message:'RPC_FAILED'),{code:data.code});return data as T;
 }
 Deno.serve(createOpeningHandler({
  async authenticate(token){const r=await fetch(url+'/auth/v1/user',{headers:{Authorization:token,apikey:anon}});if(!r.ok)throw new Error('UNAUTHORIZED');},
  rpc,prepare:(reference,amount)=>unconfiguredAdapter.preparePayment(reference,amount),
  async fail(reference){
   // Reuse the existing locked pg dependency. Loaded only by server runtime;
   // credential never enters client modules, responses or logs.
   const specifier='npm:pg@8.16.3';const module=await import(specifier) as DatabaseDriver;
   const pool=new module.default.Pool({connectionString:Deno.env.get('SUPABASE_DB_URL'),max:1});
   const connection=await pool.connect();
   try{await connection.query('begin');await connection.query('set local role volume_payment_ingest');await connection.query('select private.fail_payment_attempt($1,$2)',[reference,'QR_FAILED']);await connection.query('commit');}
   catch(e){await connection.query('rollback');throw e;}
   finally{connection.release();await pool.end();}
  },
 }));
}
