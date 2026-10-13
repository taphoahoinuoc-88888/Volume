import test from 'node:test';import assert from 'node:assert/strict';import {parseAdminInput,checkCredentials} from '../../scripts/local-demo-admin.mjs';import {configuration} from '../../integrations/telegram/bot.mjs';
const key='header.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';
const env={VOLUME_SUPABASE_URL:'http://127.0.0.1:55321',VOLUME_SUPABASE_ANON_KEY:key,VOLUME_CUSTOMER_URL:'http://127.0.0.1:3000',VOLUME_TELEGRAM_USERNAME:'VolumeTest_bot'};
test('Windows UTF-8 BOM input reaches actual credential validation unchanged',()=>{const data={email:'owner@example.test',password:'Mật-khẩu-kiểm-thử-123!'};const input=parseAdminInput('\uFEFF'+JSON.stringify(data));assert.deepEqual(checkCredentials(input.email,input.password),data);assert.deepEqual(parseAdminInput(JSON.stringify(data)),data);});
test('BOM handling does not hide invalid JSON or accept unsafe credentials',()=>{assert.throws(()=>parseAdminInput('\uFEFF{invalid'));const d=parseAdminInput('\uFEFF{"email":"owner@example.test","password":"short"}');assert.throws(()=>checkCredentials(d.email,d.password));});
test('Loopback HTTP customer URLs require exact local test opt-in',()=>{assert.throws(()=>configuration(env));assert.throws(()=>configuration({...env,VOLUME_TELEGRAM_LOCAL_TEST:'true'}));assert.equal(configuration({...env,VOLUME_TELEGRAM_LOCAL_TEST:'1'}).web,'http://127.0.0.1:3000');for(const url of ['http://example.com','http://127.0.0.1.evil','http://user:password@localhost:3000','http://localhost:3000/?token=x'])assert.throws(()=>configuration({...env,VOLUME_TELEGRAM_LOCAL_TEST:'1',VOLUME_CUSTOMER_URL:url}));});

import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {verifyUpgradeInputs} from '../../scripts/local-demo-admin.mjs';
test('Upgrade refuses config/seed/Edge drift before migration or fingerprint acceptance',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'volume-product-upgrade-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const runtime=path.join(root,'runtime');
 for(const base of [root,runtime]){await fs.mkdir(path.join(base,'supabase/functions/test'),{recursive:true});await fs.writeFile(path.join(base,'supabase/seed.sql'),'-- immutable seed');await fs.writeFile(path.join(base,'supabase/functions/test/index.ts'),'// immutable function');}
 const original='project_id = "volume-v2"\nport = 54321\nport = 54322\nshadow_port = 54320\nport = 54324\n';
 await fs.writeFile(path.join(root,'supabase/config.toml'),original);
 const target=path.join(runtime,'supabase/config.toml');const rendered=original.replace('volume-v2','owned-project').replace('54321','55321').replace('54322','55322').replace('54320','55320').replace('54324','55324');await fs.writeFile(target,rendered);
 const ctx={root,runtime};await verifyUpgradeInputs(ctx,{project:'owned-project'});
 for(const [file,content] of [['config.toml',rendered],['seed.sql','-- immutable seed'],['functions/test/index.ts','// immutable function']]){const p=path.join(runtime,'supabase',file);await fs.writeFile(p,'unapproved change');await assert.rejects(verifyUpgradeInputs(ctx,{project:'owned-project'}));await fs.writeFile(p,content);}
 await fs.writeFile(path.join(runtime,'supabase/functions/extra.ts'),'// extra');await assert.rejects(verifyUpgradeInputs(ctx,{project:'owned-project'}));
});
