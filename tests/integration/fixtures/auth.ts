/** Real-provider compatibility preflight. No mocked JWT/session or application authority. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

async function sessionLifecyclePreflight() {
  const raw = execFileSync('supabase', ['status', '-o', 'json'], { encoding: 'utf8' });
  const config = JSON.parse(raw);
  const base = config.API_URL;
  const key = config.ANON_KEY;
  assert.ok(base && key, 'Local Auth endpoint and anon key required');
  const email = `preflight-${randomUUID()}@example.test`;
  const password = `Local-test-${randomUUID()}!`;
  async function request(path: string, body: object) {
    const response = await fetch(`${base}/auth/v1/${path}`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 200, `Auth ${path} status ${response.status}`);
    return response.json();
  }
  function claims(token: string) { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()); }
  function sessionRow(id: string) {
    assert.match(id, /^[0-9a-f-]{36}$/);
    return JSON.parse(execFileSync('docker', ['exec', 'supabase_db_volume-preflight',
      'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-c',
      `select row_to_json(s) from (select id,user_id,created_at from auth.sessions where id='${id}'::uuid) s;`], {encoding:'utf8'}));
  }
  await request('signup', {email, password});
  const initial = await request('token?grant_type=password', {email,password});
  const initialClaims = claims(initial.access_token);
  const before = sessionRow(initialClaims.session_id);
  assert.equal(before.user_id, initialClaims.sub);
  assert.ok(before.created_at);
  const refreshed = await request('token?grant_type=refresh_token', {refresh_token: initial.refresh_token});
  assert.equal(claims(refreshed.access_token).session_id, initialClaims.session_id);
  const after = sessionRow(initialClaims.session_id);
  assert.equal(after.created_at, before.created_at, 'Refresh must preserve session creation authority');
  const relogin = await request('token?grant_type=password', {email,password});
  const next = sessionRow(claims(relogin.access_token).session_id);
  assert.notEqual(next.id, before.id, 'Re-login must create a distinct session');
  assert.ok(new Date(next.created_at).getTime() >= new Date(before.created_at).getTime());
  console.log('REAL AUTH PREFLIGHT PASS: verified user/session mapping; refresh preserves session_id/created_at; re-login creates new session. This is not Checkpoint 1A acceptance.');
}
if (process.argv.includes('--preflight')) await sessionLifecyclePreflight();

// Privileged SQL is restricted to isolated fixture setup/fault injection/observations.
// All allow/deny requests use anon key plus a real user access token.
export async function fixture() {
  const { default: pg } = await import('pg');
  const config = JSON.parse(execFileSync('supabase', ['status','-o','json'], {encoding:'utf8'}));
  assert.match(config.API_URL, /^http:\/\/(127\.0\.0\.1|localhost):/);
  const db = new pg.Pool({connectionString:config.DB_URL});
  const anon = config.ANON_KEY;
  const base = config.API_URL;
  const users: Record<string,{id:string,email:string,password:string,token:string,refresh:string,session:string}> = {};
  async function auth(path:string,body:object) {
    const r=await fetch(`${base}/auth/v1/${path}`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await r.json(); return {status:r.status,data};
  }
  async function login(name:string) {
    const u=users[name]; const r=await auth('token?grant_type=password',{email:u.email,password:u.password});
    assert.equal(r.status,200,'Real email/password login failed');
    u.token=r.data.access_token;u.refresh=r.data.refresh_token;
    u.session=JSON.parse(Buffer.from(u.token.split('.')[1],'base64url').toString()).session_id;
    return {...u};
  }
  async function rpc(name:string|undefined,method:string,body:object={}) {
    const r=await fetch(`${base}/rest/v1/rpc/${method}`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json',...(name?{Authorization:`Bearer ${users[name].token}`}:{})},body:JSON.stringify(body)});
    return {status:r.status,data:await r.json()};
  }
  async function direct(name:string|undefined,path:string,method='GET',body?:object) {
    const r=await fetch(`${base}/rest/v1/${path}`,{method,headers:{apikey:anon,'Content-Type':'application/json',...(name?{Authorization:`Bearer ${users[name].token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
    return {status:r.status,data:await r.json()};
  }
  await db.query('truncate public.audit_events,public.staff_memberships,public.profiles cascade');
  const roles:Record<string,string>={admin1:'ADMIN',admin2:'ADMIN',ceo:'CEO',managerA:'MANAGER',managerB:'MANAGER',managerAB:'MANAGER',staffA:'STAFF',staffB:'STAFF',hrA:'STAFF',user1:'USER',user2:'USER',disabled:'USER',inactive:'STAFF'};
  for(const [name,role] of Object.entries(roles)) {
    const email=`${name}-${randomUUID()}@example.test`;const password=`Local-${randomUUID()}!`;
    const result=await auth('signup',{email,password,data:{role:'ADMIN',account_status:'ACTIVE',extra_permissions:['UNKNOWN']}});
    assert.equal(result.status,200,'Real signup failed');
    const id=result.data.user?.id ?? result.data.id;
    const p=(await db.query('select role,account_status,version from public.profiles where id=$1',[id])).rows[0];
    assert.deepEqual(p,{role:'USER',account_status:'ACTIVE',version:'1'},'Bootstrap must ignore forged metadata');
    users[name]={id,email,password,token:'',refresh:'',session:''};
    await db.query('update public.profiles set role=$2,display_name=$3,account_status=$4 where id=$1',[id,role,name,name==='disabled'?'DISABLED':'ACTIVE']);
    if(role==='ADMIN') await db.query("insert into public.audit_events(source,category,action,target_type,target_id,reason,after_data) values('SYSTEM','SECURITY','BOOTSTRAP_ADMIN_CREATED','profiles',$1,'Isolated local test operator bootstrap',jsonb_build_object('id',$1::uuid,'role','ADMIN','account_status','ACTIVE','version','1'))",[id]);
    await login(name);
  }
  const A='10000000-0000-0000-0000-000000000001',B='10000000-0000-0000-0000-000000000002';
  await db.query("update public.venues set version=1,name=case code when 'A' then 'Venue A' when 'B' then 'Venue B' else name end");
  for (const [name,venues] of Object.entries({managerA:[A],managerB:[B],managerAB:[A,B],staffA:[A],staffB:[B],hrA:[A],inactive:[A]})) {
    for(const venue of venues) await db.query('insert into public.staff_memberships(profile_id,venue_id,status,extra_permissions) values($1,$2,$3,$4)',[users[name].id,venue,name==='inactive'?'INACTIVE':'ACTIVE',name==='hrA'?['STAFF_DIRECTORY_READ','STAFF_MEMBERSHIP_STATUS_MANAGE']:[]]);
  }
  async function version(name:string) {return (await db.query('select version from public.profiles where id=$1',[users[name].id])).rows[0].version;}
  async function membership(name:string,venue=A) {return (await db.query('select * from public.staff_memberships where profile_id=$1 and venue_id=$2',[users[name].id,venue])).rows[0];}
  async function changeRole(target:string,role:string,actor='admin1',changes:object[]=[]) {return rpc(actor,'update_access',{p_profile_id:users[target].id,expected_version:await version(target),p_role:role,p_memberships:changes,p_reason:'Local security integration test'});}
  async function account(target:string,status:string,actor='admin1') {return rpc(actor,'set_account_status',{p_profile_id:users[target].id,expected_version:await version(target),p_status:status,p_reason:'Local security integration test'});}
  async function venue(actor:string,name='Changed venue',expected='1',id=A) {return rpc(actor,'update_venue',{p_id:id,expected_version:expected,p_code:id===A?'A':'B',p_name:name,p_public_address:null,p_timezone:'Asia/Ho_Chi_Minh',p_is_public:id===A,p_is_enabled:true,p_reason:'Local venue integration test'});}
  return {db,base,anon,users,A,B,auth,login,rpc,direct,version,membership,changeRole,account,venue,close:()=>db.end()};
}
export type Fixture = Awaited<ReturnType<typeof fixture>>;
export function allowed(r:{status:number}) {assert.equal(r.status,200);}
export function denied(r:{status:number}) {assert.ok(r.status>=400,`Expected denial, got ${r.status}`);}
