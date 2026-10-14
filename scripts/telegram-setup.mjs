import fs from 'node:fs/promises';import path from 'node:path';import {pathToFileURL} from 'node:url';import {randomBytes} from 'node:crypto';
import {context,secureRuntime,inventory,validateOwned,dockerLocal,publicConfig,localUrl,lock} from './local-demo-admin.mjs';
import {telegramApi,configuration,run} from '../integrations/telegram/bot.mjs';
export async function setup(input){
 const ctx=await context();await secureRuntime(ctx);await dockerLocal(ctx);
 const state=JSON.parse(await fs.readFile(ctx.stateFile,'utf8'));if(state.root!==ctx.root||state.phase!=='READY')throw Error('START_FIRST');validateOwned(state,await inventory(ctx,state));
 const status=JSON.parse(await ctx.run(ctx.cli,['status','--workdir',ctx.runtime,'-o','json']));publicConfig(status);localUrl(status.DB_URL,55322,'postgresql:');
 const api=telegramApi(input.token);const me=await api('getMe');if((await api('getWebhookInfo')).url)throw Error('EXISTING_WEBHOOK_STOP');
 const config={VOLUME_TELEGRAM_TOKEN:input.token,VOLUME_TELEGRAM_USERNAME:me.username,VOLUME_SUPABASE_URL:status.API_URL,VOLUME_SUPABASE_ANON_KEY:status.ANON_KEY,VOLUME_CUSTOMER_URL:'http://127.0.0.1:3000',VOLUME_CONTROL_URL:'http://127.0.0.1:3001',VOLUME_TELEGRAM_LOCAL_TEST:'1'};configuration(config);
 const health=await fetch(status.API_URL+'/rest/v1/rpc/public_venues',{method:'POST',headers:{apikey:status.ANON_KEY,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});if(!health.ok)throw Error('BACKEND_UNAVAILABLE');
 const {default:pg}=await import('pg');const db=new pg.Pool({connectionString:status.DB_URL,max:1});
 const password=randomBytes(32).toString('hex');
 try{
  // Dedicated non-business login: no table privileges; only two private transport functions.
  const existing=(await db.query("select rolname,rolsuper,rolcreaterole,rolcreatedb,rolbypassrls from pg_roles where rolname='volume_telegram_local'")).rows[0];
  if(existing&&(existing.rolsuper||existing.rolcreaterole||existing.rolcreatedb||existing.rolbypassrls))throw Error('UNSAFE_EXISTING_ROLE');
  if(existing){
   const memberships=(await db.query("select r.rolname from pg_auth_members m join pg_roles r on r.oid=m.roleid join pg_roles member on member.oid=m.member where member.rolname='volume_telegram_local'")).rows;
   if(memberships.some(r=>r.rolname!=='volume_telegram_transport'))throw Error('UNSAFE_EXISTING_ROLE');
   const privileges=(await db.query("select exists(select 1 from pg_shdepend d join pg_roles r on r.oid=d.refobjid where d.refclassid='pg_authid'::regclass and r.rolname='volume_telegram_local' and d.deptype in ('a','o','r')) unsafe")).rows[0];
   if(privileges.unsafe)throw Error('UNSAFE_EXISTING_ROLE');
  }
  if(!existing)await db.query('create role volume_telegram_local login noinherit nosuperuser nocreatedb nocreaterole nobypassrls');
  // Hex generated on server, never user SQL or logged argv.
  await db.query("alter role volume_telegram_local password '"+password+"'");await db.query('grant volume_telegram_transport to volume_telegram_local');
 }finally{await db.end();}
 const uri=new URL(status.DB_URL);uri.username='volume_telegram_local';uri.password=password;config.VOLUME_TELEGRAM_DB_URL=uri.toString();
 await fs.writeFile(path.join(ctx.runtime,'telegram-private.json'),JSON.stringify(config),{mode:0o600});return {username:me.username};
}
async function main(){const ctx=await context();const release=process.argv[2]==='setup'?await lock(55327):async()=>{};try{
 if(process.argv[2]==='setup'){let input='';for await(const c of process.stdin){input+=c;if(input.length>4096)throw Error('INVALID_INPUT');}const result=await setup(JSON.parse(input.replace(/^\uFEFF/,'')));console.log(JSON.stringify(result));}
 else if(process.argv[2]==='run'){const config=JSON.parse(await fs.readFile(path.join(ctx.runtime,'telegram-private.json'),'utf8'));console.log('VOLUME: Web tren dien thoai khong mo duoc localhost. Chat bot doc duoc du lieu khi may nay va VOLUME dang chay. Ctrl+C de dung bot.');await run(config);}
 else throw Error('INVALID_ACTION');
 }finally{await release();}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(()=>{console.error('VOLUME: Chua khoi dong duoc Telegram. Kiem tra token, START_VOLUME va bot cu/webhook/poller. Khong tu xoa webhook hay restart Docker.');process.exitCode=1;});
