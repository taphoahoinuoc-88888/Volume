import {useState} from 'react';
import {errorMessage} from '@volume/shared';
import {Dialog,DialogPortal,DialogOverlay,DialogContent,DialogTitle,DialogDescription} from './ui/dialog';
import {Button} from './ui/button';
import {Table} from './ui/table';
export interface Diff {label:string;before:string;after:string}
export default function ConfirmChange({diff,onConfirm,onClose}:{diff:Diff[];onConfirm:(reason:string)=>Promise<void>;onClose:()=>void}){
 const[reason,setReason]=useState('');const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');
 async function confirm(e:React.FormEvent){e.preventDefault();if(busy||!reason.trim())return;setBusy(true);try{await onConfirm(reason.trim());onClose();}catch(e){setMessage(errorMessage(e));}finally{setBusy(false);}}
 return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}><DialogPortal><DialogOverlay className="overlay"/><DialogContent className="dialog"><DialogTitle>Xác nhận thay đổi</DialogTitle><DialogDescription>Kiểm tra trước và sau. Thay đổi quyền sẽ yêu cầu người đó đăng nhập lại.</DialogDescription>
 <Table><thead><tr><th>Nội dung</th><th>Hiện tại</th><th>Sau thay đổi</th></tr></thead><tbody>{diff.map((d,i)=><tr key={i}><td>{d.label}</td><td>{d.before}</td><td>{d.after}</td></tr>)}</tbody></Table><form onSubmit={confirm}><label>Lý do<textarea required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label><p role="alert">{message}</p><div className="row"><Button type="button" className="secondary" disabled={busy} onClick={onClose}>Đóng</Button><Button disabled={busy||!reason.trim()}>{busy?'Đang lưu…':'Xác nhận lưu'}</Button></div></form></DialogContent></DialogPortal></Dialog>;
}
