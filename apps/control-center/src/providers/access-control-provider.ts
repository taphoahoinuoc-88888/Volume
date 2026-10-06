import type {AccessControlProvider} from '@refinedev/core';
import {can,readAccess} from '@volume/shared';
export const accessControlProvider:AccessControlProvider={can:async({resource,action,params})=>{try{return{can:can(await readAccess(),resource||'',action,params?.venue),reason:'Bạn không có quyền xem phần này.'};}catch{return{can:false,reason:'Vui lòng đăng nhập lại.'};}}};
