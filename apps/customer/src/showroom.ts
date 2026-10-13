import {rpc} from '@volume/shared';
import {money,type TableRow} from '../../../packages/shared/src/table-payment';

// Public username from the supplied F6.1 example; configurable without bot credentials.
const username=import.meta.env.VITE_TELEGRAM_BOT_USERNAME||'Volumestation_bot';
const intents=new Set(['home','shop','rank','tournament','feedback','club_owner','orders','member','match','visit','volume']);
export function telegramLink(bot:string,intent:string){
 if(!/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(bot)||!intents.has(intent))return null;
 return 'https://t.me/'+bot+'?start='+encodeURIComponent(intent);
}
const note=document.createElement('p');note.className='v2-contact-note';note.setAttribute('role','status');document.querySelector('footer')?.append(note);
document.querySelectorAll<HTMLElement>('[data-telegram]').forEach(element=>{
 const link=telegramLink(username,element.dataset.tgStart||'home');
 if(element instanceof HTMLAnchorElement&&link){element.href=link;element.rel='noopener noreferrer';}
 element.addEventListener('click',event=>{
  if(!link){event.preventDefault();note.textContent='Telegram chưa được cấu hình. Mở mục Hỗ trợ để gửi phản ánh hoặc xem liên hệ chi nhánh.';note.scrollIntoView({block:'center'});return;}
  // A standard HTTPS app link works on iOS and desktop; no timed redirect or popup race.
  if(!(element instanceof HTMLAnchorElement))window.location.assign(link);
 });
});
const tableStatus=document.querySelector<HTMLElement>('#liveTablesStatus');
const tableList=document.querySelector<HTMLElement>('#liveTables');
const availabilityLabels:Record<TableRow['availability'],string>={available:'Còn trống',pending:'Đang giữ',playing:'Đang chơi'};
let pending=false;
async function loadTables(){
 if(pending||!tableStatus||!tableList||document.hidden)return;
 pending=true;
 try{
  const tables=await rpc<TableRow[]>('public_tables');
  tableList.replaceChildren();
  tableStatus.textContent=tables.length?'Trạng thái có thể thay đổi. Kiểm tra lại khi chọn bàn.':'Hiện chưa có bàn được công bố. Liên hệ Volume để được hỗ trợ.';
  for(const table of tables.slice(0,6)){
   const card=document.createElement('a');card.className='v2-table';card.href='/tables';
   const title=document.createElement('strong');title.textContent=table.label;
   const venue=document.createElement('span');venue.textContent=table.venue_name||'Volume';
   const detail=document.createElement('span');detail.textContent=availabilityLabels[table.availability]||'Chưa phục vụ';
   const price=document.createElement('span');price.textContent=table.hourly_price_vnd==null?'Xem giá khi chọn bàn':money(table.hourly_price_vnd)+' / 60 phút';
   card.append(title,venue,detail,price);tableList.append(card);
  }
 }catch{tableList.replaceChildren();tableStatus.textContent='Chưa kết nối được trạng thái bàn. Mở Chọn bàn để thử lại hoặc liên hệ Volume.';}
 finally{pending=false;}
}
void loadTables();
const interval=window.setInterval(()=>void loadTables(),15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void loadTables();});
window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});

// Functional product destinations retain the existing cinematic presentation/assets.
const featureRoutes:Record<string,string>={shop:'/shop',orders:'/orders',rank:'/player',feedback:'/feedback',member:'/profile'};
document.querySelectorAll<HTMLElement>('[data-telegram]').forEach(element=>{const route=featureRoutes[element.dataset.tgStart||''];if(!route)return;const copy=element.cloneNode(true) as HTMLElement;if(copy instanceof HTMLAnchorElement){copy.href=route;copy.removeAttribute('target');}else copy.addEventListener('click',()=>window.location.assign(route));element.replaceWith(copy);});
