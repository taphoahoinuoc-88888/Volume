-- Owner decision 2026-10-13: explicit operational CEO writes; preserve frozen security.
-- CREATE OR REPLACE retains existing ownership and grants; reaffirm least privilege.
create or replace function private.product_can(p_venue uuid,p_permission text,p_write boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin
 a:=private.live_profile();
 if p_permission is null or p_permission not in ('SHOP_MANAGE','RANK_MANAGE','FEEDBACK_MANAGE') then return false;end if;
 return a.role in ('ADMIN','CEO') or (a.role='MANAGER' and private.can_venue(p_venue)) or
 (a.role='STAFF' and exists(select 1 from public.staff_memberships m where m.profile_id=a.id and m.venue_id=p_venue and m.status='ACTIVE' and p_permission=any(m.extra_permissions)));
end $$;

create or replace function public.product_access(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin a:=private.live_profile();return jsonb_build_object('shop_read',private.product_can(p_venue,'SHOP_MANAGE'),'shop_write',private.product_can(p_venue,'SHOP_MANAGE',true),'rank_read',private.product_can(p_venue,'RANK_MANAGE'),'rank_write',private.product_can(p_venue,'RANK_MANAGE',true),'feedback_read',private.product_can(p_venue,'FEEDBACK_MANAGE'),'feedback_write',private.product_can(p_venue,'FEEDBACK_MANAGE',true),'support_write',(a.role in ('ADMIN','CEO') or (a.role='MANAGER' and private.can_venue(p_venue))),'admin_config',a.role='ADMIN');end $$;

create or replace function public.support_setting(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin if not ((private.live_profile()).role in ('ADMIN','CEO') or ((private.live_profile()).role='MANAGER' and private.can_venue(p_venue))) then raise exception 'ACCESS_DENIED';end if;return (select jsonb_build_object('telegram_username',s.telegram_username,'version',s.version::text) from public.venue_support s where venue_id=p_venue);end $$;

create or replace function public.save_support(p_venue uuid,expected_version bigint,p_username text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;s public.venue_support;begin a:=private.writer();if not (a.role in ('ADMIN','CEO') or (a.role='MANAGER' and private.can_venue(p_venue))) then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);select * into s from public.venue_support where venue_id=p_venue for update;
 if s.venue_id is null then if expected_version is not null then raise exception 'VERSION_CONFLICT';end if;insert into public.venue_support(venue_id,telegram_username) values(p_venue,p_username);
 else perform private.check_version(s.version,expected_version);if s.telegram_username is not distinct from p_username then return jsonb_build_object('status','NO_CHANGE');end if;update public.venue_support set telegram_username=p_username,version=version+1,updated_at=clock_timestamp() where venue_id=p_venue;end if;
 perform private.log_event('BUSINESS','SUPPORT_UPDATED','venue_support',p_venue,p_venue,p_reason,jsonb_build_object('telegram_username',s.telegram_username),jsonb_build_object('telegram_username',p_username));return jsonb_build_object('status','UPDATED');end $$;
revoke all on function private.product_can(uuid,text,boolean) from public,anon,authenticated,service_role;
revoke all on function public.product_access(uuid),public.support_setting(uuid),public.save_support(uuid,bigint,text,text) from public,anon,authenticated,service_role;
grant execute on function public.product_access(uuid),public.support_setting(uuid),public.save_support(uuid,bigint,text,text) to authenticated;
