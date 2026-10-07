-- Sprint 3 additive closing/settlement. Frozen migrations are unchanged.
grant create on schema public,private to volume_core;

create function private.sprint3_bill(p_rate bigint,p_duration numeric) returns jsonb
language plpgsql immutable set search_path='' as $$
declare m numeric; c numeric;
begin
 if p_rate is null or p_rate<=0 then raise exception 'INVALID_RATE'; end if;
 if p_duration is null or p_duration::text in ('NaN','Infinity','-Infinity') or p_duration<0 or p_duration<>pg_catalog.trunc(p_duration) then raise exception 'INVALID_DURATION'; end if;
 if p_duration>9223372036854775807 then raise exception 'DURATION_OVERFLOW'; end if;
 m:=greatest(60,pg_catalog.div(p_duration+59999999,60000000));
 c:=pg_catalog.div(p_rate::numeric*m+59,60);
 if m>9223372036854775807 then raise exception 'DURATION_OVERFLOW'; end if;
 if c>9223372036854775807 then raise exception 'MONEY_OVERFLOW'; end if;
 return pg_catalog.jsonb_build_object('duration_microseconds',p_duration::bigint::text,'billable_minutes',m::bigint::text,'final_charge_vnd',c::bigint::text);
end $$;

create function private.sprint3_financial(p_charge bigint,p_received bigint,p_issues text[]) returns jsonb
language plpgsql immutable set search_path='' as $$
declare a bigint; due bigint; excess bigint; issues text[]; status text;
begin
 if p_charge is null or p_charge<=0 or p_received is null or p_received<0 then raise exception 'INVALID_FINANCIAL_AMOUNT'; end if;
 if p_issues is null or pg_catalog.array_position(p_issues,null) is not null or not p_issues<@array['LATE_BANK','PROVIDER_NOTICE','PROVIDER_CONFLICT']::text[] then raise exception 'INVALID_FINANCIAL_ISSUE'; end if;
 a:=least(p_received,p_charge);due:=p_charge-a;excess:=p_received-a;issues:=p_issues;
 if excess>0 then issues:=issues||array['EXCESS']; end if;
 status:=case when pg_catalog.cardinality(issues)>0 then 'NEEDS_RESOLUTION' when due=0 then 'PAID' when a>0 then 'PARTIAL' else 'UNPAID' end;
 return pg_catalog.jsonb_build_object('validated_received_vnd',p_received::text,'applied_amount_vnd',a::text,'remaining_due_vnd',due::text,'unresolved_excess_vnd',excess::text,'settlement_status',status,'issues',issues);
end $$;

alter table public.table_sessions
 add column ended_at timestamptz,
 add column duration_microseconds bigint,
 add column billable_minutes bigint,
 add column final_charge_vnd bigint,
 add column closed_by uuid references public.profiles(id) on delete restrict,
 add column closed_actor_role text,
 add column close_source text,
 add column close_reason text,
 add column close_correlation_id uuid,
 add column closure_received_vnd bigint,
 add column closure_bank_received_vnd bigint,
 add column closure_issues text[];
alter table public.table_sessions drop constraint table_sessions_state_check;
alter table public.table_sessions add constraint table_sessions_state_check check(state in ('PENDING_PAYMENT','ACTIVE','CANCELLED','CLOSED'));
alter table public.table_sessions drop constraint table_sessions_check;
alter table public.table_sessions add constraint table_sessions_check check(
 (opening_method='PAYMENT' and customer_profile_id is not null and customer_profile_id=request_actor_profile_id
  and opened_by is null and manual_reason is null and expires_at is not null and expires_at=acquired_at+interval '300 seconds') or
 (opening_method='MANUAL' and opened_by is not null and opened_by=request_actor_profile_id
  and manual_reason is not null and expires_at is null and state in ('ACTIVE','CLOSED')));
alter table public.table_sessions drop constraint table_sessions_check1;
alter table public.table_sessions add constraint table_sessions_check1 check(
 (state='PENDING_PAYMENT' and started_at is null and cancelled_at is null and cancellation_reason is null) or
 (state in ('ACTIVE','CLOSED') and started_at is not null and started_at>=acquired_at and cancelled_at is null and cancellation_reason is null) or
 (state='CANCELLED' and started_at is null and cancelled_at is not null and cancelled_at>=acquired_at and cancellation_reason is not null));
alter table public.table_sessions add constraint session_closed_shape check(
 (state<>'CLOSED' and ended_at is null and duration_microseconds is null and billable_minutes is null and final_charge_vnd is null
 and closed_by is null and closed_actor_role is null and close_source is null and close_reason is null and close_correlation_id is null
 and closure_received_vnd is null and closure_bank_received_vnd is null and closure_issues is null) or
 (state='CLOSED' and ended_at is not null and pg_catalog.isfinite(ended_at) and pg_catalog.isfinite(started_at) and ended_at>=started_at
 and duration_microseconds is not null and duration_microseconds>=0 and billable_minutes is not null and billable_minutes>=60
 and final_charge_vnd is not null and final_charge_vnd>0 and closed_by is not null
 and closed_actor_role is not null and closed_actor_role in ('ADMIN','CEO','MANAGER','STAFF','USER')
 and close_source is not null and close_source in ('CUSTOMER_WEB','CONTROL_CENTER')
 and close_reason is not null and pg_catalog.length(pg_catalog.btrim(close_reason)) between 1 and 500 and close_correlation_id is not null
 and closure_received_vnd is not null and closure_received_vnd>=0 and closure_bank_received_vnd is not null and closure_bank_received_vnd between 0 and closure_received_vnd
 and closure_issues is not null and pg_catalog.array_position(closure_issues,null) is null and closure_issues<@array['PROVIDER_NOTICE','PROVIDER_CONFLICT','EXCESS']::text[]));

create table public.session_cash_receipts(
 id uuid primary key,
 session_id uuid not null references public.table_sessions(id) on delete restrict,
 amount_vnd bigint not null check(amount_vnd>0),
 actor_id uuid not null references public.profiles(id) on delete restrict,
 actor_role text not null check(actor_role in ('ADMIN','CEO','MANAGER','STAFF')),
 reason text not null check(pg_catalog.length(pg_catalog.btrim(reason)) between 1 and 500),
 correlation_id uuid not null,
 created_at timestamptz not null default pg_catalog.clock_timestamp()
);
create index cash_session_created on public.session_cash_receipts(session_id,created_at,id);
create table public.session_financial_issues(
 id uuid primary key default pg_catalog.gen_random_uuid(),
 payment_id uuid not null references public.payments(id) on delete restrict,
 receipt_id uuid not null references public.payment_receipts(id) on delete restrict,
 fingerprint text not null check(pg_catalog.length(fingerprint)=32),
 kind text not null check(kind='PROVIDER_CONFLICT'),
 created_at timestamptz not null default pg_catalog.clock_timestamp(),
 unique(receipt_id,fingerprint)
);
create index financial_issues_payment on public.session_financial_issues(payment_id);
revoke all on public.session_cash_receipts,public.session_financial_issues from public,anon,authenticated,service_role,volume_payment_ingest;
grant select,insert on public.session_cash_receipts,public.session_financial_issues to volume_core;
alter table public.session_cash_receipts enable row level security;
alter table public.session_cash_receipts force row level security;
alter table public.session_financial_issues enable row level security;
alter table public.session_financial_issues force row level security;
create policy core_cash_read on public.session_cash_receipts for select to volume_core using(true);
create policy core_cash_insert on public.session_cash_receipts for insert to volume_core with check(true);
create policy core_financial_issues_read on public.session_financial_issues for select to volume_core using(true);
create policy core_financial_issues_insert on public.session_financial_issues for insert to volume_core with check(true);

create function private.sprint3_evidence_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'IMMUTABLE_FINANCIAL_EVIDENCE'; end $$;
create trigger cash_immutable before update or delete on public.session_cash_receipts for each row execute function private.sprint3_evidence_immutable();
create trigger financial_issue_immutable before update or delete on public.session_financial_issues for each row execute function private.sprint3_evidence_immutable();
create function private.sprint3_closed_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if old.state='CLOSED' then
  if tg_op='DELETE' then raise exception 'IMMUTABLE_CLOSED_SESSION'; end if;
  if (pg_catalog.to_jsonb(new)-array['version','updated_at']) is distinct from (pg_catalog.to_jsonb(old)-array['version','updated_at']) then raise exception 'IMMUTABLE_CLOSED_SESSION'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;return new;
end $$;
create trigger closed_session_immutable before update or delete on public.table_sessions for each row execute function private.sprint3_closed_immutable();
create function private.sprint3_validate_closed() returns trigger language plpgsql set search_path='' as $$
declare b jsonb;
begin
 if new.state='CLOSED' then
  b:=private.sprint3_bill(new.required_amount_vnd,extract(epoch from (new.ended_at-new.started_at))*1000000);
  if (b->>'duration_microseconds')::bigint<>new.duration_microseconds or (b->>'billable_minutes')::bigint<>new.billable_minutes or (b->>'final_charge_vnd')::bigint<>new.final_charge_vnd then raise exception 'CLOSED_BILL_INVARIANT'; end if;
 end if;return new;
end $$;
create trigger closed_session_bill before insert or update on public.table_sessions for each row execute function private.sprint3_validate_closed();

alter table public.audit_events drop constraint audit_events_target_type_check;
alter table public.audit_events add constraint audit_events_target_type_check check(target_type in
 ('profiles','venues','staff_memberships','auth_user','billiard_tables','table_sessions','payments','payment_receipts','session_cash_receipts','session_financial_issues'));
alter table public.audit_events drop constraint audit_events_check;
alter table public.audit_events add constraint audit_events_check check(
 (source='SYSTEM' and actor_id is null and actor_role is null and action in
 ('AUTH_ACCOUNT_PROVISIONED','AUTH_PROVISION_RECONCILED','BOOTSTRAP_ADMIN_CREATED','TABLE_OPENING_EXPIRED','TABLE_HOLD_INVALIDATED',
 'PAYMENT_ATTEMPT_FAILED','PAYMENT_RECEIPT_RECORDED','PAYMENT_SUCCEEDED','PAYMENT_RESOLUTION_REQUIRED','PAYMENT_RECONCILIATION_FLAGGED','TABLE_SESSION_OPENED','SESSION_FINANCIAL_CONFLICT')) or
 (source<>'SYSTEM' and actor_id is not null and actor_role is not null));
alter table public.audit_events drop constraint audit_events_check1;
alter table public.audit_events add constraint audit_events_check1 check(
 (category='BUSINESS' and action in ('VENUE_CREATED','VENUE_UPDATED','VENUE_MANAGEMENT_CONTACT_UPDATED','TABLE_CREATED','TABLE_UPDATED',
 'TABLE_OPENING_REQUESTED','TABLE_HOLD_CANCELLED','TABLE_OPENING_EXPIRED','TABLE_HOLD_INVALIDATED','PAYMENT_ATTEMPT_FAILED','PAYMENT_RECEIPT_RECORDED',
 'PAYMENT_SUCCEEDED','PAYMENT_RESOLUTION_REQUIRED','PAYMENT_RECONCILIATION_FLAGGED','TABLE_SESSION_OPENED','TABLE_SESSION_OPENED_MANUAL',
 'TABLE_SESSION_CLOSED','SESSION_CASH_RECORDED','SESSION_FINANCIAL_CONFLICT')) or
 (category='SECURITY' and action in ('ROLE_CHANGED','MEMBERSHIP_CREATED','MEMBERSHIP_UPDATED','MEMBERSHIP_STATUS_CHANGED','ACCOUNT_STATUS_CHANGED',
 'SESSIONS_REVOKED','AUTH_ACCOUNT_PROVISIONED','AUTH_PROVISION_RECONCILED','BOOTSTRAP_ADMIN_CREATED')));

do $$ declare f record;begin
 for f in select p.oid::regprocedure signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname like 'sprint3_%' loop
  execute pg_catalog.format('alter function %s owner to volume_core',f.signature);
  execute pg_catalog.format('revoke all on function %s from public,anon,authenticated,service_role,volume_payment_ingest',f.signature);
 end loop;
end $$;
revoke create on schema public,private from volume_core;
