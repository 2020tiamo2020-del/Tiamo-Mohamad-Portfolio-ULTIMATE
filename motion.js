/* TIAMO — Motion layer. Independent of script.js: nothing here edits existing logic. */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EASE = "cubic-bezier(.16,1,.3,1)";
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

/* 1 · Circular reveal when switching language (View Transitions API, graceful fallback) */
const lb = $("#langBtn");
if (lb && document.startViewTransition) {
  let pass = false;
  lb.addEventListener("click", e => {
    if (pass) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const r = lb.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const ring = document.createElement("div");
    ring.className = "tm-ring";
    Object.assign(ring.style, { width: 2 * R + "px", height: 2 * R + "px", left: x - R + "px", top: y - R + "px" });
    document.body.appendChild(ring);
    const vt = document.startViewTransition(() => { pass = true; lb.click(); pass = false; });
    const T = { duration: 1000, easing: "cubic-bezier(.65,0,.2,1)" };
    ring.animate([{ scale: 0, opacity: 1 }, { scale: 1, opacity: 0.9, offset: 0.8 }, { scale: 1, opacity: 0 }], { ...T, fill: "forwards" }).finished.then(() => ring.remove(), () => ring.remove());
    vt.ready.then(() => document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
      { ...T, pseudoElement: "::view-transition-new(root)" })).catch(() => {});
  }, true);
}

/* 2 · Scroll progress line + radial gauge on the scroll button */
const bar = document.createElement("div"); bar.className = "tm-progress"; document.body.appendChild(bar);
const so = $("#scrollOrbit"); let fg = null;
if (so) {
  so.insertAdjacentHTML("beforeend", '<svg class="tm-gauge" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="tmGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b35ff"/><stop offset="1" stop-color="#16d8ff"/></linearGradient></defs><circle class="bg" cx="20" cy="20" r="18.5"/><circle class="fg" cx="20" cy="20" r="18.5" pathLength="100"/></svg>');
  fg = $(".fg", so);
}

/* 3 · Sliding pill in the nav + scroll-spy */
const nav = $("#nav");
let links = [], active = null, pill = null;
if (nav) {
  links = $$("a", nav);
  pill = document.createElement("i"); pill.className = "tm-pill"; pill.setAttribute("aria-hidden", "true"); nav.prepend(pill);
  const place = l => {
    if (!l || innerWidth <= 900) { pill.style.opacity = 0; return; }
    pill.style.opacity = 1;
    pill.style.width = l.offsetWidth + 22 + "px"; pill.style.height = l.offsetHeight + 12 + "px";
    pill.style.transform = `translate(${l.offsetLeft - 11}px,${l.offsetTop - 6}px)`;
  };
  const targets = links.map(a => $(a.getAttribute("href")));
  const spy = () => {
    let idx = 0;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top <= innerHeight * 0.38) idx = i; });
    if (scrollY < 120) idx = 0;
    if (links[idx] !== active) {
      active = links[idx]; links.forEach(a => a.classList.toggle("tm-on", a === active)); place(active);
    }
  };
  links.forEach(a => a.addEventListener("pointerenter", () => place(a)));
  nav.addEventListener("pointerleave", () => place(active));
  const re = () => place(active);
  addEventListener("resize", re);
  new MutationObserver(() => setTimeout(re, 60)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  document.fonts?.ready.then(re);
  addEventListener("load", () => { spy(); re(); });
  window.__tmSpy = spy;
}

let tick = false;
const onScroll = () => {
  if (tick) return; tick = true;
  requestAnimationFrame(() => {
    tick = false;
    const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
    if (fg) fg.style.strokeDashoffset = 100 - p * 100;
    window.__tmSpy && window.__tmSpy();
  });
};
addEventListener("scroll", onScroll, { passive: true }); onScroll();

/* 4 · Staggered rise (blur + lift) as each block enters the viewport */
const SEL = ".section-kicker,.section-title,.cr-head,.cr-more,.gallery-card,.social-links a,.contact h2,.contact-btn,.ba-copy .btn";
if ("IntersectionObserver" in window) {
  const st = $$(SEL).filter(e => !e.closest(".section-heading-scroll") && !e.closest(".hero"));
  st.forEach(e => e.classList.add("tm-st"));
  st.forEach(e => { if (e.parentElement.closest(".tm-st")) e.classList.remove("tm-st"); });
  const io = new IntersectionObserver(es => {
    const hit = es.filter(x => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    hit.forEach((x, i) => {
      const el = x.target; io.unobserve(el);
      el.style.animationDelay = i * 90 + "ms";
      el.classList.add("tm-in");
      el.addEventListener("animationend", () => { el.classList.remove("tm-st", "tm-in"); el.style.animationDelay = ""; }, { once: true });
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".tm-st").forEach(e => io.observe(e));
  setTimeout(() => $$(".tm-st:not(.tm-in)").forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.remove("tm-st"); }), 6000);
}

/* 5 · Cursor-following light on glass cards */
if (fine) {
  const cards = $$(".service-grid article,.gallery-card,.cert,.ba-card");
  cards.forEach(c => {
    if (getComputedStyle(c).position === "static") c.style.position = "relative";
    const s = document.createElement("i"); s.className = "tm-spot"; s.setAttribute("aria-hidden", "true"); c.appendChild(s);
  });
  let pend = null;
  document.addEventListener("pointermove", e => {
    const c = e.target.closest?.(".service-grid article,.gallery-card,.cert,.ba-card"); if (!c) return;
    if (pend) return;
    pend = requestAnimationFrame(() => {
      pend = null; const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  }, { passive: true });
}

/* 6 · Tooltip that glides after the pointer */
if (fine) {
  const tip = document.createElement("div"); tip.className = "tm-tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip);
  const TS = ".lang,.menu,.scroll-orbit,.music-mini,.core,.arrow,.ba-thumb,.social-links a,.mini-wa";
  let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, timer = 0, cur = null;
  const loop = () => {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    tip.style.transform = `translate(${cx + 16}px,${cy + 20}px)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 || cur ? requestAnimationFrame(loop) : 0;
  };
  const label = el => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
  document.addEventListener("pointermove", e => {
    tx = e.clientX; ty = e.clientY;
    const el = e.target.closest?.(TS);
    if (el !== cur) {
      cur = el; clearTimeout(timer); tip.classList.remove("on");
      if (el) timer = setTimeout(() => {
        const t = label(el); if (!t) return;
        tip.textContent = t; cx = tx; cy = ty; tip.classList.add("on");
      }, 380);
    }
    if (cur && !raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener("pointerdown", () => { clearTimeout(timer); tip.classList.remove("on"); });
}

/* 7 · Springy press feedback on every button */
document.addEventListener("pointerdown", e => {
  const el = e.target.closest?.(".btn,.contact-btn,.lang,.menu,.mini-wa,.ba-thumb,.arrow,.social-links a,.scroll-orbit,.enter-gate-btn");
  if (!el || !el.animate) return;
  el.animate([{ scale: 1 }, { scale: 0.94, offset: 0.3 }, { scale: 1.035, offset: 0.68 }, { scale: 1 }], { duration: 440, easing: EASE });
}, { passive: true });
})();
