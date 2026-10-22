/* =========================================================
   DIWALI GLOW ✨ — script.js
   Parts:
   1. Helpers            6. Open-the-surprise transition
   2. Stars & sparkles   7. Scroll reveal
   3. Diya artwork       8. Diyas (tap to light)
   4. Fireworks engine   9. Wish generator, share & copy
   5. Toast             10. Festive music (Web Audio)
   ========================================================= */
(() => {
  'use strict';

  /* ---------- 1. Helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;

  /* ---------- 2. Stars & floating sparkles ---------- */
  function buildStars() {
    const box = $('#stars');
    if (!box) return;
    const count = window.innerWidth < 600 ? 55 : 95;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('i');
      const size = rand(1, 3.2).toFixed(1);
      s.style.cssText =
        `left:${rand(0, 100).toFixed(1)}%;top:${rand(0, 100).toFixed(1)}%;width:${size}px;height:${size}px;` +
        `--d:${rand(2, 6).toFixed(1)}s;--delay:${rand(0, 5).toFixed(1)}s`;
      frag.appendChild(s);
    }
    box.appendChild(frag);
  }

  function buildSparkles() {
    const box = $('#sparkles');
    if (!box) return;
    const glyphs = ['✦', '✧', '★', '✨', '•'];
    const colors = ['#ffd166', '#ff8ad1', '#c7a6ff', '#ffb347', '#ffffff'];
    const count = window.innerWidth < 600 ? 12 : 22;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const sp = document.createElement('span');
      sp.textContent = pick(glyphs);
      sp.style.cssText =
        `--x:${rand(0, 98).toFixed(1)}%;--s:${rand(10, 24).toFixed(0)}px;--c:${pick(colors)};` +
        `--t:${rand(9, 20).toFixed(1)}s;--delay:${rand(-20, 0).toFixed(1)}s`;
      frag.appendChild(sp);
    }
    box.appendChild(frag);
  }

  /* ---------- 3. Diya artwork (inline SVG, injected where data-diya is used) ---------- */
  const DIYA_SVG = `
<svg viewBox="0 0 120 112" aria-hidden="true" focusable="false">
  <g class="flame-wrap">
    <path d="M60 4C78 28 80 44 60 60C40 44 42 28 60 4Z" fill="url(#gFlame)"/>
    <path d="M60 30C68 41 68 49 60 56C52 49 52 41 60 30Z" fill="#fff6c9" opacity=".95"/>
  </g>
  <rect x="57.5" y="56" width="5" height="10" rx="2" fill="#4a2a14"/>
  <path d="M6 68Q60 56 114 68Q110 102 60 107Q10 102 6 68Z" fill="url(#gBowl)"/>
  <path d="M6 68Q60 56 114 68" fill="none" stroke="url(#gGold)" stroke-width="4" stroke-linecap="round"/>
  <g fill="url(#gGold)"><circle cx="36" cy="86" r="4"/><circle cx="60" cy="92" r="4"/><circle cx="84" cy="86" r="4"/></g>
</svg>`;

  function buildDiyas() {
    $$('[data-diya]').forEach((el) => { el.innerHTML = DIYA_SVG; });
    // Little floating embers around each diya
    $$('.ember-layer').forEach((layer) => {
      for (let i = 0; i < 7; i++) {
        const e = document.createElement('i');
        e.style.cssText =
          `--x:${rand(25, 75).toFixed(0)}%;--dx:${rand(-30, 30).toFixed(0)}px;` +
          `--t:${rand(2.4, 4.4).toFixed(1)}s;--dl:${rand(0, 4).toFixed(1)}s`;
        layer.appendChild(e);
      }
    });
  }

  /* ---------- 4. Fireworks engine (HTML Canvas) ---------- */
  const fx = (() => {
    const canvas = $('#fireworks');
    const ctx = canvas.getContext('2d');
    const MAX_PARTICLES = 1300;
    const PALETTES = [
      ['#ffd166', '#ffb703', '#fff3b0'],   // gold
      ['#ff3fa4', '#ff8ad1', '#ffffff'],   // pink
      ['#9d4dff', '#c7a6ff', '#ffffff'],   // purple
      ['#ff8a1f', '#ffd166', '#ffffff'],   // orange
      ['#ff3fa4', '#ffd166', '#9d4dff'],   // mixed
      ['#ffffff', '#ffd166', '#ff3fa4']    // white-gold-pink
    ];
    const rockets = [];
    const parts = [];
    const flashes = [];
    const rgbCache = {};
    let W = 0, H = 0, raf = 0, last = 0, autoTimer = 0, autoOn = false, autoSlow = true;

    const rgb = (hex) => rgbCache[hex] || (rgbCache[hex] = [
      parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)
    ]);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function addV(x, y, vx, vy, color, o = {}) {
      parts.push({
        x, y, vx, vy, life: 1,
        decay: o.decay || rand(.55, 1.0),
        size: o.size || rand(1.3, 2.6),
        g: o.g !== undefined ? o.g : 0.045,
        f: o.f !== undefined ? o.f : 0.972,
        c: rgb(color),
        tw: Math.random() < 0.35
      });
    }

    function burst(x, y) {
      if (parts.length > MAX_PARTICLES) return;
      const small = W < 600;
      const pal = pick(PALETTES);
      const kind = reduced() ? 'peony' : pick(['peony', 'peony', 'ring', 'willow', 'heart', 'double', 'star']);
      const count = reduced() ? 26 : Math.round((small ? 60 : 95) * rand(.85, 1.25));
      const power = (small ? 4.2 : 5.6) * rand(.85, 1.15);
      const TAU = Math.PI * 2;
      flashes.push({ x, y, life: 1, c: rgb(pal[0]) });

      if (kind === 'ring') {
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU;
          addV(x, y, Math.cos(a) * power * 1.05, Math.sin(a) * power * 1.05, pal[i % 2], { f: .975 });
        }
      } else if (kind === 'double') {
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU;
          const inner = i % 2 === 0;
          const sp = inner ? power * .55 : power * 1.05;
          addV(x, y, Math.cos(a) * sp, Math.sin(a) * sp, inner ? pal[1] : pal[0], { f: .975 });
        }
      } else if (kind === 'willow') {
        for (let i = 0; i < count; i++) {
          const a = rand(0, TAU);
          const sp = power * rand(.35, 1);
          addV(x, y, Math.cos(a) * sp, Math.sin(a) * sp, i % 3 ? '#ffd166' : pal[0],
            { decay: rand(.28, .45), g: .03, f: .985, size: 2 });
        }
      } else if (kind === 'heart') {
        for (let i = 0; i < count; i++) {
          const t = (i / count) * TAU;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
          const s = (power / 16) * 1.05;
          addV(x, y, hx * s, -hy * s, pal[i % 2], { g: .02, f: .975 });
        }
      } else if (kind === 'star') {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU - Math.PI / 2;
          for (let j = 1; j <= 8; j++) {
            addV(x, y, Math.cos(a) * power * (j / 8) * 1.1, Math.sin(a) * power * (j / 8) * 1.1,
              pal[j % 2], { g: .02, f: .98 });
          }
        }
      } else { // peony: a classic round burst
        for (let i = 0; i < count; i++) {
          const a = rand(0, TAU);
          const sp = power * Math.sqrt(Math.random());
          addV(x, y, Math.cos(a) * sp, Math.sin(a) * sp, pick(pal));
        }
      }
      ensureLoop();
    }

    function launch(targetX, targetY) {
      if (reduced()) { burst(targetX ?? rand(W * .2, W * .8), targetY ?? rand(H * .15, H * .4)); return; }
      const sx = targetX ?? rand(W * .12, W * .88);
      rockets.push({
        sx, x: sx, y: H + 10,
        tx: sx + rand(-60, 60), ty: targetY ?? rand(H * .12, H * .42),
        t: 0, dur: rand(.8, 1.25)
      });
      ensureLoop();
    }

    function frame(ts) {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(.05, (ts - last) / 1000 || .016);
      last = ts;

      // Fade the old frame so particles leave soft trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // Burst flashes (soft glows)
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= dt * 3.2;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        const r = 130 * (1.25 - f.life * .6);
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        g.addColorStop(0, `rgba(${f.c[0]},${f.c[1]},${f.c[2]},${(f.life * .32).toFixed(2)})`);
        g.addColorStop(1, `rgba(${f.c[0]},${f.c[1]},${f.c[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, 6.283); ctx.fill();
      }

      // Rising rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt / r.dur;
        const p = 1 - (1 - Math.min(r.t, 1)) * (1 - Math.min(r.t, 1));
        r.x = r.sx + (r.tx - r.sx) * p;
        r.y = (H + 10) + (r.ty - (H + 10)) * p;
        addV(r.x, r.y, rand(-.3, .3), rand(.2, .8), '#ffcf6b', { decay: 2.4, size: 1.4, g: .01, f: .9 });
        ctx.fillStyle = 'rgba(255,240,200,.95)';
        ctx.beginPath(); ctx.arc(r.x, r.y, 2.2, 0, 6.283); ctx.fill();
        if (r.t >= 1) { rockets.splice(i, 1); burst(r.x, r.y); }
      }

      // Particles
      const k = dt * 60;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
        const fr = Math.pow(p.f, k);
        p.vx *= fr;
        p.vy = p.vy * fr + p.g * k;
        p.x += p.vx * k;
        p.y += p.vy * k;
        let a = Math.min(1, p.life * 1.4);
        if (p.tw && Math.random() < .25) a *= .35;   // twinkle
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.6 + .4 * p.life), 0, 6.283); ctx.fill();
      }

      if (rockets.length || parts.length || flashes.length) {
        raf = requestAnimationFrame(frame);
      } else {
        // Nothing left to draw: wipe the canvas and stop using the CPU/GPU
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);
      }
    }

    function ensureLoop() {
      if (raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function clearAll() {
      cancelAnimationFrame(raf); raf = 0;
      rockets.length = 0; parts.length = 0; flashes.length = 0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
    }

    // Automatic show: a firework every second or two (off for reduced motion / hidden tab)
    function scheduleAuto() {
      clearTimeout(autoTimer);
      if (!autoOn || reduced() || document.hidden) return;
      autoTimer = setTimeout(() => {
        launch();
        if (Math.random() < .22) { setTimeout(() => launch(), 250); setTimeout(() => launch(), 520); }
        scheduleAuto();
      }, autoSlow ? rand(1800, 3200) : rand(1000, 2400));
    }
    function setAuto(on, slow) { autoOn = on; autoSlow = slow; scheduleAuto(); }

    // Pause everything when the tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { clearTimeout(autoTimer); clearAll(); }
      else { scheduleAuto(); }
    });
    const onMotionChange = () => { if (reduced()) { clearTimeout(autoTimer); clearAll(); } else { scheduleAuto(); } };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

    // Click / tap anywhere (except on controls) for a firework
    let lastTap = 0;
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button, a, input, textarea, select, label')) return;
      const now = performance.now();
      if (now - lastTap < 120) return;
      lastTap = now;
      burst(e.clientX, e.clientY);
    }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 120); });
    resize();

    return { burst, launch, setAuto };
  })();

  /* ---------- 5. Toast (short pop-up messages) ---------- */
  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
  }

  /* ---------- 6. Open the surprise ---------- */
  const body = document.body;
  const welcome = $('#welcome');
  const main = $('#main');
  const openBtn = $('#openBtn');
  let opened = false;

  openBtn.addEventListener('click', () => {
    if (opened) return;
    opened = true;
    openBtn.disabled = true;
    body.classList.add('is-opening');

    // A little firework fanfare
    const w = window.innerWidth, h = window.innerHeight;
    [[.5, .3], [.22, .38], [.78, .38], [.5, .18], [.34, .22], [.66, .22]].forEach((p, i) => {
      setTimeout(() => fx.burst(w * p[0], h * p[1]), i * 200);
    });

    setTimeout(() => {
      welcome.hidden = true;
      main.hidden = false;
      main.classList.add('show');
      body.classList.remove('is-welcome', 'is-opening');
      body.classList.add('is-open');
      window.scrollTo(0, 0);
      main.focus({ preventScroll: true });
      fx.setAuto(true, false);   // livelier show once the celebration begins
    }, reduced() ? 150 : 900);
  });

  /* ---------- 7. Scroll reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 })
    : null;
  $$('.reveal').forEach((el) => { if (io) io.observe(el); else el.classList.add('in'); });

  /* ---------- 8. Diyas: tap to light or rest ---------- */
  const diyaBtns = $$('.diya-btn');
  const diyaCount = $('#diyaCount');

  function updateDiyaCount() {
    const lit = diyaBtns.filter((b) => b.classList.contains('lit')).length;
    if (lit === diyaBtns.length) diyaCount.textContent = `All ${lit} diyas are glowing ✨`;
    else if (lit === 0) diyaCount.textContent = 'The diyas are resting. Tap one to light it 🪔';
    else diyaCount.textContent = `${lit} of ${diyaBtns.length} diyas are glowing`;
  }

  diyaBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nowLit = !btn.classList.contains('lit');
      btn.classList.toggle('lit', nowLit);
      btn.setAttribute('aria-pressed', String(nowLit));
      updateDiyaCount();
      if (nowLit && diyaBtns.every((b) => b.classList.contains('lit'))) {
        const r = btn.getBoundingClientRect();
        fx.burst(r.left + r.width / 2, Math.max(80, r.top - 80));
      }
    });
  });

  /* ---------- 9. Wish generator, share & copy ---------- */
  const form = $('#wishForm');
  const nameInput = $('#friendName');
  const nameError = $('#nameError');
  const output = $('#wishOutput');
  const wishCard = $('#wishCard');
  const wishText = $('#wishText');
  const statusEl = $('#status');
  const shareBtn = $('#shareBtn');
  const copyBtn = $('#copyBtn');
  const anotherBtn = $('#anotherBtn');

  const TEMPLATES = [
    (n) => `Happy Diwali, ${n}! ✨ May your days be bright, your heart be happy, and your life be filled with beautiful surprises!`,
    (n) => `${n}, may the glow of a thousand diyas light up your dreams this Diwali! 🪔 Wishing you love, laughter and plenty of sweets!`,
    (n) => `Shubh Deepavali, ${n}! 🎆 May every spark of joy tonight turn into a year of good fortune, good health and good friends.`,
    (n) => `Dear ${n}, may your Diwali be as sweet as laddoos and as sparkling as your smile! 💫 Happy Diwali!`,
    (n) => `Wishing you a Diwali full of light, ${n}! 🌟 May worries fade like fireworks and every good thing glow brighter.`
  ];

  let currentWish = '';
  let currentName = '';
  let templateIndex = 0;
  let statusTimer = 0;

  function setStatus(msg, type) {
    clearTimeout(statusTimer);
    const icon = type === 'ok' ? '✓ ' : type === 'error' ? '⚠ ' : type === 'info' ? 'ℹ ' : '';
    statusEl.className = 'status' + (type ? ' ' + type : '');
    statusEl.textContent = msg ? icon + msg : '';
    if (msg) statusTimer = setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'status'; }, 9000);
  }

  function showNameError(msg) {
    nameError.textContent = msg;
    nameError.hidden = false;
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
  }
  function clearNameError() {
    nameError.hidden = true;
    nameError.textContent = '';
    nameInput.removeAttribute('aria-invalid');
  }

  // Returns { ok, name } or { ok:false, message }
  function validateName(raw) {
    let name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (!name) return { ok: false, message: "Please type your friend's name first 💛" };
    if (name.length > 30) return { ok: false, message: 'That name is a bit long. Please keep it to 30 characters.' };
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s'.\-’]*$/u.test(name)) {
      return { ok: false, message: 'Names can only have letters, spaces, dots, hyphens and apostrophes.' };
    }
    // Make "aarav kumar" look like "Aarav Kumar" (only when typed fully in lowercase)
    if (name === name.toLowerCase()) {
      name = name.replace(/(^|[\s'’\-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
    }
    return { ok: true, name };
  }

  function renderWish(playBurst) {
    currentWish = TEMPLATES[templateIndex % TEMPLATES.length](currentName);
    templateIndex++;
    wishText.textContent = currentWish;            // textContent keeps user input safe
    output.hidden = false;
    // restart the unfold animation
    wishCard.style.animation = 'none';
    void wishCard.offsetWidth;
    wishCard.style.animation = '';
    wishCard.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    wishCard.focus({ preventScroll: true });
    if (playBurst) {
      const w = window.innerWidth, h = window.innerHeight;
      fx.burst(rand(w * .25, w * .75), rand(h * .18, h * .35));
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = validateName(nameInput.value);
    if (!res.ok) { showNameError(res.message); output.hidden = true; setStatus('', ''); return; }
    clearNameError();
    currentName = res.name;
    nameInput.value = res.name;
    templateIndex = 0;
    setStatus('', '');
    renderWish(true);
  });
  nameInput.addEventListener('input', clearNameError);

  anotherBtn.addEventListener('click', () => {
    if (!currentName) return;
    setStatus('', '');
    renderWish(true);
  });

  // Text we actually share / copy. Only add the link when the site is on the web (http/https).
  function siteUrl() { return /^https?:$/.test(location.protocol) ? location.href : ''; }
  function shareText() { const u = siteUrl(); return u ? `${currentWish}\n${u}` : currentWish; }

  // Clipboard API first, then an old-school fallback for older browsers / non-secure pages
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (err) { /* fall through */ }
    }
    const prev = document.activeElement;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    if (prev && prev.focus) prev.focus({ preventScroll: true });
    return ok;
  }

  async function doCopy(prefix) {
    if (!currentWish) { setStatus('Create a wish first, then you can copy it.', 'info'); return; }
    const ok = await copyText(shareText());
    if (ok) {
      const extra = siteUrl() ? '' : ' (Tip: once your site is published online, the link will be included too.)';
      setStatus((prefix || '') + 'Wish copied! Paste it into WhatsApp, Instagram, SMS or anywhere you like.' + extra, 'ok');
    } else {
      setStatus('Sorry, your browser blocked copying. Please select the wish text above and copy it by hand.', 'error');
    }
  }

  copyBtn.addEventListener('click', () => doCopy(''));

  shareBtn.addEventListener('click', async () => {
    if (!currentWish) { setStatus('Create a wish first, then you can share it.', 'info'); return; }
    const data = { title: 'Diwali Glow ✨', text: currentWish };
    if (siteUrl()) data.url = siteUrl();

    const canShare = typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' || navigator.canShare(data));
    if (!canShare) { await doCopy('Sharing isn’t available here, so I copied it instead. '); return; }

    try {
      await navigator.share(data);
      setStatus('Thanks for sharing the light! 🪔 (Your wish was handed to the app you chose.)', 'ok');
    } catch (err) {
      if (err && err.name === 'AbortError') {
        setStatus('Sharing was cancelled, so nothing was sent.', 'info');
      } else {
        setStatus('Sharing didn’t work on this device. Try “Copy Wish” instead.', 'error');
      }
    }
  });

  /* ---------- 10. Festive music (Web Audio, starts only after a button press) ---------- */
  const musicBtn = $('#musicToggle');
  const musicLabel = $('#musicLabel');
  const audio = { ctx: null, master: null, timer: 0, step: 0, next: 0, drones: [], on: false };

  // An original pentatonic tune (C-D-E-G-A). Numbers are steps on that scale; null = rest.
  const _ = null;
  const MELODY = [
    2, 4, 5, 4,  2, 1, 0, _,   1, 2, 4, 2,  1, 0, -1, _,
    4, 5, 7, 5,  4, 2, 4, _,   5, 4, 2, 1,  0, 1, 2, _,
    2, 4, 5, 4,  2, 1, 0, _,   1, 2, 4, 2,  1, 0, -1, _,
    7, 5, 4, 2,  4, 2, 1, 0,  -1, 0, 2, 4,  2, _, 0, _
  ];
  const STEP = 0.32;                   // seconds per note
  const SCALE = [0, 2, 4, 7, 9];       // semitones of the 5 scale notes
  const noteFreq = (idx) => {
    const oct = Math.floor(idx / 5);
    const deg = ((idx % 5) + 5) % 5;
    return 261.63 * Math.pow(2, (12 * oct + SCALE[deg]) / 12);
  };

  function bell(freq, t, dur, vel) {
    const c = audio.ctx;
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    const g = c.createGain(), g2 = c.createGain();
    o1.type = 'sine'; o1.frequency.value = freq;
    o2.type = 'triangle'; o2.frequency.value = freq * 2.01;
    g2.gain.value = 0.22;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(audio.master);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.start(t); o2.start(t);
    o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function thump(t) {                  // soft drum on the beat
    const c = audio.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    o.connect(g); g.connect(audio.master);
    o.start(t); o.stop(t + 0.3);
  }

  function schedule() {                // look ahead and queue upcoming notes
    const c = audio.ctx;
    while (audio.next < c.currentTime + 0.4) {
      const n = MELODY[audio.step];
      if (n !== null) bell(noteFreq(n), audio.next, 1.1, audio.step % 4 === 0 ? 0.26 : 0.18);
      if (audio.step % 8 === 0) thump(audio.next);
      audio.next += STEP;
      audio.step = (audio.step + 1) % MELODY.length;
    }
  }

  function setMusicUI(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicLabel.textContent = on ? 'Music on' : 'Music off';
  }

  async function startMusic() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { toast('Sorry, this browser can’t play the festive tune.'); return false; }
    try {
      if (!audio.ctx) {
        audio.ctx = new AC();
        const comp = audio.ctx.createDynamicsCompressor();
        audio.master = audio.ctx.createGain();
        audio.master.gain.value = 0;
        audio.master.connect(comp);
        comp.connect(audio.ctx.destination);
      }
      const c = audio.ctx;
      await c.resume();                // allowed because this runs from a button press
      if (c.state !== 'running') throw new Error('audio blocked');

      audio.master.gain.cancelScheduledValues(c.currentTime);
      audio.master.gain.setTargetAtTime(0.55, c.currentTime, 0.15);

      // soft drone (C and G) under the melody
      audio.drones = [130.81, 196.0].map((f) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.05;
        o.connect(g); g.connect(audio.master); o.start();
        return o;
      });

      audio.step = 0;
      audio.next = c.currentTime + 0.1;
      clearInterval(audio.timer);
      audio.timer = setInterval(schedule, 120);
      schedule();
      return true;
    } catch (err) {
      toast('Your browser didn’t allow sound. Try pressing the music button again.');
      return false;
    }
  }

  function stopMusic() {
    clearInterval(audio.timer);
    if (audio.ctx && audio.master) {
      const c = audio.ctx;
      audio.master.gain.cancelScheduledValues(c.currentTime);
      audio.master.gain.setTargetAtTime(0, c.currentTime, 0.08);
      audio.drones.forEach((o) => { try { o.stop(c.currentTime + 0.4); } catch (e) { /* already stopped */ } });
    }
    audio.drones = [];
  }

  musicBtn.addEventListener('click', async () => {
    if (!audio.on) {
      const ok = await startMusic();
      audio.on = ok;
      setMusicUI(ok);
      if (ok) toast('Music on 🎶 Press again to turn it off.');
    } else {
      audio.on = false;
      stopMusic();
      setMusicUI(false);
    }
  });

  // Pause sound when the tab is hidden; resume when you return
  document.addEventListener('visibilitychange', () => {
    if (!audio.ctx || !audio.on) return;
    if (document.hidden) audio.ctx.suspend();
    else audio.ctx.resume().then(() => { audio.next = audio.ctx.currentTime + 0.1; }).catch(() => {});
  });

  /* ---------- Start-up ---------- */
  buildStars();
  buildSparkles();
  buildDiyas();
  updateDiyaCount();
  fx.setAuto(true, true);              // gentle fireworks behind the welcome screen
})();
