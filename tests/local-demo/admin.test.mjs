import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {DemoError,validNode,checkCredentials,localUrl,publicConfig,context,lock,atomic,validateOwned,stop,dockerLocal,sourceFingerprint,processIdentity,sameProcess,validateWorkerRecord,startWorker,stopWorker,command,bootstrapTransaction,setupAdmin,recoverAdmin,migrationCheck,PORTS} from '../../scripts/local-demo-admin.mjs';
import {secureRuntime,authFailure} from '../../scripts/local-demo-admin.mjs';
import {verifyTelegramPublicV2} from './telegram-real.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const fakeKey=role=>'header.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
const project='volume-demo-0123456789abcdef-01234567';
const item=(id='owned')=>({Id:id,Name:'/supabase_db_'+project,Config:{Labels:{'com.supabase.cli.project':project}},State:{Running:true}});
async function temporary(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'volume demo đ '));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return dir;}

test('Auth diagnostics identify the failed stage without echoing response content or credentials',()=>{
 assert.match(authFailure(422,'weak_password','admin/users'),/Tao tai khoan.*12 ky tu/);
 assert.match(authFailure(400,'invalid_credentials','token?grant_type=password'),/Dang nhap kiem tra.*chua khop/);
 const message=authFailure(500,'SECRET_FROM_RESPONSE','admin/users');assert.ok(!message.includes('SECRET_FROM_RESPONSE'));assert.match(message,/khong reset/);
});

test('Runtime directory remains private and writable after native permission setup',async t=>{
 const dir=await temporary(t),ctx=await context(dir,dir);
 await secureRuntime(ctx);
 const probe=path.join(ctx.runtime,'write-check');await fs.writeFile(probe,'ok');assert.equal(await fs.readFile(probe,'utf8'),'ok');
 if(process.platform==='win32'){
  const script='$acl=Get-Acl -LiteralPath '+"'"+ctx.runtime.replaceAll("'","''")+"'"+'; $sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value; if(-not $acl.AreAccessRulesProtected){exit 2}; $rules=@($acl.Access | Where-Object {$_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -eq $sid -and $_.AccessControlType -eq "Allow" -and ($_.FileSystemRights -band [System.Security.AccessControl.FileSystemRights]::FullControl) -eq [System.Security.AccessControl.FileSystemRights]::FullControl}); if($rules.Count -lt 1){exit 3}';
  await command('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')]);
 }else assert.equal((await fs.stat(ctx.runtime)).mode&0o777,0o700);
});

test('D01/D02 dependency versions and path with spaces/Unicode',async t=>{
  assert.ok(validNode('22.12.0'));assert.ok(validNode('24.0.0'));assert.ok(!validNode('22.11.0'));assert.ok(!validNode('20.20.0'));
  const dir=await temporary(t);const ctx=await context(dir,dir);assert.equal(ctx.root,await fs.realpath(dir));assert.ok(ctx.runtime.includes('VolumeDemo'));
});
test('D02/D03 Docker local engine only, no lifecycle action on failure',async()=>{
  const calls=[];const ctx={run:async(f,a)=>{calls.push(a);if(a[0]==='context'&&a[1]==='show')return 'bad';if(a[0]==='context')return JSON.stringify([{Endpoints:{docker:{Host:'ssh://remote'}}}]);throw Error();}};
  await assert.rejects(dockerLocal(ctx),DemoError);assert.ok(calls.every(a=>a[0]==='context'));
});
test('D03 endpoint restrictions reject remote, spoofed host, credentials, query',()=>{
  for(const url of ['https://production.example','http://127.0.0.1.evil:55321','http://localhost:55321','http://u:p@127.0.0.1:55321','http://127.0.0.1:55321?x=1','http://127.0.0.1:54321'])assert.throws(()=>localUrl(url,55321));
  assert.equal(localUrl('http://127.0.0.1:55321',55321).hostname,'127.0.0.1');
});
test('D04/D05 unrelated containers, copied name, wrong ID and wrong label cannot be stopped',()=>{
  const state={project,containers:['owned']};validateOwned(state,[item()]);
  for(const other of [{...item(),Id:'new-owner'},{...item(),Name:'/testnet2'},{...item(),Config:{Labels:{'com.supabase.cli.project':'other'}}}])assert.throws(()=>validateOwned(state,[other]));
});
test('D06 only public fields; never accept service role as public key',()=>{
  const s={API_URL:'http://127.0.0.1:55321',ANON_KEY:fakeKey('anon'),SERVICE_ROLE_KEY:'private',DB_URL:'private'};
  assert.deepEqual(Object.keys(publicConfig(s)).sort(),['customer','key','url']);assert.ok(!JSON.stringify(publicConfig(s)).includes('private'));
  assert.throws(()=>publicConfig({...s,ANON_KEY:fakeKey('service_role')}));
});
test('D07/D21/D22 credential validation preserves literal shell characters',()=>{
  const pw='long;$(`whoami`)&"<>password';assert.equal(checkCredentials('Owner@example.test',pw).password,pw);
  assert.throws(()=>checkCredentials('bad','longpassword123'));assert.throws(()=>checkCredentials('a@b.test','short'));assert.throws(()=>checkCredentials('a@b.test','longpassword\n'));
});
test('D08/D09 local ownership state is atomic and credential free',async t=>{
  const dir=await temporary(t);const target=path.join(dir,'state.json');await atomic(target,{phase:'STARTING',pendingAdmin:{email:'owner@example.test',nonce:'stable'}});await atomic(target,{phase:'READY'});
  assert.deepEqual(JSON.parse(await fs.readFile(target)),{phase:'READY'});assert.deepEqual(await fs.readdir(dir),['state.json']);
});
test('D10 recovery refuses non-ADMIN/disabled profile before Auth request',async()=>{
  await assert.rejects(recoverAdmin({API_URL:'invalid'}, {query:async()=>({rows:[]})},'owner@example.test'),DemoError);
});
test('D11/D13/D14 kernel lock serializes commands and recovers after release',async()=>{
  const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));
  const release=await lock(port);await assert.rejects(lock(port),DemoError);await release();await(await lock(port))();
});
test('D13/D14 stale/reused process identity never matches',async()=>{
  const self=await processIdentity(process.pid);assert.ok(self);assert.ok(sameProcess(self,await processIdentity(process.pid)));assert.ok(!sameProcess(self,{...self,start:'different'}));assert.ok(!sameProcess(self,{...self,cmd:'unrelated'}));assert.equal(await processIdentity(-1),null);
});

test('D14 edited journal cannot target an unrelated process even with matching live PID',async()=>{
  const ctx={root:'/volume',cli:'/volume/tool/supabase',runtime:'/volume/runtime'};
  assert.throws(()=>validateWorkerRecord(ctx,{root:ctx.root,token:'a'.repeat(64),process:{pid:1,start:'1',exe:'/unrelated',cmd:'/unrelated'},edge:null}),DemoError);
});
test('D04/D12/D15 stop exact owned running IDs only, repeated stop keeps state/data',async t=>{
  const dir=await temporary(t);const ctx=await context(dir,dir);await fs.mkdir(ctx.runtime,{recursive:true});
  const state={format:1,root:ctx.root,project,containers:['owned'],phase:'READY'};await atomic(ctx.stateFile,state);let running=true;const mutations=[];
  ctx.run=async(f,a)=>{
    if(a[0]==='context'&&a[1]==='show')return 'default';
    if(a[0]==='context')return JSON.stringify([{Endpoints:{docker:{Host:process.platform==='win32'?'npipe:////./pipe/docker_engine':'unix:///var/run/docker.sock'}}}]);
    if(a[0]==='info')return 'linux';if(a[0]==='ps')return 'owned';if(a[0]==='inspect')return JSON.stringify([{...item(),State:{Running:running}}]);
    mutations.push(a);assert.deepEqual(a,['stop','owned']);running=false;return '';
  };
  await stop(ctx);await stop(ctx);assert.deepEqual(mutations,[['stop','owned']]);assert.equal(JSON.parse(await fs.readFile(ctx.stateFile)).phase,'STOPPED');
});
test('D05/D12 unknown container blocks stop before any mutation',async t=>{
  const dir=await temporary(t);const ctx=await context(dir,dir);await fs.mkdir(ctx.runtime,{recursive:true});await atomic(ctx.stateFile,{format:1,root:ctx.root,project,containers:['owned']});
  ctx.run=async(f,a)=>{if(a[0]==='context'&&a[1]==='show')return 'default';if(a[0]==='context')return JSON.stringify([{Endpoints:{docker:{Host:process.platform==='win32'?'npipe:////./pipe/docker_engine':'unix:///var/run/docker.sock'}}}]);if(a[0]==='info')return 'linux';if(a[0]==='ps')return 'unknown';if(a[0]==='inspect')return JSON.stringify([item('unknown')]);assert.fail('Unexpected mutation');};
  await assert.rejects(stop(ctx),DemoError);
});
test('D14 corrupt state blocks without attempting Docker',async t=>{
  const dir=await temporary(t);const ctx=await context(dir,dir);await fs.mkdir(ctx.runtime,{recursive:true});await fs.writeFile(ctx.stateFile,'{broken');ctx.run=()=>assert.fail('No resource access with corrupt state');await assert.rejects(stop(ctx),DemoError);
});
test('D16/D18/D20 source does not call reset/prune, no frozen runtime files modified by launcher',async()=>{
  const src=await fs.readFile(path.join(root,'scripts/local-demo-admin.mjs'),'utf8');
  for(const bad of ['db reset','--no-backup','docker system','docker volume rm','truncate public','--no-verify-jwt','testnet2'])assert.ok(!src.includes(bad),bad);
  assert.ok(src.includes("['stop',...running]"));assert.ok(src.includes('BOOTSTRAP_ADMIN_CREATED'));
});
test('D17 runtime source fingerprint stable and sensitive to migration changes',async t=>{
  const dir=await temporary(t);await fs.cp(path.join(root,'supabase'),path.join(dir,'supabase'),{recursive:true});const a=await sourceFingerprint(dir);assert.equal(a,await sourceFingerprint(dir));await fs.writeFile(path.join(dir,'supabase','migrations','99999999999999_test.sql'),'select 1;');assert.notEqual(a,await sourceFingerprint(dir));
});
test('D17 existing database migration mismatch is rejected read-only',async()=>{
  const calls=[];await assert.rejects(migrationCheck({root},{query:async sql=>{calls.push(sql);return {rows:[]};}}),DemoError);
  assert.deepEqual(calls,['select version from supabase_migrations.schema_migrations order by version']);
});
test('D05/D12 occupied application port is preserved on worker startup failure',async t=>{
  const dir=await temporary(t);const ctx=await context(dir,dir);await fs.mkdir(ctx.runtime,{recursive:true});
  const server=net.createServer();await new Promise(r=>server.listen(PORTS.customer,'127.0.0.1',r));
  try{await assert.rejects(startWorker(ctx,{url:'http://127.0.0.1:55321',key:fakeKey('anon'),customer:'http://127.0.0.1:3000'}),DemoError);assert.ok(server.listening);await assert.rejects(fs.access(ctx.workerFile));}finally{await new Promise(r=>server.close(r));}
});
test('D21 process timeout is bounded and raw command errors remain redacted',async()=>{
  await assert.rejects(command(process.execPath,['-e','setTimeout(()=>{},10000)'],{timeout:100}),e=>e instanceof DemoError);
  await assert.rejects(command(process.execPath,['-e','console.error("sensitive-value");process.exit(1)']),e=>!e.message.includes('sensitive-value'));
});
test('D22 process arguments are literal and shell metacharacters never execute',async t=>{
  const dir=await temporary(t);const file=path.join(dir,'literal & argument.txt');const arg='$(touch BAD); `whoami` & < > "';
  await command(process.execPath,['-e','require("fs").writeFileSync(process.argv[1],process.argv[2])',file,arg]);assert.equal(await fs.readFile(file,'utf8'),arg);
});


if(process.env.VOLUME_DEMO_WINDOWS_WORKER==='1')test('D11/D13/D14/D15 REAL Windows Vite/Job Object start/stop; Edge health is simulated',{timeout:180000},async t=>{
  assert.equal(process.platform,'win32');const ctx=await context();
  await assert.rejects(fs.access(ctx.runtime)); // A fresh isolated CI runner, never reuse an owner runtime.
  await fs.mkdir(path.dirname(ctx.cli),{recursive:true});
  const script="$cfg=[Console]::In.ReadToEnd()|ConvertFrom-Json; Add-Type -TypeDefinition 'using System; using System.Threading; public class DemoEdgeFixture { public static void Main(string[] args) { Thread.Sleep(120000); } }' -OutputAssembly $cfg.path -OutputType ConsoleApplication";
  await command('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{input:JSON.stringify({path:ctx.cli})});
  let probe=0;const fake=http.createServer((req,res)=>{res.writeHead(probe++===0?503:405,{'Content-Type':'application/json'});res.end(JSON.stringify({code:'METHOD_NOT_ALLOWED'}));});await new Promise(r=>fake.listen(PORTS.api,'127.0.0.1',r));
  const unrelated=spawn(process.execPath,['-e','setTimeout(()=>{},180000)'],{stdio:'ignore'});const unrelatedIdentity=await processIdentity(unrelated.pid);
  t.after(async()=>{await stopWorker(ctx);unrelated.kill();await new Promise(r=>fake.close(r));await fs.rm(ctx.runtime,{recursive:true,force:true});});
  await startWorker(ctx,{url:'http://127.0.0.1:55321',key:fakeKey('anon'),customer:'http://127.0.0.1:3000'});
  let first=JSON.parse(await fs.readFile(ctx.workerFile,'utf8'));assert.ok(first.process);assert.ok(first.edge);
  await startWorker(ctx,{url:'http://127.0.0.1:55321',key:fakeKey('anon'),customer:'http://127.0.0.1:3000'});
  assert.equal(JSON.parse(await fs.readFile(ctx.workerFile,'utf8')).process.pid,first.process.pid);
  const {chromium}=await import('@playwright/test');const browser=await chromium.launch();const page=await browser.newPage();
  try{for(const port of [3000,3001]){await page.goto('http://127.0.0.1:'+port);if(port===3000){await page.locator('#hero-title').waitFor();await page.getByRole('link',{name:'Tài khoản ↗',exact:true}).click();}await page.getByLabel('Email',{exact:true}).waitFor();}}finally{await browser.close();}
  // Real supervisor crash: its Windows Job must kill only its own descendants.
  const crashed=first;await command('powershell.exe',['-NoProfile','-Command',`Stop-Process -Id ${crashed.process.pid} -Force`]);
  for(let i=0;i<30&&await processIdentity(crashed.edge.pid);i++)await new Promise(r=>setTimeout(r,200));
  assert.equal(await processIdentity(crashed.edge.pid),null);assert.ok(sameProcess(unrelatedIdentity,await processIdentity(unrelated.pid)));
  await startWorker(ctx,{url:'http://127.0.0.1:55321',key:fakeKey('anon'),customer:'http://127.0.0.1:3000'});
  first=JSON.parse(await fs.readFile(ctx.workerFile,'utf8'));assert.ok(!sameProcess(crashed.process,first.process));
  await stopWorker(ctx);await stopWorker(ctx);for(let i=0;i<30&&first.edge&&await processIdentity(first.edge.pid);i++)await new Promise(r=>setTimeout(r,200));
  if(first.edge)assert.equal(await processIdentity(first.edge.pid),null);assert.ok(sameProcess(unrelatedIdentity,await processIdentity(unrelated.pid)));
  for(const port of [3000,3001])await assert.rejects(fetch('http://127.0.0.1:'+port,{signal:AbortSignal.timeout(1000)}));
});

if(process.env.VOLUME_DEMO_REAL==='1')test('D01–D22 REAL Linux Docker/Auth/UI lifecycle (not Windows Docker proof)',{timeout:1200000},async t=>{
  assert.equal(process.platform,'linux');
  const helper=path.join(root,'scripts','local-demo-admin.mjs');const ctx=await context();
  const cli=(mode,input)=>command(process.execPath,[helper,mode],{cwd:root,input:input?JSON.stringify(input):'',timeout:1000000,onStderr:text=>{for(const line of text.split('\n'))if(line.startsWith('VOLUME:'))console.error(line);}});
  // Isolated ephemeral CI only. Never remove/stop a container named testnet2.
  let sentinel;try{sentinel=JSON.parse(await command('docker',['inspect','testnet2']))[0];}catch{await command('docker',['run','-d','--name','testnet2','--label','volume-demo-test-sentinel=1','busybox:1.37','sleep','7200']);sentinel=JSON.parse(await command('docker',['inspect','testnet2']))[0];}
  const sentinelProof=x=>JSON.stringify({id:x.Id,state:x.State,config:x.Config});const before=sentinelProof(sentinel);
  assert.equal(JSON.parse(await cli('start')).needsAdmin,true);
  const local=JSON.parse(await command(ctx.cli,['status','--workdir',ctx.runtime,'-o','json']));const {default:pg}=await import('pg');const db=new pg.Pool({connectionString:local.DB_URL});
  let dbClosed=false;t.after(async()=>{if(!dbClosed)await db.end();await cli('stop');assert.equal(sentinelProof(JSON.parse(await command('docker',['inspect','testnet2']))[0]),before);});
  const email='owner-'+randomUUID()+'@example.test';const password='Owner-local-'+randomUUID()+'!;$`&<>"';
  await db.query("create function public.demo_test_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'TEST_ONLY_AUDIT_ROLLBACK'; end $$; create trigger demo_test_audit_failure before insert on public.audit_events for each row execute function public.demo_test_audit_failure();");
  await assert.rejects(cli('admin',{email,password}));
  const candidate=(await db.query('select p.* from public.profiles p join auth.users u on u.id=p.id where u.email=$1',[email])).rows[0];assert.equal(candidate.role,'USER');assert.equal(candidate.version,'1');
  await db.query('drop trigger demo_test_audit_failure on public.audit_events; drop function public.demo_test_audit_failure();');
  assert.equal(JSON.parse(await cli('admin',{email,password})).created,true);
  const p=(await db.query('select * from public.profiles where id=$1',[candidate.id])).rows[0];assert.equal(p.role,'ADMIN');assert.equal(p.version,'2');
  const marker=(await db.query('select raw_app_meta_data from auth.users where id=$1',[p.id])).rows[0].raw_app_meta_data.volume_local_bootstrap;
  await Promise.all([bootstrapTransaction(db,p.id,marker),bootstrapTransaction(db,p.id,marker)]);
  assert.equal((await db.query("select count(*)::int n from public.audit_events where action='BOOTSTRAP_ADMIN_CREATED'")).rows[0].n,1);
  const login=await fetch(local.API_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:local.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});assert.equal(login.status,200);const auth=await login.json();
  const access=await fetch(local.API_URL+'/rest/v1/rpc/current_access',{method:'POST',headers:{apikey:local.ANON_KEY,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:'{}'});assert.equal(access.status,200);assert.equal((await access.json()).profile.role,'ADMIN');
  await verifyTelegramPublicV2(db,local);
  assert.equal(JSON.parse(await cli('admin',{email:'other-'+randomUUID()+'@example.test',password})).created,false,'Concurrent/repeated bootstrap must report existing ADMIN without changing credentials');
  assert.equal(JSON.parse(await cli('start')).needsAdmin,false);
  const {chromium}=await import('@playwright/test');const browser=await chromium.launch();
  try{
    for(const port of [3000,3001]){const page=await browser.newPage();await page.goto('http://127.0.0.1:'+port);if(port===3000){await page.locator('#hero-title').waitFor();await page.getByRole('link',{name:'Tài khoản ↗',exact:true}).click();}await page.getByLabel('Email',{exact:true}).fill(email);await page.getByLabel('Mật khẩu',{exact:true}).fill(password);await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();await page.waitForURL('http://127.0.0.1:'+port+(port===3000?'/profile':'/overview'));await page.getByRole('button',{name:'Đăng xuất',exact:true}).waitFor();assert.ok(!(await page.content()).includes(local.SERVICE_ROLE_KEY));}
    await cli('recover',{email});let mail;
    for(let attempt=0;attempt<30;attempt++){const response=await fetch('http://127.0.0.1:55324/api/v1/messages');assert.equal(response.status,200);mail=(await response.json()).messages?.find(m=>m.To?.some(to=>to.Address===email));if(mail)break;await new Promise(r=>setTimeout(r,100));}
    assert.ok(mail,'Recovery email delivered locally');const message=await(await fetch('http://127.0.0.1:55324/api/v1/message/'+mail.ID)).json();
    const url=(message.Text+' '+message.HTML).match(/http:\/\/127\.0\.0\.1:55321\/auth\/v1\/verify[^\s<>"']+/)?.[0]?.replaceAll('&amp;','&');assert.ok(url,'Local Auth recovery link exists');
    const recovery=await browser.newPage();try{await recovery.goto(url);}catch{throw Error('Real recovery link navigation failed (sensitive URL withheld)');}
    await recovery.getByLabel('Mật khẩu mới',{exact:true}).fill(password+'new');await recovery.getByRole('button',{name:'Lưu mật khẩu mới',exact:true}).click();await recovery.waitForURL('http://127.0.0.1:3000/login');
    const recovered=await fetch(local.API_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:local.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password:password+'new'})});assert.equal(recovered.status,200,'Owner-selected replacement password works');
  }finally{await browser.close();}
  const dataBefore=JSON.stringify((await db.query('select id,role,version,account_status,sessions_revoked_before from public.profiles order by id')).rows);
  await db.end();dbClosed=true;await cli('stop');await cli('stop');assert.equal(JSON.parse(await cli('start')).needsAdmin,false);
  const db2=new pg.Pool({connectionString:local.DB_URL});try{assert.equal(JSON.stringify((await db2.query('select id,role,version,account_status,sessions_revoked_before from public.profiles order by id')).rows),dataBefore);
    await db2.query("update public.profiles set account_status='DISABLED' where id=$1",[p.id]);await assert.rejects(cli('recover',{email}));assert.equal((await db2.query('select account_status from public.profiles where id=$1',[p.id])).rows[0].account_status,'DISABLED');
    await db2.query("update public.profiles set account_status='ACTIVE' where id=$1",[p.id]);
  }finally{await db2.end();}
  assert.equal(sentinelProof(JSON.parse(await command('docker',['inspect','testnet2']))[0]),before);
});
