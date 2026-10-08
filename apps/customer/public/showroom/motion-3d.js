/* v4.4: cinematic WebGL enhancement for the original v4.1 scroll sequence. */
(()=>{'use strict';
const T=window.THREE;
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const touch=matchMedia('(hover:none),(pointer:coarse)').matches;
const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=t=>t*t*(3-2*t);
const colors=['#ebc942','#245baa','#bd332b','#613a89','#e8792c','#27785e','#84342f','#151a17','#e6c838'];
let frame=0,shotP=0,breakP=0,px=0,py=0,heroNow=0,uniNow=0,heroTarget=0,uniTarget=0,last=0;
const views={shot:null,break:null};
function requestDraw(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
window.VolumeMotion={shot(p){shotP=p;requestDraw();},break(p){breakP=p;requestDraw();},inspect(key){return views[key]?.inspect();}};
const createView=T?(()=>{
const canvasTexture=(paint,w=512,h=256)=>{const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;};
const felt=canvasTexture((c,w,h)=>{c.fillStyle='#255963';c.fillRect(0,0,w,h);let seed=1701;for(let i=0;i<50000;i++){seed=(seed*16807)%2147483647;const x=seed%w;seed=(seed*16807)%2147483647;const y=seed%h;c.fillStyle=i%2?'#ffffff0c':'#00000013';c.fillRect(x,y,1,1);}},512,512);felt.wrapS=felt.wrapT=T.RepeatWrapping;felt.repeat.set(5,3);
const ballMaps=new Map();
function ballTexture(n){if(ballMaps.has(n))return ballMaps.get(n);const t=canvasTexture((c,w,h)=>{c.fillStyle=n>8?'#eee9d5':colors[n-1]||'#eee9df';c.fillRect(0,0,w,h);if(n>8){c.fillStyle=colors[(n-1)%8];c.fillRect(0,h*.29,w,h*.42);}if(n){for(const x of [w*.25,w*.75]){c.fillStyle='#ffffeb';c.beginPath();c.ellipse(x,h/2,36,39,0,0,Math.PI*2);c.fill();c.fillStyle='#20261c';c.font='bold 44px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(n,x,h/2+2);}}});ballMaps.set(n,t);return t;}
function createView(id,interactive){
 const canvas=document.getElementById(id);if(!canvas)return null;
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',depth:true,stencil:false});}catch(e){return null;}
 let renderScale=touch?1.5:1.6;let qualityFrames=[],qualityWarmup=0,previousFrame=0,lastQualityChange=0,previousP=-1;
 renderer.setPixelRatio(Math.min(devicePixelRatio,renderScale));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
 renderer.shadowMap.enabled=!touch;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(), camera=new T.PerspectiveCamera(34,1,.1,100);
 scene.add(new T.HemisphereLight(0xf2f4ff,0x22232a,1.3));
 const light=new T.DirectionalLight(0xfffaf2,2.2);light.position.set(-3,9,4);light.castShadow=!touch;light.shadow.mapSize.set(touch?256:1024,touch?256:1024);Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7});light.shadow.bias=-.001;light.shadow.normalBias=.02;scene.add(light);
 const rim=new T.DirectionalLight(0xdde6ff,1.65);rim.position.set(5,4,-5);scene.add(rim);
 const acidGlow=new T.PointLight(0xc9ff38,.75,12,2);acidGlow.position.set(-4,2.5,-3);scene.add(acidGlow);
 // Locally constructed studio reflections, no remote texture request.
 const studio=new T.Scene();studio.background=new T.Color('#60626b');
 for(const [x,y,z,w,h] of [[-4,5,2,3,7],[4,3,-3,2,6],[0,7,0,8,3]]){
  const panel=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:0xffffff}));panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
 }
 const pmrem=new T.PMREMGenerator(renderer);const env=pmrem.fromScene(studio,.04);scene.environment=env.texture;pmrem.dispose();
 studio.children.forEach(o=>{o.geometry?.dispose();o.material?.dispose();});
 const table=new T.Group();scene.add(table);
 const mat=(color,roughness=.5,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const graphite=mat('#111318',.24,.76), edge=mat('#aeb3bc',.17,.92), cushion=mat('#224b55',.88), wood=mat('#202228',.36,.38);
 function box(w,h,d,x,y,z,m){
  let geometry;
  if(w>.2&&d>.12){
   const r=Math.min(.15,d*.1),s=new T.Shape();
   s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
   geometry=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:Math.min(.025,h/4),bevelSize:.02,bevelSegments:3,steps:1,curveSegments:16});geometry.rotateX(-Math.PI/2);geometry.translate(0,-h/2,0);
  }else geometry=new T.BoxGeometry(w,h,d);
  const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;table.add(mesh);return mesh;
 }

 box(8.28,.54,4.72,0,-.44,0,graphite);box(8.20,.055,4.65,0,-.135,0,edge);box(8.12,.24,4.58,0,0,0,wood);
 const bedMap=canvasTexture((c,w,h)=>{
 c.fillStyle='#245763';c.fillRect(0,0,w,h);let seed=17;
 for(let i=0;i<95000;i++){seed=seed*16807%2147483647;let x=seed%w;seed=seed*16807%2147483647;let y=seed%h;c.fillStyle=i%2?'#ffffff0a':'#0000000c';c.fillRect(x,y,1,1);}
 c.textAlign='center';c.textBaseline='middle';c.font='900 120px Arial';c.fillStyle='#24262b45';c.fillText('V O L U M E',w/2,h/2);c.font='22px Arial';c.fillStyle='#e7e9ed1f';c.fillText('S T A D I U M   B I L L I A R D S',w/2,h/2+83);
},2048,1024);
const bed=new T.Mesh(new T.PlaneGeometry(7.5,3.88),new T.MeshStandardMaterial({map:bedMap,roughness:.98}));bed.rotation.x=-Math.PI/2;bed.position.y=.186;bed.receiveShadow=true;table.add(bed);
 // Separate rails leave six clear pocket openings.
 for(const z of [-2.04,2.04])for(const x of [-1.9,1.9]){box(3.38,.19,.25,x,.23,z,cushion);box(3.38,.1,.20,x,.23,z+Math.sign(z)*.24,graphite);}
 for(const x of [-3.87,3.87])box(.23,.19,3.4,x,.23,0,cushion);
 for(const x of [-3.74,0,3.74])for(const z of [-1.94,1.94]){
   const pocket=new T.Mesh(new T.CylinderGeometry(.245,.20,.15,touch?32:40),mat('#020204',1));pocket.position.set(x,.12,z);table.add(pocket);
   const ring=new T.Mesh(new T.TorusGeometry(.238,.022,6,touch?32:40),mat('#0a0b0e',.75,.28));ring.rotation.x=Math.PI/2;ring.position.set(x,.195,z);table.add(ring);
 }
 // Flush corner castings stop before the opening; the pocket itself stays black.
 for(const sx of [-1,1])for(const sz of [-1,1]){
  const longCap=box(.38,.055,.12,sx*3.48,.225,sz*2.09,edge);longCap.rotation.y=-sx*sz*.12;
  const sideCap=box(.12,.055,.38,sx*3.91,.225,sz*1.68,edge);sideCap.rotation.y=sx*sz*.12;
 }
 for(const z of [-1.94,1.94])for(const x of [-.31,.31]){const jaw=box(.20,.07,.21,x,.205,z+Math.sign(z)*.05,edge);jaw.rotation.y=Math.sign(x*z)*.32;}
 // The reference's long V silhouette runs along the table's long axis.
 function beam(a,b,width,depth,material){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const mesh=box(width,delta.length(),depth,...start.clone().add(end).multiplyScalar(.5).toArray(),material);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return mesh;}
 for(const z of [-1.32,1.32]){
  for(const sign of [-1,1]){beam([0,-1.99,z],[sign*2.55,-.62,z],.40,.42,graphite);beam([0,-1.99,z+.23],[sign*2.55,-.62,z+.23],.055,.04,edge);}
 }
 box(3.35,.18,3.06,0,-2.16,0,graphite);box(3.39,.055,3.1,0,-2.26,0,edge);
 for(const z of [-2.23,2.23])for(const x of [-2.8,-1.8,-.85,.85,1.8,2.8]){const dot=new T.Mesh(new T.SphereGeometry(.025,8,6),mat('#dae0c9',.2,.5));dot.position.set(x,.286,z);dot.scale.y=.2;table.add(dot);}
 const brand=canvasTexture((c,w,h)=>{c.fillStyle='#d2d8bf';c.font='bold 72px Arial';c.textAlign='center';c.fillText('RASSON',w/2,h*.58);},1024,256);
 const label=new T.Mesh(new T.PlaneGeometry(1.65,.38),new T.MeshBasicMaterial({map:brand,transparent:true}));label.position.set(0,-.4,2.356);table.add(label);
 const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.25}));ground.rotation.x=-Math.PI/2;ground.position.y=-2.26;ground.receiveShadow=true;scene.add(ground);
 const sphere=new T.SphereGeometry(.135,touch?28:32,touch?20:24);
 const shadowMap=canvasTexture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#000000');g.addColorStop(.6,'#000000b0');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,w,h);},64,64);
 const contactShadowGeo=new T.CircleGeometry(.145,touch?24:32),contactShadowMat=new T.MeshBasicMaterial({color:0x000000,map:shadowMap,transparent:true,opacity:.32,depthWrite:false});
 function ball(n,x,z){
  const Material=T.MeshPhysicalMaterial;
  const material=new Material({map:ballTexture(n),roughness:.11,metalness:.01,envMapIntensity:1.9,clearcoat:.85,clearcoatRoughness:.09});
  const b=new T.Mesh(sphere,material);b.position.set(x,.323,z);b.rotation.y=.4;b.castShadow=!touch;table.add(b);
  const shadow=new T.Mesh(contactShadowGeo,contactShadowMat.clone());shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.194,z);shadow.renderOrder=2;table.add(shadow);b.userData.shadow=shadow;
  return b;
 }
 const white=ball(0,-2,1),nine=ball(9,1.2,-.6);
 const rack=[];let count=0;
 for(let row=0;row<5;row++)for(let j=0;j<=row;j++){
  const n=[1,2,3,4,8,5,6,7,9,10,11,12,13,14,15][count++];
  const ballMesh=ball(n,.65+row*Math.sqrt(3)*.135*1.003,(j-row/2)*.270*1.003);
  ballMesh.userData.initial=ballMesh.position.clone();rack.push(ballMesh);
 }
 const allBalls=[white,nine,...rack];
 const grain=canvasTexture((c,w,h)=>{c.fillStyle='#dbc28b';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=3){c.strokeStyle=y%2?'#a5794220':'#f7e6bc25';c.lineWidth=.6;c.beginPath();c.moveTo(0,y);for(let x=0;x<=w;x+=16)c.lineTo(x,y+Math.sin(x*.045+y)*1.2);c.stroke();}},512,128);
 const cueWood=new T.MeshStandardMaterial({map:grain,roughness:.3,envMapIntensity:.7});
 const cue=new T.Group();const cueSides=touch?16:18;const shaft=new T.Mesh(new T.CylinderGeometry(.018,.052,3.4,cueSides),cueWood);shaft.rotation.z=-Math.PI/2;cue.add(shaft);const butt=new T.Mesh(new T.CylinderGeometry(.052,.062,1.4,cueSides),graphite);butt.rotation.z=-Math.PI/2;butt.position.x=-2.4;cue.add(butt);const ferrule=new T.Mesh(new T.CylinderGeometry(.023,.024,.075,cueSides),mat('#eee9dd',.3));ferrule.rotation.z=-Math.PI/2;ferrule.position.x=1.70;cue.add(ferrule);const tip=new T.Mesh(new T.CylinderGeometry(.024,.024,.045,cueSides),mat('#2e6d79',.7));tip.rotation.z=-Math.PI/2;tip.position.x=1.76;cue.add(tip);table.add(cue);
 const objectStart=new T.Vector3(1.12,.323,-.56),targetPocket=new T.Vector3(3.74,.323,-1.94);
 const direction=targetPocket.clone().sub(objectStart).normalize();
 const whiteStart=objectStart.clone().addScaledVector(direction,-3.1),contactPoint=objectStart.clone().addScaledVector(direction,-.27);
 const guides=new T.Group();table.add(guides);
 function guide(from,to,color){
   const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(from.x,.20,from.z),new T.Vector3(to.x,.20,to.z)]),new T.LineDashedMaterial({color,dashSize:.10,gapSize:.065,transparent:true,opacity:.5}));
   line.computeLineDistances();guides.add(line);return line;
 }
 guide(whiteStart,contactPoint,0xeaf2e8);guide(objectStart,targetPocket,0xc9ff38);
 const contactRing=new T.Mesh(new T.RingGeometry(.13,.145,48),new T.MeshBasicMaterial({color:0xc9ff38,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}));
 contactRing.rotation.x=-Math.PI/2;contactRing.position.set(contactPoint.x,.205,contactPoint.z);guides.add(contactRing);
 const impact=new T.Mesh(new T.RingGeometry(.17,.185,48),new T.MeshBasicMaterial({color:0xecffc9,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));
 impact.rotation.x=-Math.PI/2;impact.position.set(objectStart.x,.208,objectStart.z);table.add(impact);
 const breakWave=new T.Mesh(new T.RingGeometry(.22,.235,touch?32:64),new T.MeshBasicMaterial({color:0xc9ff38,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));
 breakWave.rotation.x=-Math.PI/2;breakWave.position.set(.65,.205,0);table.add(breakWave);
 const breakFlash=new T.PointLight(0xeaffb6,0,5,2);breakFlash.position.set(.65,1,0);table.add(breakFlash);
 let visible=true,width=1,height=1;
 function resize(){const r=canvas.parentElement.getBoundingClientRect();width=r.width;height=r.height;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 new ResizeObserver(()=>{resize();requestDraw();}).observe(canvas.parentElement);resize();
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestDraw();},{rootMargin:'80px'}).observe(canvas.parentElement);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvas.parentElement.classList.remove('webgl-ready');});
 canvas.addEventListener('webglcontextrestored',()=>requestDraw());

 function draw(p,mode,px,py){if(!visible||document.hidden)return;
  const mobile=width<550;
 const breaking=interactive&&mode==='break';
  let pocketedCount=0;
  table.rotation.y=reduced||touch?0:px*.025;
  const angle=(interactive==='break'? .09 : -.08)+(reduced||touch?0:px*.025);
  const hit=breaking?Math.exp(-Math.pow((p-.415)/.035,2)):0;
  camera.position.set(Math.sin(angle)*12,10.15-hit*.22,Math.cos(angle)*(10.15-hit*.32));
  const aspect=width/height;
  camera.fov=Math.max(32,2*Math.atan(Math.tan(40*Math.PI/360)/aspect)*180/Math.PI);
  camera.lookAt(0,-.1,0);
  camera.aspect=width/height;camera.updateProjectionMatrix();
  guides.visible=!breaking;impact.visible=!breaking;const flash=clamp(1-Math.abs(p-.66)/.05);impact.material.opacity=flash*.85;impact.scale.setScalar(1+(1-flash)*2.5);contactRing.material.opacity=p<.66?.45:.12;rack.forEach(b=>b.visible=breaking||!interactive);nine.visible=!breaking;white.visible=true;
  const wave=breaking?clamp((p-.405)/.09):0;breakWave.visible=breaking;breakWave.material.opacity=(1-wave)*.75;breakWave.scale.setScalar(.6+wave*5);breakFlash.intensity=breaking*(1-wave)*3.2;
  if(!interactive){white.position.set(-2,.323,.8);nine.visible=false;rack.forEach((b,i)=>b.position.copy(b.userData.initial));cue.visible=false;}
  else if(!breaking){
    const end=targetPocket,obj=objectStart,dir=direction,start=whiteStart,contact=contactPoint;
    const wt=clamp((p-.425)/.235);white.position.copy(start).lerp(contact,1.18*wt-.18*wt*wt);
    const ot=clamp((p-.66)/.27);nine.position.copy(obj).lerp(end,1.7*ot-.7*ot*ot);nine.position.y=.323-ease(clamp((p-.93)/.07))*.52;nine.scale.setScalar(1-clamp((p-.94)/.06)*.45);nine.visible=p<.997;
    const whiteDistance=white.position.distanceTo(start),nineDistance=Math.hypot(nine.position.x-obj.x,nine.position.z-obj.z);white.rotation.set(dir.z*whiteDistance/.135,.4,-dir.x*whiteDistance/.135);nine.rotation.set(dir.z*nineDistance/.135,.4,-dir.x*nineDistance/.135);
    const pull=p<.34?ease(clamp(p/.28))*.65:(1-ease(clamp((p-.34)/.085)))*.65;
    const tipPos=start.clone().addScaledVector(dir,-.135-pull);cue.position.copy(tipPos).addScaledVector(dir,-1.7825);cue.position.y=.323;cue.rotation.y=-Math.atan2(dir.z,dir.x);cue.visible=p<.48;
  } else {
    const time=clamp((p-.415)/.535)*VolumePhysics.duration;
    const states=VolumePhysics.sample(time);
    pocketedCount=states.filter(s=>s.sink>.02).length;
    rack.forEach((b,i)=>{const s=states[i+1];b.position.set(s.x,.323+s.h,s.z);b.rotation.set(s.rx,.4,s.rz);b.visible=s.sink<.98;b.scale.setScalar(1-s.sink*.35);});
    if(p<.415){const travel=ease(clamp((p-.30)/.115));white.position.set(-2.4+travel*2.78,.323,.014*travel);white.rotation.set(0,.4,-travel*2.78/.135);}
    else {const s=states[0];white.position.set(s.x,.323+s.h,s.z);white.rotation.set(s.rx,.4,s.rz-2.78/.135);white.visible=s.sink<.98;}

    cue.position.set(-4.3175-(p<.24?ease(p/.24)*.55:(1-ease(clamp((p-.24)/.06)))*.55),.323,0);cue.rotation.y=0;cue.visible=p<.37;
  }
  allBalls.forEach(b=>{const s=b.userData.shadow;if(!s)return;s.position.set(b.position.x,.194,b.position.z);s.visible=b.visible&&b.position.y>.17;s.material.opacity=clamp(.25-(b.position.y-.323)*.7,0,.25)*b.scale.x;});
  acidGlow.position.x=-4+p*8;
  const now=performance.now(),gap=now-previousFrame;
  if(touch&&previousP!==p&&gap>0&&gap<1000){if(++qualityWarmup>20)qualityFrames.push(gap);if(qualityFrames.length>=40&&now-lastQualityChange>4000){const sorted=qualityFrames.slice().sort((a,b)=>a-b);if(sorted[20]>28&&renderScale>1.25){renderScale=renderScale>1.36?1.35:1.25;renderer.setPixelRatio(Math.min(devicePixelRatio,renderScale));renderer.setSize(width,height,false);lastQualityChange=now;}qualityFrames=[];}}
  else if(gap>=1000){qualityFrames=[];qualityWarmup=0;}
  previousFrame=now;previousP=p;
  canvas.dataset.dpr=String(Math.min(devicePixelRatio,renderScale));canvas.dataset.antialias=String(renderer.getContext().getContextAttributes().antialias);
  renderer.render(scene,camera);canvas.parentElement.classList.add('webgl-ready');canvas.dataset.progress=p.toFixed(4);canvas.dataset.mode=mode;canvas.dataset.quality=isiOS?'ios':touch?'mobile':'desktop';canvas.dataset.pocketed=String(pocketedCount);
 }
 return {draw,inspect:()=>({white:white.position.toArray(),nine:nine.position.toArray(),cueTip:cue.localToWorld(new T.Vector3(1.7825,0,0)).toArray(),cueVisible:cue.visible,rack:rack.map(b=>({position:b.position.toArray(),visible:b.visible})),dpr:renderer.getPixelRatio(),antialias:renderer.getContext().getContextAttributes().antialias,memory:renderer.info.memory,progress:previousP})};
}


return createView;
})():()=>null;
const hero=document.querySelector('.hero'),universe=document.querySelector('.universe');
const worlds=[...document.querySelectorAll('.world-scene')];
function targets(){
 for(const [el,key]of [[hero,'hero'],[universe,'universe']]){
  if(!el)continue;const r=el.getBoundingClientRect(),p=clamp(-r.top/Math.max(1,r.height-innerHeight));
  if(key==='hero')heroTarget=p;else uniTarget=p;
 }requestDraw();
}
function draw(now){
 frame=0;const dt=Math.min(50,now-(last||now-16));last=now;
 const a=reduced?1:1-Math.exp(-dt/75);
 heroNow+=(heroTarget-heroNow)*a;uniNow+=(uniTarget-uniNow)*a;
 if(Math.abs(heroNow-heroTarget)<.0003)heroNow=heroTarget;
 if(Math.abs(uniNow-uniTarget)<.0003)uniNow=uniTarget;
 hero?.style.setProperty('--hero-p',heroNow.toFixed(5));
 // Keep all four chapters; crossfade/translate through the final fifth of each chapter.
 const sequence=Math.min(3,uniNow*4),chapter=Math.floor(sequence),fraction=sequence-chapter;
 const mix=chapter<3?ease(clamp((fraction-.64)/.36)):0;
 worlds.forEach((s,i)=>{
  const outgoing=i===chapter,incoming=i===chapter+1;
  const opacity=outgoing?1-mix:incoming?mix:0;
  s.style.opacity=opacity.toFixed(4);
  s.style.transform=outgoing?`perspective(1400px) translate3d(0,${-mix*42}px,${-mix*90}px) rotateX(${mix*2}deg)`:`perspective(1400px) translate3d(0,${(1-mix)*52}px,${-(1-mix)*130}px) rotateX(${-(1-mix)*2}deg)`;
  s.style.pointerEvents=opacity>.5?'auto':'none';s.classList.toggle('active',opacity>.5);
  s.setAttribute('aria-hidden',String(opacity<.5));
  const photo=s.querySelector('.world-art>picture img');
  if(photo&&!reduced)photo.style.transform=`scale(1.065) translate3d(${px*-7}px,${(fraction-.5)*-13}px,0)`;
 });
 document.getElementById('universeProgress')?.style.setProperty('width',`${uniNow*100}%`);
 const active=mix>.5?Math.min(3,chapter+1):chapter;
 document.querySelectorAll('.universe-tabs span').forEach((s,i)=>s.classList.toggle('active',i===active));
 views.shot?.draw(shotP,'single',px,py);views.break?.draw(breakP,'break',px,py);
 if(heroNow!==heroTarget||uniNow!==uniTarget)requestDraw();else last=0;
}
if(T){
 const lazy=new IntersectionObserver(entries=>{for(const e of entries){
  if(!e.isIntersecting)continue;const key=e.target.id==='shotCanvas'?'shot':'break';
  if(!views[key]){try{views[key]=createView(e.target.id,key);}catch(err){e.target.parentElement.classList.add('webgl-unavailable');}}
  lazy.unobserve(e.target);requestDraw();
 }},{rootMargin:'220px'});
 for(const id of ['shotCanvas','breakCanvas']){const c=document.getElementById(id);if(c)lazy.observe(c);}
}
addEventListener('scroll',targets,{passive:true});addEventListener('resize',targets,{passive:true});
if(!reduced)addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5;requestDraw();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0;}else requestDraw();});
targets();
})();
