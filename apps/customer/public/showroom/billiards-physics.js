/* Volume v4.4 — deterministic 2D pool physics for reversible scroll playback.
   The simulation is calculated once, sampled at 60 Hz and never runs inside
   the scroll/render loop. Pocket mouths, jaws, gravity capture and a subtle
   impact hop are included so a ball cannot bounce back out after crossing a lip. */
(function(root){'use strict';
const R=.135,DT=1/240,DURATION=7.2,STRIDE=4;
const X=3.75,Z=1.94;
const pockets=[
 {x:-X,z:-Z,corner:1},{x:0,z:-Z,corner:0},{x:X,z:-Z,corner:1},
 {x:-X,z: Z,corner:1},{x:0,z: Z,corner:0},{x:X,z: Z,corner:1}
];
const speed=(b)=>Math.hypot(b.vx,b.vz);
const mouth=(b,p)=>p.corner
 ? Math.abs(b.x)>X-.30&&Math.abs(b.z)>Z-.30
 : Math.abs(b.x)<.30&&Math.abs(b.z)>Z-.25;

function simulate(){
 const make=(x,z,vx=0,vz=0)=>({x,z,vx,vz,rx:0,rz:0,sink:0,h:0,hv:0,pocket:-1});
 const balls=[make(.38,.014,15.5,0)];
 for(let row=0;row<5;row++)for(let j=0;j<=row;j++)
  balls.push(make(.65+row*Math.sqrt(3)*R*1.003,(j-row/2)*2*R*1.003));
 const frames=[];
 const save=()=>frames.push(balls.map(({x,z,vx,vz,rx,rz,sink,h,pocket})=>({x,z,vx,vz,rx,rz,sink,h,pocket})));
 save();

 for(let tick=1;tick<=Math.ceil(DURATION/DT);tick++){
  for(const b of balls){
   if(b.sink){
    const p=pockets[b.pocket];
    b.sink=Math.min(1,b.sink+DT*2.65);
    const settle=1-Math.exp(-DT*12);
    b.x+=(p.x-b.x)*settle;b.z+=(p.z-b.z)*settle;
    b.h=Math.max(-.56,-.66*b.sink*b.sink);b.vx=b.vz=0;
    continue;
   }

   const dx=b.vx*DT,dz=b.vz*DT;b.x+=dx;b.z+=dz;b.rx+=dz/R;b.rz-=dx/R;
   b.h+=b.hv*DT;b.hv-=7.8*DT;
   if(b.h<=0){b.h=0;b.hv=Math.abs(b.hv)>.18?-b.hv*.18:0;}

   // A shallow funnel represents slate cut + gravity near each pocket.
   let captured=false;
   for(let i=0;i<pockets.length;i++){
    const p=pockets[i],vx=p.x-b.x,vz=p.z-b.z,d=Math.hypot(vx,vz);
    const toward=b.vx*vx+b.vz*vz;
    const lip=p.corner?.37:.31,drop=p.corner?.255:.225;
    if(d<drop||(mouth(b,p)&&d<lip&&toward>-.05)){
     b.pocket=i;b.sink=.001;b.vx=b.vz=0;captured=true;break;
    }
    if(mouth(b,p)&&d<lip+.13&&toward>0){
     const pull=(lip+.13-d)*15;b.vx+=vx/d*pull*DT;b.vz+=vz/d*pull*DT;
    }
   }
   if(captured)continue;

   // Cushions have real openings. Once the centre enters a mouth, only the
   // jaw/funnel acts; the straight rail must not kick the ball back out.
   const inCornerMouth=Math.abs(b.x)>X-.34&&Math.abs(b.z)>Z-.34;
   const inSideMouth=Math.abs(b.x)<.29&&Math.abs(b.z)>Z-.28;
   if(Math.abs(b.x)>X-R&&!inCornerMouth){
    b.x=Math.sign(b.x)*(X-R);b.vx=-Math.sign(b.x)*Math.abs(b.vx)*.79;b.hv=Math.max(b.hv,.012*Math.abs(b.vx));
   }
   if(Math.abs(b.z)>Z-R&&!inCornerMouth&&!inSideMouth){
    b.z=Math.sign(b.z)*(Z-R);b.vz=-Math.sign(b.z)*Math.abs(b.vz)*.79;b.hv=Math.max(b.hv,.012*Math.abs(b.vz));
   }

   const s=speed(b),next=Math.max(0,s-.34*DT),f=s?next/s:0;b.vx*=f;b.vz*=f;
  }

  // Equal-mass impulses. Repeated passes propagate energy through a tight rack.
  for(let pass=0;pass<4;pass++)for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
   const a=balls[i],b=balls[j];if(a.sink||b.sink)continue;
   const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=2*R||d<1e-9)continue;
   const nx=dx/d,nz=dz/d,correction=(2*R-d)/2+1e-7;
   a.x-=nx*correction;a.z-=nz*correction;b.x+=nx*correction;b.z+=nz*correction;
   const closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
   if(closing>0){
    const impulse=closing*.965;
    a.vx-=impulse*nx;a.vz-=impulse*nz;b.vx+=impulse*nx;b.vz+=impulse*nz;
    const hop=Math.min(.32,impulse*.021);a.hv=Math.max(a.hv,hop*.72);b.hv=Math.max(b.hv,hop);
   }
  }
  if(tick%STRIDE===0)save();
 }
 return frames;
}

const frames=simulate(),sampleCache=Array.from({length:16},()=>({pocket:-1,x:0,z:0,rx:0,rz:0,sink:0,h:0}));
function sample(t){
 const f=Math.max(0,Math.min(frames.length-1,t/DURATION*(frames.length-1)));
 const i=Math.floor(f),mix=f-i,a=frames[i],b=frames[Math.min(i+1,frames.length-1)];
 for(let j=0;j<a.length;j++){const v=a[j],out=sampleCache[j];out.pocket=mix<.5?v.pocket:b[j].pocket;for(const k of ['x','z','rx','rz','sink','h'])out[k]=v[k]+(b[j][k]-v[k])*mix;}
 return sampleCache;
}
root.VolumePhysics={sample,duration:DURATION,radius:R,frames,pockets};
})(typeof window==='undefined'?globalThis:window);
