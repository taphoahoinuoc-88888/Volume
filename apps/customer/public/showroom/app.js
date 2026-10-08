(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;

  // Cinematic intro: short, skippable, never blocks the site for long.
  const loader = $('#cinematicLoader');
  const loaderBar = $('#loaderBar');
  const loaderPct = $('#loaderPct');
  let introDone = false;
  const endIntro = () => {
    if (introDone || !loader) return;
    introDone = true;
    if (loaderBar) loaderBar.style.width = '100%';
    if (loaderPct) loaderPct.textContent = '100';
    setTimeout(() => loader.classList.add('hide'), 100);
    setTimeout(() => loader.remove(), 850);
  };
  if (loader && !reduceMotion) {
    const start = performance.now();
    const draw = now => {
      const p = clamp((now - start) / 1350);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * 100);
      if (loaderBar) loaderBar.style.width = `${val}%`;
      if (loaderPct) loaderPct.textContent = String(val).padStart(2, '0');
      if (p < 1 && !introDone) requestAnimationFrame(draw); else endIntro();
    };
    requestAnimationFrame(draw);
    $('#skipIntro')?.addEventListener('click', endIntro);
    addEventListener('load', () => setTimeout(endIntro, 250), { once: true });
    setTimeout(endIntro, 2000);
  } else endIntro();

  // Navigation.
  const menu = $('#mobileMenu');
  const menuBtn = $('#menuBtn');
  if(menu)menu.inert=true;
  const toggleMenu = force => {
    if (!menu || !menuBtn) return;
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menuBtn.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert=!open;
    document.body.classList.toggle('body-lock', open);
    if(window.volumeScroll) open ? window.volumeScroll.stop() : window.volumeScroll.start();
    if(open)menu.querySelector('button,a[href]')?.focus({preventScroll:true});
    else if(menu.contains(document.activeElement))menuBtn.focus({preventScroll:true});
  };
  addEventListener('keydown',e=>{
    if(e.key!=='Tab'||!menu?.classList.contains('open'))return;
    const items=[menuBtn,...$$('button,a[href]',menu)].filter(x=>x&&!x.disabled&&x.getClientRects().length);
    if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}
    else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}
  });
  menuBtn?.addEventListener('click', () => toggleMenu());
  $$('[data-scroll]').forEach(el => el.addEventListener('click', () => {
    toggleMenu(false);
    const target = $(el.dataset.scroll);
    if (target) { if(window.volumeScroll) window.volumeScroll.scrollTo(target,{offset:0}); else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
  }));

  // Desktop pointer depth + passive 8-ball follower.
  let pointerX = innerWidth / 2, pointerY = innerHeight / 2;
  let followerX = pointerX, followerY = pointerY;
  let pointerQueued = false, followActive = false;
  const pointerBall = $('#pointerBall');
  const followPointer = () => {
    followerX = lerp(followerX, pointerX, .18);
    followerY = lerp(followerY, pointerY, .18);
    if (pointerBall) pointerBall.style.transform = `translate3d(${followerX - 17}px,${followerY - 17}px,0)`;
    const moving = Math.abs(followerX-pointerX) + Math.abs(followerY-pointerY) > .6;
    if (moving) requestAnimationFrame(followPointer); else followActive = false;
  };
  if (finePointer && !reduceMotion) {
    addEventListener('pointermove', e => {
      pointerX = e.clientX; pointerY = e.clientY;
      if (!pointerQueued) {
        pointerQueued = true;
        requestAnimationFrame(() => {
          pointerQueued = false;
          root.style.setProperty('--px', ((pointerX / innerWidth) - .5).toFixed(3));
          root.style.setProperty('--py', ((pointerY / innerHeight) - .5).toFixed(3));
        });
      }
      pointerBall?.classList.add('show');
      if (!followActive) { followActive = true; requestAnimationFrame(followPointer); }
    }, { passive: true });
    addEventListener('mouseout', e => { if (!e.relatedTarget) pointerBall?.classList.remove('show'); });
  }

  // Magnetic buttons, deliberately tiny movement to avoid motion sickness.
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = `translate(${x * 8}px,${y * 6}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Shared tilt cards on desktop.
  if (finePointer && !reduceMotion) {
    $$('.tilt-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = clamp((e.clientX - r.left) / r.width) - .5;
        const y = clamp((e.clientY - r.top) / r.height) - .5;
        card.style.setProperty('--tilt-x', `${x * 3.2}deg`);
        card.style.setProperty('--tilt-y', `${-y * 2.4}deg`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  // Build the 9-ball break rack once.
  const rack = $('#rackBalls');
  const rackSpecs = [
    [55, 0, 1,   0, -132, 280],
    [35, 34, 2, -105, -76, -240], [75, 34, 3, 112, -58, 230],
    [15, 68, 4, -154, 18, -310], [55, 68, 9, 24, -18, 420], [95, 68, 5, 154, 20, 330],
    [-5, 102, 6, -172, 86, 260], [35, 102, 7, -76, 110, -330], [75, 102, 8, 74, 104, 390], [115, 102, 10, 176, 82, -280],
    [-25, 136, 11, -192, 154, 320], [15, 136, 12, -118, 170, -360], [55, 136, 13, 0, 186, 430], [95, 136, 14, 116, 168, -390], [135, 136, 15, 194, 142, 340]
  ];
  const ballColors = ['#f5d11d','#2386d8','#e8503c','#7e48af','#f08b22','#2c9b53','#7e1e27','#151515','#f4d30e','#2687d9','#e8503c','#7e48af','#f08b22','#2c9b53','#7e1e27'];
  if (rack) {
    rackSpecs.forEach((s, i) => {
      const [x, y, n, dx, dy, rot] = s;
      const b = document.createElement('b');
      b.className = 'rack-ball';
      b.textContent = n;
      b.style.left = `${x}px`; b.style.top = `${y}px`;
      b.style.setProperty('--ball', ballColors[i]);
      b.dataset.dx = dx; b.dataset.dy = dy; b.dataset.rot = rot;
      rack.appendChild(b);
    });
  }

  // Scroll-driven billiards scenes.
  // Shot scene uses its own interpolated render progress so wheel/trackpad steps on PC
  // become one continuous billiards motion instead of visible frame jumps.
  let scrollTicking = false;
  let lastBreakHit = false;
  let shotTargetP = 0;
  let shotRenderP = 0;
  let shotAnimationFrame = 0;
  let shotGeometryCache = null;

  const easeInOut = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const lineGeometry = (el, x1, y1, x2, y2) => {
    if (!el) return;
    const dx = x2 - x1, dy = y2 - y1;
    el.style.left = `${x1}px`;
    el.style.top = `${y1}px`;
    el.style.width = `${Math.hypot(dx,dy)}px`;
    el.style.transform = `rotate(${Math.atan2(dy,dx) * 180 / Math.PI}deg)`;
  };

  const getShotGeometry = () => {
    const section = $('.shot-lab');
    const table = section && $('.shot-table', section);
    const cueBall = section && $('.cue-ball', section);
    const objectBall = section && $('.object-ball', section);
    if (!table || !cueBall || !objectBall) return null;

    const w = table.clientWidth, h = table.clientHeight;
    const ball = cueBall.offsetWidth || (innerWidth <= 1000 ? 32 : 44);
    if (shotGeometryCache && Math.abs(shotGeometryCache.w - w) < .5 && Math.abs(shotGeometryCache.h - h) < .5) {
      return shotGeometryCache;
    }

    const cueStart = { x: .35*w + ball/2, y: .47*h + ball/2 };
    const objStart = { x: .66*w + ball/2, y: .39*h + ball/2 };
    const vx = objStart.x - cueStart.x, vy = objStart.y - cueStart.y;
    const d = Math.max(1, Math.hypot(vx,vy));
    const ux = vx/d, uy = vy/d;

    // White-ball center stops one ball diameter before the 9-ball center: visible edge-to-edge contact.
    const whiteContact = { x: objStart.x - ux*ball*.94, y: objStart.y - uy*ball*.94 };
    const pocket = { x: w*.985, y: h*.045 };
    const ovx = pocket.x - objStart.x, ovy = pocket.y - objStart.y;
    const od = Math.max(1, Math.hypot(ovx,ovy));
    const oux = ovx/od, ouy = ovy/od;
    const angle = Math.atan2(vy,vx);
    const cueLength = Math.min(w*.43, 470);
    const cueH = innerWidth <= 1000 ? 8 : 10;
    const cueTip = { x: cueStart.x - ux*(ball*.56), y: cueStart.y - uy*(ball*.56) };

    cueBall.style.left = `${cueStart.x - ball/2}px`;
    cueBall.style.top = `${cueStart.y - ball/2}px`;
    objectBall.style.left = `${objStart.x - ball/2}px`;
    objectBall.style.top = `${objStart.y - ball/2}px`;

    const cue = $('.shot-cue', section);
    if (cue) {
      cue.style.width = `${cueLength}px`;
      cue.style.height = `${cueH}px`;
      cue.style.left = `${cueTip.x - cueLength}px`;
      cue.style.top = `${cueTip.y - cueH/2}px`;
    }

    lineGeometry($('.path-cue', section), cueStart.x, cueStart.y, whiteContact.x, whiteContact.y);
    lineGeometry($('.path-object', section), objStart.x, objStart.y, pocket.x, pocket.y);

    const ghost = $('.ghost-contact', section);
    if (ghost) {
      ghost.style.left = `${whiteContact.x - ghost.offsetWidth/2}px`;
      ghost.style.top = `${whiteContact.y - ghost.offsetHeight/2}px`;
    }

    const gate = $('.release-gate', section);
    if (gate) {
      const gx = cueStart.x - ux*(ball + 88), gy = cueStart.y - uy*(ball + 88);
      gate.style.left = `${gx}px`;
      gate.style.top = `${gy - gate.offsetHeight/2}px`;
      gate.style.transform = `rotate(${angle * 180 / Math.PI}deg)`;
    }

    shotGeometryCache = {w,h,ball,cueStart,objStart,whiteContact,pocket,ux,uy,oux,ouy,angle,cueLength};
    return shotGeometryCache;
  };

  const setShotStep = key => {
    $$('#shotSteps [data-shot-step]').forEach(s => s.classList.toggle('active', s.dataset.shotStep === key));
  };

  const setShotScene = p => {
    window.VolumeMotion?.shot(p);
    const section = $('.shot-lab');
    if (!section) return;
    const g = getShotGeometry();
    if (!g) return;

    const table = $('.shot-table', section);
    const cue = $('.shot-cue', section);
    const cueBall = $('.cue-ball', section);
    const objectBall = $('.object-ball', section);
    const ring = $('.impact-ring', section);
    const dust = $('.chalk-dust', section);
    const pathCue = $('.path-cue', section);
    const pathObj = $('.path-object', section);
    const ghost = $('.ghost-contact', section);
    const meter = $('.shot-meter', section);
    const meterLabel = $('#shotMeterLabel');
    const label = $('#shotLabel');
    const powerBar = $('#shotPower');
    const powerText = $('#shotPercent');

    section.style.setProperty('--shot-p', p.toFixed(5));

    // Phase 1: scroll pulls the cue AWAY from the white ball, visibly storing power.
    const charge = easeInOut(clamp(p / .28));
    const hold = clamp((p - .28) / .06);
    const release = easeOut(clamp((p - .34) / .085));
    const maxPull = Math.min(112, g.w*.14);
    const pullBack = p < .34 ? maxPull * charge : maxPull * (1 - release);
    const tinyFollowThrough = p > .34 ? 10 * release : 0;
    const cueDX = -g.ux*pullBack + g.ux*tinyFollowThrough;
    const cueDY = -g.uy*pullBack + g.uy*tinyFollowThrough;
    const cueOpacity = 1 - clamp((p - .46) / .12);
    if (cue) {
      cue.style.transform = `rotate(${g.angle * 180 / Math.PI}deg) translate3d(${-pullBack + tinyFollowThrough}px,0,0)`;
      cue.style.opacity = cueOpacity.toFixed(3);
    }

    // Phase 2: white ball travels exactly to edge-to-edge contact with the 9-ball.
    const whiteMove = easeInOut(clamp((p - .42) / .24));
    const whiteX = (g.whiteContact.x - g.cueStart.x) * whiteMove;
    const whiteY = (g.whiteContact.y - g.cueStart.y) * whiteMove;
    if (cueBall) cueBall.style.transform = `translate3d(${whiteX}px,${whiteY}px,0)`;

    // Phase 3: after contact, 9-ball inherits the motion and travels to the pocket.
    const objMove = easeInOut(clamp((p - .66) / .27));
    const objX = (g.pocket.x - g.objStart.x) * objMove;
    const objY = (g.pocket.y - g.objStart.y) * objMove;
    const sink = easeInOut(clamp((p - .91) / .085));
    if (objectBall) {
      objectBall.style.transform = `translate3d(${objX}px,${objY}px,0) scale(${1 - sink*.70})`;
      objectBall.style.opacity = String(1 - clamp((p - .965) / .035));
    }

    // Contact flash is centered on the real collision point.
    const impact = clamp(1 - Math.abs(p - .66) / .035);
    if (ring) {
      ring.style.left = `${g.objStart.x - g.ball*.48}px`;
      ring.style.top = `${g.objStart.y - g.ball*.48}px`;
      ring.style.opacity = impact.toFixed(3);
      ring.style.transform = `scale(${.75 + (1-impact)*2.7})`;
    }
    if (dust) {
      dust.style.left = `${g.cueStart.x - 4}px`;
      dust.style.top = `${g.cueStart.y - 4}px`;
      dust.style.opacity = String(clamp(1 - Math.abs(p - .39) / .07));
    }

    // Paths explain WHY the shot works, not just where things happen.
    if (pathCue) pathCue.style.opacity = String(.12 + (1 - whiteMove)*.36);
    if (pathObj) pathObj.style.opacity = String(.10 + clamp((p - .53) / .16)*.40);
    if (ghost) ghost.style.opacity = String(p < .68 ? .18 + clamp(p/.35)*.32 : .12);

    const power = Math.round(charge * 100);
    if (powerBar) powerBar.style.width = `${power}%`;
    if (powerText) powerText.textContent = String(power).padStart(2,'0');
    meter?.classList.toggle('is-locked', p >= .28 && p < .34);
    meter?.classList.toggle('is-fired', p >= .34 && p < .91);
    meter?.classList.toggle('is-pocket', p >= .91);
    table?.classList.toggle('shot-contact', impact > .1);
    table?.classList.toggle('pocket-ready', p > .78);

    if (p < .28) {
      if(label) label.textContent = 'VUỐT XUỐNG · KÉO CƠ LÙI';
      if(meterLabel) meterLabel.textContent = 'POWER';
      setShotStep('charge');
    } else if (p < .42) {
      if(label) label.textContent = p < .34 ? '100% LỰC · SẴN SÀNG' : 'RELEASE · CƠ LAO TỚI';
      if(meterLabel) meterLabel.textContent = 'POWER LOCKED';
      setShotStep('release');
    } else if (p < .78) {
      if(label) label.textContent = p < .66 ? 'BI TRẮNG → ĐIỂM VA CHẠM' : 'CONTACT · TRUYỀN LỰC';
      if(meterLabel) meterLabel.textContent = 'TRANSFER';
      setShotStep('contact');
    } else {
      if(label) label.textContent = p < .96 ? 'BI 9 → LỖ' : 'POCKET ✓';
      if(meterLabel) meterLabel.textContent = 'POCKET';
      setShotStep('pocket');
    }
  };

  let shotLastTime=0;
  const animateShotScene = now => {
    const dt=Math.min(50,now-(shotLastTime||now-16));shotLastTime=now;
    shotAnimationFrame = 0;
    const smoothing = 1-Math.exp(-dt/(window.volumeScroll&&finePointer?24:finePointer?90:48));
    shotRenderP += (shotTargetP - shotRenderP) * smoothing;
    if (Math.abs(shotTargetP - shotRenderP) < .00035) shotRenderP = shotTargetP;
    setShotScene(shotRenderP);
    if (shotRenderP !== shotTargetP) shotAnimationFrame = requestAnimationFrame(animateShotScene);
  };

  const setShotTarget = p => {
    shotTargetP = clamp(p);
    if (reduceMotion) {
      shotRenderP = shotTargetP;
      setShotScene(shotRenderP);
      return;
    }
    if (!shotAnimationFrame) shotAnimationFrame = requestAnimationFrame(animateShotScene);
  };

  const drawBreakScene = p => {
    window.VolumeMotion?.break(p);
    const section = $('.break-lab');
    const stage = $('#breakStage');
    if (!section || !stage) return;
    section.style.setProperty('--break-p', p.toFixed(4));
    const cue = $('.break-cue', section), breaker = $('.breaker', section), shock = $('.shockwave', section), portal = $('.pocket-portal', section);
    const stageW = stage.clientWidth || 900;

    // Three readable phases: pull -> strike/contact -> rack opens.
    const pull = easeInOut(clamp(p / .18));
    const strike = easeOut(clamp((p - .18) / .18));
    const cueTravel = (-stageW * .055 * pull) + (stageW * .245 * strike);
    if (cue) {
      cue.style.transform = `translate3d(${cueTravel}px,0,0) rotate(-1deg)`;
      cue.style.opacity = String(1 - clamp((p - .39) / .055));
    }

    // Cue ball does not move until the cue has actually reached it.
    const whiteTravel = easeInOut(clamp((p - .30) / .115));
    if (breaker) breaker.style.transform = `translate3d(${whiteTravel * stageW * .205}px,0,0)`;

    // Balls only spread AFTER visible white-ball/rack contact. Distances are capped
    // relative to the stage so the whole break remains inside the table on mobile.
    const spread = easeOut(clamp((p - .415) / .49));
    const scale = Math.min(1, Math.max(.56, stageW / 980));
    $$('.rack-ball', section).forEach(b => {
      const dx = (+b.dataset.dx || 0) * scale, dy = (+b.dataset.dy || 0) * scale, rot = +b.dataset.rot || 0;
      const arc = Math.sin(spread * Math.PI) * (Math.abs(dx) > 120*scale ? -8*scale : 5*scale);
      b.style.transform = `translate3d(${dx * spread}px,${dy * spread + arc}px,0) rotate(${rot * spread}deg)`;
    });

    const shockP = clamp((p - .415) / .18);
    if (shock) { shock.style.opacity = String((1 - shockP) * .65); shock.style.transform = `scale(${.55 + shockP * 5.2})`; }
    if (portal) portal.style.opacity = '0';
    const force = $('#breakForce'), spreadText = $('#breakSpread'), pocketedText=$('#breakPocketed');
    if (force) force.textContent = (clamp((p - .08) / .34) * 9.7).toFixed(1);
    if (spreadText) spreadText.textContent = String(Math.round(spread * 100)).padStart(2,'0');
    if (pocketedText) {
      const states=p>.415&&window.VolumePhysics?window.VolumePhysics.sample(clamp((p-.415)/.535)*window.VolumePhysics.duration):[];
      pocketedText.textContent=String(states.filter(s=>s.sink>.02).length).padStart(2,'0');
    }
    if (p > .42 && !lastBreakHit) lastBreakHit = true;
    if (p < .34) lastBreakHit = false;
  };

  let breakTarget=0,breakRendered=0,breakFrame=0,breakTime=0;
  const animateBreak=now=>{
    breakFrame=0;const dt=Math.min(50,now-(breakTime||now-16));breakTime=now;
    breakRendered+=(breakTarget-breakRendered)*(1-Math.exp(-dt/(window.volumeScroll&&finePointer?24:finePointer?90:48)));
    if(Math.abs(breakTarget-breakRendered)<.0003)breakRendered=breakTarget;
    drawBreakScene(breakRendered);
    if(breakRendered!==breakTarget)breakFrame=requestAnimationFrame(animateBreak);else breakTime=0;
  };
  const setBreakScene=p=>{breakTarget=p;if(reduceMotion){breakRendered=p;drawBreakScene(p);}else if(!breakFrame)breakFrame=requestAnimationFrame(animateBreak);};

  const scrollState = () => {
    scrollTicking = false;
    const y = scrollY;
    $('#topbar')?.classList.toggle('scrolled', y > 40);

    const docH = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const pageP = clamp(y / docH);
    const pageLine = $('#pageProgress'), marker = $('#progressBall');
    if (pageLine) pageLine.style.width = `${pageP * 100}%`;
    if (marker) marker.style.left = `${pageP * 100}%`;

    const hero = $('.hero');
    if (hero && !window.VolumeMotion) {
      const r = hero.getBoundingClientRect();
      const p = clamp((-r.top) / Math.max(1, r.height - innerHeight));
      hero.style.setProperty('--hero-p', p.toFixed(4));
    }
    const shot = $('.shot-lab');
    if (shot) {
      const r = shot.getBoundingClientRect();
      setShotTarget(clamp((-r.top) / Math.max(1, r.height - innerHeight)));
    }
    const br = $('.break-lab');
    if (br) {
      const r = br.getBoundingClientRect();
      setBreakScene(clamp((-r.top) / Math.max(1, r.height - innerHeight)));
    }
    const uni = $('.universe');
    if (uni && !window.VolumeMotion) {
      const r = uni.getBoundingClientRect();
      const p = clamp((-r.top) / Math.max(1, r.height - innerHeight));
      const prog = $('#universeProgress'); if (prog) prog.style.width = `${p * 100}%`;
      const index = Math.min(3, Math.floor(p * 4));
      $$('.world-scene').forEach((s, i) => s.classList.toggle('active', i === index));
      $$('.universe-tabs span').forEach((s, i) => s.classList.toggle('active', i === index));
    }
    const tournament = $('.tournament');
    if (tournament) {
      const r = tournament.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      tournament.style.setProperty('--tourney-p', p.toFixed(3));
    }
    const visit = $('.visit');
    if (visit) {
      const r = visit.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      visit.style.setProperty('--visit-p', p.toFixed(3));
    }
    const bvis = $('#bookingVisual');
    if (bvis) {
      const r = bvis.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height));
      bvis.style.setProperty('--table-scroll', p.toFixed(3));
    }
  };
  const requestScrollState = () => { if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(scrollState); } };
  addEventListener('scroll', requestScrollState, { passive: true });
  addEventListener('resize', () => { shotGeometryCache = null; requestScrollState(); }, { passive: true });
  scrollState();

  // Reveal observer.
  const revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  }), { threshold: .10, rootMargin: '0px 0px -4% 0px' });
  $$('.reveal-up').forEach(el => revealObserver.observe(el));

  // Continuous decorative animations only run while their scene is on screen.
  // This matters on iOS where off-screen compositor work competes with WebGL.
  const sceneObserver = new IntersectionObserver(entries => entries.forEach(e => {
    e.target.classList.toggle('scene-live', e.isIntersecting);
  }), { rootMargin: '120px 0px' });
  ['#bookingVisual','.manifesto'].forEach(sel => { const el=$(sel); if(el)sceneObserver.observe(el); });

  const rail = $('#productRail');
  if (rail && finePointer) {
    let down=false,startX=0,startLeft=0,dragged=false;
    rail.addEventListener('click',e=>{if(dragged){e.preventDefault();e.stopPropagation();dragged=false;}},true);
    rail.addEventListener('pointerdown', e => { down=true; dragged=false; startX=e.clientX; startLeft=rail.scrollLeft;  });
    rail.addEventListener('pointermove', e => { if(down){if(Math.abs(e.clientX-startX)>8)dragged=true;rail.scrollLeft=startLeft-(e.clientX-startX);} });
    const stop=()=>{down=false}; rail.addEventListener('pointerup',stop); rail.addEventListener('pointercancel',stop); rail.addEventListener('pointerleave',stop);
  }

  const backdrop = $('#modalBackdrop');
  let lastFocused = null;
  const openModal = modal => {
    if(!modal)return; lastFocused=document.activeElement; backdrop?.classList.add('show'); modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('body-lock'); window.volumeScroll?.stop(); modal.querySelector('button,a,textarea')?.focus({preventScroll:true});
  };
  const closeModals = () => {
    $$('.modal').forEach(m => {m.classList.remove('show');m.setAttribute('aria-hidden','true')}); backdrop?.classList.remove('show'); document.body.classList.remove('body-lock'); window.volumeScroll?.start(); lastFocused?.focus?.({preventScroll:true});
  };
  addEventListener('keydown', e => {
    const modal = $('.modal.show');
    if(e.key !== 'Tab' || !modal) return;
    const items = $$('button,a[href],input,textarea,select',modal).filter(x=>!x.disabled && x.getClientRects().length);
    const first=items[0],last=items.at(-1);
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
  });
  backdrop?.addEventListener('click', closeModals); $$('[data-close-modal]').forEach(b => b.addEventListener('click', closeModals));
  addEventListener('keydown', e => { if(e.key === 'Escape') { closeModals(); toggleMenu(false); } });
  window.VolumeUI = { openModal, closeModals, toast };
  // Toast.
  let toastTimer;
  function toast(message){const t=$('#toast');if(!t)return;t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200)}
})();
