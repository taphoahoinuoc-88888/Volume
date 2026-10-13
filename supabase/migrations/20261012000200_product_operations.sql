grant create on schema public,private to volume_core;
create function private.product_can(p_venue uuid,p_permission text,p_write boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin
 a:=private.live_profile();
 if p_permission not in ('SHOP_MANAGE','RANK_MANAGE','FEEDBACK_MANAGE') then return false;end if;
 return a.role='ADMIN' or (a.role='CEO' and not p_write) or (a.role='MANAGER' and private.can_venue(p_venue)) or
 (a.role='STAFF' and exists(select 1 from public.staff_memberships m where m.profile_id=a.id and m.venue_id=p_venue and m.status='ACTIVE' and p_permission=any(m.extra_permissions)));
end $$;
create function public.product_access(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin a:=private.live_profile();return jsonb_build_object('shop_read',private.product_can(p_venue,'SHOP_MANAGE'),'shop_write',private.product_can(p_venue,'SHOP_MANAGE',true),'rank_read',private.product_can(p_venue,'RANK_MANAGE'),'rank_write',private.product_can(p_venue,'RANK_MANAGE',true),'feedback_read',private.product_can(p_venue,'FEEDBACK_MANAGE'),'feedback_write',private.product_can(p_venue,'FEEDBACK_MANAGE',true),'support_write',a.role='ADMIN');end $$;
create function private.product_available(p_id uuid) returns integer language sql security definer set search_path='' as $$
 select (p.on_hand-coalesce((select sum(i.quantity) from public.shop_order_items i join public.shop_orders o on o.id=i.order_id where i.product_id=p.id and (o.state='PAID' or (o.state='PENDING' and o.expires_at>clock_timestamp()))),0))::integer from public.products p where p.id=p_id
$$;
create function private.product_json(p public.products,p_internal boolean default false) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'venue_id',p.venue_id,'sku',p.sku,'name',p.name,'category',p.category,'variant',p.variant,'description',p.description,'image_url',p.image_url,'price_vnd',p.price_vnd::text,'available',private.product_available(p.id),'version',p.version::text,'is_visible',p.is_visible,'is_demo',p.is_demo)||case when p_internal then jsonb_build_object('on_hand',p.on_hand) else '{}'::jsonb end
$$;
create function public.shop_catalog(p_venue uuid default null) returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(private.product_json(p)||jsonb_build_object('venue_name',v.name) order by p.name,p.variant),'[]') from public.products p join public.venues v on v.id=p.venue_id where p.is_visible and v.is_public and v.is_enabled and (p_venue is null or p.venue_id=p_venue)
$$;
create function public.shop_inventory(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin if not private.product_can(p_venue,'SHOP_MANAGE') then raise exception 'ACCESS_DENIED';end if;
 return jsonb_build_object('products',(select coalesce(jsonb_agg(private.product_json(p,true) order by p.name),'[]') from public.products p where venue_id=p_venue),'movements',(select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at desc),'[]') from public.inventory_movements m join public.products p on p.id=m.product_id where p.venue_id=p_venue));end $$;
create function public.save_product(p_id uuid,p_venue uuid,expected_version bigint,p_sku text,p_name text,p_category text,p_variant text,p_description text,p_image_url text,p_price_vnd bigint,p_visible boolean,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles; old public.products; p public.products;begin
 a:=private.writer();if not private.product_can(p_venue,'SHOP_MANAGE',true) then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);
 if p_id is null then if expected_version is not null then raise exception 'VERSION_CONFLICT';end if;
 insert into public.products(venue_id,sku,name,category,variant,description,image_url,price_vnd,is_visible) values(p_venue,p_sku,p_name,p_category,p_variant,p_description,p_image_url,p_price_vnd,p_visible) returning * into p;
 else select * into old from public.products where id=p_id and venue_id=p_venue for update;perform private.check_version(old.version,expected_version);
 if row(old.sku,old.name,old.category,old.variant,old.description,old.image_url,old.price_vnd,old.is_visible) is not distinct from row(p_sku,p_name,p_category,p_variant,p_description,p_image_url,p_price_vnd,p_visible) then return jsonb_build_object('status','NO_CHANGE');end if;
 update public.products set sku=p_sku,name=p_name,category=p_category,variant=p_variant,description=p_description,image_url=p_image_url,price_vnd=p_price_vnd,is_visible=p_visible,version=version+1,updated_at=clock_timestamp() where id=p_id returning * into p;end if;
 perform private.log_event('BUSINESS','PRODUCT_SAVED','products',p.id,p_venue,p_reason,jsonb_build_object('version',old.version::text),jsonb_build_object('version',p.version::text,'price_vnd',p.price_vnd::text,'is_visible',p.is_visible));return private.product_json(p,true);end $$;
create function public.adjust_stock(p_product uuid,expected_version bigint,p_delta integer,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;p public.products;begin a:=private.writer();select * into p from public.products where id=p_product for update;
 if p.id is null or not private.product_can(p.venue_id,'SHOP_MANAGE',true) then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);perform private.check_version(p.version,expected_version);
 if p_delta is null or p_delta=0 or abs(p_delta::bigint)>1000000 or private.product_available(p.id)+p_delta<0 then raise exception 'INVALID_STOCK';end if;
 update public.products set on_hand=on_hand+p_delta,version=version+1,updated_at=clock_timestamp() where id=p.id;
 insert into public.inventory_movements(product_id,delta,actor_id,reason) values(p.id,p_delta,a.id,p_reason);
 perform private.log_event('BUSINESS','STOCK_CHANGED','products',p.id,p.venue_id,p_reason,jsonb_build_object('on_hand',p.on_hand,'version',p.version::text),jsonb_build_object('on_hand',p.on_hand+p_delta,'version',(p.version+1)::text));return jsonb_build_object('status','UPDATED');end $$;
create function private.product_order_json(o public.shop_orders) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',o.id,'venue_id',o.venue_id,'customer_profile_id',o.customer_profile_id,'state',case when o.state='PENDING' and o.expires_at<=clock_timestamp() then 'EXPIRED' else o.state end,'total_vnd',o.total_vnd::text,'expires_at',o.expires_at,'created_at',o.created_at,'cash_received_at',o.cash_received_at,'version',o.version::text,'items',(select coalesce(jsonb_agg(jsonb_build_object('product_id',i.product_id,'name',i.name,'variant',i.variant,'quantity',i.quantity,'unit_price_vnd',i.unit_price_vnd::text) order by i.product_id),'[]') from public.shop_order_items i where i.order_id=o.id))
$$;
create function public.shop_orders_read(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin a:=private.live_profile();if p_venue is not null and not private.product_can(p_venue,'SHOP_MANAGE') then raise exception 'ACCESS_DENIED';end if;
 return (select coalesce(jsonb_agg(private.product_order_json(o) order by o.created_at desc),'[]') from public.shop_orders o where case when p_venue is null then o.customer_profile_id=a.id else o.venue_id=p_venue end);end $$;
create function public.create_shop_order(p_venue uuid,p_items jsonb,p_request_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;p public.products;o public.shop_orders;i jsonb;total bigint:=0;canonical jsonb;begin
 a:=private.writer();
 if p_request_key is null or jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'INVALID_CART';end if;
 select jsonb_agg(value order by value->>'id') into canonical from jsonb_array_elements(p_items);
 select * into o from public.shop_orders where customer_profile_id=a.id and request_key=p_request_key;
 if o.id is not null then if o.request_payload<>canonical or o.venue_id<>p_venue then raise exception 'IDEMPOTENCY_CONFLICT';end if;return private.product_order_json(o);end if;
 if not exists(select 1 from public.venues where id=p_venue and is_public and is_enabled) then raise exception 'ACCESS_DENIED';end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(p_items))<>jsonb_array_length(p_items) then raise exception 'INVALID_CART';end if;
 for i in select value from jsonb_array_elements(canonical) loop
  select * into p from public.products where id=(i->>'id')::uuid and venue_id=p_venue and is_visible for update;
  perform private.check_version(p.version,(i->>'version')::bigint);
  if (i->>'quantity')::integer not between 1 and 99 or i->>'quantity' is null then raise exception 'INVALID_CART';end if;
  if p.price_vnd is distinct from (i->>'price_vnd')::bigint or private.product_available(p.id) is distinct from (i->>'available')::integer then raise exception 'QUOTE_CHANGED';end if;
  if private.product_available(p.id)<(i->>'quantity')::integer then raise exception 'INSUFFICIENT_STOCK';end if;
  total:=total+p.price_vnd*(i->>'quantity')::integer;
 end loop;
 insert into public.shop_orders(venue_id,customer_profile_id,request_key,request_payload,total_vnd) values(p_venue,a.id,p_request_key,canonical,total) returning * into o;
 for i in select value from jsonb_array_elements(canonical) loop
  select * into p from public.products where id=(i->>'id')::uuid;
  insert into public.shop_order_items(order_id,product_id,name,variant,unit_price_vnd,quantity) values(o.id,p.id,p.name,p.variant,p.price_vnd,(i->>'quantity')::integer);
 end loop;
 perform private.log_event('BUSINESS','SHOP_ORDER_CREATED','shop_orders',o.id,p_venue,'Customer confirmed cart',null,jsonb_build_object('id',o.id,'total_vnd',total::text),'CUSTOMER_WEB');return private.product_order_json(o);end $$;
create function public.change_shop_order(p_order uuid,expected_version bigint,p_action text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;o public.shop_orders;i public.shop_order_items;event text;begin
 a:=private.writer();select * into o from public.shop_orders where id=p_order for update;
 if o.id is null or not (private.product_can(o.venue_id,'SHOP_MANAGE',true) or (o.customer_profile_id=a.id and p_action='CANCEL')) then raise exception 'ACCESS_DENIED';end if;
 perform private.check_version(o.version,expected_version);perform private.check_reason(p_reason);
 if p_action='CANCEL' then
  if o.state<>'PENDING' then raise exception 'INVALID_STATE';end if;
  update public.shop_orders set state='CANCELLED',version=version+1,updated_at=clock_timestamp() where id=o.id;event:='SHOP_ORDER_CANCELLED';
 elsif p_action='CASH' then
  if o.state<>'PENDING' or o.expires_at<=clock_timestamp() then raise exception 'HOLD_EXPIRED';end if;
  if not exists(select 1 from public.venues where id=o.venue_id and is_enabled) or not exists(select 1 from public.profiles where id=o.customer_profile_id and account_status='ACTIVE') then raise exception 'ACCESS_DENIED';end if;
  update public.shop_orders set state='PAID',cash_received_at=clock_timestamp(),cash_received_by=a.id,version=version+1,updated_at=clock_timestamp() where id=o.id;event:='SHOP_CASH_RECEIVED';
 elsif p_action='FULFILL' then
  if o.state<>'PAID' then raise exception 'INVALID_STATE';end if;
  for i in select * from public.shop_order_items where order_id=o.id order by product_id loop
   update public.products set on_hand=on_hand-i.quantity,version=version+1,updated_at=clock_timestamp() where id=i.product_id;
   insert into public.inventory_movements(product_id,order_id,delta,actor_id,reason) values(i.product_id,o.id,-i.quantity,a.id,p_reason);
  end loop;
  update public.shop_orders set state='FULFILLED',version=version+1,updated_at=clock_timestamp() where id=o.id;event:='SHOP_FULFILLED';
 else raise exception 'INVALID_ACTION';end if;
 perform private.log_event('BUSINESS',event,'shop_orders',o.id,o.venue_id,p_reason,jsonb_build_object('state',o.state,'version',o.version::text),jsonb_build_object('version',(o.version+1)::text),case when o.customer_profile_id=a.id then 'CUSTOMER_WEB' else 'CONTROL_CENTER' end);
 select * into o from public.shop_orders where id=o.id;return private.product_order_json(o);end $$;
create function public.rank_definitions_read(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin if not private.product_can(p_venue,'RANK_MANAGE') then raise exception 'ACCESS_DENIED';end if;return (select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('version',r.version::text) order by r.name),'[]') from public.rank_definitions r where venue_id=p_venue);end $$;
create function public.save_rank(p_id uuid,p_venue uuid,expected_version bigint,p_name text,p_active boolean,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;r public.rank_definitions;old public.rank_definitions;begin a:=private.writer();if not private.product_can(p_venue,'RANK_MANAGE',true) then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);
 if p_id is null then if expected_version is not null then raise exception 'VERSION_CONFLICT';end if;insert into public.rank_definitions(venue_id,name,is_active) values(p_venue,p_name,p_active) returning * into r;
 else select * into old from public.rank_definitions where id=p_id and venue_id=p_venue for update;perform private.check_version(old.version,expected_version);
 if row(old.name,old.is_active) is not distinct from row(p_name,p_active) then return jsonb_build_object('status','NO_CHANGE');end if;
 update public.rank_definitions set name=p_name,is_active=p_active,version=version+1,updated_at=clock_timestamp() where id=p_id returning * into r;end if;
 perform private.log_event('BUSINESS','RANK_SAVED','rank_definitions',r.id,p_venue,p_reason,jsonb_build_object('version',old.version::text),jsonb_build_object('name',r.name,'is_active',r.is_active,'version',r.version::text));return jsonb_build_object('id',r.id,'version',r.version::text);end $$;
create function public.ensure_player_profile() returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;p public.player_profiles;begin a:=private.writer();select * into p from public.player_profiles where profile_id=a.id;
 if p.profile_id is null then insert into public.player_profiles(profile_id) values(a.id) returning * into p;
 perform private.log_event('BUSINESS','PLAYER_STATUS_CHANGED','player_profiles',a.id,null,'Customer created player profile',null,jsonb_build_object('is_active',true),'CUSTOMER_WEB');end if;return jsonb_build_object('profile_id',p.profile_id,'version',p.version::text,'is_active',p.is_active);end $$;
create function public.player_rank_read(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin a:=private.live_profile();if p_venue is not null and not private.product_can(p_venue,'RANK_MANAGE') then raise exception 'ACCESS_DENIED';end if;
 return jsonb_build_object('profile',case when p_venue is null then (select jsonb_build_object('id',p.profile_id,'is_active',p.is_active,'version',p.version::text) from public.player_profiles p where profile_id=a.id) else null end,
 'ranks',(select coalesce(jsonb_agg(jsonb_build_object('profile_id',r.profile_id,'display_name',p.display_name,'venue_id',r.venue_id,'venue_name',v.name,'rank_id',r.rank_id,'rank_name',d.name,'rank_active',d.is_active,'version',r.version::text)),'[]') from public.player_ranks r join public.profiles p on p.id=r.profile_id join public.rank_definitions d on d.id=r.rank_id join public.venues v on v.id=r.venue_id where case when p_venue is null then r.profile_id=a.id else r.venue_id=p_venue end),
 'history',(select coalesce(jsonb_agg(jsonb_build_object('rank_name',h.rank_name,'venue_id',h.venue_id,'created_at',h.created_at,'profile_id',h.profile_id) order by h.created_at desc),'[]') from public.rank_history h where case when p_venue is null then h.profile_id=a.id else h.venue_id=p_venue end));end $$;
create function public.assign_player_rank(p_profile uuid,p_venue uuid,p_rank uuid,expected_version bigint,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;r public.player_ranks;d public.rank_definitions;begin
 a:=private.writer();if not private.product_can(p_venue,'RANK_MANAGE',true) then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);
 -- Exact profile id is supplied by the customer, never a global directory grant.
 if not exists(select 1 from public.player_profiles pp join public.profiles p on p.id=pp.profile_id where p.id=p_profile and p.account_status='ACTIVE' and pp.is_active) then raise exception 'PLAYER_NOT_AVAILABLE';end if;
 select * into d from public.rank_definitions where id=p_rank and venue_id=p_venue and is_active;if d.id is null then raise exception 'RANK_NOT_AVAILABLE';end if;
 select * into r from public.player_ranks where profile_id=p_profile and venue_id=p_venue for update;
 if r.profile_id is null then if expected_version is not null then raise exception 'VERSION_CONFLICT';end if;insert into public.player_ranks(profile_id,venue_id,rank_id) values(p_profile,p_venue,p_rank);
 else perform private.check_version(r.version,expected_version);if r.rank_id=p_rank then return jsonb_build_object('status','NO_CHANGE');end if;
 update public.player_ranks set rank_id=p_rank,version=version+1,updated_at=clock_timestamp() where profile_id=p_profile and venue_id=p_venue;end if;
 insert into public.rank_history(profile_id,venue_id,rank_id,rank_name,actor_id,reason) values(p_profile,p_venue,p_rank,d.name,a.id,p_reason);
 perform private.log_event('BUSINESS','RANK_ASSIGNED','player_profiles',p_profile,p_venue,p_reason,jsonb_build_object('rank_id',r.rank_id,'version',r.version::text),jsonb_build_object('rank_id',p_rank));return jsonb_build_object('status','UPDATED');end $$;
create function public.set_player_active(expected_version bigint,p_active boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;p public.player_profiles;begin a:=private.writer();select * into p from public.player_profiles where profile_id=a.id for update;perform private.check_version(p.version,expected_version);
 if p_active is null then raise exception 'INVALID_STATUS';end if;if p.is_active=p_active then return jsonb_build_object('status','NO_CHANGE');end if;
 update public.player_profiles set is_active=p_active,version=version+1,updated_at=clock_timestamp() where profile_id=a.id;
 perform private.log_event('BUSINESS','PLAYER_STATUS_CHANGED','player_profiles',a.id,null,'Customer changed player visibility',jsonb_build_object('is_active',p.is_active),jsonb_build_object('is_active',p_active),'CUSTOMER_WEB');return jsonb_build_object('status','UPDATED');end $$;
create function public.support_contacts() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('venue_id',v.id,'venue_name',v.name,'telegram_username',s.telegram_username) order by v.name),'[]') from public.venues v left join public.venue_support s on s.venue_id=v.id where v.is_public and v.is_enabled
$$;
create function public.support_setting(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin if (private.live_profile()).role<>'ADMIN' then raise exception 'ACCESS_DENIED';end if;return (select jsonb_build_object('telegram_username',s.telegram_username,'version',s.version::text) from public.venue_support s where venue_id=p_venue);end $$;
create function public.save_support(p_venue uuid,expected_version bigint,p_username text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;s public.venue_support;begin a:=private.writer();if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);select * into s from public.venue_support where venue_id=p_venue for update;
 if s.venue_id is null then if expected_version is not null then raise exception 'VERSION_CONFLICT';end if;insert into public.venue_support(venue_id,telegram_username) values(p_venue,p_username);
 else perform private.check_version(s.version,expected_version);if s.telegram_username is not distinct from p_username then return jsonb_build_object('status','NO_CHANGE');end if;update public.venue_support set telegram_username=p_username,version=version+1,updated_at=clock_timestamp() where venue_id=p_venue;end if;
 perform private.log_event('BUSINESS','SUPPORT_UPDATED','venue_support',p_venue,p_venue,p_reason,jsonb_build_object('telegram_username',s.telegram_username),jsonb_build_object('telegram_username',p_username));return jsonb_build_object('status','UPDATED');end $$;
create function private.product_ticket_json(t public.feedback_tickets,p_internal boolean) returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('id',t.id,'venue_id',t.venue_id,'category',t.category,'message',t.message,'state',t.state,'order_id',t.order_id,'session_id',t.session_id,'version',t.version::text,'created_at',t.created_at,'messages',(select coalesce(jsonb_agg(jsonb_build_object('message',m.message,'is_internal',m.is_internal,'created_at',m.created_at) order by m.created_at),'[]') from public.feedback_messages m where m.ticket_id=t.id and (p_internal or not m.is_internal)))||case when p_internal then jsonb_build_object('assigned_to',t.assigned_to,'customer_profile_id',t.customer_profile_id) else '{}'::jsonb end
$$;
create function public.feedback_read(p_venue uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;begin a:=private.live_profile();if p_venue is not null and not private.product_can(p_venue,'FEEDBACK_MANAGE') then raise exception 'ACCESS_DENIED';end if;
 return (select coalesce(jsonb_agg(private.product_ticket_json(t,p_venue is not null) order by t.created_at desc),'[]') from public.feedback_tickets t where case when p_venue is null then t.customer_profile_id=a.id else t.venue_id=p_venue end);end $$;
create function public.create_feedback(p_venue uuid,p_category text,p_message text,p_order uuid,p_session uuid,p_request_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;t public.feedback_tickets;begin a:=private.writer();
 select * into t from public.feedback_tickets where customer_profile_id=a.id and request_key=p_request_key;
 if t.id is not null then if row(t.venue_id,t.category,t.message,t.order_id,t.session_id) is distinct from row(p_venue,p_category,p_message,p_order,p_session) then raise exception 'IDEMPOTENCY_CONFLICT';end if;return private.product_ticket_json(t,false);end if;
 if not exists(select 1 from public.venues where id=p_venue and is_public and is_enabled) or (p_order is not null and not exists(select 1 from public.shop_orders where id=p_order and venue_id=p_venue and customer_profile_id=a.id)) or (p_session is not null and not exists(select 1 from public.table_sessions where id=p_session and venue_id=p_venue and customer_profile_id=a.id)) then raise exception 'ACCESS_DENIED';end if;
 insert into public.feedback_tickets(venue_id,customer_profile_id,category,message,order_id,session_id,request_key) values(p_venue,a.id,p_category,p_message,p_order,p_session,p_request_key) returning * into t;
 perform private.log_event('BUSINESS','FEEDBACK_CREATED','feedback_tickets',t.id,p_venue,'Customer submitted feedback',null,jsonb_build_object('id',t.id,'category',t.category),'CUSTOMER_WEB');return private.product_ticket_json(t,false);end $$;
create function public.feedback_assignees(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin if not private.product_can(p_venue,'FEEDBACK_MANAGE',true) then raise exception 'ACCESS_DENIED';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name)),'[]') from public.staff_memberships m join public.profiles p on p.id=m.profile_id where m.venue_id=p_venue and m.status='ACTIVE' and p.account_status='ACTIVE' and (p.role='MANAGER' or (p.role='STAFF' and 'FEEDBACK_MANAGE'=any(m.extra_permissions))));end $$;
create function public.update_feedback(p_ticket uuid,expected_version bigint,p_state text,p_assigned_to uuid,p_message text,p_internal boolean,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;t public.feedback_tickets;begin a:=private.writer();select * into t from public.feedback_tickets where id=p_ticket for update;
 if t.id is null or not private.product_can(t.venue_id,'FEEDBACK_MANAGE',true) then raise exception 'ACCESS_DENIED';end if;perform private.check_version(t.version,expected_version);perform private.check_reason(p_reason);
 if p_assigned_to is not null and not exists(select 1 from public.staff_memberships m join public.profiles p on p.id=m.profile_id where m.venue_id=t.venue_id and m.profile_id=p_assigned_to and m.status='ACTIVE' and p.account_status='ACTIVE' and (p.role='MANAGER' or (p.role='STAFF' and 'FEEDBACK_MANAGE'=any(m.extra_permissions)))) then raise exception 'INVALID_ASSIGNEE';end if;
 if t.state is not distinct from p_state and t.assigned_to is not distinct from p_assigned_to and coalesce(btrim(p_message),'')='' then return jsonb_build_object('status','NO_CHANGE');end if;
 update public.feedback_tickets set state=p_state,assigned_to=p_assigned_to,version=version+1,updated_at=clock_timestamp() where id=t.id;
 if coalesce(btrim(p_message),'')<>'' then insert into public.feedback_messages(ticket_id,actor_id,message,is_internal) values(t.id,a.id,p_message,p_internal);end if;
 perform private.log_event('BUSINESS','FEEDBACK_UPDATED','feedback_tickets',t.id,t.venue_id,p_reason,jsonb_build_object('state',t.state,'version',t.version::text),jsonb_build_object('state',p_state,'version',(t.version+1)::text,'internal_note',p_internal));return jsonb_build_object('status','UPDATED');end $$;
create function public.product_table_locations(p_venue uuid default null) returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'floor_label',t.floor_label)),'[]') from public.billiard_tables t join public.venues v on v.id=t.venue_id where t.status='ACTIVE' and v.is_public and v.is_enabled and (p_venue is null or v.id=p_venue)
$$;
create function public.product_table_floors(p_venue uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin if not private.can_venue(p_venue) then raise exception 'ACCESS_DENIED';end if;return (select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'label',t.label,'floor_label',t.floor_label,'version',t.version::text)),'[]') from public.billiard_tables t where venue_id=p_venue);end $$;
create function public.set_table_floor(p_table uuid,expected_version bigint,p_floor text,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;t public.billiard_tables;begin a:=private.writer();if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);select * into t from public.billiard_tables where id=p_table for update;perform private.check_version(t.version,expected_version);
 if t.floor_label is not distinct from p_floor then return jsonb_build_object('status','NO_CHANGE');end if;
 update public.billiard_tables set floor_label=p_floor,version=version+1,updated_at=clock_timestamp() where id=t.id;
 perform private.log_event('BUSINESS','TABLE_UPDATED','billiard_tables',t.id,t.venue_id,p_reason,jsonb_build_object('floor_label',t.floor_label,'version',t.version::text),jsonb_build_object('floor_label',p_floor,'version',(t.version+1)::text));return jsonb_build_object('status','UPDATED');end $$;
create function public.seed_demo_catalog(p_venue uuid,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.profiles;item jsonb;p jsonb;begin a:=private.writer();if a.role<>'ADMIN' then raise exception 'ACCESS_DENIED';end if;perform private.check_reason(p_reason);
 if exists(select 1 from public.products) then raise exception 'DEMO_DATASET_NOT_EMPTY';end if;
 for item in select value from jsonb_array_elements('[
 {"sku":"DEMO-PERI","name":"Gậy PERI — danh mục minh họa","category":"CUES","price":"1500000","image":"cue-peri.svg"},
 {"sku":"DEMO-FURY","name":"Gậy FURY — danh mục minh họa","category":"CUES","price":"1200000","image":"cue-peri.svg"},
 {"sku":"DEMO-MRSUNG","name":"Mr-Sung HERO","category":"TABLES","price":"45000000","image":"table-rasson.svg"},
 {"sku":"DEMO-RASSON","name":"RASSON OX II","category":"TABLES","price":"60000000","image":"table-rasson.svg"},
 {"sku":"DEMO-TAOM","name":"Taom Pyro Chalk","category":"CHALK","price":"300000","image":"chalk-taom.svg"},
 {"sku":"DEMO-ARAMITH","name":"Bộ bi Aramith — danh mục minh họa","category":"BALLS","price":"2500000","image":"balls-aramith.svg"}
 ]'::jsonb) loop
 p:=public.save_product(null,p_venue,null,item->>'sku',item->>'name',item->>'category','Minh họa','DEMO: giá, tồn kho và ảnh minh họa; không phải báo giá hoặc hình ảnh chính xác của mẫu thực tế. Quản trị viên cần cập nhật thông tin bán hàng trước khi dùng thật.','/showroom/assets/products/'||(item->>'image'),(item->>'price')::bigint,true,p_reason);
 update public.products set is_demo=true where id=(p->>'id')::uuid;
 perform public.adjust_stock((p->>'id')::uuid,(p->>'version')::bigint,3,'Explicit demo inventory: '||p_reason);
 end loop;return jsonb_build_object('created',6);end $$;
-- Only these additive APIs are exposed. No defaults inherited from PUBLIC.
do $$ declare f record;begin
 for f in select p.oid::regprocedure signature,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname='private' and p.proname like 'product_%') or (n.nspname='public' and p.proname in ('product_table_locations','product_table_floors','set_table_floor','seed_demo_catalog','product_access','shop_catalog','shop_inventory','save_product','adjust_stock','shop_orders_read','create_shop_order','change_shop_order','rank_definitions_read','save_rank','ensure_player_profile','player_rank_read','assign_player_rank','set_player_active','support_contacts','support_setting','save_support','feedback_read','create_feedback','feedback_assignees','update_feedback')) loop
 execute format('alter function %s owner to volume_core',f.signature);execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);if f.nspname='public' then execute format('grant execute on function %s to authenticated',f.signature);end if;
 end loop;
end $$;
grant execute on function public.shop_catalog(uuid),public.support_contacts(),public.product_table_locations(uuid) to anon;
revoke create on schema public,private from volume_core;
