import {beforeAll,afterAll,test,expect} from 'vitest';
import {fixture,allowed,denied,type Fixture} from './fixtures/auth';
let f:Fixture; beforeAll(async()=>{f=await fixture();});afterAll(async()=>{await f?.close();});
test('API01/02/03: real five-role Auth, defaults, USER/RLS and public isolation',async()=>{
 for(const u of Object.values(f.users)) expect(u.session).toMatch(/^[a-f0-9-]{36}$/);
 const pub=await f.rpc(undefined,'public_venues');allowed(pub);expect(pub.data.map((v:any)=>v.code)).toEqual(['A']);expect(Object.keys(pub.data[0]).sort()).toEqual(['code','id','name','public_address','timezone']);
 denied(await f.rpc(undefined,'current_access'));
 const own=await f.direct('user1','profiles?select=id,display_name,role,account_status,version');allowed(own);expect(own.data.map((p:any)=>p.id)).toEqual([f.users.user1.id]);
 expect((await f.direct('user1',`profiles?select=id&id=eq.${f.users.user2.id}`)).data).toEqual([]);
 denied(await f.direct('user1','profiles?select=*'));
 denied(await f.direct('user1',`profiles?id=eq.${f.users.user1.id}`,'PATCH',{role:'ADMIN',version:999}));
 denied(await f.direct('user1','staff_memberships','POST',{profile_id:f.users.user1.id,venue_id:f.A,extra_permissions:['ACCESS_MANAGE']}));
 denied(await f.direct(undefined,'profiles?select=id'));denied(await f.direct('user1','users?select=*'));
 const saved=f.users.user1.token;f.users.user1.token='fabricated';denied(await f.rpc('user1','current_access'));f.users.user1.token=saved;
});
test('API02: exact scope/matrix/projection; Staff minimal, HR safe',async()=>{
 for(const [name,venues] of Object.entries({admin1:[f.A,f.B,'10000000-0000-0000-0000-000000000003'],ceo:[f.A,f.B,'10000000-0000-0000-0000-000000000003'],managerA:[f.A],managerB:[f.B],managerAB:[f.A,f.B],staffA:[f.A],user1:[],inactive:[]})){
  const r=await f.rpc(name,'current_access');allowed(r);expect(r.data.venues.map((v:any)=>v.id).sort()).toEqual(venues.sort());expect(r.data.profile.sessions_revoked_before).toBeUndefined();
 }
 const s=(await f.rpc('staffA','current_access')).data;expect(Object.keys(s.venues[0]).sort()).toEqual(['code','id','is_enabled','name','timezone']);
 for(const n of ['admin1','ceo','managerA','hrA']) {const r=await f.rpc(n,'staff_directory',{p_venue:f.A});allowed(r);expect(r.data.length).toBeGreaterThan(0);for(const p of r.data){expect(p.extra_permissions).toBeUndefined();expect(p.sessions_revoked_before).toBeUndefined();expect(p.email).toBeUndefined();}}
 for(const n of ['managerB','staffA','staffB','user1']) denied(await f.rpc(n,'staff_directory',{p_venue:f.A}));
 denied(await f.rpc('hrA','staff_directory',{p_venue:f.B}));
 expect((await f.rpc('staffA','membership_directory',{p_venue:f.A})).data.map((m:any)=>m.profile_id)).toEqual([f.users.staffA.id]);
 denied(await f.rpc('managerA','membership_directory',{p_venue:f.B}));denied(await f.rpc('disabled','current_access'));
});
test('API02/08/09: CEO/security/privilege writes and audit append-only DENY',async()=>{
 for(const n of ['ceo','managerA','staffA','user1']) {denied(await f.venue(n));denied(await f.changeRole('user2','ADMIN',n));denied(await f.account('user2','DISABLED',n));}
 for(const n of ['admin1','ceo','managerA','staffA','user1']) for(const method of ['POST','PATCH','DELETE']) denied(await f.direct(n,'audit_events',method,method==='DELETE'?undefined:{action:'ROLE_CHANGED'}));
 denied(await f.changeRole('admin1','CEO'));denied(await f.rpc('user1','update_own_profile',{p_display_name:'Name',expected_version:'1',actor_id:f.users.admin1.id,source:'SYSTEM'}));
 const m=await f.membership('staffA');const old=await f.version('staffA');
 denied(await f.changeRole('staffA','STAFF','admin1',[{id:m.id,venue_id:f.A,status:'ACTIVE',extra_permissions:['UNKNOWN'],expected_version:m.version}]));expect(await f.version('staffA')).toBe(old);
 denied(await f.changeRole('staffA','STAFF','admin1',[{id:m.id,venue_id:f.A,status:'ACTIVE',extra_permissions:['STAFF_DIRECTORY_READ','STAFF_DIRECTORY_READ'],expected_version:m.version}]));
});
test('API02: HR status scope/target restrictions and cutoff/version audit',async()=>{
 for(const n of ['hrA','managerA','staffB']){const m=await f.membership(n,n==='staffB'?f.B:f.A);denied(await f.rpc('hrA','set_staff_membership_status',{p_id:m.id,expected_version:m.version,expected_profile_version:await f.version(n),p_status:'INACTIVE',p_reason:'HR negative test'}));}
 const m=await f.membership('staffA');allowed(await f.rpc('hrA','set_staff_membership_status',{p_id:m.id,expected_version:m.version,expected_profile_version:await f.version('staffA'),p_status:'INACTIVE',p_reason:'HR positive test'}));
 expect(await f.version('staffA')).toBe('2');expect((await f.membership('staffA')).version).toBe('2');denied(await f.rpc('staffA','current_access'));await f.login('staffA');const a=await f.rpc('staffA','current_access');allowed(a);expect(a.data.venues).toEqual([]);
});
test('API02: BUSINESS audit scope and no SECURITY leak',async()=>{
 allowed(await f.venue('admin1'));for(const name of ['admin1','ceo','managerA']){const r=await f.rpc(name,'audit_feed',{p_venue:f.A});allowed(r);expect(r.data.some((a:any)=>a.action==='VENUE_UPDATED')).toBe(true);if(name!=='admin1')expect(r.data.every((a:any)=>a.category==='BUSINESS')).toBe(true);}
 denied(await f.rpc('managerB','audit_feed',{p_venue:f.A}));denied(await f.rpc('staffA','audit_feed',{p_venue:f.A}));denied(await f.rpc('user1','audit_feed'));
 expect((await f.rpc('ceo','audit_feed')).data.every((a:any)=>a.category==='BUSINESS')).toBe(true);
});
test('API06: provider failure, bootstrap-hook rollback, reconciliation defaults',async()=>{
 const before=(await f.db.query('select count(*)::int n from public.profiles')).rows[0].n;
 const bad=await f.auth('signup',{email:'not-an-email',password:'short'});expect(bad.status).toBeGreaterThanOrEqual(400);expect((await f.db.query('select count(*)::int n from public.profiles')).rows[0].n).toBe(before);
 await f.db.query("create function private.test_bootstrap_fault() returns trigger language plpgsql as $$ begin raise exception 'INJECTED_BOOTSTRAP_FAILURE'; end $$; create trigger test_bootstrap_fault before insert on public.profiles for each row execute function private.test_bootstrap_fault()");
 const email=`hook-${Date.now()}@example.test`;const password='Local-hook-test-password!';try{expect((await f.auth('signup',{email,password})).status).toBeGreaterThanOrEqual(400);expect((await f.db.query('select count(*)::int n from auth.users where email=$1',[email])).rows[0].n).toBe(0);}finally{await f.db.query('drop trigger test_bootstrap_fault on public.profiles;drop function private.test_bootstrap_fault()');}
 const good=await f.auth('signup',{email,password,data:{role:'ADMIN'}});expect(good.status).toBe(200);const id=good.data.user.id;expect((await f.db.query('select role,version from public.profiles where id=$1',[id])).rows[0]).toEqual({role:'USER',version:'1'});
 await f.auth('signup',{email,password});expect((await f.db.query('select count(*)::int n from public.profiles where id=$1',[id])).rows[0].n).toBe(1);
 await f.db.query("insert into public.audit_events(source,category,action,target_type,target_id,reason,after_data) values('SYSTEM','SECURITY','AUTH_PROVISION_RECONCILED','auth_user',$1,'Local operator verified bootstrap recovery',jsonb_build_object('id',$1::uuid))",[id]);
});
