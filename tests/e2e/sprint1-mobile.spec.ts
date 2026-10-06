import {test,expect,login} from './fixtures/auth';
test('PW07: desktop/mobile layout, keyboard focus and real screenshots',async({page,volume:f},info)=>{
 await login(page,f,'managerA');await page.getByRole('link',{name:'Chi nhánh',exact:true}).click();await expect(page.getByTestId('venue-'+f.A)).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.getByRole('link',{name:'Tổng quan',exact:true}).focus();await expect(page.getByRole('link',{name:'Tổng quan',exact:true})).toBeFocused();
 await info.attach('scoped-venue-layout',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect(page.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.tagName)).not.toBe('BODY');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await info.attach('email-password-layout',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
