import type {AuthProvider} from '@refinedev/core';
import {client,readAccess,logout} from '@volume/shared';
export const authProvider:AuthProvider={
 login:async({email,password})=>{const{error}=await client.auth.signInWithPassword({email,password});if(error)return{success:false,error:new Error('Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.')};try{await readAccess();return{success:true};}catch{return{success:false,error:new Error('Quyền truy cập đã thay đổi. Vui lòng liên hệ quản trị viên.')};}},
 logout:async()=>{await logout();return{success:true};},
 check:async()=>{try{await readAccess();return{authenticated:true};}catch{return{authenticated:false,redirectTo:'/login'};}},
 getIdentity:async()=>(await readAccess()).profile,
 getPermissions:async()=>(await readAccess()).permissions,
 onError:async()=>({}),
};
