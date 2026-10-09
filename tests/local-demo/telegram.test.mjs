import test from 'node:test';
import assert from 'node:assert/strict';
import {configuration,publicData,createHandler,resolveIntent,telegramApi} from '../../integrations/telegram/bot.mjs';
const anon='header.'+Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')+'.signature';
const env={VOLUME_SUPABASE_URL:'http://127.0.0.1:55321',VOLUME_SUPABASE_ANON_KEY:anon,VOLUME_CUSTOMER_URL:'https://volume.example',VOLUME_TELEGRAM_USERNAME:'Volumestation_bot'};
const config=configuration(env),id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const table={id,venue_id:id,label:'Bàn 01',venue_name:'Volume',availability:'available',hourly_price_vnd:'120000',management_contact:'Quầy lễ tân'};
test('Only anon credentials and configured safe origins; no arbitrary redirect or elevated identity',()=>{
 for(const role of ['service_role','authenticated',null])assert.throws(()=>configuration({...env,VOLUME_SUPABASE_ANON_KEY:'h.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.s'}));
 for(const url of ['http://production.example','https://user:pass@example.com','https://example.com/?token=x','https://example.com/#x','https://example.com/path'])assert.throws(()=>configuration({...env,VOLUME_CUSTOMER_URL:url}));
 assert.throws(()=>configuration({...env,VOLUME_SUPABASE_URL:'http://127.0.0.1.evil'}));
});
test('Reads only named public RPCs with anon; strips all unrelated fields',async()=>{
 const requests=[],data=publicData(config,async(url,options)=>{requests.push({url,options});return Response.json(url.endsWith('public_tables')?[{...table,customer_profile_id:'private',session_id:'private'}]:[{id,name:'Volume',public_address:'Địa chỉ V2',secret:'private'}]);});
 assert.deepEqual(await data.tables(),[table]);assert.deepEqual(await data.venues(),[{id,name:'Volume',public_address:'Địa chỉ V2',timezone:''}]);
 assert.deepEqual(requests.map(r=>new URL(r.url).pathname),['/rest/v1/rpc/public_tables','/rest/v1/rpc/public_venues']);
 for(const {options} of requests){assert.equal(options.headers.Authorization,'Bearer '+anon);assert.equal(options.body,'{}');assert.equal(options.redirect,'error');}
});
test('Malformed and failed RPC responses cannot become fake availability or expose errors',async()=>{
 for(const reply of [{private:'data'},[{...table,availability:'invented'}],[{...table,hourly_price_vnd:'<script>'}]])await assert.rejects(publicData(config,async()=>Response.json(reply)).tables());
 await assert.rejects(publicData(config,async()=>Response.json({token:'must-not-escape'},{status:401})).tables(),e=>e.message==='V2_UNAVAILABLE');
});
test('All supplied showroom deep-link intents resolve; identity payloads never become commands',()=>{
 for(const intent of ['home','shop','rank','tournament','feedback','club_owner','orders','member','match','visit','volume'])assert.equal(resolveIntent('/start '+intent),intent);
 for(const input of ['/start role=ADMIN','/start user_token','/start https://evil.test','/start booking abc'])assert.equal(resolveIntent(input),'home');
 assert.equal(resolveIntent('/status'),'manage_table');
});
function update(text){return {message:{chat:{id:42,type:'private'},from:{id:42,is_bot:false},text}};}
test('Private chat navigation uses real tables and trusted web destinations; no booking mutation',async()=>{
 const calls=[];let reads=0;const handle=createHandler({config,data:{tables:async()=>{reads++;return [table];},venues:async()=>[{id,name:'Volume',public_address:'Địa chỉ V2'}]},send:async(method,body)=>calls.push({method,body})});
 await handle(update('/start booking'));assert.equal(reads,1);assert.match(calls.at(-1).body.text,/120\.000/);assert.match(calls.at(-1).body.text,/Còn trống/);
 await handle(update('/status'));assert.equal(reads,1);assert.match(calls.at(-1).body.text,/Telegram không có quyền/);
 assert.equal(calls.at(-1).body.reply_markup.inline_keyboard[0][0].url,'https://volume.example/tables');
 await handle(update('/visit'));assert.match(calls.at(-1).body.text,/Địa chỉ V2/);assert.match(calls.at(-1).body.text,/Quầy lễ tân/);
 for(const call of calls)assert.equal(call.method,'sendMessage');
});
test('Group messages, spoofed sender and inline callbacks are ignored',async()=>{
 const handle=createHandler({config,data:{tables:()=>assert.fail()},send:()=>assert.fail()});
 await handle({message:{chat:{id:42,type:'group'},from:{id:42},text:'/tables'}});
 await handle({message:{chat:{id:42,type:'private'},from:{id:43},text:'/tables'}});
 await handle({callback_query:{id:'x',from:{id:42},data:'tables'}});
});
test('Pagination reads fresh data; forged callbacks cannot call arbitrary RPCs or create state',async()=>{
 const calls=[],handle=createHandler({config,data:{tables:async()=>Array.from({length:14},(_,i)=>({...table,label:'Bàn '+i}))},send:async(method,body)=>calls.push({method,body})});
 const cb=data=>({callback_query:{id:'callback',from:{id:42},message:{chat:{id:42,type:'private'}},data}});
 await handle(cb('tables_1'));assert.equal(calls[0].method,'answerCallbackQuery');assert.match(calls[1].body.text,/Bàn 6/);assert.doesNotMatch(calls[1].body.text,/Bàn 0/);
 await handle(cb('open_table_manual'));assert.match(calls.at(-1).body.text,/VOLUME STADIUM/);
});
test('Backend outage is actionable and never claims a booking was made',async()=>{
 const output=[],data=publicData(config,async()=>{throw Error('SECRET_TOKEN');});
 await createHandler({config,data,send:async(_,body)=>output.push(body)})(update('/tables'));
 assert.match(output[0].text,/Không có yêu cầu đặt bàn nào được tạo/);assert.ok(!JSON.stringify(output).includes('SECRET_TOKEN'));
});
test('Telegram transport is method-allowlisted and failure messages contain no token or response',async()=>{
 const token='123:'+('x'.repeat(30));const api=telegramApi(token,async()=>Response.json({description:token},{status:409}));
 await assert.rejects(api('deleteWebhook'),e=>e.message==='METHOD_DENIED');
 await assert.rejects(api('getUpdates'),e=>e.message==='TELEGRAM_HTTP_409');
 await assert.rejects(telegramApi(token,async()=>{throw Error(token);})('getMe'),e=>e.message==='TELEGRAM_CONNECTION');
});
