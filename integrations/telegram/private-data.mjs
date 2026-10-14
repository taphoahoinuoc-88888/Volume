// Server-only transport: no browser import, no Auth token storage or user-id proxy.
import pg from 'pg';
import {BotError} from './bot.mjs';
export function privateData(connectionString,Pool=pg.Pool){
 let u;try{u=new URL(connectionString);}catch{throw new BotError('PRIVATE_BACKEND_CONFIG');}
 if(u.protocol!=='postgresql:'||u.hostname!=='127.0.0.1'||u.pathname!=='/postgres')throw new BotError('PRIVATE_BACKEND_CONFIG');
 const pool=new Pool({connectionString,max:2,connectionTimeoutMillis:5000});
 async function call(kind,values){const c=await pool.connect();try{await c.query('begin');await c.query('set local role volume_telegram_transport');const r=await c.query(kind==='redeem'?'select private.telegram_redeem($1,$2,$3) result':'select private.telegram_read($1,$2) result',values);await c.query('commit');return r.rows[0].result;}catch{await c.query('rollback').catch(()=>{});throw new BotError('PRIVATE_ACCESS_UNAVAILABLE');}finally{c.release();}}
 return {read:(telegram,domain)=>call('read',[telegram,domain]),redeem:(proof,telegram,name)=>call('redeem',[proof,telegram,name]),close:()=>pool.end()};
}
