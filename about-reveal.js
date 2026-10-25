/* =====================================================================================================
   About portrait · cyber reveal
   Move the mouse over the portrait and the cyber version (images/tiamo2-about.webp) is "painted in" along the
   cursor's path, then dissolves again. Soft liquid trail, glowing leading edge, depth parallax on the cyber
   layer. The portrait's own tilt (enhance.js) carries the canvas too, because it lives inside <picture>.
   Idle state is untouched: the canvas is only shown while a reveal is running, and the original <img> is
   swapped back as soon as the trail has faded.
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

  /* ---- canvases ---- */
  const mk = () => document.createElement("canvas");
  const cv = mk(); cv.className = "ab3d"; cv.setAttribute("aria-hidden", "true");
  const T1 = mk(), T2 = mk(), M = mk(), M2 = mk(), R = mk(), S = mk();       /* original / cyber / mask / rim-mask / rim / silhouette */
  const cx = cv.getContext("2d"), t1 = T1.getContext("2d"), t2 = T2.getContext("2d"),
        m = M.getContext("2d"), m2 = M2.getContext("2d"), r = R.getContext("2d"), s = S.getContext("2d");
  const all = [cx, t1, t2, m, m2, r, s];
  pic.appendChild(cv);

  let W = 0, H = 0, cyber = null, ready = false, loading = false;
  let on = false, active = false, idle = 0, raf = 0, last = 0;
  const P = { x: 0, y: 0, lx: 0, ly: 0, has: false, speed: 0 };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  let grow = 0;

  /* contain-fit, same as the <img> (object-fit:contain) */
  const fit = (img, ox = 0, oy = 0, sc = 1) => {
    const iw = img.naturalWidth, ih = img.naturalHeight; if (!iw || !ih) return null;
    const k = Math.min(W / iw, H / ih) * sc, w = iw * k, h = ih * k;
    return [(W - w) / 2 + ox, (H - h) / 2 + oy, w, h];
  };
  const draw = (c, img, ox, oy, sc) => { const f = fit(img, ox, oy, sc); if (f) c.drawImage(img, f[0], f[1], f[2], f[3]); };

  const size = () => {
    const b = pic.getBoundingClientRect();
    /* layout size (ignores the tilt transform) */
    const w = Math.round(pic.offsetWidth || b.width), h = Math.round(pic.offsetHeight || b.height);
    if (!w || !h || (w === W && h === H)) return;
    W = w; H = h;
    [cv, T1, T2, M, M2, R, S].forEach(c => { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
    cv.style.width = W + "px"; cv.style.height = H + "px";
    all.forEach(c => c.setTransform(DPR, 0, 0, DPR, 0, 0));
    silhouette();
  };

  /* union of both figures: the glowing edge is only ever drawn on the figure, never in empty space */
  const silhouette = () => {
    if (!cyber || !orig.naturalWidth) return;
    s.clearRect(0, 0, W, H); draw(s, orig, 0, 0, 1); draw(s, cyber, 0, 0, 1);
  };

  const load = () => {
    if (loading || ready) return; loading = true;
    let i = 0;
    const next = () => {
      if (i >= SRC.length) return;                       /* nothing loaded: feature stays off, nothing breaks */
      const im = new Image(); im.decoding = "async";
      im.onload = () => { cyber = im; ready = true; size(); silhouette(); };
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

  /* ---- painting the trail ---- */
  const stamp = (ctx, x, y, rad, a, hard) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(hard, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
  };

  const frame = (now) => {
    raf = 0;
    const raw = now - (last || now); last = now;          /* real milliseconds */
    const k = Math.min(4, raw / 16.67);                     /* animation step, capped so a slow frame never jumps */

    /* depth parallax of the cyber layer + grow-in / grow-out of the lens */
    par.tx = P.has ? -((P.x / W) - 0.5) * 18 : 0; par.ty = P.has ? -((P.y / H) - 0.5) * 14 : 0;
    par.x += (par.tx - par.x) * Math.min(1, 0.12 * k); par.y += (par.ty - par.y) * Math.min(1, 0.12 * k);
    grow += ((active ? 1 : 0) - grow) * Math.min(1, (active ? 0.14 : 0.06) * k);

    /* trail fades */
    m.globalCompositeOperation = "destination-out"; m.fillStyle = `rgba(0,0,0,${Math.min(1, 0.045 * k)})`; m.fillRect(0, 0, W, H);
    m2.globalCompositeOperation = "destination-out"; m2.fillStyle = `rgba(0,0,0,${Math.min(1, 0.045 * k)})`; m2.fillRect(0, 0, W, H);
    m.globalCompositeOperation = m2.globalCompositeOperation = "source-over";

    if (active && P.has) {
      const base = W * 0.27 * grow;                                  /* lens radius follows card width */
      const boost = 1 + Math.min(P.speed / 60, 0.45);               /* faster hand = fatter brush */
      const dx = P.x - P.lx, dy = P.y - P.ly, dist = Math.hypot(dx, dy);
      const n = Math.max(1, Math.ceil(dist / Math.max(6, base * 0.28)));
      for (let i = 1; i <= n; i++) {
        const t = i / n, x = P.lx + dx * t, y = P.ly + dy * t;
        const wob = 1 + Math.sin(now * 0.004 + i * 1.7) * 0.1;      /* liquid edge */
        stamp(m, x, y, base * boost * wob, dist > 0.5 ? 1 : 0.5, 0.93);
        stamp(m2, x, y, base * boost * wob * 1.075, dist > 0.5 ? 1 : 0.5, 0.93);
      }
      P.lx = P.x; P.ly = P.y; P.speed *= 0.86; idle = 0;
    } else idle += raw;

    compose();

    if (!active && idle > 1500 && grow < 0.03) {                       /* fully dissolved: give the <img> back */
      m.clearRect(0, 0, W, H); m2.clearRect(0, 0, W, H);
      compose(); setOn(false); last = 0; return;
    }
    raf = requestAnimationFrame(frame);
  };

  const compose = () => {
    /* A: original with the revealed part cut out */
    t1.globalCompositeOperation = "source-over"; t1.clearRect(0, 0, W, H); draw(t1, orig, 0, 0, 1);
    t1.globalCompositeOperation = "destination-out"; t1.drawImage(M, 0, 0, W, H);
    /* B: cyber, slightly nearer (scale + parallax), only where revealed */
    t2.globalCompositeOperation = "source-over"; t2.clearRect(0, 0, W, H); draw(t2, cyber, par.x, par.y, 1.018);
    t2.globalCompositeOperation = "destination-in"; t2.drawImage(M, 0, 0, W, H);
    /* leading edge: big soft mask minus the revealed mask, tinted, clipped to the figure */
    r.globalCompositeOperation = "source-over"; r.clearRect(0, 0, W, H); r.drawImage(M2, 0, 0, W, H);
    r.globalCompositeOperation = "destination-out"; r.drawImage(M, 0, 0, W, H); r.drawImage(M, 0, 0, W, H);
    r.globalCompositeOperation = "source-in";
    const g = r.createLinearGradient(0, 0, W, H);                  /* glass bevel: bright top-left, soft middle, medium bottom-right */
    g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(0.5, "rgba(235,228,255,.42)"); g.addColorStop(1, "rgba(255,255,255,.7)");
    r.fillStyle = g; r.fillRect(0, 0, W, H);
    r.globalCompositeOperation = "destination-in"; r.drawImage(S, 0, 0, W, H);
    /* final */
    cx.globalCompositeOperation = "source-over"; cx.clearRect(0, 0, W, H);
    cx.drawImage(T1, 0, 0, W, H); cx.drawImage(T2, 0, 0, W, H);
    cx.globalCompositeOperation = "source-over"; cx.globalAlpha = 0.6; cx.drawImage(R, 0, 0, W, H); cx.globalAlpha = 1;
    cx.globalCompositeOperation = "source-over";
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
    const x = (e.clientX - b.left) * (W / b.width), y = (e.clientY - b.top) * (H / b.height);
    if (!active) {
      P.lx = x; P.ly = y; idle = 0;
      if (!on) { compose(); setOn(true); }                           /* first frame equals the original: no visible pop */
    }
    P.speed = Math.max(P.speed, Math.hypot(x - P.x, y - P.y));
    P.x = x; P.y = y; P.has = true; active = true;
    kick();
  }, { passive: true });

  document.documentElement.addEventListener("pointerleave", () => { active = false; kick(); }, { passive: true });
  addEventListener("blur", () => { active = false; kick(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { active = false; kick(); } });
})();
