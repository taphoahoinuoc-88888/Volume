import {beforeAll,afterAll,test,expect} from 'vitest';
import {fixture,allowed,denied,type Fixture} from './fixtures/auth';
let f:Fixture;beforeAll(async()=>{f=await fixture();});afterAll(async()=>{await f?.close();});
test('API07/12: concurrent same-version CAS has exactly one mutation/audit',async()=>{
 const results=await Promise.all([f.venue('admin1','Concurrent A'),f.venue('admin2','Concurrent B')]);expect(results.filter(r=>r.status===200)).toHaveLength(1);expect(results.find(r=>r.status!==200)?.data.message).toContain('VERSION_CONFLICT');expect((await f.db.query('select version from public.venues where id=$1',[f.A])).rows[0].version).toBe('2');expect((await f.db.query("select count(*)::int n from public.audit_events where action='VENUE_UPDATED'")).rows[0].n).toBe(1);
});
test('API07: two parallel Admin demotions cannot remove last active Admin',async()=>{
 const results=await Promise.all([f.changeRole('admin2','CEO','admin1'),f.changeRole('admin1','CEO','admin2')]);expect(results.filter(r=>r.status===200)).toHaveLength(1);expect((await f.db.query("select count(*)::int n from public.profiles where role='ADMIN' and account_status='ACTIVE'")).rows[0].n).toBe(1);
 const current=(await f.db.query("select id from public.profiles where role='ADMIN' and account_status='ACTIVE'")).rows[0].id;const actor=Object.keys(f.users).find(k=>f.users[k].id===current)!;denied(await f.account(actor,'DISABLED',actor));denied(await f.changeRole(actor,'USER',actor));
});
test('API07: locked authority recheck rejects mutation after concurrent caller disable',async()=>{
 // Local operator restores second Admin solely to construct a deterministic race.
 await f.db.query("update public.profiles set role='ADMIN',account_status='ACTIVE',sessions_revoked_before=null,version=1 where id in ($1,$2)",[f.users.admin1.id,f.users.admin2.id]);await f.login('admin1');await f.login('admin2');
 const holder=await f.db.connect();await holder.query('begin');await holder.query('select pg_advisory_xact_lock(20261006,1)');
 const waiting=f.venue('admin2','Must not persist','2');
 await holder.query("update public.profiles set account_status='DISABLED',version=version+1,sessions_revoked_before=clock_timestamp() where id=$1",[f.users.admin2.id]);await holder.query('commit');holder.release();
 const r=await waiting;denied(r);expect(r.data.message).toContain('ACCESS_DENIED');expect((await f.db.query('select name from public.venues where id=$1',[f.A])).rows[0].name).not.toBe('Must not persist');
});
test('API07: two parallel account disables preserve an active Admin',async()=>{
 await f.db.query("update public.profiles set role='ADMIN',account_status='ACTIVE',sessions_revoked_before=null,version=1 where id in ($1,$2)",[f.users.admin1.id,f.users.admin2.id]);await f.login('admin1');await f.login('admin2');
 const r=await Promise.all([f.account('admin1','DISABLED','admin2'),f.account('admin2','DISABLED','admin1')]);expect(r.filter(x=>x.status===200)).toHaveLength(1);expect((await f.db.query("select count(*)::int n from public.profiles where role='ADMIN' and account_status='ACTIVE'")).rows[0].n).toBe(1);
});
