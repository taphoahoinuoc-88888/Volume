import {useEffect,useState} from 'react';
import {rpc,errorMessage} from '@volume/shared';
import {money,prepareOpening,ownSessions,type TableRow,type OwnSession} from '../../../../../packages/shared/src/table-payment';
export default function TablesPage({signedIn}:{signedIn:boolean}){
 const[tables,setTables]=useState<TableRow[]>([]);const[own,setOwn]=useState<OwnSession[]>([]);const[venue,setVenue]=useState('');const[message,setMessage]=useState('');const[busy,setBusy]=useState(false);
 async function load(){try{setTables(await rpc<TableRow[]>('public_tables'));if(signedIn)setOwn(await ownSessions());}catch(e){setMessage(errorMessage(e));}}
 useEffect(()=>{void load();const interval=setInterval(()=>void load(),5000);return()=>clearInterval(interval);},[signedIn]);
 async function choose(t:TableRow){if(!signedIn){window.location.assign('/login');return;}setBusy(true);setMessage('');
  const storageKey='volume-opening-'+t.id;const key=sessionStorage.getItem(storageKey)||crypto.randomUUID();sessionStorage.setItem(storageKey,key);
  try{const r=await prepareOpening(t,key);if(r.qr&&r.amount_vnd)sessionStorage.setItem('volume-qr-'+r.session_id,JSON.stringify({image:r.qr,amount:r.amount_vnd}));window.location.assign('/table-session?session='+encodeURIComponent(r.session_id));}catch(e){setMessage(errorMessage(e));await load();}finally{setBusy(false);}}
 const venues=Array.from(new Map(tables.map(t=>[t.venue_id,t.venue_name||'Chi nhánh'])).entries());
 return <section className="stack"><h1>Chọn bàn</h1><p>Thanh toán trước 60 phút. Bàn được giữ tối đa 5 phút khi bắt đầu thanh toán.</p>
 {own.filter(s=>s.state==='PENDING_PAYMENT'||s.state==='ACTIVE').map(s=><a key={s.id} href={'/table-session?session='+s.id}>Xem phiên của bạn · {s.label}</a>)}
 <label>Chi nhánh<select value={venue} onChange={e=>setVenue(e.target.value)}><option value="">Tất cả chi nhánh</option>{venues.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
 <p role="status" className="notice">{message}</p><div className="cards">{tables.filter(t=>!venue||t.venue_id===venue).map(t=><article className="card stack" key={t.id} data-testid={'table-'+t.id}><div><h2>{t.label}</h2><p>{t.venue_name}</p><p>{money(t.hourly_price_vnd!)} / 60 phút</p><span className="badge">{t.availability==='available'?'Còn trống':t.availability==='pending'?'Đang giữ để thanh toán':'Đang chơi'}</span></div><button disabled={busy||t.availability!=='available'} onClick={()=>void choose(t)}>{busy?'Đang xử lý…':signedIn?'Chọn bàn':'Đăng nhập để chọn bàn'}</button></article>)}</div>
 {!tables.length&&<p>Hiện chưa có bàn đang phục vụ. Vui lòng thử lại sau.</p>}<button className="secondary" onClick={()=>void load()}>Tải lại bàn</button></section>;
}
