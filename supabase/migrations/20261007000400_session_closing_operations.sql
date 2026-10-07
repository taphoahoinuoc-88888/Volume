-- Additive Sprint 3 authority. No Auth/security helper or opening RPC replacement.
grant create on schema public,private to volume_core;

create function private.sprint3_funds(p_session uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; pid uuid; bank numeric; cash numeric; issues text[]:='{}';
begin
 select * into s from public.table_sessions where id=p_session;
 if s.id is null then raise exception 'SESSION_NOT_FOUND'; end if;
 select id into pid from public.payments where session_id=s.id;
 select coalesce(pg_catalog.sum(amount_vnd::numeric),0) into bank from public.payment_receipts where payment_id=pid and kind='CREDIT';
 select coalesce(pg_catalog.sum(amount_vnd::numeric),0) into cash from public.session_cash_receipts where session_id=s.id;
 if bank+cash>9223372036854775807 then raise exception 'MONEY_OVERFLOW'; end if;
 if s.state='CLOSED' and bank>s.closure_bank_received_vnd then issues:=issues||array['LATE_BANK']; end if;
 if exists(select 1 from public.payment_receipts where payment_id=pid and kind<>'CREDIT') then issues:=issues||array['PROVIDER_NOTICE']; end if;
 if exists(select 1 from public.session_financial_issues where payment_id=pid) then issues:=issues||array['PROVIDER_CONFLICT']; end if;
 return pg_catalog.jsonb_build_object('received',(bank+cash)::bigint::text,'bank',bank::bigint::text,'issues',issues);
end $$;

create function private.sprint3_authorize(p_session uuid,p_own boolean,p_close boolean) returns public.profiles
language plpgsql security definer set search_path='' as $$
declare a public.profiles; s public.table_sessions;
begin
 a:=private.live_profile();select * into s from public.table_sessions where id=p_session;
 if s.id is null or p_own is null or p_close is null then raise exception 'ACCESS_DENIED'; end if;
 if p_own then
  if s.customer_profile_id is distinct from a.id or (p_close and s.opening_method<>'PAYMENT') then raise exception 'ACCESS_DENIED'; end if;
 elsif a.role not in ('ADMIN','CEO','MANAGER','STAFF') or not private.can_venue(s.venue_id) then raise exception 'ACCESS_DENIED'; end if;
 return a;
end $$;
create function private.sprint3_lock_session(p_session uuid) returns void language plpgsql security definer set search_path='' as $$
declare s public.table_sessions;
begin
 -- Caller acquires shared barrier and any economic identity lock first.
 select * into s from public.table_sessions where id=p_session;
 if s.id is null then raise exception 'ACCESS_DENIED'; end if;
 perform 1 from public.profiles where id in (private.request_user_id(),s.customer_profile_id) order by id for update;
 perform 1 from public.billiard_tables where id=s.table_id for update;
 perform 1 from public.table_sessions where id=s.id for update;
 perform 1 from public.payments where session_id=s.id for update;
end $$;
create function private.sprint3_check_versions(p_session uuid,p_session_version bigint,p_payment_version bigint,p_table_version bigint,p_venue_version bigint)
returns void language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; pv bigint; tv bigint; vv bigint;
begin
 select * into s from public.table_sessions where id=p_session;
 select version into pv from public.payments where session_id=s.id;
 select version into tv from public.billiard_tables where id=s.table_id;
 select version into vv from public.venues where id=s.venue_id;
 perform private.check_version(s.version,p_session_version);
 perform private.check_version(tv,p_table_version);perform private.check_version(vv,p_venue_version);
 if s.opening_method='PAYMENT' then perform private.check_version(pv,p_payment_version);
 elsif p_payment_version is not null then raise exception 'VERSION_CONFLICT'; end if;
end $$;

create function private.sprint3_project(p_session uuid,p_own boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; s public.table_sessions; t public.billiard_tables; v public.venues; f jsonb; b jsonb; financial jsonb; n timestamptz;
 issues text[]; pv bigint; customer_name text; result jsonb;
begin
 a:=private.sprint3_authorize(p_session,p_own,false);
 select * into s from public.table_sessions where id=p_session;
 if s.state not in ('ACTIVE','CLOSED') then raise exception 'SESSION_NOT_PLAYED'; end if;
 select * into t from public.billiard_tables where id=s.table_id;select * into v from public.venues where id=s.venue_id;
 select version into pv from public.payments where session_id=s.id;
 select display_name into customer_name from public.profiles where id=s.customer_profile_id;
 f:=private.sprint3_funds(s.id);select coalesce(pg_catalog.array_agg(x),'{}') into issues from pg_catalog.jsonb_array_elements_text(f->'issues') x;
 n:=pg_catalog.clock_timestamp();
 if s.state='ACTIVE' then b:=private.sprint3_bill(s.required_amount_vnd,extract(epoch from (n-s.started_at))*1000000);
 else b:=pg_catalog.jsonb_build_object('duration_microseconds',s.duration_microseconds::text,'billable_minutes',s.billable_minutes::text,'final_charge_vnd',s.final_charge_vnd::text); end if;
 financial:=private.sprint3_financial((b->>'final_charge_vnd')::bigint,(f->>'received')::bigint,issues);
 result:=financial||pg_catalog.jsonb_build_object('id',s.id,'table_id',t.id,'venue_id',v.id,'table_label',t.label,'venue_name',v.name,
 'opening_method',s.opening_method,'state',s.state,'customer',case when s.customer_profile_id is null then null else pg_catalog.jsonb_build_object('id',s.customer_profile_id,'display_name',customer_name) end,
 'started_at',s.started_at,'ended_at',s.ended_at,'server_now',n,'duration_microseconds',b->>'duration_microseconds','billable_minutes',b->>'billable_minutes',
 'hourly_snapshot_vnd',s.required_amount_vnd::text,'charge_vnd',b->>'final_charge_vnd','is_estimate',s.state='ACTIVE','released',s.state='CLOSED',
 'session_version',s.version::text,'payment_version',pv::text,'table_version',t.version::text,'venue_version',v.version::text,
 'can_close',s.state='ACTIVE' and (not p_own or s.opening_method='PAYMENT'),'can_record_cash',not p_own,
 'closed_actor_role',s.closed_actor_role,'close_correlation_id',s.close_correlation_id,
 'closure_financial',case when s.state='CLOSED' then private.sprint3_financial(s.final_charge_vnd,s.closure_received_vnd,pg_catalog.array_remove(s.closure_issues,'EXCESS')) else null end,
 'provider_available',false);
 if not p_own then result:=result||pg_catalog.jsonb_build_object('closed_by',s.closed_by,'close_reason',s.close_reason); end if;
 return result;
end $$;
create function public.own_session_financial(p_session uuid) returns jsonb language sql security definer set search_path='' as $$ select private.sprint3_project(p_session,true) $$;
create function public.session_financial(p_session uuid) returns jsonb language sql security definer set search_path='' as $$ select private.sprint3_project(p_session,false) $$;
create function public.session_financial_operations(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; result jsonb;
begin
 a:=private.live_profile();
 if a.role not in ('ADMIN','CEO','MANAGER','STAFF') or (p_venue is not null and not private.can_venue(p_venue)) then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(pg_catalog.jsonb_agg(private.sprint3_project(s.id,false) order by s.created_at desc,s.id),'[]') into result
 from public.table_sessions s where s.state in ('ACTIVE','CLOSED') and (p_venue is null or s.venue_id=p_venue) and private.can_venue(s.venue_id);
 return result;
end $$;

create function private.sprint3_audit(p_action text,p_target_type text,p_target uuid,p_venue uuid,p_reason text,p_before jsonb,p_after jsonb,p_source text,p_correlation uuid)
returns void language plpgsql security definer set search_path='' as $$
declare a public.profiles; payload jsonb; k text;
begin
 perform private.check_reason(p_reason);
 if p_action not in ('TABLE_SESSION_CLOSED','SESSION_CASH_RECORDED','SESSION_FINANCIAL_CONFLICT') or p_correlation is null or
 p_source not in ('CUSTOMER_WEB','CONTROL_CENTER','SYSTEM') or (p_source='SYSTEM' and p_action<>'SESSION_FINANCIAL_CONFLICT') then raise exception 'INVALID_AUDIT_ACTION'; end if;
 foreach payload in array array[p_before,p_after] loop
  if payload is not null then
   if pg_catalog.jsonb_typeof(payload)<>'object' then raise exception 'INVALID_AUDIT_PAYLOAD'; end if;
   for k in select pg_catalog.jsonb_object_keys(payload) loop
    if k not in ('session_id','table_id','payment_id','receipt_id','state','version','ended_at','duration_microseconds','billable_minutes',
     'hourly_snapshot_vnd','final_charge_vnd','validated_received_vnd','applied_amount_vnd','remaining_due_vnd','unresolved_excess_vnd','settlement_status','issues','amount_vnd') then raise exception 'INVALID_AUDIT_PAYLOAD'; end if;
   end loop;
  end if;
 end loop;
 if p_source<>'SYSTEM' then a:=private.live_profile(); end if;
 insert into public.audit_events(actor_id,actor_role,source,category,action,target_type,target_id,venue_id,reason,before_data,after_data,correlation_id)
 values(a.id,a.role,p_source,'BUSINESS',p_action,p_target_type,p_target,p_venue,p_reason,p_before,p_after,p_correlation);
end $$;

create function private.sprint3_close(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint,p_reason text,p_own boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; s public.table_sessions; n timestamptz; b jsonb; f jsonb; fin jsonb; issues text[]; all_issues text[]; corr uuid; source text;
begin
 perform private.sprint2_lock();a:=private.sprint3_authorize(p_session,p_own,true);
 perform private.sprint3_lock_session(p_session);a:=private.sprint3_authorize(p_session,p_own,true);
 perform private.sprint3_check_versions(p_session,p_expected_session_version,p_expected_payment_version,p_expected_table_version,p_expected_venue_version);
 select * into s from public.table_sessions where id=p_session;
 if s.state='CLOSED' then raise exception 'ALREADY_CLOSED'; end if;
 if s.state<>'ACTIVE' then raise exception 'SESSION_NOT_PLAYED'; end if;
 perform private.check_reason(p_reason);
 f:=private.sprint3_funds(s.id);select coalesce(pg_catalog.array_agg(x),'{}') into issues from pg_catalog.jsonb_array_elements_text(f->'issues') x;
 corr:=pg_catalog.gen_random_uuid();source:=case when p_own then 'CUSTOMER_WEB' else 'CONTROL_CENTER' end;
 -- Authoritative closing transition after all waits, authorization, CAS and funds reads.
 n:=pg_catalog.clock_timestamp();b:=private.sprint3_bill(s.required_amount_vnd,extract(epoch from (n-s.started_at))*1000000);
 fin:=private.sprint3_financial((b->>'final_charge_vnd')::bigint,(f->>'received')::bigint,issues);
 select coalesce(pg_catalog.array_agg(x),'{}') into all_issues from pg_catalog.jsonb_array_elements_text(fin->'issues') x;
 update public.table_sessions set state='CLOSED',ended_at=n,duration_microseconds=(b->>'duration_microseconds')::bigint,
 billable_minutes=(b->>'billable_minutes')::bigint,final_charge_vnd=(b->>'final_charge_vnd')::bigint,
 closed_by=a.id,closed_actor_role=a.role,close_source=source,close_reason=p_reason,close_correlation_id=corr,
 closure_received_vnd=(f->>'received')::bigint,closure_bank_received_vnd=(f->>'bank')::bigint,closure_issues=all_issues,
 version=version+1,updated_at=n where id=s.id;
 perform private.sprint3_audit('TABLE_SESSION_CLOSED','table_sessions',s.id,s.venue_id,p_reason,
 pg_catalog.jsonb_build_object('state','ACTIVE','version',s.version::text),fin||b||pg_catalog.jsonb_build_object('session_id',s.id,'table_id',s.table_id,'state','CLOSED','version',(s.version+1)::text,'ended_at',n,'hourly_snapshot_vnd',s.required_amount_vnd::text),source,corr);
 return private.sprint3_project(s.id,p_own);
end $$;
create function public.close_own_table_session(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint)
returns jsonb language sql security definer set search_path='' as $$
 select private.sprint3_close(p_session,p_expected_session_version,p_expected_payment_version,p_expected_table_version,p_expected_venue_version,'Customer confirmed session close',true)
$$;
create function public.close_table_session(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint,p_reason text)
returns jsonb language sql security definer set search_path='' as $$
 select private.sprint3_close(p_session,p_expected_session_version,p_expected_payment_version,p_expected_table_version,p_expected_venue_version,p_reason,false)
$$;

create function public.session_cash_result(p_session uuid,p_receipt_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.session_cash_receipts;
begin
 perform private.sprint3_authorize(p_session,false,false);
 select * into r from public.session_cash_receipts where id=p_receipt_id and session_id=p_session;
 if r.id is null then return null; end if;
 return pg_catalog.jsonb_build_object('id',r.id,'session_id',r.session_id,'amount_vnd',r.amount_vnd::text,'actor_id',r.actor_id,'actor_role',r.actor_role,'created_at',r.created_at,'correlation_id',r.correlation_id);
end $$;
create function public.record_session_cash(p_session uuid,p_expected_session_version bigint,p_expected_payment_version bigint,p_expected_table_version bigint,p_expected_venue_version bigint,p_receipt_id uuid,p_amount_vnd text,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; s public.table_sessions; r public.session_cash_receipts; amount numeric; corr uuid;
begin
 perform private.sprint2_lock();a:=private.sprint3_authorize(p_session,false,false);
 if p_receipt_id is null or p_amount_vnd is null or p_amount_vnd!~'^[0-9]+$' or pg_catalog.length(p_amount_vnd)>19 then raise exception 'INVALID_CASH_AMOUNT'; end if;
 amount:=p_amount_vnd::numeric;if amount<=0 or amount>9223372036854775807 then raise exception 'INVALID_CASH_AMOUNT'; end if;
 perform private.check_reason(p_reason);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_receipt_id::text,20261008));
 perform private.sprint3_lock_session(p_session);a:=private.sprint3_authorize(p_session,false,false);
 perform private.sprint3_check_versions(p_session,p_expected_session_version,p_expected_payment_version,p_expected_table_version,p_expected_venue_version);
 select * into s from public.table_sessions where id=p_session;
 if s.state not in ('ACTIVE','CLOSED') then raise exception 'SESSION_NOT_PLAYED'; end if;
 select * into r from public.session_cash_receipts where id=p_receipt_id;
 if r.id is not null then
  if row(r.session_id,r.actor_id,r.amount_vnd,r.reason) is distinct from row(s.id,a.id,amount::bigint,p_reason) then raise exception 'CASH_IDENTITY_CONFLICT'; end if;
  return pg_catalog.jsonb_build_object('status','NO_CHANGE','receipt',public.session_cash_result(s.id,r.id));
 end if;
 corr:=pg_catalog.gen_random_uuid();
 insert into public.session_cash_receipts(id,session_id,amount_vnd,actor_id,actor_role,reason,correlation_id)
 values(p_receipt_id,s.id,amount::bigint,a.id,a.role,p_reason,corr);
 perform private.sprint3_funds(s.id);
 update public.table_sessions set version=version+1,updated_at=pg_catalog.clock_timestamp() where id=s.id;
 perform private.sprint3_audit('SESSION_CASH_RECORDED','session_cash_receipts',p_receipt_id,s.venue_id,p_reason,
 pg_catalog.jsonb_build_object('session_id',s.id,'version',s.version::text),
 pg_catalog.jsonb_build_object('session_id',s.id,'receipt_id',p_receipt_id,'amount_vnd',amount::bigint::text,'version',(s.version+1)::text),'CONTROL_CENTER',corr);
 return pg_catalog.jsonb_build_object('status','RECORDED','receipt',public.session_cash_result(s.id,p_receipt_id));
end $$;

create function private.sprint3_credit_bound() returns trigger language plpgsql security definer set search_path='' as $$
declare sid uuid; bound uuid;
begin
 if tg_table_name='session_cash_receipts' then
  sid:=new.session_id;
  if not exists(select 1 from public.table_sessions where id=sid and state in ('ACTIVE','CLOSED')) then raise exception 'SESSION_NOT_PLAYED'; end if;
 elsif tg_table_name='session_financial_issues' then
  select payment_id into bound from public.payment_receipts where id=new.receipt_id;
  if bound is distinct from new.payment_id then raise exception 'ISSUE_BINDING_CONFLICT'; end if;
  select session_id into sid from public.payments where id=new.payment_id;
 else select session_id into sid from public.payments where id=new.payment_id;
 end if;
 if sid is not null then perform private.sprint3_funds(sid); end if;return null;
end $$;
create constraint trigger cash_credit_bound after insert on public.session_cash_receipts deferrable initially immediate for each row execute function private.sprint3_credit_bound();
create constraint trigger bank_credit_bound after insert on public.payment_receipts deferrable initially immediate for each row execute function private.sprint3_credit_bound();
create constraint trigger financial_issue_binding after insert on public.session_financial_issues deferrable initially immediate for each row execute function private.sprint3_credit_bound();

-- Original checks retained, extending successful played sessions to CLOSED only.
create or replace function private.sprint2_validate_payment_session() returns trigger language plpgsql security definer set search_path='' as $$
declare s public.table_sessions; p public.payments; sid uuid;
begin
 if tg_table_name='payments' then sid:=new.session_id; else sid:=new.id; end if;
 select * into s from public.table_sessions where id=sid;select * into p from public.payments where session_id=sid;
 if s.opening_method='MANUAL' then
  if p.id is not null then raise exception 'MANUAL_PAYMENT_FORBIDDEN'; end if;
 elsif p.id is null or (s.state in ('ACTIVE','CLOSED') and (p.state<>'SUCCESS' or s.started_at is distinct from p.payment_success_at or
  (private.sprint2_balances(p.id)->>'received_amount_vnd')::bigint<s.required_amount_vnd)) or
  (s.state not in ('ACTIVE','CLOSED') and p.state='SUCCESS') or (s.state='PENDING_PAYMENT' and p.state<>'WAITING') or
  (s.state='CANCELLED' and p.state not in ('CANCELLED','PAYMENT_NEEDS_RESOLUTION')) then raise exception 'PAYMENT_SESSION_INVARIANT'; end if;
 return null;
end $$;

create function private.sprint3_ingest_payment_event(p_event jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.payment_receipts; s public.table_sessions; pid uuid; conflict_fingerprint text; issue_id uuid; key text;
begin
 perform private.sprint2_lock();
 key:=pg_catalog.jsonb_build_array(p_event->>'provider',p_event->>'recipient_scope',coalesce(p_event->>'external_transaction_id',p_event->>'external_event_id'))::text;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(key,20261007));
 begin
  return private.ingest_payment_event(p_event);
 exception when raise_exception then
  if sqlerrm<>'PAYMENT_IDENTITY_CONFLICT' then raise; end if;
 end;
 select * into r from public.payment_receipts where provider=p_event->>'provider' and recipient_scope=p_event->>'recipient_scope' and
 (external_event_id=p_event->>'external_event_id' or (kind='CREDIT' and p_event->>'kind'='CREDIT' and external_transaction_id=p_event->>'external_transaction_id')) order by created_at limit 1;
 if r.payment_id is null then return pg_catalog.jsonb_build_object('status','REJECTED_CONFLICT'); end if;
 select session_id into pid from public.payments where id=r.payment_id;
 perform private.sprint3_lock_session(pid);select * into s from public.table_sessions where id=pid;
 conflict_fingerprint:=pg_catalog.md5(pg_catalog.jsonb_build_array(p_event->>'reference',p_event->>'kind',p_event->>'amount_vnd',p_event->>'currency',p_event->>'external_transaction_id',p_event->>'provider_occurred_at',p_event->>'evidence_digest')::text);
 if exists(select 1 from public.session_financial_issues where receipt_id=r.id and session_financial_issues.fingerprint=conflict_fingerprint) then
  return pg_catalog.jsonb_build_object('status','REJECTED_CONFLICT');
 end if;
 insert into public.session_financial_issues(payment_id,receipt_id,fingerprint,kind) values(r.payment_id,r.id,conflict_fingerprint,'PROVIDER_CONFLICT') returning id into issue_id;
 update public.table_sessions set version=version+1,updated_at=pg_catalog.clock_timestamp() where id=s.id;
 perform private.sprint3_audit('SESSION_FINANCIAL_CONFLICT','session_financial_issues',issue_id,s.venue_id,'Conflicting validated provider evidence',null,
 pg_catalog.jsonb_build_object('session_id',s.id,'payment_id',r.payment_id,'receipt_id',r.id,'version',(s.version+1)::text),'SYSTEM',pg_catalog.gen_random_uuid());
 return pg_catalog.jsonb_build_object('status','REJECTED_CONFLICT');
end $$;

do $$ declare f record;begin
 for f in select p.oid::regprocedure signature from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and p.proname like 'sprint3_%') or (n.nspname='public' and p.proname in
 ('own_session_financial','session_financial','session_financial_operations','close_own_table_session','close_table_session','record_session_cash','session_cash_result')) loop
  execute pg_catalog.format('alter function %s owner to volume_core',f.signature);
  execute pg_catalog.format('revoke all on function %s from public,anon,authenticated,service_role,volume_payment_ingest',f.signature);
 end loop;
end $$;
grant execute on function public.own_session_financial(uuid),public.session_financial(uuid),public.session_financial_operations(uuid),
 public.close_own_table_session(uuid,bigint,bigint,bigint,bigint),public.close_table_session(uuid,bigint,bigint,bigint,bigint,text),
 public.record_session_cash(uuid,bigint,bigint,bigint,bigint,uuid,text,text),public.session_cash_result(uuid,uuid) to authenticated;
grant execute on function private.sprint3_ingest_payment_event(jsonb) to volume_payment_ingest;
revoke create on schema public,private from volume_core;
