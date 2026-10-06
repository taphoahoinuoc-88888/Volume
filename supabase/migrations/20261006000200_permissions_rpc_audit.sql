-- Every private/internal entry reads live authority, not editable metadata.
create function private.live_profile() returns public.profiles language plpgsql security definer set search_path='' as $$
declare p public.profiles; sid uuid;
begin
 sid := (auth.jwt()->>'session_id')::uuid;
 select * into p from public.profiles where id=auth.uid() and account_status='ACTIVE';
 if p.id is null or sid is null or not exists(select 1 from auth.sessions s where s.id=sid and s.user_id=p.id and (p.sessions_revoked_before is null or s.created_at>p.sessions_revoked_before)) then raise exception 'ACCESS_DENIED'; end if;
 return p;
end $$;
create function private.live_self(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin return (private.live_profile()).id=p_id; exception when others then return false; end $$;
create function private.can_venue(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 p:=private.live_profile();
 return p.role in ('ADMIN','CEO') or (p.role in ('MANAGER','STAFF') and exists(select 1 from public.staff_memberships where profile_id=p.id and venue_id=p_id and status='ACTIVE'));
end $$;
create function private.can_directory(p_venue uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 p:=private.live_profile();
 return p.role in ('ADMIN','CEO') or (p.role='MANAGER' and private.can_venue(p_venue)) or (p.role='STAFF' and exists(select 1 from public.staff_memberships where profile_id=p.id and venue_id=p_venue and status='ACTIVE' and 'STAFF_DIRECTORY_READ'=any(extra_permissions)));
end $$;
-- Serialize security writes and row-lock caller, then re-check authority after locks.
-- Same lock order for every mutation prevents last-Admin and permission-write races.
create function private.writer() returns public.profiles language plpgsql security definer set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(20261006,1);
 perform 1 from public.profiles where id=auth.uid() for update;
 return private.live_profile();
end $$;
create function private.check_version(actual bigint,expected bigint) returns void language plpgsql set search_path='' as $$
begin if expected is null or actual is null or actual<>expected then raise exception 'VERSION_CONFLICT'; end if; end $$;
create function private.check_reason(reason text) returns void language plpgsql set search_path='' as $$
begin if reason is null or length(btrim(reason)) not between 1 and 500 then raise exception 'INVALID_REASON'; end if; end $$;
create function private.profile_audit(p public.profiles) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',p.id,'role',p.role,'account_status',p.account_status,'version',p.version::text)
$$;
create function private.membership_audit(m public.staff_memberships) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',m.id,'profile_id',m.profile_id,'venue_id',m.venue_id,'status',m.status,'extra_permissions',m.extra_permissions,'version',m.version::text)
$$;
create function private.venue_audit(v public.venues) returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('id',v.id,'code',v.code,'name',v.name,'public_address',v.public_address,'timezone',v.timezone,'is_public',v.is_public,'is_enabled',v.is_enabled,'version',v.version::text)
$$;
create function private.log_event(category text,action text,target_type text,target_id uuid,venue_id uuid,reason text,before_data jsonb,after_data jsonb,source text default 'CONTROL_CENTER') returns void language plpgsql security definer set search_path='' as $$
declare actor public.profiles;
begin
 actor:=private.live_profile();
 insert into public.audit_events(actor_id,actor_role,source,category,action,target_type,target_id,venue_id,reason,before_data,after_data)
 values(actor.id,actor.role,source,category,action,target_type,target_id,venue_id,reason,before_data,after_data);
end $$;
create function private.protect_last_admin(target public.profiles,new_role text,new_status text) returns void language plpgsql set search_path='' as $$
begin
 if target.role='ADMIN' and target.account_status='ACTIVE' and (new_role<>'ADMIN' or new_status<>'ACTIVE') and not exists(select 1 from public.profiles where role='ADMIN' and account_status='ACTIVE' and id<>target.id) then raise exception 'LAST_ACTIVE_ADMIN'; end if;
end $$;

create function public.public_venues() returns table(id uuid,code text,name text,public_address text,timezone text) language sql security definer set search_path='' as $$
 select id,code,name,public_address,timezone from public.venues where is_public and is_enabled order by code
$$;
create function public.current_access() returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles; vs jsonb; ms jsonb; perms text[];
begin
 p:=private.live_profile();
 perms:=array['OWN_PROFILE_READ','OWN_PROFILE_UPDATE','PUBLIC_VENUES_READ','OWN_SESSIONS_REVOKE'];
 if p.role in ('ADMIN','CEO','MANAGER','STAFF') then perms:=perms||array['INTERNAL_VENUES_READ','MEMBERSHIPS_READ']; end if;
 if p.role in ('ADMIN','CEO','MANAGER') then perms:=perms||array['STAFF_DIRECTORY_READ','BUSINESS_AUDIT_READ']; end if;
 if p.role='ADMIN' then perms:=perms||array['SECURITY_AUDIT_READ','VENUES_MANAGE','ACCESS_MANAGE','ACCOUNT_STATUS_MANAGE','AUTH_ACCOUNTS_PROVISION']; end if;
 select coalesce(jsonb_agg(case when p.role='STAFF' then jsonb_build_object('id',v.id,'code',v.code,'name',v.name,'timezone',v.timezone,'is_enabled',v.is_enabled) else private.venue_audit(v) end),'[]') into vs from public.venues v where private.can_venue(v.id);
 select coalesce(jsonb_agg(private.membership_audit(m)),'[]') into ms from public.staff_memberships m where m.profile_id=p.id and p.role in ('MANAGER','STAFF');
 return jsonb_build_object('profile',jsonb_build_object('id',p.id,'display_name',p.display_name,'role',p.role,'account_status',p.account_status,'version',p.version::text),'permissions',perms,'venues',vs,'memberships',ms);
end $$;
create function public.staff_directory(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.can_directory(p_venue) then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'display_name',p.display_name,'role',p.role,'venue_id',m.venue_id,'membership_id',m.id,'status',m.status,'version',m.version::text,'profile_version',p.version::text)),'[]') into result
 from public.staff_memberships m join public.profiles p on p.id=m.profile_id where m.venue_id=p_venue;
 return result;
end $$;
create function public.membership_directory(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles; result jsonb;
begin
 p:=private.live_profile();
 if not private.can_venue(p_venue) then raise exception 'ACCESS_DENIED'; end if;
 if p.role='ADMIN' then
 select coalesce(jsonb_agg(private.membership_audit(m)||jsonb_build_object('profile_version',t.version::text,'role',t.role,'display_name',t.display_name)),'[]') into result from public.staff_memberships m join public.profiles t on t.id=m.profile_id where m.venue_id=p_venue;
 elsif p.role in ('CEO','MANAGER') then return public.staff_directory(p_venue);
 else select coalesce(jsonb_agg(private.membership_audit(m)),'[]') into result from public.staff_memberships m where m.venue_id=p_venue and m.profile_id=p.id; end if;
 return result;
end $$;
create function public.audit_feed(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles; result jsonb;
begin
 p:=private.live_profile();
 if p.role not in ('ADMIN','CEO','MANAGER') then raise exception 'ACCESS_DENIED'; end if;
 if p.role='MANAGER' and (p_venue is null or not private.can_venue(p_venue)) then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at),'[]') into result from public.audit_events a where (p_venue is null or a.venue_id=p_venue) and (p.role='ADMIN' or a.category='BUSINESS');
 return result;
end $$;
create function public.update_own_profile(p_display_name text,expected_version bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 p:=private.writer(); perform private.check_version(p.version,expected_version);
 if p.display_name is not distinct from p_display_name then return jsonb_build_object('status','NO_CHANGE','version',p.version::text); end if;
 update public.profiles set display_name=p_display_name,version=version+1,updated_at=clock_timestamp() where id=p.id returning * into p;
 return jsonb_build_object('status','UPDATED','version',p.version::text);
end $$;
create function public.update_venue(p_id uuid,expected_version bigint,p_code text,p_name text,p_public_address text,p_timezone text,p_is_public boolean,p_is_enabled boolean,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; v public.venues; old public.venues; action text;
begin
 a:=private.writer(); if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED'; end if; perform private.check_reason(p_reason);
 if p_id is null then
  if expected_version is not null then raise exception 'VERSION_CONFLICT'; end if;
  insert into public.venues(code,name,public_address,timezone,is_public,is_enabled) values(p_code,p_name,p_public_address,p_timezone,p_is_public,p_is_enabled) returning * into v; action:='VENUE_CREATED';
 else
  select * into old from public.venues where id=p_id for update; perform private.check_version(old.version,expected_version);
  if row(old.code,old.name,old.public_address,old.timezone,old.is_public,old.is_enabled) is not distinct from row(p_code,p_name,p_public_address,p_timezone,p_is_public,p_is_enabled) then return jsonb_build_object('status','NO_CHANGE','version',old.version::text); end if;
  update public.venues set code=p_code,name=p_name,public_address=p_public_address,timezone=p_timezone,is_public=p_is_public,is_enabled=p_is_enabled,version=version+1,updated_at=clock_timestamp() where id=p_id returning * into v; action:='VENUE_UPDATED';
 end if;
 perform private.log_event('BUSINESS',action,'venues',v.id,v.id,p_reason,case when old.id is null then null else private.venue_audit(old) end,private.venue_audit(v));
 return jsonb_build_object('status',case when old.id is null then 'CREATED' else 'UPDATED' end,'venue',private.venue_audit(v));
end $$;
-- p_memberships is a complete explicit change-set, not a permission builder.
-- Existing rows mutated (including downgrade inactivation) require their own versions.
create function public.update_access(p_profile_id uuid,expected_version bigint,p_role text,p_memberships jsonb,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; t public.profiles; old public.profiles; m public.staff_memberships; prev public.staff_memberships; item jsonb; extras text[]; changed boolean:=false; new_status text; new_venue uuid;
begin
 a:=private.writer(); if a.role<>'ADMIN' or p_profile_id=a.id then raise exception 'ACCESS_DENIED'; end if;
 perform private.check_reason(p_reason);
 select * into old from public.profiles where id=p_profile_id for update; perform private.check_version(old.version,expected_version);
 if p_role is null or p_role not in ('ADMIN','CEO','MANAGER','STAFF','USER') or jsonb_typeof(p_memberships)<>'array' then raise exception 'INVALID_ACCESS'; end if;
 perform private.protect_last_admin(old,p_role,old.account_status);
 -- Lock and CAS every existing row named in the change-set before any writes.
 for item in select value from jsonb_array_elements(p_memberships) loop
  if (item->>'id') is not null then
   select * into prev from public.staff_memberships where id=(item->>'id')::uuid and profile_id=old.id for update;
   perform private.check_version(prev.version,(item->>'expected_version')::bigint);
  elsif item ? 'expected_version' and item->>'expected_version' is not null then raise exception 'VERSION_CONFLICT'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_memberships) e group by e->>'venue_id' having count(*)>1) or exists(select 1 from jsonb_array_elements(p_memberships) e where e->>'id' is not null group by e->>'id' having count(*)>1) then raise exception 'DUPLICATE_CHANGE'; end if;
 if p_role not in ('MANAGER','STAFF') and exists(select 1 from public.staff_memberships m where m.profile_id=old.id and (m.status='ACTIVE' or cardinality(m.extra_permissions)>0) and not exists(select 1 from jsonb_array_elements(p_memberships) e where e->>'id'=m.id::text and e->>'status'='INACTIVE' and e->'extra_permissions'='[]'::jsonb)) then raise exception 'MEMBERSHIP_VERSIONS_REQUIRED'; end if;
 -- Transition out of staff roles: inactivate first so eligibility trigger remains correct.
 for item in select value from jsonb_array_elements(p_memberships) loop
  if p_role not in ('MANAGER','STAFF') and (item->>'status'<>'INACTIVE' or item->'extra_permissions'<>'[]'::jsonb) then raise exception 'INELIGIBLE_MEMBERSHIP'; end if;
 end loop;
 -- Defer role update until before inserts when target becomes staff, or after inactivation otherwise.
 if p_role in ('MANAGER','STAFF') and old.role<>p_role then update public.profiles set role=p_role where id=old.id; end if;
 for item in select value from jsonb_array_elements(p_memberships) loop
  new_venue:=(item->>'venue_id')::uuid; new_status:=item->>'status';
  if jsonb_typeof(item->'extra_permissions')<>'array' then raise exception 'INVALID_PERMISSION'; end if;
  select coalesce(array_agg(value),'{}') into extras from jsonb_array_elements_text(item->'extra_permissions');
  if (item->>'id') is null then
   insert into public.staff_memberships(profile_id,venue_id,status,extra_permissions) values(old.id,new_venue,new_status,extras) returning * into m;
   perform private.log_event('SECURITY','MEMBERSHIP_CREATED','staff_memberships',m.id,m.venue_id,p_reason,null,private.membership_audit(m)); changed:=true;
  else
   select * into prev from public.staff_memberships where id=(item->>'id')::uuid;
   if row(prev.venue_id,prev.status,prev.extra_permissions) is distinct from row(new_venue,new_status,extras) then
    update public.staff_memberships set venue_id=new_venue,status=new_status,extra_permissions=extras,version=version+1,updated_at=clock_timestamp() where id=prev.id returning * into m;
    perform private.log_event('SECURITY','MEMBERSHIP_UPDATED','staff_memberships',m.id,m.venue_id,p_reason,private.membership_audit(prev),private.membership_audit(m)); changed:=true;
   end if;
  end if;
 end loop;
 if not changed and old.role=p_role then return jsonb_build_object('status','NO_CHANGE','version',old.version::text); end if;
 update public.profiles set role=p_role,version=version+1,updated_at=clock_timestamp(),sessions_revoked_before=clock_timestamp() where id=old.id returning * into t;
 if old.role<>p_role then perform private.log_event('SECURITY','ROLE_CHANGED','profiles',t.id,null,p_reason,private.profile_audit(old),private.profile_audit(t)); end if;
 return jsonb_build_object('status','UPDATED','version',t.version::text);
end $$;
create function public.set_account_status(p_profile_id uuid,expected_version bigint,p_status text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; old public.profiles; t public.profiles;
begin
 a:=private.writer(); if a.role<>'ADMIN' or p_profile_id=a.id then raise exception 'ACCESS_DENIED'; end if; perform private.check_reason(p_reason);
 select * into old from public.profiles where id=p_profile_id for update; perform private.check_version(old.version,expected_version);
 perform private.protect_last_admin(old,old.role,p_status);
 if old.account_status is not distinct from p_status then return jsonb_build_object('status','NO_CHANGE','version',old.version::text); end if;
 update public.profiles set account_status=p_status,version=version+1,updated_at=clock_timestamp(),sessions_revoked_before=clock_timestamp() where id=old.id returning * into t;
 perform private.log_event('SECURITY','ACCOUNT_STATUS_CHANGED','profiles',t.id,null,p_reason,private.profile_audit(old),private.profile_audit(t));
 return jsonb_build_object('status','UPDATED','version',t.version::text);
end $$;
create function public.set_staff_membership_status(p_id uuid,expected_version bigint,expected_profile_version bigint,p_status text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; old public.staff_memberships; m public.staff_memberships; t public.profiles;
begin
 a:=private.writer(); perform private.check_reason(p_reason);
 select * into old from public.staff_memberships where id=p_id for update;
 select * into t from public.profiles where id=old.profile_id for update;
 if t.id=a.id or t.role<>'STAFF' or a.role not in ('MANAGER','STAFF') or not exists(select 1 from public.staff_memberships where profile_id=a.id and venue_id=old.venue_id and status='ACTIVE' and 'STAFF_MEMBERSHIP_STATUS_MANAGE'=any(extra_permissions)) then raise exception 'ACCESS_DENIED'; end if;
 perform private.check_version(old.version,expected_version); perform private.check_version(t.version,expected_profile_version);
 if old.status is not distinct from p_status then return jsonb_build_object('status','NO_CHANGE','version',old.version::text); end if;
 update public.staff_memberships set status=p_status,version=version+1,updated_at=clock_timestamp() where id=p_id returning * into m;
 update public.profiles set sessions_revoked_before=clock_timestamp(),updated_at=clock_timestamp(),version=version+1 where id=t.id;
 perform private.log_event('SECURITY','MEMBERSHIP_STATUS_CHANGED','staff_memberships',m.id,m.venue_id,p_reason,private.membership_audit(old),private.membership_audit(m));
 return jsonb_build_object('status','UPDATED','version',m.version::text,'profile_version',(t.version+1)::text);
end $$;
create function public.revoke_own_sessions(expected_version bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 p:=private.writer(); perform private.check_version(p.version,expected_version);
 -- Audit before cutoff within the same transaction; after cutoff caller is revoked too.
 perform private.log_event('SECURITY','SESSIONS_REVOKED','profiles',p.id,null,'Self session revocation',jsonb_build_object('profile_id',p.id,'revoked',false),jsonb_build_object('profile_id',p.id,'revoked',true),'CUSTOMER_WEB');
 update public.profiles set version=version+1,updated_at=clock_timestamp(),sessions_revoked_before=clock_timestamp() where id=p.id;
 return jsonb_build_object('status','UPDATED','version',(p.version+1)::text);
end $$;

-- Safe direct self read with column grants plus RLS; no full-table/column privilege.
grant usage on schema private to authenticated;
grant select(id,display_name,role,account_status,version) on public.profiles to authenticated;
create policy self_profile_read on public.profiles for select to authenticated using(private.live_self(id));
-- Function owners are neither postgres nor BYPASSRLS; helpers not exposed by PostgREST.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' or (n.nspname='public' and p.proname in ('public_venues','current_access','staff_directory','membership_directory','audit_feed','update_own_profile','update_venue','update_access','set_account_status','set_staff_membership_status','revoke_own_sessions')) loop
  execute format('alter function %s owner to volume_core',f.signature);
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 end loop;
end $$;
grant execute on function private.live_self(uuid) to authenticated;
grant execute on function public.public_venues() to anon,authenticated;
grant execute on function public.current_access(),public.staff_directory(uuid),public.membership_directory(uuid),public.audit_feed(uuid),public.update_own_profile(text,bigint),public.update_venue(uuid,bigint,text,text,text,text,boolean,boolean,text),public.update_access(uuid,bigint,text,jsonb,text),public.set_account_status(uuid,bigint,text,text),public.set_staff_membership_status(uuid,bigint,bigint,text,text),public.revoke_own_sessions(bigint) to authenticated;
