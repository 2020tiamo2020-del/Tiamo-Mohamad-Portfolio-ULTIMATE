/* ==========================================================================
   ABOUT · "alternate suit" reveal
   Move the pointer over the portrait: broken, angular pieces of the second
   (cyber-suit) portrait appear along the path of the pointer and then fade
   away, leaving the original portrait. Taps do the same on touch screens.
   Nothing else on the page is touched: this adds one canvas inside the
   portrait's <picture> and follows the portrait's own tilt / parallax.
   ========================================================================== */
(() => {
"use strict";
const ALT_SRC = "images/tiamo-about-alt.webp";
/* if the two portraits ever sit slightly off from each other, nudge here
   (x / y as a fraction of the portrait box, s = scale) */
const ALIGN = { x: 0, y: 0, s: 1 };

const sec = document.getElementById("about");
const pic = sec && sec.querySelector(".about-photo picture");
const img = pic && pic.querySelector("img");
if (!sec || !pic || !img) return;
if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

const cv = document.createElement("canvas");
cv.className = "ab-alt";
cv.setAttribute("aria-hidden", "true");
pic.appendChild(cv);
const ctx = cv.getContext("2d");
const mk = () => document.createElement("canvas");
const altc = mk(), mc = mk(), ec = mk();            /* fitted portrait / shard mask / shard edges */
const mctx = mc.getContext("2d"), ectx = ec.getContext("2d");

const alt = new Image();
let altOK = false;
alt.onload = () => { altOK = true; fit(); };
alt.src = ALT_SRC;

let W = 0, H = 0, dpr = 1;
const fit = () => {
  const r = cv.getBoundingClientRect();
  /* layout size (getBoundingClientRect includes transforms, offsetWidth does not) */
  W = cv.offsetWidth || r.width; H = cv.offsetHeight || r.height;
  if (!W || !H) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  [cv, altc, mc, ec].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
  if (!altOK) return;
  const a = altc.getContext("2d");
  a.setTransform(dpr, 0, 0, dpr, 0, 0);
  a.clearRect(0, 0, W, H);
  const s = Math.min(W / alt.naturalWidth, H / alt.naturalHeight) * ALIGN.s;     /* same as object-fit:contain, centered */
  const dw = alt.naturalWidth * s, dh = alt.naturalHeight * s;
  a.drawImage(alt, (W - dw) / 2 + ALIGN.x * W, (H - dh) / 2 + ALIGN.y * H, dw, dh);
};
if ("ResizeObserver" in window) new ResizeObserver(fit).observe(cv); else addEventListener("resize", fit);

/* ---------- shards ---------- */
let shards = [], last = null, raf = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
const addShard = (x, y, dirx, diry) => {
  const base = Math.max(34, Math.min(150, H * rnd(0.08, 0.15)));
  const n = 5 + ((Math.random() * 3) | 0), rot = rnd(0, 6.283), v = [];
  for (let i = 0; i < n; i++) {
    const ang = rot + (i / n) * 6.283 + rnd(-0.28, 0.28);
    const rr = base * rnd(0.55, 1.15);
    v.push([Math.cos(ang) * rr, Math.sin(ang) * rr]);
  }
  /* pieces lead slightly ahead of the pointer, like torn fragments being flung */
  const lead = base * rnd(0.1, 0.5);
  shards.push({ x: x + dirx * lead, y: y + diry * lead, v, t: performance.now(), hold: rnd(380, 720), fade: rnd(520, 820) });
  if (shards.length > 90) shards.splice(0, shards.length - 90);
};
const emit = (x, y) => {
  if (!last) { last = { x, y }; addShard(x, y, 0, 0); return; }
  const dx = x - last.x, dy = y - last.y, d = Math.hypot(dx, dy), step = Math.max(22, H * 0.05);
  if (d < step) return;
  const n = Math.min(6, Math.floor(d / step)), ux = dx / d, uy = dy / d;
  for (let i = 1; i <= n; i++) addShard(last.x + dx * i / n, last.y + dy * i / n, ux, uy);
  last = { x, y };
};

/* ---------- pointer ---------- */
const local = e => {
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
};
sec.addEventListener("pointermove", e => {
  if (e.pointerType === "touch" || !altOK) return;
  const p = local(e);
  if (!p) { last = null; return; }
  emit(p.x, p.y); wake();
}, { passive: true });
sec.addEventListener("pointerleave", () => { last = null; }, { passive: true });
sec.addEventListener("pointerdown", e => {            /* touch: a tap bursts a few pieces */
  if (e.pointerType !== "touch" || !altOK) return;
  const p = local(e); if (!p) return;
  for (let i = 0; i < 7; i++) addShard(p.x + rnd(-H * 0.07, H * 0.07), p.y + rnd(-H * 0.07, H * 0.07), 0, 0);
  wake();
}, { passive: true });

/* ---------- draw ---------- */
const poly = (c, s, k) => { c.beginPath(); s.v.forEach((p, i) => { const X = s.x + p[0] * k, Y = s.y + p[1] * k; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
const frame = now => {
  raf = 0;
  /* follow the portrait's own parallax (motion.js moves the <img> with `translate`) */
  cv.style.translate = img.style.translate || "";
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0); ectx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.clearRect(0, 0, W, H); ectx.clearRect(0, 0, W, H);
  let live = 0;
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i], age = now - s.t, life = s.hold + s.fade;
    if (age >= life) { shards.splice(i, 1); continue; }
    live++;
    const pop = Math.min(1, age / 110), k = 0.55 + 0.45 * (1 - Math.pow(1 - pop, 3));
    const a = age < s.hold ? 1 : 1 - (age - s.hold) / s.fade, al = a * a * (3 - 2 * a);
    mctx.globalAlpha = al; mctx.fillStyle = "#fff"; poly(mctx, s, k); mctx.fill();
    ectx.globalAlpha = al * (age < 160 ? 1 : 0.8);
    ectx.lineWidth = 1.6; ectx.lineJoin = "round";
    ectx.strokeStyle = "rgba(150,220,255,1)"; ectx.shadowColor = "rgba(139,53,255,.9)"; ectx.shadowBlur = 10;
    poly(ectx, s, k); ectx.stroke();
  }
  mctx.globalAlpha = 1; ectx.globalAlpha = 1; ectx.shadowBlur = 0;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (live) {
    /* the second portrait, kept only inside the shards */
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(altc, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mc, 0, 0);
    /* glowing broken edges, only where the portrait has pixels */
    ectx.setTransform(1, 0, 0, 1, 0, 0);
    ectx.globalCompositeOperation = "destination-in";
    ectx.drawImage(altc, 0, 0);
    ectx.globalCompositeOperation = "source-over";
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(ec, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    raf = requestAnimationFrame(frame);
  }
};
const wake = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); };
})();
