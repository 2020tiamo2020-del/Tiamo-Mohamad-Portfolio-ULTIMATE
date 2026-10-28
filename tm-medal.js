/* TM MEDAL v1 — the carved medallion as a mechanical lock (layers cut from images/home-bg.webp).
   Closed -> the original picture is shown untouched.  Music starts -> the picture is swapped for the empty-socket base and
   the layers take over:  ring A turns clockwise and ring B counter-clockwise in ratchet "tick-tick" steps (true tilted circles),
   then the disc (T + M together, one piece) rises out of its socket.  Music stops -> the exact reverse: disc sinks, rings tick back, lock.
   Reads window.__tmMusic.playing (published by script.js).  No edits to tm-intro.js are needed. */
(() => {
  "use strict";
  const CFG = { TICKS: 6, A_DEG: 135, B_DEG: 99, T_OPEN: 3.8, LIFT: 38, TICK_SOUND: true, SOUND_SRC: "audio/tick-click.wav", V: "?v=1" };
  const M = {   /* measured from home-bg.webp (1672x941) */
    A: { f: "images/medal-ringA.webp", S: 790, sc: 2, cx: 836.1, cy: 450.1, ratio: 0.93747 },
    B: { f: "images/medal-ringB.webp", S: 700, sc: 2, cx: 836.5, cy: 448.1, ratio: 0.95230 },
    D: { f: "images/medal-disc.webp", x: 679, y: 293, w: 316, h: 304, cx: 837.1, cy: 445.4, rx: 148.5, ry: 142.4 },
    T: { f: "images/medal-T.webp", x: 734, y: 368, w: 212, h: 102 },
    socket: "images/home-bg-socket.webp", orig: "images/home-bg.webp?v=2"
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const snap = (f) => { if (f >= 0.3) return 1; const t = f / 0.3, c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };  /* quick snap with a small overshoot */

  let hero, img, wrap, stack, rA, rB, disc, topEl, shadow, rim, tG, ready = false, loading = false, socketImg = null, origSrc = "";
  let p = 0, dir = 0, last = 0, raf = 0, lastTickA = 0, lastTickB = 0, tx = 0, ty = 0, ttx = 0, tty = 0, audioOk = true;

  const mk = (cls, css) => { const e = document.createElement("div"); e.className = cls; if (css) Object.assign(e.style, css); return e; };
  const px = (v) => v + "px";

  function build() {
    wrap = mk("tm-medal"); stack = mk("tm-stack"); wrap.appendChild(stack);
    const ring = (m, key) => {
      const s = m.S / m.sc, r = mk("tm-mr", { left: px(m.cx - s / 2), top: px(m.cy - s / 2), width: px(s), height: px(s), transform: "scaleY(" + m.ratio + ")" });
      const im = new Image(); im.src = m.f + CFG.V; im.alt = ""; im.draggable = false; r.appendChild(im); r._im = im; stack.appendChild(r); return r;
    };
    rA = ring(M.A); rB = ring(M.B);
    const d = M.D;
    disc = mk("tm-md", { left: px(d.x), top: px(d.y), width: px(d.w), height: px(d.h) });
    const ox = d.cx - d.x, oy = d.cy - d.y;
    shadow = mk("shadow", { left: px(ox - d.rx), top: px(oy - d.ry), width: px(d.rx * 2), height: px(d.ry * 2), opacity: 0 });
    disc.appendChild(shadow);
    const N = 10;
    for (let i = 0; i < N; i++) disc.appendChild(mk("wall", { left: px(ox - d.rx), top: px(oy - d.ry), width: px(d.rx * 2), height: px(d.ry * 2), transform: "translateZ(0px)" }));
    topEl = mk("top");
    const di = new Image(); di.src = d.f + CFG.V; di.alt = ""; di.draggable = false; Object.assign(di.style, { left: 0, top: 0, width: px(d.w), height: px(d.h) });
    const t = M.T, tpos = { left: px(t.x - d.x), top: px(t.y - d.y), width: px(t.w), height: px(t.h) };
    const ti = new Image(); ti.src = t.f + CFG.V; ti.alt = ""; ti.draggable = false; Object.assign(ti.style, tpos); ti.style.transform = "translateZ(5px)";
    tG = new Image(); tG.src = t.f + CFG.V; tG.alt = ""; tG.className = "tglow"; Object.assign(tG.style, tpos); tG.style.transform = "translateZ(6px)";
    rim = mk("rim", { left: px(ox - d.rx), top: px(oy - d.ry), width: px(d.rx * 2), height: px(d.ry * 2) });
    topEl.append(rim, di, ti, tG); disc.appendChild(topEl);
    stack.appendChild(disc);
    disc._walls = disc.querySelectorAll(".wall");
    img.after(wrap);
    place();
  }
  function place() {
    if (!wrap || !img) return;
    const k = parseFloat(img.style.width) / 1672 || 1;
    wrap.style.left = img.style.left; wrap.style.top = img.style.top; wrap.style.transform = "scale(" + k + ")";
  }
  function preload() {
    if (loading) return; loading = true;
    const imgs = [socketImg = new Image()];
    socketImg.src = M.socket + CFG.V;
    [rA._im, rB._im].forEach((i) => imgs.push(i));
    disc.querySelectorAll("img").forEach((i) => imgs.push(i));
    Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))).then(() => { ready = !!socketImg.naturalWidth && !!rA._im.naturalWidth && !!disc.querySelector("img").naturalWidth; });
  }
  const tickSnd = () => {
    if (!CFG.TICK_SOUND || !audioOk || reduce) return;
    try { const a = new Audio(CFG.SOUND_SRC); a.volume = 0.22; a.addEventListener("error", () => { audioOk = false; }); a.play().catch(() => {}); } catch (_) { audioOk = false; }
  };

  /* ---------------- pose for a given progress p (0 = locked, 1 = fully open) ---------------- */
  function pose() {
    const pr = clamp(p / 0.6, 0, 1), pd = clamp((p - 0.6) / 0.4, 0, 1);
    const N = CFG.TICKS, u = pr * (N + 0.5);
    const angle = (uu, total) => { const v = clamp(uu, 0, N), k = Math.min(Math.floor(v), N - 1), f = v >= N ? 1 : v - k; const kk = v >= N ? N : k + snap(f); return { a: total / N * kk, k: v >= N ? N : k }; };
    const A = angle(u, CFG.A_DEG), B = angle(u - 0.5, CFG.B_DEG);
    const e = eio(pd);
    return { aA: A.a, aB: -B.a, kA: A.k, kB: B.k, e, pr };
  }
  function apply() {
    const s = pose(), d = M.D;
    rA._im.style.transform = "rotate(" + s.aA.toFixed(2) + "deg)";
    rB._im.style.transform = "rotate(" + s.aB.toFixed(2) + "deg)";
    const moving = s.pr > 0 && s.pr < 1;
    const zA = moving ? 7 : 0, zB = moving ? 3 : 0;      /* the rings lift a hair while they turn */
    rA.style.transform = "translateZ(" + zA + "px) scaleY(" + M.A.ratio + ")"; rB.style.transform = "translateZ(" + zB + "px) scaleY(" + M.B.ratio + ")";
    rA.classList.toggle("hot", moving); rB.classList.toggle("hot", moving);
    const h = CFG.LIFT * s.e;
    topEl.style.transform = "translateZ(" + h.toFixed(2) + "px)";
    const W = disc._walls, n = W.length;
    for (let i = 0; i < n; i++) W[i].style.transform = "translateZ(" + (h * (1 - (i + 1) / (n + 1))).toFixed(2) + "px)";
    shadow.style.opacity = (0.85 * s.e).toFixed(3);
    shadow.style.transform = "translate3d(" + (h * 0.22).toFixed(1) + "px," + (h * 0.5).toFixed(1) + "px,0) scale(" + (1 + 0.06 * s.e) + ")";
    disc.style.setProperty("--glow", (0.7 * s.e * (0.55 + 0.45 * (window.__tmMusic && window.__tmMusic.beat ? clamp(window.__tmMusic.beat, 0, 1) : 0.5))).toFixed(3));
    stack.style.setProperty("--tx", (ttx * s.e + 6 * s.e).toFixed(2) + "deg"); stack.style.setProperty("--ty", (tty * s.e).toFixed(2) + "deg");
    if (!reduce) { if (s.kA !== lastTickA) { tickSnd(); lastTickA = s.kA; } if (s.kB !== lastTickB) { tickSnd(); lastTickB = s.kB; } }
  }

  function show() {
    if (!ready || wrap.classList.contains("on")) return;
    origSrc = img.getAttribute("src") || M.orig;
    img.src = M.socket + CFG.V; wrap.classList.add("on");
  }
  function hide() { if (!wrap.classList.contains("on")) return; wrap.classList.remove("on"); img.src = origSrc || M.orig; }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (dir) {
      p = clamp(p + dir * dt / (reduce ? 0.9 : CFG.T_OPEN), 0, 1);
      if ((dir > 0 && p >= 1) || (dir < 0 && p <= 0)) { if (dir < 0) { p = 0; apply(); hide(); } dir = 0; }
    }
    ttx += (tx - ttx) * 0.08; tty += (ty - tty) * 0.08;
    if (wrap.classList.contains("on")) apply();
    if (dir || (p > 0 && wrap.classList.contains("on"))) raf = requestAnimationFrame(frame);   /* keep alive while open (glow follows the beat) */
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  function sync() {
    if (!ready) return;
    const on = !!(window.__tmMusic && window.__tmMusic.playing);
    const want = on ? 1 : -1;
    if (want > 0 && p < 1 && dir <= 0) { show(); dir = 1; kick(); }
    else if (want < 0 && p > 0 && dir >= 0) { dir = -1; kick(); }
    else if (want > 0 && p >= 1) kick();
  }

  function init() {
    hero = document.querySelector(".hero"); if (!hero) return;
    const find = () => hero.querySelector(".tm-home-bg");
    const go = () => {
      img = find(); if (!img || wrap) return false;
      build(); new MutationObserver(place).observe(img, { attributes: true, attributeFilter: ["style"] });
      const later = () => { if (document.body.classList.contains("gate-locked")) return setTimeout(later, 600);   /* never compete with the intro for the network */
        window.requestIdleCallback ? requestIdleCallback(preload, { timeout: 4000 }) : setTimeout(preload, 1200); };
      later();
      setInterval(sync, 120);
      addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        tty = tty; tx = clamp(-((e.clientY / innerHeight) - 0.5) * 6, -4, 4); ty = clamp(((e.clientX / innerWidth) - 0.5) * 8, -5, 5);
      }, { passive: true });
      window.__tmMedal = { open: () => { show(); dir = 1; kick(); }, close: () => { dir = -1; kick(); }, state: () => ({ p, dir, ready }) };
      return true;
    };
    if (go()) return;
    const mo = new MutationObserver(() => { if (go()) mo.disconnect(); });
    mo.observe(hero, { childList: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
