begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(10);
insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');


insert into public.billiard_tables(id,venue_id,code,label,hourly_price_vnd) values('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','A1','Bàn A1',100000),('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','A2','Bàn A2',100000),('40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','B1','Bàn B1',100000);
create temporary table scenario(n text primary key,j jsonb);
grant select,insert,update on scenario to authenticated;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000006","session_id":"20000000-0000-0000-0000-000000000006"}',true);

select throws_ok($$select * from public.payments$$,'42501',null,'T58 USER direct finance read denied');
select throws_ok($$select private.ingest_payment_event('{}')$$,'42501',null,'T34 private ingestion invocation denied');
select throws_ok($$select public.table_operations(null)$$,'P0001','ACCESS_DENIED','USER internal operations denied');
select throws_ok($$select public.opening_payments(null)$$,'P0001','ACCESS_DENIED','USER management finance denied');
select throws_ok($$select public.open_table_manual('40000000-0000-0000-0000-000000000001',null,1,'50000000-0000-0000-0000-000000000001','forged')$$,'P0001','ACCESS_DENIED','T48 USER manual denied');
reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000005","session_id":"20000000-0000-0000-0000-000000000005"}',true);

select throws_ok($$select public.opening_payments(null)$$,'P0001','ACCESS_DENIED','T90 STAFF finance denied');
select throws_ok($$select public.open_table_manual('40000000-0000-0000-0000-000000000001',null,1,'50000000-0000-0000-0000-000000000001','Staff default')$$,'P0001','ACCESS_DENIED','STAFF no default manual');
select throws_ok($$select public.table_operations('10000000-0000-0000-0000-000000000002')$$,'P0001','ACCESS_DENIED','T50 Staff cross venue denied');
reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000004","session_id":"20000000-0000-0000-0000-000000000004"}',true);

select throws_ok($$select public.manual_open_preview('40000000-0000-0000-0000-000000000003',null)$$,'P0001','ACCESS_DENIED','T50 Manager cross venue denied');
reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000003","session_id":"20000000-0000-0000-0000-000000000003"}',true);

select throws_ok($$select public.set_venue_management_contact('10000000-0000-0000-0000-000000000001',1,'contact','reason')$$,'P0001','ACCESS_DENIED','CEO configuration denied');
reset role;

set constraints all immediate;
select * from finish();
rollback;
