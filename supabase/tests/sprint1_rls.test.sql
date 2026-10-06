begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(16);

insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000006","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000006"}',true);
set local role authenticated;

select is((select count(*)::int from public.profiles),1,'USER only self RLS');
select is((select count(*)::int from public.profiles where id='30000000-0000-0000-0000-000000000007'),0,'Other USER isolated');
select throws_ok($$select sessions_revoked_before from public.profiles$$,'42501',null,'Sensitive column denies');
select throws_ok($$update public.profiles set role='ADMIN'$$,'42501',null,'Direct privilege update denies');
select throws_ok($$select * from public.audit_events$$,'42501',null,'Direct audit denies');
select throws_ok($$select private.session_valid(null)$$,'42501',null,'Client direct session helper denies');
select throws_ok($$select * from auth.sessions$$,'42501',null,'Client direct managed Auth read denies');
select throws_ok($$select private.live_profile()$$,'42501',null,'Unsafe helper direct invocation denies');
select throws_ok($$select public.staff_directory('10000000-0000-0000-0000-000000000001')$$,'P0001','ACCESS_DENIED','USER internal denies');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000004"}',true);
set local role authenticated;

select lives_ok($$select public.staff_directory('10000000-0000-0000-0000-000000000001')$$,'Manager scope A allows');
select throws_ok($$select public.staff_directory('10000000-0000-0000-0000-000000000002')$$,'P0001','ACCESS_DENIED','Manager scope B denies');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000005","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000005"}',true);
set local role authenticated;

select throws_ok($$select public.staff_directory('10000000-0000-0000-0000-000000000001')$$,'P0001','ACCESS_DENIED','Staff roster denies');
select is(jsonb_array_length(public.membership_directory('10000000-0000-0000-0000-000000000001')),1,'Staff only own membership');
reset role;
select ok(not has_schema_privilege('volume_core','auth','USAGE'),'Application core has no Auth schema usage');
select ok(not has_table_privilege('volume_core','auth.sessions','SELECT') and not has_column_privilege('volume_core','auth.sessions','id','SELECT'),'Application core has no Auth session select');
set local role anon;
select is((select count(*)::int from public.public_venues()),1,'Anon safe published enabled venues');

select * from finish();
rollback;
