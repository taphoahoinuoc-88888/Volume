import {randomUUID} from 'node:crypto';
import {test,expect,login,customer} from './fixtures/payment';
test('T03/39/81: public selection and actual JWT-verified Edge QR failure release',async({page,payment:f})=>{
 await page.goto(customer+'/tables');await expect(page.getByTestId('table-'+f.tableA)).toBeVisible();await expect(page.getByTestId('table-'+f.tableB)).toHaveCount(0);
 await login(page,f,'user1','customer');await page.getByRole('link',{name:'Chọn bàn',exact:true}).click();await page.getByTestId('table-'+f.tableA).getByRole('button',{name:'Chọn bàn',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Yêu cầu đã kết thúc'})).toBeVisible();await expect(page.getByText('Bàn đã được trả lại; yêu cầu này không thể mở lại.',{exact:false})).toBeVisible();
 const rows=(await f.db.query('select state from public.table_sessions where table_id=$1',[f.tableA])).rows;expect(rows).toEqual([{state:'CANCELLED'}]);expect((await f.db.query('select state from public.payments')).rows).toEqual([{state:'CANCELLED'}]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('T13/19/61/62/71: partial, automatic full payment and fixed initial timer via real backend',async({page,payment:f})=>{
 const a=await f.acquire();expect(a.status).toBe(200);const r=await f.row(a.data.session_id);await f.credit(f.event(r.reference,'70000'));
 await login(page,f,'user1','customer');await page.goto(customer+'/table-session?session='+r.id);await expect(page.getByRole('heading',{name:'Đang chờ thanh toán'})).toBeVisible();await expect(page.locator('dd').nth(0)).toContainText('100.000');await expect(page.locator('dd').nth(1)).toContainText('70.000');await expect(page.locator('dd').nth(2)).toContainText('30.000');
 await expect(page.getByLabel('Thời gian giữ bàn còn lại')).toBeVisible();const e=f.event(r.reference,'30000');await f.credit(e);await expect(page.getByRole('heading',{name:'Bàn đã mở'})).toBeVisible();await expect(page.getByLabel('Thời gian ban đầu còn lại')).toHaveText(/^(60:00|59:\d\d)$/);
 const started=(await f.row(r.id)).started_at;await f.credit(e);expect((await f.row(r.id)).started_at).toEqual(started);
 const c=await f.db.connect();try{await c.query('begin');await c.query("with t as materialized(select clock_timestamp()-interval '61 minutes' n) update public.table_sessions set started_at=t.n,acquired_at=t.n-interval '1 minute',expires_at=t.n+interval '4 minutes' from t where id=$1",[r.id]);await c.query('update public.payments set payment_success_at=(select started_at from public.table_sessions where id=$1) where session_id=$1',[r.id]);await c.query('commit');}catch(e){await c.query('rollback');throw e;}finally{c.release();}
 await page.getByRole('button',{name:'Tải lại trạng thái'}).click();await expect(page.getByLabel('Thời gian ban đầu còn lại')).toHaveText('00:00');await expect(page.getByText('Thời gian ban đầu đã hết.',{exact:false})).toBeVisible();expect((await f.row(r.id)).state).toBe('ACTIVE');
});
test('T20/22/70/87: partial expiry separates financial case, table and public venue contact',async({page,payment:f})=>{
 expect((await f.rpc('admin1','set_venue_management_contact',{p_venue:f.A,p_expected_version:'1',p_contact:'Quầy quản lý chi nhánh A',p_reason:'Public business contact'})).status).toBe(200);
 const a=await f.acquire();const r=await f.row(a.data.session_id);await f.credit(f.event(r.reference,'70000'));await f.makeExpired(r.id);await f.expire();
 await login(page,f,'user1','customer');await page.goto(customer+'/table-session?session='+r.id);await expect(page.getByRole('heading',{name:'Khoản thanh toán cần xử lý'})).toBeVisible();await expect(page.getByText('Vui lòng liên hệ quản lý: Quầy quản lý chi nhánh A')).toBeVisible();await expect(page.getByRole('button',{name:'Hủy giữ bàn'})).toHaveCount(0);
 const second=await f.acquire('user2',f.tableA,randomUUID());expect(second.status).toBe(200);await f.credit(f.event(r.reference,'30000'));await page.getByRole('button',{name:'Tải lại trạng thái'}).click();await expect(page.getByRole('heading',{name:'Khoản thanh toán cần xử lý'})).toBeVisible();expect((await f.row(second.data.session_id)).state).toBe('PENDING_PAYMENT');expect((await f.row(r.id)).started_at).toBeNull();
});
test('T30/31/72/81: customer cancellation confirms and same-key retry does not create parallel holds',async({page,payment:f})=>{
 const key=randomUUID(),a=await f.acquire('user1',f.tableA,key);expect((await f.acquire('user1',f.tableA,key)).data.session_id).toBe(a.data.session_id);
 await login(page,f,'user1','customer');await page.goto(customer+'/table-session?session='+a.data.session_id);await page.getByRole('button',{name:'Hủy giữ bàn'}).click();await expect(page.getByRole('heading',{name:'Xác nhận hủy giữ bàn'})).toBeVisible();expect((await f.row(a.data.session_id)).state).toBe('PENDING_PAYMENT');await page.getByRole('button',{name:'Xác nhận hủy',exact:true}).click();await expect(page.getByRole('heading',{name:'Yêu cầu đã kết thúc'})).toBeVisible();expect((await f.acquire('user1',f.tableA,key)).data.session_id).toBe(a.data.session_id);expect((await f.db.query('select count(*)::int n from public.table_sessions')).rows[0].n).toBe(1);
});
