begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(3);

insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');

update public.profiles set role='CEO' where id='30000000-0000-0000-0000-000000000002';
select throws_ok($$select private.protect_last_admin(p,'USER','ACTIVE') from public.profiles p where id='30000000-0000-0000-0000-000000000001'$$,'P0001','LAST_ACTIVE_ADMIN','Last Admin demotion invariant');
select throws_ok($$select private.protect_last_admin(p,'ADMIN','DISABLED') from public.profiles p where id='30000000-0000-0000-0000-000000000001'$$,'P0001','LAST_ACTIVE_ADMIN','Last Admin disable invariant');
select ok((select not rolbypassrls and not rolsuper and not rolcanlogin from pg_roles where rolname='volume_core'),'Core owner minimum privileges');
-- Actual independent-connection races execute in sprint1-concurrency.test.ts.

select * from finish();
rollback;
