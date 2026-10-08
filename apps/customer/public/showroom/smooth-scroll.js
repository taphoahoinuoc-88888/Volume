(()=>{'use strict';
 if(!window.Lenis||matchMedia('(prefers-reduced-motion:reduce)').matches||matchMedia('(hover:none),(pointer:coarse)').matches)return;
 const lenis=new Lenis({autoRaf:true,lerp:.12,smoothWheel:true,syncTouch:false,anchors:false,
 prevent:node=>node.matches?.('.product-rail,.modal,.mobile-nav,[data-lenis-prevent]')||document.body.classList.contains('body-lock')});
 window.volumeScroll=lenis;
})();
