/* ==========================================================================
   ABOUT · line-sweep reveal  (one controller, replaces every old About animation)

   How it behaves
   ─ The About text is EMPTY (hidden) while you are on Home or anywhere outside About.
   ─ When About comes into view  (About button, mouse-wheel down from Home, wheel up from
     below, drag, touch) a coloured bar sweeps each line, then retreats and uncovers the
     letters behind its edge  (same idea as the reference video).
   ─ Leaving About re-arms it, so it plays again on every visit, in both directions.
   ─ It waits for the scroll to slow down before it starts, so a fast fly-by or the
     smooth-scroll of the About button never starts the animation half way.
   ─ Clicking About while you are already there replays it.
   ─ Arabic / RTL works (bars sweep from the right).
   ─ The two cards (portrait from the RIGHT, certificate from the LEFT) are driven together by
     ONE trigger: both classes (.show / .cert-in) are switched in the same tick, so they enter
     and retreat in sync, and they stay while any real part of the About block is on screen.
   To undo everything: remove about-fx.css + about-fx.js tags from index.html.
   ========================================================================== */
(() => {
"use strict";
const sec = document.getElementById("about");
const cert = document.getElementById("certBlock");
/* if the effect cannot run, never leave the cards hidden */
const unhide = () => {
  cert && cert.classList.add("cert-in");
  const ph = sec && sec.querySelector(".about-photo");
  ph && ph.classList.add("show");
};
if (!sec || !("animate" in Element.prototype)) { unhide(); return; }

const kicker = sec.querySelector(".section-kicker");
const h2 = sec.querySelector(".section-title h2");
const para = sec.querySelector(".section-title p");
const photo = sec.querySelector(".about-photo");
const header = document.querySelector(".site-header");
if (!kicker || !h2 || !para) { unhide(); return; }

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

sec.classList.add("about-in");            /* keep the old slide-in system permanently out of the way */
[kicker, h2, para].forEach(e => e.classList.remove("tm-st", "tm-in", "tm-hd"));

let state = "shown";                      /* armed | playing | shown */
let anims = [], timers = [], splits = [];

/* ---------- the two cards: portrait (from the right) + certificate (from the left) ---------- */
const wide = () => matchMedia("(min-width:901px)").matches;
const cardOn = { photo: false, cert: false };
const setCard = (k, on) => {
  if (cardOn[k] === on) return;
  cardOn[k] = on;
  const el = k === "photo" ? photo : cert;
  el && el.classList.toggle(k === "photo" ? "show" : "cert-in", on);
};
const cardsIn  = () => { setCard("photo", true);  setCard("cert", true);  };   /* same tick = same frame = in sync */
const cardsOut = () => { setCard("photo", false); setCard("cert", false); };

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
      s.className = "ab-w";
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
  sec.classList.remove("ab-armed");

  let end = 0;
  splits.forEach((rec, bi) => {
    const { start, dur, gap } = PLAN[bi];
    const rtl = getComputedStyle(rec.el).direction === "rtl";
    const holder = document.createElement("i");
    holder.className = "ab-bars";
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
      bar.className = "ab-bar";
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
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 1, delay: t0 + dur * COVER, fill: "both", easing: "steps(1,end)" }
        ));
      });
      end = Math.max(end, t0 + dur);
    });
  });

  /* portrait (right) and certificate (left) glide in together, right as the text starts */
  if (wide()) later(cardsIn, 220);

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
  sec.classList.add("ab-armed");
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

/* cards: how much of the About block (text + certificate + portrait) is on screen decides, not the heading alone */
const CARD_IN = 0.40, CARD_OUT = 0.22;   /* share of the block; capped in px so tall/short blocks behave the same */
const evalCards = () => {
  const hb = header ? header.getBoundingClientRect().bottom : 80;
  const vh = innerHeight || document.documentElement.clientHeight;
  const bot = vh * 0.94;
  const seen = (t, b) => Math.max(0, Math.min(b, bot) - Math.max(t, hb));
  if (wide()) {
    const rs = [kicker, cert, photo].filter(Boolean).map(e => e.getBoundingClientRect());
    const t = Math.min(...rs.map(r => r.top)), b = Math.max(...rs.map(r => r.bottom));
    const H = Math.max(1, b - t), v = seen(t, b);
    if (!(cardOn.photo && cardOn.cert)) {
      if (v >= Math.min(H * CARD_IN, 260)) { if (speed < SPEED_GATE) cardsIn(); else pending = true; }
    } else if (v < Math.min(H * CARD_OUT, 150)) {
      cardsOut();
    }
  } else {
    /* phones: the cards are stacked, so each one follows its own position */
    [["cert", cert, 0.3, 0.06], ["photo", photo, 0.25, 0.05]].forEach(([k, el, inAt, outAt]) => {
      if (!el) return;
      const r = el.getBoundingClientRect(), f = seen(r.top, r.bottom) / Math.max(1, r.height);
      if (!cardOn[k]) { if (f >= inAt) { if (speed < SPEED_GATE) setCard(k, true); else pending = true; } }
      else if (f < outAt) setCard(k, false);
    });
  }
};

const evaluate = () => {
  const vis = visibility();
  pending = false;
  const textGoing = state === "armed" && vis >= SHOW_AT;   /* play() (or the speed gate) will bring the cards with the text */
  if (state === "armed") {
    if (vis >= SHOW_AT) { if (speed < SPEED_GATE) play(); else pending = true; }
  } else if (vis < HIDE_AT) {
    arm();
  }
  if (!(wide() && textGoing)) evalCards();
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
addEventListener("resize", () => { if (state === "playing") { finishPlain(); clearTimers(); state = "shown"; cardsIn(); } kick(); }, { passive: true });

/* ---------- About button: replay when you are already there ---------- */
document.querySelectorAll('a[href="#about"]').forEach(a => {
  a.addEventListener("click", () => {
    if (state !== "armed" && visibility() > 0.3) {
      arm();
      if (wide()) cardsOut();     /* cards retreat and come back together with the replayed text */
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
    cardsIn();
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });

/* ---------- start: hidden, then decide once fonts + layout are ready ---------- */
state = "armed";
sec.classList.add("ab-armed");
photo && photo.classList.remove("show");
const boot = () => { speed = 0; lastY = scrollY; kick(); };
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
  if (document.readyState === "complete") setTimeout(boot, 120);
  else addEventListener("load", () => setTimeout(boot, 120), { once: true });
});
/* safety net: if anything above ever fails to start, never leave the section empty */
setTimeout(() => { if (state === "armed" && visibility() >= SHOW_AT) { speed = 0; play(); } }, 6000);
})();
