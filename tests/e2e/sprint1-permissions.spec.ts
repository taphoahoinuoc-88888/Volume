import {test,expect,login,control} from './fixtures/auth';
test('PW02/04: five roles get only allowed navigation and venue scope',async({page,volume:f})=>{
 for(const name of ['admin1','ceo','managerA','staffA','user1']){
  await login(page,f,name);
  if(name==='user1'){await expect(page.getByRole('navigation')).toHaveCount(0);continue;}
  await expect(page.getByRole('link',{name:'Chi nhánh',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Nhật ký',exact:true})).toHaveCount(name==='staffA'?0:1);
  await expect(page.getByRole('link',{name:'Nhân sự & truy cập',exact:true})).toHaveCount(name==='staffA'?0:1);
  await page.getByRole('link',{name:'Chi nhánh',exact:true}).click();
  await expect(page.getByTestId('venue-'+f.A)).toBeVisible();
  await expect(page.getByTestId('venue-'+f.B)).toHaveCount(['admin1','ceo'].includes(name)?1:0);
  await expect(page.getByRole('button',{name:'Thêm chi nhánh'})).toHaveCount(name==='admin1'?1:0);
 }
});
test('PW02: direct route and actual backend cross-role/cross-venue requests deny',async({page,volume:f})=>{
 await login(page,f,'managerA');await page.goto(control+'/people?venue='+f.B);await expect(page.getByRole('heading',{name:'Không có quyền truy cập'})).toBeVisible();expect((await f.rpc('managerA','staff_directory',{p_venue:f.B})).status).toBeGreaterThanOrEqual(400);
 await login(page,f,'staffA');await page.goto(control+'/audit');await expect(page.getByRole('heading',{name:'Không có quyền truy cập'})).toBeVisible();expect((await f.rpc('staffA','audit_feed')).status).toBeGreaterThanOrEqual(400);
 await login(page,f,'ceo');await page.goto(control+'/people');await expect(page.getByRole('button',{name:'Quyền truy cập',exact:true})).toHaveCount(0);expect((await f.rpc('ceo','account_access')).status).toBeGreaterThanOrEqual(400);
});
test('PW06: status-only HR gets target CAS without directory, cross-venue or other roles',async({page,volume:f})=>{
 const own=await f.membership('hrA');await f.changeRole('hrA','STAFF','admin1',[{id:own.id,venue_id:f.A,status:'ACTIVE',extra_permissions:['STAFF_MEMBERSHIP_STATUS_MANAGE'],expected_version:own.version}]);
 await login(page,f,'hrA');await page.getByRole('link',{name:'Nhân sự & truy cập',exact:true}).click();
 await expect(page.getByRole('heading',{name:'staffA',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'managerA',exact:true})).toHaveCount(0);await expect(page.getByRole('heading',{name:'staffB',exact:true})).toHaveCount(0);
 expect((await f.rpc('hrA','staff_directory',{p_venue:f.A})).status).toBeGreaterThanOrEqual(400);
 const target=await f.membership('staffA');await page.getByTestId('membership-'+target.id).getByRole('button',{name:'Đổi trạng thái làm việc'}).click();await expect(page.getByRole('dialog')).toContainText('Ngừng tại chi nhánh');await page.getByLabel('Lý do').fill('Ngừng làm việc tại chi nhánh A');await page.getByRole('button',{name:'Xác nhận lưu'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 const after=await f.membership('staffA');expect(after.status).toBe('INACTIVE');expect(after.version).toBe('2');expect((await f.db.query('select account_status,version from public.profiles where id=$1',[f.users.staffA.id])).rows[0]).toEqual({account_status:'ACTIVE',version:'2'});
 await page.goto(control+'/people?venue='+f.B);await expect(page.getByRole('heading',{name:'Không có quyền truy cập'})).toBeVisible();
 await page.goto(control+'/people');
 const current=await f.membership('hrA');
 const revoked=await f.changeRole('hrA','STAFF','admin1',[{id:current.id,venue_id:f.A,status:'ACTIVE',extra_permissions:[],expected_version:current.version}]);expect(revoked.status).toBe(200);
 await page.getByRole('button',{name:'Tải lại dữ liệu'}).click();await expect(page.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'staffA',exact:true})).toHaveCount(0);
 await login(page,f,'hrA');await expect(page.getByRole('link',{name:'Nhân sự & truy cập',exact:true})).toHaveCount(0);
 await f.login('hrA');expect((await f.rpc('hrA','membership_mutation_targets',{p_venue:f.A})).status).toBeGreaterThanOrEqual(400);
});

