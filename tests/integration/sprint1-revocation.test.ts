import {beforeAll,afterAll,test,expect} from 'vitest';
import {fixture,allowed,denied,type Fixture} from './fixtures/auth';
let f:Fixture;beforeAll(async()=>{f=await fixture();});afterAll(async()=>{await f?.close();});
async function oldRefresh(name:string,refresh:string){const r=await f.auth('token?grant_type=refresh_token',{refresh_token:refresh});if(r.status===200){f.users[name].token=r.data.access_token;denied(await f.rpc(name,'current_access'));}else expect(r.status).toBeGreaterThanOrEqual(400);}
test('API04/05: role cutoff, provider-revoke failure, old refresh denied, new login current authority',async()=>{
 const old={...f.users.user1};allowed(await f.changeRole('user1','CEO'));
 // Intentionally do not call provider signout: models provider outage after DB commit.
 denied(await f.rpc('user1','current_access'));await oldRefresh('user1',old.refresh);
 await f.login('user1');expect(f.users.user1.session).not.toBe(old.session);const r=await f.rpc('user1','current_access');allowed(r);expect(r.data.profile.role).toBe('CEO');
 const p=(await f.db.query('select sessions_revoked_before,version from public.profiles where id=$1',[old.id])).rows[0];expect(p.version).toBe('2');expect(p.sessions_revoked_before).toBeTruthy();
});
test('API04: scope/extra/membership revocation, unchanged account; role USER ignores old membership',async()=>{
 const m=await f.membership('staffB',f.B);const old={...f.users.staffB};
 allowed(await f.changeRole('staffB','STAFF','admin1',[{id:m.id,venue_id:f.B,status:'ACTIVE',extra_permissions:['STAFF_DIRECTORY_READ'],expected_version:m.version}]));
 denied(await f.rpc('staffB','current_access'));await oldRefresh('staffB',old.refresh);await f.login('staffB');allowed(await f.rpc('staffB','staff_directory',{p_venue:f.B}));
 const m2=await f.membership('staffB',f.B);allowed(await f.changeRole('staffB','USER','admin1',[{id:m2.id,venue_id:f.B,status:'INACTIVE',extra_permissions:[],expected_version:m2.version}]));denied(await f.rpc('staffB','current_access'));await f.login('staffB');const a=await f.rpc('staffB','current_access');allowed(a);expect(a.data.profile.account_status).toBe('ACTIVE');expect(a.data.venues).toEqual([]);denied(await f.rpc('staffB','staff_directory',{p_venue:f.B}));
});
test('API04: account disable/reactivate cannot resurrect old session',async()=>{
 const old={...f.users.user2};allowed(await f.account('user2','DISABLED'));denied(await f.rpc('user2','current_access'));allowed(await f.rpc('user2','public_venues'));await f.login('user2');denied(await f.rpc('user2','current_access'));
 allowed(await f.account('user2','ACTIVE'));f.users.user2.token=old.token;denied(await f.rpc('user2','current_access'));await oldRefresh('user2',old.refresh);await f.login('user2');allowed(await f.rpc('user2','current_access'));
});
test('API01/10: exact session boundary, missing and wrong-user sessions DENY',async()=>{
 const u=f.users.staffA;await f.db.query('update public.profiles set sessions_revoked_before=(select created_at from auth.sessions where id=$2) where id=$1',[u.id,u.session]);denied(await f.rpc('staffA','current_access'));await f.login('staffA');allowed(await f.rpc('staffA','current_access'));
 await f.db.query('update auth.sessions set user_id=$2 where id=$1',[u.session,f.users.user2.id]);denied(await f.rpc('staffA','current_access'));await f.db.query('update auth.sessions set user_id=$2 where id=$1',[u.session,u.id]);allowed(await f.rpc('staffA','current_access'));
 await f.db.query('delete from auth.sessions where id=$1',[u.session]);denied(await f.rpc('staffA','current_access'));
});
test('API04: own revoke atomically audits and denies current/refresh sessions',async()=>{
 const old={...f.users.user2};const v=await f.version('user2');allowed(await f.rpc('user2','revoke_own_sessions',{expected_version:v}));denied(await f.rpc('user2','current_access'));await oldRefresh('user2',old.refresh);await f.login('user2');allowed(await f.rpc('user2','current_access'));
 const a=(await f.db.query("select * from public.audit_events where action='SESSIONS_REVOKED' and actor_id=$1",[old.id])).rows;expect(a).toHaveLength(1);expect(a[0].source).toBe('CUSTOMER_WEB');expect(a[0].actor_role).toBe('USER');expect(a[0].after_data).toEqual({profile_id:old.id,revoked:true});
});

test('CONTRACT BLOCKER: administrative provider revocation by user id requires owner decision',async()=>{
 // This is an Auth Admin API compatibility probe, not an RLS allow/deny test.
 // Service-role credential exists only in this isolated server fixture process.
 const {execFileSync}=await import('node:child_process');
 const config=JSON.parse(execFileSync('supabase',['status','-o','json'],{encoding:'utf8'}));
 const secret=config.SERVICE_ROLE_KEY;
 expect(secret,'Server-only local Auth Admin credential required for compatibility probe').toBeTruthy();
 const r=await fetch(`${f.base}/auth/v1/admin/users/${f.users.user1.id}/sessions`,{method:'DELETE',headers:{apikey:f.anon,Authorization:`Bearer ${secret}`}});
 expect(r.status).toBe(404);
 throw new Error('BLOCKED: GoTrue v2.197.0 has no revoke-by-user-id Admin API. Supported global logout requires the target user JWT. Owner must resolve the frozen post-commit provider-revoke contract before 1A can freeze; DB cutoff is not silently substituted.');
});
