import {beforeAll,afterAll,test,expect} from 'vitest';
import {fixture,type Fixture} from './fixtures/auth';
let f:Fixture;beforeAll(async()=>{f=await fixture();});afterAll(async()=>{await f?.close();});
async function recoveryHash(name:string) {
 const r=await f.auth('recover',{email:f.users[name].email});expect(r.status).toBe(200);
 for(let tries=0;tries<20;tries++){
  const list=await (await fetch('http://127.0.0.1:54324/api/v1/messages')).json();
  const mail=list.messages?.find((m:any)=>m.To?.some((t:any)=>t.Address===f.users[name].email));
  if(mail){const msg=await(await fetch(`http://127.0.0.1:54324/api/v1/message/${mail.ID}`)).json();const body=`${msg.Text}\n${msg.HTML}`;const match=body.match(/[?&]token=([^&"'<>\s]+)/);expect(match,'Real captured recovery link required').toBeTruthy();return decodeURIComponent(match![1]);}
  await new Promise(r=>setTimeout(r,250));
 }
 throw new Error('Recovery email not delivered to local Mailpit');
}
test('API13: actual email recovery token, target-only password update and replay denial',async()=>{
 const hash=await recoveryHash('user1');const verified=await f.auth('verify',{token_hash:hash,type:'recovery'});expect(verified.status).toBe(200);expect(verified.data.user.id).toBe(f.users.user1.id);
 const nextPassword='Local-recovered-password-2026!';const changed=await fetch(`${f.base}/auth/v1/user`,{method:'PUT',headers:{apikey:f.anon,Authorization:`Bearer ${verified.data.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({password:nextPassword,id:f.users.user2.id})});expect(changed.status).toBe(200);expect((await changed.json()).id).toBe(f.users.user1.id);
 expect((await f.auth('token?grant_type=password',{email:f.users.user1.email,password:f.users.user1.password})).status).toBeGreaterThanOrEqual(400);f.users.user1.password=nextPassword;await f.login('user1');await f.login('user2');
 expect((await f.auth('verify',{token_hash:hash,type:'recovery'})).status).toBeGreaterThanOrEqual(400);
});
test('API13: expired recovery token denied by real provider',async()=>{
 const hash=await recoveryHash('user2');await f.db.query("update auth.users set recovery_sent_at=clock_timestamp()-interval '1 hour' where id=$1",[f.users.user2.id]);
 const r=await f.auth('verify',{token_hash:hash,type:'recovery'});expect(r.status).toBeGreaterThanOrEqual(400);await f.login('user2');
});
