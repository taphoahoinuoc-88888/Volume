import {test as base,expect,type Page} from '@playwright/test';
import {fixture,type Fixture} from '../../integration/fixtures/auth';
export type {Fixture};
export const customer='http://127.0.0.1:3000',control='http://127.0.0.1:3001';
export const test=base.extend<{reset:void}, {volume:Fixture}>({volume:[async({},use)=>{const volume=await fixture();await use(volume);await volume.close();},{scope:'worker'}],reset:[async({volume},use)=>{await resetData(volume);await use();},{auto:true}]});
const roles:Record<string,string>={admin1:'ADMIN',admin2:'ADMIN',ceo:'CEO',managerA:'MANAGER',managerB:'MANAGER',managerAB:'MANAGER',staffA:'STAFF',staffB:'STAFF',hrA:'STAFF',user1:'USER',user2:'USER',disabled:'USER',inactive:'STAFF'};
async function resetData(f:Fixture){
 await f.db.query('truncate public.audit_events,public.staff_memberships');
 for(const[name,role]of Object.entries(roles))await f.db.query('update public.profiles set role=$2,display_name=$3,account_status=$4,version=1,sessions_revoked_before=null where id=$1',[f.users[name].id,role,name,name==='disabled'?'DISABLED':'ACTIVE']);
 await f.db.query("update public.venues set version=1,name=case code when 'A' then 'Venue A' when 'B' then 'Venue B' else name end,is_enabled=code<>'DISABLED',is_public=code='A'");
 for(const[name,venues]of Object.entries({managerA:[f.A],managerB:[f.B],managerAB:[f.A,f.B],staffA:[f.A],staffB:[f.B],hrA:[f.A],inactive:[f.A]}))for(const venue of venues)await f.db.query('insert into public.staff_memberships(profile_id,venue_id,status,extra_permissions) values($1,$2,$3,$4)',[f.users[name].id,venue,name==='inactive'?'INACTIVE':'ACTIVE',name==='hrA'?['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE']:[]]);
}
export {expect};
export async function login(page:Page,f:Fixture,name:string,surface='control'){
 const origin=surface==='customer'?customer:control;
 await page.goto(origin+'/login');await page.evaluate(()=>localStorage.clear());await page.goto(origin+'/login');
 await page.getByLabel('Email',{exact:true}).fill(f.users[name].email);await page.getByLabel('Mật khẩu',{exact:true}).fill(f.users[name].password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 if(name==='disabled'){await expect(page.getByRole('status')).toContainText('Quyền truy cập');return;}
 if(surface==='customer')await expect(page.getByRole('heading',{name:'Xin chào,'+ ' '+name})).toBeVisible();
 else if(name.startsWith('user'))await expect(page.getByRole('heading',{name:'Đây là khu vực nhân sự'})).toBeVisible();
 else await expect(page.getByRole('heading',{name:'Xin chào,'+' '+name})).toBeVisible();
}

