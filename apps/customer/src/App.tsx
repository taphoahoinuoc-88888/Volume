import {useAccess,logout} from '@volume/shared';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
export default function App(){const{access,loading,message}=useAccess();if(window.location.pathname==='/recovery')return <AuthPage/>;if(loading)return <main className="page"><p role="status">Đang mở tài khoản…</p></main>;if(!access)return <AuthPage notice={message}/>;
 return <><header className="topbar"><a className="brand" href="/profile">VOLUME</a><button className="secondary" onClick={()=>void logout()}>Đăng xuất</button></header><main className="page"><ProfilePage access={access}/></main></>;
}
