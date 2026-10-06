import {createClient} from '@supabase/supabase-js';
import type {Access} from './database.types';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const client=createClient(url||'http://127.0.0.1:54321',key||'configuration-required',{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'volume-auth-v2'}});
export class VolumeError extends Error {constructor(public kind:string,message:string){super(message);}}
export async function readAccess():Promise<Access>{const {data,error}=await client.rpc('current_access');if(error){if(error.message.includes('ACCESS_DENIED')||['PGRST301','PGRST302','PGRST303'].includes(error.code)){await logout();throw new VolumeError('ACCESS_DENIED','Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.');}throw new VolumeError('UNAVAILABLE','Chưa thể tải thông tin. Vui lòng kiểm tra kết nối và thử lại.');}return data as Access;}
export async function logout(){await client.auth.signOut({scope:'local'});window.dispatchEvent(new Event('volume-session-ended'));}
export async function rpc<T>(name:string,body:Record<string,unknown>={}):Promise<T>{
 const {data,error}=await client.rpc(name,body);
 if(error){
  if(error.message.includes('VERSION_CONFLICT'))throw new VolumeError('VERSION_CONFLICT','Dữ liệu đã thay đổi. Hãy đóng xác nhận và tải lại trước khi thử lại.');
  if(error.message.includes('ACCESS_DENIED')){try{await readAccess();}catch{await logout();}throw new VolumeError('ACCESS_DENIED','Bạn không có quyền thực hiện việc này.');}
  if(error.message.includes('LAST_ACTIVE_ADMIN'))throw new VolumeError('LAST_ACTIVE_ADMIN','Cần giữ ít nhất một quản trị viên đang hoạt động.');
  throw new VolumeError('INVALID_CHANGE','Không thể lưu thay đổi. Vui lòng kiểm tra thông tin và thử lại.');
 }
 return data as T;
}

