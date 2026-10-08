/** Local operator tooling only. Never imported by either application. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash, randomBytes, randomUUID, timingSafeEqual} from 'node:crypto';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec = promisify(execFile);
export const CLI_VERSION='2.119.0';
export const PORTS={api:55321,db:55322,mail:55324,shadow:55320,customer:3000,control:3001,ipc:55325,lock:55326};
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export class DemoError extends Error {}
const fail=message=>{throw new DemoError(message);};
export function validNode(version=process.versions.node) {const [major,minor]=version.split('.').map(Number);return (major===22&&minor>=12)||major===24;}
export function checkCredentials(email,password) {
  if(typeof email!=='string'||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('Email chua dung. Hay nhap lai.');
  if(typeof password!=='string'||password.length<12||password.length>256||/[\x00-\x1f]/.test(password))fail('Mat khau can 12-256 ky tu, khong co ky tu dieu khien.');
  return {email:email.trim().toLowerCase(),password};
}
export function localUrl(value,port,protocol='http:') {
  let u;try{u=new URL(value);}catch{fail('Cau hinh local khong hop le.');}
  if(u.protocol!==protocol||u.hostname!=='127.0.0.1'||Number(u.port)!==port||u.search||u.hash)fail('Chi duoc ket noi VOLUME local da xac minh.');
  if(protocol==='http:'&&(u.username||u.password||u.pathname!=='/'))fail('Dia chi local khong hop le.');
  if(protocol==='postgresql:'&&u.pathname!=='/postgres')fail('Database local khong hop le.');
  return u;
}
export function publicConfig(status) {
  localUrl(status.API_URL,PORTS.api);
  let role;try{role=JSON.parse(Buffer.from(status.ANON_KEY.split('.')[1],'base64url')).role;}catch{fail('Khong doc duoc public key local.');}
  if(role!=='anon')fail('Key khong phai public anon; da chan dua vao trinh duyet.');
  return {url:status.API_URL,key:status.ANON_KEY,customer:'http://127.0.0.1:3000'};
}
export async function command(file,args,{cwd=ROOT,input,timeout=180000,env=process.env,onStderr}={}) {
  // No shell, no credential arguments; all diagnostics are deliberately redacted at the boundary.
  return new Promise((resolve,reject)=>{
    const p=spawn(file,args,{cwd,env,windowsHide:true,stdio:['pipe','pipe','pipe']});
    let out='',size=0,done=false;
    const finish=(error)=>{if(done)return;done=true;clearTimeout(timer);error?reject(error):resolve(out);};
    const timer=setTimeout(()=>{p.kill();finish(new DemoError('Thao tac qua lau. Kiem tra mang/Docker roi bam lai; khong reset du lieu.'));},timeout);
    p.stdout.on('data',d=>{size+=d.length;if(size<8*1024*1024)out+=d;});
    p.stderr.on('data',d=>{if(onStderr)onStderr(d.toString());});
    p.on('error',()=>finish(new DemoError('Khong chay duoc '+path.basename(file)+'. Kiem tra phu thuoc da cai.')));
    p.on('close',code=>finish(code===0?null:new DemoError('Lenh '+path.basename(file)+' '+path.basename(args[0]||'')+' chua thanh cong. Kiem tra mang, dung luong va Docker; du lieu khong bi reset.')));
    p.stdin.on('error',()=>{});p.stdin.end(input??'');
  });
}
export async function atomic(file,value) {
  const tmp=file+'.'+randomUUID()+'.tmp';
  await fs.writeFile(tmp,JSON.stringify(value),{mode:0o600});await fs.rename(tmp,file);
}
async function readJson(file,optional=false) {try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(optional&&e.code==='ENOENT')return null;fail('Du lieu quan ly demo bi thieu/hong. Khong tu dong dung hay xoa tai nguyen.');}}
export async function context(root=ROOT,base) {
  root=await fs.realpath(root);
  const hash=createHash('sha256').update(process.platform==='win32'?root.toLowerCase():root).digest('hex').slice(0,16);
  const runtime=path.join(base??(process.platform==='win32'?process.env.LOCALAPPDATA:path.join(os.homedir(),'.local','state')),'VolumeDemo',hash);
  return {root,runtime,run:command,stateFile:path.join(runtime,'state.json'),workerFile:path.join(runtime,'worker.json'),cli:path.join(runtime,'tools','node_modules','@supabase','cli-'+(process.platform==='win32'?'windows':process.platform)+'-'+process.arch,'bin','supabase'+(process.platform==='win32'?'.exe':''))};
}
export async function lock(port=PORTS.lock) {
  const server=net.createServer(socket=>socket.destroy());
  await new Promise((resolve,reject)=>{server.once('error',()=>reject(new DemoError('VOLUME dang co thao tac khac hoac cong quan ly dang ban. Cho hoan tat roi thu lai.')));server.listen(port,'127.0.0.1',resolve);});
  return ()=>new Promise(resolve=>server.close(resolve));
}
async function freePort(port) {const release=await lock(port);await release();}
export async function secureRuntime(ctx) {
  await fs.mkdir(ctx.runtime,{recursive:true,mode:0o700});
  if(process.platform==='win32') {
    const result=await ctx.run('whoami.exe',['/user','/fo','csv','/nh']);const sid=result.match(/S-1-5-[\d-]+/);
    if(!sid)fail('Khong xac minh duoc tai khoan Windows.');
    await ctx.run('icacls.exe',[ctx.runtime,'/inheritance:r','/grant:r','*'+sid[0]+':(OI)(CI)F']);
  } else await fs.chmod(ctx.runtime,0o700);
}
async function filesUnder(dir) {
  const result=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isSymbolicLink())fail('Khong dung symlink trong cau hinh backend.');if(entry.isDirectory())result.push(...await filesUnder(p));else if(entry.isFile())result.push(p);}return result.sort();
}
export async function sourceFingerprint(root) {
  const list=[path.join(root,'supabase','config.toml'),path.join(root,'supabase','seed.sql'),...await filesUnder(path.join(root,'supabase','migrations')),...await filesUnder(path.join(root,'supabase','functions'))];
  const hash=createHash('sha256');for(const p of list)hash.update(path.relative(root,p).replaceAll('\\','/')).update(await fs.readFile(p));return hash.digest('hex');
}
export async function dockerLocal(ctx) {
  const name=(await ctx.run('docker',['context','show'])).trim();
  const info=JSON.parse(await ctx.run('docker',['context','inspect',name]));
  const endpoint=process.env.DOCKER_HOST||info[0]?.Endpoints?.docker?.Host;
  if(!endpoint||!(process.platform==='win32'?/^npipe:\/\/\/\/\.\/pipe\/(docker_engine|dockerDesktopLinuxEngine)$/:/^unix:\/\//).test(endpoint))fail('Docker phai la engine tren may nay. Khong cho phep Docker remote.');
  if((await ctx.run('docker',['info','--format','{{.OSType}}'])).trim()!=='linux')fail('Mo Docker Desktop voi Linux containers, sau do thu lai. Khong restart Docker/Pi Node bang launcher.');
}
export async function inventory(ctx,state) {
  const raw=await ctx.run('docker',['ps','-aq','--filter','label=com.supabase.cli.project='+state.project]);
  const ids=raw.trim().split(/\s+/).filter(Boolean);if(!ids.length)return [];
  return JSON.parse(await ctx.run('docker',['inspect',...ids]));
}
export function validateOwned(state,items) {
  if(!/^volume-demo-[a-f0-9]{16}-[a-f0-9]{8}$/.test(state.project)||!Array.isArray(state.containers))fail('Ownership VOLUME khong hop le.');
  for(const item of items)if(!state.containers.includes(item.Id)||item.Config?.Labels?.['com.supabase.cli.project']!==state.project||!item.Name?.endsWith('_'+state.project))fail('Co tai nguyen khong ro ownership. Khong dung/nhan quan ly tu dong.');
}
async function save(ctx,state) {await atomic(ctx.stateFile,state);}
async function stateFor(ctx) {const s=await readJson(ctx.stateFile,true);if(s&&(s.root!==ctx.root||s.format!==1))fail('Ownership khong khop thu muc VOLUME.');return s;}
async function npmPath() {
  const candidates=[path.join(path.dirname(process.execPath),'node_modules','npm','bin','npm-cli.js'),path.resolve(path.dirname(process.execPath),'..','lib','node_modules','npm','bin','npm-cli.js')];
  if(process.platform!=='win32'){try{const binary=(await command('which',['npm'])).trim();candidates.push(await fs.realpath(binary));}catch{}}
  for(const p of candidates){try{await fs.access(p);return p;}catch{}}
  fail('Chua co npm di kem Node.js. Hay cai lai Node.js 22 LTS.');
}
async function install(ctx,state) {
  const npm=await npmPath();const digest=createHash('sha256').update(await fs.readFile(path.join(ctx.root,'package-lock.json'))).digest('hex');
  let installed=false;try{await fs.access(path.join(ctx.root,'node_modules','vite','package.json'));await fs.access(path.join(ctx.root,'node_modules','pg','package.json'));installed=state.lockHash===digest;}catch{}
  if(!installed){console.error('VOLUME: Dang cai phu thuoc da khoa phien ban...');await ctx.run(process.execPath,[npm,'ci','--no-audit','--no-fund'],{cwd:ctx.root,timeout:900000});state.lockHash=digest;await save(ctx,state);}
  let cliOk=false;try{cliOk=(await ctx.run(ctx.cli,['--version'])).trim()===CLI_VERSION;}catch{}
  if(!cliOk){console.error('VOLUME: Dang cai cong cu Supabase local...');await ctx.run(process.execPath,[npm,'install','--prefix',path.join(ctx.runtime,'tools'),'--no-save','--package-lock=false','--no-audit','--no-fund','supabase@'+CLI_VERSION],{cwd:ctx.root,timeout:900000});}
  if((await ctx.run(ctx.cli,['--version'])).trim()!==CLI_VERSION)fail('Supabase CLI khong dung phien ban da khoa.');
}
async function makeRuntime(ctx,state) {
  const target=path.join(ctx.runtime,'supabase');await fs.mkdir(target,{recursive:true});
  const original=await fs.readFile(path.join(ctx.root,'supabase','config.toml'),'utf8');
  const config=original.replace('project_id = "volume-v2"','project_id = "'+state.project+'"').replace('port = 54321','port = 55321').replace('port = 54322','port = 55322').replace('shadow_port = 54320','shadow_port = 55320').replace('port = 54324','port = 55324');
  if(!config.includes('project_id = "'+state.project+'"'))fail('Cau hinh project khong dung baseline.');
  await fs.writeFile(path.join(target,'config.toml'),config,{mode:0o600});
  await fs.copyFile(path.join(ctx.root,'supabase','seed.sql'),path.join(target,'seed.sql'));
  for(const dir of ['migrations','functions'])await fs.cp(path.join(ctx.root,'supabase',dir),path.join(target,dir),{recursive:true,force:false,errorOnExist:false});
}
async function status(ctx) {
  const s=JSON.parse(await ctx.run(ctx.cli,['status','--workdir',ctx.runtime,'-o','json']));publicConfig(s);localUrl(s.DB_URL,PORTS.db,'postgresql:');return s;
}
async function poolFor(ctx,s) {const {default:pg}=await import(pathToFileURL(path.join(ctx.root,'node_modules','pg','lib','index.js')).href);return new pg.Pool({connectionString:s.DB_URL,max:2,connectionTimeoutMillis:10000});}
export async function migrationCheck(ctx,db) {
  const actual=(await db.query('select version from supabase_migrations.schema_migrations order by version')).rows.map(r=>r.version);
  const expected=(await fs.readdir(path.join(ctx.root,'supabase','migrations'))).filter(p=>p.endsWith('.sql')).map(p=>p.split('_')[0]).sort();
  if(JSON.stringify(actual)!==JSON.stringify(expected))fail('Database khong cung phien ban. Da dung an toan, khong reset hay sua migration.');
}
export async function requestAuth(s,route,body,privileged=false) {
  const key=privileged?s.SERVICE_ROLE_KEY:s.ANON_KEY;
  const response=await fetch(s.API_URL+'/auth/v1/'+route,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!response.ok){let code='';try{const data=await response.json();code=data.error_code||data.code||'';}catch{}fail(authFailure(response.status,code,route));}return response.json();
}
export function authFailure(status,code,route){
 const action=route==='admin/users'?'Tao tai khoan':route.startsWith('token?')?'Dang nhap kiem tra':'Auth';
 const reasons={weak_password:'Mat khau chua dat yeu cau. Dung mat khau dai hon, it nhat 12 ky tu.',email_address_invalid:'Email khong hop le. Kiem tra lai dia chi.',email_exists:'Email da duoc su dung. Launcher khong tu nang quyen tai khoan cu.',user_already_exists:'Tai khoan da ton tai. Dung lai dung email cua lan setup truoc.',invalid_credentials:'Email/mat khau chua khop. Neu setup dang do, nhap lai dung thong tin da chon.',email_not_confirmed:'Email chua duoc xac nhan. Can kiem tra Auth local.'};
 const reason=(Object.hasOwn(reasons,code)?reasons[code]:null)||(status===429?'Auth dang gioi han tan suat. Cho mot luc roi bam START lai.':status>=500?'Auth local dang loi. Kiem tra Docker va dich vu Auth; khong reset du lieu.':'Kiem tra cau hinh Auth local va thu lai; quyen khong bi bo qua.');
 return action+' that bai (HTTP '+Number(status)+'). '+reason;
}
export async function adminState(db) {
  const rows=(await db.query("select id,account_status from public.profiles where role='ADMIN' order by id")).rows;
  if(rows.length&&!rows.some(r=>r.account_status==='ACTIVE'))fail('ADMIN dang bi vo hieu hoa. Launcher khong tu mo lai quyen.');return rows;
}
export async function bootstrapTransaction(db,id,nonce) {
  const c=await db.connect();try{await c.query('begin');await c.query('select pg_advisory_xact_lock(20261006,1)');
    const p=(await c.query('select p.*,u.raw_app_meta_data from public.profiles p join auth.users u on u.id=p.id where p.id=$1 for update of p',[id])).rows[0];
    if(!p||p.raw_app_meta_data?.volume_local_bootstrap!==nonce)fail('Khong xac minh duoc identity bootstrap local.');
    if(p.role==='ADMIN'&&p.account_status==='ACTIVE'&&(await c.query("select 1 from public.audit_events where action='BOOTSTRAP_ADMIN_CREATED' and target_id=$1",[id])).rowCount){await c.query('commit');return;}
    if(p.role!=='USER'||p.account_status!=='ACTIVE'||p.version!=='1'||(await c.query("select 1 from public.profiles where role='ADMIN'")).rowCount)fail('Khong duoc nang quyen tai khoan cu hoac tao ADMIN trung.');
    await c.query("update public.profiles set role='ADMIN',version=version+1,updated_at=clock_timestamp(),sessions_revoked_before=clock_timestamp() where id=$1",[id]);
    await c.query("insert into public.audit_events(source,category,action,target_type,target_id,reason,after_data) select 'SYSTEM','SECURITY','BOOTSTRAP_ADMIN_CREATED','profiles',id,'Owner-authorized isolated local demo bootstrap',private.profile_audit(p) from public.profiles p where id=$1",[id]);
    await c.query('commit');
  }catch(e){await c.query('rollback');throw e;}finally{c.release();}
}
export async function setupAdmin(ctx,state,s,db,input) {
  const {email,password}=checkCredentials(input.email,input.password);
  if((await adminState(db)).length)return {created:false};
  let pending=state.pendingAdmin;
  if(pending&&pending.email!==email)fail('Lan tao ADMIN truoc chua xong. Hay dung lai dung email da chon.');
  let found=(await db.query('select id,raw_app_meta_data from auth.users where lower(email)=lower($1)',[email])).rows[0];
  if(!pending){if(found)fail('Email da thuoc tai khoan co san. Launcher khong nang quyen tai khoan nay.');pending={email,nonce:randomUUID()};state.pendingAdmin=pending;await save(ctx,state);}
  if(!found){await requestAuth(s,'admin/users',{email,password,email_confirm:true,app_metadata:{volume_local_bootstrap:pending.nonce}},true);found=(await db.query('select id,raw_app_meta_data from auth.users where lower(email)=lower($1)',[email])).rows[0];}
  if(!found||found.raw_app_meta_data?.volume_local_bootstrap!==pending.nonce)fail('Identity khong khop setup da bat dau. Khong thay doi quyen.');
  await requestAuth(s,'token?grant_type=password',{email,password});
  await bootstrapTransaction(db,found.id,pending.nonce);delete state.pendingAdmin;await save(ctx,state);return {created:true};
}
export async function recoverAdmin(s,db,email) {
  if(typeof email!=='string'||email.length>254)fail('Email khong hop le.');
  const p=(await db.query("select p.id from public.profiles p join auth.users u on u.id=p.id where lower(u.email)=lower($1) and p.role='ADMIN' and p.account_status='ACTIVE'",[email])).rows[0];
  if(!p)fail('Khong co ADMIN dang hoat dong voi email nay. Khong tu mo lai/nang quyen.');
  await requestAuth(s,'recover?redirect_to='+encodeURIComponent('http://127.0.0.1:3000/recovery'),{email});return {sent:true};
}
export async function processIdentity(pid) {
  if(!Number.isSafeInteger(pid)||pid<1)return null;
  try{if(process.platform==='win32'){
    const script=`$p=Get-CimInstance Win32_Process -Filter "ProcessId=${pid}"; if($p){ @{pid=[int]$p.ProcessId;start=([math]::Floor($p.CreationDate.ToUniversalTime().Ticks / 10000)).ToString();exe=$p.ExecutablePath;cmd=$p.CommandLine}|ConvertTo-Json -Compress }`;
    const out=await command('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')]);return out.trim()?JSON.parse(out):null;
  }
  const stat=await fs.readFile('/proc/'+pid+'/stat','utf8');return {pid,start:stat.slice(stat.lastIndexOf(')')+2).split(' ')[19],exe:await fs.readlink('/proc/'+pid+'/exe'),cmd:(await fs.readFile('/proc/'+pid+'/cmdline','utf8')).replaceAll('\0',' ')};
  }catch{return null;}
}
export function sameProcess(a,b) {return Boolean(a&&b&&a.pid===b.pid&&a.start===b.start&&a.exe===b.exe&&a.cmd===b.cmd);}
async function killVerified(identity) {
  if(!identity)return;
  const now=await processIdentity(identity.pid);if(!now)return;if(!sameProcess(identity,now))fail('PID da doi chu. Khong dung tien trinh nay.');
  if(process.platform==='win32'){
    // Hold an OS process handle before the second creation-time check: no kill-by-stale-PID race.
    const script=`$p=Get-Process -Id ${identity.pid} -ErrorAction SilentlyContinue;if($p){$null=$p.Handle;if(([math]::Floor($p.StartTime.ToUniversalTime().Ticks / 10000)).ToString() -ne '${identity.start}'){exit 3};$p.Kill();$p.WaitForExit(10000)|Out-Null}`;
    await command('powershell.exe',['-NoProfile','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')]);
  }else process.kill(identity.pid,'SIGTERM');
}
async function ipc(record,action) {
  return new Promise((resolve,reject)=>{const socket=net.connect(PORTS.ipc,'127.0.0.1');let data='';socket.setTimeout(20000);socket.on('connect',()=>socket.end(JSON.stringify({token:record.token,action})+'\n'));socket.on('data',d=>{data+=d;if(data.length>4096)socket.destroy();});socket.on('end',()=>{try{const r=JSON.parse(data);if(r.root!==record.root||r.token!==record.token)throw Error();resolve(r);}catch{reject(new DemoError('Khong xac minh duoc tien trinh VOLUME.'));}});socket.on('timeout',()=>socket.destroy(new Error('timeout')));socket.on('error',()=>reject(new DemoError('Tien trinh VOLUME chua san sang.')));});
}
export function workerCommand(ctx) { return process.platform==='win32'?{file:path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe'),args:['-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(ctx.root,'scripts','local-demo.ps1'),'-Action','Worker']}:{file:process.execPath,args:[path.join(ctx.root,'scripts','local-demo-admin.mjs'),'worker']}; }
export function validateWorkerRecord(ctx,record) {
  if(record.root!==ctx.root||!/^[a-f0-9]{64}$/.test(record.token))fail('Worker ownership khong hop le.');
  const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  for(const [identity,exe,args] of [[record.process,workerCommand(ctx).file,workerCommand(ctx).args],[record.edge,ctx.cli,['functions','serve','open-table-payment','--workdir',ctx.runtime]]]) {
    if(!identity)continue;
    const pattern=new RegExp('^'+[exe,...args].map(x=>'"?'+escape(x)+'"?').join('\\s+')+'\\s*$',process.platform==='win32'?'i':'');
    if(identity.exe.toLowerCase()!==exe.toLowerCase()||!pattern.test(identity.cmd))fail('Tien trinh khong thuoc launcher nay. Khong dung.');
  }
}
export async function stopWorker(ctx) {
  const record=await readJson(ctx.workerFile,true);if(!record)return;
  validateWorkerRecord(ctx,record);
  try{await ipc(record,'stop');}catch{await killVerified(record.process);await killVerified(record.edge);}
  await fs.unlink(ctx.workerFile).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
export async function startWorker(ctx,pub) {
  const old=await readJson(ctx.workerFile,true);
  if(old){try{await ipc(old,'ping');return;}catch{await stopWorker(ctx);}}
  for(const port of [PORTS.customer,PORTS.control,PORTS.ipc])await freePort(port);
  const record={root:ctx.root,token:randomBytes(32).toString('hex'),process:null,edge:null,public:pub};
  await atomic(ctx.workerFile,record);
  const launch=workerCommand(ctx);let supervisorError='';
  const child=spawn(launch.file,launch.args,{cwd:ctx.root,detached:process.platform!=='win32',windowsHide:true,stdio:['ignore','pipe','pipe']});
  for(const stream of [child.stdout,child.stderr]){stream.on('data',chunk=>{supervisorError=(supervisorError+chunk.toString()).slice(-4000);for(const line of chunk.toString().split('\n'))if(line.startsWith('VOLUME:'))console.error(line);});stream.unref?.();}
  child.on('error',e=>{supervisorError='spawn '+String(e.code);});
  child.unref();
  for(let i=0;i<90;i++){try{await ipc(record,'ping');return;}catch{}await pause(500);}
  if(child.exitCode===null)child.kill();
  console.error('VOLUME: Supervisor exit='+String(child.exitCode)+' pid='+String(child.pid)+' '+supervisorError.replaceAll(record.token,'[REDACTED]').replaceAll(pub.key,'[REDACTED]').replace(/[\r\n]+/g,' ').slice(0,700));
  await stopWorker(ctx);fail('Web/Edge chua san sang. Kiem tra Docker va thu lai; du lieu duoc giu nguyen.');
}
async function worker(ctx,input) {
  const {record,pub}=input;
  if(record.root!==ctx.root||!/^[a-f0-9]{64}$/.test(record.token))fail('Worker input khong hop le.');
  record.process=await processIdentity(process.platform==='win32'?process.ppid:process.pid);
  if(!record.process)fail('Khong xac minh duoc worker dang chay.');await atomic(ctx.workerFile,record);
  localUrl(pub.url,PORTS.api);publicConfig({API_URL:pub.url,ANON_KEY:pub.key});
  let edge=null;
  const edgeReady=async()=>{try{const r=await fetch(pub.url+'/functions/v1/open-table-payment',{headers:{apikey:pub.key,Authorization:'Bearer '+pub.key},signal:AbortSignal.timeout(1500)});return r.status===405&&(await r.json()).code==='METHOD_NOT_ALLOWED';}catch{return false;}};
  const servers=[];let shutting=false;
  const shutdown=async()=>{if(shutting)return;shutting=true;for(const s of servers)await s.close();if(edge&&edge.exitCode===null){const closed=new Promise(resolve=>{edge.once('close',resolve);setTimeout(resolve,10000).unref();});edge.kill();await closed;}};
  try{
    // Newer pinned CLI starts functions with the stack. Do not replace a healthy owned Edge container.
    if(!await edgeReady()){
      edge=spawn(ctx.cli,['functions','serve','open-table-payment','--workdir',ctx.runtime],{cwd:ctx.root,windowsHide:true,stdio:'ignore'});
      edge.on('error',()=>{});record.edge=await processIdentity(edge.pid);if(!record.edge){edge.kill();fail('Khong xac minh duoc tien trinh Edge.');}await atomic(ctx.workerFile,record);
    }
    let ready=false;for(let i=0;i<90;i++){if(await edgeReady()){ready=true;break;}await pause(500);}
    if(!ready)throw Error('edge');
    const {createServer}=await import(pathToFileURL(path.join(ctx.root,'node_modules','vite','dist','node','index.js')).href);
    for(const [app,port] of [['customer',PORTS.customer],['control-center',PORTS.control]]){
      const server=await createServer({root:path.join(ctx.root,'apps',app),configFile:false,envFile:false,envPrefix:[],logLevel:'silent',define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify(pub.url),'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify(pub.key),'import.meta.env.VITE_CUSTOMER_URL':JSON.stringify(pub.customer)},server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();servers.push(server);
      if(!(await fetch('http://127.0.0.1:'+port,{signal:AbortSignal.timeout(5000)})).ok)throw Error('web');
    }
    const control=net.createServer({allowHalfOpen:true},socket=>{let data='';socket.setTimeout(3000);socket.on('timeout',()=>socket.destroy());socket.on('data',chunk=>{data+=chunk;if(data.length>4096)socket.destroy();});socket.on('end',async()=>{
      let message;try{message=JSON.parse(data);}catch{socket.destroy();return;}
      const token=Buffer.from(String(message.token));const expected=Buffer.from(record.token);
      if(token.length!==expected.length||!timingSafeEqual(token,expected)||!['ping','stop'].includes(message.action)){socket.destroy();return;}
      if(message.action==='stop')await shutdown();socket.end(JSON.stringify({root:ctx.root,token:record.token,ready:!shutting}));
      if(shutting){control.close();setTimeout(()=>process.exit(0),200).unref();}
    });socket.on('error',()=>{});});
    await new Promise((resolve,reject)=>{control.once('error',reject);control.listen(PORTS.ipc,'127.0.0.1',resolve);});
    process.on('SIGTERM',()=>{shutdown().finally(()=>process.exit(0));});
  }catch{await shutdown();process.exitCode=1;}
}
export async function stop(ctx) {
  const state=await stateFor(ctx);if(!state)return {stopped:true};
  await dockerLocal(ctx);const items=await inventory(ctx,state);validateOwned(state,items);
  await stopWorker(ctx);
  const remaining=await inventory(ctx,state);validateOwned(state,remaining);
  const running=remaining.filter(c=>c.State?.Running).map(c=>c.Id);
  if(running.length)await ctx.run('docker',['stop',...running],{timeout:180000});
  state.phase='STOPPED';await save(ctx,state);return {stopped:true};
}
export async function start(ctx) {
  if(!validNode())fail('Can Node.js 22.12+ (dong 22) hoac 24. Cai Node.js LTS roi thu lai.');
  await dockerLocal(ctx);await secureRuntime(ctx);
  const fingerprint=await sourceFingerprint(ctx.root);let state=await stateFor(ctx);
  if(state&&state.fingerprint!==fingerprint)fail('Backend demo khac phien ban. Da dung an toan; khong reset/nang cap du lieu tu dong.');
  if(!state){state={format:1,root:ctx.root,project:'volume-demo-'+path.basename(ctx.runtime)+'-'+randomBytes(4).toString('hex'),fingerprint,containers:[],phase:'CHECKING'};
    if((await inventory(ctx,state)).length)fail('Project demo da co tai nguyen khong duoc quan ly.');
    await save(ctx,state);
  }
  let items=await inventory(ctx,state);validateOwned(state,items);
  await install(ctx,state);await makeRuntime(ctx,state);
  if(!items.length){for(const port of [PORTS.api,PORTS.db,PORTS.mail,PORTS.shadow])await freePort(port);}
  state.phase='STARTING';await save(ctx,state);
  try{
    const stopped=items.filter(c=>!c.State?.Running).map(c=>c.Id);if(stopped.length)await ctx.run('docker',['start',...stopped]);
    console.error('VOLUME: Dang khoi dong backend local...');
    if(!items.length)await ctx.run(ctx.cli,['start','--workdir',ctx.runtime],{timeout:900000});
    items=await inventory(ctx,state);state.containers=items.map(c=>c.Id);await save(ctx,state);
    let s;for(let attempt=0;attempt<60;attempt++){try{const candidate=await status(ctx);const responses=await Promise.all(['/auth/v1/health','/rest/v1/'].map(route=>fetch(candidate.API_URL+route,{headers:{apikey:candidate.ANON_KEY},signal:AbortSignal.timeout(2000)})));if(responses.every(r=>r.ok)){s=candidate;break;}}catch{}await pause(1000);}
    if(!s)fail('Backend local chua khoi dong xong. Cho Docker on dinh roi bam START lai.');
    const db=await poolFor(ctx,s);let needsAdmin;
    try{await migrationCheck(ctx,db);
      const dbItem=items.find(c=>c.Name==='/supabase_db_'+state.project);if(!dbItem)fail('Khong tim thay database demo da xac minh.');
      await ctx.run('docker',['exec',dbItem.Id,'psql','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1','-c','alter role volume_session_reader bypassrls; grant usage on schema auth to volume_session_reader; grant select(id,user_id,created_at) on auth.sessions to volume_session_reader;']);
      needsAdmin=(await adminState(db)).length===0;
    }finally{await db.end();}
    await startWorker(ctx,publicConfig(s));
    // functions serve may replace its own Edge container; capture only this verified project after the owned operation.
    state.containers=(await inventory(ctx,state)).map(c=>c.Id);state.phase='READY';await save(ctx,state);return {needsAdmin};
  }catch(e){state.containers=(await inventory(ctx,state)).map(c=>c.Id);state.phase='FAILED';await save(ctx,state);await stopWorker(ctx).catch(()=>{});throw e;}
}
async function main() {
  const mode=process.argv[2];const ctx=await context();
  if(mode==='worker'){const record=await readJson(ctx.workerFile);await worker(ctx,{record,pub:record.public});return;}
  if(!['start','stop','admin','recover'].includes(mode))fail('Lenh demo khong hop le.');
  const release=await lock();try{
    let result;
    if(mode==='start')result=await start(ctx);
    else if(mode==='stop')result=await stop(ctx);
    else {
      const state=await stateFor(ctx);if(!state||state.phase!=='READY')fail('Bam START_VOLUME.bat truoc.');
      await dockerLocal(ctx);validateOwned(state,await inventory(ctx,state));const s=await status(ctx);const db=await poolFor(ctx,s);
      try{await migrationCheck(ctx,db);let data='';for await(const chunk of process.stdin){data+=chunk;if(data.length>4096)fail('Du lieu nhap qua lon.');}const input=JSON.parse(data);
        result=mode==='admin'?await setupAdmin(ctx,state,s,db,input):await recoverAdmin(s,db,input.email);
      }finally{await db.end();}
    }
    console.log(JSON.stringify(result));
  }finally{await release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error('VOLUME: '+(e instanceof DemoError?e.message:'Chua hoan tat. Kiem tra Docker/mang va thu lai. Khong reset du lieu.'));process.exitCode=1;});
