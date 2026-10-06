-- Existing Auth/cutoff/writer functions are unchanged. All new runtime owners
-- have minimum business grants and fixed, empty search_path.
grant create on schema public,private to volume_core;
create function private.sprint2_lock() returns void language sql set search_path='' as $$
 select pg_catalog.pg_advisory_xact_lock_shared(20261006,1)
$$;
create function private.sprint2_can_manual(p_venue uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare a public.profiles;
begin
 a:=private.live_profile();
 return a.role in ('ADMIN','CEO') or (a.role='MANAGER' and private.can_venue(p_venue)) or
  (a.role='STAFF' and exists(select 1 from public.staff_memberships m where m.profile_id=a.id and m.venue_id=p_venue and m.status='ACTIVE' and 'TABLE_SESSION_OPEN_MANUAL'=any(m.extra_permissions)));
end $$;
create function private.sprint2_balances(p_payment uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare needed bigint; received numeric;
begin
 select s.required_amount_vnd into needed from public.payments p join public.table_sessions s on s.id=p.session_id where p.id=p_payment;
 if needed is null then raise exception 'PAYMENT_NOT_FOUND'; end if;
 select coalesce(pg_catalog.sum(r.amount_vnd::numeric),0) into received from public.payment_receipts r where r.payment_id=p_payment and r.kind='CREDIT';
 if received>9223372036854775807 then raise exception 'MONEY_OVERFLOW'; end if;
 return pg_catalog.jsonb_build_object('required_amount_vnd',needed::text,'received_amount_vnd',received::bigint::text,
 'remaining_amount_vnd',greatest(needed::numeric-received,0)::bigint::text,
 'excess_amount_vnd',greatest(received-needed::numeric,0)::bigint::text);
end $$;
create function private.sprint2_audit(p_action text,p_target_type text,p_target uuid,p_venue uuid,p_reason text,p_before jsonb,p_after jsonb,p_source text default 'SYSTEM') returns void language plpgsql security definer set search_path='' as $$
declare a public.profiles; payload jsonb; k text;
begin
 perform private.check_reason(p_reason);
 if p_source not in ('SYSTEM','CUSTOMER_WEB','CONTROL_CENTER') then raise exception 'INVALID_AUDIT_SOURCE'; end if;
 -- Each RPC creates its own fixed payload. Reject accidental private data.
 foreach payload in array array[p_before,p_after] loop
  if payload is not null then
   if pg_catalog.jsonb_typeof(payload)<>'object' then raise exception 'INVALID_AUDIT_PAYLOAD'; end if;
   for k in select pg_catalog.jsonb_object_keys(payload) loop
    if k not in ('id','venue_id','table_id','session_id','payment_id','customer_profile_id','opened_by','state','status','opening_method',
     'required_amount_vnd','received_amount_vnd','remaining_amount_vnd','excess_amount_vnd','expires_at','started_at','payment_success_at',
     'version','reason','management_contact_changed','code','label','hourly_price_vnd','notice') then raise exception 'INVALID_AUDIT_PAYLOAD'; end if;
   end loop;
  end if;
 end loop;
 if p_source<>'SYSTEM' then a:=private.live_profile(); end if;
 insert into public.audit_events(actor_id,actor_role,source,category,action,target_type,target_id,venue_id,reason,before_data,after_data)
 values(a.id,a.role,p_source,'BUSINESS',p_action,p_target_type,p_target,p_venue,p_reason,p_before,p_after);
end $$;
create function private.sprint2_expire_locked(p_session uuid,p_now timestamptz,p_cause text) returns void language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; p public.payments; b jsonb; act text;
begin
 select * into s from public.table_sessions where id=p_session for update;
 if s.id is null or s.state<>'PENDING_PAYMENT' then return; end if;
 if p_cause='EXPIRED' and p_now<=s.expires_at then return; end if;
 select * into p from public.payments where session_id=s.id for update;
 b:=private.sprint2_balances(p.id);
 update public.table_sessions set state='CANCELLED',cancelled_at=p_now,cancellation_reason=p_cause,updated_at=p_now,version=version+1 where id=s.id;
 update public.payments set state=case when (b->>'received_amount_vnd')::bigint>0 then 'PAYMENT_NEEDS_RESOLUTION' else 'CANCELLED' end,
 resolution_reason=case when (b->>'received_amount_vnd')::bigint>0 then p_cause else null end,updated_at=p_now,version=version+1 where id=p.id;
 act:=case when p_cause='EXPIRED' then 'TABLE_OPENING_EXPIRED' when p_cause='QR_FAILED' then 'PAYMENT_ATTEMPT_FAILED' when p_cause='CUSTOMER_CANCELLED' then 'TABLE_HOLD_CANCELLED' else 'TABLE_HOLD_INVALIDATED' end;
 perform private.sprint2_audit(act,'table_sessions',s.id,s.venue_id,p_cause,
 pg_catalog.jsonb_build_object('state',s.state,'version',s.version::text),pg_catalog.jsonb_build_object('state','CANCELLED','version',(s.version+1)::text),
 case when p_cause='CUSTOMER_CANCELLED' then 'CUSTOMER_WEB' else 'SYSTEM' end);
 if (b->>'received_amount_vnd')::bigint>0 then
  perform private.sprint2_audit('PAYMENT_RESOLUTION_REQUIRED','payments',p.id,s.venue_id,p_cause,null,b||pg_catalog.jsonb_build_object('state','PAYMENT_NEEDS_RESOLUTION'));
 end if;
end $$;

create function public.public_tables(p_venue uuid default null) returns jsonb language sql security definer set search_path='' as $$
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',t.id,'venue_id',t.venue_id,'venue_name',v.name,'code',t.code,'label',t.label,
 'hourly_price_vnd',t.hourly_price_vnd::text,'version',t.version::text,'management_contact',v.management_contact,
 'availability',case when exists(select 1 from public.table_sessions s where s.table_id=t.id and s.state='ACTIVE') then 'playing'
 when exists(select 1 from public.table_sessions s join public.profiles c on c.id=s.customer_profile_id where s.table_id=t.id and s.state='PENDING_PAYMENT' and s.expires_at>=pg_catalog.clock_timestamp() and c.account_status='ACTIVE') then 'pending' else 'available' end,
 'server_now',pg_catalog.clock_timestamp()) order by v.code,t.code),'[]')
 from public.billiard_tables t join public.venues v on v.id=t.venue_id
 where v.is_enabled and v.is_public and t.status='ACTIVE' and (p_venue is null or v.id=p_venue)
$$;
create function public.sprint2_access(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; perms text[];
begin
 a:=private.live_profile();perms:=array['PUBLIC_TABLES_READ','OWN_TABLE_SESSION_CREATE','OWN_TABLE_SESSIONS_READ','OWN_OPENING_PAYMENTS_READ','OWN_TABLE_HOLD_CANCEL'];
 if a.role in ('ADMIN','CEO','MANAGER','STAFF') and (p_venue is null or private.can_venue(p_venue)) then perms:=perms||array['TABLE_OPERATIONS_READ']; end if;
 if a.role in ('ADMIN','CEO','MANAGER') and (p_venue is null or private.can_venue(p_venue)) then perms:=perms||array['OPENING_PAYMENTS_READ']; end if;
 if a.role='ADMIN' then perms:=perms||array['TABLE_DEFINITIONS_MANAGE']; end if;
 if a.role in ('ADMIN','CEO') or (p_venue is not null and private.sprint2_can_manual(p_venue)) then perms:=perms||array['TABLE_SESSION_OPEN_MANUAL']; end if;
 return pg_catalog.jsonb_build_object('permissions',perms,'venue_id',p_venue);
end $$;
create function public.own_table_sessions() returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; result jsonb;
begin
 a:=private.live_profile();
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',s.id,'table_id',s.table_id,'venue_id',s.venue_id,'label',t.label,
 'opening_method',s.opening_method,'state',case when s.state='PENDING_PAYMENT' and s.expires_at<pg_catalog.clock_timestamp() then 'CANCELLED' else s.state end,
 'expires_at',s.expires_at,'started_at',s.started_at,'version',s.version::text,'server_now',pg_catalog.clock_timestamp(),
 'management_contact',v.management_contact,'payment',case when p.id is null then null else
 private.sprint2_balances(p.id)||pg_catalog.jsonb_build_object('id',p.id,'reference',p.reference,'version',p.version::text,'payment_success_at',p.payment_success_at,
 'state',case when s.state='PENDING_PAYMENT' and s.expires_at<pg_catalog.clock_timestamp() then
  case when (private.sprint2_balances(p.id)->>'received_amount_vnd')::bigint>0 then 'PAYMENT_NEEDS_RESOLUTION' else 'CANCELLED' end else p.state end) end)
 order by s.created_at desc),'[]') into result
 from public.table_sessions s join public.billiard_tables t on t.id=s.table_id join public.venues v on v.id=s.venue_id
 left join public.payments p on p.session_id=s.id where s.customer_profile_id=a.id;
 return result;
end $$;
create function public.table_operations(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; result jsonb;
begin
 a:=private.live_profile();
 if a.role not in ('ADMIN','CEO','MANAGER','STAFF') or (p_venue is not null and not private.can_venue(p_venue)) then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('id',t.id,'venue_id',t.venue_id,'code',t.code,'label',t.label,'status',t.status,
 'version',t.version::text,'availability',case when s.state='ACTIVE' then 'playing' when s.state='PENDING_PAYMENT' then 'pending' else 'available' end,
 'started_at',s.started_at,'server_now',pg_catalog.clock_timestamp())||
 case when a.role in ('ADMIN','CEO','MANAGER') then pg_catalog.jsonb_build_object('hourly_price_vnd',t.hourly_price_vnd::text,'session_id',s.id,'expires_at',s.expires_at,'customer_profile_id',s.customer_profile_id,'opening_method',s.opening_method) else '{}'::jsonb end order by t.code),'[]') into result
 from public.billiard_tables t join public.venues v on v.id=t.venue_id
 left join public.table_sessions s on s.table_id=t.id and (s.state='ACTIVE' or (s.state='PENDING_PAYMENT' and s.expires_at>=pg_catalog.clock_timestamp()))
 where (p_venue is null or t.venue_id=p_venue) and private.can_venue(t.venue_id);
 return result;
end $$;
create function public.opening_payments(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; result jsonb;
begin
 a:=private.live_profile();
 if a.role not in ('ADMIN','CEO','MANAGER') or (p_venue is not null and not private.can_venue(p_venue)) then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(pg_catalog.jsonb_agg(private.sprint2_balances(p.id)||pg_catalog.jsonb_build_object('id',p.id,'session_id',s.id,'venue_id',s.venue_id,'table_id',s.table_id,
 'state',case when s.state='PENDING_PAYMENT' and s.expires_at<pg_catalog.clock_timestamp() then
 case when (private.sprint2_balances(p.id)->>'received_amount_vnd')::bigint>0 then 'PAYMENT_NEEDS_RESOLUTION' else 'CANCELLED' end else p.state end,
 'version',p.version::text,'expires_at',s.expires_at,'started_at',s.started_at,'payment_success_at',p.payment_success_at,
 'resolution_reason',p.resolution_reason,'server_now',pg_catalog.clock_timestamp(),
 'notice',exists(select 1 from public.payment_receipts r where r.payment_id=p.id and r.kind<>'CREDIT')) order by p.created_at desc),'[]') into result
 from public.payments p join public.table_sessions s on s.id=p.session_id
 where (p_venue is null or s.venue_id=p_venue) and private.can_venue(s.venue_id);
 return result;
end $$;

create function public.acquire_table(p_table uuid,p_expected_table_version bigint,p_request_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; t public.billiard_tables; s public.table_sessions; p public.payments; n timestamptz; digest text; prior public.table_sessions; old_table uuid;
begin
 perform private.sprint2_lock();a:=private.live_profile();
 perform 1 from public.profiles where id=a.id for update; a:=private.live_profile();
 if p_request_key is null then raise exception 'INVALID_REQUEST_KEY'; end if;
 digest:=pg_catalog.jsonb_build_array('PAYMENT',p_table,p_expected_table_version)::text;
 select * into prior from public.table_sessions where request_actor_profile_id=a.id and request_key=p_request_key;
 if prior.id is not null then
  if prior.request_digest<>digest then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return pg_catalog.jsonb_build_object('status','REPLAY','session_id',prior.id);
 end if;
 select table_id into old_table from public.table_sessions where customer_profile_id=a.id and state='PENDING_PAYMENT';
 perform 1 from public.billiard_tables where id in (p_table,old_table) order by id for update;
 select * into t from public.billiard_tables where id=p_table;
 if t.id is null or t.status<>'ACTIVE' or not exists(select 1 from public.venues v where v.id=t.venue_id and v.is_enabled and v.is_public) then raise exception 'TABLE_UNAVAILABLE'; end if;
 perform private.check_version(t.version,p_expected_table_version); n:=pg_catalog.clock_timestamp();
 for prior in select * from public.table_sessions where state='PENDING_PAYMENT' and (table_id=p_table or customer_profile_id=a.id) order by table_id,id loop
  if prior.expires_at<n then perform private.sprint2_expire_locked(prior.id,n,'EXPIRED'); end if;
 end loop;
 if exists(select 1 from public.table_sessions where table_id=p_table and state in ('PENDING_PAYMENT','ACTIVE')) then raise exception 'TABLE_UNAVAILABLE'; end if;
 if exists(select 1 from public.table_sessions where customer_profile_id=a.id and state='PENDING_PAYMENT') then raise exception 'CUSTOMER_HOLD_EXISTS'; end if;
 insert into public.table_sessions(venue_id,table_id,customer_profile_id,opening_method,state,acquired_at,expires_at,required_amount_vnd,request_actor_profile_id,request_key,request_digest)
 values(t.venue_id,t.id,a.id,'PAYMENT','PENDING_PAYMENT',n,n+interval '300 seconds',t.hourly_price_vnd,a.id,p_request_key,digest) returning * into s;
 insert into public.payments(session_id,reference,state) values(s.id,'VOL-'||pg_catalog.gen_random_uuid()::text,'WAITING') returning * into p;
 perform private.sprint2_audit('TABLE_OPENING_REQUESTED','table_sessions',s.id,t.venue_id,'Customer requested initial 60 minutes',null,
 pg_catalog.jsonb_build_object('table_id',t.id,'payment_id',p.id,'state',s.state,'required_amount_vnd',s.required_amount_vnd::text,'expires_at',s.expires_at,'version',s.version::text),'CUSTOMER_WEB');
 return pg_catalog.jsonb_build_object('status','CREATED','session_id',s.id);
end $$;
create function public.cancel_table_hold(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; s public.table_sessions; p public.payments; n timestamptz;
begin
 perform private.sprint2_lock();a:=private.live_profile();
 perform 1 from public.profiles where id=a.id for update;a:=private.live_profile();
 select * into s from public.table_sessions where id=p_session and customer_profile_id=a.id;
 if s.id is null then raise exception 'ACCESS_DENIED'; end if;
 perform 1 from public.billiard_tables where id=s.table_id for update;
 select * into s from public.table_sessions where id=p_session for update;
 select * into p from public.payments where session_id=s.id for update;
 perform private.check_version(s.version,p_expected_session_version);perform private.check_version(p.version,p_expected_payment_version);
 if s.state<>'PENDING_PAYMENT' then raise exception 'HOLD_NOT_PENDING'; end if;
 n:=pg_catalog.clock_timestamp();
 perform private.sprint2_expire_locked(s.id,n,case when n>s.expires_at then 'EXPIRED' else 'CUSTOMER_CANCELLED' end);
 return pg_catalog.jsonb_build_object('status','CANCELLED','session_id',s.id);
end $$;
create function public.manual_open_preview(p_table uuid,p_customer uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; t public.billiard_tables; c public.profiles;
begin
 a:=private.live_profile();select * into t from public.billiard_tables where id=p_table;
 if t.id is null or not private.sprint2_can_manual(t.venue_id) then raise exception 'ACCESS_DENIED'; end if;
 if t.status<>'ACTIVE' or not exists(select 1 from public.venues where id=t.venue_id and is_enabled) then raise exception 'TABLE_UNAVAILABLE'; end if;
 if p_customer is not null then
  select * into c from public.profiles where id=p_customer and account_status='ACTIVE';
  if c.id is null then raise exception 'ACCESS_DENIED'; end if;
 end if;
 return pg_catalog.jsonb_build_object('table_id',t.id,'venue_id',t.venue_id,'label',t.label,'version',t.version::text,'required_amount_vnd',t.hourly_price_vnd::text,
 'customer',case when c.id is null then null else pg_catalog.jsonb_build_object('id',c.id,'display_name',c.display_name,'account_status',c.account_status) end,
 'opening_method','MANUAL','prepaid_minutes',60,'payment_bypassed',true);
end $$;
create function public.open_table_manual(p_table uuid,p_customer uuid,p_expected_table_version bigint,p_request_key uuid,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; t public.billiard_tables; s public.table_sessions; prior public.table_sessions; digest text; n timestamptz;
begin
 perform private.sprint2_lock();a:=private.live_profile();
 perform 1 from public.profiles where id in(a.id,p_customer) order by id for update;a:=private.live_profile();
 perform private.check_reason(p_reason);if p_request_key is null then raise exception 'INVALID_REQUEST_KEY'; end if;
 select * into t from public.billiard_tables where id=p_table for update;
 if t.id is null or not private.sprint2_can_manual(t.venue_id) then raise exception 'ACCESS_DENIED'; end if;
 digest:=pg_catalog.jsonb_build_array('MANUAL',p_table,p_customer,p_expected_table_version,p_reason)::text;
 select * into prior from public.table_sessions where request_actor_profile_id=a.id and request_key=p_request_key;
 if prior.id is not null then
  if prior.request_digest<>digest then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return pg_catalog.jsonb_build_object('status','REPLAY','session_id',prior.id);
 end if;
 if t.status<>'ACTIVE' or not exists(select 1 from public.venues where id=t.venue_id and is_enabled) then raise exception 'TABLE_UNAVAILABLE'; end if;
 if p_customer is not null and not exists(select 1 from public.profiles where id=p_customer and account_status='ACTIVE') then raise exception 'ACCESS_DENIED'; end if;
 perform private.check_version(t.version,p_expected_table_version);n:=pg_catalog.clock_timestamp();
 for prior in select * from public.table_sessions where table_id=t.id and state='PENDING_PAYMENT' and expires_at<n loop
  perform private.sprint2_expire_locked(prior.id,n,'EXPIRED');
 end loop;
 if exists(select 1 from public.table_sessions where table_id=t.id and state in ('PENDING_PAYMENT','ACTIVE')) then raise exception 'TABLE_UNAVAILABLE'; end if;
 insert into public.table_sessions(venue_id,table_id,customer_profile_id,opened_by,opening_method,state,acquired_at,required_amount_vnd,started_at,manual_reason,request_actor_profile_id,request_key,request_digest)
 values(t.venue_id,t.id,p_customer,a.id,'MANUAL','ACTIVE',n,t.hourly_price_vnd,n,p_reason,a.id,p_request_key,digest) returning * into s;
 perform private.sprint2_audit('TABLE_SESSION_OPENED_MANUAL','table_sessions',s.id,t.venue_id,p_reason,null,
 pg_catalog.jsonb_build_object('table_id',t.id,'customer_profile_id',p_customer,'opened_by',a.id,'opening_method','MANUAL','state','ACTIVE','started_at',n,'version',s.version::text),'CONTROL_CENTER');
 return pg_catalog.jsonb_build_object('status','CREATED','session_id',s.id);
end $$;
create function public.create_billiard_table(p_venue uuid,p_code text,p_label text,p_hourly_price_vnd bigint,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; t public.billiard_tables;
begin
 perform private.sprint2_lock();a:=private.live_profile();perform 1 from public.profiles where id=a.id for update;a:=private.live_profile();
 if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED'; end if;perform private.check_reason(p_reason);
 if not exists(select 1 from public.venues where id=p_venue and is_enabled) then raise exception 'VENUE_UNAVAILABLE'; end if;
 insert into public.billiard_tables(venue_id,code,label,hourly_price_vnd) values(p_venue,p_code,p_label,p_hourly_price_vnd) returning * into t;
 perform private.sprint2_audit('TABLE_CREATED','billiard_tables',t.id,t.venue_id,p_reason,null,pg_catalog.jsonb_build_object('code',t.code,'label',t.label,'hourly_price_vnd',t.hourly_price_vnd::text,'status',t.status,'version',t.version::text),'CONTROL_CENTER');
 return pg_catalog.jsonb_build_object('id',t.id,'version',t.version::text);
end $$;
create function public.update_billiard_table(p_table uuid,p_expected_version bigint,p_label text,p_status text,p_hourly_price_vnd bigint,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; t public.billiard_tables; old public.billiard_tables;
begin
 perform private.sprint2_lock();a:=private.live_profile();perform 1 from public.profiles where id=a.id for update;a:=private.live_profile();
 if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED'; end if;perform private.check_reason(p_reason);
 select * into old from public.billiard_tables where id=p_table for update;perform private.check_version(old.version,p_expected_version);
 if row(old.label,old.status,old.hourly_price_vnd) is not distinct from row(p_label,p_status,p_hourly_price_vnd) then return pg_catalog.jsonb_build_object('status','NO_CHANGE','version',old.version::text); end if;
 update public.billiard_tables set label=p_label,status=p_status,hourly_price_vnd=p_hourly_price_vnd,version=version+1,updated_at=pg_catalog.clock_timestamp() where id=p_table returning * into t;
 perform private.sprint2_audit('TABLE_UPDATED','billiard_tables',t.id,t.venue_id,p_reason,
 pg_catalog.jsonb_build_object('label',old.label,'status',old.status,'hourly_price_vnd',old.hourly_price_vnd::text,'version',old.version::text),
 pg_catalog.jsonb_build_object('label',t.label,'status',t.status,'hourly_price_vnd',t.hourly_price_vnd::text,'version',t.version::text),'CONTROL_CENTER');
 return pg_catalog.jsonb_build_object('status','UPDATED','version',t.version::text);
end $$;
create function public.set_venue_management_contact(p_venue uuid,p_expected_version bigint,p_contact text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; v public.venues;
begin
 perform private.sprint2_lock();a:=private.live_profile();perform 1 from public.profiles where id=a.id for update;a:=private.live_profile();
 if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED'; end if;perform private.check_reason(p_reason);
 select * into v from public.venues where id=p_venue for update;perform private.check_version(v.version,p_expected_version);
 if v.management_contact is not distinct from p_contact then return pg_catalog.jsonb_build_object('status','NO_CHANGE','version',v.version::text); end if;
 update public.venues set management_contact=p_contact,version=version+1,updated_at=pg_catalog.clock_timestamp() where id=p_venue;
 perform private.sprint2_audit('VENUE_MANAGEMENT_CONTACT_UPDATED','venues',v.id,v.id,p_reason,
 pg_catalog.jsonb_build_object('version',v.version::text),pg_catalog.jsonb_build_object('management_contact_changed',true,'version',(v.version+1)::text),'CONTROL_CENTER');
 return pg_catalog.jsonb_build_object('status','UPDATED','version',(v.version+1)::text);
end $$;

create function private.ingest_payment_event(p_event jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.payments; s public.table_sessions; r public.payment_receipts; prior public.payment_receipts;
 n timestamptz; success_time timestamptz; b jsonb; received bigint; key text; k text; cause text;
begin
 perform private.sprint2_lock();
 if pg_catalog.jsonb_typeof(p_event)<>'object' then raise exception 'INVALID_PAYMENT_EVENT'; end if;
 for k in select pg_catalog.jsonb_object_keys(p_event) loop
  if k not in ('provider','recipient_scope','external_event_id','external_transaction_id','reference','kind','amount_vnd','currency','provider_occurred_at','provider_callback_received_at','evidence_digest') then raise exception 'INVALID_PAYMENT_EVENT'; end if;
 end loop;
 if p_event->>'currency'<>'VND' or p_event->>'currency' is null or p_event->>'kind' not in ('CREDIT','REVERSAL_NOTICE','RECONCILIATION_NOTICE') or p_event->>'kind' is null then raise exception 'INVALID_PAYMENT_EVENT'; end if;
 if p_event->>'amount_vnd' is not null and (p_event->>'amount_vnd')!~'^[0-9]+$' then raise exception 'INVALID_PAYMENT_EVENT'; end if;
 key:=pg_catalog.jsonb_build_array(p_event->>'provider',p_event->>'recipient_scope',coalesce(p_event->>'external_transaction_id',p_event->>'external_event_id'))::text;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(key,20261007));
 select * into prior from public.payment_receipts where provider=p_event->>'provider' and recipient_scope=p_event->>'recipient_scope' and
 (external_event_id=p_event->>'external_event_id' or (kind='CREDIT' and p_event->>'kind'='CREDIT' and external_transaction_id=p_event->>'external_transaction_id')) order by created_at limit 1;
 if prior.id is not null then
  if row(prior.reference,prior.kind,prior.amount_vnd,prior.currency,prior.external_transaction_id,prior.provider_occurred_at,prior.evidence_digest)
   is distinct from row(p_event->>'reference',p_event->>'kind',(p_event->>'amount_vnd')::bigint,p_event->>'currency',p_event->>'external_transaction_id',(p_event->>'provider_occurred_at')::timestamptz,p_event->>'evidence_digest') then raise exception 'PAYMENT_IDENTITY_CONFLICT'; end if;
  return pg_catalog.jsonb_build_object('status','NO_CHANGE','receipt_id',prior.id,'payment_id',prior.payment_id);
 end if;
 select * into p from public.payments where reference=p_event->>'reference';
 if p.id is not null then
  select * into s from public.table_sessions where id=p.session_id;
  perform 1 from public.profiles where id=s.customer_profile_id for update;
  perform 1 from public.billiard_tables where id=s.table_id for update;
  select * into s from public.table_sessions where id=s.id for update;
  select * into p from public.payments where id=p.id for update;
 end if;
 n:=pg_catalog.clock_timestamp();
 insert into public.payment_receipts(payment_id,provider,recipient_scope,external_event_id,external_transaction_id,reference,kind,amount_vnd,currency,provider_occurred_at,provider_callback_received_at,processed_at,evidence_digest)
 values(p.id,p_event->>'provider',p_event->>'recipient_scope',p_event->>'external_event_id',p_event->>'external_transaction_id',p_event->>'reference',p_event->>'kind',(p_event->>'amount_vnd')::bigint,p_event->>'currency',(p_event->>'provider_occurred_at')::timestamptz,(p_event->>'provider_callback_received_at')::timestamptz,n,p_event->>'evidence_digest') returning * into r;
 perform private.sprint2_audit('PAYMENT_RECEIPT_RECORDED','payment_receipts',r.id,s.venue_id,'Validated provider evidence',null,pg_catalog.jsonb_build_object('payment_id',p.id));
 if p.id is null then return pg_catalog.jsonb_build_object('status','UNMATCHED','receipt_id',r.id); end if;
 if r.kind<>'CREDIT' then
  update public.payments set version=version+1,updated_at=n where id=p.id;
  perform private.sprint2_audit('PAYMENT_RECONCILIATION_FLAGGED','payments',p.id,s.venue_id,'Provider notice requires management reconciliation',null,pg_catalog.jsonb_build_object('notice',true,'version',(p.version+1)::text));
  return pg_catalog.jsonb_build_object('status','NOTICE_RECORDED','receipt_id',r.id,'payment_id',p.id);
 end if;
 b:=private.sprint2_balances(p.id);received:=(b->>'received_amount_vnd')::bigint;
 -- Sample after serialization and cumulative-credit computation. Never use now(),
 -- transaction start, client time or provider_occurred_at as the opening clock.
 success_time:=pg_catalog.clock_timestamp();
 if s.state='PENDING_PAYMENT' then
  if not exists(select 1 from public.profiles where id=s.customer_profile_id and account_status='ACTIVE') then cause:='ACCOUNT_DISABLED';
  elsif not exists(select 1 from public.venues where id=s.venue_id and is_enabled) then cause:='VENUE_DISABLED';
  elsif not exists(select 1 from public.billiard_tables where id=s.table_id and status='ACTIVE') then cause:='TABLE_UNSERVICEABLE';
  elsif success_time>s.expires_at or r.provider_callback_received_at>s.expires_at then cause:='EXPIRED'; end if;
  if cause is not null then
   -- Credit and terminalization belong to the same command: helper bumps payment
   -- exactly once; do not increment it again below.
   perform private.sprint2_expire_locked(s.id,success_time,cause);
   return pg_catalog.jsonb_build_object('status','PAYMENT_NEEDS_RESOLUTION','receipt_id',r.id,'payment_id',p.id);
  elsif received>=s.required_amount_vnd then
   update public.payments set state='SUCCESS',payment_success_at=success_time,version=version+1,updated_at=success_time where id=p.id;
   update public.table_sessions set state='ACTIVE',started_at=success_time,version=version+1,updated_at=success_time where id=s.id;
   perform private.sprint2_audit('PAYMENT_SUCCEEDED','payments',p.id,s.venue_id,'Validated funds reached required initial amount',null,b||pg_catalog.jsonb_build_object('state','SUCCESS','payment_success_at',success_time,'version',(p.version+1)::text));
   perform private.sprint2_audit('TABLE_SESSION_OPENED','table_sessions',s.id,s.venue_id,'Automatic opening after payment',null,pg_catalog.jsonb_build_object('state','ACTIVE','started_at',success_time,'payment_id',p.id,'version',(s.version+1)::text));
   return pg_catalog.jsonb_build_object('status','SUCCESS','receipt_id',r.id,'payment_id',p.id);
  end if;
 elsif s.state='CANCELLED' then
  update public.payments set state='PAYMENT_NEEDS_RESOLUTION',resolution_reason=coalesce(resolution_reason,'LATE_RECEIPT'),version=version+1,updated_at=success_time where id=p.id;
  if p.state<>'PAYMENT_NEEDS_RESOLUTION' then perform private.sprint2_audit('PAYMENT_RESOLUTION_REQUIRED','payments',p.id,s.venue_id,'Late money cannot reopen a terminal hold',null,b||pg_catalog.jsonb_build_object('state','PAYMENT_NEEDS_RESOLUTION')); end if;
  return pg_catalog.jsonb_build_object('status','PAYMENT_NEEDS_RESOLUTION','receipt_id',r.id,'payment_id',p.id);
 end if;
 -- Partial or further true credit after SUCCESS. No second opening/timer reset.
 update public.payments set version=version+1,updated_at=success_time where id=p.id;
 return pg_catalog.jsonb_build_object('status','CREDIT_RECORDED','receipt_id',r.id,'payment_id',p.id);
end $$;
create function private.fail_payment_attempt(p_reference text,p_cause text) returns void language plpgsql security definer set search_path='' as $$
declare p public.payments; s public.table_sessions;
begin
 perform private.sprint2_lock();if p_cause<>'QR_FAILED' or p_cause is null then raise exception 'INVALID_FAILURE_CAUSE'; end if;
 select * into p from public.payments where reference=p_reference;
 if p.id is null then raise exception 'PAYMENT_NOT_FOUND'; end if;
 select * into s from public.table_sessions where id=p.session_id;
 perform 1 from public.profiles where id=s.customer_profile_id for update;
 perform 1 from public.billiard_tables where id=s.table_id for update;
 perform private.sprint2_expire_locked(s.id,pg_catalog.clock_timestamp(),p_cause);
end $$;
create function private.expire_table_holds(p_limit integer default 100) returns integer language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; count_expired integer:=0;
begin
 perform private.sprint2_lock();
 if p_limit is null or p_limit not between 1 and 1000 then raise exception 'INVALID_LIMIT'; end if;
 -- Lock each affected table first, in UUID order. No profile lock is acquired
 -- after a table lock: expiration never mutates or authenticates a profile.
 for s in select * from public.table_sessions where state='PENDING_PAYMENT' and expires_at<pg_catalog.clock_timestamp() order by table_id,id limit p_limit loop
  perform 1 from public.billiard_tables where id=s.table_id for update;
  perform private.sprint2_expire_locked(s.id,pg_catalog.clock_timestamp(),'EXPIRED');
  count_expired:=count_expired+1;
 end loop;
 return count_expired;
end $$;
create function private.sprint2_invalidate_pending() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; cause text;
begin
 if tg_table_name='profiles' then
  if new.account_status<>'DISABLED' or old.account_status=new.account_status then return new; end if;cause:='ACCOUNT_DISABLED';
 elsif tg_table_name='venues' then
  if new.is_enabled or old.is_enabled=new.is_enabled then return new; end if;cause:='VENUE_DISABLED';
 else
  if new.status='ACTIVE' or old.status=new.status then return new; end if;cause:='TABLE_UNSERVICEABLE';
 end if;
 -- Supported profile/venue writers already hold the frozen EXCLUSIVE barrier;
 -- table writer holds SHARED and its table row. Never acquire customer rows here.
 for s in select * from public.table_sessions where state='PENDING_PAYMENT' and
 ((tg_table_name='profiles' and customer_profile_id=new.id) or
 (tg_table_name='venues' and venue_id=new.id) or (tg_table_name='billiard_tables' and table_id=new.id)) order by table_id,id loop
  perform 1 from public.billiard_tables where id=s.table_id for update;
  perform private.sprint2_expire_locked(s.id,pg_catalog.clock_timestamp(),cause);
 end loop;
 return new;
end $$;
create trigger sprint2_account_invalidation after update of account_status on public.profiles for each row execute function private.sprint2_invalidate_pending();
create trigger sprint2_venue_invalidation after update of is_enabled on public.venues for each row execute function private.sprint2_invalidate_pending();
create trigger sprint2_table_invalidation after update of status on public.billiard_tables for each row execute function private.sprint2_invalidate_pending();

-- Cross-entity invariant checked at commit, after the atomic multi-row transition.
create function private.sprint2_validate_payment_session() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; p public.payments; sid uuid;
begin
 if tg_table_name='payments' then sid:=new.session_id; else sid:=new.id; end if;
 select * into s from public.table_sessions where id=sid;
 select * into p from public.payments where session_id=sid;
 if s.opening_method='MANUAL' then
  if p.id is not null then raise exception 'MANUAL_PAYMENT_FORBIDDEN'; end if;
 elsif p.id is null or (s.state='ACTIVE' and (p.state<>'SUCCESS' or s.started_at is distinct from p.payment_success_at or
  (private.sprint2_balances(p.id)->>'received_amount_vnd')::bigint<s.required_amount_vnd)) or
  (s.state<>'ACTIVE' and p.state='SUCCESS') or (s.state='PENDING_PAYMENT' and p.state<>'WAITING') or
  (s.state='CANCELLED' and p.state not in ('CANCELLED','PAYMENT_NEEDS_RESOLUTION')) then raise exception 'PAYMENT_SESSION_INVARIANT'; end if;
 return null;
end $$;
create constraint trigger sprint2_session_consistency after insert or update on public.table_sessions deferrable initially deferred for each row execute function private.sprint2_validate_payment_session();
create constraint trigger sprint2_payment_consistency after insert or update on public.payments deferrable initially deferred for each row execute function private.sprint2_validate_payment_session();

-- Freeze private helper privileges, grant only explicit entrypoints.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and (p.proname like 'sprint2_%' or p.proname in ('ingest_payment_event','fail_payment_attempt','expire_table_holds'))) or
 (n.nspname='public' and p.proname in ('public_tables','sprint2_access','own_table_sessions','table_operations','opening_payments','acquire_table','cancel_table_hold','manual_open_preview','open_table_manual','create_billiard_table','update_billiard_table','set_venue_management_contact')) loop
  execute pg_catalog.format('alter function %s owner to volume_core',f.signature);
  execute pg_catalog.format('revoke all on function %s from public,anon,authenticated,service_role,volume_payment_ingest',f.signature);
 end loop;
end $$;
grant execute on function public.public_tables(uuid) to anon,authenticated;
grant execute on function public.sprint2_access(uuid),public.own_table_sessions(),public.table_operations(uuid),public.opening_payments(uuid),
 public.acquire_table(uuid,bigint,uuid),public.cancel_table_hold(uuid,bigint,bigint),public.manual_open_preview(uuid,uuid),
 public.open_table_manual(uuid,uuid,bigint,uuid,text),public.create_billiard_table(uuid,text,text,bigint,text),
 public.update_billiard_table(uuid,bigint,text,text,bigint,text),public.set_venue_management_contact(uuid,bigint,text,text) to authenticated;
grant execute on function private.ingest_payment_event(jsonb),private.fail_payment_attempt(text,text),private.expire_table_holds(integer) to volume_payment_ingest;
revoke create on schema public,private from volume_core;
