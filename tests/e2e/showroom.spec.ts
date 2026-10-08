import {test,expect} from '@playwright/test';

test('Cinematic showroom, real account routes, galleries and Telegram destinations',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:3000/');
 await expect(page).toHaveURL(/\/showroom\.html$/);
 await expect(page.locator('#hero-title')).toContainText('VOLUME');
 await expect(page.locator('#cinematicLoader')).toHaveCount(0);
 await expect(page.locator('.hero-table')).toBeVisible();
 expect(await page.locator('.hero-table').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await info.attach('showroom-hero',{body:await page.screenshot(),contentType:'image/png'});
 const links=await page.locator('a[data-telegram]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href));
 expect(links.length).toBeGreaterThan(5);
 for(const link of links)expect(link).toMatch(/^https:\/\/t\.me\/Volumestation_bot\?start=(home|shop|rank|tournament|feedback|club_owner)$/);
 const menu=page.getByRole('button',{name:'Mở menu',exact:true});
 if(await menu.isVisible()){
  await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#mobileMenu')).toHaveAttribute('inert','');
 }
 const gallery=page.locator('#venue [data-gallery]');await gallery.scrollIntoViewIfNeeded();
 await gallery.getByRole('button',{name:'Ảnh tiếp'}).click();
 await expect(gallery.locator('[data-gallery-count]')).not.toHaveText('1 / 6');
 await page.locator('#booking').scrollIntoViewIfNeeded();
 await expect(page.locator('#liveTablesStatus')).not.toHaveText('Đang tải trạng thái bàn…');
 await info.attach('showroom-booking',{body:await page.screenshot(),contentType:'image/png'});
 await page.getByRole('link',{name:'CHỌN BÀN ↗',exact:true}).click();
 await expect(page).toHaveURL(/\/tables$/);await expect(page.getByRole('heading',{name:'Chọn bàn',exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});

test('Reduced-motion showroom stays readable without an intro barrier',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:3000/showroom.html');
 await expect(page.locator('#hero-title')).toBeVisible();
 await expect(page.locator('#cinematicLoader')).toBeHidden();
 await expect(page.locator('a[href="/tables"]').first()).toBeVisible();
});
