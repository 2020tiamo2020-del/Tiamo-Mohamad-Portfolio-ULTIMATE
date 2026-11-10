/* ==========================================================================
   TM PORTAL — the gate between "Enter" (intro) and the TM disc on Home
   Only exists DURING the transition. Before Enter and after landing, nothing of it is on screen.

     Enter ──► 1 + 2 : the tunnel opens on the INTRO disc, the camera dives in (same zoom as the relief)
           ──► 5     : rocks fly past the camera the whole way
           ──► 3 + 4 : the tunnel arrives on the HOME disc, settles, and opens to reveal the TM disc

   Nothing in tm-intro.js is touched. It only READS window.__tmIntroState() (mode, zoom, rect, centre).
   Geometry: the TM disc is 469 px wide in the intro art, R = rect.w / 1600 * 234.5, centre = zoom centre.
   The tunnel pictures are the intro's own rings (disc + 3 stone rings) seen as a tunnel. Measured:
   tunnel ring radii / intro ring radii = ~0.68, so each picture is scaled so that its centre is on the
   disc centre and its rings fall on the intro's rings (FIT below).
   Set  window.__tmPortalOff = true  before this script to disable.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__tmPortal || window.__tmPortalOff) return;
  const gate = document.getElementById("enterGate");
  const stage = document.getElementById("tmIntroStage");
  if (!gate || !stage || !gate.classList.contains("tm-intro")) return;
  window.__tmPortal = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOut5 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const ramp = (e, a, b) => easeOut((e - a) / (b - a));              /* 0 -> 1 between a and b */
  const gone = (e, a, b) => 1 - easeInOut((e - a) / (b - a));        /* 1 -> 0 between a and b */

  const IMG_W = 1600, DISC_R = 234.5;      /* intro art: the disc is 469 px wide */
  const ZOOM_MAX = 2.4, PUSH = 1500;       /* same numbers as tm-intro.js: the camera push */
  const END = 4500;                        /* ms after Enter: everything is removed */

  /* Each picture: its centre (the bright core) and the radius that lands on the DISC of the intro art.
     Measured: tunnel image 1 has its rings at 0.66-0.70 of the intro's (disc / ring 1 / ring 2). */
  const FIT = 0.68;
  const DEF = {
    i1: { src: "images/portal-intro-1.webp", w: 1280, h: 853,  cx: 640, cy: 413, r: DISC_R * FIT },
    i2: { src: "images/portal-intro-2.webp", w: 1536, h: 1024, cx: 767, cy: 495, r: DISC_R * FIT * 1.2 },
    h3: { src: "images/portal-home-3.webp",  w: 1536, h: 1024, cx: 766, cy: 480, r: DISC_R * FIT * 1.2 * 0.985 },
    h4: { src: "images/portal-home-4.webp",  w: 1280, h: 853,  cx: 639, cy: 399, r: DISC_R * FIT * 0.985 },
    rk: { src: "images/portal-rocks.webp",   w: 1536, h: 1024 }
  };

  /* the old random tunnel / surge pictures of the Enter flash are replaced by this gate */
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType !== 1 || !n.querySelectorAll) continue;
      n.querySelectorAll("div").forEach((d) => { if (/dive-(tunnel|surge)/.test(d.style.cssText)) d.style.display = "none"; });
    }
  }).observe(document.body, { childList: true });

  /* preload so nothing pops in during the transition */
  const pre = {};
  const warm = () => { for (const k in DEF) { const im = new Image(); im.decoding = "async"; im.src = DEF[k].src; pre[k] = im; } };
  if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 3000 }); else setTimeout(warm, 1500);

  const mk = (def) => {
    const im = new Image(); im.decoding = "async"; im.alt = ""; im.draggable = false; im.setAttribute("aria-hidden", "true"); im.src = def.src;
    im.style.cssText = "position:absolute;max-width:none;pointer-events:none;user-select:none;mix-blend-mode:screen;opacity:0;will-change:transform,opacity";
    return im;
  };
  /* tunnel picture: its centre on (cx,cy), scaled so its radius `def.r` equals the disc radius R */
  const placeRing = (el, def, cx, cy, R) => {
    const k = R / def.r, s = el.style;
    s.width = (def.w * k).toFixed(1) + "px"; s.height = (def.h * k).toFixed(1) + "px";
    s.left = (cx - def.cx * k).toFixed(1) + "px"; s.top = (cy - def.cy * k).toFixed(1) + "px";
    s.transformOrigin = (def.cx * k).toFixed(1) + "px " + (def.cy * k).toFixed(1) + "px";
    el._o = [def.cx * k, def.cy * k];
  };
  /* rocks: ring-relative size, never smaller than the viewport; `big` = the nearer copy */
  const placeRocks = (el, cx, cy, R, W, H, big) => {
    const D = DEF.rk, w = Math.max(7.4 * R, W * 1.06, H * 1.5 * 1.06) * big, h = w * D.h / D.w, s = el.style;
    s.width = w.toFixed(1) + "px"; s.height = h.toFixed(1) + "px";
    s.left = (cx - w / 2).toFixed(1) + "px"; s.top = (cy - h / 2).toFixed(1) + "px"; s.transformOrigin = "50% 50%";
  };
  const FEATHER = "linear-gradient(to right,transparent 0,#000 18%,#000 82%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 18%,#000 82%,transparent 100%)";
  const hole = (el, a, R) => {            /* transparent inside radius a*R (the disc stays visible), soft edge, picture edges feathered */
    const o = el._o, key = a.toFixed(3);
    if (el._hk === key) return; el._hk = key;
    const rg = a <= 0.002 ? "" : "radial-gradient(circle at " + o[0].toFixed(1) + "px " + o[1].toFixed(1) + "px, transparent " + (a * R).toFixed(1) + "px, #000 " + ((a + 0.08) * R).toFixed(1) + "px),";
    const m = rg + FEATHER, s = el.style;
    s.webkitMaskImage = m; s.maskImage = m; s.webkitMaskComposite = "source-in"; s.maskComposite = "intersect";
  };

  /* where the HOME disc will be (same formulas as tm-intro.js layout(), "home" branch) */
  const homeGeom = (S) => {
    const hero = document.querySelector(".hero"); if (!hero) return null;
    const r = hero.getBoundingClientRect(), W = Math.max(2, r.width), H = Math.max(2, r.height);
    if (S && S.mode === "home") return { cx: r.left + S.zc[0], cy: r.top + S.zc[1], R: S.rect[2] / IMG_W * DISC_R };
    const wide = innerWidth > 900, target = clamp(Math.min(H * 0.62, W * (wide ? 0.50 : 0.80)), 220, 640);
    const rtl = document.documentElement.dir === "rtl" || document.documentElement.lang === "ar";
    return { cx: r.left + (wide ? W * (rtl ? 0.32 : 0.68) : W * 0.5), cy: r.top + (wide ? H * 0.5 : H * 0.42), R: target / 2 };
  };

  /* ------------------------------------------------------------ the transition */
  let fx = null, enterT = 0, done = false, I = null, Hm = null, VW = 0, VH = 0, hk = "";
  const start = (S, now) => {
    enterT = now;
    const sr = stage.getBoundingClientRect();
    I = { cx: sr.left + S.zc[0], cy: sr.top + S.zc[1], R: S.rect[2] / IMG_W * DISC_R };
    VW = innerWidth; VH = innerHeight;
    fx = document.createElement("div"); fx.setAttribute("aria-hidden", "true");
    fx.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:10002;pointer-events:none;overflow:hidden";
    fx.L = { rfA: mk(DEF.rk), i1: mk(DEF.i1), i2: mk(DEF.i2), rnA: mk(DEF.rk), rfB: mk(DEF.rk), h3: mk(DEF.h3), h4: mk(DEF.h4), rnB: mk(DEF.rk) };
    const o = fx.L; fx.append(o.rfA, o.i1, o.i2, o.rnA, o.rfB, o.h3, o.h4, o.rnB);
    document.body.appendChild(fx);
    placeRing(o.i1, DEF.i1, I.cx, I.cy, I.R); placeRing(o.i2, DEF.i2, I.cx, I.cy, I.R);
    placeRocks(o.rfA, I.cx, I.cy, I.R, VW, VH, 1); placeRocks(o.rnA, I.cx, I.cy, I.R, VW, VH, 1.45);
  };
  const placeHome = (G) => {              /* the home disc: prediction first, the real one as soon as Home exists */
    const o = fx.L, key = [G.cx, G.cy, G.R].map((v) => v.toFixed(1)).join();
    if (key === hk) return; hk = key; Hm = G;
    placeRing(o.h3, DEF.h3, G.cx, G.cy, G.R); placeRing(o.h4, DEF.h4, G.cx, G.cy, G.R);
    placeRocks(o.rfB, G.cx, G.cy, G.R, VW, VH, 1); placeRocks(o.rnB, G.cx, G.cy, G.R, VW, VH, 1.45);
    o.h3._hk = o.h4._hk = "";
  };
  const set = (el, op, tf) => { el.style.opacity = op.toFixed(3); el.style.transform = tf; };
  const frame = (now) => {
    if (done) return;
    requestAnimationFrame(frame);
    if (document.hidden || !window.__tmIntroState) return;
    const S = window.__tmIntroState();
    if (!S) return;
    if (!enterT) {
      if (!(window.__tmGoing || gate.classList.contains("tm-go"))) return;
      if (reduce || S.flat || !S.texDone) { done = true; return; }          /* no 3D relief / reduced motion: the old transition plays alone */
      start(S, now);
    }
    const e = now - enterT;
    if (e > END) { try { fx.remove(); } catch (_) {} done = true; return; }
    const o = fx.L;
    const G = homeGeom(S); if (G) placeHome(G);

    /* camera zoom: the relief's own value while it is on screen, the same curve afterwards */
    const Z = S.mode === "intro" ? 1 + S.zoomV : 1 + ZOOM_MAX * easeInOut(e / PUSH);
    const Zh = 1 + 2.4 * (1 - easeOut5((e - 1300) / 2900));                 /* the home tunnel lands from the same close-up */
    const sc = (z, p) => Math.pow(z, p).toFixed(4);
    /* the intro tunnel glides onto the home disc while it dissolves: one gate that travels from here to there */
    const g = Hm ? easeInOut((e - 1000) / 1500) : 0, tr = Hm ? "translate(" + ((Hm.cx - I.cx) * g).toFixed(1) + "px," + ((Hm.cy - I.cy) * g).toFixed(1) + "px) " : "";

    /* A · intro: the tunnel opens out of the disc, the hole closes and the camera dives in */
    const hA = 0.95 * (1 - easeInOut((e - 100) / 1000)), fA = gone(e, 1500, 2500);
    hole(o.i1, hA, I.R); hole(o.i2, hA, I.R);
    set(o.i1, 0.85 * ramp(e, 150, 800) * fA, tr + "scale(" + Z.toFixed(4) + ")");
    set(o.i2, 0.92 * ramp(e, 400, 1000) * fA, tr + "scale(" + Z.toFixed(4) + ")");
    /* rocks fly past the camera (the nearer copy faster = parallax) */
    const rA = ramp(e, 100, 700) * gone(e, 1500, 2600);
    set(o.rfA, 0.55 * rA, tr + "scale(" + sc(Z, 1.25) + ")");
    set(o.rnA, 0.85 * rA, tr + "scale(-" + sc(Z, 1.8) + "," + sc(Z, 1.8) + ")");

    /* B · home: the tunnel arrives on the home disc, settles, then opens to reveal the TM disc */
    if (Hm) {
      const hB = 0.97 * easeInOut((e - 2100) / 1500), fB = gone(e, 3300, 4400);
      hole(o.h3, hB, Hm.R); hole(o.h4, hB, Hm.R);
      set(o.h3, 0.75 * ramp(e, 1500, 2400) * fB, "scale(" + Zh.toFixed(4) + ")");
      set(o.h4, 0.85 * ramp(e, 1800, 2700) * fB, "scale(" + Zh.toFixed(4) + ")");
      const rB = ramp(e, 1700, 2500) * gone(e, 3200, 4400);
      set(o.rfB, 0.55 * rB, "scale(" + sc(Zh, 1.25) + ")");
      set(o.rnB, 0.85 * rB, "scale(-" + sc(Zh, 1.8) + "," + sc(Zh, 1.8) + ")");
    }
  };
  requestAnimationFrame(frame);
})();
