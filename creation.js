/* ===== 06 / AI CREATION — added file. Drop images/l1.jpg, l2.jpg ... (jpg, jpeg, png, webp) and they appear by themselves. ===== */
(() => {
"use strict";
const sec = document.getElementById("creation"); if (!sec) return;
const wall = sec.querySelector(".cr-wall"), more = sec.querySelector(".cr-more"), numEl = sec.querySelector(".cr-count b");
const MAX = 300, GAP = 8, CHUNK = 18, EXTS = ["jpg", "webp", "png", "jpeg"];
const items = []; let cols = [], colCount = 0, next = 1, miss = 0, done = false, loading = false, shown = 0;

const head = u => fetch(u, { method: "HEAD" }).then(r => r.ok).catch(() => false);
const find = async n => { for (const x of EXTS) { const u = "images/l" + n + "." + x; if (await head(u)) return u; } return ""; };
const dims = u => new Promise(res => { const im = new Image(); im.decoding = "async"; im.onload = () => res(im.naturalHeight / (im.naturalWidth || 1)); im.onerror = () => res(0); im.src = u; });
const want = () => { const w = wall.clientWidth; return w >= 1180 ? 5 : w >= 860 ? 4 : w >= 560 ? 3 : 2; };

const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); setTimeout(() => e.target.classList.add("cr-hot"), 1200); }
}), { rootMargin: "0px 0px -6% 0px", threshold: .05 }) : null;

const build = it => {
  const t = document.createElement("div"); t.className = "cr-tile"; t.setAttribute("role", "img");
  t.setAttribute("aria-label", "AI artwork " + it.n); t.style.setProperty("--d", (it.k % 6) * .08 + "s");
  t.innerHTML = '<div class="cr-img" style="padding-bottom:' + it.r * 100 + '%;background-image:url(\'' + it.u + '\')"></div><span class="cr-num">' + String(it.n).padStart(2, "0") + '</span><div class="cr-guard"></div>';
  t.addEventListener("click", () => open(it.k));
  t.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const b = t.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
    t.style.setProperty("--mx", x * 100 + "%"); t.style.setProperty("--my", y * 100 + "%");
    t.style.setProperty("--ry", (x - .5) * 9 + "deg"); t.style.setProperty("--rx", (.5 - y) * 9 + "deg");
  });
  t.addEventListener("pointerleave", () => { t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); });
  it.el = t; return t;
};
const place = it => {
  const hs = cols.map(c => c._h), i = hs.indexOf(Math.min(...hs));
  cols[i].appendChild(it.el || build(it)); cols[i]._h += it.r + .03;
  io ? io.observe(it.el) : it.el.classList.add("in");
};
const layout = () => {
  colCount = want(); wall.innerHTML = ""; cols = [];
  for (let i = 0; i < colCount; i++) { const c = document.createElement("div"); c.className = "cr-col"; c._h = 0; wall.appendChild(c); cols.push(c); }
  items.forEach(it => { it.el && it.el.classList.remove("in", "cr-hot"); place(it); });
};
const setCount = () => { if (!numEl) return; const to = items.length, from = shown; shown = to; const t0 = performance.now();
  const step = t => { const p = Math.min(1, (t - t0) / 700); numEl.textContent = Math.round(from + (to - from) * p); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };

const loadChunk = async () => {
  if (loading || done) return; loading = true; more.classList.add("busy");
  const got = [];
  while (got.length < CHUNK && !done) {
    const nums = []; for (let i = 0; i < 12 && next + i <= MAX; i++) nums.push(next + i);
    if (!nums.length) { done = true; break; }
    const urls = await Promise.all(nums.map(find));
    for (let i = 0; i < nums.length; i++) { if (urls[i]) { miss = 0; got.push({ n: nums[i], u: urls[i] }); } else if (++miss >= GAP) { done = true; break; } }
    next += nums.length;
  }
  const rs = await Promise.all(got.map(g => dims(g.u)));
  got.forEach((g, i) => { if (!rs[i]) return; const it = { n: g.n, u: g.u, r: rs[i], k: items.length }; items.push(it); place(it); });
  if (!items.length && done) sec.classList.add("cr-none");
  setCount(); loading = false; more.classList.remove("busy");
  if (!done && more.getBoundingClientRect().top < innerHeight + 700) loadChunk();
};
if ("IntersectionObserver" in window) {
  new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) loadChunk(); }, { rootMargin: "900px 0px" }).observe(more);
} else loadChunk();
let rw = 0; addEventListener("resize", () => { clearTimeout(rw); rw = setTimeout(() => { if (want() !== colCount && items.length) layout(); }, 200); });
layout();

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
  if (cur > items.length - 6 && !done) loadChunk(); };
function open(k) { v.classList.add("open"); v.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; show(k); }
const close = () => { v.classList.remove("open"); v.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };
v.querySelector(".cr-x").onclick = close; v.querySelector(".cr-pv").onclick = () => show(cur - 1); v.querySelector(".cr-nx").onclick = () => show(cur + 1);
v.addEventListener("click", e => { if (e.target === v) close(); });
document.addEventListener("keydown", e => { if (!v.classList.contains("open")) return; if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(cur + 1); if (e.key === "ArrowLeft") show(cur - 1); });
let sx = 0; v.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
v.addEventListener("touchend", e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); }, { passive: true });
})();
