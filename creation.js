/* ===== 06 / AI CREATION — DRIFT WALL. Drop images/l1.jpg, l2.jpg ... (jpg, jpeg, png, webp) and they appear by themselves. ===== */
(() => {
"use strict";
const sec = document.getElementById("creation"); if (!sec) return;
const wall = sec.querySelector(".cr-wall"), more = sec.querySelector(".cr-more"), numEl = sec.querySelector(".cr-count b");
const MAX = 300, GAP = 8, EXTS = ["jpg", "webp", "png", "jpeg"], FIRST = 30;
const items = []; let colCount = 0, shown = 0, started = false, finished = false, built = false, rebuilding = false;

/* glass frame + hint are created here so index.html stays untouched */
const glass = document.createElement("div"); glass.className = "cr-glass";
wall.parentNode.insertBefore(glass, wall); glass.appendChild(wall);
const hint = document.createElement("div"); hint.className = "cr-hint";
const rtl = document.documentElement.dir === "rtl";
hint.innerHTML = '<i></i><span data-en="HOVER TO PAUSE · CLICK TO OPEN" data-ar="مرّر للإيقاف · اضغط للفتح">' + (rtl ? "مرّر للإيقاف · اضغط للفتح" : "HOVER TO PAUSE · CLICK TO OPEN") + "</span>";
glass.after(hint);

const head = u => fetch(u, { method: "HEAD" }).then(r => r.ok).catch(() => false);
const find = async n => { for (const x of EXTS) { const u = "images/l" + n + "." + x; if (await head(u)) return u; } return ""; };
const dims = u => new Promise(res => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im.naturalHeight / (im.naturalWidth || 1)); im.onerror = () => res(0); im.src = u; });
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
    const nums = []; for (let i = 0; i < 12 && next + i <= MAX; i++) nums.push(next + i);
    if (!nums.length) break;
    const urls = await Promise.all(nums.map(find));
    const rs = await Promise.all(urls.map(u => (u ? dims(u) : 0)));
    for (let i = 0; i < nums.length; i++) {
      if (urls[i]) { miss = 0; if (rs[i]) items.push({ n: nums[i], u: urls[i], r: rs[i], k: items.length }); }
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
  new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) run(); }, { rootMargin: "900px 0px" }).observe(more);
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
