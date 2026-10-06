import {useState} from 'react';
import {client,readAccess,logout,errorMessage} from '@volume/shared';
export default function AuthPage({notice=''}:{notice?:string}){
 const recovery=window.location.pathname==='/recovery';const[forgot,setForgot]=useState(false);const[email,setEmail]=useState('');const[password,setPassword]=useState('');const[busy,setBusy]=useState(false);const[message,setMessage]=useState(notice);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
  if(recovery){const{error}=await client.auth.updateUser({password});if(error)throw new Error('Không thể đổi mật khẩu. Hãy yêu cầu email khôi phục mới.');await logout();window.location.assign('/login');return;}
  if(forgot){const redirect=(import.meta.env.VITE_CUSTOMER_URL||window.location.origin)+'/recovery';const{error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect});if(error)throw new Error('Chưa thể gửi email. Vui lòng thử lại.');setMessage('Nếu email đã có tài khoản, bạn sẽ nhận được hướng dẫn khôi phục.');return;}
  const{error}=await client.auth.signInWithPassword({email,password});if(error)throw new Error('Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.');
  await readAccess();window.location.assign('/profile');
 }catch(e){setMessage(errorMessage(e));}finally{setBusy(false);}}
 return <main className="auth-card"><p className="brand">VOLUME</p><h1>{recovery?'Đặt mật khẩu mới':forgot?'Khôi phục mật khẩu':'Đăng nhập'}</h1><p>{recovery?'Chọn mật khẩu mới cho tài khoản của bạn.':forgot?'Nhập email bạn dùng để đăng nhập.':'Chỉ cần email và mật khẩu của bạn.'}</p>
 <form onSubmit={submit}>{!recovery&&<label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}{(!forgot||recovery)&&<label>{recovery?'Mật khẩu mới':'Mật khẩu'}<input type="password" autoComplete={recovery?'new-password':'current-password'} required minLength={recovery?12:undefined} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
 {recovery&&<p className="muted">Ít nhất 12 ký tự.</p>}<button disabled={busy}>{busy?'Đang xử lý…':recovery?'Lưu mật khẩu mới':forgot?'Gửi email khôi phục':'Đăng nhập'}</button></form>
 <p role="status">{message}</p>{!recovery&&<button className="secondary" onClick={()=>{setForgot(!forgot);setMessage('');}}>{forgot?'Trở lại đăng nhập':'Quên mật khẩu?'}</button>}</main>;
}

