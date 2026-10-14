// V2 transport adapter. No legacy Store, SQLite, identity map or privileged key.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export class BotError extends Error {
 constructor(code){super(code);this.name='BotError';this.code=code;}
}
function origin(value,local=false){
 let u;try{u=new URL(value);}catch{throw new BotError('CONFIG_URL');}
 if(u.username||u.password||u.search||u.hash||u.pathname!=='/'||
   !(u.protocol==='https:'||(local&&u.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(u.hostname))))throw new BotError('CONFIG_URL');
 return u.origin;
}
export function configuration(env){
 const api=origin(env.VOLUME_SUPABASE_URL,true),web=origin(env.VOLUME_CUSTOMER_URL,env.VOLUME_TELEGRAM_LOCAL_TEST==='1');
 const key=env.VOLUME_SUPABASE_ANON_KEY||'';
 // This adapter intentionally uses only the same legacy anon key as frozen V2.
 let claims;try{claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString());}catch{throw new BotError('CONFIG_ANON_KEY');}
 if(key.split('.').length!==3||claims.role!=='anon')throw new BotError('CONFIG_ANON_KEY');
 const username=env.VOLUME_TELEGRAM_USERNAME||'';
 if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username))throw new BotError('CONFIG_USERNAME');
 const control=env.VOLUME_CONTROL_URL?origin(env.VOLUME_CONTROL_URL,env.VOLUME_TELEGRAM_LOCAL_TEST==='1'):null;return {api,web,key,username,control};
}
const clean=(value,max=120)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max):'';
const validId=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function jsonResponse(response,code){
 if(!response.ok)throw new BotError(code);
 try{return await response.json();}catch{throw new BotError(code);}
}
export function publicData(config,request=fetch){
 async function rpc(name){
  let response;try{response=await request(config.api+'/rest/v1/rpc/'+name,{method:'POST',redirect:'error',headers:{apikey:config.key,Authorization:'Bearer '+config.key,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(10000)});}catch{throw new BotError('V2_UNAVAILABLE');}
  const rows=await jsonResponse(response,'V2_UNAVAILABLE');
  if(!Array.isArray(rows))throw new BotError('V2_INVALID_RESPONSE');
  return rows;
 }
 return {
  async tables(){return (await rpc('public_tables')).map(t=>{
   if(!validId(t.id)||!validId(t.venue_id)||!['available','pending','playing'].includes(t.availability)||!/^\d{1,15}$/.test(t.hourly_price_vnd)||!t.label||!t.venue_name)throw new BotError('V2_INVALID_RESPONSE');
   return {id:t.id,venue_id:t.venue_id,label:clean(t.label),venue_name:clean(t.venue_name),availability:t.availability,hourly_price_vnd:t.hourly_price_vnd,management_contact:clean(t.management_contact,500)};
  });},
  async venues(){return (await rpc('public_venues')).map(v=>{
   if(!validId(v.id)||!v.name)throw new BotError('V2_INVALID_RESPONSE');
   return {id:v.id,name:clean(v.name),public_address:clean(v.public_address,500),timezone:clean(v.timezone)};
  });}
 };
}
const labels={available:'Còn trống',pending:'Đang giữ để thanh toán',playing:'Đang chơi'};
const menu=JSON.parse(await readFile(new URL('./legacy-navigation.json',import.meta.url),'utf8'));
const routes=new Set(['home','booking','book','manage_table','tables','visit','volume','shop','rank','tournament','feedback','club_owner','orders','member','match','help','management']);
const urlButton=(text,url)=>({text,url});
const actionButton=(text,callback_data)=>({text,callback_data});
export function resolveIntent(text){
 const match=/^\/(start|menu|help|tables|booking|status|visit)(?:@[A-Za-z0-9_]+)?(?:\s+([A-Za-z0-9_]{1,64}))?\s*$/.exec(text||'');
 if(!match)return 'home';
 const intent=match[1]==='start'?(match[2]||'home'):({menu:'home',status:'manage_table'}[match[1]]||match[1]);
 return routes.has(intent)?intent:'home';
}
export function createHandler({config,data,send,privateData}){
 const web=(path)=>config.web+path;
 const home=()=>menu.map(row=>row.map(([text,intent])=>actionButton(text,intent)));
 async function view(intent,telegram){
  if(intent==='shop')return {text:'🛍 CỬA HÀNG VOLUME\nChọn sản phẩm, xem giá/tồn tại chi nhánh và đặt hàng trong tài khoản. Đơn hàng giữ tồn 15 phút; thanh toán tiền mặt tại quầy.',rows:[[urlButton('Mua gậy, phụ kiện và bàn',web('/shop'))],[actionButton('Đơn hàng của tôi','orders')]]};
  if(['orders','rank','feedback','management'].includes(intent)||(intent==='manage_table'&&privateData)){
   const paths={orders:'/orders',rank:'/player',feedback:'/feedback',manage_table:'/tables',management:'/overview'};
   const titles={orders:'ĐƠN HÀNG CỦA TÔI',rank:'HẠNG CƠ THỦ',feedback:'PHẢN ÁNH & HỖ TRỢ',manage_table:'BÀN / PHIÊN CỦA TÔI',management:'QUẢN LÝ'};
   let text=titles[intent],rows=[[urlButton('Mở '+titles[intent].toLowerCase(),web(paths[intent]==='/overview'?'/profile':paths[intent]))]];
   try{if(!privateData)throw new BotError('LINK_REQUIRED');const result=await privateData.read(telegram,{manage_table:'sessions'}[intent]||intent);
    if(intent==='orders')text+='\n'+(result.slice(0,8).map(o=>'Đơn '+o.id.slice(0,8)+' · '+({PENDING:'Chờ thu tiền tại quầy',PAID:'Đã thu tiền mặt',FULFILLED:'Đã giao',CANCELLED:'Đã hủy',EXPIRED:'Hết hạn'}[o.state]||'Kiểm tra trạng thái')+' · '+new Intl.NumberFormat('vi-VN').format(BigInt(o.total_vnd))+' đ').join('\n')||'Chưa có đơn hàng.');
    if(intent==='rank')text+='\n'+(result.ranks.map(r=>clean(r.venue_name)+' · '+clean(r.rank_name)+(r.rank_active?'':' (định nghĩa đã ngừng)')).join('\n')||'Chưa có hạng do CLB xác nhận.');
    if(intent==='feedback')text+='\n'+(result.slice(0,5).map(t=>clean(t.message,180)+' · '+({NEW:'Đã tiếp nhận',IN_PROGRESS:'Đang xử lý',RESOLVED:'Đã giải quyết'}[t.state]||'Đang kiểm tra')+(t.messages.length?'\nTrả lời: '+clean(t.messages.at(-1).message,300):'')).join('\n\n')||'Chưa có phản ánh.');
    if(intent==='manage_table')text+='\n'+(result.slice(0,8).map(t=>clean(t.label)+' · '+({ACTIVE:'Đang chơi',PENDING_PAYMENT:'Chờ thanh toán',CANCELLED:'Đã hủy',CLOSED:'Đã đóng'}[t.state]||'Kiểm tra trạng thái')).join('\n')||'Chưa có phiên của bạn.');
    if(intent==='management'){rows=[];text+='\nCác màn hình sẽ kiểm tra lại tài khoản VOLUME và phạm vi chi nhánh.';for(const v of result.venues){const base=config.control;if(!base)continue;for(const [allowed,path,label] of [[v.access.shop_read,'orders','Đơn hàng'],[v.access.shop_read,'products','Kho'],[v.access.rank_read,'ranks','Hạng'],[v.access.feedback_read,'feedback','Phản ánh'],[v.access.support_write,'support','Liên hệ hỗ trợ']])if(allowed)rows.push([urlButton(clean(v.name)+' · '+label,base+'/'+path+'?venue='+encodeURIComponent(v.id))]);if(['ADMIN','CEO','MANAGER','STAFF'].includes(result.role))rows.push([urlButton(clean(v.name)+' · Bàn & phiên',base+'/tables?venue='+encodeURIComponent(v.id))]);}if(!rows.length)text+='\nKhông có phạm vi quản lý hoặc chưa cấu hình địa chỉ Control Center.';}
   }catch{ text+='\nTelegram không có quyền đọc dữ liệu riêng khi chưa liên kết hoặc quyền đã bị thu hồi. Đăng nhập VOLUME, mở Liên kết Telegram và xác nhận tài khoản của bạn.';rows.push([urlButton('Liên kết / kiểm tra tài khoản',web('/telegram'))]);}
   if(intent==='feedback')rows.push([urlButton('Gửi phản ánh / chat với người hỗ trợ',web('/feedback'))]);
   return {text,rows};
  }
  const match=/^tables_(\d{1,4})$/.exec(intent);
  if(match||['tables','booking','book'].includes(intent)){
   const tables=await data.tables(),page=match?Number(match[1]):0,size=6;
   const start=Math.min(page,Math.max(0,Math.ceil(tables.length/size)-1))*size;
   const lines=tables.slice(start,start+size).map(t=>`${t.venue_name} · ${t.label}\n${labels[t.availability]} · ${new Intl.NumberFormat('vi-VN').format(BigInt(t.hourly_price_vnd))} đ / 60 phút`);
   const paging=[];if(start>0)paging.push(actionButton('← Trước','tables_'+(start/size-1)));if(start+size<tables.length)paging.push(actionButton('Sau →','tables_'+(start/size+1)));
   return {text:'🎱 BÀN TẠI VOLUME\n\n'+(lines.join('\n\n')||'Hiện chưa có bàn được công bố.')+'\n\nVừa đọc từ V2. Trạng thái có thể thay đổi; chọn và xác nhận trong tài khoản Volume. Chưa giữ bàn chỉ vì bấm nút Telegram.',rows:[...(paging.length?[paging]:[]),[actionButton('Tải lại','tables_'+start/size)],[urlButton('Đăng nhập / Chọn bàn',web('/tables'))],[actionButton('Bàn / Phiên của tôi','manage_table')]]};
  }
  const venuePage=/^visit_(\d{1,4})$/.exec(intent);
  if(venuePage||['visit','volume','feedback','club_owner','match'].includes(intent)){
   const [venues,tables]=await Promise.all([data.venues(),data.tables()]);
   const start=Math.min(venuePage?Number(venuePage[1]):0,Math.max(0,Math.ceil(venues.length/3)-1))*3;
   const details=venues.slice(start,start+3).map(v=>{const contact=tables.find(t=>t.venue_id===v.id&&t.management_contact)?.management_contact;return v.name+'\n'+(v.public_address||'Chưa công bố địa chỉ.')+(contact?'\nLiên hệ: '+contact:'');});
   const paging=[];if(start>0)paging.push(actionButton('← Trước','visit_'+(start/3-1)));if(start+3<venues.length)paging.push(actionButton('Sau →','visit_'+(start/3+1)));
   return {text:'📍 THÔNG TIN TỪ VOLUME V2\n\n'+(details.join('\n\n')||'Chưa có chi nhánh công khai.')+'\n\nLiên hệ trực tiếp để được tư vấn, phản ánh hoặc tìm bạn chơi. Tin nhắn ở đây chưa tạo phiếu hỗ trợ.',rows:[...(paging.length?[paging]:[]),[urlButton('Xem showroom',web('/showroom.html#visit'))]]};
  }
  if(intent==='manage_table')return {text:'🎱 BÀN / PHIÊN CỦA TÔI\nĐăng nhập Volume để tạo yêu cầu và xem trạng thái thực: chờ thanh toán, đang chơi, đã hủy hoặc đã đóng. Telegram không có quyền xem phiên riêng của bạn; mã Telegram không phải tài khoản Volume.',rows:[[urlButton('Mở phiên trong tài khoản Volume',web('/tables'))]]};
  if(intent==='member')return {text:'👤 TÀI KHOẢN VOLUME\nDùng tài khoản V2 hiện có. Không gửi mật khẩu hoặc mã đăng nhập vào chat.',rows:[[urlButton('Đăng nhập Volume',web('/profile'))]]};
  if(intent==='shop')return {text:'🛍 VOLUME SHOP\nKhám phá bộ sưu tập. Đặt hàng, tồn kho và thanh toán shop chưa kết nối V2; liên hệ quán trước khi mua.',rows:[[urlButton('Xem bộ sưu tập',web('/showroom.html#shop'))],[actionButton('Liên hệ quán','visit')]]};
  if(['rank','tournament','orders'].includes(intent))return {text:'🏆 THÔNG TIN VOLUME\n'+(intent==='orders'?'Đơn shop legacy chưa đồng bộ sang V2. Liên hệ quán để kiểm tra đơn đã có.':'Bảng hạng và đăng ký giải legacy chưa đồng bộ sang V2. Xem hoạt động và liên hệ quán để xác nhận thông tin mới nhất.'),rows:[[urlButton('Hoạt động Volume',web('/showroom.html#hall-of-fame'))],[actionButton('Liên hệ quán','visit')]]};
  return {text:'VOLUME STADIUM BILLIARDS\nChọn điều bạn cần. Bàn và chi nhánh được đọc từ V2; thao tác tài khoản và thanh toán thực hiện trong website Volume.',rows:home()};
 }
 return async update=>{
  const callback=update?.callback_query,message=callback?.message||update?.message,from=callback?.from||message?.from;
  // No group/forwarded/inline identity assumptions. No Telegram value becomes V2 authorization.
  if(message?.chat?.type!=='private'||!Number.isSafeInteger(message.chat.id)||message.chat.id<=0||from?.id!==message.chat.id||from?.is_bot)return;
  if(callback&&typeof callback.id==='string')await send('answerCallbackQuery',{callback_query_id:callback.id});
  const proof=!callback&&/^\/start(?:@[A-Za-z0-9_]+)? link_([0-9a-f]{48})$/.exec(message.text||'');
  if(proof){let text;try{if(!privateData)throw new BotError('PRIVATE_BACKEND_CONFIG');await privateData.redeem(proof[1],from.id,clean(from.first_name||from.username||'Telegram'));text='Đã nhận yêu cầu. Quay lại website VOLUME, tải lại và xác nhận đúng tài khoản Telegram. Liên kết chưa có hiệu lực cho đến khi bạn xác nhận trên website.';}catch{text='Mã không hợp lệ, đã dùng hoặc hết hạn. Tạo mã mới trong tài khoản VOLUME; không gửi mật khẩu vào chat.';}await send('sendMessage',{chat_id:from.id,text});return;}
  const requested=callback?callback.data:resolveIntent(message.text);
  const intent=routes.has(requested)||/^(tables|visit)_\d{1,4}$/.test(requested||'')?requested:'home';
  let result;
  try{result=await view(intent,from.id);}catch(error){if(!(error instanceof BotError))throw error;result={text:'Chưa kết nối được dữ liệu V2. Không có yêu cầu đặt bàn nào được tạo. Thử tải lại hoặc mở website.',rows:[[actionButton('Thử lại',intent)],[urlButton('Mở Volume',web('/tables'))]]};}
  if(intent!=='home')result.rows.push([actionButton('← Menu Volume','home')]);
  await send('sendMessage',{chat_id:message.chat.id,text:result.text,link_preview_options:{is_disabled:true},reply_markup:{inline_keyboard:result.rows}});
 };
}
export function telegramApi(token,request=fetch){
 if(!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token||''))throw new BotError('CONFIG_TOKEN');
 const allowed=new Set(['getMe','getWebhookInfo','getUpdates','sendMessage','answerCallbackQuery']);
 return async(method,body={})=>{
  if(!allowed.has(method))throw new BotError('METHOD_DENIED');
  let response;try{response=await request('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(40000)});}catch{throw new BotError('TELEGRAM_CONNECTION');}
  const result=await jsonResponse(response,'TELEGRAM_HTTP_'+response.status);
  if(result.ok!==true)throw new BotError('TELEGRAM_API');
  return result.result;
 };
}
export async function run(env=process.env){
 const {lock}=await import('../../scripts/local-demo-admin.mjs');const release=await lock(55327);
 try{return await poll(env);}finally{await release();}
}
async function poll(env){
 const config=configuration(env),api=telegramApi(env.VOLUME_TELEGRAM_TOKEN);
 const me=await api('getMe');if(me.username?.toLowerCase()!==config.username.toLowerCase())throw new BotError('BOT_USERNAME_MISMATCH');
 if((await api('getWebhookInfo')).url)throw new BotError('EXISTING_WEBHOOK_STOP');
 const data=publicData(config);await Promise.all([data.tables(),data.venues()]);
 if(process.argv.includes('--check')){console.log('VOLUME: bot username and public V2 connection verified; no messages sent.');return;}
 const {privateData:connectPrivate}=await import('./private-data.mjs');const privateBackend=env.VOLUME_TELEGRAM_DB_URL?connectPrivate(env.VOLUME_TELEGRAM_DB_URL):null;const handle=createHandler({config,data,send:api,privateData:privateBackend});let offset=0,stopping=false;
 const stop=()=>{stopping=true;};process.once('SIGINT',stop);process.once('SIGTERM',stop);
 console.log('VOLUME: Telegram adapter running. Ctrl+C to stop; no database lifecycle actions.');
 try{while(!stopping){
  const updates=await api('getUpdates',{offset,timeout:25,allowed_updates:['message','callback_query']});
  if(!Array.isArray(updates))throw new BotError('TELEGRAM_INVALID_UPDATES');
  for(const update of updates){if(stopping)break;if(!Number.isSafeInteger(update.update_id)||update.update_id<0)throw new BotError('TELEGRAM_INVALID_UPDATES');await handle(update);offset=update.update_id+1;}
 }}finally{await privateBackend?.close();process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 run().catch(error=>{console.error('VOLUME: '+(error instanceof BotError?error.code:'INTERNAL_ERROR')+'. Check private configuration / existing bot process; no data reset.');process.exitCode=1;});
}
