export * from './database.types';
export * from './permissions';
export * from './supabase-client';
import {useEffect,useState} from 'react';
import type {Access} from './database.types';
import {client,logout,readAccess} from './supabase-client';
export function useAccess(){
 const [access,setAccess]=useState<Access|null>(null);const[loading,setLoading]=useState(true);const[message,setMessage]=useState('');
 useEffect(()=>{let alive=true;let running=false;
  const refresh=async()=>{if(running)return;running=true;try{const{data}=await client.auth.getSession();if(!data.session){if(alive)setAccess(null);return;}const next=await readAccess();if(alive){setAccess(next);setMessage('');}}catch{if(alive){setAccess(null);setMessage('Quyền truy cập đã thay đổi. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.');}await logout();}finally{running=false;if(alive)setLoading(false);}};
  const ended=()=>{if(alive)setAccess(null);};const changed=client.auth.onAuthStateChange(()=>{setTimeout(()=>{void refresh();},0);});
  void refresh();const interval=setInterval(()=>{void refresh();},15000);
  window.addEventListener('focus',refresh);window.addEventListener('volume-session-ended',ended);
  return()=>{alive=false;clearInterval(interval);changed.data.subscription.unsubscribe();window.removeEventListener('focus',refresh);window.removeEventListener('volume-session-ended',ended);};
 },[]);
 return{access,loading,message};
}
export function errorMessage(e:unknown){return e instanceof Error?e.message:'Có lỗi xảy ra. Vui lòng thử lại.';}
