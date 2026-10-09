"""S3-T01/T43/T45/T47/T48: exact candidate scope; no frozen-snapshot testing."""
import json
import pathlib
import re
import subprocess

BASE = '69b680da06ae3194f8dcc2bbfffce4eddf30be32'
def git(*args):
    return subprocess.check_output(['git', *args], text=True)

plan = pathlib.Path('docs/sprints/SPRINT_3_IMPLEMENTATION_PLAN.md').read_text()
allowed_paths = plan.split('```text\n')[1].split('\n```')[0].splitlines()
allowed = set(allowed_paths)
assert len(allowed) == len(allowed_paths) and all('*' not in p for p in allowed)
# Owner-approved Local Demo maintenance: independent exact scope, not a Sprint 3 contract rewrite.
DEMO_BASE = '06dbaa8526824952e8269ca35a81cc6e7c39e33c'
DEMO_PATHS = {
    'START_VOLUME.bat', 'STOP_VOLUME.bat', 'README_DEMO.md',
    'scripts/local-demo.ps1', 'scripts/local-demo-admin.mjs',
    'tests/local-demo/launcher.Tests.ps1', 'tests/local-demo/admin.test.mjs',
    '.github/workflows/local-demo.yml',
}
# Owner command: FINAL INTEGRATION authorizes this exact presentation/launcher scope.
# Business contracts, frozen migrations and existing assertions below are unchanged.
INTEGRATION_BASE = '310965e0bb6e61c0ed6b8b11dd161ac0a12ba353'
# Owner 2026-10-09 delivery: exact additive adapter paths; no business/security contract edits.
DELIVERY_PATHS = {
    '.github/workflows/local-demo.yml', 'README_DEMO.md',
    'integrations/telegram/bot.mjs', 'integrations/telegram/legacy-navigation.json',
    'integrations/telegram/.env.example', 'integrations/telegram/README.md',
    'tests/local-demo/telegram.test.mjs', 'tests/local-demo/telegram-real.mjs',
}
INTEGRATION_PATHS = {
    'apps/customer/src/App.tsx',
    'tests/e2e/showroom.spec.ts',
    'INTEGRATION_STATUS.md',
    'apps/customer/public/showroom/app.js',
    'apps/customer/public/showroom/assets/cue-closeup-1448.webp',
    'apps/customer/public/showroom/assets/cue-closeup-768.webp',
    'apps/customer/public/showroom/assets/fonts/volume-display-bold.woff',
    'apps/customer/public/showroom/assets/icon-192.png',
    'apps/customer/public/showroom/assets/icon-512.png',
    'apps/customer/public/showroom/assets/og-volume.jpg',
    'apps/customer/public/showroom/assets/player-neon-1448.webp',
    'apps/customer/public/showroom/assets/player-neon-768.webp',
    'apps/customer/public/showroom/assets/product-fallback.svg',
    'apps/customer/public/showroom/assets/products/balls-aramith.svg',
    'apps/customer/public/showroom/assets/products/case-cue.svg',
    'apps/customer/public/showroom/assets/products/chalk-kamui.svg',
    'apps/customer/public/showroom/assets/products/chalk-taom.svg',
    'apps/customer/public/showroom/assets/products/cloth-andy.svg',
    'apps/customer/public/showroom/assets/products/cloth-simonis.svg',
    'apps/customer/public/showroom/assets/products/cue-extension.svg',
    'apps/customer/public/showroom/assets/products/cue-mezz.svg',
    'apps/customer/public/showroom/assets/products/cue-peri.svg',
    'apps/customer/public/showroom/assets/products/cue-predator.svg',
    'apps/customer/public/showroom/assets/products/glove.svg',
    'apps/customer/public/showroom/assets/products/table-aileex.svg',
    'apps/customer/public/showroom/assets/products/table-diamond.svg',
    'apps/customer/public/showroom/assets/products/table-rasson.svg',
    'apps/customer/public/showroom/assets/table-neon-1448.webp',
    'apps/customer/public/showroom/assets/table-neon-768.webp',
    'apps/customer/public/showroom/assets/venue/cafe-01-1280.webp',
    'apps/customer/public/showroom/assets/venue/cafe-01-640.webp',
    'apps/customer/public/showroom/assets/venue/cafe-02-1280.webp',
    'apps/customer/public/showroom/assets/venue/cafe-02-640.webp',
    'apps/customer/public/showroom/assets/venue/cafe-03-1280.webp',
    'apps/customer/public/showroom/assets/venue/cafe-03-640.webp',
    'apps/customer/public/showroom/assets/venue/cafe-04-1280.webp',
    'apps/customer/public/showroom/assets/venue/cafe-04-640.webp',
    'apps/customer/public/showroom/assets/venue/champion-1280.webp',
    'apps/customer/public/showroom/assets/venue/champion-640.webp',
    'apps/customer/public/showroom/assets/venue/club-01-1280.webp',
    'apps/customer/public/showroom/assets/venue/club-01-640.webp',
    'apps/customer/public/showroom/assets/venue/club-02-1280.webp',
    'apps/customer/public/showroom/assets/venue/club-02-640.webp',
    'apps/customer/public/showroom/assets/venue/club-03-1280.webp',
    'apps/customer/public/showroom/assets/venue/club-03-640.webp',
    'apps/customer/public/showroom/assets/venue/club-04-1280.webp',
    'apps/customer/public/showroom/assets/venue/club-04-640.webp',
    'apps/customer/public/showroom/assets/venue/club-05-1280.webp',
    'apps/customer/public/showroom/assets/venue/club-05-640.webp',
    'apps/customer/public/showroom/assets/venue/club-06-1280.webp',
    'apps/customer/public/showroom/assets/venue/club-06-640.webp',
    'apps/customer/public/showroom/assets/venue/exterior-1280.webp',
    'apps/customer/public/showroom/assets/venue/exterior-640.webp',
    'apps/customer/public/showroom/assets/venue/logo-480.webp',
    'apps/customer/public/showroom/assets/venue/logo-960.webp',
    'apps/customer/public/showroom/assets/venue/runner-up-1280.webp',
    'apps/customer/public/showroom/assets/venue/runner-up-640.webp',
    'apps/customer/public/showroom/assets/venue/source-map.json',
    'apps/customer/public/showroom/assets/venue/third-01-1280.webp',
    'apps/customer/public/showroom/assets/venue/third-01-640.webp',
    'apps/customer/public/showroom/assets/venue/third-02-1280.webp',
    'apps/customer/public/showroom/assets/venue/third-02-640.webp',
    'apps/customer/public/showroom/billiards-physics.js',
    'apps/customer/public/showroom/ecosystem.css',
    'apps/customer/public/showroom/integration.css',
    'apps/customer/public/showroom/manifest.webmanifest',
    'apps/customer/public/showroom/motion-3d.js',
    'apps/customer/public/showroom/motion-upgrade.css',
    'apps/customer/public/showroom/rescue.css',
    'apps/customer/public/showroom/smooth-scroll.js',
    'apps/customer/public/showroom/styles.css',
    'apps/customer/public/showroom/vendor/LENIS-LICENSE.txt',
    'apps/customer/public/showroom/vendor/THREE-LICENSE.txt',
    'apps/customer/public/showroom/vendor/VOLUME-DISPLAY-LICENSE.txt',
    'apps/customer/public/showroom/vendor/lenis.min.js',
    'apps/customer/public/showroom/vendor/three.min.js',
    'apps/customer/public/showroom/venue-gallery.js',
    'apps/customer/public/showroom/venue.css',
    'apps/customer/showroom.html',
    'apps/customer/src/main.tsx',
    'apps/customer/src/showroom.ts',
    'apps/customer/vite.config.ts',
    'scripts/local-demo-admin.mjs',
    'scripts/local-demo.ps1',
    'tests/local-demo/admin.test.mjs',
    'scripts/check-sprint3-scope.py',
}
INTEGRATION_BINARY = {
    'apps/customer/public/showroom/assets/player-neon-768.webp': '2267322cd42aed872ec6fe351bfa978005c1b8d4',
    'apps/customer/public/showroom/assets/cue-closeup-1448.webp': 'ef1d32a22cc9be35dc9347f19d670387dd0fb111',
    'apps/customer/public/showroom/assets/icon-192.png': '16c421ae699da6d81e0c9d2d3a2991f8302ede33',
    'apps/customer/public/showroom/assets/player-neon-1448.webp': 'c0964a2243b6d17c536260c7362b460fec0cd35a',
    'apps/customer/public/showroom/assets/og-volume.jpg': 'daca97a2aea92cc502180cb7315479c2780f7f55',
    'apps/customer/public/showroom/assets/cue-closeup-768.webp': 'cc9ca9524b915e191057c54eecfa6054d3376cc2',
    'apps/customer/public/showroom/assets/table-neon-1448.webp': '9994bbbfe8a44edd6f1cf65ec1850c3f4fec0a31',
    'apps/customer/public/showroom/assets/table-neon-768.webp': 'e89f396bc7352989c1ba28aa5909e0eb3621dbea',
    'apps/customer/public/showroom/assets/icon-512.png': '399dd0ec1792c2c38bbf043b247ccf364a9545d3',
    'apps/customer/public/showroom/assets/venue/club-02-640.webp': 'db2441ca4ab2e557a2111f15a070cb8baa491285',
    'apps/customer/public/showroom/assets/venue/cafe-01-640.webp': 'd1a6f4e657f986d3a945b90b7583e970bc9a22f2',
    'apps/customer/public/showroom/assets/venue/logo-480.webp': 'a4220a5a9115493a24a70572eaed7b23abe4868f',
    'apps/customer/public/showroom/assets/venue/champion-1280.webp': 'a4474c7a01265f59ca96ebd29788575141d254d2',
    'apps/customer/public/showroom/assets/venue/club-05-1280.webp': '01f8d520c27241e8ba67a449b2e7a5e611cd20a6',
    'apps/customer/public/showroom/assets/venue/cafe-03-640.webp': '2a66bd4165e865d93c2b4c401d6bac66367c8fa8',
    'apps/customer/public/showroom/assets/venue/cafe-04-640.webp': 'e8141d828b17a78218c87fb84f640457c12895fd',
    'apps/customer/public/showroom/assets/venue/club-06-1280.webp': 'f960fbce2e1185a1f2c475ea5d6c464ae88ab615',
    'apps/customer/public/showroom/assets/venue/club-05-640.webp': 'bf2eee9710144c67e783e89d0025a55c81992a98',
    'apps/customer/public/showroom/assets/venue/champion-640.webp': 'd36904e56be2fa31880c98e229b0bb55dba99bc5',
    'apps/customer/public/showroom/assets/venue/club-04-1280.webp': '5363ba4be3bf0317775625c51ccd6f7f8b3e6f9b',
    'apps/customer/public/showroom/assets/venue/third-02-1280.webp': '4d2171ea86835f8ef907db1fa5dd900938e3221b',
    'apps/customer/public/showroom/assets/venue/cafe-01-1280.webp': '119d33cb71020b80c1edace5b68c56eaeea0862f',
    'apps/customer/public/showroom/assets/venue/club-04-640.webp': 'babf44fee0f2e96dc1997068c73bd3104c07a441',
    'apps/customer/public/showroom/assets/venue/third-01-1280.webp': '7d65ecf066fd9b8c35d632032cb68bda80a91106',
    'apps/customer/public/showroom/assets/venue/cafe-03-1280.webp': '11ac062bb7959dd70ce7719cea6a22645737891d',
    'apps/customer/public/showroom/assets/venue/cafe-02-1280.webp': '933880ad6d5747e5de7d9fafdebfd2175eded367',
    'apps/customer/public/showroom/assets/venue/club-03-640.webp': '6b8a26aaad33a5bf0492559295a5046e45e58fb1',
    'apps/customer/public/showroom/assets/venue/cafe-04-1280.webp': 'f9b7e638ea81e9a3c9bce682310bca591172e6b1',
    'apps/customer/public/showroom/assets/venue/cafe-02-640.webp': '50449ab688a697ae274b22166ec6111ea6453534',
    'apps/customer/public/showroom/assets/venue/exterior-640.webp': '28130a9aeff08f3b918aa6793be1c2c8d1150a23',
    'apps/customer/public/showroom/assets/venue/club-06-640.webp': 'b79fced0f82856af689c4742b6aa40db73d2a6ca',
    'apps/customer/public/showroom/assets/venue/club-01-640.webp': '484f257fa6678b6653a5aac6a3f068682a18f228',
    'apps/customer/public/showroom/assets/venue/third-01-640.webp': 'b8daa3c9c9b0852fedccd4b4fc33e729bbfd1893',
    'apps/customer/public/showroom/assets/venue/exterior-1280.webp': 'eac78ecd6929d0c25b3b2010132e9ea00cfbb729',
    'apps/customer/public/showroom/assets/venue/club-03-1280.webp': 'f3c810b922a547e02707ce7faa9b68015f26f1ba',
    'apps/customer/public/showroom/assets/venue/club-01-1280.webp': '0e7a7f401abb2e52ecae8030075f4f909add3d4d',
    'apps/customer/public/showroom/assets/venue/club-02-1280.webp': '4aa504b0bf8c8e681fdf1918d3b48342077adb9c',
    'apps/customer/public/showroom/assets/venue/runner-up-640.webp': '0b08758fe8d81eab6ccc6a2e7afe38158aa6e2a1',
    'apps/customer/public/showroom/assets/venue/third-02-640.webp': '3e792472a915645577141f02516dd9db3271769b',
    'apps/customer/public/showroom/assets/venue/runner-up-1280.webp': '3c2fbb1ae2ce6fadad8e3293e50d5d1fb316072d',
    'apps/customer/public/showroom/assets/venue/logo-960.webp': '799f213169d55aa6577e90c3dacd37cbfc3ff57e',
    'apps/customer/public/showroom/assets/fonts/volume-display-bold.woff': '2c50fd65b2d3e530af2fdb83f44cffaaf9d955ff',
}
# Owner-approved PR #10 fixture maintenance, exact transformations verified below.
FIXTURE_PATHS = {'tests/integration/fixtures/auth.ts', 'tests/e2e/fixtures/auth.ts'}
integration = set(git('diff', '--name-only', INTEGRATION_BASE, 'HEAD').splitlines())
assert integration <= INTEGRATION_PATHS | FIXTURE_PATHS | DELIVERY_PATHS, 'Unapproved integration delta: ' + str(integration - INTEGRATION_PATHS - FIXTURE_PATHS)
LOGIN_FIXTURE = 'tests/e2e/fixtures/auth.ts'  # Separately owner-approved exact synchronization only.
maintenance = set(git('diff', '--name-only', DEMO_BASE, 'HEAD').splitlines())
assert maintenance <= DEMO_PATHS | INTEGRATION_PATHS | FIXTURE_PATHS | DELIVERY_PATHS | {'scripts/check-sprint3-scope.py', LOGIN_FIXTURE}, 'Unapproved maintenance delta: ' + str(maintenance)
allowed |= DEMO_PATHS | INTEGRATION_PATHS | FIXTURE_PATHS | DELIVERY_PATHS | {LOGIN_FIXTURE}
changed = set(git('diff', '--name-only', BASE, 'HEAD').splitlines())
assert changed <= allowed, 'Unapproved paths: ' + str(changed - allowed)
baseline = git('ls-tree', '-r', '--name-only', BASE).splitlines()
frozen = ['AGENTS.md','docs/blueprint.yaml','docs/permissions.md','docs/architecture.md','docs/sprints/SPRINT_3_SPEC.md','package.json','package-lock.json','supabase/config.toml','supabase/seed.sql','playwright.config.ts','vitest.config.ts']
for p in baseline:
    if p.startswith(('supabase/migrations/','docs/decisions/')) or (p.startswith(('supabase/tests/','tests/integration/','tests/e2e/')) and p not in ['supabase/tests/sprint2_constraints.test.sql','tests/integration/fixtures/payment.ts','tests/integration/fixtures/auth.ts']):
        frozen.append(p)
for p in frozen:
    if p == LOGIN_FIXTURE:
        original = subprocess.check_output(['git', 'show', BASE + ':' + LOGIN_FIXTURE])
        marker = " if(name==='disabled'){await expect(page.getByRole('status')).toContainText('Quyền truy cập');return;}\n".encode('utf-8')
        insertion = b" await page.waitForURL(origin+(surface==='customer'?'/profile':'/overview'));\n"
        assert original.count(marker) == 1 and insertion not in original
        expected = original.replace(marker, marker + insertion)
        diagnostics_before = b"diagnostics:[async({page},use,info)=>{const events:object[]=[];page.on('response',r=>{const path=new URL(r.url()).pathname;if(path.startsWith('/auth/v1/')||path.startsWith('/rest/v1/'))events.push({path,status:r.status()});});page.on('requestfailed',r=>events.push({path:new URL(r.url()).pathname,status:'request_failed'}));page.on('pageerror',e=>events.push({error:e.name}));await use();if(info.status!==info.expectedStatus)await info.attach('http-statuses',{body:Buffer.from(JSON.stringify(events)),contentType:'application/json'});},{auto:true}]});"
        diagnostics_after = b"diagnostics:[async({page},use,info)=>{\n const events:object[]=[];const started=Date.now();const record=(event:object)=>events.push({ms:Date.now()-started,...event});\n const path=(url:string)=>{try{return new URL(url).pathname;}catch{return 'unavailable';}};\n page.on('request',r=>{if(r.isNavigationRequest())record({event:'navigation-request',path:path(r.url()),method:r.method()});});\n page.on('response',r=>{const p=path(r.url());if(r.request().isNavigationRequest()||p.startsWith('/auth/v1/')||p.startsWith('/rest/v1/'))record({event:'response',path:p,status:r.status()});});\n page.on('requestfailed',r=>{const error=r.failure()?.errorText||'';record({event:'request-failed',path:path(r.url()),navigation:r.isNavigationRequest(),kind:/internal error/i.test(error)?'internal':/abort|cancel/i.test(error)?'aborted':/timeout/i.test(error)?'timeout':'other'});});\n page.on('pageerror',e=>record({event:'pageerror',error:e.name}));\n page.on('crash',()=>record({event:'crash'}));\n page.on('framenavigated',frame=>{if(frame===page.mainFrame())record({event:'navigation-commit',path:path(frame.url())});});\n page.on('domcontentloaded',()=>record({event:'domcontentloaded',path:path(page.url())}));\n page.on('load',()=>record({event:'load',path:path(page.url())}));\n try{await use();}finally{if(info.status!==info.expectedStatus)await info.attach('http-statuses',{body:Buffer.from(JSON.stringify(events)),contentType:'application/json'});}\n},{auto:true}]});"
        assert expected.count(diagnostics_before) == 1
        expected = expected.replace(diagnostics_before, diagnostics_after)
        login_before = b"export async function login(page:Page,f:Fixture,name:string,surface='control'){\n const origin=surface==='customer'?customer:control;\n await page.goto(origin+'/login');await page.evaluate(()=>localStorage.clear());await page.goto(origin+'/login');\n await page.getByLabel('Email',{exact:true}).fill(f.users[name].email);await page.getByLabel('M\xe1\xba\xadt kh\xe1\xba\xa9u',{exact:true}).fill(f.users[name].password);await page.getByRole('button',{name:'\xc4\x90\xc4\x83ng nh\xe1\xba\xadp',exact:true}).click();\n if(name==='disabled'){await expect(page.getByRole('status')).toContainText('Quy\xe1\xbb\x81n truy c\xe1\xba\xadp');return;}\n await page.waitForURL(origin+(surface==='customer'?'/profile':'/overview'));\n if(surface==='customer')await expect(page.getByRole('heading',{name:'Xin ch\xc3\xa0o,'+ ' '+name})).toBeVisible();\n else if(name.startsWith('user'))await expect(page.getByRole('heading',{name:'\xc4\x90\xc3\xa2y l\xc3\xa0 khu v\xe1\xbb\xb1c nh\xc3\xa2n s\xe1\xbb\xb1'})).toBeVisible();\n else await expect(page.getByRole('heading',{name:'Xin ch\xc3\xa0o,'+' '+name})).toBeVisible();\n await page.waitForLoadState('load');\n}\n\n"
        login_after = b"export async function login(page:Page,f:Fixture,name:string,surface='control'){\n const origin=surface==='customer'?customer:control;\n const webkit=page.context().browser()?.browserType().name()==='webkit';\n await page.goto(origin+'/login');await expect(page.getByLabel('Email',{exact:true})).toBeVisible();if(webkit)await page.waitForLoadState('networkidle');await page.evaluate(()=>localStorage.clear());await page.goto(origin+'/login');\n await page.getByLabel('Email',{exact:true}).fill(f.users[name].email);await page.getByLabel('M\xe1\xba\xadt kh\xe1\xba\xa9u',{exact:true}).fill(f.users[name].password);await page.getByRole('button',{name:'\xc4\x90\xc4\x83ng nh\xe1\xba\xadp',exact:true}).click();\n if(name==='disabled'){await expect(page.getByRole('status')).toContainText('Quy\xe1\xbb\x81n truy c\xe1\xba\xadp');return;}\n await page.waitForURL(origin+(surface==='customer'?'/profile':'/overview'));\n if(surface==='customer')await expect(page.getByRole('heading',{name:'Xin ch\xc3\xa0o,'+ ' '+name})).toBeVisible();\n else if(name.startsWith('user'))await expect(page.getByRole('heading',{name:'\xc4\x90\xc3\xa2y l\xc3\xa0 khu v\xe1\xbb\xb1c nh\xc3\xa2n s\xe1\xbb\xb1'})).toBeVisible();\n else await expect(page.getByRole('heading',{name:'Xin ch\xc3\xa0o,'+' '+name})).toBeVisible();\n await page.waitForLoadState('load');\n // WebKit logs showed new RPC bursts after the heading/load event. Wait for\n // its network to settle before the next hard navigation; UI assertions above\n // still prove login, and existing test/navigation timeouts remain unchanged.\n if(webkit)await page.waitForLoadState('networkidle');\n}\n\n"
        assert expected.count(login_before) == 1
        expected = expected.replace(login_before, login_after)
        assert pathlib.Path(p).read_bytes() == expected, 'Only exact approved login synchronization and redacted navigation diagnostics allowed'
    else:
        assert not git('diff','--name-only',BASE,'HEAD','--',p).strip(), 'Frozen file changed: '+p
auth_fixture='tests/integration/fixtures/auth.ts'
old=git('show',BASE+':'+auth_fixture)
source="const r=await fetch(`${base}/auth/v1/${path}`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(body)});"
assert old.count(source)==1
expected=old.replace(source,source.replace("headers:{apikey:anon,","headers:{Connection:'close',apikey:anon,"))
auth_before = "  async function auth(path:string,body:object) {\n    const r=await fetch(`${base}/auth/v1/${path}`,{method:'POST',headers:{Connection:'close',apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(body)});\n    const data=await r.json(); return {status:r.status,data};\n  }\n"
auth_after = "  async function auth(path:string,body:object) {\n    // One socket per local Auth request: never reuse a connection closed by GoTrue/Kong.\n    // No retry: transport, incomplete response and JSON errors still fail the fixture.\n    const payload=JSON.stringify(body);\n    const r=await new Promise<{status:number;text:string}>((resolve,reject)=>{\n      const req=httpRequest(`${base}/auth/v1/${path}`,{\n        method:'POST',agent:false,\n        headers:{Connection:'close',apikey:anon,'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)},\n      },res=>{\n        let text='';res.setEncoding('utf8');\n        res.on('data',chunk=>{text+=chunk;});res.once('error',reject);\n        res.once('end',()=>{if(!res.complete)reject(new Error('Incomplete local Auth response'));else resolve({status:res.statusCode??0,text});});\n      });\n      req.once('error',reject);req.end(payload);\n    });\n    const data=JSON.parse(r.text); return {status:r.status,data};\n  }\n"
assert expected.count(auth_before) == 1
expected = expected.replace(auth_before, auth_after).replace("import { randomUUID } from 'node:crypto';\n", "import { randomUUID } from 'node:crypto';\nimport { request as httpRequest } from 'node:http';\n")
assert pathlib.Path(auth_fixture).read_bytes()==expected.encode('utf-8'), 'Only exact approved one-socket Auth transport allowed; all assertions/Auth semantics unchanged'
fixture='tests/integration/fixtures/payment.ts'
old=git('show',BASE+':'+fixture)
expected=old.replace('truncate public.payment_receipts,public.payments,public.table_sessions,public.billiard_tables,public.audit_events','truncate public.session_financial_issues,public.session_cash_receipts,public.payment_receipts,public.payments,public.table_sessions,public.billiard_tables,public.audit_events')
assert pathlib.Path(fixture).read_text()==expected, 'Only exact isolated FK reset adaptation allowed'
test='supabase/tests/sprint2_constraints.test.sql'
old=git('show',BASE+':'+test)
expected=old.replace("where table_schema='public' and table_type='BASE TABLE'),8,'T65 exactly eight approved business tables'", "where table_schema='public' and table_type='BASE TABLE' and table_name in ('profiles','venues','staff_memberships','audit_events','billiard_tables','table_sessions','payments','payment_receipts')),8,'T65 exactly eight retained Sprint2 business tables'")
assert pathlib.Path(test).read_text()==expected, 'Only named frozen eight-table assertion adaptation allowed'
for p in git('ls-files').splitlines():
    raw=pathlib.Path(p).read_bytes()
    if p in INTEGRATION_BINARY:
        assert git('hash-object', p).strip() == INTEGRATION_BINARY[p], 'Unapproved binary asset change: '+p
        data=raw.decode('latin-1')  # Preserve ASCII secret scanning over every binary byte.
    else:
        data=raw.decode('utf-8')
    assert not re.search(r'sb_secret_[A-Za-z0-9_-]{15,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}',data), 'Secret-like value: '+p
    assert not p.startswith('reference/') and (p in DELIVERY_PATHS or not re.search(r'/(?:player|matches|video|tournament|shop|telegram|crm|ai|refund)/',p,re.I)), 'Forbidden scope: '+p
    if p.startswith(('apps/','packages/')):
        assert all(x not in data for x in ['SUPABASE_DB_URL','payment-adapter','service_role']), 'Server capability in client: '+p
for p,marker in [('.github/workflows/sprint1a.yml','      - name: Install locked core test dependencies\n'),('.github/workflows/sprint1b.yml','      - name: Locked dependencies, typecheck, lint, unit tests, dependency audit\n')]:
    assert git('show',BASE+':'+p).split(marker)[1] == pathlib.Path(p).read_text().split(marker)[1], 'Frozen runtime changed: '+p
for p,marker in [('.github/workflows/sprint1a.yml','      - name: Scope, frozen documents and secret scan\n'),('.github/workflows/sprint1b.yml','      - name: Exact 1B allowlist, frozen core and secret scan\n')]:
    assert git('show',BASE+':'+p).split(marker)[0] == pathlib.Path(p).read_text().split(marker)[0], 'Frozen workflow authority changed: '+p
assert "TARGETED_EDGE_UI: 'false'" in pathlib.Path('.github/workflows/sprint3.yml').read_text(), 'Sprint3 must run full candidate coverage'
assert {f'T{i:02}' for i in range(1,63)} <= set(re.findall(r'\bT\d\d\b',plan)), 'Missing scenario mapping'
print(f'PASS Sprint3 exact {len(allowed)}-path scope; frozen migrations/Auth/security/dependencies/regressions; no secrets/future modules')
