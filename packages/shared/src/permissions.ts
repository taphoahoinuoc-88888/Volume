import type {Access,Role} from './database.types';
export const roleLabels:Record<Role,string>={ADMIN:'Quản trị hệ thống',CEO:'Ban điều hành',MANAGER:'Quản lý chi nhánh',STAFF:'Nhân viên',USER:'Khách hàng'};
export const extraLabels:Record<string,string>={SHOP_MANAGE:'Quản lý sản phẩm, kho và đơn hàng',RANK_MANAGE:'Xác nhận hạng cơ thủ',FEEDBACK_MANAGE:'Xử lý phản ánh dịch vụ',STAFF_DIRECTORY_READ:'Xem danh sách nhân sự',STAFF_MEMBERSHIP_STATUS_MANAGE:'Đổi trạng thái làm việc của nhân viên'};
export const accountLabel=(status:string)=>status==='ACTIVE'?'Được sử dụng':'Tài khoản bị khóa';
export const membershipLabel=(status:string)=>status==='ACTIVE'?'Đang làm việc':'Ngừng tại chi nhánh';
export function hasExtra(a:Access,permission:string,venue?:string){return a.memberships.some(m=>m.status==='ACTIVE'&&(!venue||m.venue_id===venue)&&m.extra_permissions.includes(permission));}
export function can(a:Access|null,resource:string,action='list',venue?:string):boolean{
 if(!a||a.profile.account_status!=='ACTIVE'||a.profile.role==='USER')return false;
 if(venue&&!a.venues.some(v=>v.id===venue))return false;
 const read=action==='list'||action==='show';
 if(resource==='overview')return read;
 if(resource==='venues')return read||(['create','edit','update'].includes(action)&&a.profile.role==='ADMIN');
 if(resource==='audit')return read&&['ADMIN','CEO','MANAGER'].includes(a.profile.role);
 if(resource==='people'){
  if(!read)return ['edit','update'].includes(action)&&(a.profile.role==='ADMIN'||hasExtra(a,'STAFF_MEMBERSHIP_STATUS_MANAGE',venue));
  return ['ADMIN','CEO','MANAGER'].includes(a.profile.role)||hasExtra(a,'STAFF_DIRECTORY_READ',venue)||hasExtra(a,'STAFF_MEMBERSHIP_STATUS_MANAGE',venue);
 }
 return false;
}
export const nav=[{resource:'overview',path:'/overview',label:'Tổng quan'},{resource:'venues',path:'/venues',label:'Chi nhánh'},{resource:'people',path:'/people',label:'Nhân sự & truy cập'},{resource:'audit',path:'/audit',label:'Nhật ký'}];
export const actionLabels:Record<string,string>={ROLE_CHANGED:'Đổi vai trò',MEMBERSHIP_CREATED:'Phân công chi nhánh',MEMBERSHIP_UPDATED:'Đổi phân công',MEMBERSHIP_STATUS_CHANGED:'Đổi trạng thái làm việc',ACCOUNT_STATUS_CHANGED:'Đổi trạng thái tài khoản',SESSIONS_REVOKED:'Đăng xuất các phiên',VENUE_CREATED:'Thêm chi nhánh',VENUE_UPDATED:'Cập nhật chi nhánh',BOOTSTRAP_ADMIN_CREATED:'Thiết lập quản trị',AUTH_ACCOUNT_PROVISIONED:'Tạo tài khoản',AUTH_PROVISION_RECONCILED:'Kiểm tra tài khoản'};

