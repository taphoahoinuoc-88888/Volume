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

insert into scenario values('hold',public.acquire_table('40000000-0000-0000-0000-000000000001',1,'50000000-0000-0000-0000-000000000001'));

select is(jsonb_array_length(public.own_table_sessions()),1,'T58 own hold readable');
select throws_ok($$select public.acquire_table('40000000-0000-0000-0000-000000000002',1,'50000000-0000-0000-0000-000000000002')$$,'P0001','CUSTOMER_HOLD_EXISTS','T75 one hold per customer');
select is((public.own_table_sessions()->0->'payment'->>'required_amount_vnd'),'100000','T86 server price snapshot');
select throws_ok($$select public.cancel_table_hold((select (j->>'session_id')::uuid from scenario where n='hold'),null,1)$$,'P0001','VERSION_CONFLICT','T87 missing cancel CAS denied');
reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000007","session_id":"20000000-0000-0000-0000-000000000007"}',true);

select is(jsonb_array_length(public.own_table_sessions()),0,'T58 other customer hold hidden');
select throws_ok($$select public.acquire_table('40000000-0000-0000-0000-000000000001',1,'50000000-0000-0000-0000-000000000003')$$,'P0001','TABLE_UNAVAILABLE','T01 one owner per table');
reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000006","session_id":"20000000-0000-0000-0000-000000000006"}',true);

select lives_ok($$select public.cancel_table_hold((select (j->>'session_id')::uuid from scenario where n='hold'),1,1)$$,'T71 own zero cancel');
reset role;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000004","session_id":"20000000-0000-0000-0000-000000000004"}',true);

insert into scenario values('manual',public.open_table_manual('40000000-0000-0000-0000-000000000001',null,1,'50000000-0000-0000-0000-000000000004','Authorized walk-in'));
reset role;

select is((select count(*)::int from public.table_sessions where opening_method='MANUAL' and customer_profile_id is null and opened_by='30000000-0000-0000-0000-000000000004' and started_at=acquired_at),1,'T78 walk-in has real actor/timestamp no fake profile');
select is((select count(*)::int from public.payments p join public.table_sessions s on s.id=p.session_id where s.opening_method='MANUAL'),0,'T47 manual never fakes payment');
select is((select count(*)::int from public.audit_events where action='TABLE_SESSION_OPENED_MANUAL'),1,'T78 manual audited once');

set constraints all immediate;
select * from finish();
rollback;
