import {useEffect} from 'react';
import {Refine} from '@refinedev/core';
import {useQueryClient} from '@tanstack/react-query';
import {useAccess,can,nav,logout} from '@volume/shared';
import {authProvider} from './providers/auth-provider';
import {dataProvider} from './providers/data-provider';
import {accessControlProvider} from './providers/access-control-provider';
import Shell from './components/Shell';
import AuthPage from './features/auth/AuthPage';
import Overview from './features/overview/AccessOverviewPage';
import Venues from './features/venues/VenuesPage';
import People from './features/people/PeoplePage';
import Audit from './features/audit/AuditPage';
function Surface(){const{access,loading,message}=useAccess();const cache=useQueryClient();useEffect(()=>{if(!access)cache.clear();},[access,cache]);
 if(window.location.pathname==='/recovery')return <AuthPage/>;if(loading)return <main className="page"><p role="status">Đang mở khu vực nhân sự…</p></main>;if(!access)return <AuthPage notice={message}/>;
 if(access.profile.role==='USER')return <main className="page stack"><h1>Đây là khu vực nhân sự</h1><p>Bạn có thể dùng tài khoản khách của mình.</p><a href={import.meta.env.VITE_CUSTOMER_URL||'http://127.0.0.1:3000'}>Mở tài khoản của bạn</a><button className="secondary" onClick={()=>void logout()}>Đăng xuất</button></main>;
 const path=window.location.pathname;const resource=path==='/'?'overview':nav.find(n=>n.path===path)?.resource||'unknown';const requested=new URLSearchParams(window.location.search).get('venue');const venue=requested||access.venues.find(v=>can(access,resource,'list',v.id))?.id;
 if(!can(access,resource,'list',requested||undefined))return <Shell access={access}><h1>Không có quyền truy cập</h1><p>Phần này không thuộc phạm vi của bạn.</p><a href="/overview">Trở lại tổng quan</a></Shell>;
 return <Shell access={access}>{resource==='overview'?<Overview access={access}/>:resource==='venues'?<Venues access={access}/>:resource==='people'?<People access={access} venue={venue}/>:<Audit access={access} venue={requested||(access.profile.role==='MANAGER'?venue:undefined)}/>}</Shell>;
}
export default function App(){return <Refine authProvider={authProvider} dataProvider={dataProvider} accessControlProvider={accessControlProvider} resources={nav.map(n=>({name:n.resource,list:n.path,meta:{label:n.label}}))} options={{disableTelemetry:true}}><Surface/></Refine>;}

