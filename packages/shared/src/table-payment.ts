import {client,rpc} from './supabase-client';
export interface TableRow {id:string;venue_id:string;venue_name?:string;code:string;label:string;version:string;hourly_price_vnd?:string;status?:string;availability:'available'|'pending'|'playing';started_at?:string|null;expires_at?:string|null;session_id?:string|null;server_now:string;management_contact?:string|null}
export interface OpeningPayment {id:string;reference:string;version:string;state:'WAITING'|'SUCCESS'|'CANCELLED'|'PAYMENT_NEEDS_RESOLUTION';required_amount_vnd:string;received_amount_vnd:string;remaining_amount_vnd:string;excess_amount_vnd:string;payment_success_at:string|null}
export interface OwnSession {id:string;table_id:string;venue_id:string;label:string;opening_method:'PAYMENT'|'MANUAL';state:'PENDING_PAYMENT'|'ACTIVE'|'CANCELLED'|'CLOSED';expires_at:string|null;started_at:string|null;version:string;server_now:string;management_contact:string|null;request_key:string|null;quote_version:string|null;payment:OpeningPayment|null}
export interface ManagementPayment extends Omit<OpeningPayment,'reference'> {session_id:string;venue_id:string;table_id:string;expires_at:string|null;started_at:string|null;resolution_reason:string|null;notice:boolean;server_now:string}
export interface ManualPreview {table_id:string;venue_id:string;label:string;version:string;required_amount_vnd:string;customer:null|{id:string;display_name:string;account_status:string};opening_method:'MANUAL';prepaid_minutes:60;payment_bypassed:true}
export function money(value:string){return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(BigInt(value));}
export function remainingSeconds(end:string,serverNow:string,elapsedSeconds=0){return Math.max(0,Math.ceil((Date.parse(end)-Date.parse(serverNow))/1000-elapsedSeconds));}
export function initialSeconds(startedAt:string,serverNow:string,elapsedSeconds=0){return remainingSeconds(new Date(Date.parse(startedAt)+3600000).toISOString(),serverNow,elapsedSeconds);}
export function timer(seconds:number){const n=Math.max(0,Math.floor(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
export async function prepareOpening(table:Pick<TableRow,'id'|'version'>,requestKey:string){
 const {data,error}=await client.functions.invoke('open-table-payment',{body:{table_id:table.id,expected_version:table.version,request_key:requestKey}});
 if(error){const context=error.context;if(context instanceof Response){const result=await context.json().catch(()=>null);if(result?.session_id)return result as {session_id:string;code?:string;state?:string;qr?:string;amount_vnd?:string;message?:string};if(result?.code==='VERSION_CONFLICT')throw new Error('Giá hoặc thông tin bàn đã thay đổi. Hãy tải lại và chọn bàn.');}throw new Error('Chưa thể đặt bàn. Vui lòng tải lại; không tạo yêu cầu mới khi chưa rõ kết quả.');}
 return data as {session_id:string;code?:string;state?:string;qr?:string;amount_vnd?:string;message?:string};
}
export const ownSessions=()=>rpc<OwnSession[]>('own_table_sessions');
