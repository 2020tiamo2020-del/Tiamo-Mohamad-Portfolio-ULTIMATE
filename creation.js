/* ===== 06 / AI CREATION — DRIFT WALL. Drop images/l1.jpg, l2.jpg ... (jpg, jpeg, png, webp) and they appear by themselves. ===== */
(() => {
"use strict";
const sec = document.getElementById("creation"); if (!sec) return;
const wall = sec.querySelector(".cr-wall"), more = sec.querySelector(".cr-more"), numEl = sec.querySelector(".cr-count b");
const MAX = 300, GAP = 8, EXTS = ["jpg", "webp", "png", "jpeg"], FIRST = 20;
const items = []; let colCount = 0, shown = 0, started = false, finished = false, built = false, rebuilding = false;

/* glass frame + hint are created here so index.html stays untouched */
const glass = document.createElement("div"); glass.className = "cr-glass";
wall.parentNode.insertBefore(glass, wall); glass.appendChild(wall);
const hint = document.createElement("div"); hint.className = "cr-hint";
const rtl = document.documentElement.dir === "rtl";
hint.innerHTML = '<i></i><span data-en="HOVER TO PAUSE · CLICK TO OPEN" data-ar="مرّر للإيقاف · اضغط للفتح">' + (rtl ? "مرّر للإيقاف · اضغط للفتح" : "HOVER TO PAUSE · CLICK TO OPEN") + "</span>";
glass.after(hint);

const dims = u => new Promise(res => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im.naturalHeight / (im.naturalWidth || 1)); im.onerror = () => res(0); im.src = u; });
/* Fast discovery: only the first 64 KB of each file is requested, which is enough to know that it exists and what its proportions are
   (JPG / PNG / WebP). The full picture is downloaded later, only for tiles that are about to be seen. */
const ratioOf = b => {
  const n = b.length;
  if (n > 24 && b[0] === 0x89 && b[1] === 0x50) { const w = ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0, h = ((b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]) >>> 0; return w ? h / w : 0; }
  if (n > 4 && b[0] === 0xFF && b[1] === 0xD8) {
    let i = 2;
    while (i < n - 9) {
      if (b[i] !== 0xFF) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xFF) { i++; continue; }
      if (m === 0xD8 || m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { i += 2; continue; }
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { const h = (b[i + 5] << 8) | b[i + 6], w = (b[i + 7] << 8) | b[i + 8]; return w ? h / w : 0; }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
    return 0;
  }
  if (n > 30 && b[0] === 0x52 && b[8] === 0x57) {
    const t = String.fromCharCode(b[12], b[13], b[14], b[15]); let w = 0, h = 0;
    if (t === "VP8 ") { w = (b[26] | (b[27] << 8)) & 0x3fff; h = (b[28] | (b[29] << 8)) & 0x3fff; }
    else if (t === "VP8L") { const x = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); w = (x & 0x3fff) + 1; h = ((x >> 14) & 0x3fff) + 1; }
    else if (t === "VP8X") { w = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1; h = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1; }
    return w ? h / w : 0;
  }
  return 0;
};
const peek = async u => {
  const ctl = new AbortController();
  try {
    const res = await fetch(u, { headers: { Range: "bytes=0-65535" }, signal: ctl.signal });
    if (!res.ok) return null;
    let buf;
    if (res.body && res.body.getReader) {
      const rd = res.body.getReader(), parts = []; let got = 0;
      while (got < 65536) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; }
      ctl.abort(); buf = new Uint8Array(got); let o = 0; parts.forEach(c => { buf.set(c, o); o += c.length; });
    } else buf = new Uint8Array(await res.arrayBuffer());
    return { u, r: ratioOf(buf) || (await dims(u)) };
  } catch (e) { return null; }
};
const find = async n => {            // all four extensions are asked at once; the first one that exists (jpg, webp, png, jpeg) wins
  const rs = await Promise.all(EXTS.map(x => peek("images/l" + n + "." + x)));
  return rs.find(r => r && r.r) || null;
};
const want = () => { const w = glass.clientWidth; return w >= 1120 ? 5 : w >= 820 ? 4 : w >= 560 ? 3 : 2; };
const gapPx = () => (innerWidth <= 900 ? 9 : 14);

/* lazy picture loading inside the wall */
const lazy = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const t = e.target; lazy.unobserve(t);
  const im = new Image(); im.onload = () => { t.firstChild.style.backgroundImage = "url('" + t.dataset.u + "')"; t.classList.add("ld"); }; im.onerror = () => t.classList.add("ld"); im.src = t.dataset.u;
}), { root: wall, rootMargin: "400px 0px" }) : null;

const tile = (it, copy) => {
  const t = document.createElement("div"); t.className = "cr-tile"; t.dataset.u = it.u; t.dataset.k = it.k;
  if (copy) t.setAttribute("aria-hidden", "true"); else { t.setAttribute("role", "img"); t.setAttribute("aria-label", "AI artwork " + it.n); }
  t.innerHTML = '<div class="cr-img" style="padding-bottom:' + it.r * 100 + '%"></div><span class="cr-num">' + String(it.n).padStart(2, "0") + '</span><div class="cr-guard"></div>';
  t.addEventListener("click", () => open(it.k));
  lazy ? lazy.observe(t) : (t.firstChild.style.backgroundImage = "url('" + it.u + "')", t.classList.add("ld"));
  return t;
};

/* build columns: shortest-column packing, then repeat the set until it is taller than the frame, then clone it once for a seamless loop */
const build = () => {
  if (!items.length) return;
  colCount = want(); const g = gapPx(), cw = (glass.clientWidth - 28 - g * (colCount - 1)) / colCount, fh = wall.clientHeight || 700;
  wall.innerHTML = "";
  const buckets = Array.from({ length: colCount }, () => ({ h: 0, list: [] }));
  items.forEach(it => { const b = buckets.reduce((a, c) => (c.h < a.h ? c : a)); b.list.push(it); b.h += cw * it.r + g; });
  buckets.forEach((b, i) => {
    const col = document.createElement("div"); col.className = "cr-col" + (i % 2 ? " dn" : "");
    const reps = Math.max(1, Math.ceil((fh * 1.25) / Math.max(b.h, 1)));
    for (let c = 0; c < 2; c++) for (let r = 0; r < reps; r++) b.list.forEach(it => col.appendChild(tile(it, c || r)));
    const speed = 20 + (i % 3) * 6, dur = Math.max(20, (b.h * reps) / speed);
    col.style.setProperty("--t", dur + "s"); col.style.animationDelay = -(dur * ((i * 0.37) % 1)) + "s";
    wall.appendChild(col);
  });
  built = true;
};
const rebuild = () => {
  if (rebuilding) return; rebuilding = true;
  if (!built) { build(); requestAnimationFrame(() => wall.classList.add("on")); rebuilding = false; return; }
  wall.classList.remove("on"); setTimeout(() => { build(); requestAnimationFrame(() => wall.classList.add("on")); rebuilding = false; }, 520);
};

const setCount = () => { if (!numEl) return; const to = items.length, from = shown; shown = to; const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / 700); numEl.textContent = Math.round(from + (to - from) * p); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

/* discover images 12 at a time, keep numeric order */
const run = async () => {
  if (started) return; started = true; more.classList.add("busy");
  let next = 1, miss = 0, done = false, firstShown = false;
  while (!done) {
    const nums = []; for (let i = 0; i < 16 && next + i <= MAX; i++) nums.push(next + i);
    if (!nums.length) break;
    const found = await Promise.all(nums.map(find));
    for (let i = 0; i < nums.length; i++) {
      if (found[i]) { miss = 0; items.push({ n: nums[i], u: found[i].u, r: found[i].r, k: items.length }); }
      else if (++miss >= GAP) { done = true; break; }
    }
    next += nums.length; setCount();
    if (!firstShown && items.length >= FIRST) { firstShown = true; rebuild(); }
  }
  finished = true; more.classList.remove("busy");
  if (!items.length) { sec.classList.add("cr-none"); return; }
  setCount();
  if (!firstShown || items.length > FIRST) { const wait = () => (rebuilding ? setTimeout(wait, 200) : rebuild()); wait(); }
};
if ("IntersectionObserver" in window) {
  new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) run(); }, { rootMargin: "2600px 0px" }).observe(more);
  /* do not wait for the visitor to arrive: start right after the page has loaded */
  addEventListener("load", () => setTimeout(run, 700));
  /* pause the drifting when the section is off screen */
  new IntersectionObserver(es => es.forEach(e => wall.classList.toggle("off", !e.isIntersecting)), { threshold: 0 }).observe(glass);
} else run();

/* touch: hold the wall while a finger is on it */
let tm = 0;
wall.addEventListener("touchstart", () => { clearTimeout(tm); wall.classList.add("hold"); }, { passive: true });
["touchend", "touchcancel"].forEach(ev => wall.addEventListener(ev, () => { clearTimeout(tm); tm = setTimeout(() => wall.classList.remove("hold"), 1800); }, { passive: true }));

let rw = 0; addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(() => { if (items.length && built && want() !== colCount) rebuild(); }, 250); });

/* ----- protection: no right-click menu, no drag, no long-press save inside this section ----- */
["contextmenu", "dragstart", "selectstart"].forEach(ev => sec.addEventListener(ev, e => e.preventDefault()));

/* ----- viewer ----- */
const v = document.createElement("div"); v.className = "cr-view"; v.setAttribute("role", "dialog"); v.setAttribute("aria-hidden", "true");
v.innerHTML = '<div class="cr-pic"></div><button class="cr-x" type="button" aria-label="Close">×</button><button class="cr-pv" type="button" aria-label="Previous">‹</button><button class="cr-nx" type="button" aria-label="Next">›</button><div class="cr-n"></div>';
document.body.appendChild(v);
const pic = v.querySelector(".cr-pic"), cnt = v.querySelector(".cr-n"); let cur = 0;
["contextmenu", "dragstart"].forEach(ev => v.addEventListener(ev, e => e.preventDefault()));
const show = k => { cur = (k + items.length) % items.length; pic.classList.add("swap");
  setTimeout(() => { pic.style.backgroundImage = "url('" + items[cur].u + "')"; pic.classList.remove("swap"); }, 160);
  cnt.textContent = String(cur + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
};
function open(k) { v.classList.add("open"); v.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; show(k); }
const close = () => { v.classList.remove("open"); v.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };
v.querySelector(".cr-x").onclick = close; v.querySelector(".cr-pv").onclick = () => show(cur - 1); v.querySelector(".cr-nx").onclick = () => show(cur + 1);
v.addEventListener("click", e => { if (e.target === v) close(); });
document.addEventListener("keydown", e => { if (!v.classList.contains("open")) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
let sx = 0; v.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
v.addEventListener("touchend", e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); }, { passive: true });
})();

/* ===== Scroll motion for 04 + 06 — same behaviour as Services / Work (title-first rise + scroll-velocity heading shift) ===== */
(() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sec = document.getElementById("creation"), strip = document.querySelector(".social-strip");
  const reveal = (host, watch, cls) => {
    if (!host || !watch) return;
    if (!("IntersectionObserver" in window)) { host.classList.add(cls); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { host.classList.add(cls); io.disconnect(); } }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
    io.observe(watch);
  };
  reveal(sec, sec && sec.querySelector(".cr-head"), "tm-in");
  reveal(strip, strip, "tm-in");

  const items = [];
  if (sec) { const h = sec.querySelector(".cr-head"); h && items.push({ host: sec, node: h, max: 56, cur: 0 }); }
  if (strip) {
    const t = strip.querySelector(":scope > div:first-child"), l = strip.querySelector(".social-links");
    t && items.push({ host: strip, node: t, max: 40, cur: 0 }); l && items.push({ host: strip, node: l, max: 24, cur: 0 });
  }
  if (!items.length) return;
  const GAIN = 2.0, FOLLOW = .22, DECAY = .86;
  let lastY = scrollY || 0, vel = 0, raf = 0, lastT = 0;
  const presence = r => { const vh = innerHeight || 800, v = Math.min(r.bottom, vh) - Math.max(r.top, 0); return v <= 0 ? 0 : clamp(v / Math.min(r.height || vh, vh * .6), 0, 1); };
  const frame = now => {
    const dt = clamp(lastT ? now - lastT : 16.7, 8, 50) / 16.7; lastT = now;
    const y = scrollY || 0, dy = (y - lastY) / dt; lastY = y;
    vel = Math.abs(dy) > .01 ? vel * .55 + dy * .45 : vel * Math.pow(DECAY, dt);
    if (Math.abs(vel) < .02) vel = 0;
    const follow = 1 - Math.pow(1 - FOLLOW, dt); let moving = vel !== 0;
    items.forEach(it => {
      const target = clamp(-vel * GAIN, -it.max, it.max) * presence(it.host.getBoundingClientRect());
      it.cur += (target - it.cur) * follow;
      if (Math.abs(it.cur) < .03 && target === 0) it.cur = 0;
      if (it.cur !== 0) moving = true;
      it.node.style.setProperty("--tm-scroll-shift", it.cur.toFixed(2) + "px");
    });
    if (moving) raf = requestAnimationFrame(frame); else { raf = 0; lastT = 0; }
  };
  const kick = () => { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } };
  addEventListener("scroll", kick, { passive: true }); addEventListener("wheel", kick, { passive: true });
  addEventListener("touchmove", kick, { passive: true }); addEventListener("resize", kick, { passive: true });
  document.addEventListener("visibilitychange", () => { vel = 0; kick(); });
})();

/* ===== Liquid Glass (trial): the glossy highlight follows the pointer over viewer buttons and "Find Me" pills ===== */
(() => {
  document.addEventListener("pointermove", e => {
    const t = e.target.closest && e.target.closest(".cr-view button,.social-links a,.header-actions .lang,.header-actions .mini-wa"); if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty("--lg-x", (e.clientX - r.left) + "px"); t.style.setProperty("--lg-y", (e.clientY - r.top) + "px");
  }, { passive: true });
})();

/* ===== Liquid Glass (trial 3): pointer highlight for the new glass elements, header glow, and the Chrome-only liquid bend ===== */
(() => {
  const SEL = ".btn.ghost,.ba-pg-btn,.wheel-arrow,#creation .cr-count,.scroll-orbit,.music-mini,#tmOrb,.service-grid article,.arrow", HEAD = ".site-header";
  const put = (t, e) => { const r = t.getBoundingClientRect(); t.style.setProperty("--lg-x", (e.clientX - r.left) + "px"); t.style.setProperty("--lg-y", (e.clientY - r.top) + "px"); };
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || !e.target.closest) return;
    const a = e.target.closest(SEL); if (a) put(a, e);
    const h = e.target.closest(HEAD); if (h) put(h, e);
  }, { passive: true });
  document.addEventListener("pointerout", e => {
    if (!e.target.closest) return;
    [SEL, HEAD].forEach(s => { const t = e.target.closest(s); if (t && !t.contains(e.relatedTarget)) { t.style.removeProperty("--lg-x"); t.style.removeProperty("--lg-y"); } });
  }, { passive: true });
  try {
    const ch = navigator.userAgentData && navigator.userAgentData.brands.some(b => /Chromium/.test(b.brand));
    if (ch && matchMedia("(min-width:901px)").matches && CSS.supports("backdrop-filter", "url(#tm-lens)")) {
      document.body.insertAdjacentHTML("beforeend", '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><filter id="tm-lens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".006 .03" numOctaves="2" seed="7" result="n"/><feGaussianBlur in="n" stdDeviation="2" result="nb"/><feDisplacementMap in="SourceGraphic" in2="nb" scale="16" xChannelSelector="R" yChannelSelector="G"/></filter></svg>');
      document.documentElement.classList.add("lg-refract");
    }
  } catch (e) {}
})();

/* ===== Liquid Glass (trial 8): the hero sphere turns slowly (and follows the pointer); TM / play icon / BEYOND move with that turn ===== */
(() => {
  const orb = document.getElementById("tmOrb"); if (!orb) return;
  const vol = document.createElement("i"); vol.className = "core-vol"; vol.setAttribute("aria-hidden", "true"); orb.insertBefore(vol, orb.firstChild);
  let px = 0, py = 0, ry = 0, rx = 0, raf = 0, on = true;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const r = orb.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    px = clamp((e.clientX - cx) / (r.width * 2.4), -1, 1); py = clamp((e.clientY - cy) / (r.height * 2.4), -1, 1);
  }, { passive: true });
  document.addEventListener("pointerleave", () => { px = py = 0; });
  const frame = t => {
    if (!on || document.hidden) { raf = 0; return; }
    const tr = Math.sin(t / 2700) * .55 + px * .6, tx = py * -.45;
    ry += (tr - ry) * .06; rx += (tx - rx) * .06;
    orb.style.setProperty("--ry", ry.toFixed(3)); orb.style.setProperty("--rx", rx.toFixed(3));
    raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf && on) raf = requestAnimationFrame(frame); };
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { on = es.some(e => e.isIntersecting); go(); }, { rootMargin: "100px" }).observe(orb);
  document.addEventListener("visibilitychange", go);
  go();
})();
