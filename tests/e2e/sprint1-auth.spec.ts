import {test,expect,login,customer} from './fixtures/auth';
test('PW01: customer login, profile validation/CAS, logout and disabled account',async({page,volume:f})=>{
 await login(page,f,'user1','customer');
 const name=page.getByLabel('Tên hiển thị');await name.fill('   ');await page.getByRole('button',{name:'Lưu tên',exact:true}).click();await expect(page.getByRole('status')).toContainText('Vui lòng nhập tên');await expect(name).toHaveValue('   ');
 await name.fill('Tên mới');await page.getByRole('button',{name:'Lưu tên',exact:true}).click();await expect(page.getByRole('status')).toContainText('Đã lưu');expect((await f.db.query('select display_name,version from public.profiles where id=$1',[f.users.user1.id])).rows[0]).toEqual({display_name:'Tên mới',version:'2'});
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect(page.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();
 await login(page,f,'disabled','customer');
});
test('PW01: real email recovery link, new password and old password denial',async({page,volume:f})=>{
 await page.goto(customer+'/login');await page.getByRole('button',{name:'Quên mật khẩu?'}).click();await page.getByLabel('Email',{exact:true}).fill(f.users.user1.email);await page.getByRole('button',{name:'Gửi email khôi phục'}).click();await expect(page.getByRole('status')).toContainText('hướng dẫn khôi phục');
 let hash='';for(let attempt=0;attempt<20;attempt++){const list=await(await fetch('http://127.0.0.1:54324/api/v1/messages')).json();const mail=list.messages?.find((m:any)=>m.To?.some((t:any)=>t.Address===f.users.user1.email));if(mail){const msg=await(await fetch('http://127.0.0.1:54324/api/v1/message/'+mail.ID)).json();const match=(msg.Text+' '+msg.HTML).match(/[?&]token=([^&"'<>\s]+)/);if(match){hash=decodeURIComponent(match[1]);break;}}await new Promise(r=>setTimeout(r,100));}
 expect(Boolean(hash),'Captured real recovery email required').toBe(true);
 await page.goto(f.base+'/auth/v1/verify?token='+encodeURIComponent(hash)+'&type=recovery&redirect_to='+encodeURIComponent(customer+'/recovery'));await expect(page.getByRole('heading',{name:'Đặt mật khẩu mới'})).toBeVisible();
 const password='Recovered-browser-password-2026!';await page.getByLabel('Mật khẩu mới').fill(password);await page.getByRole('button',{name:'Lưu mật khẩu mới'}).click();await expect(page.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();
 expect((await f.auth('token?grant_type=password',{email:f.users.user1.email,password:f.users.user1.password})).status).toBeGreaterThanOrEqual(400);f.users.user1.password=password;await login(page,f,'user1','customer');
 expect((await f.auth('verify',{token_hash:hash,type:'recovery'})).status).toBeGreaterThanOrEqual(400);
});
test('PW05: old open tab clears protected data after database cutoff',async({page,volume:f})=>{
 await login(page,f,'user2','customer');await f.account('user2','DISABLED');
 await page.getByLabel('Tên hiển thị').fill('Must not persist');await page.getByRole('button',{name:'Lưu tên',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();await expect(page.getByLabel('Tên hiển thị')).toHaveCount(0);
 expect((await f.db.query('select display_name from public.profiles where id=$1',[f.users.user2.id])).rows[0].display_name).toBe('user2');
});
