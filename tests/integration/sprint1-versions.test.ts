import {beforeAll,afterAll,test,expect} from 'vitest';
import {fixture,allowed,denied,type Fixture} from './fixtures/auth';
let f:Fixture;beforeAll(async()=>{f=await fixture();});afterAll(async()=>{await f?.close();});
test('API08/11: bigint CAS; missing/stale/time token and direct version manipulation rejected',async()=>{
 const name=f.users.user1;const old=(await f.db.query('select updated_at from public.profiles where id=$1',[name.id])).rows[0].updated_at;
 allowed(await f.rpc('user1','update_own_profile',{p_display_name:'Changed',expected_version:'1'}));expect(await f.version('user1')).toBe('2');
 await f.db.query('update public.profiles set updated_at=$2 where id=$1',[name.id,old]);
 const stale=await f.rpc('user1','update_own_profile',{p_display_name:'Changed',expected_version:'1'});denied(stale);expect(stale.data.message).toContain('VERSION_CONFLICT');
 denied(await f.rpc('user1','update_own_profile',{p_display_name:'Changed',expected_version:null}));denied(await f.rpc('user1','update_own_profile',{p_display_name:'Changed'}));denied(await f.rpc('user1','update_own_profile',{p_display_name:'Changed',expected_version:old}));
 const no=await f.rpc('user1','update_own_profile',{p_display_name:'Changed',expected_version:'2'});allowed(no);expect(no.data).toEqual({status:'NO_CHANGE',version:'2'});
 denied(await f.direct('user1',`profiles?id=eq.${name.id}`,'PATCH',{version:1}));expect(await f.version('user1')).toBe('2');
});
test('API11: exact bigint roundtrip beyond JS safe integer and overflow rollback',async()=>{
 await f.db.query('update public.profiles set version=9007199254740993 where id=$1',[f.users.user2.id]);
 const a=await f.rpc('user2','current_access');allowed(a);expect(a.data.profile.version).toBe('9007199254740993');
 allowed(await f.rpc('user2','update_own_profile',{p_display_name:'Bigint',expected_version:'9007199254740993'}));expect(await f.version('user2')).toBe('9007199254740994');
 await f.db.query('update public.profiles set version=9223372036854775807 where id=$1',[f.users.user2.id]);denied(await f.rpc('user2','update_own_profile',{p_display_name:'Overflow',expected_version:'9223372036854775807'}));expect(await f.version('user2')).toBe('9223372036854775807');expect((await f.db.query('select display_name from public.profiles where id=$1',[f.users.user2.id])).rows[0].display_name).toBe('Bigint');
});
test('API08/12: multirow stale version/constraint/no-op/audit atomicity',async()=>{
 const m=await f.membership('staffA');const before=(await f.db.query('select count(*)::int n from public.audit_events')).rows[0].n;
 const changes=[{id:m.id,venue_id:f.B,status:'ACTIVE',extra_permissions:[],expected_version:'0'}];denied(await f.changeRole('staffA','MANAGER','admin1',changes));expect(await f.version('staffA')).toBe('1');expect((await f.membership('staffA')).version).toBe('1');
 const no=await f.changeRole('staffA','STAFF','admin1',[{...changes[0],venue_id:f.A,expected_version:'1'}]);allowed(no);expect(no.data.status).toBe('NO_CHANGE');expect((await f.db.query('select count(*)::int n from public.audit_events')).rows[0].n).toBe(before);
 denied(await f.changeRole('staffA','STAFF','admin1',[{...changes[0],venue_id:'ffffffff-ffff-ffff-ffff-ffffffffffff',expected_version:'1'}]));expect(await f.version('staffA')).toBe('1');
 allowed(await f.changeRole('staffA','MANAGER','admin1',[{...changes[0],expected_version:'1'}]));expect(await f.version('staffA')).toBe('2');expect((await f.membership('staffA',f.B)).version).toBe('2');
 const audits=(await f.db.query('select * from public.audit_events where target_id in ($1,$2)',[f.users.staffA.id,m.id])).rows;expect(audits).toHaveLength(2);for(const a of audits){expect(a.actor_id).toBe(f.users.admin1.id);expect(a.actor_role).toBe('ADMIN');expect(a.after_data.version).toBe('2');expect(a.after_data.sessions_revoked_before).toBeUndefined();}
});
test('API12: injected audit failure rolls back data, version, cutoff and success audit',async()=>{
 const before=(await f.db.query('select count(*)::int n from public.audit_events')).rows[0].n;
 await f.db.query("create function private.test_audit_fault() returns trigger language plpgsql as $$ begin raise exception 'INJECTED_AUDIT_FAILURE'; end $$; create trigger test_audit_fault before insert on public.audit_events for each row execute function private.test_audit_fault()");
 try {const r=await f.changeRole('user1','CEO');denied(r);expect(r.data.message).toContain('INJECTED_AUDIT_FAILURE');const p=(await f.db.query('select role,version,sessions_revoked_before from public.profiles where id=$1',[f.users.user1.id])).rows[0];expect(p).toEqual({role:'USER',version:'2',sessions_revoked_before:null});denied(await f.venue('admin1'));expect((await f.db.query('select version from public.venues where id=$1',[f.A])).rows[0].version).toBe('1');expect((await f.db.query('select count(*)::int n from public.audit_events')).rows[0].n).toBe(before);}finally{await f.db.query('drop trigger test_audit_fault on public.audit_events;drop function private.test_audit_fault()');}
});
