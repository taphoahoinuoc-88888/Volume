begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(15);
insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');


insert into public.billiard_tables(id,venue_id,code,label,hourly_price_vnd) values('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','A1','Bàn A1',100000),('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','A2','Bàn A2',100000),('40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','B1','Bàn B1',100000);
create temporary table scenario(n text primary key,j jsonb);
grant select,insert,update on scenario to authenticated;

select is((select count(*)::int from information_schema.tables where table_schema='public' and table_type='BASE TABLE'),8,'T65 exactly eight approved business tables');
select is((select count(*)::int from information_schema.columns where table_schema='public' and column_name='version' and data_type='bigint'),6,'T54 six mutable entities use bigint version');
select is((select count(*)::int from pg_catalog.pg_class where oid in ('public.billiard_tables'::regclass,'public.table_sessions'::regclass,'public.payments'::regclass,'public.payment_receipts'::regclass) and relrowsecurity and relforcerowsecurity),4,'T59 new tables force RLS');
select throws_ok($$update public.billiard_tables set hourly_price_vnd=0$$,'23514',null,'T86 positive integer price');
select throws_ok($$update public.billiard_tables set status='BUSY'$$,'23514',null,'Service status cannot duplicate occupancy');
select throws_ok($$update public.billiard_tables set version=0$$,'23514',null,'T54 positive version');
select throws_ok($$update public.staff_memberships set extra_permissions=array['TABLE_SESSION_OPEN_MANUAL','TABLE_SESSION_OPEN_MANUAL']$$,'23514',null,'Duplicate manual permission denied');
select throws_ok($$update public.staff_memberships set extra_permissions=array['UNKNOWN']$$,'23514',null,'Unknown permission still denied');
select throws_ok($$update public.venues set management_contact=repeat('x',501)$$,'23514',null,'T80 contact bound');
select ok(not has_table_privilege('authenticated','public.payment_receipts','SELECT'),'T59 no broad receipt read');
select ok(not has_table_privilege('volume_payment_ingest','public.payments','UPDATE'),'Gateway cannot directly change payments');
select ok(not has_column_privilege('volume_core','auth.sessions','id','SELECT'),'Frozen Core has no Auth SELECT');
select ok(not has_function_privilege('authenticated','private.ingest_payment_event(jsonb)','EXECUTE'),'T34 browser cannot invoke ingest');
select ok(not (select rolcanlogin from pg_catalog.pg_roles where rolname='volume_payment_ingest'),'Gateway is NOLOGIN not business identity');
select is((select count(*)::int from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'sprint2_%' and not coalesce(p.proconfig @> array['search_path=""'],false)),0,'T59 private helper search_path locked');

set constraints all immediate;
select * from finish();
rollback;
