-- Additive Sprint 2 contract; frozen foundation migrations remain untouched.
alter table public.venues add column management_contact text
 check(management_contact is null or pg_catalog.length(management_contact)<=500);
alter table public.staff_memberships drop constraint staff_memberships_extra_permissions_check;
alter table public.staff_memberships add constraint staff_memberships_extra_permissions_check check(
 pg_catalog.array_position(extra_permissions,null) is null and
 extra_permissions <@ array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE','TABLE_SESSION_OPEN_MANUAL']::text[] and
 pg_catalog.cardinality(extra_permissions)=
 (case when 'STAFF_DIRECTORY_READ'=any(extra_permissions) then 1 else 0 end)+
 (case when 'STAFF_MEMBERSHIP_STATUS_MANAGE'=any(extra_permissions) then 1 else 0 end)+
 (case when 'TABLE_SESSION_OPEN_MANUAL'=any(extra_permissions) then 1 else 0 end));

alter table public.audit_events drop constraint audit_events_target_type_check;
alter table public.audit_events add constraint audit_events_target_type_check check(target_type in
 ('profiles','venues','staff_memberships','auth_user','billiard_tables','table_sessions','payments','payment_receipts'));
alter table public.audit_events drop constraint audit_events_check;
alter table public.audit_events add constraint audit_events_check check(
 (source='SYSTEM' and actor_id is null and actor_role is null and action in
 ('AUTH_ACCOUNT_PROVISIONED','AUTH_PROVISION_RECONCILED','BOOTSTRAP_ADMIN_CREATED',
 'TABLE_OPENING_EXPIRED','TABLE_HOLD_INVALIDATED','PAYMENT_ATTEMPT_FAILED','PAYMENT_RECEIPT_RECORDED',
 'PAYMENT_SUCCEEDED','PAYMENT_RESOLUTION_REQUIRED','PAYMENT_RECONCILIATION_FLAGGED','TABLE_SESSION_OPENED')) or
 (source<>'SYSTEM' and actor_id is not null and actor_role is not null));
alter table public.audit_events drop constraint audit_events_check1;
alter table public.audit_events add constraint audit_events_check1 check(
 (category='BUSINESS' and action in ('VENUE_CREATED','VENUE_UPDATED','VENUE_MANAGEMENT_CONTACT_UPDATED',
 'TABLE_CREATED','TABLE_UPDATED','TABLE_OPENING_REQUESTED','TABLE_HOLD_CANCELLED','TABLE_OPENING_EXPIRED',
 'TABLE_HOLD_INVALIDATED','PAYMENT_ATTEMPT_FAILED','PAYMENT_RECEIPT_RECORDED','PAYMENT_SUCCEEDED',
 'PAYMENT_RESOLUTION_REQUIRED','PAYMENT_RECONCILIATION_FLAGGED','TABLE_SESSION_OPENED','TABLE_SESSION_OPENED_MANUAL')) or
 (category='SECURITY' and action in ('ROLE_CHANGED','MEMBERSHIP_CREATED','MEMBERSHIP_UPDATED',
 'MEMBERSHIP_STATUS_CHANGED','ACCOUNT_STATUS_CHANGED','SESSIONS_REVOKED','AUTH_ACCOUNT_PROVISIONED',
 'AUTH_PROVISION_RECONCILED','BOOTSTRAP_ADMIN_CREATED')));

create table public.billiard_tables(
 id uuid primary key default pg_catalog.gen_random_uuid(),
 venue_id uuid not null references public.venues(id) on delete restrict,
 code text not null check(pg_catalog.length(pg_catalog.btrim(code)) between 1 and 32),
 label text not null check(pg_catalog.length(pg_catalog.btrim(label)) between 1 and 150),
 status text not null default 'ACTIVE' check(status in ('ACTIVE','MAINTENANCE','DISABLED')),
 hourly_price_vnd bigint not null check(hourly_price_vnd>0),
 created_at timestamptz not null default pg_catalog.clock_timestamp(),
 updated_at timestamptz not null default pg_catalog.clock_timestamp(),
 version bigint not null default 1 check(version>0),
 unique(venue_id,code),unique(id,venue_id)
);
create table public.table_sessions(
 id uuid primary key default pg_catalog.gen_random_uuid(),
 venue_id uuid not null references public.venues(id) on delete restrict,
 table_id uuid not null,
 customer_profile_id uuid references public.profiles(id) on delete restrict,
 opened_by uuid references public.profiles(id) on delete restrict,
 opening_method text not null check(opening_method in ('PAYMENT','MANUAL')),
 state text not null check(state in ('PENDING_PAYMENT','ACTIVE','CANCELLED')),
 acquired_at timestamptz not null,
 expires_at timestamptz,
 required_amount_vnd bigint not null check(required_amount_vnd>0),
 prepaid_minutes smallint not null default 60 check(prepaid_minutes=60),
 started_at timestamptz,
 cancelled_at timestamptz,
 cancellation_reason text check(cancellation_reason in ('EXPIRED','CUSTOMER_CANCELLED','ACCOUNT_DISABLED','VENUE_DISABLED','TABLE_UNSERVICEABLE','QR_FAILED')),
 manual_reason text check(pg_catalog.length(pg_catalog.btrim(manual_reason)) between 1 and 500),
 request_actor_profile_id uuid not null references public.profiles(id) on delete restrict,
 request_key uuid not null,
 request_digest text not null,
 created_at timestamptz not null default pg_catalog.clock_timestamp(),
 updated_at timestamptz not null default pg_catalog.clock_timestamp(),
 version bigint not null default 1 check(version>0),
 foreign key(table_id,venue_id) references public.billiard_tables(id,venue_id) on delete restrict,
 unique(request_actor_profile_id,request_key),
 check((opening_method='PAYMENT' and customer_profile_id is not null and customer_profile_id=request_actor_profile_id
        and opened_by is null and manual_reason is null and expires_at is not null and expires_at=acquired_at+interval '300 seconds') or
       (opening_method='MANUAL' and opened_by is not null and opened_by=request_actor_profile_id
        and manual_reason is not null and expires_at is null and state='ACTIVE')),
 check((state='PENDING_PAYMENT' and started_at is null and cancelled_at is null and cancellation_reason is null) or
       (state='ACTIVE' and started_at is not null and started_at>=acquired_at and cancelled_at is null and cancellation_reason is null) or
       (state='CANCELLED' and started_at is null and cancelled_at is not null and cancelled_at>=acquired_at and cancellation_reason is not null))
);
create unique index table_single_owner on public.table_sessions(table_id) where state in ('PENDING_PAYMENT','ACTIVE');
create unique index customer_single_hold on public.table_sessions(customer_profile_id) where state='PENDING_PAYMENT';
create table public.payments(
 id uuid primary key default pg_catalog.gen_random_uuid(),
 session_id uuid not null unique references public.table_sessions(id) on delete restrict,
 reference text not null unique check(pg_catalog.length(reference) between 1 and 200),
 state text not null check(state in ('WAITING','SUCCESS','CANCELLED','PAYMENT_NEEDS_RESOLUTION')),
 payment_success_at timestamptz,
 resolution_reason text check(resolution_reason in ('EXPIRED','CUSTOMER_CANCELLED','ACCOUNT_DISABLED','VENUE_DISABLED','TABLE_UNSERVICEABLE','QR_FAILED','LATE_RECEIPT')),
 created_at timestamptz not null default pg_catalog.clock_timestamp(),
 updated_at timestamptz not null default pg_catalog.clock_timestamp(),
 version bigint not null default 1 check(version>0),
 check((state='SUCCESS' and payment_success_at is not null and resolution_reason is null) or
       (state='PAYMENT_NEEDS_RESOLUTION' and payment_success_at is null and resolution_reason is not null) or
       (state in ('WAITING','CANCELLED') and payment_success_at is null and resolution_reason is null))
);
create table public.payment_receipts(
 id uuid primary key default pg_catalog.gen_random_uuid(),
 payment_id uuid references public.payments(id) on delete restrict,
 provider text not null check(pg_catalog.length(pg_catalog.btrim(provider)) between 1 and 64),
 recipient_scope text not null check(pg_catalog.length(pg_catalog.btrim(recipient_scope)) between 1 and 128),
 external_event_id text not null check(pg_catalog.length(pg_catalog.btrim(external_event_id)) between 1 and 200),
 external_transaction_id text check(pg_catalog.length(pg_catalog.btrim(external_transaction_id)) between 1 and 200),
 reference text not null check(pg_catalog.length(pg_catalog.btrim(reference)) between 1 and 200),
 kind text not null check(kind in ('CREDIT','REVERSAL_NOTICE','RECONCILIATION_NOTICE')),
 amount_vnd bigint,
 currency text not null check(currency='VND'),
 provider_occurred_at timestamptz not null,
 provider_callback_received_at timestamptz not null,
 processed_at timestamptz not null,
 evidence_digest text not null check(pg_catalog.length(evidence_digest) between 1 and 256),
 created_at timestamptz not null default pg_catalog.clock_timestamp(),
 unique(provider,recipient_scope,external_event_id),
 check((kind='CREDIT' and external_transaction_id is not null and amount_vnd is not null and amount_vnd>0) or
       (kind<>'CREDIT' and (amount_vnd is null or amount_vnd>0))),
 check(processed_at>=provider_callback_received_at)
);
create unique index receipt_single_credit on public.payment_receipts(provider,recipient_scope,external_transaction_id) where kind='CREDIT';
create index tables_venue_service on public.billiard_tables(venue_id,status);
create index sessions_venue_state on public.table_sessions(venue_id,state);
create index sessions_customer_created on public.table_sessions(customer_profile_id,created_at);
create index sessions_pending_expiry on public.table_sessions(expires_at) where state='PENDING_PAYMENT';
create index payments_state_created on public.payments(state,created_at);
create index receipts_payment on public.payment_receipts(payment_id);

-- Trusted adapter capability is not a business role and has no Auth privileges.
create role volume_payment_ingest nologin noinherit;
grant volume_payment_ingest to postgres;
grant usage on schema private to volume_payment_ingest;
grant select,insert,update on public.billiard_tables,public.table_sessions,public.payments to volume_core;
grant select,insert on public.payment_receipts to volume_core;
revoke all on public.billiard_tables,public.table_sessions,public.payments,public.payment_receipts from public,anon,authenticated,service_role,volume_payment_ingest;
alter table public.billiard_tables enable row level security;
alter table public.billiard_tables force row level security;
alter table public.table_sessions enable row level security;
alter table public.table_sessions force row level security;
alter table public.payments enable row level security;
alter table public.payments force row level security;
alter table public.payment_receipts enable row level security;
alter table public.payment_receipts force row level security;
create policy core_tables on public.billiard_tables to volume_core using(true) with check(true);
create policy core_sessions on public.table_sessions to volume_core using(true) with check(true);
create policy core_payments on public.payments to volume_core using(true) with check(true);
create policy core_receipts_read on public.payment_receipts for select to volume_core using(true);
create policy core_receipts_insert on public.payment_receipts for insert to volume_core with check(true);

create function private.sprint2_receipt_immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'IMMUTABLE_PAYMENT_RECEIPT'; end $$;
revoke all on function private.sprint2_receipt_immutable() from public,anon,authenticated,service_role,volume_payment_ingest;
create trigger payment_receipt_immutable before update or delete on public.payment_receipts for each row execute function private.sprint2_receipt_immutable();
