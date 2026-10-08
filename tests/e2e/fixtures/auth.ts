import {test as base,expect,type Page,type Request} from '@playwright/test';
import {fixture,type Fixture} from '../../integration/fixtures/auth';
export type {Fixture};
export const customer='http://127.0.0.1:3000',control='http://127.0.0.1:3001';
export const test=base.extend<{reset:void;diagnostics:void}, {volume:Fixture}>({volume:[async({},use)=>{const volume=await fixture();await use(volume);await volume.close();},{scope:'worker'}],reset:[async({volume},use)=>{await resetData(volume);await use();},{auto:true}],diagnostics:[async({page},use,info)=>{
 const events:object[]=[];const started=Date.now();const record=(event:object)=>events.push({ms:Date.now()-started,...event});
 const path=(url:string)=>{try{return new URL(url).pathname;}catch{return 'unavailable';}};
 page.on('request',r=>{if(r.isNavigationRequest())record({event:'navigation-request',path:path(r.url()),method:r.method()});});
 page.on('response',r=>{const p=path(r.url());if(r.request().isNavigationRequest()||p.startsWith('/auth/v1/')||p.startsWith('/rest/v1/'))record({event:'response',path:p,status:r.status()});});
 page.on('requestfailed',r=>{const error=r.failure()?.errorText||'';record({event:'request-failed',path:path(r.url()),navigation:r.isNavigationRequest(),kind:/internal error/i.test(error)?'internal':/abort|cancel/i.test(error)?'aborted':/timeout/i.test(error)?'timeout':'other'});});
 page.on('pageerror',e=>record({event:'pageerror',error:e.name}));
 page.on('crash',()=>record({event:'crash'}));
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())record({event:'navigation-commit',path:path(frame.url())});});
 page.on('domcontentloaded',()=>record({event:'domcontentloaded',path:path(page.url())}));
 page.on('load',()=>record({event:'load',path:path(page.url())}));
 try{await use();}finally{if(info.status!==info.expectedStatus)await info.attach('http-statuses',{body:Buffer.from(JSON.stringify(events)),contentType:'application/json'});}
},{auto:true}]});
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
 // A load event does not finish React's Auth/RPC requests. Let the previous
 // document finish those bodies before a hard navigation cancels them in WebKit.
 const pending=new Set<Request>();
 const started=(r:Request)=>{const u=new URL(r.url());if(u.pathname.startsWith('/auth/v1/')||u.pathname.startsWith('/rest/v1/'))pending.add(r);};
 const finished=(r:Request)=>{pending.delete(r);};
 // Redirects retire the old document; only its successor's requests can be drained.
 const committed=(frame:ReturnType<Page['mainFrame']>)=>{if(frame===page.mainFrame())pending.clear();};
 page.on('request',started);page.on('requestfinished',finished);page.on('requestfailed',finished);page.on('framenavigated',committed);
 try{
 await page.goto(origin+'/login');await expect(page.getByLabel('Email',{exact:true})).toBeVisible();await expect.poll(()=>pending.size,{message:'Previous login document Auth/RPC bodies must settle before reload'}).toBe(0);await page.evaluate(()=>localStorage.clear());await page.goto(origin+'/login');
 await page.getByLabel('Email',{exact:true}).fill(f.users[name].email);await page.getByLabel('Mật khẩu',{exact:true}).fill(f.users[name].password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 if(name==='disabled'){await expect(page.getByRole('status')).toContainText('Quyền truy cập');return;}
 await page.waitForURL(origin+(surface==='customer'?'/profile':'/overview'));
 if(surface==='customer')await expect(page.getByRole('heading',{name:'Xin chào,'+ ' '+name})).toBeVisible();
 else if(name.startsWith('user'))await expect(page.getByRole('heading',{name:'Đây là khu vực nhân sự'})).toBeVisible();
 else await expect(page.getByRole('heading',{name:'Xin chào,'+' '+name})).toBeVisible();
 await page.waitForLoadState('load');
 await expect.poll(()=>pending.size,{message:'Authenticated document Auth/RPC bodies must settle before the next navigation'}).toBe(0);
 }finally{page.off('request',started);page.off('requestfinished',finished);page.off('requestfailed',finished);page.off('framenavigated',committed);}
}

