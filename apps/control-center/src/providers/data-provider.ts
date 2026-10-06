import type {DataProvider,BaseRecord,GetListParams,GetListResponse} from '@refinedev/core';
import {rpc,readAccess,hasExtra,can,type Account,type StaffRow,type AuditRow} from '@volume/shared';
async function list({resource,meta}:GetListParams):Promise<BaseRecord[]>{
 const a=await readAccess();const venue=meta?.venue as string|undefined;
 if(!can(a,resource,'list',venue))throw new Error('Bạn không có quyền xem phần này.');
 if(resource==='venues')return a.venues;
 if(resource==='people'){
  if(a.profile.role==='ADMIN')return rpc<Account[]>('account_access');
  if(!venue)return[];
  const status=hasExtra(a,'STAFF_MEMBERSHIP_STATUS_MANAGE',venue);
  const directory=a.profile.role==='CEO'||a.profile.role==='MANAGER'||hasExtra(a,'STAFF_DIRECTORY_READ',venue);
  const targets=status?await rpc<StaffRow[]>('membership_mutation_targets',{p_venue:venue}):[];
  const rows=directory?await rpc<StaffRow[]>('staff_directory',{p_venue:venue}):targets;
  return rows.map(p=>({...p,...targets.find(t=>t.membership_id===p.membership_id),id:p.membership_id}));
 }
 if(resource==='audit')return rpc<AuditRow[]>('audit_feed',{p_venue:venue||null});
 throw new Error('Phần này chưa có.');
}
export const dataProvider:DataProvider={
 getList:async<TData extends BaseRecord=BaseRecord>(params:GetListParams):Promise<GetListResponse<TData>>=>{const data=await list(params);return{data:data as TData[],total:data.length};},
 getOne:async({resource,id,meta})=>{const data=(await list({resource,meta})).find(p=>p.id===id);if(!data)throw new Error('Không tìm thấy dữ liệu.');return{data:data as never};},
 create:async()=>{throw new Error('Hãy dùng xác nhận thay đổi.');},
 update:async()=>{throw new Error('Hãy dùng xác nhận thay đổi.');},
 deleteOne:async()=>{throw new Error('Không hỗ trợ xóa dữ liệu.');},
 getApiUrl:()=>import.meta.env.VITE_SUPABASE_URL||'http://127.0.0.1:54321',
};
