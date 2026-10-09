// Called only inside the existing isolated VOLUME_DEMO_REAL CI fixture.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {publicData,createHandler} from '../../integrations/telegram/bot.mjs';
export async function verifyTelegramPublicV2(db,local){
 const venue=randomUUID(),hidden=randomUUID(),table=randomUUID();
 await db.query("insert into public.venues(id,code,name,public_address,timezone,is_public,is_enabled) values($1,$2,'Telegram CI Venue','CI public address','Asia/Ho_Chi_Minh',true,true),($3,$4,'PRIVATE HIDDEN VENUE','Private address','Asia/Ho_Chi_Minh',false,true)",[venue,'tg-'+venue.slice(0,8),hidden,'tg-'+hidden.slice(0,8)]);
 await db.query("insert into public.billiard_tables(id,venue_id,code,label,hourly_price_vnd) values($1,$2,'T1','CI real table',120000),(gen_random_uuid(),$3,'SECRET','PRIVATE HIDDEN TABLE',90000)",[table,venue,hidden]);
 const config={api:local.API_URL,key:local.ANON_KEY,web:'https://volume.example'},data=publicData(config);
 const before=await data.tables();assert.equal(before.find(t=>t.id===table)?.availability,'available');assert.ok(!before.some(t=>t.venue_id===hidden));
 const venues=await data.venues();assert.equal(venues.find(v=>v.id===venue)?.public_address,'CI public address');assert.ok(!venues.some(v=>v.id===hidden));
 await db.query('update public.billiard_tables set hourly_price_vnd=150000 where id=$1',[table]);
 assert.equal((await data.tables()).find(t=>t.id===table)?.hourly_price_vnd,'150000','Adapter must read current V2 data, not a cached legacy catalogue');
 const messages=[];await createHandler({config,data,send:async(_,body)=>messages.push(body)})({message:{chat:{id:42,type:'private'},from:{id:42},text:'/tables'}});
 assert.match(messages[0].text,/CI real table/);assert.match(messages[0].text,/150\.000/);assert.doesNotMatch(JSON.stringify(messages),/PRIVATE HIDDEN/);
 const privateResponse=await fetch(local.API_URL+'/rest/v1/rpc/own_table_sessions',{method:'POST',headers:{apikey:local.ANON_KEY,Authorization:'Bearer '+local.ANON_KEY,'Content-Type':'application/json'},body:'{}'});
 assert.ok([400,401,403].includes(privateResponse.status),'Anon adapter must not read private customer sessions');
 await db.query("update public.venues set is_enabled=false where id=$1",[venue]);
 assert.ok(!(await data.tables()).some(t=>t.id===table));assert.ok(!(await data.venues()).some(v=>v.id===venue));
 console.log('VOLUME: Telegram adapter real V2 public data, freshness, hidden/disabled venue and private-session denial PASS; live Telegram NOT RUN.');
}
