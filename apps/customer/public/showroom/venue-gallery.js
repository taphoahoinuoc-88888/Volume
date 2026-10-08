/* Progressive enhancement: photos and native swipe work without JavaScript. */
(() => {
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.querySelectorAll('[data-gallery]').forEach(gallery=>{
  const rail=gallery.querySelector('.venue-rail'),slides=[...rail.children],prev=gallery.querySelector('[data-gallery-prev]'),next=gallery.querySelector('[data-gallery-next]'),count=gallery.querySelector('[data-gallery-count]');let current=0;
  const sync=()=>{let nearest=0,distance=Infinity;const left=rail.getBoundingClientRect().left;slides.forEach((slide,i)=>{const d=Math.abs(slide.getBoundingClientRect().left-left);if(d<distance){distance=d;nearest=i;}});if(rail.scrollLeft >= rail.scrollWidth-rail.clientWidth-2)nearest=slides.length-1;if(current!==nearest)current=nearest;count.textContent=`${current+1} / ${slides.length}`;prev.disabled=current===0;next.disabled=current===slides.length-1;};
  const go=delta=>{sync();const target=slides[Math.max(0,Math.min(slides.length-1,current+delta))];rail.scrollTo({left:rail.scrollLeft+target.getBoundingClientRect().left-rail.getBoundingClientRect().left,behavior:reduced()?'auto':'smooth'});};
  prev.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();go(e.key==='ArrowRight'?1:-1);}});
  // Observe settled visibility; no per-frame updates or continuous animation.
  const observer=new IntersectionObserver(sync,{root:rail,threshold:[.5,.9]});slides.forEach(s=>observer.observe(s));rail.addEventListener('scrollend',sync,{passive:true});sync();
 });
})();
