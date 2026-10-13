import ShopPage from './features/product/ShopPage';
import OrdersPage from './features/product/OrdersPage';
import PlayerPage from './features/product/PlayerPage';
import FeedbackPage from './features/product/FeedbackPage';
import TelegramPage from './features/product/TelegramPage';
import {useAccess,logout} from '@volume/shared';
import AuthPage from './features/auth/AuthPage';
import ProfilePage from './features/profile/ProfilePage';
import TablesPage from './features/tables/TablesPage';
import TableSessionPage from './features/tables/TableSessionPage';
export default function App(){const{access,loading,message}=useAccess();if(window.location.pathname==='/recovery')return <AuthPage/>;if(loading)return <main className="page"><p role="status">Đang mở tài khoản…</p></main>;if(window.location.pathname==='/login')return <AuthPage notice={message}/>;if(!access&&window.location.pathname==='/shop')return <main className="page"><a href="/showroom.html">VOLUME</a><ShopPage signedIn={false}/></main>;if(!access&&window.location.pathname==='/tables')return <main className="page"><TablesPage signedIn={false}/></main>;if(!access)return <AuthPage notice={message}/>;
 return <><header className="topbar"><a className="brand" href="/">VOLUME</a><nav className="nav"><a href="/profile">Tài khoản</a><a href="/tables">Chọn bàn</a><a href="/shop">Cửa hàng</a><a href="/orders">Đơn hàng</a><a href="/player">Cơ thủ</a><a href="/feedback">Hỗ trợ</a><a href="/telegram">Telegram</a></nav><button className="secondary" onClick={()=>void logout()}>Đăng xuất</button></header><main className="page">{window.location.pathname==='/shop'?<ShopPage signedIn/>:window.location.pathname==='/orders'?<OrdersPage/>:window.location.pathname==='/player'?<PlayerPage/>:window.location.pathname==='/feedback'?<FeedbackPage/>:window.location.pathname==='/telegram'?<TelegramPage/>:window.location.pathname==='/tables'?<TablesPage signedIn/>:window.location.pathname==='/table-session'?<TableSessionPage/>:<><ProfilePage access={access}/><button className="secondary" onClick={()=>void navigator.clipboard.writeText(access.profile.id)}>Sao chép mã tài khoản</button></>}</main></>;
}
