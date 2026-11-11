/* ==========================================================================
   TM PORTAL v2 — a real hyper-jump from the intro disc to the TM disc on Home
   (a procedural canvas scene: nothing is a pasted picture that just fades)

   0-350      CHARGE   the disc wakes: rotating light arcs, a bloom, camera trembles
   350-1000   IGNITION a shock wave leaves the disc and the tunnel is revealed BY the wave
   250-1900   ACCEL    the camera accelerates: the tunnel rushes (looping zoom of 3 copies, alternating roll,
                       zoom-blur), speed streaks, every rock flies out on its own depth with motion blur
   1750-2250  FLASH    one soft flash while the intro tunnel glides onto the home disc
   1500-3350  BRAKE    the home tunnel decelerates onto the home disc (exactly ring-locked, roll back to 0)
   3300-4500  LAND     impact: shake + two shock waves erase the tunnel outwards, the TM disc is revealed,
                       the last rocks drift away. Then the canvas is removed: Home is untouched.

   One speed curve v(e) drives everything (tunnel zoom, streaks, rocks, blur, shake), so the whole scene
   accelerates and brakes as ONE camera. Nothing in tm-intro.js is touched: it only READS
   window.__tmIntroState().  Geometry: intro disc R = rect.w / 1600 * 234.5, centre = zoom centre; the tunnel
   pictures are scaled by 0.68 (measured: their rings are the intro's rings) so ring lands on ring.
   Set window.__tmPortalOff = true to disable.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__tmPortal || window.__tmPortalOff) return;
  const gate = document.getElementById("enterGate"), stage = document.getElementById("tmIntroStage");
  if (!gate || !stage || !gate.classList.contains("tm-intro")) return;
  window.__tmPortal = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOut5 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ramp = (e, a, b) => easeOut((e - a) / (b - a));
  const gone = (e, a, b) => 1 - easeInOut((e - a) / (b - a));
  const bez = (x1, y1, x2, y2) => (t) => {            /* css cubic-bezier, for the Home picture's own settle */
    t = clamp(t, 0, 1); let u = t;
    for (let i = 0; i < 6; i++) { const c = 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u - t, d = 3 * x1 * (1 - u) * (1 - u) + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u; if (Math.abs(d) < 1e-6) break; u = clamp(u - c / d, 0, 1); }
    return 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  };
  const homeBez = bez(0.16, 1, 0.3, 1);
  const rng = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;

  const IMG_W = 1600, DISC_R = 234.5, ZOOM_MAX = 2.4, PUSH = 1500, END = 4600, HANDOFF = 1910;
  const FIT = 0.68;                         /* tunnel ring radii / intro ring radii (measured) */
  const DEF = {
    i1: { src: "images/portal-intro-1.webp", w: 1280, h: 853,  cx: 640, cy: 413, r: DISC_R * FIT },
    i2: { src: "images/portal-intro-2.webp", w: 1536, h: 1024, cx: 767, cy: 495, r: DISC_R * FIT * 1.2 },
    h3: { src: "images/portal-home-3.webp",  w: 1536, h: 1024, cx: 766, cy: 480, r: DISC_R * FIT * 1.2 * 0.985 },
    h4: { src: "images/portal-home-4.webp",  w: 1280, h: 853,  cx: 639, cy: 399, r: DISC_R * FIT * 0.985 },
    rk: { src: "images/portal-rocks-atlas.webp", w: 1024, h: 332 }
  };
  /* rock atlas (RGBA cut-outs of picture 5): x, y, w, h  — real alpha, so no dark box around a rock */
  const ATL = [[0,0,158,131],[160,0,130,131],[292,0,123,113],[417,0,135,97],[554,0,118,101],[674,0,105,103],[781,0,74,88],[857,0,84,75],[943,0,75,83],[0,133,79,78],[81,133,82,74],[165,133,81,71],[248,133,87,64],[337,133,77,66],[416,133,78,64],[496,133,78,62],[576,133,67,71],[645,133,84,54],[731,133,67,63],[800,133,64,65],[866,133,65,62],[933,133,67,60],[0,213,63,62],[65,213,62,56],[129,213,54,62],[185,213,58,57],[245,213,63,52],[310,213,61,53],[373,213,57,56],[432,213,61,52],[495,213,62,51],[559,213,58,53],[619,213,55,54],[676,213,55,53],[733,213,53,55],[788,213,66,44],[856,213,54,50],[912,213,58,46],[0,277,52,51],[54,277,53,50],[109,277,60,43],[171,277,60,42],[233,277,48,52],[283,277,47,53],[332,277,50,48],[384,277,50,48],[436,277,53,45]];
  const BIG = [0, 1, 2, 4, 5, 7, 8, 9, 10, 12, 15, 17], SMALL = [16, 20, 21, 23, 24, 26, 28, 29, 33, 34, 38, 39, 41, 42, 45, 46], EMB = [18, 27, 30, 40];

  /* the old random tunnel / surge pictures of the Enter flash are replaced by this scene */
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) {
    if (n.nodeType !== 1 || !n.querySelectorAll) continue;
    n.querySelectorAll("div").forEach((d) => { if (/dive-(tunnel|surge)/.test(d.style.cssText)) d.style.display = "none"; });
  } }).observe(document.body, { childList: true });

  /* ---- assets: loaded early, tunnel pictures get feathered edges once, rocks are cut into sprites once ---- */
  const A = { img: {}, tun: {}, spr: null, ok: false };
  const feather = (im, d) => {
    const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    g.globalCompositeOperation = "destination-in";
    let lg = g.createLinearGradient(0, 0, c.width, 0); lg.addColorStop(0, "transparent"); lg.addColorStop(0.2, "#000"); lg.addColorStop(0.8, "#000"); lg.addColorStop(1, "transparent"); g.fillStyle = lg; g.fillRect(0, 0, c.width, c.height);
    lg = g.createLinearGradient(0, 0, 0, c.height); lg.addColorStop(0, "transparent"); lg.addColorStop(0.2, "#000"); lg.addColorStop(0.8, "#000"); lg.addColorStop(1, "transparent"); g.fillStyle = lg; g.fillRect(0, 0, c.width, c.height);
    return c;
  };
  const load = () => {
    if (A.loading) return; A.loading = true;
    let n = Object.keys(DEF).length;
    for (const k in DEF) {
      const im = new Image(); im.decoding = "async";
      im.onload = () => {
        if (k === "rk") { A.atlas = im;
        } else A.tun[k] = feather(im);
        if (--n === 0) A.ok = true;
      };
      im.src = DEF[k].src; A.img[k] = im;
    }
  };
  if (window.requestIdleCallback) requestIdleCallback(load, { timeout: 2500 }); else setTimeout(load, 1200);

  /* where the HOME disc will be (same formulas as tm-intro.js layout(), "home" branch) */
  const homeGeom = (S) => {
    const hero = document.querySelector(".hero"); if (!hero) return null;
    const r = hero.getBoundingClientRect(), W = Math.max(2, r.width), H = Math.max(2, r.height);
    if (S && S.mode === "home") return { cx: r.left + S.zc[0], cy: r.top + S.zc[1], R: S.rect[2] / IMG_W * DISC_R };
    const wide = innerWidth > 900, target = clamp(Math.min(H * 0.62, W * (wide ? 0.50 : 0.80)), 220, 640);
    const rtl = document.documentElement.dir === "rtl" || document.documentElement.lang === "ar";
    return { cx: r.left + (wide ? W * (rtl ? 0.32 : 0.68) : W * 0.5), cy: r.top + (wide ? H * 0.5 : H * 0.42), R: target / 2 };
  };

  /* ---------------------------------------------------------------- the scene */
  const KP = 1.45;                           /* radial law of rocks / streaks: r = r0 * exp(KP * travel) */
  let cv = null, g = null, tn = null, tg = null, dpr = 1, VW = 0, VH = 0, enterT = 0, done = false, I = null, Hm = null;
  let Ptab = null, Pend = 1, rocksA = null, rocksB = null, rocksS = null, streaks = null;
  const v = (e) => ramp(e, 200, 1300) * gone(e, 1900, 3350);                /* THE speed curve (0 -> 1 -> 0) */
  const buildTables = () => {
    Ptab = new Float32Array(END + 2); let p = 0;
    for (let i = 1; i <= END + 1; i++) { p += v(i) / 1000; Ptab[i] = p; }
    Pend = Ptab[END];
  };
  const P = (e) => Ptab[clamp(Math.round(e), 0, END)];
  const buildActors = () => {
    const r = rng(20261111), pick = (arr) => arr[(r() * arr.length) | 0];
    /* A · chunks of the intro's stone rings: they sit where the rings are, and are blasted off when the shock wave reaches them */
    rocksA = Array.from({ length: 20 }, () => {
      const r0 = 1.3 + r() * 1.55, x = clamp((r0 - 0.95) / 6.5, 0, 0.999);
      return { i: pick(BIG.concat(SMALL.slice(0, 5))), a: r() * 6.2832, r0, m: 1.0 + r() * 0.9, d: 0.75 + r() * 0.6, rot: r() * 6.2832, sp: (r() < 0.5 ? -1 : 1) * (1.4 + r() * 2.4), tw: 330 + 900 * (1 - Math.pow(1 - x, 1 / 3)) + r() * 50 };
    });
    /* S · debris that streams past the camera during the jump (small rocks + glowing embers) */
    rocksS = Array.from({ length: 28 }, () => { const em = r() < 0.2; return { i: em ? pick(EMB) : pick(SMALL), em, a: r() * 6.2832, l0: Math.log(0.22) + r() * 3.4, d: 0.8 + r() * 0.9, m: 0.8 + r() * 0.8, rot: r() * 6.2832, sp: (r() - 0.5) * 3 }; });
    /* B · they arrive around the home disc (right / top / bottom, never over the text), then the landing wave throws them off */
    rocksB = []; while (rocksB.length < 14) {
      const a = r() * 6.2832, r1 = 1.3 + r() * 1.2; if (Math.cos(a) < -0.3 && r1 > 1.7) continue;
      const x = clamp((r1 - 0.9) / 6.2, 0, 0.999);
      rocksB.push({ i: pick(BIG.concat(SMALL.slice(0, 4))), a, r1, m: 1.0 + r() * 0.9, d: 0.8 + r() * 0.6, rot: r() * 6.2832, sp: (r() < 0.5 ? -1 : 1) * (1.2 + r() * 2), tH: 3300 + 1050 * (1 - Math.pow(1 - x, 1 / 3)) + r() * 40 });
    }
    streaks = Array.from({ length: 200 }, () => ({ a: r() * 6.2832, l0: Math.log(0.16) + r() * 3.5, w: 0.6 + r() * 1.5, len: 0.6 + r() * 1.2, hot: r() < 0.1 }));
  };

  const start = (S, now) => {
    enterT = now; const sr = stage.getBoundingClientRect();
    I = { cx: sr.left + S.zc[0], cy: sr.top + S.zc[1], R: S.rect[2] / IMG_W * DISC_R };
    VW = innerWidth; VH = innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true"); cv.width = Math.round(VW * dpr); cv.height = Math.round(VH * dpr);
    cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:10002;pointer-events:none;will-change:transform";
    g = cv.getContext("2d"); tn = document.createElement("canvas"); tn.width = cv.width; tn.height = cv.height; tg = tn.getContext("2d");
    document.body.appendChild(cv); buildTables(); buildActors();
  };

  /* tunnel picture ring-locked on (cx,cy): radius `R` = disc radius, then zoomed `s` and rolled `rot` about the centre */
  const tunnel = (c, key, cx, cy, R, s, rot, a) => {
    const d = DEF[key], im = A.tun[key]; if (!im || a < 0.004) return;
    const k = R / d.r; c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(s, s); c.globalAlpha = clamp(a, 0, 1);
    c.drawImage(im, -d.cx * k, -d.cy * k, d.w * k, d.h * k); c.restore();
  };
  const radial = (c, cx, cy, r0, r1, stops) => { const gr = c.createRadialGradient(cx, cy, Math.max(0, r0), cx, cy, Math.max(r0 + 1, r1)); stops.forEach(([o, col]) => gr.addColorStop(o, col)); return gr; };
  const eraseInside = (c, cx, cy, r, soft) => {               /* destination-out: nothing survives inside r */
    if (r <= 0.5) return; c.save(); c.globalCompositeOperation = "destination-out"; c.fillStyle = radial(c, cx, cy, Math.max(0, r - soft), r + soft * 0.4, [[0, "rgba(0,0,0,1)"], [1, "rgba(0,0,0,0)"]]); c.fillRect(0, 0, VW, VH); c.restore();
  };
  const keepInside = (c, cx, cy, r, soft) => {               /* destination-in: only what is inside r survives (the wave reveals) */
    c.save(); c.globalCompositeOperation = "destination-in"; c.fillStyle = radial(c, cx, cy, Math.max(0, r - soft), r, [[0, "rgba(0,0,0,1)"], [1, "rgba(0,0,0,0)"]]); c.fillRect(0, 0, VW, VH); c.restore();
  };
  const shock = (cx, cy, R, e, t0, amp, a0) => {               /* a thin expanding ring (perspective-flattened like the art) */
    const t = (e - t0) / 1000; if (t < 0 || t > 1) return;
    const r = R * (1 + amp * easeOut(t)), al = a0 * Math.pow(1 - t, 1.4);
    g.save(); g.globalCompositeOperation = "lighter"; g.lineWidth = Math.max(1, 5 * (1 - t) + 1);
    g.strokeStyle = "rgba(170,215,255," + al.toFixed(3) + ")"; g.shadowColor = "rgba(70,140,255," + al.toFixed(3) + ")"; g.shadowBlur = 18;
    g.beginPath(); g.ellipse(cx, cy, r, r * 0.9, 0, 0, 6.2832); g.stroke(); g.restore();
  };
  const spr = (i, x, y, w, rot, al, comp) => {
    const t = ATL[i], h = w * t[3] / t[2]; g.save(); g.globalAlpha = clamp(al, 0, 1); g.globalCompositeOperation = comp; g.translate(x, y); g.rotate(rot);
    g.drawImage(A.atlas, t[0], t[1], t[2], t[3], -w / 2, -h / 2, w, h); g.restore();
  };
  /* a solid rock (real alpha) with motion blur along its flight line, an emissive glow when it is hit, and a pop */
  const rock = (k, cx, cy, Rr, r, ang, rot, al, glow, pop, mv, jx, jy) => {
    if (al < 0.01 || r < 0.05 || r > 7.5) return;
    const base = ATL[k.i][2] / 1536 * 7.4 * Rr * k.m * 1.5, sc = (rr) => base * (0.6 + 0.4 * rr) * pop;
    const pos = (rr) => [cx + Math.cos(ang) * rr * Rr + (jx || 0), cy + Math.sin(ang) * rr * Rr * 0.86 + (jy || 0)];
    const comp = k.em ? "lighter" : "source-over", n = mv > 0.08 ? 1 + Math.min(4, Math.floor(mv * 5)) : 1;
    if (mv > 0.12) { const p0 = pos(r * Math.exp(-0.2 * mv)), p1 = pos(r); g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round"; g.strokeStyle = "rgba(150,200,255," + (0.35 * al * Math.min(1, mv)).toFixed(3) + ")"; g.lineWidth = Math.max(1.5, sc(r) * 0.12); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); g.restore(); }
    for (let j = n - 1; j >= 1; j--) { const rr = r * Math.exp(-0.1 * mv * j), p = pos(rr); spr(k.i, p[0], p[1], sc(rr), rot - j * 0.04, al * 0.32, comp); }
    const p = pos(r); spr(k.i, p[0], p[1], sc(r), rot, al, comp);
    if (glow > 0.02) spr(k.i, p[0], p[1], sc(r) * 1.1, rot, glow * 0.85, "lighter");
  };

  const frame = (now) => {
    if (done) return;
    requestAnimationFrame(frame);
    if (document.hidden || !window.__tmIntroState) return;
    const S = window.__tmIntroState(); if (!S) return;
    if (!enterT) {
      if (!(window.__tmGoing || gate.classList.contains("tm-go"))) return;
      if (reduce || S.flat || !S.texDone) { done = true; return; }
      start(S, now);
    }
    if (!A.ok) { if (now - enterT > 600 && !A.ok) { /* assets never came: do not block the old transition */ } }
    const e = window.__tmPortalT != null ? window.__tmPortalT : now - enterT;
    if (e > END) { try { cv.remove(); } catch (_) {} done = true; return; }
    const G = homeGeom(S); if (G) Hm = G;
    if (!Hm || !A.ok) return;

    const sp = v(e), p = P(e), q = Pend - p;
    const gl = easeInOut((e - 900) / 1700);                                   /* the vanishing point glides from the intro disc to the home disc */
    const cx = lerp(I.cx, Hm.cx, gl), cy = lerp(I.cy, Hm.cy, gl), Rref = lerp(I.R, Hm.R, gl);
    const Z = S.mode === "intro" ? 1 + S.zoomV : 1 + ZOOM_MAX * easeInOut(e / PUSH);
    const hs = e < HANDOFF ? 1.32 : 1 + 0.32 * (1 - homeBez((e - HANDOFF) / 3200));   /* the Home picture settles from 1.32: the disc is bigger until then */
    const Rb = Hm.R * hs;

    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, VW, VH);
    /* camera shake: it trembles while charging, shudders with speed, and takes the landing hit */
    const imp = (t0, amp, d) => { const t = e - t0; return t > 0 ? amp * Math.exp(-t / d) : 0; };
    const sh = 1.2 * smooth(0, 330, e) * (1 - smooth(330, 420, e)) * 2 + imp(350, 7, 160) + 2.4 * sp + imp(3340, 9, 190);
    cv.style.transform = "translate3d(" + (Math.sin(e * 0.093) * sh + Math.sin(e * 0.37) * sh * 0.35).toFixed(2) + "px," + (Math.cos(e * 0.081) * sh).toFixed(2) + "px,0) rotate(" + (Math.sin(e * 0.05) * sh * 0.0009).toFixed(5) + "rad) scale(1.02)";

    /* ---- the tunnel of the intro: revealed BY the shock wave, then it rushes ---- */
    {
      const wave = I.R * (0.95 + 6.5 * easeOut((e - 330) / 900)), hA = 0.95 * (1 - easeInOut((e - 450) / 700));
      const cyc = 2.3 * p, mix = smooth(0.0, 0.45, sp), fadeA = gone(e, 1700, 2500), Zc = lerp(Z, 1.5, smooth(250, 900, e));   /* after the first moments the camera keeps the tunnel at a readable size */
      tg.setTransform(dpr, 0, 0, dpr, 0, 0); tg.clearRect(0, 0, VW, VH); tg.globalCompositeOperation = "lighter";
      if (e > 330 && fadeA > 0.005) {
        for (let c = 0; c < 3; c++) {
          const ph = (cyc + c / 3) % 1, win = Math.pow(Math.sin(Math.PI * ph), 1.4);
          const al = lerp(c === 0 ? 1 : 0, win * 1.25, mix), s = Zc * Math.pow(2.0, ph), roll = (c % 2 ? -1 : 1) * 0.75 * p;
          const key = c === 1 ? "i1" : (c === 2 ? "i2" : "i2");
          tunnel(tg, c === 0 ? "i1" : key, cx, cy, Rref, s, roll, al * 0.6 * ramp(e, 330, 800));
          if (sp > 0.3 && c === 0) { tunnel(tg, "i2", cx, cy, Rref, s * (1 + 0.05 * sp), -roll, 0.2 * sp); tunnel(tg, "i1", cx, cy, Rref, s * (1 - 0.04 * sp), roll * 1.2, 0.14 * sp); }
        }
        tg.globalCompositeOperation = "source-over";
        if (e < 1250) keepInside(tg, cx, cy, wave * Z, I.R * Z * 0.5);
        eraseInside(tg, cx, cy, Math.max(hA * I.R * Z, 0.34 * I.R * smooth(500, 1100, e) * Zc), I.R * 0.2 * Zc);   /* a dark depth in the middle: it reads as a tunnel, not as a blob of light */
        g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = fadeA * 0.9; g.drawImage(tn, 0, 0, VW, VH); g.restore();
      }
    }
    /* ---- charge: the disc wakes up (rotating arcs + bloom), then ignition ---- */
    if (e < 560) {
      const ch = smooth(0, 300, e) * (1 - smooth(340, 560, e)), r0 = I.R;
      g.save(); g.globalCompositeOperation = "lighter";
      g.fillStyle = radial(g, I.cx, I.cy, r0 * 0.6, r0 * 1.7, [[0, "rgba(120,185,255," + (0.30 * ch).toFixed(3) + ")"], [1, "rgba(30,70,200,0)"]]); g.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 3; i++) {
        const a0 = e * (0.012 + i * 0.006) * (i % 2 ? -1 : 1) + i * 2.1;
        g.strokeStyle = "rgba(190,225,255," + (0.85 * ch).toFixed(3) + ")"; g.lineWidth = 2.5 + i; g.shadowColor = "rgba(70,150,255,1)"; g.shadowBlur = 16;
        g.beginPath(); g.ellipse(I.cx, I.cy, r0 * (1.03 + i * 0.05), r0 * (1.03 + i * 0.05) * 0.9, 0, a0, a0 + 1.5); g.stroke();
      }
      g.restore();
    }
    shock(I.cx, I.cy, I.R, e, 330, 5.5, 0.9); shock(I.cx, I.cy, I.R, e, 470, 4.2, 0.6);

    /* ---- the tunnel of Home: it brakes onto the home disc, ring on ring, roll back to exactly 0 ---- */
    {
      const sB = Math.exp(1.9 * q), rollB = 0.85 * q, inB = ramp(e, 1500, 2300), disc = 0.97 * easeInOut((e - 2100) / 1500);
      const wl = e > 3300 ? Rb * (0.9 + 6.2 * easeOut((e - 3300) / 1050)) : 0;
      if (inB > 0.005 && e < END - 100) {
        tg.setTransform(dpr, 0, 0, dpr, 0, 0); tg.clearRect(0, 0, VW, VH); tg.globalCompositeOperation = "lighter";
        tunnel(tg, "h3", Hm.cx, Hm.cy, Rb, sB, rollB, 0.65 * inB);
        tunnel(tg, "h4", Hm.cx, Hm.cy, Rb, sB * 1.1, -rollB * 1.15, 0.7 * inB);
        if (sp > 0.15) { const ph = (2.3 * q) % 1; tunnel(tg, "h4", Hm.cx, Hm.cy, Rb, sB * Math.pow(1.9, ph), rollB * 0.6, 0.35 * sp * Math.sin(Math.PI * ph)); tunnel(tg, "h3", Hm.cx, Hm.cy, Rb, sB * (1 + 0.06 * sp), -rollB, 0.18 * sp); }
        tg.globalCompositeOperation = "source-over";
        eraseInside(tg, Hm.cx, Hm.cy, Math.max(disc * Rb * sB, wl, 0.34 * Rb * sB * smooth(1.2, 2.4, sB)), Rb * 0.18 * sB);   /* while it is still far: a dark depth, not a blob of light */
        g.save(); g.globalCompositeOperation = "lighter"; g.drawImage(tn, 0, 0, VW, VH); g.restore();
      }
    }

    /* ---- speed streaks: every one follows the same camera, so they stretch with v and relax when it brakes ---- */
    if (sp > 0.02) {
      const lmin = Math.log(0.16), L = 3.5, tail = (0.07 + 0.16 * sp) * KP;
      g.save(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
      for (const s of streaks) {
        const lr = lmin + ((s.l0 + KP * p - lmin) % L + L) % L, r1 = Math.exp(lr), r0 = Math.max(Math.exp(lmin), Math.exp(lr - tail * s.len));
        const al = Math.pow(sp, 0.85) * smooth(0.18, 0.6, r1) * (1 - smooth(3.4, 5.6, r1)) * (s.hot ? 1 : 0.8);
        if (al < 0.02) continue;
        const ca = Math.cos(s.a), sa = Math.sin(s.a) * 0.9;
        g.strokeStyle = s.hot ? "rgba(255,190,110," + al.toFixed(3) + ")" : "rgba(185,220,255," + al.toFixed(3) + ")";
        g.lineWidth = s.w * (0.6 + r1 * 0.9);
        g.beginPath(); g.moveTo(cx + ca * r0 * Rref, cy + sa * r0 * Rref); g.lineTo(cx + ca * r1 * Rref, cy + sa * r1 * Rref); g.stroke();
      }
      g.restore();
    }

    /* ---- rocks: stone chunks of the intro rings are blasted by the wave, debris streams past, then the home rocks arrive and are hit by the landing wave ---- */
    for (const k of rocksA) {
      const u = e - k.tw, vis = smooth(k.tw - 120, k.tw + 40, e) * gone(e, 2100, 2800); if (vis < 0.01) continue;
      const c = smooth(k.tw - 350, k.tw, e), dp = Math.max(0, P(e) - P(Math.max(0, k.tw)));
      const r = u < 0 ? k.r0 : k.r0 * Math.exp(0.5 * easeOut(u / 280) + KP * k.d * dp);
      const jx = u < 0 ? Math.sin(e * 0.2 + k.a * 9) * 2.4 * c : 0, jy = u < 0 ? Math.cos(e * 0.23 + k.a * 7) * 2.4 * c : 0;
      const ox = e < 900 ? I.cx : cx, oy = e < 900 ? I.cy : cy, Rr = e < 900 ? I.R : Rref;
      rock(k, ox, oy, Rr, r, k.a, k.rot + k.sp * (easeOut(Math.max(0, u) / 400) * 1.2 + dp * 3), vis * (1 - smooth(5.2, 7.4, r)), u > 0 ? Math.exp(-u / 320) : 0, 1 + (u < 0 ? 0.15 * c : 0.18 * Math.exp(-u / 140)), Math.max(sp * 0.9, u > 0 ? 0.9 * Math.exp(-u / 260) : 0), jx, jy);
    }
    {
      const lmin = Math.log(0.22), L = 3.55, inS = ramp(e, 450, 900) * gone(e, 2000, 2700);
      for (const k of rocksS) {
        const lr = lmin + ((k.l0 - lmin + KP * k.d * p) % L + L) % L, r = Math.exp(lr);
        rock(k, cx, cy, Rref, r, k.a, k.rot + k.sp * p, inS * smooth(0.22, 0.55, r) * (1 - smooth(5.2, 7.2, r)), 0, 1, sp, 0, 0);
      }
      const inB = ramp(e, 1650, 2300);
      for (const k of rocksB) {
        const u = e - k.tH, r = u < 0 ? k.r1 * Math.exp(-KP * k.d * q * 0.9) : k.r1 * (1 + 0.6 * easeOut(u / 900));
        const al = inB * smooth(0.12, 0.4, r) * (u > 0 ? gone(e, k.tH + 200, k.tH + 1000) : 1);
        rock(k, Hm.cx, Hm.cy, Rb, r, k.a, k.rot + k.sp * q + (u > 0 ? k.sp * easeOut(u / 700) * 2 : 0), al, u > 0 ? Math.exp(-u / 280) : 0, 1 + (u > 0 ? 0.2 * Math.exp(-u / 130) : 0), Math.max(sp, u > 0 ? 0.8 * Math.exp(-u / 260) : 0), 0, 0);
      }
    }

    /* ---- the one flash (soft, once) hides the swap between the two tunnels; the landing gets a small one ---- */
    const fl = 0.36 * Math.exp(-Math.pow((e - 1950) / 170, 2)) + 0.28 * Math.exp(-Math.pow((e - 3340) / 120, 2)) + 0.3 * Math.exp(-Math.pow((e - 430) / 70, 2));
    if (fl > 0.01) {
      const fx = e > 3000 ? Hm.cx : (e > 1500 ? lerp(I.cx, Hm.cx, 0.6) : I.cx), fy = e > 3000 ? Hm.cy : (e > 1500 ? lerp(I.cy, Hm.cy, 0.6) : I.cy);
      g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = radial(g, fx, fy, 0, Math.max(VW, VH) * 0.7, [[0, "rgba(235,246,255," + fl.toFixed(3) + ")"], [0.35, "rgba(110,170,255," + (fl * 0.5).toFixed(3) + ")"], [1, "rgba(20,50,160,0)"]]); g.fillRect(0, 0, VW, VH); g.restore();
    }
    shock(Hm.cx, Hm.cy, Rb, e, 3300, 6, 0.95); shock(Hm.cx, Hm.cy, Rb, e, 3430, 4.6, 0.6);
    /* the disc's rim lights up as the wave leaves it */
    const rim = Math.exp(-Math.max(0, e - 3320) / 380) * (e > 3300 ? 1 : 0);
    if (rim > 0.02) { g.save(); g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(190,225,255," + (0.8 * rim).toFixed(3) + ")"; g.lineWidth = 4; g.shadowColor = "rgba(70,150,255,1)"; g.shadowBlur = 22; g.beginPath(); g.ellipse(Hm.cx, Hm.cy, Rb * 1.0, Rb * 0.9, 0, 0, 6.2832); g.stroke(); g.restore(); }
    /* vignette that tightens at full speed: tunnel vision */
    if (sp > 0.05) { g.save(); g.fillStyle = radial(g, cx, cy, Math.min(VW, VH) * 0.3, Math.max(VW, VH) * 0.75, [[0, "rgba(2,5,16,0)"], [1, "rgba(2,5,16," + (0.55 * sp).toFixed(3) + ")"]]); g.fillRect(0, 0, VW, VH); g.restore(); }
  };
  requestAnimationFrame(frame);
})();
