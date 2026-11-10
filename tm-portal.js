/* ==========================================================================
   TM PORTAL — the five artworks, locked to the medallion ring
   1 + 2  -> INTRO : sit on the intro medallion ring; opened by "Enter"
   3 + 4  -> HOME  : sit on the home medallion ring, behind the medallion
   5      -> rocks : spread around the ring in both scenes (same ring-relative place)

   Nothing in tm-intro.js is touched. This file only READS window.__tmIntroState()
   (mode, zoom, rect, zoom-centre) every frame and places the pictures with the same maths
   as the 3D relief:   ring radius R = rect.w / 1600 * 234.5,  centre = zoom centre.
   Each picture was measured: its OUTER stone ring (centre cx,cy and radius r, in picture px)
   is scaled to R and its centre put on the medallion centre -> ring on ring, exactly.
   During the camera push the layers use scale(1 + zoomV) around the same centre as the relief,
   so they stay glued to it at every frame, then Home receives 3 + 4 on the home ring and
   they settle in from the same close-up.
   Set  window.__tmPortalOff = true  before this script to disable everything.
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

  const IMG_W = 1600, RING_HALF = 234.5;                  /* intro art: medallion ring is 469 px wide */

  /* the measured outer ring of every picture (picture px) */
  const DEF = {
    i1: { src: "images/portal-intro-1.webp", w: 1280, h: 853,  cx: 640, cy: 413, r: 398 },
    i2: { src: "images/portal-intro-2.webp", w: 1536, h: 1024, cx: 767, cy: 495, r: 478 },
    h3: { src: "images/portal-home-3.webp",  w: 1536, h: 1024, cx: 766, cy: 480, r: 470 },
    h4: { src: "images/portal-home-4.webp",  w: 1280, h: 853,  cx: 639, cy: 399, r: 392 },
    rk: { src: "images/portal-rocks.webp",   w: 1536, h: 1024 }
  };

  /* old random layers are replaced by these: hide them (remove this line to bring them back) */
  const st = document.createElement("style");
  st.textContent = ".tmx-shards{display:none!important}.tmp-l{position:absolute;max-width:none;pointer-events:none;user-select:none;-webkit-user-drag:none;mix-blend-mode:screen;opacity:0;will-change:transform,opacity}.tmp-box{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:hidden}.tmp-home{z-index:-1;overflow:visible}";
  document.head.appendChild(st);
  new MutationObserver((ms) => {                          /* the old random tunnel / surge pictures of the Enter flash */
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      n.querySelectorAll && n.querySelectorAll("div").forEach((d) => { if (/dive-(tunnel|surge)/.test(d.style.cssText)) d.style.display = "none"; });
    }
  }).observe(document.body, { childList: true });

  const mk = (def, cls) => {
    const im = new Image(); im.decoding = "async"; im.alt = ""; im.draggable = false;
    im.setAttribute("aria-hidden", "true"); im.className = "tmp-l " + (cls || ""); im.src = def.src;
    return im;
  };
  /* ring on ring: picture scaled so its outer ring has radius R, its ring centre on (cx,cy) */
  const placeRing = (el, def, cx, cy, R) => {
    const k = R / def.r, s = el.style;
    s.width = (def.w * k).toFixed(1) + "px"; s.height = (def.h * k).toFixed(1) + "px";
    s.left = (cx - def.cx * k).toFixed(1) + "px"; s.top = (cy - def.cy * k).toFixed(1) + "px";
    s.transformOrigin = (def.cx * k).toFixed(1) + "px " + (def.cy * k).toFixed(1) + "px";
    el._o = [def.cx * k, def.cy * k];
  };
  /* rocks: ring-relative size (7.4 R), never smaller than the viewport; `big` = nearer, bigger copy */
  const placeRocks = (el, cx, cy, R, W, H, big) => {
    const D = DEF.rk, w = Math.max(7.4 * R, W * 1.06, H * 1.5 * 1.06) * big, h = w * D.h / D.w, s = el.style;
    s.width = w.toFixed(1) + "px"; s.height = h.toFixed(1) + "px";
    s.left = (cx - w / 2).toFixed(1) + "px"; s.top = (cy - h / 2).toFixed(1) + "px"; s.transformOrigin = "50% 50%";
  };
  const FEATHER = "linear-gradient(to right,transparent 0,#000 18%,#000 82%,transparent 100%),linear-gradient(to bottom,transparent 0,#000 18%,#000 82%,transparent 100%)";
  const hole = (el, a, b, R) => {                         /* keep the medallion itself untouched: transparent inside a, opaque from b (ring units); picture edges always feathered */
    const o = el._o || [0, 0], key = a.toFixed(3) + "|" + b.toFixed(3) + "|" + R.toFixed(0) + "|" + o[0].toFixed(0);
    if (el._hk === key) return; el._hk = key;
    const rg = a <= 0.001 ? "" : "radial-gradient(circle at " + o[0].toFixed(1) + "px " + o[1].toFixed(1) + "px, transparent " + (a * R).toFixed(1) + "px, #000 " + (b * R).toFixed(1) + "px),";
    const m = rg + FEATHER, s = el.style;
    s.webkitMaskImage = m; s.maskImage = m; s.webkitMaskComposite = "source-in"; s.maskComposite = "intersect";
  };

  let px = 0, py = 0, tx = 0, ty = 0, M = window;
  addEventListener("pointermove", (e) => { tx = clamp(e.clientX / innerWidth * 2 - 1, -1, 1); ty = clamp(e.clientY / innerHeight * 2 - 1, -1, 1); }, { passive: true });

  /* ------------------------------------------------------------------ INTRO */
  let A = null, enterT = 0, readyT = 0, lastKey = "";
  const buildIntro = () => {
    const box = document.createElement("div"); box.className = "tmp-box"; box.setAttribute("aria-hidden", "true");
    A = { box, i1: mk(DEF.i1), i2: mk(DEF.i2), rf: mk(DEF.rk), rn: mk(DEF.rk) };
    box.append(A.rf, A.i1, A.i2, A.rn);
    stage.appendChild(box);
  };
  const stepIntro = (S, now, sec) => {
    if (!A) buildIntro();
    if (!A.box.isConnected) return;
    const R = S.rect[2] / IMG_W * RING_HALF, cx = S.zc[0], cy = S.zc[1], W = S.W, H = S.H;
    const key = [R.toFixed(1), cx.toFixed(1), cy.toFixed(1), W, H].join();
    if (key !== lastKey) {
      lastKey = key;
      placeRing(A.i1, DEF.i1, cx, cy, R); placeRing(A.i2, DEF.i2, cx, cy, R);
      placeRocks(A.rf, cx, cy, R, W, H, 1); placeRocks(A.rn, cx, cy, R, W, H, 1.45);
    }
    if (!enterT && (window.__tmGoing || gate.classList.contains("tm-go"))) enterT = now;
    if (!readyT && S.ready) readyT = now;
    const e = enterT ? now - enterT : -1, z = 1 + S.zoomV;
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    /* rocks: gently there while waiting, rush past the camera on Enter (nearer copy faster = parallax) */
    const idleIn = readyT ? easeOut((now - readyT) / 2200) : 0, mv = reduce ? 0 : 1;
    const dx = (Math.sin(sec * 0.21) * 8 - px * 14) * mv, dy = (Math.cos(sec * 0.17) * 5) * mv;
    A.rf.style.opacity = (0.5 * idleIn).toFixed(3);
    A.rf.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) scale(" + Math.pow(z, 1.25).toFixed(4) + ")";
    A.rn.style.opacity = (e < 0 ? 0 : 0.8 * easeOut((e - 150) / 700)).toFixed(3);
    A.rn.style.transform = "translate3d(" + (-dx * 1.8).toFixed(1) + "px," + (-dy).toFixed(1) + "px,0) scale(" + (-Math.pow(z, 1.8)).toFixed(4) + "," + Math.pow(z, 1.8).toFixed(4) + ")";
    /* 1 + 2: the portal opens out of the ring, then the hole closes so the camera dives into it */
    const h = e < 0 ? 0.95 : 0.95 * (1 - easeInOut((e - 100) / 1000));
    A.i1.style.opacity = (e < 0 ? 0 : 0.85 * easeOut((e - 150) / 650)).toFixed(3);
    A.i2.style.opacity = (e < 0 ? 0 : 0.92 * easeOut((e - 400) / 600)).toFixed(3);
    for (const el of [A.i1, A.i2]) { hole(el, h, h + 0.07, R); el.style.transform = "scale(" + z.toFixed(4) + ")"; }
  };

  /* ------------------------------------------------------------------- HOME */
  let B = null, homeT = 0, hostEl = null, lastH = "";
  const buildHome = () => {
    hostEl = document.querySelector(".hero"); const hi = hostEl && hostEl.querySelector(".tm-home");
    if (!hostEl || !hi) return false;
    const box = document.createElement("div"); box.className = "tmp-box tmp-home"; box.setAttribute("aria-hidden", "true");
    B = { box, rf: mk(DEF.rk), h3: mk(DEF.h3), h4: mk(DEF.h4), rn: mk(DEF.rk) };
    box.append(B.rf, B.h3, B.h4, B.rn);
    hostEl.insertBefore(box, hi.nextSibling);              /* above the medallion picture, below dust / text */
    return true;
  };
  const stepHome = (S, now, sec) => {
    if (A) { try { A.box.remove(); } catch (_) {} A = null; }
    if (!B && !buildHome()) return;
    if (!S.homeVisible) return;
    if (!homeT) homeT = now;
    const R = S.rect[2] / IMG_W * RING_HALF, cx = S.zc[0], cy = S.zc[1], W = S.W, H = S.H;
    const key = [R.toFixed(1), cx.toFixed(1), cy.toFixed(1), W, H].join();
    if (key !== lastH) {
      lastH = key;
      placeRing(B.h3, DEF.h3, cx, cy, R); placeRing(B.h4, DEF.h4, cx, cy, R);
      placeRocks(B.rf, cx, cy, R, W, H, 1); placeRocks(B.rn, cx, cy, R, W, H, 1.45);
      hole(B.h3, 0.93, 1.02, R); hole(B.h4, 0.93, 1.02, R);
    }
    const t = now - homeT, fade = easeOut(t / 1800), mv = reduce ? 0 : 1;
    const sc = 1 + 1.6 * (1 - easeOut5(t / 3600)) * mv;     /* lands from the same close-up the intro dived into */
    px += (tx - px) * 0.05; py += (ty - py) * 0.05;
    const Mu = M.__tmMusic || {}, d = Mu.data; let bass = 0;
    if (Mu.playing && d && d.length > 2) bass = clamp((d[0] + d[1] + d[2]) / (3 * 220), 0, 1);
    const br = 0.5 + 0.5 * Math.sin(sec * 0.9) * mv;
    B.h3.style.opacity = (0.62 * fade * (0.9 + 0.1 * br)).toFixed(3);
    B.h4.style.opacity = (fade * (0.5 + 0.25 * bass) * (0.9 + 0.1 * Math.sin(sec * 0.7 + 1) * mv)).toFixed(3);
    B.rf.style.opacity = (0.5 * fade).toFixed(3); B.rn.style.opacity = (0.55 * fade).toFixed(3);
    B.h3.style.transform = "translate3d(" + (-px * 6 * mv).toFixed(1) + "px," + (-py * 4 * mv).toFixed(1) + "px,0) scale(" + sc.toFixed(4) + ")";
    B.h4.style.transform = "translate3d(" + (-px * 10 * mv).toFixed(1) + "px," + (-py * 6 * mv).toFixed(1) + "px,0) scale(" + (sc * (1 + 0.012 * bass)).toFixed(4) + ")";
    const dx = (Math.sin(sec * 0.21) * 8 - px * 18) * mv, dy = (Math.cos(sec * 0.17) * 5 - py * 10) * mv;
    B.rf.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0) scale(" + Math.pow(sc, 1.25).toFixed(4) + ")";
    B.rn.style.transform = "translate3d(" + (-dx * 1.8).toFixed(1) + "px," + (-dy * 1.4).toFixed(1) + "px,0) scale(" + (-Math.pow(sc, 1.8)).toFixed(4) + "," + Math.pow(sc, 1.8).toFixed(4) + ")";
  };

  const t0 = performance.now();
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden || !window.__tmIntroState) return;
    const S = window.__tmIntroState();
    if (!S || !S.texDone || S.flat) return;               /* no 3D relief = nothing to lock to */
    const sec = (now - t0) / 1000;
    if (S.mode === "intro") stepIntro(S, now, sec); else stepHome(S, now, sec);
  };
  requestAnimationFrame(frame);
})();
