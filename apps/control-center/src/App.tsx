import {useEffect,useState} from 'react';
import {Refine} from '@refinedev/core';
import {useQueryClient} from '@tanstack/react-query';
import {useAccess,can,nav,logout,rpc,type Access} from '@volume/shared';
import {authProvider} from './providers/auth-provider';
import {dataProvider} from './providers/data-provider';
import {accessControlProvider} from './providers/access-control-provider';
import Shell from './components/Shell';
import AuthPage from './features/auth/AuthPage';
import Overview from './features/overview/AccessOverviewPage';
import Venues from './features/venues/VenuesPage';
import People from './features/people/PeoplePage';
import Audit from './features/audit/AuditPage';
import Tables from './features/tables/TablesPage';
import OpeningPayments from './features/payments/OpeningPaymentsPage';
function Surface(){const{access,loading,message}=useAccess();const cache=useQueryClient();useEffect(()=>{if(!access)cache.clear();},[access,cache]);
 if(window.location.pathname==='/recovery')return <AuthPage/>;if(loading)return <main className="page"><p role="status">Đang mở khu vực nhân sự…</p></main>;if(!access||window.location.pathname==='/login')return <AuthPage notice={message}/>;
 if(access.profile.role==='USER')return <main className="page stack"><h1>Đây là khu vực nhân sự</h1><p>Bạn có thể dùng tài khoản khách của mình.</p><a href={import.meta.env.VITE_CUSTOMER_URL||'http://127.0.0.1:3000'}>Mở tài khoản của bạn</a><button className="secondary" onClick={()=>void logout()}>Đăng xuất</button></main>;
 const path=window.location.pathname;if(path==='/tables'||path==='/opening-payments'){const selected=new URLSearchParams(window.location.search).get('venue')||(['MANAGER','STAFF'].includes(access.profile.role)?access.venues[0]?.id:undefined);return <Shell access={access}><OperationRoute access={access} venue={selected} payments={path==='/opening-payments'}/></Shell>;}const resource=path==='/'?'overview':nav.find(n=>n.path===path)?.resource||'unknown';const requested=new URLSearchParams(window.location.search).get('venue');const venue=requested||access.venues.find(v=>can(access,resource,'list',v.id))?.id;
 if(!can(access,resource,'list',requested||undefined))return <Shell access={access}><h1>Không có quyền truy cập</h1><p>Phần này không thuộc phạm vi của bạn.</p><a href="/overview">Trở lại tổng quan</a></Shell>;
 return <Shell access={access}>{resource==='overview'?<Overview access={access}/>:resource==='venues'?<Venues access={access}/>:resource==='people'?<People access={access} venue={venue}/>:<Audit access={access} venue={requested||(access.profile.role==='MANAGER'?venue:undefined)}/>}</Shell>;
}
export default function App(){return <Refine authProvider={authProvider} dataProvider={dataProvider} accessControlProvider={accessControlProvider} resources={[...nav.map(n=>({name:n.resource,list:n.path,meta:{label:n.label}})),{name:"tables",list:"/tables",meta:{label:"Bàn & phiên"}},{name:"opening-payments",list:"/opening-payments",meta:{label:"Thanh toán mở bàn"}}]} options={{disableTelemetry:true}}><Surface/></Refine>;}


function OperationRoute({access,venue,payments}:{access:Access;venue?:string;payments:boolean}){const[allowed,setAllowed]=useState<boolean|null>(null);useEffect(()=>{let live=true;void rpc<{permissions:string[]}> ('sprint2_access',{p_venue:venue||null}).then(p=>{if(live)setAllowed(p.permissions.includes(payments?'OPENING_PAYMENTS_READ':'TABLE_OPERATIONS_READ'));}).catch(()=>{if(live)setAllowed(false);});return()=>{live=false;};},[venue,payments]);if(allowed===null)return <p>Đang kiểm tra phạm vi…</p>;if(!allowed)return <><h1>Không có quyền truy cập</h1><p>Phần này không thuộc phạm vi của bạn.</p></>;return payments?<OpeningPayments access={access} venue={venue}/>:<Tables access={access} venue={venue}/>;}
