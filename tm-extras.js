/* =====================================================================
   tm-extras.js  —  glass-bubble track menu for the mini music orb (#tmMini)

   Press the orb: the bubbles pop out around it (they fan towards the free side of the screen,
   so it works wherever the orb is dragged). Press a bubble: that track plays. Press the playing
   bubble again: music stops. Needs the matching changes in script.min.js (window.__tmMusic.playTrack).

   YOUR 6 TRACKS: change the "src" paths below (and the names if you like).
   Put the mp3 files in the audio/ folder with exactly these names.
   ===================================================================== */
window.TM_TRACKS = window.TM_TRACKS || [
  { en: "Tiamo 1", ar: "تيامو ١", src: "audio/theme.mp3" },
  { en: "Tiamo 2", ar: "تيامو ٢", src: "audio/tiamo-2.mp3" },
  { en: "Tiamo 3", ar: "تيامو ٣", src: "audio/tiamo-3.mp3" },
  { en: "Tiamo 4", ar: "تيامو ٤", src: "audio/tiamo-4.mp3" },
  { en: "Tiamo 5", ar: "تيامو ٥", src: "audio/tiamo-5.mp3" },
  { en: "Tiamo 6", ar: "تيامو ٦", src: "audio/tiamo-6.mp3" }
];
/* Show the mini orb after the hero even when nothing is playing (so a visitor can start any track from it).
   false = like before: it only appears while music is playing. */
window.TM_MINI_ALWAYS = window.TM_MINI_ALWAYS === undefined ? false : window.TM_MINI_ALWAYS;

(() => {
  "use strict";
  const orb = document.getElementById("tmMini");
  if (!orb || window.__tmMenu) return;

  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TINTS = [
    ["rgba(255,226,160,.95)", "rgba(255,150,60,.55)"],   /* amber */
    ["rgba(255,200,222,.95)", "rgba(255,105,170,.5)"],   /* pink */
    ["rgba(222,200,255,.95)", "rgba(150,105,255,.5)"],   /* lavender */
    ["rgba(180,248,238,.95)", "rgba(35,200,190,.5)"],    /* teal */
    ["rgba(190,230,255,.95)", "rgba(60,150,255,.5)"],    /* sky */
    ["rgba(215,255,195,.95)", "rgba(105,220,85,.5)"]     /* mint */
  ];
  const isAr = () => /^ar/i.test(document.documentElement.lang || "") || document.documentElement.dir === "rtl";
  const nameOf = (tr, i) => (isAr() ? tr.ar : tr.en) || tr.en || ("T" + (i + 1));
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };

  let wrap, ring, items = [], open = false, raf = 0, last = 0, px = -999, py = -999, plannedAt = null, closeTimer = 0;

  /* ---------- build ---------- */
  const xEl = el("span", "tmx-x"); xEl.setAttribute("aria-hidden", "true"); orb.appendChild(xEl);

  function build() {
    const TR = (window.TM_TRACKS || []).slice(0, 8);
    wrap = el("div", "tmx"); wrap.setAttribute("role", "group");
    ring = el("i", "tmx-ring"); wrap.appendChild(ring);
    items = TR.map((tr, i) => {
      const b = el("button", "tmx-i"); b.type = "button";
      const t = TINTS[i % TINTS.length]; b.style.setProperty("--c1", t[0]); b.style.setProperty("--c2", t[1]);
      const g = el("span", "tmx-g"), n = el("span", "tmx-n"), eq = el("span", "tmx-eq"), nm = el("span", "tmx-name");
      n.textContent = i + 1; eq.innerHTML = "<i></i><i></i><i></i>";
      b.append(g, n, eq, nm);
      b.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); choose(i); });
      wrap.appendChild(b);
      return { b, g, eq, bars: eq.children, nm, x: 0, y: 0, vx: 0, vy: 0, s: .15, vs: 0, a: 0, tx: 0, ty: 0, ts: .15, ta: 0, at: 0, ph: i * 1.7, st: 0, ang: 0, bump: 0 };
    });
    document.body.appendChild(wrap);
    labels();
  }
  function labels() {
    const TR = window.TM_TRACKS || [];
    wrap.setAttribute("aria-label", isAr() ? "مقاطع الموسيقى" : "Music tracks");
    items.forEach((it, i) => { const t = nameOf(TR[i] || {}, i); it.nm.textContent = t; it.b.setAttribute("aria-label", t); });
  }
  function active() {
    const M = window.__tmMusic || {};
    items.forEach((it, i) => { const on = !!M.playing && M.index === i; it.b.classList.toggle("is-on", on); it.b.setAttribute("aria-pressed", on); });
    wrap.classList.toggle("nofft", !M.data);
  }

  /* ---------- where do the bubbles go? (finds the free arc around the orb so nothing leaves the screen) ---------- */
  function plan(cx, cy, n, bs) {
    const W = innerWidth, H = innerHeight, m = bs / 2 + 16, topSafe = 64, gap = bs + 8;
    const okAt = (R, a) => { const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a); return x >= m && x <= W - m && y >= topSafe + m && y <= H - m; };
    const N = 180, step = 2 * Math.PI / N, R0 = Math.max(88, bs * 2.2);
    let fallback = null;
    for (let R = R0; R <= R0 + 120; R += 8) {
      const ok = []; for (let k = 0; k < N; k++) ok.push(okAt(R, -Math.PI + k * step));
      const need = 2 * Math.asin(Math.min(1, gap / (2 * R)));
      let best = { len: 0, start: 0 };
      if (ok.every(Boolean)) best = { len: N, start: 0, full: true };
      else {
        const f = ok.indexOf(false); let run = 0, start = 0;
        for (let k = 1; k <= N; k++) { const idx = (f + k) % N; if (ok[idx]) { if (!run) start = idx; run++; if (run > best.len) best = { len: run, start }; } else run = 0; }
      }
      const angles = [];
      if (best.full) {
        if (need <= 2 * Math.PI / n) { for (let i = 0; i < n; i++) angles.push(-Math.PI / 2 + i * 2 * Math.PI / n); }
      } else if (best.len) {
        const span = (best.len - 1) * step;
        if (span >= (n - 1) * need - 1e-6) {
          const spacing = Math.min(span / (n - 1), Math.max(need * 1.35, .62));
          const mid = -Math.PI + (best.start + (best.len - 1) / 2) * step;
          for (let i = 0; i < n; i++) angles.push(mid + (i - (n - 1) / 2) * spacing);
        } else if (!fallback || span > fallback.span) {
          const spacing = span / Math.max(1, n - 1), mid = -Math.PI + (best.start + (best.len - 1) / 2) * step;
          fallback = { span, R, angles: Array.from({ length: n }, (_, i) => mid + (i - (n - 1) / 2) * spacing) };
        }
      }
      if (angles.length === n) return angles.map(a => [R * Math.cos(a), R * Math.sin(a)]);
    }
    if (fallback) return fallback.angles.map(a => [fallback.R * Math.cos(a), fallback.R * Math.sin(a)]);
    return Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [R0 * Math.cos(a), R0 * Math.sin(a)]; });
  }

  /* ---------- open / close ---------- */
  function orbCenter() { const r = orb.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width]; }
  function replan(force) {
    const [cx, cy, w] = orbCenter();
    if (!force && plannedAt && Math.hypot(cx - plannedAt[0], cy - plannedAt[1]) < 6) return;
    plannedAt = [cx, cy];
    const bs = innerWidth < 700 ? 38 : 44;
    wrap.style.setProperty("--bs", bs + "px"); wrap.style.setProperty("--os", w + "px");
    const pos = plan(cx, cy, items.length, bs);
    items.forEach((it, i) => { it.tx = pos[i][0]; it.ty = pos[i][1]; });
  }
  function pulse() {
    const p = el("i", "tmx-pulse"); wrap.appendChild(p); p.addEventListener("animationend", () => p.remove()); setTimeout(() => p.remove(), 1000);
  }
  function openMenu() {
    if (open) return;
    if (!wrap) build();
    clearTimeout(closeTimer); open = true;
    const now = performance.now();
    labels(); active(); replan(true);
    items.forEach((it, i) => {
      if (!wrap.classList.contains("is-on")) { it.x = it.y = 0; it.vx = it.vy = 0; it.s = .15; it.vs = 0; it.a = 0; }
      it.ts = 1; it.ta = 1; it.at = REDUCE ? 0 : now + i * 38; it.bump = 0; it.b.classList.add("can");
    });
    wrap.classList.add("is-on", "is-open"); orb.classList.add("tmx-open"); orb.setAttribute("aria-expanded", "true");
    pulse(); kick();
  }
  function closeMenu(chosen) {
    if (!open) return;
    open = false; const now = performance.now();
    items.forEach((it, i) => {
      it.tx = 0; it.ty = 0; it.ts = .15; it.ta = 0; it.b.classList.remove("can");
      it.at = REDUCE ? 0 : now + (i === chosen ? 130 : Math.max(0, items.length - 1 - i) * 22);
      if (i === chosen && !REDUCE) { it.s = Math.max(it.s, 1.28); it.bump = 1; }
    });
    wrap.classList.remove("is-open"); orb.classList.remove("tmx-open"); orb.setAttribute("aria-expanded", "false");
    pulse(); kick();
    closeTimer = setTimeout(() => { if (!open) { wrap.classList.remove("is-on"); items.forEach(it => { it.a = 0; it.b.style.opacity = 0; }); } }, 1100);
  }
  function choose(i) {
    const M = window.__tmMusic;
    if (M && M.playTrack) M.playTrack(i);
    closeMenu(i);
  }

  /* ---------- animation (springs: bubbles overshoot a little, then settle; they stretch towards the pointer) ---------- */
  function frame(now) {
    raf = 0;
    const dt = Math.min(2.2, (now - last) / 16.67 || 1); last = now;
    if (!orb.classList.contains("show")) { if (open) closeMenu(-1); }
    const [cx, cy, ow] = orbCenter();
    wrap.style.setProperty("--ox", cx + "px"); wrap.style.setProperty("--oy", cy + "px"); wrap.style.setProperty("--os", ow + "px");
    if (open) replan(false);
    const M = window.__tmMusic || {}, d = M.data;
    const k = .17 * dt, damp = Math.pow(.74, dt);
    let moving = open;
    items.forEach((it, i) => {
      if (now < it.at) { moving = true; return; }
      if (REDUCE) { it.x = it.tx; it.y = it.ty; it.s = it.ts; it.a = it.ta; }
      else {
        it.vx = (it.vx + (it.tx - it.x) * k) * damp; it.vy = (it.vy + (it.ty - it.y) * k) * damp; it.vs = (it.vs + (it.ts - it.s) * k * 1.1) * damp;
        it.x += it.vx * dt; it.y += it.vy * dt; it.s += it.vs * dt; it.a += (it.ta - it.a) * Math.min(1, .28 * dt);
        if (Math.abs(it.tx - it.x) > .3 || Math.abs(it.ty - it.y) > .3 || Math.abs(it.ts - it.s) > .01 || Math.abs(it.ta - it.a) > .01 || Math.abs(it.vx) + Math.abs(it.vy) > .05) moving = true;
      }
      const flx = open && !REDUCE ? Math.sin(now / 900 + it.ph) * 2.2 : 0, fly = open && !REDUCE ? Math.cos(now / 1100 + it.ph * 1.3) * 2.2 : 0;
      const bx = cx + it.x + flx, by = cy + it.y + fly;
      /* jelly: stretch along the line to the pointer when it is close */
      let st = 0;
      if (open && !REDUCE) { const dx = px - bx, dy = py - by, dist = Math.hypot(dx, dy); if (dist < 90) { st = (1 - dist / 90) * .42; it.ang = Math.atan2(dy, dx); } }
      it.st += (st - it.st) * Math.min(1, .22 * dt);
      const sx = 1 + it.st, sy = 1 - it.st * .38, deg = it.ang * 180 / Math.PI;
      it.g.style.transform = it.st > .004 ? "rotate(" + deg.toFixed(1) + "deg) scale(" + sx.toFixed(3) + "," + sy.toFixed(3) + ") rotate(" + (-deg).toFixed(1) + "deg)" : "";
      it.b.style.transform = "translate(" + bx.toFixed(2) + "px," + by.toFixed(2) + "px) scale(" + Math.max(0, it.s).toFixed(3) + ")";
      it.b.style.opacity = Math.max(0, Math.min(1, it.a)).toFixed(3);
      if (it.b.classList.contains("is-on") && d) { const v = j => Math.max(.25, Math.min(1, d[j] / 255 * 1.25)); it.bars[0].style.transform = "scaleY(" + v(2).toFixed(2) + ")"; it.bars[1].style.transform = "scaleY(" + v(5).toFixed(2) + ")"; it.bars[2].style.transform = "scaleY(" + v(9).toFixed(2) + ")"; }
    });
    if (moving) kick();
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ---------- events ---------- */
  addEventListener("pointermove", e => { px = e.clientX; py = e.clientY; }, { passive: true });
  addEventListener("pointerdown", e => { if (!open) return; if (wrap.contains(e.target) || orb.contains(e.target)) return; closeMenu(-1); }, { passive: true });
  addEventListener("keydown", e => {
    if (!open) return;
    if (e.key === "Escape") { closeMenu(-1); orb.focus && orb.focus(); }
    else if (/^Arrow/.test(e.key)) {
      const list = items.map(it => it.b), idx = list.indexOf(document.activeElement), dir = /Right|Down/.test(e.key) ? 1 : -1;
      e.preventDefault(); list[(idx < 0 ? (dir > 0 ? 0 : list.length - 1) : (idx + dir + list.length) % list.length)].focus();
    }
  });
  addEventListener("resize", () => { if (open) replan(true); });
  addEventListener("tm:music", () => { if (wrap) active(); });
  addEventListener("tm:trackerror", e => {
    if (!wrap) return; const it = items[e.detail && e.detail.index]; if (!it) return;
    it.b.classList.remove("shake"); void it.b.offsetWidth; it.b.classList.add("shake"); setTimeout(() => it.b.classList.remove("shake"), 600);
  });
  new MutationObserver(() => { if (wrap) labels(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });

  window.__tmMenu = {
    toggle(e) { open ? closeMenu(-1) : openMenu(); },
    open: openMenu, close: () => closeMenu(-1),
    get isOpen() { return open; }
  };
})();
