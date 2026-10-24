/* ==========================================================================
   ABOUT · portrait card + certificate move as ONE pair, linked to the scroll
   - Leaving About (wheel down / wheel up / About button from another section):
     the portrait glides to the right and the certificate to the left, at the same
     moment, same easing, same distance-in-time, and fade out as they leave.
   - Coming back (from above or below, wheel or About button) they glide in and meet
     again in the exact original layout.
   - Scroll-linked + smoothed: the motion follows your wheel, with a soft inertia.
   - Desktop layout only (>= 901px). Phones keep the old behaviour untouched.
   To undo: remove the about-link.css / about-link.js tags from index.html.
   ========================================================================== */
(() => {
"use strict";
const sec = document.getElementById("about");
const photo = sec && sec.querySelector(".about-photo");
const cert = document.getElementById("certBlock");
if (!sec || !photo || !cert) return;

const mq = matchMedia("(min-width:901px)");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);                               /* smoothstep */
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); /* in-out cubic */
const GAP = 40;       /* extra px past the screen edge so nothing is left peeking */
const FOLLOW = 0.1;   /* 0..1  how quickly the cards follow the scroll (lower = silkier) */

let on = false, cur = 0, raf = 0, lastT = 0, pxP = 0, pxC = 0;

/* about-fx.js toggles .show on the photo to run its own entrance; while this pair controller is on,
   the photo must keep .show (glow + float live there) and only the position/opacity is driven here */
const keepShow = () => { if (on && !photo.classList.contains("show")) photo.classList.add("show"); };
new MutationObserver(keepShow).observe(photo, { attributes: true, attributeFilter: ["class"] });

/* how far (0..1) About has left the screen, from either side */
const target = () => {
  const r = sec.getBoundingClientRect(), vh = innerHeight || 1;
  const leaving = clamp((vh * 0.78 - r.bottom) / (vh * 0.6), 0, 1);   /* bottom edge rising off the top */
  const arriving = clamp((r.top - vh * 0.42) / (vh * 0.5), 0, 1);     /* top edge still low on the screen */
  return ease(Math.max(leaving, arriving));
};

const apply = e => {
  const vw = innerWidth || 1;
  /* rest geometry = current rect minus what we already applied */
  const rp = photo.getBoundingClientRect(), rc = cert.getBoundingClientRect();
  const pL = rp.left - pxP, pR = rp.right - pxP;
  const cL = rc.left - pxC, cR = rc.right - pxC;
  const pDir = (pL + pR) / 2 >= vw / 2 ? 1 : -1;
  const cDir = (cL + cR) / 2 >= vw / 2 ? 1 : -1;
  const dxP = pDir > 0 ? vw - pL + GAP : -(pR + GAP);
  const dxC = cDir > 0 ? vw - cL + GAP : -(cR + GAP);
  pxP = dxP * e; pxC = dxC * e;
  const fade = 1 - smooth(clamp((e - 0.5) / 0.5, 0, 1));
  sec.style.setProperty("--ab-px", pxP.toFixed(2) + "px");
  sec.style.setProperty("--ab-cx", pxC.toFixed(2) + "px");
  sec.style.setProperty("--ab-po", fade.toFixed(3));
  sec.style.setProperty("--ab-co", fade.toFixed(3));
};

const frame = now => {
  raf = 0;
  if (!on) return;
  const dt = Math.min(64, Math.max(1, now - (lastT || now))); lastT = now;
  const tg = target();
  const k = 1 - Math.pow(1 - FOLLOW, dt / 16.67);
  cur += (tg - cur) * k;
  if (Math.abs(tg - cur) < 0.0004) cur = tg;
  apply(cur);
  if (cur !== tg) raf = requestAnimationFrame(frame); else lastT = 0;
};
const kick = () => { if (on && !raf) raf = requestAnimationFrame(frame); };

const enable = () => {
  if (on) return;
  on = true; sec.classList.add("ab-link");
  keepShow();
  cur = target(); pxP = pxC = 0; apply(cur);      /* start exactly where the scroll is: no jump */
  kick();
};
const disable = () => {
  if (!on) return;
  on = false; sec.classList.remove("ab-link");
  ["--ab-px", "--ab-cx", "--ab-po", "--ab-co"].forEach(p => sec.style.removeProperty(p));
  pxP = pxC = 0; cur = 0;
};
const sync = () => { mq.matches ? enable() : disable(); kick(); };

addEventListener("scroll", kick, { passive: true });
addEventListener("resize", () => { sync(); }, { passive: true });
(mq.addEventListener ? mq.addEventListener("change", sync) : mq.addListener(sync));
/* About button / any in-page jump: keep following while the page glides there */
document.addEventListener("click", e => { if (e.target.closest && e.target.closest('a[href^="#"]')) { kick(); setTimeout(kick, 120); setTimeout(kick, 400); } }, true);
sync();
})();
