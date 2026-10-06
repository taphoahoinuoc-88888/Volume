begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(4);

insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');

insert into auth.users(id,email,raw_user_meta_data) values('30000000-0000-0000-0000-000000000010','forge@example.test','{"role":"ADMIN","account_status":"DISABLED","version":999}');
select is((select role from public.profiles where id='30000000-0000-0000-0000-000000000010'),'USER','Metadata ignored');
select is((select account_status from public.profiles where id='30000000-0000-0000-0000-000000000010'),'ACTIVE','Default active');
select is((select version::text from public.profiles where id='30000000-0000-0000-0000-000000000010'),'1','Bootstrap version1');
select is((select count(*)::int from public.profiles where id='30000000-0000-0000-0000-000000000010'),1,'Single business identity');

select * from finish();
rollback;
