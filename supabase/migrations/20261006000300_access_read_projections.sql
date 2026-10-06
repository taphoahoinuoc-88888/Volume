-- Owner-authorized read-only maintenance. No changes to frozen writes, RLS or Auth grants.
create function public.account_access(p_profile_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller public.profiles; result jsonb;
begin
 caller:=private.live_profile();
 if caller.role<>'ADMIN' then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
   'id',p.id,'display_name',p.display_name,'role',p.role,
   'account_status',p.account_status,'version',p.version::text,
   'memberships',(select coalesce(jsonb_agg(private.membership_audit(m) order by m.venue_id),'[]'::jsonb)
                  from public.staff_memberships m where m.profile_id=p.id)
 ) order by p.display_name,p.id),'[]'::jsonb) into result
 from public.profiles p where p_profile_id is null or p.id=p_profile_id;
 return result;
end $$;
-- Action-specific projection: does not grant directory access or disclose other roles.
create function public.membership_mutation_targets(p_venue uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare caller public.profiles; result jsonb;
begin
 caller:=private.live_profile();
 if caller.role not in ('MANAGER','STAFF') or not exists(
   select 1 from public.staff_memberships mine where mine.profile_id=caller.id
   and mine.venue_id=p_venue and mine.status='ACTIVE'
   and 'STAFF_MEMBERSHIP_STATUS_MANAGE'=any(mine.extra_permissions)
 ) then raise exception 'ACCESS_DENIED'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
   'membership_id',m.id,'profile_id',p.id,'display_name',p.display_name,
   'role',p.role,'venue_id',m.venue_id,'status',m.status,
   'account_status',p.account_status,'version',m.version::text,'profile_version',p.version::text
 ) order by p.display_name,m.id),'[]'::jsonb) into result
 from public.staff_memberships m join public.profiles p on p.id=m.profile_id
 where m.venue_id=p_venue and p.role='STAFF' and p.id<>caller.id;
 return result;
end $$;
-- Temporary schema CREATE needed only for ownership transfer; no new runtime grants.
grant create on schema public to volume_core;
alter function public.account_access(uuid) owner to volume_core;
alter function public.membership_mutation_targets(uuid) owner to volume_core;
revoke create on schema public from volume_core;
revoke all on function public.account_access(uuid),public.membership_mutation_targets(uuid) from public,anon,authenticated,service_role;
grant execute on function public.account_access(uuid),public.membership_mutation_targets(uuid) to authenticated;
