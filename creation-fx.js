/* ==========================================================================
   04 / AI CREATION · line-sweep reveal  (same system as about-fx.js, own scope)
   Kicker, headline and paragraph of the AI Creation heading are swept line by line
   by the same gradient bar used in About. Nothing else in the section is touched.
   Tuning: PLAN / SHOW_AT / SPEED_GATE below, bar colours in creation-fx.css.
   To undo: remove the creation-fx.css / creation-fx.js tags from index.html.
   ========================================================================== */
(() => {
"use strict";
const sec = document.getElementById("creation");
if (!sec || !("animate" in Element.prototype)) return;

const kicker = sec.querySelector(".cr-head .section-kicker");
const h2 = sec.querySelector(".cr-head h2");
const para = sec.querySelector(".cr-head > div > p");
const photo = null;
const header = document.querySelector(".site-header");
if (!kicker || !h2 || !para) return;

/* timeline (ms): when each block starts, how long one line sweep lasts, delay between lines */
const PLAN = [
  { el: kicker, start: 0,   dur: 620, gap: 0   },
  { el: h2,     start: 140, dur: 900, gap: 170 },
  { el: para,   start: 420, dur: 720, gap: 85  },
];
const COVER = 0.42;                       /* share of one sweep spent covering the line */
const EASE = "cubic-bezier(.76,0,.24,1)";
const SHOW_AT = 0.55;                     /* how much of the heading block must be on screen to start */
const HIDE_AT = 0.06;                     /* below this it counts as left → re-arm */
const SPEED_GATE = 1400;                  /* px/s: start only when scrolling is slower than this */

[kicker, h2, para].forEach(e => e.classList.remove("tm-st", "tm-in", "tm-hd"));

let state = "shown";                      /* armed | playing | shown */
let anims = [], timers = [], splits = [];

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

/* ---------- split an element into word spans ---------- */
const splitWords = el => {
  const rec = { el, html: el.innerHTML, words: [], bars: null, stale: false };
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(t => {
    const frag = document.createDocumentFragment();
    t.nodeValue.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(part); return; }
      const s = document.createElement("span");
      s.className = "crfx-w";
      s.textContent = part;
      frag.append(s);
      rec.words.push(s);
    });
    t.replaceWith(frag);
  });
  return rec;
};

/* ---------- group the words into visual lines ---------- */
const measureLines = rec => {
  const host = rec.el.getBoundingClientRect();
  const lines = [];
  rec.words.forEach(w => {
    const r = w.getBoundingClientRect();
    if (!r.width || !r.height) return;
    let L = lines[lines.length - 1];
    if (!L || Math.abs(r.top - L.refTop) > r.height * 0.5) {
      L = { refTop: r.top, l: Infinity, r: -Infinity, t: Infinity, b: -Infinity, words: [] };
      lines.push(L);
    }
    L.l = Math.min(L.l, r.left); L.r = Math.max(L.r, r.right);
    L.t = Math.min(L.t, r.top);  L.b = Math.max(L.b, r.bottom);
    L.words.push(w);
  });
  lines.forEach(L => { L.l -= host.left; L.r -= host.left; L.t -= host.top; L.b -= host.top; });
  return lines;
};

/* ---------- play ---------- */
const play = () => {
  if (state === "playing") return;
  state = "playing";
  clearTimers();

  /* 1 · split + measure while still invisible (armed), then reveal the container */
  splits = PLAN.map(p => splitWords(p.el));
  const geo = splits.map(measureLines);
  sec.classList.remove("cr-armed");

  let end = 0;
  splits.forEach((rec, bi) => {
    const { start, dur, gap } = PLAN[bi];
    const rtl = getComputedStyle(rec.el).direction === "rtl";
    const holder = document.createElement("i");
    holder.className = "crfx-bars";
    holder.setAttribute("aria-hidden", "true");
    rec.el.appendChild(holder);
    rec.bars = holder;

    geo[bi].forEach((L, li) => {
      const t0 = start + li * gap;
      const padX = 6;
      /* bar height = the line's own slot (never taller than the distance to the next line) so stacked bars touch but never overlap */
      const next = geo[bi][li + 1], prev = geo[bi][li - 1];
      const mid = (L.t + L.b) / 2;
      let top = L.t, bottom = L.b;
      if (next) bottom = Math.min(bottom, (L.b + next.t) / 2 > mid ? (L.b + next.t) / 2 : L.b);
      if (prev) top = Math.max(top, (L.t + prev.b) / 2 < mid ? (L.t + prev.b) / 2 : L.t);
      const trim = (bottom - top) * 0.04;
      const bar = document.createElement("i");
      bar.className = "crfx-bar";
      Object.assign(bar.style, {
        left: L.l - padX + "px", width: L.r - L.l + padX * 2 + "px",
        top: top + trim + "px", height: bottom - top - trim * 2 + "px",
      });
      holder.appendChild(bar);

      const hidden = rtl ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)";
      const full = "inset(0 0 0 0)";
      const gone = rtl ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
      anims.push(bar.animate(
        [
          { clipPath: hidden, offset: 0, easing: EASE },
          { clipPath: full, offset: COVER, easing: EASE },
          { clipPath: gone, offset: 1 },
        ],
        { duration: dur, delay: t0, fill: "both" }
      ));

      /* letters stay invisible until the bar fully covers the line, then the bar uncovers them */
      L.words.forEach(w => {
        anims.push(w.animate(
          [{ visibility: "hidden" }, { visibility: "visible" }],
          { duration: 1, delay: t0 + dur * COVER, fill: "both", easing: "steps(1,end)" }
        ));
      });
      end = Math.max(end, t0 + dur);
    });
  });

  /* portrait glides in together with the text */
  later(() => photo && photo.classList.add("show"), 220);

  /* 2 · clean up: back to plain, selectable text */
  later(() => { finishPlain(); state = "shown"; }, end + 80);
};

const finishPlain = () => {
  anims.forEach(a => { try { a.cancel(); } catch (_) {} });
  anims = [];
  splits.forEach(rec => {
    if (!rec.stale) rec.el.innerHTML = rec.html;
    else rec.bars && rec.bars.remove();
  });
  splits = [];
};

/* ---------- re-arm (hide, ready to play again) ---------- */
const arm = () => {
  if (state === "armed") return;
  clearTimers();
  if (state === "playing") finishPlain();
  state = "armed";
  sec.classList.add("cr-armed");
  photo && photo.classList.remove("show");
};

/* ---------- where is the heading block on screen? ---------- */
const visibility = () => {
  const a = kicker.getBoundingClientRect(), b = para.getBoundingClientRect();
  const hb = header ? header.getBoundingClientRect().bottom : 80;
  const vh = innerHeight || document.documentElement.clientHeight;
  const H = Math.max(1, b.bottom - a.top);
  const top = Math.max(a.top, hb), bot = Math.min(b.bottom, vh * 0.94);
  return Math.max(0, bot - top) / H;
};

/* ---------- scroll speed + decision loop ---------- */
let lastY = scrollY, lastT = performance.now(), speed = 0, raf = 0, pending = false;

const evaluate = () => {
  const vis = visibility();
  pending = false;
  if (state === "armed") {
    if (vis >= SHOW_AT) { if (speed < SPEED_GATE) play(); else pending = true; }
  } else if (vis < HIDE_AT) {
    arm();
  }
};
const tick = () => {
  raf = 0;
  const now = performance.now(), y = scrollY, dt = Math.max(1, now - lastT);
  speed = speed * 0.5 + (Math.abs(y - lastY) / dt * 1000) * 0.5;
  lastY = y; lastT = now;
  evaluate();
  if (speed > 8 || pending) raf = requestAnimationFrame(tick);
};
const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

addEventListener("scroll", kick, { passive: true });
addEventListener("resize", () => { if (state === "playing") { finishPlain(); clearTimers(); state = "shown"; photo && photo.classList.add("show"); } kick(); }, { passive: true });

/* ---------- About button: replay when you are already there ---------- */
document.querySelectorAll('a[href="#creation"]').forEach(a => {
  a.addEventListener("click", () => {
    if (state !== "armed" && visibility() > 0.3) {
      arm();
      later(() => { speed = 0; kick(); }, 380);
    } else kick();
  }, true);
});

/* ---------- language switch: never leave half-split text behind ---------- */
new MutationObserver(() => {
  if (state === "playing") {
    splits.forEach(r => { r.stale = true; });
    clearTimers();
    finishPlain();
    state = "shown";
    photo && photo.classList.add("show");
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });

/* ---------- start: hidden, then decide once fonts + layout are ready ---------- */
state = "armed";
sec.classList.add("cr-armed");
photo && photo.classList.remove("show");
const boot = () => { speed = 0; lastY = scrollY; kick(); };
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
  if (document.readyState === "complete") setTimeout(boot, 120);
  else addEventListener("load", () => setTimeout(boot, 120), { once: true });
});
/* safety net: if anything above ever fails to start, never leave the section empty */
setTimeout(() => { if (state === "armed" && visibility() >= SHOW_AT) { speed = 0; play(); } }, 6000);
})();
