begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(9);
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
reset role;

create function private.fixture_audit_failure() returns trigger language plpgsql set search_path='' as $$begin if new.action='PAYMENT_SUCCEEDED' then raise exception 'FIXTURE_AUDIT_FAILURE'; end if;return new;end$$;
create trigger fixture_audit_failure before insert on public.audit_events for each row execute function private.fixture_audit_failure();
select throws_ok($$select private.ingest_payment_event(jsonb_build_object('provider','neutral-db','recipient_scope','merchant','external_event_id','one','external_transaction_id','transfer-one','reference',(select reference from public.payments),'kind','CREDIT','amount_vnd','100000','currency','VND','provider_occurred_at','2000-01-01T00:00:00Z','provider_callback_received_at',clock_timestamp()::text,'evidence_digest','financial-facts'))$$,'P0001','FIXTURE_AUDIT_FAILURE','T44 audit failure rejects whole payment command');

select is((select count(*)::int from public.payment_receipts),0,'T44 receipt rollback');
select is((select state from public.payments),'WAITING','Payment rollback');
select is((select state from public.table_sessions),'PENDING_PAYMENT','Session rollback');
select is((select version from public.payments),1::bigint,'CAS version rollback');
select ok((select started_at is null from public.table_sessions),'Timer rollback');
select is((select count(*)::int from public.audit_events where action='PAYMENT_RECEIPT_RECORDED'),0,'Receipt audit rollback too');
drop trigger fixture_audit_failure on public.audit_events;
drop function private.fixture_audit_failure();
select lives_ok($$select private.ingest_payment_event(jsonb_build_object('provider','neutral-db','recipient_scope','merchant','external_event_id','one','external_transaction_id','transfer-one','reference',(select reference from public.payments),'kind','CREDIT','amount_vnd','100000','currency','VND','provider_occurred_at','2000-01-01T00:00:00Z','provider_callback_received_at',clock_timestamp()::text,'evidence_digest','financial-facts'))$$,'T43 retry same receipt after rollback succeeds once');
select is((select count(*)::int from public.payment_receipts),1,'T44 exactly one committed receipt');

set constraints all immediate;
select * from finish();
rollback;
