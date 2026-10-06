begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(21);
insert into auth.users(id,email) select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'db-test-'||n||'@example.test' from generate_series(1,9) n;
update public.profiles set role=case right(id::text,1) when '1' then 'ADMIN' when '2' then 'ADMIN' when '3' then 'CEO' when '4' then 'MANAGER' when '5' then 'STAFF' when '8' then 'STAFF' when '9' then 'STAFF' else 'USER' end where id::text like '30000000%';
insert into auth.sessions(id,user_id,created_at,updated_at) select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,clock_timestamp()-interval '1 second',clock_timestamp() from generate_series(1,9) n;
insert into public.staff_memberships(profile_id,venue_id,extra_permissions) select p.id,case when right(p.id::text,1)='8' then '10000000-0000-0000-0000-000000000002'::uuid else '10000000-0000-0000-0000-000000000001'::uuid end,case when right(p.id::text,1)='9' then array['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE'] else '{}'::text[] end from public.profiles p where p.id::text like '30000000%' and p.role in ('MANAGER','STAFF');

update public.staff_memberships set extra_permissions=array['STAFF_MEMBERSHIP_STATUS_MANAGE'] where profile_id='30000000-0000-0000-0000-000000000009';
update public.profiles set account_status='DISABLED' where id in ('30000000-0000-0000-0000-000000000005','30000000-0000-0000-0000-000000000007');
update public.staff_memberships set status='INACTIVE' where profile_id='30000000-0000-0000-0000-000000000005';
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000001"}',true);
set local role authenticated;

select is(jsonb_array_length(public.account_access('30000000-0000-0000-0000-000000000006')),1,'Admin reads USER without membership');
select is(public.account_access('30000000-0000-0000-0000-000000000007')->0->>'account_status','DISABLED','Admin sees real disabled account status');
select is((select array_agg(key order by key) from jsonb_object_keys(public.account_access('30000000-0000-0000-0000-000000000006')->0) key),array['account_status','display_name','id','memberships','role','version'],'Admin exact minimum projection');
select is((select count(*)::int from public.profiles where id='30000000-0000-0000-0000-000000000006'),0,'Admin direct profile SELECT remains self-only');
reset role;
select ok((select bool_and(prosecdef and proconfig @> array['search_path=""'] and pg_get_userbyid(proowner)='volume_core') from pg_proc where oid in ('public.account_access(uuid)'::regprocedure,'public.membership_mutation_targets(uuid)'::regprocedure)),'Read definers retain minimum owner and empty path');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000003"}',true);
set local role authenticated;

select throws_ok($$select public.account_access()$$,'P0001','ACCESS_DENIED','CEO cannot read Admin account projection');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000004","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000004"}',true);
set local role authenticated;

select throws_ok($$select public.account_access()$$,'P0001','ACCESS_DENIED','Manager cannot read account projection');
select throws_ok($$select public.membership_mutation_targets('10000000-0000-0000-0000-000000000001')$$,'P0001','ACCESS_DENIED','Manager no HR extra denies');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000009","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000009"}',true);
set local role authenticated;

select is(jsonb_array_length(public.membership_mutation_targets('10000000-0000-0000-0000-000000000001')),1,'HR projection excludes self/other roles/other venues');
select is(public.membership_mutation_targets('10000000-0000-0000-0000-000000000001')->0->>'account_status','DISABLED','HR inactive membership does not imply active account');
select is((select array_agg(key order by key) from jsonb_object_keys(public.membership_mutation_targets('10000000-0000-0000-0000-000000000001')->0) key),array['account_status','display_name','membership_id','profile_id','profile_version','role','status','venue_id','version'],'HR exact action projection, both versions, no extras');
select throws_ok($$select public.staff_directory('10000000-0000-0000-0000-000000000001')$$,'P0001','ACCESS_DENIED','HR status-only does not grant directory visibility');
select throws_ok($$select public.membership_mutation_targets('10000000-0000-0000-0000-000000000002')$$,'P0001','ACCESS_DENIED','HR cross-venue denies');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000008","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000008"}',true);
set local role authenticated;

select throws_ok($$select public.membership_mutation_targets('10000000-0000-0000-0000-000000000002')$$,'P0001','ACCESS_DENIED','Staff without HR extra denies');
reset role;
select set_config('request.jwt.claims','{"sub":"30000000-0000-0000-0000-000000000006","role":"authenticated","session_id":"20000000-0000-0000-0000-000000000006"}',true);
set local role authenticated;

select throws_ok($$select public.account_access()$$,'P0001','ACCESS_DENIED','USER Admin projection denies');
select throws_ok($$select public.membership_mutation_targets('10000000-0000-0000-0000-000000000001')$$,'P0001','ACCESS_DENIED','USER HR projection denies');
reset role;
set local role anon;
select throws_ok($$select public.account_access()$$,'42501',null,'Anon account projection direct call denied');
select throws_ok($$select public.membership_mutation_targets('10000000-0000-0000-0000-000000000001')$$,'42501',null,'Anon mutation target projection direct call denied');
reset role;
select ok(not has_table_privilege('authenticated','public.profiles','SELECT'),'No broad profile SELECT grant');
select ok(not has_function_privilege('service_role','public.account_access(uuid)','EXECUTE') and not has_function_privilege('service_role','public.membership_mutation_targets(uuid)','EXECUTE'),'No default service-role RPC grant');
select is((select count(*)::int from public.audit_events),0,'Read projections create no success audit or data mutation');
select * from finish();
rollback;
