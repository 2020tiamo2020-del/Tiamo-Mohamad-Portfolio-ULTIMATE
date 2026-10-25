/* ==========================================================================
   ABOUT · "alternate suit" reveal  (v2 — soft, cinematic)
   Move the pointer over the portrait: a smooth, feathered light-brush follows
   it and melts the original portrait into the second (cyber-suit) portrait.
   The trail lingers, then dissolves back. A soft violet-blue bloom hugs the
   revealed suit; there are no outlines. Taps do the same on touch screens.
   Adds one canvas inside the portrait's <picture>; it follows the portrait's
   own tilt / parallax. Nothing else on the page is touched.
   ========================================================================== */
(() => {
"use strict";
const ALT_SRC = "images/tiamo-about-alt.webp";
/* if the two portraits ever sit slightly off from each other, nudge here
   (x / y as a fraction of the portrait box, s = scale) */
const ALIGN = { x: 0, y: 0, s: 1 };
const BRUSH = 0.2;        /* brush radius, as a share of the portrait height */
const HOLD = 520;         /* ms a stroke stays fully revealed */
const FADE = 1700;        /* ms it then takes to melt back */
const BLOOM = 0.5;        /* strength of the soft glow around the revealed suit */

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
const altc = mk(), mc = mk(), gc = mk();            /* fitted portrait / brush mask / bloom (quarter size) */
const mctx = mc.getContext("2d"), gctx = gc.getContext("2d");

const alt = new Image();
let altOK = false;
alt.onload = () => { altOK = true; fit(); };
alt.src = ALT_SRC;

/* a feathered round brush: smooth falloff, no hard edge anywhere */
const brush = mk(); brush.width = brush.height = 256;
{
  const b = brush.getContext("2d"), g = b.createRadialGradient(128, 128, 0, 128, 128, 128);
  [[0, 1], [0.3, 0.92], [0.5, 0.66], [0.7, 0.3], [0.86, 0.09], [1, 0]].forEach(([o, a]) => g.addColorStop(o, "rgba(255,255,255," + a + ")"));
  b.fillStyle = g; b.fillRect(0, 0, 256, 256);
}

let W = 0, H = 0, dpr = 1;
const fit = () => {
  W = cv.offsetWidth; H = cv.offsetHeight;
  if (!W || !H) return;
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  [cv, altc, mc].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
  gc.width = Math.max(2, Math.round(W / 5)); gc.height = Math.max(2, Math.round(H / 5));
  if (!altOK) return;
  const a = altc.getContext("2d");
  a.setTransform(dpr, 0, 0, dpr, 0, 0);
  a.clearRect(0, 0, W, H);
  const s = Math.min(W / alt.naturalWidth, H / alt.naturalHeight) * ALIGN.s;     /* same as object-fit:contain, centred */
  const dw = alt.naturalWidth * s, dh = alt.naturalHeight * s;
  a.drawImage(alt, (W - dw) / 2 + ALIGN.x * W, (H - dh) / 2 + ALIGN.y * H, dw, dh);
};
if ("ResizeObserver" in window) new ResizeObserver(fit).observe(cv); else addEventListener("resize", fit);

/* ---------- the stroke ---------- */
let blobs = [], target = null, cur = null, lastEmit = null, raf = 0, lastT = 0;
const addBlob = (x, y, k, grow) => { blobs.push({ x, y, k, grow: !!grow, t: performance.now() }); if (blobs.length > 160) blobs.splice(0, blobs.length - 160); };
const stroke = (x, y) => {
  const r = H * BRUSH, step = Math.max(8, r * 0.16);
  if (!lastEmit) { lastEmit = { x, y }; addBlob(x, y, 1); return; }
  const dx = x - lastEmit.x, dy = y - lastEmit.y, d = Math.hypot(dx, dy);
  if (d < step) return;
  const n = Math.min(14, Math.floor(d / step));
  for (let i = 1; i <= n; i++) addBlob(lastEmit.x + dx * i / n, lastEmit.y + dy * i / n, 1);
  lastEmit = { x: x, y: y };
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
  if (!p) { target = null; lastEmit = null; return; }
  target = p; if (!cur) cur = { x: p.x, y: p.y };
  wake();
}, { passive: true });
sec.addEventListener("pointerleave", () => { target = null; lastEmit = null; }, { passive: true });
sec.addEventListener("pointerdown", e => {            /* touch: a tap opens a soft bloom of the second portrait */
  if (e.pointerType !== "touch" || !altOK) return;
  const p = local(e); if (!p) return;
  addBlob(p.x, p.y, 1, true); addBlob(p.x, p.y - H * 0.04, 0.8, true); wake();
}, { passive: true });

/* ---------- draw ---------- */
const smooth = t => t * t * (3 - 2 * t);
const frame = now => {
  raf = 0;
  const dt = Math.min(64, lastT ? now - lastT : 16); lastT = now;
  cv.style.translate = img.style.translate || "";      /* follow the portrait's own parallax */

  /* the brush glides after the pointer (silky, never jumpy) */
  if (target && cur) {
    const k = 1 - Math.exp(-dt / 70);
    cur.x += (target.x - cur.x) * k; cur.y += (target.y - cur.y) * k;
    stroke(cur.x, cur.y);
  }

  const R = H * BRUSH;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.clearRect(0, 0, W, H);
  let live = 0;
  for (let i = blobs.length - 1; i >= 0; i--) {
    const b = blobs[i], age = now - b.t;
    if (age >= HOLD + FADE) { blobs.splice(i, 1); continue; }
    live++;
    const f = age < HOLD ? 1 : 1 - smooth((age - HOLD) / FADE);
    const grow = b.grow ? 0.45 + 0.75 * (1 - Math.pow(1 - Math.min(1, age / 520), 3)) : 1;
    const rr = R * (0.9 + 0.1 * f) * grow;
    mctx.globalAlpha = Math.min(1, f * b.k * 0.9);
    mctx.drawImage(brush, b.x - rr, b.y - rr, rr * 2, rr * 2);
  }
  mctx.globalAlpha = 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (live) {
    /* the second portrait, kept only inside the soft brush */
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(altc, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mc, 0, 0);
    /* soft violet-blue bloom around what is revealed (down-/up-scaling = cheap blur) */
    gctx.setTransform(1, 0, 0, 1, 0, 0);
    gctx.globalCompositeOperation = "source-over";
    gctx.clearRect(0, 0, gc.width, gc.height);
    gctx.imageSmoothingEnabled = true;
    gctx.drawImage(cv, 0, 0, gc.width, gc.height);
    gctx.globalCompositeOperation = "source-atop";
    gctx.fillStyle = "rgba(125,95,255,.65)"; gctx.fillRect(0, 0, gc.width, gc.height);
    gctx.globalCompositeOperation = "source-over";
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = BLOOM;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(gc, 0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  if (live || (target && cur)) raf = requestAnimationFrame(frame); else lastT = 0;
};
const wake = () => { if (!raf && !document.hidden) { lastT = 0; raf = requestAnimationFrame(frame); } };
})();
