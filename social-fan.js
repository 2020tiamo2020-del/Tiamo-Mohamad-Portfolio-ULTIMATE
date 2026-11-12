/* =====================================================================================================
   07 / FIND ME  -  the fan of five cards
   [ Instagram ][ TikTok ] [   FIND ME   ] [ Facebook ][ Photoshop Mode ]
   - Same box as before: a hidden copy of the old content (.sf-ghost) keeps the section's height, so nothing above or
     below moves and the "Contact framing" maths keeps working. All five cards live inside that box.
   - The fan opens with the scroll position of the section (no pin, no extra scroll) and closes again going back up.
   - Hover: the card lifts, tilts in 3D towards the pointer, catches a light, and pushes its neighbours aside.
   - Small screens: the centre card on top and a mini fan of the four cards under it, in the same height.
   ===================================================================================================== */
(() => {
  "use strict";
  const sec = document.querySelector("section.social-strip");
  if (!sec || sec.classList.contains("sf-on")) return;
  const main = sec.querySelector(".sf-main");
  const cards = main ? Array.from(sec.querySelectorAll(".sf-card")) : [];
  if (cards.length !== 4) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mqS = matchMedia("(max-width:900px)");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ss = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const outBack = (t, s) => { t = clamp(t, 0, 1) - 1; return 1 + t * t * ((s + 1) * t + s); };
  const lerp = (a, b, t) => a + (b - a) * t;

  /* order in the DOM = order on screen, left to right (outer-left, inner-left, inner-right, outer-right) */
  const SPEC = [{ dir: -1, rank: 2 }, { dir: -1, rank: 1 }, { dir: 1, rank: 1 }, { dir: 1, rank: 2 }];

  /* the hidden copy of the old content: it is what gives the section its old height, on every screen and in both languages */
  const ghost = document.createElement("div");
  ghost.className = "sf-ghost"; ghost.setAttribute("aria-hidden", "true");
  ghost.innerHTML = "<div>" + main.innerHTML + "</div><div class=\"social-links\">" +
    ["Facebook", "Instagram", "TikTok", "Photoshop Mode"].map(n => "<a dir=\"ltr\">" + n + " \u2197</a>").join("") + "</div>";
  sec.appendChild(ghost);
  sec.classList.add("sf-on");

  cards.forEach((c, i) => c.classList.add(SPEC[i].dir > 0 ? "sf-r" : "sf-l"));
  const h2 = main.querySelector("h2");
  let W = 0, H = 0, mobile = false, mw = 0, mh = 0, cw = 0, ch = 0, inner = 0, outer = 0, step = 0, yRow = 0, mCy = 0;
  const st = cards.map(() => ({ x: 0, y: 0, r: 0, s: 1, tx: 0, ty: 0, init: false }));
  const ms = { x: 0, y: 0, s: 1, tx: 0, ty: 0, init: false };
  const P = { px: 0, py: 0, ax: 0, ay: 0, in: false, nx: 0, ny: 0, mx: 0, my: 0 };
  let hov = -1, mainHov = false, vis = false, raf = 0, last = 0;

  /* the heading is as big as it can be and still fits the centre card (2 lines on wide screens) */
  const lines = f => {
    const r = document.createRange(); r.selectNodeContents(h2);
    const set = new Set(); for (const q of r.getClientRects()) if (q.width > 1) set.add(Math.round(q.top / Math.max(6, f * 0.5)));
    return set.size;
  };
  const fit = () => {
    const g = ghost.querySelector("h2");
    let f = Math.min(parseFloat(getComputedStyle(g).fontSize) || 48, 64);
    const maxL = mobile ? 3 : 2;
    h2.style.fontSize = f + "px";
    for (let i = 0; i < 44; i++) {
      const over = main.scrollHeight > main.clientHeight + 1 || h2.scrollWidth > h2.clientWidth + 1;
      if (!over && lines(f) <= maxL) break;
      f *= 0.955; if (f < 14) break;
      h2.style.fontSize = f.toFixed(1) + "px";
    }
  };

  const measure = () => {
    W = sec.offsetWidth; H = sec.offsetHeight; mobile = mqS.matches;
    if (!mobile) {
      mw = clamp(W * 0.5, 440, 640); mh = Math.min(H - 14, 214);
      cw = Math.round(clamp(H * 0.72, 124, 160)); ch = Math.round(Math.min(H * 0.74, cw * 1.12));
      inner = mw / 2 + cw * 0.30; outer = inner + cw * 0.86;
    } else {
      mw = Math.round(W * 0.92); mh = Math.round(H * 0.52);
      cw = Math.round(W * 0.265); ch = Math.round(H * 0.40); step = cw * 0.9;
      mCy = mh / 2 + 8; yRow = H - ch / 2 - 10;
    }
    main.style.width = mw + "px"; main.style.height = mh + "px"; main.style.marginLeft = (-mw / 2) + "px"; main.style.marginTop = (-mh / 2) + "px";
    cards.forEach((c, i) => {
      c.style.width = cw + "px"; c.style.height = ch + "px"; c.style.marginLeft = (-cw / 2) + "px"; c.style.marginTop = (-ch / 2) + "px";
      c.style.zIndex = SPEC[i].rank === 1 ? 4 : 3;
    });
    fit();
    if (!vis) draw(performance.now(), 0.016);
  };

  const draw = (now, dt) => {
    const r = sec.getBoundingClientRect(), vh = innerHeight || 1;
    const t = reduce ? 1 : clamp((vh * 0.98 - r.top) / (vh * 0.5), 0, 1);       /* 0 = just entering, 1 = fan fully open */
    const cx = W / 2, cy = mobile ? mCy : H / 2;
    const kP = 1 - Math.exp(-dt * 13), kT = 1 - Math.exp(-dt * 9);
    P.ax += ((P.in && !mobile && !reduce ? P.px : 0) * 6 - P.ax) * kT; P.ay += ((P.in && !mobile && !reduce ? P.py : 0) * 3 - P.ay) * kT;
    const hs = hov >= 0 ? SPEC[hov] : null;

    /* the centre card */
    {
      let tx = cx + P.ax * 0.4, ty = cy + P.ay * 0.4, ts = 1;
      if (hs && !mobile) { tx -= hs.dir * 6; ts = 0.985; }
      if (!ms.init) { ms.x = tx; ms.y = ty; ms.s = ts; ms.init = true; }
      ms.x += (tx - ms.x) * kP; ms.y += (ty - ms.y) * kP; ms.s += (ts - ms.s) * kP;
      const ttx = mainHov && !reduce ? -P.ny * 3.5 : 0, tty = mainHov && !reduce ? P.nx * 4.5 : 0;
      ms.tx += (ttx - ms.tx) * kT; ms.ty += (tty - ms.ty) * kT;
      main.style.transform = "translate3d(" + ms.x.toFixed(2) + "px," + ms.y.toFixed(2) + "px,0) perspective(1100px) rotateX(" + ms.tx.toFixed(2) + "deg) rotateY(" + ms.ty.toFixed(2) + "deg) scale(" + ms.s.toFixed(4) + ")";
    }

    /* the four cards */
    cards.forEach((c, i) => {
      const sp = SPEC[i], rank = sp.rank, dir = sp.dir, s = st[i];
      const pi = ss((t - (rank === 1 ? 0.10 : 0.28)) / 0.5), e = outBack(pi, 1.1);
      let ox, oy, orr, os, zx, zy, zr, zs;
      if (!mobile) {
        ox = cx + dir * (rank === 1 ? inner : outer); oy = cy + (rank === 1 ? 4 : 11); orr = dir * (rank === 1 ? 5 : 11); os = rank === 1 ? 0.99 : 0.95;
        zx = cx + dir * mw * 0.16; zy = cy + 8; zr = 0; zs = 0.8;
      } else {
        const k = i - 1.5;
        ox = cx + k * step; oy = yRow + (Math.abs(k) > 1 ? 9 : 0); orr = k * 7; os = 1;
        zx = cx; zy = mCy; zr = 0; zs = 0.6;
      }
      let tx = lerp(zx, ox, e), ty = lerp(zy, oy, e), tr = lerp(zr, orr, ss(pi)), ts = lerp(zs, os, ss(pi));
      let ttx = 0, tty = 0, z = rank === 1 ? 4 : 3;
      if (!mobile) { tx += P.ax; ty += P.ay; }
      if (hs) {
        if (i === hov) {
          ty -= mobile ? 8 : 14; ts += 0.1; tr *= 0.25; z = 7;
          if (!mobile) tx += dir * (rank === 1 ? 30 : 16);
          if (!reduce) { ttx = -P.ny * 9; tty = P.nx * 11; }
        } else if (!mobile && sp.dir === hs.dir && rank > hs.rank) tx += dir * 28;
        else if (mobile) tx += Math.sign(i - hov) * 9;
      }
      if (pi > 0.98 && !reduce) { ty += Math.sin(now / 1100 + i * 1.3) * 1.6; tr += Math.sin(now / 1500 + i) * 0.4; }
      if (!s.init) { s.x = tx; s.y = ty; s.r = tr; s.s = ts; s.init = true; }
      s.x += (tx - s.x) * kP; s.y += (ty - s.y) * kP; s.r += (tr - s.r) * kP; s.s += (ts - s.s) * kP;
      s.tx += (ttx - s.tx) * kT; s.ty += (tty - s.ty) * kT;
      c.style.transform = "translate3d(" + s.x.toFixed(2) + "px," + s.y.toFixed(2) + "px,0) rotate(" + s.r.toFixed(2) + "deg) perspective(900px) rotateX(" + s.tx.toFixed(2) + "deg) rotateY(" + s.ty.toFixed(2) + "deg) scale(" + s.s.toFixed(4) + ")";
      c.style.opacity = pi.toFixed(3);
      c.style.zIndex = z;
      c.style.pointerEvents = pi > 0.6 ? "auto" : "none";
    });
  };

  const loop = now => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
    draw(now, dt);
    if (vis) raf = requestAnimationFrame(loop);
  };
  const run = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };

  const setHov = i => { cards.forEach((c, k) => c.classList.toggle("sf-hov", k === i)); hov = i; };
  const aim = (el, e) => {
    const b = el.getBoundingClientRect(), x = (e.clientX - b.left) / Math.max(1, b.width), y = (e.clientY - b.top) / Math.max(1, b.height);
    P.nx = clamp(x * 2 - 1, -1, 1); P.ny = clamp(y * 2 - 1, -1, 1);
    el.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
  };
  cards.forEach((c, i) => {
    c.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") setHov(i); });
    c.addEventListener("pointerleave", () => { if (hov === i) setHov(-1); });
    c.addEventListener("pointermove", e => { if (e.pointerType !== "touch") aim(c, e); });
    c.addEventListener("focus", () => { if (c.matches(":focus-visible")) setHov(i); });
    c.addEventListener("blur", () => { if (hov === i) setHov(-1); });
  });
  main.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") { mainHov = true; main.classList.add("sf-hov"); } });
  main.addEventListener("pointerleave", () => { mainHov = false; main.classList.remove("sf-hov"); });
  main.addEventListener("pointermove", e => { if (e.pointerType !== "touch") aim(main, e); });
  sec.addEventListener("pointermove", e => {
    const b = sec.getBoundingClientRect();
    P.px = clamp((e.clientX - b.left) / Math.max(1, b.width) * 2 - 1, -1, 1); P.py = clamp((e.clientY - b.top) / Math.max(1, b.height) * 2 - 1, -1, 1); P.in = true;
  });
  sec.addEventListener("pointerleave", () => { P.in = false; });

  /* it only runs while the section is on screen */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { vis = es.some(e => e.isIntersecting); if (vis) run(); }, { rootMargin: "20% 0px" }).observe(sec);
  } else { vis = true; run(); }

  /* the box changes (resize, language, fonts): measure again */
  if ("ResizeObserver" in window) new ResizeObserver(() => measure()).observe(sec);
  addEventListener("resize", () => measure());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  new MutationObserver(() => { setTimeout(measure, 80); setTimeout(measure, 500); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
  measure();
})();
