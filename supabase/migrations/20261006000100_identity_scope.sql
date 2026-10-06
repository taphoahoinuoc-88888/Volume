-- Four business entities only. Auth owns identity and sessions.
create schema private;
revoke all on schema private from public;
create role volume_core nologin noinherit;
-- Local managed postgres is not superuser: allow migration operator to transfer
-- ownership, then remove schema CREATE from the runtime owner at migration end.
grant volume_core to postgres;
grant create on schema public, private to volume_core;
grant usage on schema public, private, auth to volume_core;
grant select (id,user_id,created_at) on auth.sessions to volume_core;
grant execute on function auth.uid(), auth.jwt() to volume_core;

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null default 'User' check(length(btrim(display_name)) between 1 and 100),
 role text not null default 'USER' check(role in ('ADMIN','CEO','MANAGER','STAFF','USER')),
 account_status text not null default 'ACTIVE' check(account_status in ('ACTIVE','DISABLED')),
 sessions_revoked_before timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 version bigint not null default 1 check(version>0)
);
create table public.venues (
 id uuid primary key default gen_random_uuid(),
 code text unique not null check(length(btrim(code)) between 1 and 32),
 name text not null check(length(btrim(name)) between 1 and 150),
 public_address text check(length(public_address)<=500),
 timezone text not null,
 is_public boolean not null default false,
 is_enabled boolean not null default true,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 version bigint not null default 1 check(version>0)
);
create table public.staff_memberships (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id),
 venue_id uuid not null references public.venues(id),
 status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
 extra_permissions text[] not null default '{}' check (
   array_position(extra_permissions,null) is null and
   extra_permissions <@ array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE']::text[] and
   cardinality(extra_permissions) = (case when 'STAFF_DIRECTORY_READ'=any(extra_permissions) then 1 else 0 end) + (case when 'STAFF_MEMBERSHIP_STATUS_MANAGE'=any(extra_permissions) then 1 else 0 end)),
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 version bigint not null default 1 check(version>0),
 unique(profile_id,venue_id)
);
create index memberships_venue on public.staff_memberships(venue_id);
create table public.audit_events (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references public.profiles(id),
 actor_role text check(actor_role in ('ADMIN','CEO','MANAGER','STAFF','USER')),
 source text not null check(source in ('CUSTOMER_WEB','CONTROL_CENTER','SYSTEM')),
 category text not null check(category in ('SECURITY','BUSINESS')),
 action text not null,
 target_type text not null check(target_type in ('profiles','venues','staff_memberships','auth_user')),
 target_id uuid not null,
 venue_id uuid references public.venues(id),
 reason text not null check(length(btrim(reason)) between 1 and 500),
 before_data jsonb,
 after_data jsonb,
 correlation_id uuid not null default gen_random_uuid(),
 created_at timestamptz not null default clock_timestamp(),
 check ((source='SYSTEM' and actor_id is null and actor_role is null and action in ('AUTH_ACCOUNT_PROVISIONED','AUTH_PROVISION_RECONCILED','BOOTSTRAP_ADMIN_CREATED')) or (source<>'SYSTEM' and actor_id is not null and actor_role is not null)),
 check((category='BUSINESS' and action in ('VENUE_CREATED','VENUE_UPDATED')) or (category='SECURITY' and action in ('ROLE_CHANGED','MEMBERSHIP_CREATED','MEMBERSHIP_UPDATED','MEMBERSHIP_STATUS_CHANGED','ACCOUNT_STATUS_CHANGED','SESSIONS_REVOKED','AUTH_ACCOUNT_PROVISIONED','AUTH_PROVISION_RECONCILED','BOOTSTRAP_ADMIN_CREATED')))
);
create index audit_venue_created on public.audit_events(venue_id,created_at);
create index audit_actor_created on public.audit_events(actor_id,created_at);

-- Dedicated function owner gets only the four tables and minimum managed-Auth columns.
grant select,insert,update on public.profiles,public.venues,public.staff_memberships to volume_core;
grant select,insert on public.audit_events to volume_core;
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.staff_memberships enable row level security;
alter table public.audit_events enable row level security;
create policy core_profiles on public.profiles to volume_core using(true) with check(true);
create policy core_venues on public.venues to volume_core using(true) with check(true);
create policy core_memberships on public.staff_memberships to volume_core using(true) with check(true);
create policy core_audit on public.audit_events for select to volume_core using(true);
create policy core_audit_insert on public.audit_events for insert to volume_core with check(true);
revoke all on public.profiles,public.venues,public.staff_memberships,public.audit_events from anon,authenticated;

create function private.validate_venue_timezone() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'INVALID_TIMEZONE'; end if;
 return new;
end $$;
create trigger venue_timezone before insert or update on public.venues for each row execute function private.validate_venue_timezone();
create function private.validate_membership() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (new.status='ACTIVE' or cardinality(new.extra_permissions)>0) and not exists(select 1 from public.profiles where id=new.profile_id and role in ('MANAGER','STAFF')) then raise exception 'INELIGIBLE_MEMBERSHIP'; end if;
 return new;
end $$;
alter function private.validate_membership() owner to volume_core;
create trigger membership_eligibility before insert or update on public.staff_memberships for each row execute function private.validate_membership();
create function private.bootstrap_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id) values(new.id);
 return new;
end $$;
alter function private.bootstrap_profile() owner to volume_core;
create trigger auth_profile_bootstrap after insert on auth.users for each row execute function private.bootstrap_profile();
revoke all on all functions in schema private from public,anon,authenticated;
