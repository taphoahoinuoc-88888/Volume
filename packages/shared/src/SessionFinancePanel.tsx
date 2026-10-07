import {useEffect,useState} from 'react';
import {client,rpc,VolumeError} from './supabase-client';
import {money} from './table-payment';
import {cashAmount,durationLabel,settlementLabel,pendingCashKey,financialVersions,issueLabels,type SessionFinancial,type CashReceipt} from './session-finance';
type CashDraft={id:string;amount:string;reason:string;submitted?:boolean};
export default function SessionFinancePanel({sessionId,own=false}:{sessionId:string;own?:boolean}){
 const[data,setData]=useState<SessionFinancial|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[preview,setPreview]=useState<SessionFinancial|null>(null),[mode,setMode]=useState<'close'|'cash'|null>(null),[amount,setAmount]=useState(''),[reason,setReason]=useState('Khách thanh toán tiền bàn'),[closeReason,setCloseReason]=useState('Kết thúc phiên chơi'),[draft,setDraft]=useState<CashDraft|null>(null),[receipt,setReceipt]=useState<CashReceipt|null>(null),[storageKey,setStorageKey]=useState<string|null>(null),[unknown,setUnknown]=useState(false);
 const read=()=>rpc<SessionFinancial>(own?'own_session_financial':'session_financial',{p_session:sessionId});
 async function refresh(){try{const s=await read();setData(s);return s;}catch(e){setData(null);setMessage(e instanceof Error?e.message:'Chưa thể tải tiền bàn.');return null;}}
 useEffect(()=>{let live=true;setData(null);setPreview(null);setMode(null);setReceipt(null);setDraft(null);setUnknown(false);setMessage('');
  void client.auth.getUser().then(({data:u})=>{if(!live||!u.user)return;const key=pendingCashKey(u.user.id,sessionId);setStorageKey(key);try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved&&typeof saved.id==='string'&&typeof saved.amount==='string'&&typeof saved.reason==='string'){setDraft({...saved,submitted:true});setAmount(saved.amount);setReason(saved.reason);setUnknown(true);setMessage('Có lần ghi tiền chưa rõ kết quả. Hãy kiểm tra trước khi ghi tiếp.');}}catch{sessionStorage.removeItem(key);}});
  const load=async()=>{try{const s=await read();if(live)setData(s);}catch(e){if(live){setData(null);setMessage(e instanceof Error?e.message:'Chưa thể tải tiền bàn.');}}};void load();const timer=setInterval(()=>void load(),3000);return()=>{live=false;clearInterval(timer);};
 },[sessionId,own]);
 function keepDraft(d:CashDraft|null){setDraft(d);if(storageKey){if(d)sessionStorage.setItem(storageKey,JSON.stringify(d));else sessionStorage.removeItem(storageKey);}}
 async function recover(){setBusy(true);try{
  if(draft&&!own){const r=await rpc<CashReceipt|null>('session_cash_result',{p_session:sessionId,p_receipt_id:draft.id});if(r){setReceipt(r);keepDraft(null);setMessage('Đã ghi nhận tiền mặt.');}else setMessage('Chưa tìm thấy lần ghi tiền này. Hãy xem lại và xác nhận với cùng yêu cầu.');}
  const s=await read();setData(s);if(!draft)setMessage(s.state==='CLOSED'?'Đã đóng bàn. Kết quả đã được lưu.':'Bàn vẫn đang chơi và tiền giờ tiếp tục tính.');setUnknown(false);setMode(null);setPreview(null);
 }catch{setUnknown(true);setMessage('Chưa xác định kết quả. Kiểm tra kết nối rồi bấm kiểm tra lại; không ghi thêm lần mới.');}finally{setBusy(false);}}
 async function prepare(which:'close'|'cash'){setBusy(true);setMessage('');try{
  if(which==='cash'){if(own)return;const proposed=cashAmount(amount);if(!reason.trim()||reason.trim().length>500)throw new Error('Nhập ghi chú thu tiền từ 1 đến 500 ký tự.');if(draft&&(draft.amount!==proposed||draft.reason!==reason.trim()))throw new Error('Cần hoàn tất kiểm tra lần ghi tiền trước, không đổi số tiền của lần đang chờ.');}
  const s=await read();setData(s);setPreview(s);setMode(which);
  if(which==='cash'&&!draft)keepDraft({id:crypto.randomUUID(),amount:cashAmount(amount),reason:reason.trim()});
 }catch(e){setMessage(e instanceof Error?e.message:'Chưa thể xem lại yêu cầu.');}finally{setBusy(false);}}
 async function confirm(){if(!preview||!mode)return;setBusy(true);setMessage('');try{
  if(mode==='close'){const s=await rpc<SessionFinancial>(own?'close_own_table_session':'close_table_session',{...financialVersions(preview),...(!own?{p_reason:closeReason.trim()}:{})});setData(s);setMessage('Đã đóng bàn. Bàn đã được trả lại.');}
  else if(draft){keepDraft({...draft,submitted:true});const r=await rpc<{status:string;receipt:CashReceipt}>('record_session_cash',{...financialVersions(preview),p_receipt_id:draft.id,p_amount_vnd:draft.amount,p_reason:draft.reason});setReceipt(r.receipt);keepDraft(null);setMessage('Đã ghi nhận tiền mặt.');await refresh();}
  setUnknown(false);setMode(null);setPreview(null);
 }catch(e){setMode(null);setPreview(null);
  if(e instanceof VolumeError&&['VERSION_CONFLICT','ACCESS_DENIED'].includes(e.kind)){setMessage(e.message);await refresh();}
  else{setUnknown(true);setMessage('Chưa xác định kết quả. Hãy kiểm tra kết quả đã lưu trước khi thực hiện tiếp.');}
 }finally{setBusy(false);}}
 if(!data)return <div className="card stack" data-testid="session-finance"><p role="status">{message||'Đang tải tiền bàn…'}</p><button onClick={()=>void refresh()} disabled={busy}>Tải lại tiền bàn</button></div>;
 return <div className="card stack" data-testid="session-finance"><h2>{data.state==='CLOSED'?'Đã đóng bàn':'Đang chơi'}</h2>
 <p>{data.venue_name} · {data.table_label} · {data.opening_method==='MANUAL'?'Mở thủ công — không mặc định đã trả tiền':'Phiên thanh toán mở bàn'}</p>
 <p role="status">{message}</p>{data.is_estimate&&<p className="notice">Ước tính — tiền giờ tiếp tục tính đến khi đóng bàn thành công. Số tiền khi xác nhận có thể cao hơn do thời gian tiếp tục trôi.</p>}
 <h3>{settlementLabel(data.settlement_status)}{data.is_estimate?' · tạm tính':''}</h3>
 <dl className="balances"><dt>{data.is_estimate?'Tiền bàn hiện tại':'Tiền bàn cuối cùng'}</dt><dd data-testid="session-charge">{money(data.charge_vnd)}</dd><dt>Đã nhận cho phiên này</dt><dd>{money(data.validated_received_vnd)}</dd><dt>Đã dùng trả tiền bàn</dt><dd>{money(data.applied_amount_vnd)}</dd><dt>Còn phải thu</dt><dd data-testid="session-due">{money(data.remaining_due_vnd)}</dd><dt>Tiền dư cần xử lý</dt><dd>{money(data.unresolved_excess_vnd)}</dd></dl>
 {data.issues.map(x=><p key={x}>{issueLabels[x]||'Cần quản lý kiểm tra thanh toán.'}</p>)}
 <details><summary>Chi tiết phiên</summary><dl className="balances"><dt>Mã phiên</dt><dd className="reference">{data.id}</dd><dt>Bắt đầu</dt><dd>{data.started_at}</dd><dt>Kết thúc</dt><dd>{data.ended_at||'Đang chơi'}</dd><dt>Thời gian chơi</dt><dd>{durationLabel(data.duration_microseconds)}</dd><dt>Số phút tính tiền</dt><dd>{data.billable_minutes}</dd><dt>Giá giờ lúc mở bàn</dt><dd>{money(data.hourly_snapshot_vnd)}</dd><dt>Khách</dt><dd>{data.customer?.display_name||'Khách tại quầy'}</dd>{data.closed_actor_role&&<><dt>Vai trò người đóng</dt><dd>{data.closed_actor_role}</dd><dt>Mã xác nhận đóng</dt><dd className="reference">{data.close_correlation_id}</dd></>}</dl>{data.closure_financial&&<p>Còn thiếu lúc đóng: {money(data.closure_financial.remaining_due_vnd)}. Tiền nhận sau đó được thể hiện ở số dư hiện tại.</p>}</details>
 {data.released&&<p>Bàn đã được trả lại. Khoản còn thiếu hoặc tiền dư vẫn được giữ trong hồ sơ phiên.</p>}
 {unknown?<button disabled={busy} onClick={()=>void recover()}>Kiểm tra kết quả đã lưu</button>:<>
 <div className="row"><button className="secondary" disabled={busy} onClick={()=>void refresh()}>Xem tiền hiện tại</button>{data.can_close&&<button disabled={busy||!!mode||!!draft} onClick={()=>void prepare('close')}>Đóng bàn</button>}</div>
 {data.can_record_cash&&<div className="stack"><h3>Ghi nhận tiền mặt</h3><label>Số tiền mặt (đồng)<input inputMode="numeric" value={amount} disabled={busy||!!draft} onChange={e=>setAmount(e.target.value)}/></label><label>Ghi chú thu tiền<input value={reason} maxLength={500} disabled={busy||!!draft} onChange={e=>setReason(e.target.value)}/></label><button disabled={busy||!!mode} onClick={()=>void prepare('cash')}>Xem lại tiền mặt</button>{draft&&!mode&&<button className="secondary" disabled={busy} onClick={()=>void recover()}>Kiểm tra lần ghi tiền</button>}</div>}
 </>}
 {mode&&preview&&<div className="card stack"><h3>{mode==='close'?'Xác nhận đóng bàn':'Xác nhận tiền mặt'}</h3><p>{preview.table_label} · {mode==='cash'&&draft?money(draft.amount):money(preview.charge_vnd)}</p>{mode==='close'?<><p>Đây là ước tính. Tiền giờ tiếp tục tính đến khi đóng thành công. Bàn được trả lại ngay cả khi còn thiếu tiền.</p>{!own&&<label>Lý do đóng bàn<input value={closeReason} maxLength={500} onChange={e=>setCloseReason(e.target.value)}/></label>}</>:<p>{draft?.reason}. Ghi tiền không đóng bàn và không dừng tính giờ.</p>}<div className="row"><button disabled={busy} onClick={()=>void confirm()}>{mode==='close'?'Xác nhận đóng bàn':'Xác nhận ghi tiền'}</button><button className="secondary" disabled={busy} onClick={()=>{setMode(null);setPreview(null);if(mode==='cash'&&!draft?.submitted)keepDraft(null);}}>Quay lại</button></div></div>}
 {receipt&&<p data-testid="cash-receipt">Đã ghi nhận {money(receipt.amount_vnd)} · Mã nhận tiền: <span className="reference">{receipt.id}</span></p>}
 <p>Chuyển khoản trực tuyến chưa được tích hợp. Không có thao tác hoàn tiền hoặc xóa nợ trong phiên bản này.</p>
 </div>;
}
