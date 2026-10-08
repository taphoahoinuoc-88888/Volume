import {useAccess,logout} from '@volume/shared';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
import TablesPage from './features/tables/TablesPage';
import TableSessionPage from './features/tables/TableSessionPage';
export default function App(){const{access,loading,message}=useAccess();if(window.location.pathname==='/recovery')return <AuthPage/>;if(loading)return <main className="page"><p role="status">Đang mở tài khoản…</p></main>;if(!access&&window.location.pathname==='/tables')return <main className="page"><TablesPage signedIn={false}/></main>;if(!access)return <AuthPage notice={message}/>;
 return <><header className="topbar"><a className="brand" href="/">VOLUME</a><nav className="nav"><a href="/profile">Tài khoản</a><a href="/tables">Chọn bàn</a></nav><button className="secondary" onClick={()=>void logout()}>Đăng xuất</button></header><main className="page">{window.location.pathname==='/tables'?<TablesPage signedIn/>:window.location.pathname==='/table-session'?<TableSessionPage/>:<><ProfilePage access={access}/><button className="secondary" onClick={()=>void navigator.clipboard.writeText(access.profile.id)}>Sao chép mã tài khoản</button></>}</main></>;
}
