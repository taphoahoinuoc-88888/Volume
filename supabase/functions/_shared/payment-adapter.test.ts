import {describe,it,expect} from 'vitest';
import {integerVnd,preparationRequest,validateVerifiedReceipt,validateFinalReceipt,unconfiguredAdapter,type VerifiedReceipt} from './payment-adapter';
import {createOpeningHandler} from '../open-table-payment/index';
const ids={table:'40000000-0000-0000-0000-000000000001',key:'50000000-0000-0000-0000-000000000001'};
const body={table_id:ids.table,request_key:ids.key,expected_version:'1'};
const receipt:VerifiedReceipt={provider:'neutral',recipient_scope:'merchant',external_event_id:'event',external_transaction_id:'transfer',reference:'reference',kind:'CREDIT',amount_vnd:'70000',currency:'VND',provider_occurred_at:'2026-10-06T12:00:00Z',provider_callback_received_at:'2026-10-06T12:01:00Z',evidence_digest:'financial-facts'};
describe('neutral payment boundary (unit; not real-provider evidence)',()=>{
 it('T10/T86 requests only remaining integer VND and same reference',()=>{expect(preparationRequest('ref','30000')).toEqual({reference:'ref',amountVnd:'30000'});});
 it.each(['-1','1.5','1e5','0','9223372036854775808','NaN'])('T29/T60 rejects invalid credit %s',value=>expect(()=>integerVnd(value)).toThrow());
 it('accepts bigint beyond JS safe integer without rounding',()=>expect(integerVnd('9007199254740993')).toBe('9007199254740993'));
 it('T29 normalized receipt keeps immutable times and amount',()=>expect(validateVerifiedReceipt(receipt)).toEqual(receipt));
 it('T35 rejects wrong recipient, nonfinal and non-VND normalized attestation',()=>{expect(()=>validateFinalReceipt(receipt,'another-merchant',true)).toThrow();expect(()=>validateFinalReceipt(receipt,'merchant',false)).toThrow();expect(()=>validateFinalReceipt({...receipt,currency:'USD' as never},'merchant',true)).toThrow();expect(validateFinalReceipt(receipt,'merchant',true)).toEqual(receipt);});
 it('rejects non-credit-as-money/unknown kind',()=>expect(()=>validateVerifiedReceipt({...receipt,kind:'PENDING' as never})).toThrow());
 it('unconfigured provider cannot generate QR or verify money',async()=>{await expect(unconfiguredAdapter.preparePayment('ref','100000')).rejects.toThrow();await expect(unconfiguredAdapter.verifyEvent({},receipt.provider_callback_received_at)).rejects.toThrow();});
});
describe('server orchestration unit, actual Edge/auth tested separately',()=>{
 function handler(prepare:(r:string,a:string)=>Promise<{reference:string;amountVnd:string;qr:string}>,active=false){let failed=0;const calls:string[]=[];const d={async authenticate(){},async rpc<T>(_token:string,name:string){calls.push(name);return (name==='acquire_table'?{session_id:'session'}:[{id:'session',state:failed?(active?'ACTIVE':'CANCELLED'):'PENDING_PAYMENT',payment:{reference:'ref',state:'WAITING',remaining_amount_vnd:'30000'}}]) as T;},prepare,async fail(){failed++;}};return {invoke:createOpeningHandler(d),calls,failed:()=>failed};}
 const req=(value:unknown=body)=>new Request('http://local.test',{method:'POST',headers:{Authorization:'Bearer test-unit','Content-Type':'application/json'},body:JSON.stringify(value)});
 it('T32 client price/success/timestamp/ownership fields rejected before acquire',async()=>{const h=handler(async()=>{throw new Error();});for(const key of ['price','success','started_at','customer_profile_id'])expect((await h.invoke(req({...body,[key]:'forged'}))).status).toBe(400);expect(h.calls).toEqual([]);});
 it('T81 preparation failure calls trusted release and does not ACK payment',async()=>{const h=handler(async()=>{throw new Error('failed');});const r=await h.invoke(req());expect(r.status).toBe(503);expect(h.failed()).toBe(1);expect((await r.json()).code).toBe('PAYMENT_UNAVAILABLE');});
 it('T82 failure racing successful payment never reports ACTIVE as cancelled',async()=>{const h=handler(async()=>{throw new Error();},true);expect(await(await h.invoke(req())).json()).toEqual({session_id:'session',state:'ACTIVE'});});
 it('T10 QR preparation uses server-read remaining only',async()=>{const h=handler(async(reference,amountVnd)=>{expect(amountVnd).toBe('30000');return {reference,amountVnd,qr:'opaque-test-artifact'};});expect((await h.invoke(req())).status).toBe(200);expect(h.failed()).toBe(0);});
 it('rejects mismatched preparation without returning fake QR',async()=>{const h=handler(async()=>({reference:'wrong',amountVnd:'100000',qr:'wrong'}));expect((await h.invoke(req())).status).toBe(503);expect(h.failed()).toBe(1);});
 it('requires Authorization and allows bodyless CORS preflight',async()=>{const h=handler(async()=>{throw new Error();});expect((await h.invoke(new Request('http://local.test',{method:'POST'}))).status).toBe(401);expect((await h.invoke(new Request('http://local.test',{method:'OPTIONS'}))).status).toBe(204);});
 it('T46 retryable failures use unchanged command at most three times, never fake success',async()=>{
  let attempts=0;const bodies:unknown[]=[];const invoke=createOpeningHandler({async authenticate(){},async rpc<T>(_t:string,name:string,b:Record<string,unknown>){if(name==='acquire_table'){attempts++;bodies.push(b);throw Object.assign(new Error('deadlock'),{code:'40P01'});}return [] as T;},async prepare(){throw new Error();},async fail(){}});
  expect((await invoke(req())).status).toBe(503);expect(attempts).toBe(3);expect(bodies).toEqual([bodies[0],bodies[0],bodies[0]]);
 });
});
