import {useEffect,useState} from 'react';
import {rpc,type Access} from '@volume/shared';
import SessionFinancePanel from '../../../../../packages/shared/src/SessionFinancePanel';
import {settlementLabel,type SessionFinancial} from '../../../../../packages/shared/src/session-finance';
export default function SessionsPage({access}:{access:Access}){
 const query=new URLSearchParams(window.location.search);const venue=query.get('venue')||(['MANAGER','STAFF'].includes(access.profile.role)?access.venues[0]?.id:null);const requested=query.get('session');
 const[rows,setRows]=useState<SessionFinancial[]>([]),[selected,setSelected]=useState<string|null>(requested),[message,setMessage]=useState(''),[denied,setDenied]=useState(false);
 async function load(){try{const r=await rpc<SessionFinancial[]>('session_financial_operations',{p_venue:venue||null});setRows(r);setDenied(false);setMessage('');}catch(e){setRows([]);setDenied(true);setMessage(e instanceof Error?e.message:'Chưa thể tải phiên.');}}
 useEffect(()=>{void load();},[venue]);
 if(denied)return <section><h1>Không có quyền truy cập</h1><p>{message}</p><button onClick={()=>void load()}>Tải lại danh sách phiên</button></section>;
 return <section className="stack"><h1>Phiên & thu tiền</h1><p>Đóng bàn và thu tiền là hai thao tác riêng. Bàn đã đóng được trả lại kể cả khi khách còn thiếu.</p>
 <label style={{minWidth:0}}>Chi nhánh<select style={{maxWidth:'100%'}} aria-label="Chi nhánh phiên" value={venue||''} onChange={e=>window.location.assign('/sessions'+(e.target.value?'?venue='+e.target.value:''))}>{['ADMIN','CEO'].includes(access.profile.role)&&<option value="">Tất cả chi nhánh</option>}{access.venues.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
 <button className="secondary" onClick={()=>void load()}>Tải lại danh sách phiên</button>
 <label style={{minWidth:0}}>Chọn phiên<select style={{maxWidth:'100%'}} aria-label="Chọn phiên" value={selected||''} onChange={e=>setSelected(e.target.value||null)}><option value="">Chọn bàn và phiên cần xử lý</option>{rows.map(s=><option key={s.id} value={s.id}>{s.venue_name} · {s.table_label} · {s.state==='ACTIVE'?'Đang chơi':'Đã đóng'} · {settlementLabel(s.settlement_status)} · {s.id.slice(0,8)}</option>)}</select></label>
 {!rows.length&&<p>Chưa có phiên trong phạm vi này.</p>}{selected&&<SessionFinancePanel key={selected} sessionId={selected} onUpdate={current=>setRows(previous=>previous.map(s=>s.id===current.id?current:s))}/>}
 </section>;
}
