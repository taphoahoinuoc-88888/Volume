begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(13);
insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');


insert into public.billiard_tables(id,venue_id,code,label,hourly_price_vnd) values('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','A1','Bàn A1',100000),('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','A2','Bàn A2',100000),('40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','B1','Bàn B1',100000);
create temporary table scenario(n text primary key,j jsonb);
grant select,insert,update on scenario to authenticated;
create or replace function private.sprint2_clock() returns timestamptz language sql volatile set search_path='' as $$select '2026-10-07T00:00:00Z'::timestamptz$$;
set local role authenticated;
select pg_catalog.set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000006","session_id":"20000000-0000-0000-0000-000000000006"}',true);
insert into scenario values('hold',public.acquire_table('40000000-0000-0000-0000-000000000001',1,'50000000-0000-0000-0000-000000000001'));
reset role;
create or replace function private.sprint2_clock() returns timestamptz language sql volatile set search_path='' as $$select '2026-10-07T00:05:00Z'::timestamptz$$;

select lives_ok($$select private.ingest_payment_event(jsonb_build_object('provider','neutral-db','recipient_scope','merchant','external_event_id','one','external_transaction_id','transfer-one','reference',(select reference from public.payments),'kind','CREDIT','amount_vnd','100000','currency','VND','provider_occurred_at','2000-01-01T00:00:00Z','provider_callback_received_at','2026-10-07T00:05:00Z','evidence_digest','financial-facts'))$$,'T16 exact authoritative boundary accepted by full engine');

select is((select state from public.table_sessions),'ACTIVE','T16 full money opens one session');
select is((select state from public.payments),'SUCCESS','T09 payment success');
select is((select started_at from public.table_sessions),'2026-10-07T00:05:00Z'::timestamptz,'T14 start equals server transition clock, not provider time');
select is((select payment_success_at from public.payments),(select started_at from public.table_sessions),'Success and session timestamps equal');
select is((select version from public.payments),2::bigint,'One command bumps payment once');
select is((select version from public.table_sessions),2::bigint,'One transition bumps session once');
select lives_ok($$select private.ingest_payment_event(jsonb_build_object('provider','neutral-db','recipient_scope','merchant','external_event_id','one','external_transaction_id','transfer-one','reference',(select reference from public.payments),'kind','CREDIT','amount_vnd','100000','currency','VND','provider_occurred_at','2000-01-01T00:00:00Z','provider_callback_received_at','2026-10-07T00:05:00Z','evidence_digest','financial-facts'))$$,'T12 duplicate callback accepted idempotently');

select is((select count(*)::int from public.payment_receipts),1,'T13 one unique receipt');
select is((select version from public.payments),2::bigint,'Duplicate no version bump');
select is((select count(*)::int from public.audit_events where action='PAYMENT_SUCCEEDED'),1,'T25 one successful payment audit');
select throws_ok($$update public.payment_receipts set amount_vnd=1$$,'P0001','IMMUTABLE_PAYMENT_RECEIPT','T59 receipt update denied');
select throws_ok($$delete from public.payment_receipts$$,'P0001','IMMUTABLE_PAYMENT_RECEIPT','Receipt delete denied');

set constraints all immediate;
select * from finish();
rollback;
