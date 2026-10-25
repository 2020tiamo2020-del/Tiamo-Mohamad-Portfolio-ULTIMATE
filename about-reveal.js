/* =====================================================================================================
   About portrait · cyber reveal, glass-panel assembly
   Move the mouse over the portrait: the cyber version (images/tiamo2-about.webp) is built from 8 separate glass
   panels (crown, visor, jaw, shoulders, chest, forearms). Each panel flies in from its own direction, tilts, drops
   a soft shadow, and locks into place with a glass bevel and a short flash. Panels near the cursor assemble first;
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
  const STAGGER = 2.4;        /* ms of delay per px of distance from the cursor: nearest panel first */

  /* ---- the 8 panels: polygons in the portrait's own 0..1 box. They tile the figure with no gaps.
         dir = side it flies in from, rot = start tilt (deg), depth = parallax weight ---- */
  const PANELS = [
    { n: "crown",   poly: [[0,0],[1,0],[1,.17],[.70,.195],[.30,.195],[0,.17]],                         dir: [0,-1],   rot: -5, depth: 1.3 },
    { n: "visor",   poly: [[0,.17],[.30,.195],[.70,.195],[1,.17],[1,.30],[.74,.31],[.26,.31],[0,.30]], dir: [1,-.25], rot: 6,  depth: 0.8 },
    { n: "jaw",     poly: [[.26,.31],[.74,.31],[.70,.42],[.62,.50],[.38,.50],[.30,.42]],               dir: [0,1],    rot: -4, depth: 1.1 },
    { n: "shoulderL", poly: [[0,.30],[.26,.31],[.30,.42],[.38,.50],[.34,.74],[0,.70]],                 dir: [-1,.1],  rot: -7, depth: 0.9 },
    { n: "shoulderR", poly: [[.74,.31],[1,.30],[1,.70],[.66,.74],[.62,.50],[.70,.42]],                 dir: [1,.1],   rot: 7,  depth: 1.0 },
    { n: "chest",   poly: [[.38,.50],[.62,.50],[.66,.74],[.34,.74]],                                   dir: [-.2,1],  rot: 4,  depth: 1.4 },
    { n: "forearmL",poly: [[0,.70],[.34,.74],[.40,1],[0,1]],                                           dir: [-1,.7],  rot: -6, depth: 0.8 },
    { n: "forearmR",poly: [[.34,.74],[.66,.74],[1,.70],[1,1],[.40,1]],                                 dir: [1,.7],   rot: 6,  depth: 1.2 }
  ].map(p => Object.assign(p, { p: 0, armed: false, start: 0, hold: 0, flash: 0, landed: false, c: [0, 0], px: [] }));

  /* ---- canvases ---- */
  const mk = () => document.createElement("canvas");
  const cv = mk(); cv.className = "ab3d"; cv.setAttribute("aria-hidden", "true");
  const T1 = mk(), T2 = mk(), Q = mk();                                       /* original / panels / one-panel scratch */
  const cx = cv.getContext("2d"), t1 = T1.getContext("2d"), t2 = T2.getContext("2d"), q = Q.getContext("2d");
  const all = [cx, t1, t2, q];
  pic.appendChild(cv);

  let W = 0, H = 0, cyber = null, ready = false, loading = false, box = [0, 0, 0, 0];
  let on = false, active = false, raf = 0, last = 0;
  const P = { x: 0, y: 0, has: false };
  const par = { x: 0, y: 0 };

  const containBox = (img) => {
    const iw = img.naturalWidth, ih = img.naturalHeight; if (!iw || !ih) return null;
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
      im.onload = () => { cyber = im; ready = true; W = H = 0; size(); };
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

  /* transform of one panel for progress p */
  const xf = (pn, e) => {
    const D = W * FLY * (1 - e), n = Math.hypot(pn.dir[0], pn.dir[1]) || 1;
    return { dx: pn.dir[0] / n * D, dy: pn.dir[1] / n * D, rot: pn.rot * (1 - e) * Math.PI / 180, sc: 1 - 0.1 * (1 - e) };
  };
  const apply = (c, pn, f) => {
    c.translate(pn.c[0] + f.dx, pn.c[1] + f.dy); c.rotate(f.rot); c.scale(f.sc, f.sc); c.translate(-pn.c[0], -pn.c[1]);
  };
  const path = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };

  /* ---- frame ---- */
  const frame = (now) => {
    raf = 0;
    const raw = now - (last || now); last = now;
    const k = Math.min(4, raw / 16.67);

    par.x += ((P.has ? -((P.x / W) - 0.5) * 18 : 0) - par.x) * Math.min(1, 0.12 * k);
    par.y += ((P.has ? -((P.y / H) - 0.5) * 14 : 0) - par.y) * Math.min(1, 0.12 * k);

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
      const tau = target ? 150 : 300;                                /* ms: quicker in, gentler out */
      pn.p += (target - pn.p) * (1 - Math.exp(-raw / tau));
      if (Math.abs(target - pn.p) < 0.002) pn.p = target;
      if (pn.p > 0.9 && !pn.landed) { pn.landed = true; pn.flash = 1; }          /* lock-in flash */
      if (pn.p < 0.3) pn.landed = false;
      pn.flash = Math.max(0, pn.flash - raw / 520);
      if (pn.p > 0 || pn.armed || pn.flash > 0) busy = true;
    });

    compose();

    if (!active && !busy) { compose(); setOn(false); last = 0; return; }       /* everything folded away: give the <img> back */
    raf = requestAnimationFrame(frame);
  };

  const compose = () => {
    /* A: original, with each panel's patch cut out once that panel has landed */
    t1.globalCompositeOperation = "source-over"; t1.globalAlpha = 1; t1.clearRect(0, 0, W, H); drawContain(t1, orig);
    t1.globalCompositeOperation = "destination-out"; t1.fillStyle = t1.strokeStyle = "#000"; t1.lineWidth = 2; t1.lineJoin = "round";
    PANELS.forEach(pn => {
      const a = smooth(0.62, 0.95, pn.p); if (a <= 0) return;
      t1.globalAlpha = a; path(t1, pn.px); t1.fill(); t1.stroke();
    });
    t1.globalAlpha = 1; t1.globalCompositeOperation = "source-over";

    /* B: the glass panels */
    t2.globalCompositeOperation = "source-over"; t2.globalAlpha = 1; t2.clearRect(0, 0, W, H);
    PANELS.forEach(pn => {
      if (pn.p <= 0.002 && pn.flash <= 0) return;
      const e = back(Math.min(1, pn.p)), f = xf(pn, Math.min(e, 1.06));
      const al = Math.min(1, pn.p * 2.4);
      /* bounding box of the moved polygon, in card px */
      const cs = Math.cos(f.rot), sn = Math.sin(f.rot);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      pn.px.forEach(([x, y]) => {
        const ux = (x - pn.c[0]) * f.sc, uy = (y - pn.c[1]) * f.sc;
        const X = pn.c[0] + f.dx + ux * cs - uy * sn, Y = pn.c[1] + f.dy + ux * sn + uy * cs;
        x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
      });
      x0 = Math.max(0, Math.floor(x0 - 10)); y0 = Math.max(0, Math.floor(y0 - 10));
      x1 = Math.min(W, Math.ceil(x1 + 10)); y1 = Math.min(H, Math.ceil(y1 + 10));
      const bw = x1 - x0, bh = y1 - y0; if (bw < 2 || bh < 2) return;

      /* scratch: the panel's own cyber content */
      q.globalCompositeOperation = "source-over"; q.globalAlpha = 1; q.clearRect(x0, y0, bw, bh);
      q.save(); q.beginPath(); q.rect(x0, y0, bw, bh); q.clip();
      apply(q, pn, f); path(q, pn.px); q.clip();
      drawContain(q, cyber, par.x * pn.depth, par.y * pn.depth, 1.018);
      /* glass sheen + bevel, only where the panel actually has content */
      q.globalCompositeOperation = "source-atop";
      const bb = pn.px.reduce((a, v) => [Math.min(a[0], v[0]), Math.min(a[1], v[1]), Math.max(a[2], v[0]), Math.max(a[3], v[1])], [1e9, 1e9, -1e9, -1e9]);
      const sh = q.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
      sh.addColorStop(0, `rgba(255,255,255,${0.2 + pn.flash * 0.3})`); sh.addColorStop(0.5, "rgba(255,255,255,0)"); sh.addColorStop(1, `rgba(255,255,255,${0.07 + pn.flash * 0.12})`);
      q.fillStyle = sh; q.fillRect(bb[0] - 4, bb[1] - 4, bb[2] - bb[0] + 8, bb[3] - bb[1] + 8);
      path(q, pn.px); q.lineJoin = "round";
      q.strokeStyle = "rgba(255,255,255,.11)"; q.lineWidth = 8; q.stroke();             /* soft inner glass depth */
      const eg = q.createLinearGradient(bb[0], bb[1], bb[2], bb[3]);
      eg.addColorStop(0, "rgba(255,255,255,.95)"); eg.addColorStop(0.45, "rgba(235,228,255,.38)"); eg.addColorStop(1, "rgba(255,255,255,.7)");
      q.strokeStyle = eg; q.lineWidth = 2; q.stroke();                                   /* crisp bevel line */
      q.restore();

      /* into the panel layer, with a lift shadow that shrinks as it lands */
      t2.save();
      t2.globalAlpha = al;
      const lift = Math.max(0, 1 - pn.p);
      t2.shadowColor = `rgba(0,0,0,${0.5 * lift})`; t2.shadowBlur = 22 * lift; t2.shadowOffsetY = 12 * lift;
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
    if (!active) { if (!on) { compose(); setOn(true); } }                  /* first frame equals the original: no visible pop */
    active = true; kick();
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => { active = false; kick(); }, { passive: true });
  addEventListener("blur", () => { active = false; kick(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { active = false; kick(); } });
})();
