/* ==========================================================================
   FLOW 06 > 07 > 08   (flow.js + flow.css)
   - ONE particle hologram, drawn on a shared fixed canvas, is the link between the three sections:
       06 cube  ->  flat square  ->  07 glass card  ->  the words of 07  ->  card  ->  08 ring
     Everything is a pure function of the scroll position (scrubbed), so scrolling back reverses it and
     menu / side-rail jumps land in the right state.
   - 07 becomes a pinned scene: the words form out of the particles and the social links become a fan of
     cards (like the reference video): the centre card rises, the fan opens, then the cards take turns.
   - Desktop (>= 901px) without "reduce motion" only. Phones / reduced motion keep the old layout.
   - Reads (never changes) the stage fields exported by scenes.js (window.__scFields).
   Tuning: D7 (pinned length of 07, in screen heights), COUNT, the MK / timeline block in `state()`.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__flowFx) return;
  window.__flowFx = true;

  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const smoother = t => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const root = document.documentElement;
  const mq = matchMedia("(min-width:901px)"), rm = matchMedia("(prefers-reduced-motion: reduce)");
  const isAr = () => root.lang === "ar";

  const proc = $("#process"), brief = $("#brief"), strip = $("section.social-strip");
  if (!proc || !brief || !strip) return;

  const D7 = 2.7;                  /* how long 07 stays pinned, in screen heights */
  const COUNT = 1100;
  const F = 2.8;

  let on = false, wrap = null, cv = null, ctx = null, links = null, slots = [], anchors = [], anchorHTML = [];
  let W = 0, H = 0, vh = 0, dpr = 1, base0 = 1, raf = 0, lastT = 0, lastA = null, ema = 16.7, cycleT = 0, focus = 0, hover = false;

  /* ------------------------------ tiny deterministic random ------------------------------ */
  let _s = 20261108;
  const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647;
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;

  /* ------------------------------ palette + sprites (same recipe as scenes.js) ------------------------------ */
  const DEF0 = [[139, 53, 255], [22, 216, 255], [255, 79, 216]], DEF1 = [[139, 53, 255], [22, 216, 255], [125, 241, 255]];
  const colorAt = (pal, u) => {
    const x = clamp(u, 0, .9999) * (pal.length - 1), i = Math.floor(x), f = x - i;
    return [0, 1, 2].map(k => Math.round(lerp(pal[i][k], pal[i + 1][k], f)));
  };
  const makeSprite = rgb => {
    const c = document.createElement("canvas"); c.width = c.height = 48;
    const g = c.getContext("2d"), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.22, "rgba(" + rgb.join(",") + ",.9)"); gr.addColorStop(1, "rgba(" + rgb.join(",") + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48); return c;
  };
  let sprites = [], palKey = "";
  const setPalette = pal => {
    const key = pal.map(c => c.join(",")).join("|");
    if (key === palKey) return; palKey = key;
    sprites = Array.from({ length: 16 }, (_, k) => makeSprite(colorAt(pal, k / 15)));
  };
  const mixPal = (a, b, t) => a.map((c, i) => c.map((v, k) => Math.round(lerp(v, (b[i] || b[b.length - 1])[k], t) / 8) * 8));

  /* ------------------------------ shapes (unit space: 1 unit = base0 px) ------------------------------ */
  const cube = n => {
    const a = new Float32Array(n * 3), s = .62;
    for (let i = 0; i < n; i++) {
      const p = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1], ax = (rnd() * 3) | 0; p[ax] = rnd() < .5 ? -1 : 1;
      if (rnd() < .42) { const b = (ax + 1 + ((rnd() * 2) | 0)) % 3; p[b] = rnd() < .5 ? -1 : 1; }
      a[i * 3] = p[0] * s; a[i * 3 + 1] = p[1] * s; a[i * 3 + 2] = p[2] * s;
    }
    return a;
  };
  const ring = n => {
    const a = new Float32Array(n * 3), R = .92, r = .055, tilt = .55, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let i = 0; i < n; i++) {
      const u = rnd() * Math.PI * 2, v = rnd() * Math.PI * 2;
      const x = (R + r * Math.cos(v)) * Math.cos(u), y = r * Math.sin(v), z = (R + r * Math.cos(v)) * Math.sin(u);
      a[i * 3] = x; a[i * 3 + 1] = y * ct - z * st; a[i * 3 + 2] = y * st + z * ct;
    }
    return a;
  };
  /* point on a rounded rectangle outline, t in 0..1 */
  const rrPoint = (t, hw, hh, r) => {
    const sx = 2 * (hw - r), sy = 2 * (hh - r), arc = Math.PI * r / 2, L = 2 * sx + 2 * sy + 4 * arc;
    let d = t * L;
    if (d < sx) return [-hw + r + d, -hh];
    d -= sx; if (d < arc) { const q = d / r; return [hw - r + Math.sin(q) * r, -hh + r - Math.cos(q) * r]; }
    d -= arc; if (d < sy) return [hw, -hh + r + d];
    d -= sy; if (d < arc) { const q = d / r; return [hw - r + Math.cos(q) * r, hh - r + Math.sin(q) * r]; }
    d -= arc; if (d < sx) return [hw - r - d, hh];
    d -= sx; if (d < arc) { const q = d / r; return [-hw + r - Math.sin(q) * r, hh - r + Math.cos(q) * r]; }
    d -= arc; if (d < sy) return [-hw, hh - r - d];
    d -= sy; const q = d / r; return [-hw + r - Math.cos(q) * r, -hh + r + Math.sin(q) * r];
  };
  const frame = n => {                     /* the flat "hologram square": dense edge, sparse glassy interior */
    const a = new Float32Array(n * 3), h = .62;
    for (let i = 0; i < n; i++) {
      let x, y;
      if (rnd() < .74) { const p = rrPoint(rnd(), h, h, .05); x = p[0] + gauss() * .012; y = p[1] + gauss() * .012; }
      else { x = (rnd() * 2 - 1) * h; y = (rnd() * 2 - 1) * h; }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = gauss() * .05;
    }
    return a;
  };
  let slab = null;                         /* {hw,hh,cy} in unit space, filled by layout() */
  const slabShape = (n, share) => {
    const a = new Float32Array(n * 3), S = slab, r = 34 / base0;
    for (let i = 0; i < n; i++) {
      let x, y;
      if (rnd() < share) { const p = rrPoint(rnd(), S.hw, S.hh, r); x = p[0] + gauss() * .01; y = p[1] + S.cy + gauss() * .01; }
      else { x = (rnd() * 2 - 1) * S.hw; y = S.cy + (rnd() * 2 - 1) * S.hh; }
      a[i * 3] = x; a[i * 3 + 1] = y; a[i * 3 + 2] = gauss() * .04;
    }
    return a;
  };
  let wordPts = null;
  const wordsShape = n => {
    const a = slabShape(n, .9), M = wordPts && wordPts.length ? Math.min(wordPts.length / 2, Math.floor(n * .62)) : 0;
    for (let i = 0; i < M; i++) {
      const k = ((rnd() * wordPts.length / 2) | 0) * 2;
      a[i * 3] = wordPts[k]; a[i * 3 + 1] = wordPts[k + 1]; a[i * 3 + 2] = gauss() * .015;
    }
    return a;
  };
  /* sample the pixels of the real <h2> (every text node, at its real position) */
  const sampleWords = () => {
    const h2 = $("h2", strip); if (!h2) return null;
    const sr = strip.getBoundingClientRect(), sc = .5;
    const c = document.createElement("canvas"); c.width = Math.max(2, Math.ceil(sr.width * sc)); c.height = Math.max(2, Math.ceil(sr.height * sc));
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.textBaseline = "middle";
    const tw = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const t = tw.currentNode, txt = t.nodeValue.replace(/\s+/g, " ").trim(); if (!txt) continue;
      const cs = getComputedStyle(t.parentElement), rg = document.createRange(); rg.selectNodeContents(t);
      const bb = rg.getBoundingClientRect(); if (!bb.width || !bb.height) continue;
      const T = cs.textTransform === "uppercase" ? txt.toUpperCase() : txt;
      g.font = cs.fontStyle + " " + cs.fontWeight + " " + (parseFloat(cs.fontSize) * sc) + "px " + cs.fontFamily;
      const w = Math.max(1, g.measureText(T).width);
      g.save(); g.translate((bb.left - sr.left) * sc, (bb.top - sr.top + bb.height / 2) * sc);
      g.scale(clamp(bb.width * sc / w, .6, 1.5), 1); g.fillText(T, 0, 0); g.restore();
    }
    let d; try { d = g.getImageData(0, 0, c.width, c.height).data; } catch (_) { return null; }
    const out = [], cw = c.width;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < cw; x += 2) if (d[(y * cw + x) * 4 + 3] > 110) out.push((x / sc - sr.width / 2) / base0, (y / sc - sr.height / 2) / base0);
    return out.length ? out : null;
  };

  /* ------------------------------ the hologram ------------------------------ */
  const ROT = [1, 0, 0, 0, 0, 1];          /* how much each shape spins in 3D (flat ones face the viewer) */
  const H0 = { n: COUNT, nDraw: COUNT, shapes: [], P: null, rate: null, sz: null, bk: null, mixS: 0, px: 0, py: 0, tpx: 0, tpy: 0 };
  const buildShapes = () => {
    const n = H0.n;
    if (!H0.rate) {
      H0.rate = new Float32Array(n); H0.sz = new Float32Array(n); H0.bk = new Uint8Array(n);
      for (let i = 0; i < n; i++) { H0.rate[i] = .045 + rnd() * .09; H0.sz[i] = .55 + rnd() * .9; H0.bk[i] = (rnd() * 16) | 0; }
    }
    H0.shapes = [cube(n), frame(n), slabShape(n, .86), wordsShape(n), slabShape(n, .86), ring(n)];
    if (!H0.P) H0.P = new Float32Array(H0.shapes[0]);
  };

  /* the whole timeline, a function of `a` = screen heights since the top of the 07 block reached the top of the screen */
  const fld = k => (window.__scFields && window.__scFields[k]) || null;
  const MK = () => [[-1.12, 0], [-.05, 1], [.55, 2], [.98, 3], [1.38, 4], [D7 + .05, 4], [D7 + .8, 5]];
  const mixAt = a => {
    const k = MK();
    if (a <= k[0][0]) return 0;
    for (let i = 0; i < k.length - 1; i++) if (a <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], (a - k[i][0]) / (k[i + 1][0] - k[i][0]));
    return k[k.length - 1][1];
  };
  const state = a => {
    const pf = fld("process"), bf = fld("brief");
    const c0x = pf ? pf.cx : (isAr() ? .3 : .7), c0y = pf ? pf.cy : .5;
    const rx = bf ? bf.cx : (isAr() ? .26 : .74), ry = bf ? bf.cy : .5;
    const kr = (bf ? bf.scale * bf.zoomS : .46) / (pf ? pf.scale : .4);
    let cx = .5, cy = .5, k = 1, ru = 0;
    if (a < -.05) { const u = clamp((a + 1.12) / 1.07, 0, 1); cx = lerp(c0x, .5, smooth(u)); cy = lerp(c0y, .5, smooth(u)) + .085 * Math.sin(Math.PI * u); }
    else if (a > D7 + .05) { const u = clamp((a - D7 - .05) / .75, 0, 1); ru = smooth(u); cx = lerp(.5, rx, smoother(u)); cy = lerp(.5, ry, smoother(u)) + .06 * Math.sin(Math.PI * u); k = lerp(1, kr, ru); }
    const alpha = smooth((a + 1.14) / .06) * (1 - smooth((a - (D7 + .78)) / .12));
    return { cx, cy, k, ru, alpha, m: mixAt(a), pa: 1 - smooth((a + 1.14) / .06), ba: smooth((a - (D7 + .78)) / .12), pf, bf };
  };

  const simulate = (m, dt, now) => {
    const S = H0.shapes, ns = S.length, P = H0.P, n = Math.min(H0.n, H0.nDraw);
    const mm = clamp(m, 0, ns - 1), i0 = Math.min(Math.floor(mm), ns - 2), f = smoother(mm - i0), A = S[i0], B = S[i0 + 1];
    for (let i = 0; i < n; i++) {
      const k = i * 3, r = 1 - Math.pow(1 - H0.rate[i], dt);
      const wx = Math.sin(now * .0009 + i * 1.7) * .014, wy = Math.cos(now * .0011 + i * 2.3) * .014;
      P[k] += (A[k] + (B[k] - A[k]) * f + wx - P[k]) * r;
      P[k + 1] += (A[k + 1] + (B[k + 1] - A[k + 1]) * f + wy - P[k + 1]) * r;
      P[k + 2] += (A[k + 2] + (B[k + 2] - A[k + 2]) * f - P[k + 2]) * r;
    }
    return { i0, f };
  };

  const draw = (st, now, dt) => {
    const mm = clamp(H0.mixS, 0, H0.shapes.length - 1), i0 = Math.min(Math.floor(mm), H0.shapes.length - 2), f = smoother(mm - i0);
    const rot = lerp(ROT[i0], ROT[i0 + 1], f);
    const kp = 1 - Math.pow(.94, dt); H0.px += (H0.tpx - H0.px) * kp; H0.py += (H0.tpy - H0.py) * kp;
    const spin = lerp(st.pf ? st.pf.spin : 1, st.bf ? st.bf.spin : 1, st.ru), en = lerp(st.pf ? st.pf.energy : 0, st.bf ? st.bf.energy : 0, st.ru);
    const yaw = (now * .00011 * spin * (1 + en * 3) + H0.px * .7) * rot + H0.px * .08 * (1 - rot);
    const pit = (-.18 + H0.py * .35) * rot + H0.py * .05 * (1 - rot);
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
    const pal = mixPal(st.pf && st.pf.pal ? st.pf.pal : DEF0, st.bf && st.bf.pal ? st.bf.pal : DEF1, st.ru); setPalette(pal);
    const bs = base0 * st.k * (st.bf && st.ru > .5 ? 1 : 1), cx = W * st.cx * dpr, cy = H * st.cy * dpr, d = dpr, P = H0.P;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = "lighter";
    /* soft hologram haze behind the particles */
    const R = bs * d * 1.35, gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    gr.addColorStop(0, "rgba(" + pal[1].join(",") + ",.085)"); gr.addColorStop(.6, "rgba(" + pal[0].join(",") + ",.04)"); gr.addColorStop(1, "rgba(" + pal[0].join(",") + ",0)");
    ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    const nd = Math.min(H0.n, H0.nDraw), boost = H0.n / nd;
    for (let i = 0; i < nd; i++) {
      const k = i * 3, x = P[k], y = P[k + 1], z = P[k + 2];
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const s = F / (F + z2), X = cx + x1 * bs * d * s, Y = cy + y2 * bs * d * s;
      const sz = 2.5 * d * s * H0.sz[i] * (1 + en * .8) * Math.min(1.5, boost);
      ctx.globalAlpha = clamp(.2 + .8 * (s - .6) * 1.6, .12, 1);
      ctx.drawImage(sprites[H0.bk[i]], X - sz, Y - sz, sz * 2, sz * 2);
    }
    ctx.globalAlpha = 1;
  };

  /* ------------------------------ layout / drive ------------------------------ */
  const geom = () => {
    vh = innerHeight || 1; W = root.clientWidth; H = vh; dpr = Math.min(devicePixelRatio || 1, 1.75);
    base0 = Math.min(W, H) * .4;
  };
  const layout = () => {
    if (!on) return;
    geom();
    wrap.style.setProperty("--fl-w", W + "px");
    wrap.style.height = Math.round(vh * (1 + D7)) + "px";
    strip.style.height = vh + "px";
    const sx = Math.round(W * .045), sy = 150, sw = Math.round(W * .91), sh = Math.max(300, vh - sy - 34);
    strip.style.setProperty("--fl-sx", sx + "px"); strip.style.setProperty("--fl-sy", sy + "px");
    strip.style.setProperty("--fl-sw", sw + "px"); strip.style.setProperty("--fl-sh", sh + "px");
    slab = { hw: sw / 2 / base0, hh: sh / 2 / base0, cy: (sy + sh / 2 - vh / 2) / base0 };
    cv.width = Math.round(W * dpr); cv.height = Math.round(vh * dpr);
    wordPts = null; buildShapes();
    /* the real title needs a frame to settle before it can be sampled */
    requestAnimationFrame(() => { if (!on) return; wordPts = sampleWords(); buildShapes(); lastA = null; kick(); });
    kick();
  };
  const aNow = () => -wrap.getBoundingClientRect().top / (vh || 1);

  const drive = (a, st) => {
    const s = strip.style;
    s.setProperty("--fl-k", smooth((a - .15) / .3).toFixed(3));
    s.setProperty("--fl-card", smooth((a - .3) / .45).toFixed(3));
    s.setProperty("--fl-t", smooth((a - .62) / .4).toFixed(3));
    s.setProperty("--fl-rise", smoother((a - .95) / .5).toFixed(3));
    s.setProperty("--fl-sp", smoother((a - 1.3) / .5).toFixed(3));
    root.style.setProperty("--fl-pa", st.pa.toFixed(3)); root.style.setProperty("--fl-ba", st.ba.toFixed(3));
    const cyc = a > 1.85 && a < D7 + .3;
    if (cyc && !cycleT) cycleT = setInterval(() => { if (!hover && !document.hidden) stepFan(1); }, 2900);
    else if (!cyc && cycleT) { clearInterval(cycleT); cycleT = 0; }
  };

  const tick = now => {
    raf = 0;
    if (!on) return;
    const ms = lastT ? clamp(now - lastT, 4, 250) : 16.7; lastT = now; const dt = clamp(ms / 16.667, .5, 8);
    ema = ema * .9 + ms * .1;
    const a = aNow(), st = state(a);
    drive(a, st);
    if (st.alpha < .004) { cv.style.opacity = 0; lastT = 0; lastA = a; return; }
    cv.style.opacity = st.alpha.toFixed(3);
    if (!H0.P) buildShapes();
    const jump = lastA === null || Math.abs(a - lastA) > .6; lastA = a;
    if (jump) { H0.mixS = st.m; for (let i = 0; i < 36; i++) simulate(st.m, 1, now - (36 - i) * 16); }
    H0.mixS += (st.m - H0.mixS) * (1 - Math.pow(.88, dt));
    simulate(H0.mixS, dt, now);
    if (ema > 34 && H0.nDraw > 420) H0.nDraw = Math.max(420, Math.floor(H0.nDraw * .985));
    draw(st, now, dt);
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (on && !raf) raf = requestAnimationFrame(tick); };

  /* ------------------------------ the fan ------------------------------ */
  const ICONS = {
    fb: '<svg viewBox="0 0 24 24"><path d="M14 8V6.5c0-.7.3-1 1-1h2V2h-3c-3 0-4.5 1.8-4.5 4.4V8H7v3.5h2.5V22H14V11.5h2.7L17 8z"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4zM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM17.3 5.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"/></svg>',
    tt: '<svg viewBox="0 0 24 24"><path d="M16.6 2h-3.3v13.2a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9a6.3 6.3 0 1 0 5.3 6.2V8.6a7.6 7.6 0 0 0 4.4 1.4V6.7A4.4 4.4 0 0 1 16.6 2z"/></svg>',
    ps: '<svg viewBox="0 0 24 24"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm4 4v10h1.7v-3.6h1.9c2 0 3.2-1.1 3.2-3.2S13.6 7 11.6 7zm1.7 1.5h1.7c1 0 1.6.5 1.6 1.7s-.6 1.7-1.6 1.7H9.7zm7.2 3.6c-1.3 0-2 .6-2 1.5 0 2 2.7 1.4 2.7 2.4 0 .4-.4.6-1 .6-.6 0-1.1-.2-1.5-.5v1.3c.5.2 1 .3 1.6.3 1.4 0 2.3-.6 2.3-1.6 0-2.1-2.6-1.4-2.6-2.4 0-.3.3-.5.8-.5.4 0 .8.1 1.1.3v-1.2c-.3-.1-.7-.2-1.1-.2z"/></svg>'
  };
  const kindOf = h => /instagram/.test(h) ? "ig" : /tiktok/.test(h) ? "tt" : /groups/.test(h) ? "ps" : "fb";
  const handleOf = (k, h) => k === "ig" ? "@120tiamo120" : k === "tt" ? "@tiamo.mohamad" : k === "ps" ? "Facebook group" : "tiamo.mohamad";
  const nameOf = (k, a) => (a.textContent || "").replace(/[↗↖]/g, "").trim() || k;

  const buildFan = () => {
    links = $(".social-links", strip); if (!links) return;
    anchors = Array.from(links.querySelectorAll("a")); anchorHTML = anchors.map(a => a.innerHTML);
    const decos = [["fl-d0", "AI ART"], ["fl-d1", "VFX"], ["fl-d2", "MOTION"]];
    const cards = [];
    anchors.forEach((a, i) => {
      const k = kindOf(a.href), nm = nameOf(k, a);
      a.classList.add("fl-face", "fl-" + k); a.setAttribute("aria-label", nm);
      a.innerHTML = '<span class="fl-bg"></span><i class="fl-ico">' + ICONS[k] + '</i><em class="fl-go">↗</em><b>' + nm + '</b><small>' + handleOf(k, a.href) + '</small><span class="fl-ph"></span>';
      cards.push(a); if (decos[i]) { const d = document.createElement("div"); d.className = "fl-face " + decos[i][0]; d.setAttribute("aria-hidden", "true"); d.innerHTML = '<span class="fl-bg"></span><b class="fl-big">' + decos[i][1] + '</b><small>Tiamo Mohamad</small><span class="fl-ph"></span>'; cards.push(d); }
    });
    slots = cards.map((face, i) => {
      const s = document.createElement("div"); s.className = "fl-slot"; s.dataset.i = i;
      links.appendChild(s); s.appendChild(face); return s;
    });
    focus = 0; placeFan(true);
    links.addEventListener("pointerenter", () => { hover = true; });
    links.addEventListener("pointerleave", () => { hover = false; });
  };
  const slotOf = (i) => { const n = slots.length; return ((((i - focus) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2); };
  const placeFan = first => {
    slots.forEach((s, i) => {
      const v = slotOf(i), old = +(s.dataset.v || 0);
      s.style.zIndex = 20 - Math.abs(v);
      if (!first && Math.abs(v - old) > slots.length / 2) {      /* the card that wraps from one end to the other: hop unseen */
        s.classList.add("fl-jump"); s.style.setProperty("--slot", v);
        requestAnimationFrame(() => requestAnimationFrame(() => s.classList.remove("fl-jump")));
      } else s.style.setProperty("--slot", v);
      s.dataset.v = v;
    });
  };
  const stepFan = d => { if (!slots.length) return; focus = (focus + d + slots.length) % slots.length; placeFan(false); };
  const unbuildFan = () => {
    anchors.forEach((a, i) => { a.classList.remove("fl-face", "fl-fb", "fl-ig", "fl-tt", "fl-ps"); a.removeAttribute("aria-label"); a.innerHTML = anchorHTML[i]; if (links) links.appendChild(a); });
    slots.forEach(s => s.remove()); slots = []; anchors = []; anchorHTML = [];
  };

  /* ------------------------------ enable / disable ------------------------------ */
  const onPointer = e => {
    const nx = (e.clientX / (innerWidth || 1) - .5) * 2, ny = (e.clientY / (innerHeight || 1) - .5) * 2;
    H0.tpx = nx * (isAr() ? -1 : 1); H0.tpy = ny;
  };
  const lenisTo = (y, dur) => { const l = window.__lenis; if (l && l.scrollTo) l.scrollTo(y, { duration: dur }); else scrollTo({ top: y, behavior: "smooth" }); };
  const contactY = () => wrap.getBoundingClientRect().top + scrollY + 1.9 * vh;
  /* the page above shifts a little after the first scroll (About pin), so a long jump can land off target:
     after the glide ends, check where we are and re-aim once or twice (silent, short) */
  const reaim = (calc, ok) => [1900, 3300].forEach(ms => setTimeout(() => { if (!on) return; if (!ok()) lenisTo(calc(), .7); }, ms));
  const goContact = () => {
    const y = contactY();
    if (Math.abs(y - scrollY) > vh * .9) window.__tmJumpUntil = performance.now() + 1700;
    lenisTo(y, 1.5);
    reaim(contactY, () => { const a = aNow(); return a > 1.5 && a < 2.4; });
    setTimeout(() => { try { window.__updateActiveNav && window.__updateActiveNav(); } catch (_) {} }, 500);
  };
  const onClick = e => {
    const t = e.target.closest && e.target.closest('a[href="#contact"],a[href="#process"],a[href="#brief"]');
    if (!t || !on) return;
    const id = t.getAttribute("href").slice(1);
    if (id === "contact") {
      e.preventDefault(); e.stopImmediatePropagation();
      try { window.playNavSound && t.closest("#nav") && window.playNavSound(); } catch (_) {}
      history.pushState(null, "", "#contact"); goContact();
    } else {                              /* process / brief: the site's own jump runs; we only make sure it ends exactly under the header */
      const el = document.getElementById(id), want = () => el.getBoundingClientRect().top;
      reaim(() => scrollY + want() - 70, () => Math.abs(want() - 70) < 24);
    }
  };

  const enable = () => {
    if (on) return;
    on = true;
    wrap = document.createElement("div"); wrap.className = "fl7-wrap";
    strip.parentNode.insertBefore(wrap, strip); wrap.appendChild(strip);
    cv = document.createElement("canvas"); cv.id = "flCv"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv); ctx = cv.getContext("2d");
    root.classList.add("fl-on");
    buildFan();
    H0.nDraw = COUNT; lastA = null; lastT = 0;
    layout();
  };
  const disable = () => {
    if (!on) return;
    on = false;
    cancelAnimationFrame(raf); raf = 0; clearInterval(cycleT); cycleT = 0;
    unbuildFan();
    root.classList.remove("fl-on");
    ["--fl-pa", "--fl-ba"].forEach(p => root.style.removeProperty(p));
    ["--fl-k", "--fl-card", "--fl-t", "--fl-rise", "--fl-sp", "--fl-sx", "--fl-sy", "--fl-sw", "--fl-sh"].forEach(p => strip.style.removeProperty(p));
    strip.style.removeProperty("height");
    if (wrap && wrap.parentNode) { wrap.parentNode.insertBefore(strip, wrap); wrap.remove(); }
    if (cv) cv.remove(); wrap = cv = ctx = null;
  };
  const sync = () => (mq.matches && !rm.matches ? enable() : disable());

  let rz = 0;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { sync(); layout(); }, 120); }, { passive: true });
  addEventListener("scroll", kick, { passive: true });
  addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("click", onClick, true);
  document.addEventListener("visibilitychange", () => { lastT = 0; kick(); });
  (mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync));
  (rm.addEventListener ? rm.addEventListener("change", sync) : rm.addListener(sync));
  new MutationObserver(() => setTimeout(layout, 160)).observe(root, { attributes: true, attributeFilter: ["lang"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(layout, 60));
  addEventListener("load", () => setTimeout(layout, 120));
  window.__flow = { get on() { return on; }, aNow: () => (on ? aNow() : null), D7 };
  sync();
})();
