/* =====================================================================================================
   About portrait · cyber reveal, glass-panel assembly
   Move the mouse over the portrait: the cyber version (images/tiamo2-about.webp) is built from 8 separate glass
   panels (crown, visor, jaw, shoulders, chest, forearms). Each panel flies in from its own direction, tilts, drops
   a soft shadow, and locks into place with a glass bevel and a short flash.
   The panels are volumetric while they travel: 3D tilt with foreshortening, a dark glass thickness that collapses as
   they land, shading that follows the tilt, and a specular glint that sweeps across the face. Panels near the cursor assemble first;
   a moment after the cursor leaves they slide back out again.
   Idle state is untouched: the canvas is only shown while panels are out, then the original <img> is swapped back.
   The portrait's own tilt (enhance.js) carries the canvas too, because it lives inside <picture>.
   Desktop mouse only; off for touch and for reduced-motion.
   To undo: remove the about-reveal.css + about-reveal.js tags from index.html.
   ===================================================================================================== */
(() => {
  "use strict";
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;

  const card = document.querySelector("#about .about-photo");
  const pic = card && card.querySelector("picture");
  const orig = pic && pic.querySelector("img");
  if (!card || !pic || !orig) return;

  const SRC = ["images/tiamo2-about.webp", "images/tiamo2-about.png"];   /* first that loads wins */
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  /* ---- tuning ---- */
  const HOLD = 1900;          /* ms a panel stays assembled after the cursor last touched its area */
  const NEAR = 0.10;          /* cursor "touches" a panel when closer than this share of the card width */
  const FLY  = 0.34;          /* flight distance, share of card width */
  const EXIT_MS = 1150;       /* how long a panel takes to fold away (soft start, soft landing) */
  const STAGGER = 2.4;        /* ms of delay per px of distance from the cursor: nearest panel first */

  /* ---- the 8 panels: polygons in the portrait's own 0..1 box. They tile the figure with no gaps.
         dir = side it flies in from, rot = start tilt (deg), depth = parallax weight ---- */
  const PANELS = [
    { n: "crown",   poly: [[0,0],[1,0],[1,.17],[.70,.195],[.30,.195],[0,.17]],                         dir: [0,-1],   rot: -3, depth: 0.3, rx: -7,  ry: 3 },
    { n: "visor",   poly: [[0,.17],[.30,.195],[.70,.195],[1,.17],[1,.30],[.74,.31],[.26,.31],[0,.30]], dir: [1,-.25], rot: 3,  depth: 0.3, rx: 3,   ry: 9 },
    { n: "jaw",     poly: [[.26,.31],[.74,.31],[.70,.42],[.62,.50],[.38,.50],[.30,.42]],               dir: [0,1],    rot: -3, depth: 0.3, rx: 7,   ry: -3 },
    { n: "shoulderL", poly: [[0,.30],[.26,.31],[.30,.42],[.38,.50],[.34,.74],[0,.70]],                 dir: [-1,.1],  rot: -5, depth: 0.6, rx: 7,   ry: -24 },
    { n: "shoulderR", poly: [[.74,.31],[1,.30],[1,.70],[.66,.74],[.62,.50],[.70,.42]],                 dir: [1,.1],   rot: 5,  depth: 0.6, rx: -7,  ry: 24 },
    { n: "chest",   poly: [[.38,.50],[.62,.50],[.66,.74],[.34,.74]],                                   dir: [-.2,1],  rot: 3,  depth: 0.7, rx: 16,  ry: 11 },
    { n: "forearmL",poly: [[0,.70],[.34,.74],[.40,1],[0,1]],                                           dir: [-1,.7],  rot: -4, depth: 0.6, rx: 11,  ry: -22 },
    { n: "forearmR",poly: [[.34,.74],[.66,.74],[1,.70],[1,1],[.40,1]],                                 dir: [1,.7],   rot: 4,  depth: 0.7, rx: 11,  ry: 22 }
  ].map(p => Object.assign(p, { p: 0, tgt: 0, t0: 0, from: 0, out: false, armed: false, start: 0, hold: 0, flash: 0, landed: false, c: [0, 0], px: [] }));

  /* ---- canvases ---- */
  const mk = () => document.createElement("canvas");
  const cv = mk(); cv.className = "ab3d"; cv.setAttribute("aria-hidden", "true");
  const T1 = mk(), T2 = mk(), Q = mk();                                       /* original / panels / one-panel scratch */
  const cx = cv.getContext("2d"), t1 = T1.getContext("2d"), t2 = T2.getContext("2d"), q = Q.getContext("2d");
  const all = [cx, t1, t2, q];
  pic.appendChild(cv);

  let W = 0, H = 0, cyber = null, cyberD = null, ready = false, loading = false, box = [0, 0, 0, 0];
  let on = false, active = false, raf = 0, last = 0;
  const P = { x: 0, y: 0, has: false };
  const par = { x: 0, y: 0 };

  const containBox = (img) => {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; if (!iw || !ih) return null;
    const k = Math.min(W / iw, H / ih), w = iw * k, h = ih * k;
    return [(W - w) / 2, (H - h) / 2, w, h];
  };
  const drawContain = (c, img, ox = 0, oy = 0, sc = 1) => {
    const b = containBox(img); if (!b) return;
    const w = b[2] * sc, h = b[3] * sc;
    c.drawImage(img, b[0] + (b[2] - w) / 2 + ox, b[1] + (b[3] - h) / 2 + oy, w, h);
  };

  /* panel polygons in card pixels (follows the cyber image's contain-fit box) */
  const layout = () => {
    const b = cyber && containBox(cyber); if (!b) return;
    box = b;
    PANELS.forEach(p => {
      p.px = p.poly.map(([x, y]) => [b[0] + x * b[2], b[1] + y * b[3]]);
      const n = p.px.length; p.c = [p.px.reduce((a, v) => a + v[0], 0) / n, p.px.reduce((a, v) => a + v[1], 0) / n];
    });
  };

  const size = () => {
    const w = Math.round(pic.offsetWidth || pic.getBoundingClientRect().width), h = Math.round(pic.offsetHeight || pic.getBoundingClientRect().height);
    if (!w || !h || (w === W && h === H)) return;
    W = w; H = h;
    [cv, T1, T2, Q].forEach(c => { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    cv.style.width = W + "px"; cv.style.height = H + "px";
    all.forEach(c => c.setTransform(DPR, 0, 0, DPR, 0, 0));
    layout();
  };

  const load = () => {
    if (loading || ready) return; loading = true;
    let i = 0;
    const next = () => {
      if (i >= SRC.length) return;                       /* nothing loaded: feature stays off, nothing breaks */
      const im = new Image(); im.decoding = "async";
      im.onload = () => {
        cyber = im;
        /* same figure, tinted deep indigo: used for the panel's side walls */
        const d = mk(); d.width = im.naturalWidth; d.height = im.naturalHeight;
        const dc = d.getContext("2d"); dc.drawImage(im, 0, 0);
        dc.globalCompositeOperation = "source-atop";
        const g = dc.createLinearGradient(0, 0, d.width, d.height);
        g.addColorStop(0, "rgba(120,100,210,.72)"); g.addColorStop(1, "rgba(14,10,40,.88)");
        dc.fillStyle = g; dc.fillRect(0, 0, d.width, d.height);
        cyberD = d; ready = true; W = H = 0; size();
      };
      im.onerror = next;
      im.src = SRC[i++];
    };
    next();
  };

  /* load it only when the About block is near the screen */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: "700px 0px" });
    io.observe(card);
  } else load();

  if ("ResizeObserver" in window) new ResizeObserver(size).observe(pic); else addEventListener("resize", size, { passive: true });

  /* ---- geometry helpers ---- */
  const distToPoly = (px, py, pts) => {
    let inside = false, best = 1e9;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[j];
      if (((y1 > py) !== (y2 > py)) && (px < (x2 - x1) * (py - y1) / (y2 - y1) + x1)) inside = !inside;
      const dx = x2 - x1, dy = y2 - y1, l = dx * dx + dy * dy;
      const t = l ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l)) : 0;
      best = Math.min(best, Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)));
    }
    return inside ? 0 : best;
  };
  const ease = t => 1 - Math.pow(1 - t, 3);
  const back = t => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };   /* settles with a tiny overshoot */
  const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* one panel's transform for progress e: travel + roll + a 3D tilt (foreshortening + shear) + coming toward the viewer.
     Returned as an affine matrix [a b c d e f] so drawing and bounding box use exactly the same maths. */
  const mul = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  const matrix = (pn, e) => {
    const D = W * FLY * (1 - e), n = Math.hypot(pn.dir[0], pn.dir[1]) || 1, R = Math.PI / 180;
    const rot = pn.rot * (1 - e) * R, ax = pn.rx * (1 - e) * R, ay = pn.ry * (1 - e) * R, sc = 1;                                                    /* size never changes */
    const cs = Math.cos(rot), sn = Math.sin(rot);
    let m = [1, 0, 0, 1, pn.c[0] + pn.dir[0] / n * D, pn.c[1] + pn.dir[1] / n * D];     /* travel */
    m = mul(m, [cs, sn, -sn, cs, 0, 0]);                                                /* roll  */
    m = mul(m, [Math.cos(ay), Math.sin(ay) * 0.2, -Math.sin(ax) * 0.2, Math.cos(ax), 0, 0]);   /* tilt  */
    m = mul(m, [sc, 0, 0, sc, 0, 0]);
    return mul(m, [1, 0, 0, 1, -pn.c[0], -pn.c[1]]);
  };
  const pt = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const path = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };

  /* motion.js drifts the original <img> a few px with the cursor (its own `translate`); the canvas copies it, so the swap never jumps */
  const follow = () => { cv.style.translate = orig.style.translate || ""; };

  /* ---- frame ---- */
  const frame = (now) => {
    raf = 0;
    follow();
    const raw = now - (last || now); last = now;
    const k = Math.min(4, raw / 16.67);

    par.x += ((P.has ? -((P.x / W) - 0.5) * 8 : 0) - par.x) * Math.min(1, 0.12 * k);
    par.y += ((P.has ? -((P.y / H) - 0.5) * 6 : 0) - par.y) * Math.min(1, 0.12 * k);

    let busy = false;
    PANELS.forEach(pn => {
      /* cursor touches the panel? -> (re)arm it, nearest panels start first */
      if (active && P.has) {
        const d = distToPoly(P.x, P.y, pn.px);
        if (d <= W * NEAR) {
          pn.hold = now + HOLD;
          if (!pn.armed) { pn.armed = true; pn.start = now + Math.min(300, d * STAGGER); }
        }
      }
      if (pn.armed && now >= pn.hold) pn.armed = false;
      const target = pn.armed && now >= pn.start ? 1 : 0;
      if (target !== pn.tgt) { pn.tgt = target; pn.t0 = now; pn.from = pn.p; }
      if (target) {
        pn.p += (1 - pn.p) * (1 - Math.exp(-raw / 150));              /* in: quick, then settles */
        if (1 - pn.p < 0.002) pn.p = 1;
      } else if (pn.p > 0) {
        /* out: time-based ease-in-out, so it lifts off gently and glides away; neighbours leave one after another */
        const u = Math.max(0, Math.min(1, (now - pn.t0 - PANELS.indexOf(pn) * 38) / EXIT_MS));
        pn.p = pn.from * (1 - (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2));
        if (pn.p < 0.002) pn.p = 0;
      }
      pn.out = !target && pn.p > 0;
      if (pn.p > 0.9 && !pn.landed) { pn.landed = true; pn.flash = 1; }          /* lock-in flash */
      if (pn.p < 0.3) pn.landed = false;
      pn.flash = Math.max(0, pn.flash - raw / 520);
      if (pn.p > 0 || pn.armed || pn.flash > 0) busy = true;
    });

    compose();

    if (!active && !busy) { follow(); compose(); setOn(false); last = 0; return; }       /* everything folded away: give the <img> back */
    raf = requestAnimationFrame(frame);
  };

  const compose = () => {
    /* A: original, with each panel's patch cut out once that panel has landed */
    t1.globalCompositeOperation = "source-over"; t1.globalAlpha = 1; t1.clearRect(0, 0, W, H); drawContain(t1, orig);
    t1.globalCompositeOperation = "destination-out"; t1.fillStyle = t1.strokeStyle = "#000"; t1.lineWidth = 2; t1.lineJoin = "round";
    PANELS.forEach(pn => {
      const a = pn.out ? smooth(0.2, 0.75, pn.p) : smooth(0.62, 0.95, pn.p); if (a <= 0) return;
      t1.globalAlpha = a; path(t1, pn.px); t1.fill(); t1.stroke();
    });
    t1.globalAlpha = 1; t1.globalCompositeOperation = "source-over";

    /* B: the glass panels */
    t2.globalCompositeOperation = "source-over"; t2.globalAlpha = 1; t2.clearRect(0, 0, W, H);
    PANELS.forEach(pn => {
      if (pn.p <= 0.002 && pn.flash <= 0) return;
      const pp = Math.min(1, pn.p);
      const e = pn.out ? pp : Math.min(back(pp), 1.06), m = matrix(pn, e);   /* leaving: p is already eased in time */
      const al = pn.out ? smooth(0, 0.55, pn.p) : Math.min(1, pn.p * 2.4);
      const thick = 9 * Math.pow(Math.max(0, 1 - pn.p), 0.7);              /* glass thickness: collapses as the panel locks in */
      const layers = Math.min(9, Math.ceil(thick));
      const bb = pn.px.reduce((a, v) => [Math.min(a[0], v[0]), Math.min(a[1], v[1]), Math.max(a[2], v[0]), Math.max(a[3], v[1])], [1e9, 1e9, -1e9, -1e9]);
      /* bounding box of the moved polygon (+ thickness), in card px */
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      pn.px.forEach(([x, y]) => { const [X, Y] = pt(m, x, y); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); });
      x0 = Math.max(0, Math.floor(x0 - 14)); y0 = Math.max(0, Math.floor(y0 - 14));
      x1 = Math.min(W, Math.ceil(x1 + 14 + thick * 1.4)); y1 = Math.min(H, Math.ceil(y1 + 14 + thick * 1.4));
      const bw = x1 - x0, bh = y1 - y0; if (bw < 2 || bh < 2) return;

      q.globalCompositeOperation = "source-over"; q.globalAlpha = 1; q.clearRect(x0, y0, bw, bh);

      /* side walls: the dark twin stacked a few px toward the shadow side */
      for (let i = layers; i >= 1; i--) {
        q.save(); q.beginPath(); q.rect(x0, y0, bw, bh); q.clip();
        q.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        q.translate(0.95 * thick * i / layers, 1.15 * thick * i / layers);
        path(q, pn.px); q.clip();
        drawContain(q, cyberD, par.x * pn.depth, par.y * pn.depth, 1);
        q.restore();
      }

      /* front face */
      q.save(); q.beginPath(); q.rect(x0, y0, bw, bh); q.clip();
      q.transform(m[0], m[1], m[2], m[3], m[4], m[5]); path(q, pn.px); q.clip();
      drawContain(q, cyber, par.x * pn.depth, par.y * pn.depth, 1);
      q.globalCompositeOperation = "source-atop";
      /* shading follows the tilt: panels turned away from the light are darker, then brighten as they lock in */
      q.fillStyle = `rgba(8,6,30,${0.42 * Math.max(0, 1 - e)})`; q.fillRect(bb[0] - 4, bb[1] - 4, bb[2] - bb[0] + 8, bb[3] - bb[1] + 8);
      /* glass sheen */
      const sh = q.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
      sh.addColorStop(0, `rgba(255,255,255,${0.2 + pn.flash * 0.3})`); sh.addColorStop(0.5, "rgba(255,255,255,0)"); sh.addColorStop(1, `rgba(255,255,255,${0.07 + pn.flash * 0.12})`);
      q.fillStyle = sh; q.fillRect(bb[0] - 4, bb[1] - 4, bb[2] - bb[0] + 8, bb[3] - bb[1] + 8);
      /* specular glint sweeping across the face while it settles */
      if (pn.p < 0.98) {
        const pos = -0.15 + 1.3 * pn.p, g = q.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
        const c = (v) => Math.max(0, Math.min(1, v));
        g.addColorStop(c(pos - 0.14), "rgba(255,255,255,0)"); g.addColorStop(c(pos), `rgba(255,255,255,${0.42 * (1 - pn.p * 0.5)})`); g.addColorStop(c(pos + 0.14), "rgba(255,255,255,0)");
        q.fillStyle = g; q.fillRect(bb[0] - 4, bb[1] - 4, bb[2] - bb[0] + 8, bb[3] - bb[1] + 8);
      }
      /* bevel */
      path(q, pn.px); q.lineJoin = "round";
      q.strokeStyle = "rgba(255,255,255,.05)"; q.lineWidth = 6; q.stroke();
      const eg = q.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
      eg.addColorStop(0, "rgba(255,255,255,.5)"); eg.addColorStop(0.45, "rgba(235,228,255,.16)"); eg.addColorStop(1, "rgba(255,255,255,.34)");
      q.strokeStyle = eg; q.lineWidth = 1.2; q.stroke();
      q.restore();

      /* into the panel layer, with a lift shadow that shrinks as it lands */
      t2.save();
      t2.globalAlpha = al;
      const lift = Math.max(0, 1 - pn.p);
      t2.shadowColor = `rgba(0,0,0,${0.55 * lift})`; t2.shadowBlur = 26 * lift; t2.shadowOffsetY = 14 * lift;
      t2.drawImage(Q, x0 * DPR, y0 * DPR, bw * DPR, bh * DPR, x0, y0, bw, bh);
      t2.restore();
    });

    /* final */
    cx.globalCompositeOperation = "source-over"; cx.globalAlpha = 1; cx.clearRect(0, 0, W, H);
    cx.drawImage(T1, 0, 0, W, H); cx.drawImage(T2, 0, 0, W, H);
  };

  const setOn = (v) => { if (on === v) return; on = v; card.classList.toggle("ab3d-on", v); };
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  /* ---- pointer: the card itself has pointer-events:none, so we read the mouse on the document ---- */
  document.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || !ready || !orig.naturalWidth) return;
    if (!card.classList.contains("show")) { active = false; return; }
    const b = pic.getBoundingClientRect();
    const inside = e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
    if (!inside) { if (active) { active = false; kick(); } return; }
    size();
    P.x = (e.clientX - b.left) * (W / b.width); P.y = (e.clientY - b.top) * (H / b.height); P.has = true;
    if (!active) { if (!on) { follow(); compose(); setOn(true); } }                  /* first frame equals the original: no visible pop */
    active = true; kick();
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => { active = false; kick(); }, { passive: true });
  addEventListener("blur", () => { active = false; kick(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { active = false; kick(); } });
})();
