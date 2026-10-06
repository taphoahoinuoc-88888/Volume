import {useCan,useLogout} from '@refinedev/core';
import {nav,can,roleLabels,type Access} from '@volume/shared';
import type {ReactNode} from 'react';
function NavItem({item}:{item:typeof nav[number]}){const {data}=useCan({resource:item.resource,action:'list'});return data?.can?<a href={item.path} aria-current={window.location.pathname===item.path?'page':undefined}>{item.label}</a>:null;}
export default function Shell({access,children}:{access:Access;children:ReactNode}){const signOut=useLogout();return <><header className="topbar"><a href="/overview" className="brand">VOLUME</a><small>{access.profile.display_name} · {roleLabels[access.profile.role]}</small><button className="secondary" onClick={()=>signOut.mutate()}>Đăng xuất</button><nav className="nav" aria-label="Điều hướng nhân sự">{nav.filter(n=>can(access,n.resource)).map(item=><NavItem key={item.resource} item={item}/>)}</nav></header><main className="page">{children}</main></>;}
