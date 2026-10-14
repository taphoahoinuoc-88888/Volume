-- Additive product scope, owner authorized 2026-10-12. No historical migration edited.
create table public.products (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.venues(id),
 sku text not null check(length(btrim(sku)) between 1 and 64), name text not null check(length(btrim(name)) between 1 and 150),
 category text not null check(category in ('CUES','TABLES','CHALK','BALLS','ACCESSORIES')),
 variant text not null default '' check(length(variant)<=100), description text not null default '' check(length(description)<=3000),
 image_url text not null default '/showroom/assets/product-fallback.svg' check(length(image_url)<=1500 and (image_url ~ '^https://[^/@[:space:]]+[^[:space:]]*$' or image_url ~ '^/showroom/assets/[a-zA-Z0-9_./-]+$')),
 price_vnd bigint not null check(price_vnd between 1 and 1000000000000), on_hand integer not null default 0 check(on_hand>=0),
 is_visible boolean not null default false, is_demo boolean not null default false,
 version bigint not null default 1 check(version>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(venue_id,sku)
);
create table public.shop_orders (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.venues(id), customer_profile_id uuid not null references public.profiles(id),
 state text not null default 'PENDING' check(state in ('PENDING','PAID','FULFILLED','CANCELLED')),
 request_key uuid not null, request_payload jsonb not null, expires_at timestamptz not null default clock_timestamp()+interval '900 seconds',
 total_vnd bigint not null check(total_vnd>0), cash_received_at timestamptz, cash_received_by uuid references public.profiles(id),
 version bigint not null default 1 check(version>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(),
 unique(customer_profile_id,request_key), check((state in ('PAID','FULFILLED'))=(cash_received_at is not null and cash_received_by is not null))
);
create table public.shop_order_items (
 order_id uuid not null references public.shop_orders(id), product_id uuid not null references public.products(id),
 name text not null, variant text not null, unit_price_vnd bigint not null check(unit_price_vnd>0), quantity integer not null check(quantity between 1 and 99), primary key(order_id,product_id)
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id), order_id uuid references public.shop_orders(id),
 delta integer not null check(delta<>0), actor_id uuid not null references public.profiles(id), reason text not null check(length(btrim(reason)) between 1 and 500), created_at timestamptz not null default clock_timestamp(), unique(order_id,product_id)
);
create table public.rank_definitions (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.venues(id), name text not null check(length(btrim(name)) between 1 and 80),
 is_active boolean not null default true, version bigint not null default 1 check(version>0), updated_at timestamptz not null default clock_timestamp(), unique(venue_id,name), unique(id,venue_id)
);
create table public.player_profiles (
 profile_id uuid primary key references public.profiles(id), is_active boolean not null default true, version bigint not null default 1 check(version>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
create table public.player_ranks (
 profile_id uuid not null references public.player_profiles(profile_id), venue_id uuid not null references public.venues(id), rank_id uuid not null,
 version bigint not null default 1 check(version>0), updated_at timestamptz not null default clock_timestamp(), primary key(profile_id,venue_id), foreign key(rank_id,venue_id) references public.rank_definitions(id,venue_id)
);
create table public.rank_history (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.player_profiles(profile_id), venue_id uuid not null references public.venues(id), rank_id uuid not null references public.rank_definitions(id),
 rank_name text not null, actor_id uuid not null references public.profiles(id), reason text not null check(length(btrim(reason)) between 1 and 500), created_at timestamptz not null default clock_timestamp()
);
create table public.feedback_tickets (
 id uuid primary key default gen_random_uuid(), venue_id uuid not null references public.venues(id), customer_profile_id uuid not null references public.profiles(id),
 category text not null check(category in ('SERVICE','TABLE','ORDER','OTHER')), message text not null check(length(btrim(message)) between 1 and 3000),
 order_id uuid references public.shop_orders(id), session_id uuid references public.table_sessions(id),
 state text not null default 'NEW' check(state in ('NEW','IN_PROGRESS','RESOLVED')), assigned_to uuid references public.profiles(id),
 request_key uuid not null, version bigint not null default 1 check(version>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(customer_profile_id,request_key)
);
create table public.feedback_messages (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.feedback_tickets(id), actor_id uuid not null references public.profiles(id),
 message text not null check(length(btrim(message)) between 1 and 3000), is_internal boolean not null default false, created_at timestamptz not null default clock_timestamp()
);
create table public.venue_support (
 venue_id uuid primary key references public.venues(id), telegram_username text check(telegram_username ~ '^[A-Za-z][A-Za-z0-9_]{4,31}$'), version bigint not null default 1 check(version>0), updated_at timestamptz not null default clock_timestamp()
);
create index product_venue on public.products(venue_id);
create index order_customer on public.shop_orders(customer_profile_id,created_at);
create index order_hold on public.shop_orders(expires_at) where state='PENDING';
create index order_item_product on public.shop_order_items(product_id);
create index feedback_customer on public.feedback_tickets(customer_profile_id,created_at);
create index feedback_venue on public.feedback_tickets(venue_id,state);
create index feedback_message_ticket on public.feedback_messages(ticket_id,created_at);
create index rank_history_profile on public.rank_history(profile_id,venue_id);
-- Explicit additive fixed permissions; preserve all existing allowed extras and duplicate guards.
alter table public.staff_memberships drop constraint staff_memberships_extra_permissions_check;
alter table public.staff_memberships add constraint staff_memberships_extra_permissions_check check (
 array_position(extra_permissions,null) is null and extra_permissions <@ array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE','TABLE_SESSION_OPEN_MANUAL','SHOP_MANAGE','RANK_MANAGE','FEEDBACK_MANAGE']::text[]
 and cardinality(extra_permissions)=(case when 'STAFF_DIRECTORY_READ'=any(extra_permissions) then 1 else 0 end)+(case when 'STAFF_MEMBERSHIP_STATUS_MANAGE'=any(extra_permissions) then 1 else 0 end)+(case when 'TABLE_SESSION_OPEN_MANUAL'=any(extra_permissions) then 1 else 0 end)+(case when 'SHOP_MANAGE'=any(extra_permissions) then 1 else 0 end)+(case when 'RANK_MANAGE'=any(extra_permissions) then 1 else 0 end)+(case when 'FEEDBACK_MANAGE'=any(extra_permissions) then 1 else 0 end));
-- Extend fixed audit vocabulary while retaining the previous predicate verbatim.
do $$ declare old text;begin
 select pg_get_constraintdef(oid) into old from pg_constraint where conrelid='public.audit_events'::regclass and conname='audit_events_target_type_check';
 execute 'alter table public.audit_events drop constraint audit_events_target_type_check';
 execute 'alter table public.audit_events add constraint audit_events_target_type_check check (('||substr(old,8,length(old)-8)||') or target_type in (''products'',''shop_orders'',''rank_definitions'',''player_profiles'',''feedback_tickets'',''venue_support'',''telegram_links''))';
 select pg_get_constraintdef(oid) into old from pg_constraint where conrelid='public.audit_events'::regclass and conname='audit_events_check1';
 execute 'alter table public.audit_events drop constraint audit_events_check1';
 execute 'alter table public.audit_events add constraint audit_events_check1 check (('||substr(old,8,length(old)-8)||') or (category=''BUSINESS'' and action in (''PRODUCT_SAVED'',''STOCK_CHANGED'',''SHOP_ORDER_CREATED'',''SHOP_ORDER_CANCELLED'',''SHOP_CASH_RECEIVED'',''SHOP_FULFILLED'',''RANK_SAVED'',''RANK_ASSIGNED'',''PLAYER_STATUS_CHANGED'',''FEEDBACK_CREATED'',''FEEDBACK_UPDATED'',''SUPPORT_UPDATED'')) or (category=''SECURITY'' and action in (''TELEGRAM_LINKED'',''TELEGRAM_UNLINKED'')))';
end $$;
do $$ declare t text;begin
 foreach t in array array['products','shop_orders','shop_order_items','inventory_movements','rank_definitions','player_profiles','player_ranks','rank_history','feedback_tickets','feedback_messages','venue_support'] loop
  execute format('alter table public.%I enable row level security',t);execute format('alter table public.%I force row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select,insert on public.%I to volume_core',t);
  execute format('create policy product_core_read on public.%I for select to volume_core using(true)',t);
  execute format('create policy product_core_insert on public.%I for insert to volume_core with check(true)',t);
  if t not in ('inventory_movements','rank_history','shop_order_items','feedback_messages') then
   execute format('grant update on public.%I to volume_core',t);
   execute format('create policy product_core_update on public.%I for update to volume_core using(true) with check(true)',t);
  end if;
 end loop;
end $$;

-- Optional presentation metadata, never occupancy or billing authority.
alter table public.billiard_tables add column floor_label text check(length(floor_label)<=80);
