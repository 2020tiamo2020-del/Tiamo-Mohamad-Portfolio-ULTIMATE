/* PAGE FLIGHT — press the round arrow (bottom corner) and a 3D camera flies over the whole page.
   Style follows the "page on a studio floor" fly-through video: light floor, rounded cards with soft shadows,
   floating pictures/chips, one continuous glide, rise overhead to see the page as one strip, dive into the destination.
   The cards are built live from the real sections of the page (titles, pictures, tags), so nothing goes stale. */
(() => {
  "use strict";
  const orb = document.getElementById("scrollOrbit");
  if (!orb || window.__pageFlight) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- timeline (ms) ---- */
  const T = { fade: 320, tiltA: 200, tiltB: 1000, glideA: 200, glideB: 3100, riseB: 4000, diveA: 4220, diveB: 5000, jump: 4900, end: 5420 };
  const TILT = 58, TILT_TOP = 10;

  const SECTIONS = [".hero", "#about", "#services", "#work", "#cinema", "#creation", "#beforeafter", "#process", "#findme", "#brief", "#contact"];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;          // ease in-out cubic
  const eios = k => .5 - Math.cos(Math.PI * k) / 2;                                   // ease in-out sine (gentle: near-constant speed in the middle)
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const clip = (s, n) => { s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; };

  let root = null, plane = null, hud = null, fog = null;
  let G = null;           // geometry + data for the current flight
  let raf = 0, t0 = 0, busy = false, skipAt = null, jumped = false;

  /* ---------- read the live page ---------- */
  const navLabel = el => {
    const id = el.id || (el.classList.contains("hero") ? "home" : "");
    const a = document.querySelector('#nav a[href="#' + id + '"]');
    const l = a && (a.querySelector(".nav-home-label") || a);
    return l ? l.textContent.replace(/\s+/g, " ").trim() : id;
  };
  const sectionData = el => {
    const kick = el.querySelector(".section-kicker, .eyebrow span, .fm-k");
    const head = el.querySelector("h1,h2,.sc-title,.fm-t");
    const imgs = [];
    el.querySelectorAll("img").forEach(im => {
      const src = im.currentSrc || im.src;
      if (!src || /^data:/.test(src) || im.closest(".logo,.about-photo-bg,.lightbox-stage")) return;
      if (!(im.complete && im.naturalWidth >= 90)) return;
      if (imgs.indexOf(src) < 0) imgs.push(src);
    });
    let chips = [...el.querySelectorAll(".sc-tags li,.floating-tag,.service-grid article h3,.sc-chip")].map(n => clip(n.textContent, 24)).filter(Boolean);
    if (!chips.length) chips = [...el.querySelectorAll("h3")].map(n => clip(n.textContent, 24)).filter(Boolean);
    const num = ((kick && kick.textContent.match(/\d{1,2}/)) || [""])[0];
    return {
      id: el.id || "home",
      label: navLabel(el),
      kicker: clip(kick ? kick.textContent : navLabel(el), 34),
      title: head ? head.innerHTML.replace(/<span[^>]*>|<\/span>/g, "").replace(/<(?!\/?em\b)[^>]*>/g, "") : esc(navLabel(el)),
      titleLen: head ? head.textContent.trim().length : 10,
      text: clip((el.querySelector(".lead,.section-title p,.sc-text,.contact p") || {}).textContent, 150),
      imgs: imgs.slice(0, 3),
      chips: chips.slice(0, 3),
      num: num ? num.padStart(2, "0") : ""
    };
  };

  /* ---------- build the floor + cards ---------- */
  const build = () => {
    const vw = innerWidth, vh = innerHeight;
    const portrait = vh > vw * 1.05;
    const cw = portrait ? 760 : 1280;
    const ch = Math.round(clamp(cw * vh / vw, 480, 2200));
    const u = cw / 1280, gap = Math.round(ch * .13), P = ch + gap;
    const rtl = document.documentElement.dir === "rtl" || document.documentElement.lang === "ar";

    const els = SECTIONS.map(s => document.querySelector(s)).filter(Boolean);
    const data = els.map(sectionData);
    const docY = els.map(e => e.getBoundingClientRect().top + scrollY);

    root = document.createElement("div");
    root.className = "pf"; root.setAttribute("aria-hidden", "true");
    root.innerHTML = '<div class="pf-stage"><div class="pf-plane"></div></div><div class="pf-fog"></div><div class="pf-hud"></div>';
    plane = root.querySelector(".pf-plane"); hud = root.querySelector(".pf-hud"); fog = root.querySelector(".pf-fog");

    plane.innerHTML = data.map((d, i) => {
      const small = d.titleLen > 34 ? ' style="font-size:' + (portrait ? 3 : 3.5) + 'em"' : "";
      const tiles = d.imgs.map((s, k) => '<div class="pf-tile pf-t' + (k + 1) + '"><img src="' + esc(s) + '" alt="" decoding="async"></div>').join("");
      const chips = d.chips.map((c, k) => '<span class="pf-chip pf-c' + (k + 1) + '">' + esc(c) + "</span>").join("");
      const logos = i === 0 ? '<i class="pf-logo pf-l1">TM</i><i class="pf-logo pf-l2">AI</i><i class="pf-logo pf-l3">Ps</i><i class="pf-logo pf-l4">VFX</i>' : "";
      const bg = d.imgs[0] ? ' has-img" style="--pf-img:url(' + "'" + esc(d.imgs[0]) + "'" + ')' : "";
      return '<div class="pf-card' + (rtl ? " is-rtl" : "") + (portrait ? " is-portrait" : "") + '" style="width:' + cw + "px;height:" + ch + "px;left:" + (-cw / 2) + "px;top:" + (i * P) + "px;--u:" + u.toFixed(3) + '">' +
        '<div class="pf-bg' + bg + '"></div>' + (d.num ? '<div class="pf-n">' + d.num + "</div>" : "") +
        '<div class="pf-txt"><div class="pf-k"><i></i>' + esc(d.kicker) + '</div><h3 class="pf-t"' + small + ">" + d.title + "</h3>" +
        (d.text ? '<p class="pf-p">' + esc(d.text) + "</p>" : "") + "</div>" + tiles + chips + logos + "</div>";
    }).join("");

    document.body.appendChild(root);
    const L = els.length * P - gap;
    G = { vw, vh, cw, ch, P, L, els, data, docY, sCover: vw / cw, sFly: .78 * vw / cw, sFit: Math.min(.9 * vh / L, .9 * vw / cw), n: els.length };
  };

  /* ---------- camera ---------- */
  const render = (t) => {
    if (!G) return;
    const { P, ch, L, sCover, sFly, sFit } = G;
    const A = G.ya, B = G.yb, Yg = lerp(A, B, .88), Ymid = L / 2;
    // tilt
    let th = lerp(0, TILT, eio(seg(t, T.tiltA, T.tiltB)));
    th = lerp(th, TILT_TOP, eio(seg(t, T.glideB, T.riseB)));
    th = lerp(th, 0, eio(seg(t, T.diveA, T.diveB)));
    // scale (log space, so the zoom feels even)
    let ls = lerp(Math.log(sCover), Math.log(sFly), eio(seg(t, T.tiltA, T.tiltB)));
    ls = lerp(ls, Math.log(sFit), eio(seg(t, T.glideB, T.riseB)));
    ls = lerp(ls, Math.log(sCover), eio(seg(t, T.diveA, T.diveB)));
    // travel
    let y = lerp(A, Yg, eios(seg(t, T.glideA, T.glideB)));
    y = lerp(y, Ymid, eio(seg(t, T.glideB, T.riseB)));
    y = lerp(y, B, eio(seg(t, T.diveA, T.diveB)));
    const s = Math.exp(ls);
    plane.style.transform = "rotateX(" + th.toFixed(2) + "deg) scale3d(" + s.toFixed(5) + "," + s.toFixed(5) + "," + s.toFixed(5) + ") translate3d(0," + (-y).toFixed(1) + "px,0)";
    // floor haze toward the horizon only while the camera is low
    fog.style.opacity = (clamp((th - 14) / (TILT - 14), 0, 1)).toFixed(3);
    // stage
    const fin = eio(seg(t, 0, T.fade)), fout = eio(seg(t, T.jump + 40, T.end));
    root.style.opacity = (fin * (1 - fout)).toFixed(3);
    hud.classList.toggle("on", t > T.riseB - 200 && t < T.jump + 60);
  };

  /* ---------- run ---------- */
  const currentIndex = () => {
    const mid = scrollY + innerHeight * .5; let k = 0;
    G.docY.forEach((y, i) => { if (y <= mid) k = i; });
    return k;
  };
  const doJump = (y) => {
    window.__tmJumpUntil = performance.now() + 2200;
    try {
      if (window.__lenis && typeof window.__lenis.scrollTo === "function") window.__lenis.scrollTo(y, { immediate: true, force: true });
    } catch (_) {}
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
  };
  const finish = () => {
    cancelAnimationFrame(raf); raf = 0;
    if (root) root.remove();
    root = plane = hud = fog = null; G = null; busy = false; skipAt = null; jumped = false;
    document.body.classList.remove("pf-lock");
    try { window.dispatchEvent(new Event("scroll")); } catch (_) {}
  };
  const tick = (now) => {
    let t = now - t0;
    if (skipAt !== null) t = Math.max(t, skipAt + (now - skipAt0));   // after a skip, run the tail quickly
    if (!jumped && t >= T.jump) { jumped = true; doJump(G.target); }
    if (t >= T.end) { finish(); return; }
    render(t);
    raf = requestAnimationFrame(tick);
  };
  let skipAt0 = 0;
  const skip = () => {
    if (!busy || skipAt !== null || !G) return;
    const now = performance.now(), t = now - t0;
    if (t >= T.jump) return;
    // jump straight to the end of the dive: keep the picture continuous by fast-forwarding the clock
    skipAt = T.jump - 120; skipAt0 = now;
  };

  const start = (up) => {
    if (busy) return;
    busy = true; jumped = false; skipAt = null;
    window.__scrollOrbitDir = up ? "up" : "down";
    try { window.playScrollOrbitSound && window.playScrollOrbitSound(); } catch (_) {}
    build();
    const cur = currentIndex();
    const tgtIdx = up ? 0 : G.n - 1;
    G.ya = cur * G.P + G.ch / 2;
    G.yb = tgtIdx * G.P + G.ch / 2;
    if (Math.abs(G.yb - G.ya) < G.P * .3) G.ya = clamp(G.yb + (up ? 1 : -1) * G.P * .6, 0, G.L);   // already at the end: still give the camera something to fly over
    G.target = up ? 0 : document.documentElement.scrollHeight;
    hud.textContent = G.data[tgtIdx].label.toUpperCase();
    document.body.classList.add("pf-lock");
    root.classList.add("is-on");
    root.addEventListener("pointerdown", skip);
    root.addEventListener("wheel", e => { e.preventDefault(); skip(); }, { passive: false });
    root.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
    render(0);
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  };

  document.addEventListener("keydown", e => { if (busy && (e.key === "Escape" || e.key === " " || e.key === "Enter")) { e.preventDefault(); skip(); } }, true);
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#scrollOrbit");
    if (!b || reduce.matches) return;                       // reduced motion: keep the original smooth scroll
    e.preventDefault(); e.stopImmediatePropagation();
    start(b.classList.contains("is-up"));
  }, true);

  window.__pageFlight = { start, render, build, T, get geo() { return G; }, _pause: () => cancelAnimationFrame(raf), _t: (t) => { if (!G) return; render(t); } };
})();
