-- Fictional public venues only. Accounts are created through real Auth in isolated fixtures.
insert into public.venues(id,code,name,public_address,timezone,is_public,is_enabled) values
 ('10000000-0000-0000-0000-000000000001','A','Venue A','Public address A','Asia/Ho_Chi_Minh',true,true),
 ('10000000-0000-0000-0000-000000000002','B','Venue B',null,'Asia/Ho_Chi_Minh',false,true),
 ('10000000-0000-0000-0000-000000000003','DISABLED','Disabled venue',null,'Asia/Ho_Chi_Minh',true,false);
