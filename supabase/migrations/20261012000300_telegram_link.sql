-- Telegram transport capability is not an application role or authentication provider.
create role volume_telegram_transport nologin noinherit;
grant volume_telegram_transport to postgres;
grant usage on schema private to volume_telegram_transport;
grant create on schema public,private to volume_core;
create table private.telegram_challenges (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id), session_id uuid not null,
 proof_hash bytea not null unique, expires_at timestamptz not null default clock_timestamp()+interval '5 minutes',
 telegram_id bigint check(telegram_id>0), telegram_name text check(length(telegram_name)<=100),
 redeemed_at timestamptz, confirmed_at timestamptz, version bigint not null default 1 check(version>0)
);
create table private.telegram_links (
 profile_id uuid primary key references public.profiles(id), telegram_id bigint not null unique check(telegram_id>0), session_id uuid not null,
 linked_at timestamptz not null default clock_timestamp(), revoked_at timestamptz, version bigint not null default 1 check(version>0)
);
revoke all on private.telegram_challenges,private.telegram_links from public,anon,authenticated,service_role,volume_telegram_transport;
grant select,insert,update on private.telegram_challenges,private.telegram_links to volume_core;
alter table private.telegram_challenges enable row level security;
alter table private.telegram_links enable row level security;
alter table private.telegram_challenges force row level security;
alter table private.telegram_links force row level security;
create policy telegram_core on private.telegram_challenges to volume_core using(true) with check(true);
create policy telegram_core on private.telegram_links to volume_core using(true) with check(true);
create function public.begin_telegram_link() returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;proof text;sid uuid;c private.telegram_challenges;begin
 a:=private.writer();if exists(select 1 from private.telegram_links where profile_id=a.id and revoked_at is null) then raise exception 'UNLINK_FIRST';end if;
 sid:=(current_setting('request.jwt.claims',true)::jsonb->>'session_id')::uuid;
 proof:=replace(gen_random_uuid()::text,'-','')||substr(replace(gen_random_uuid()::text,'-',''),1,16);
 update private.telegram_challenges set expires_at=least(expires_at,clock_timestamp()),version=version+1 where profile_id=a.id and confirmed_at is null and expires_at>clock_timestamp();
 insert into private.telegram_challenges(profile_id,session_id,proof_hash) values(a.id,sid,sha256(convert_to(proof,'UTF8'))) returning * into c;
 return jsonb_build_object('id',c.id,'proof',proof,'expires_at',c.expires_at);end $$;
create function public.telegram_link_status() returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin a:=private.live_profile();return jsonb_build_object('link',(select jsonb_build_object('telegram_id',l.telegram_id::text,'linked_at',l.linked_at,'revoked_at',l.revoked_at,'version',l.version::text) from private.telegram_links l where l.profile_id=a.id),
 'pending',(select jsonb_build_object('id',c.id,'telegram_id',c.telegram_id::text,'telegram_name',c.telegram_name,'expires_at',c.expires_at,'version',c.version::text) from private.telegram_challenges c where c.profile_id=a.id and c.confirmed_at is null and c.expires_at>clock_timestamp() order by c.expires_at desc limit 1));end $$;
create function public.confirm_telegram_link(p_challenge uuid,expected_version bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;c private.telegram_challenges;begin a:=private.writer();select * into c from private.telegram_challenges where id=p_challenge and profile_id=a.id for update;
 perform private.check_version(c.version,expected_version);
 if c.telegram_id is null or c.expires_at<=clock_timestamp() or c.confirmed_at is not null or c.session_id is distinct from (current_setting('request.jwt.claims',true)::jsonb->>'session_id')::uuid then raise exception 'LINK_EXPIRED';end if;
 if exists(select 1 from private.telegram_links where (profile_id=a.id or telegram_id=c.telegram_id) and revoked_at is null) then raise exception 'UNLINK_FIRST';end if;
 -- Revoked association must also belong to this profile; no implicit account replacement.
 if exists(select 1 from private.telegram_links where telegram_id=c.telegram_id and profile_id<>a.id) then raise exception 'LINK_CONFLICT';end if;
 insert into private.telegram_links(profile_id,telegram_id,session_id) values(a.id,c.telegram_id,c.session_id)
 on conflict(profile_id) do update set telegram_id=excluded.telegram_id,session_id=excluded.session_id,linked_at=clock_timestamp(),revoked_at=null,version=private.telegram_links.version+1;
 update private.telegram_challenges set confirmed_at=clock_timestamp(),version=version+1 where id=c.id;
 perform private.log_event('SECURITY','TELEGRAM_LINKED','telegram_links',a.id,null,'Customer confirmed private Telegram account',null,jsonb_build_object('profile_id',a.id),'CUSTOMER_WEB');return jsonb_build_object('status','LINKED');end $$;
create function public.unlink_telegram(expected_version bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;l private.telegram_links;begin a:=private.writer();select * into l from private.telegram_links where profile_id=a.id for update;perform private.check_version(l.version,expected_version);
 if l.revoked_at is not null then return jsonb_build_object('status','NO_CHANGE');end if;
 update private.telegram_links set revoked_at=clock_timestamp(),version=version+1 where profile_id=a.id;
 perform private.log_event('SECURITY','TELEGRAM_UNLINKED','telegram_links',a.id,null,'Customer unlinked Telegram',null,jsonb_build_object('profile_id',a.id),'CUSTOMER_WEB');return jsonb_build_object('status','UNLINKED');end $$;
-- Callable only from the authenticated bot transport over a private DB connection.
-- Its caller verifies the actual Telegram private chat/from identity, never a client-provided profile.
create function private.telegram_redeem(p_proof text,p_telegram bigint,p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c private.telegram_challenges;begin
 perform pg_advisory_xact_lock(20261006,1);
 if p_telegram is null or p_telegram<=0 or p_proof !~ '^[0-9a-f]{48}$' then raise exception 'LINK_INVALID';end if;
 select * into c from private.telegram_challenges where proof_hash=sha256(convert_to(p_proof,'UTF8')) for update;
 if c.id is null or c.expires_at<=clock_timestamp() or c.redeemed_at is not null then raise exception 'LINK_EXPIRED';end if;
 if exists(select 1 from private.telegram_links where telegram_id=p_telegram and profile_id<>c.profile_id) then raise exception 'LINK_CONFLICT';end if;
 update private.telegram_challenges set telegram_id=p_telegram,telegram_name=left(p_name,100),redeemed_at=clock_timestamp(),version=version+1 where id=c.id;
 return jsonb_build_object('status','CONFIRM_ON_WEB');end $$;
create function private.telegram_read(p_telegram bigint,p_domain text) returns jsonb language plpgsql security definer set search_path='' as $$
declare l private.telegram_links;prior text;result jsonb;a public.profiles;begin
 perform pg_advisory_xact_lock_shared(20261006,1);
 select * into l from private.telegram_links where telegram_id=p_telegram and revoked_at is null;
 if l.profile_id is null then raise exception 'LINK_REQUIRED';end if;
 prior:=current_setting('request.jwt.claims',true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',l.profile_id,'session_id',l.session_id)::text,true);
 a:=private.live_profile();
 if p_domain='orders' then result:=public.shop_orders_read();
 elsif p_domain='rank' then result:=public.player_rank_read();
 elsif p_domain='feedback' then result:=public.feedback_read();
 elsif p_domain='sessions' then result:=public.own_table_sessions();
 elsif p_domain='management' then result:=jsonb_build_object('role',a.role,'venues',(select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'name',v.name,'access',public.product_access(v.id))),'[]') from public.venues v where private.can_venue(v.id)));
 else raise exception 'INVALID_DOMAIN';end if;
 perform set_config('request.jwt.claims',coalesce(prior,''),true);return result;
 exception when others then perform set_config('request.jwt.claims',coalesce(prior,''),true);raise;
end $$;
do $$ declare f record;begin
 for f in select p.oid::regprocedure signature,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='private' and p.proname in ('telegram_redeem','telegram_read')) or (n.nspname='public' and p.proname in ('begin_telegram_link','telegram_link_status','confirm_telegram_link','unlink_telegram')) loop
 execute format('alter function %s owner to volume_core',f.signature);execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
 if f.nspname='public' then execute format('grant execute on function %s to authenticated',f.signature);else execute format('grant execute on function %s to volume_telegram_transport',f.signature);end if;
 end loop;
end $$;
revoke create on schema public,private from volume_core;
