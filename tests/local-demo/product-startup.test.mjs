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

// Explicit CI-only opt-in: never operate on an existing owner installation.
if(process.env.VOLUME_PRODUCT_REAL==='1')test('REAL product data and Telegram link survive reviewed upgrade and owned STOP/START', {timeout:1200000},async t=>{
 assert.equal(process.env.GITHUB_ACTIONS,'true','Disposable GitHub runner required');
 const {context,command}=await import('../../scripts/local-demo-admin.mjs');
 const {randomUUID,createHash}=await import('node:crypto');const {default:pg}=await import('pg');
 const ctx=await context();await assert.rejects(fs.access(ctx.stateFile),e=>e.code==='ENOENT','Refuse existing installation');
 const helper=path.join(ctx.root,'scripts/local-demo-admin.mjs');
 const cli=(mode,input)=>command(process.execPath,[helper,mode],{cwd:ctx.root,input:input?JSON.stringify(input):'',timeout:1000000});
 let db;t.after(async()=>{if(db)await db.end();await cli('stop');});
 assert.equal(JSON.parse(await cli('start')).needsAdmin,true);
 const local=JSON.parse(await command(ctx.cli,['status','--workdir',ctx.runtime,'-o','json']));
 db=new pg.Pool({connectionString:local.DB_URL});
 const password='Fixture-'+randomUUID()+'!';const email='retention-'+randomUUID()+'@example.test';
 assert.equal(JSON.parse(await cli('admin',{email,password})).created,true);
 async function auth(method,body){const r=await fetch(local.API_URL+'/auth/v1/'+method,{method:'POST',headers:{apikey:local.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,'Real Auth '+method);return r.json();}
 const admin=await auth('token?grant_type=password',{email,password});const userEmail='customer-'+randomUUID()+'@example.test';await auth('signup',{email:userEmail,password});let user=await auth('token?grant_type=password',{email:userEmail,password});
 async function rpc(who,name,body={}){const r=await fetch(local.API_URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:local.ANON_KEY,Authorization:'Bearer '+who.access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();assert.equal(r.status,200,'RPC '+name+' '+(value.code||''));return value;}
 const venue='10000000-0000-0000-0000-000000000001';
 const product=await rpc(admin,'save_product',{p_id:null,p_venue:venue,expected_version:null,p_sku:'RETENTION',p_name:'DEMO retention fixture',p_category:'CUES',p_variant:'',p_description:'CI only',p_image_url:'/showroom/assets/product-fallback.svg',p_price_vnd:'100000',p_visible:true,p_reason:'Isolated retention test'});
 await rpc(admin,'adjust_stock',{p_product:product.id,expected_version:'1',p_delta:5,p_reason:'Fixture receipt'});
 const catalogue=(await rpc(user,'shop_catalog')).find(p=>p.id===product.id);
 const order=await rpc(user,'create_shop_order',{p_venue:venue,p_items:[{id:product.id,quantity:2,version:catalogue.version,price_vnd:catalogue.price_vnd,available:catalogue.available}],p_request_key:randomUUID()});
 await rpc(admin,'change_shop_order',{p_order:order.id,expected_version:'1',p_action:'CASH',p_reason:'Fixture actual cash'});
 await rpc(user,'ensure_player_profile');const rank=await rpc(admin,'save_rank',{p_id:null,p_venue:venue,expected_version:null,p_name:'Fixture rank',p_active:true,p_reason:'Club fixture'});await rpc(admin,'assign_player_rank',{p_profile:user.user.id,p_venue:venue,p_rank:rank.id,expected_version:null,p_reason:'Fixture assessment'});
 const ticket=await rpc(user,'create_feedback',{p_venue:venue,p_category:'SERVICE',p_message:'Retention fixture',p_order:order.id,p_session:null,p_request_key:randomUUID()});
 await rpc(admin,'update_feedback',{p_ticket:ticket.id,expected_version:'1',p_state:'IN_PROGRESS',p_assigned_to:null,p_message:'PRIVATE retention note',p_internal:true,p_reason:'Fixture investigation'});
 await rpc(admin,'update_feedback',{p_ticket:ticket.id,expected_version:'2',p_state:'RESOLVED',p_assigned_to:null,p_message:'Public retention reply',p_internal:false,p_reason:'Fixture reply'});
 const table=await rpc(admin,'create_billiard_table',{p_venue:venue,p_code:'RETENTION',p_label:'Retention table',p_hourly_price_vnd:'100000',p_reason:'Fixture table'});await rpc(admin,'open_table_manual',{p_table:table.id,p_customer:user.user.id,p_expected_table_version:'1',p_request_key:randomUUID(),p_reason:'Fixture manual opening'});
 async function transport(sql,args){const c=await db.connect();try{await c.query('begin');await c.query('set local role volume_telegram_transport');const r=await c.query(sql,args);await c.query('commit');return r.rows[0].result;}catch(e){await c.query('rollback');throw e;}finally{c.release();}}
 const proof=await rpc(user,'begin_telegram_link');await transport('select private.telegram_redeem($1,$2,$3) result',[proof.proof,43001,'Fixture owner']);const pending=(await rpc(user,'telegram_link_status')).pending;await rpc(user,'confirm_telegram_link',{p_challenge:pending.id,expected_version:pending.version});
 const relations=['public.profiles','public.products','public.shop_orders','public.shop_order_items','public.inventory_movements','public.player_profiles','public.rank_definitions','public.player_ranks','public.rank_history','public.feedback_tickets','public.feedback_messages','public.table_sessions','private.telegram_links','private.telegram_challenges'];
 async function snapshot(){const result={};for(const relation of relations){const r=(await db.query('select count(*)::int n, coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),\'[]\'::jsonb)::text data from '+relation+' t')).rows[0];assert.ok(r.n>0,'Populated '+relation);result[relation]={count:r.n,digest:createHash('sha256').update(r.data).digest('hex')};}return result;}
 const before=await snapshot();const beforeOrders=await rpc(user,'shop_orders_read');assert.deepEqual(await transport('select private.telegram_read($1,$2) result',[43001,'orders']),beforeOrders);
 const backupsBefore=new Set((await fs.readdir(ctx.runtime)).filter(n=>/^backup-product-.*\.dump$/.test(n)));
 assert.equal(JSON.parse(await cli('upgrade')).upgraded,true);assert.deepEqual(await snapshot(),before,'Reviewed upgrade preserves populated data');
 const backupsAfter=(await fs.readdir(ctx.runtime)).filter(n=>/^backup-product-.*\.dump$/.test(n)&&!backupsBefore.has(n));assert.equal(backupsAfter.length,1,'Private backup created before migration');
 const backup=await fs.open(path.join(ctx.runtime,backupsAfter[0]),'r');try{const header=Buffer.alloc(5);await backup.read(header,0,5,0);assert.equal(header.toString(),'PGDMP','Real PostgreSQL custom-format backup');}finally{await backup.close();}
 await db.end();db=null;await cli('stop');assert.equal(JSON.parse(await cli('start')).needsAdmin,false);db=new pg.Pool({connectionString:local.DB_URL});assert.deepEqual(await snapshot(),before,'All populated business data survives restart');
 user=await auth('token?grant_type=password',{email:userEmail,password});assert.deepEqual(await rpc(user,'shop_orders_read'),beforeOrders);assert.deepEqual(await transport('select private.telegram_read($1,$2) result',[43001,'orders']),beforeOrders);
 assert.equal(JSON.stringify(await rpc(user,'feedback_read')).includes('PRIVATE retention note'),false);assert.equal(JSON.stringify(await rpc(user,'feedback_read')).includes('Public retention reply'),true);
 assert.deepEqual(await transport('select private.telegram_read($1,$2) result',[43001,'feedback']),await rpc(user,'feedback_read'));assert.deepEqual(await transport('select private.telegram_read($1,$2) result',[43001,'rank']),await rpc(user,'player_rank_read'));
 await rpc(admin,'change_shop_order',{p_order:order.id,expected_version:'2',p_action:'FULFILL',p_reason:'Deliver after restart'});assert.equal((await db.query('select on_hand from public.products where id=$1',[product.id])).rows[0].on_hand,3);
 assert.equal((await transport('select private.telegram_read($1,$2) result',[43001,'orders']))[0].state,'FULFILLED');
});
