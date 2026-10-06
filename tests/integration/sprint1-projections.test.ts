import {beforeAll,afterAll,test,expect} from 'vitest';
import {fixture,allowed,denied,type Fixture} from './fixtures/auth';
let f:Fixture;beforeAll(async()=>{f=await fixture();});afterAll(async()=>{await f?.close();});
test('READ01: Admin account without membership; exact safe fields/status and real CAS',async()=>{
 const r=await f.rpc('admin1','account_access',{p_profile_id:f.users.user1.id});allowed(r);
 expect(r.data).toHaveLength(1);const p=r.data[0];
 expect(Object.keys(p).sort()).toEqual(['account_status','display_name','id','memberships','role','version']);
 expect(p).toMatchObject({id:f.users.user1.id,role:'USER',account_status:'ACTIVE',version:'1',memberships:[]});
 const list=await f.rpc('admin1','account_access');allowed(list);expect(list.data.map((p:any)=>p.id)).toContain(f.users.ceo.id);
 const disabled=await f.rpc('admin1','account_access',{p_profile_id:f.users.disabled.id});allowed(disabled);expect(disabled.data[0].account_status).toBe('DISABLED');
 const before=await f.rpc('admin1','account_access',{p_profile_id:f.users.user2.id});allowed(before);
 allowed(await f.rpc('admin1','set_account_status',{p_profile_id:before.data[0].id,expected_version:before.data[0].version,p_status:'DISABLED',p_reason:'Account read projection confirms CAS'}));
 const after=await f.rpc('admin1','account_access',{p_profile_id:f.users.user2.id});allowed(after);expect(after.data[0]).toMatchObject({account_status:'DISABLED',version:'2'});
 denied(await f.rpc('user2','account_access'));denied(await f.rpc('user2','current_access'));
});
test('READ02: non-Admin/anon cannot read account directory; self RLS and Auth boundary unchanged',async()=>{
 for(const name of ['ceo','managerA','staffA','hrA','user1','disabled',undefined]) denied(await f.rpc(name,'account_access',{p_profile_id:f.users.user1.id}));
 const direct=await f.direct('admin1',`profiles?id=eq.${f.users.user1.id}&select=id,account_status,version`);allowed(direct);expect(direct.data).toEqual([]);
 denied(await f.direct('admin1','profiles?select=sessions_revoked_before'));
 const all=await f.rpc('admin1','account_access');expect(JSON.stringify(all.data)).not.toMatch(/sessions_revoked_before|created_at|updated_at|@example|session_id|refresh_token/);
});
test('READ03: status-only HR sees only actionable STAFF in own venue; no directory/extra/private data',async()=>{
 await f.db.query("update public.staff_memberships set extra_permissions=array['STAFF_MEMBERSHIP_STATUS_MANAGE'] where profile_id=$1",[f.users.hrA.id]);
 denied(await f.rpc('hrA','staff_directory',{p_venue:f.A}));
 const r=await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A});allowed(r);
 expect(r.data.map((p:any)=>p.profile_id).sort()).toEqual([f.users.staffA.id,f.users.inactive.id].sort());
 for(const p of r.data) expect(Object.keys(p).sort()).toEqual(['account_status','display_name','membership_id','profile_id','profile_version','role','status','venue_id','version']);
 expect(r.data.find((p:any)=>p.profile_id===f.users.inactive.id).status).toBe('INACTIVE');
 await f.db.query("update public.profiles set account_status='DISABLED' where id=$1",[f.users.staffA.id]);
 const target=(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A})).data.find((p:any)=>p.profile_id===f.users.staffA.id);
 expect(target.account_status).toBe('DISABLED');
 allowed(await f.rpc('hrA','set_staff_membership_status',{p_id:target.membership_id,expected_version:target.version,expected_profile_version:target.profile_version,p_status:'INACTIVE',p_reason:'HR projection supplies both CAS versions'}));
 const after=(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A})).data.find((p:any)=>p.profile_id===target.profile_id);
 expect(after).toMatchObject({account_status:'DISABLED',status:'INACTIVE',version:'2',profile_version:'2'});
 denied(await f.rpc('hrA','set_staff_membership_status',{p_id:target.membership_id,expected_version:target.version,expected_profile_version:target.profile_version,p_status:'ACTIVE',p_reason:'Stale projection must fail'}));
});
test('READ04: cross-role/cross-venue/inactive membership denies; directory-only is not mutation permission',async()=>{
 for(const name of ['admin1','ceo','managerA','managerB','staffA','staffB','user1','disabled','inactive',undefined]) denied(await f.rpc(name,'membership_mutation_targets',{p_venue:f.A}));
 denied(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.B}));
 await f.db.query("update public.staff_memberships set extra_permissions=array['STAFF_DIRECTORY_READ'] where profile_id=$1",[f.users.hrA.id]);
 allowed(await f.rpc('hrA','staff_directory',{p_venue:f.A}));denied(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A}));
});
test('READ05: live cutoff invalidates new read paths; refresh old session denies; re-login restores current rights',async()=>{
 const old={...f.users.admin2};allowed(await f.account('admin2','DISABLED'));denied(await f.rpc('admin2','account_access'));
 const refreshed=await f.auth('token?grant_type=refresh_token',{refresh_token:old.refresh});
 if(refreshed.status===200){f.users.admin2.token=refreshed.data.access_token;denied(await f.rpc('admin2','account_access'));}
 allowed(await f.account('admin2','ACTIVE'));f.users.admin2.token=old.token;denied(await f.rpc('admin2','account_access'));
 await f.login('admin2');allowed(await f.rpc('admin2','account_access'));
 const m=await f.membership('hrA');allowed(await f.changeRole('hrA','STAFF','admin1',[{id:m.id,venue_id:f.A,status:'ACTIVE',extra_permissions:['STAFF_MEMBERSHIP_STATUS_MANAGE'],expected_version:m.version}]));
 denied(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A}));await f.login('hrA');allowed(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A}));
 const current=await f.membership('hrA');allowed(await f.changeRole('hrA','STAFF','admin1',[{id:current.id,venue_id:f.A,status:'INACTIVE',extra_permissions:[],expected_version:current.version}]));
 denied(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A}));await f.login('hrA');denied(await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A}));
});
