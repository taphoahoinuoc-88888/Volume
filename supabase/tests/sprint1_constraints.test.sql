begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(10);

insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');

select is((select count(*)::int from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name in ('profiles','venues','staff_memberships','audit_events')),4,'Exactly four foundation business tables');
select throws_ok($$update public.profiles set role='HR' where id='30000000-0000-0000-0000-000000000006'$$,'23514',null,'Unknown role rejects');
select throws_ok($$update public.profiles set account_status='UNKNOWN' where id='30000000-0000-0000-0000-000000000006'$$,'23514',null,'Unknown account state rejects');
select throws_ok($$insert into public.staff_memberships(profile_id,venue_id) values('30000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001')$$,'23505',null,'Duplicate membership rejects');
select throws_ok($$update public.staff_memberships set extra_permissions=array['UNKNOWN']$$,'23514',null,'Unknown extra rejects');
select throws_ok($$update public.staff_memberships set extra_permissions=array['STAFF_DIRECTORY_READ','STAFF_DIRECTORY_READ']$$,'23514',null,'Duplicate extra rejects');
select throws_ok($$insert into public.venues(code,name,timezone) values('BAD','Bad','Invalid/Timezone')$$,'P0001','INVALID_TIMEZONE','Timezone must exist');
select throws_ok($$update public.profiles set version=0$$,'23514',null,'Positive version constraint');
select throws_ok($$insert into public.staff_memberships(profile_id,venue_id,status) values('30000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000001','ACTIVE')$$,'P0001','INELIGIBLE_MEMBERSHIP','USER cannot receive active membership');
select throws_ok($$insert into public.staff_memberships(profile_id,venue_id,status) values('30000000-0000-0000-0000-000000000005','ffffffff-ffff-ffff-ffff-ffffffffffff','ACTIVE')$$,'23503',null,'FK rejects');

select * from finish();
rollback;
