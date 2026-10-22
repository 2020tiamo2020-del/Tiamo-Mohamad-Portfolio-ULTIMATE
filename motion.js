/* TIAMO — Motion layer. Independent of script.js: nothing here edits existing logic. */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EASE = "cubic-bezier(.16,1,.3,1)";
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

/* 1 · Circular reveal when switching language (View Transitions API, graceful fallback) */
const lb = $("#langBtn");
if (lb && document.startViewTransition && fine) {
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
    const yLock = window.scrollY || document.documentElement.scrollTop || 0;
    const vt = document.startViewTransition(() => {
      pass = true;
      lb.click();
      /* View Transitions often reset scroll — pin it inside the update callback */
      try {
        if (window.__lenis) window.__lenis.scrollTo(yLock, { immediate: true });
        else window.scrollTo(0, yLock);
      } catch (_) { window.scrollTo(0, yLock); }
      pass = false;
    });
    const pin = () => {
      try {
        if (window.__lenis) window.__lenis.scrollTo(yLock, { immediate: true });
        else window.scrollTo(0, yLock);
      } catch (_) { window.scrollTo(0, yLock); }
    };
    const T = { duration: 1000, easing: "cubic-bezier(.65,0,.2,1)" };
    ring.animate([{ scale: 0, opacity: 1 }, { scale: 1, opacity: 0.9, offset: 0.8 }, { scale: 1, opacity: 0 }], { ...T, fill: "forwards" }).finished.then(() => ring.remove(), () => ring.remove());
    vt.ready.then(() => {
      pin();
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
        { ...T, pseudoElement: "::view-transition-new(root)" }).catch(() => {});
    }).catch(() => {});
    vt.finished.then(pin).catch(pin);
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
    if (window.__langScrollLock) return; /* freeze pill while language reflow settles */
    let idx = 0;
    targets.forEach((t, i) => {
      if (!t) return;
      /* #home is <main> wrapping the page — skip it for probe */
      if (t.id === "home" && t.tagName === "MAIN") return;
      if (t.getBoundingClientRect().top <= innerHeight * 0.38) idx = i;
    });
    if (scrollY < 80) idx = 0;
    const strip = $(".social-strip");
    if (strip && strip.getBoundingClientRect().top <= innerHeight * 0.45) idx = links.length - 1;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 48) {
      const contact = $("#contact");
      if (contact && contact.getBoundingClientRect().top < innerHeight * 0.75) idx = links.length - 1;
    }
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
const SEL = ".section-kicker,.cr-count,.cr-more,.gallery-card,.social-links a,.contact p,.contact-btn,.ba-copy .btn";
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
  const cards = $$(".service-grid article,.gallery-card,.ba-card");
  cards.forEach(c => {
    if (getComputedStyle(c).position === "static") c.style.position = "relative";
    const s = document.createElement("i"); s.className = "tm-spot"; s.setAttribute("aria-hidden", "true"); c.appendChild(s);
  });
  let pend = null;
  document.addEventListener("pointermove", e => {
    const c = e.target.closest?.(".service-grid article,.gallery-card,.ba-card"); if (!c) return;
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
  const TS = ".lang,.menu,.scroll-orbit,.music-mini,.core,.arrow,.ba-thumb,.social-links a,.mini-wa,.wheel-tick,.wheel-arrow";
  let cx = 0, cy = 0, tx = 0, ty = 0, raf = 0, timer = 0, cur = null;
  const loop = () => {
    cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
    tip.style.transform = `translate(${cx + 16}px,${cy + 20}px)`;
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 || cur ? requestAnimationFrame(loop) : 0;
  };
  const label = el => (el.dataset.tip || el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
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
  const el = e.target.closest?.(".btn,.contact-btn,.lang,.menu,.mini-wa,.ba-thumb,.arrow,.social-links a,.scroll-orbit,.enter-gate-btn,.core,.music-mini,.wheel-arrow,.wheel-tick");
  if (!el || !el.animate) return;
  el.animate([{ scale: 1 }, { scale: 0.94, offset: 0.3 }, { scale: 1.035, offset: 0.68 }, { scale: 1 }], { duration: 440, easing: EASE });
}, { passive: true });
})();

/* ===== Part 2 · the same motion language on text, images, certificate, portrait and the music players ===== */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const EASE = "cubic-bezier(.16,1,.3,1)", fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

/* A · Headings: words rise out of a mask, one after another (works for Arabic words too) */
const HS = ".section-title h2,.cr-head h2,.contact h2,.social-strip h2,.ba-copy h2";
const wrap = el => {
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), ns = []; let n = 0;
  while (w.nextNode()) ns.push(w.currentNode);
  ns.forEach(t => {
    const f = document.createDocumentFragment();
    t.nodeValue.split(/(\s+)/).forEach(p => {
      if (!p) return;
      if (/^\s+$/.test(p)) { f.append(p); return; }
      const o = document.createElement("span"); o.className = "tm-w"; o.textContent = p; o.style.setProperty("--wi", n++); f.append(o);
    });
    t.replaceWith(f);
  });
  return n;
};
if ("IntersectionObserver" in window) {
  const hs = $$(HS).filter(e => !e.closest(".hero,#services,#work,#beforeafter"));
  hs.forEach(e => e.classList.add("tm-hd"));
  const io = new IntersectionObserver(es => es.forEach(x => {
    if (!x.isIntersecting) return;
    const el = x.target; io.unobserve(el);
    const n = wrap(el); el.classList.remove("tm-hd");
    setTimeout(() => $$(".tm-w", el).forEach(o => o.replaceWith(o.textContent)), 1100 + n * 70);
  }), { threshold: 0.3 });
  hs.forEach(e => io.observe(e));
  setTimeout(() => $$(".tm-hd").forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.remove("tm-hd"); }), 7000);

  /* B · Section numbers roll up from 00 (like the counters in the video) */
  const ko = new IntersectionObserver(es => es.forEach(x => {
    if (!x.isIntersecting) return;
    const el = x.target; ko.unobserve(el);
    const node = el.firstChild, m = node && node.nodeType === 3 && /^(\d\d)([\s\S]*)$/.exec(node.nodeValue);
    if (!m) return;
    const to = +m[1], t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 900), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (el.firstChild === node) node.nodeValue = String(v).padStart(2, "0") + m[2];
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.8 });
  $$(".section-kicker").forEach(e => ko.observe(e));
}

/* C · Image viewer opens with the circular reveal, from the exact spot you clicked */
const lbx = $("#mediaLightbox"), stage = $(".lightbox-stage");
if (lbx && stage) {
  let ox = innerWidth / 2, oy = innerHeight / 2, on = false;
  document.addEventListener("pointerdown", e => { if (e.target.closest?.(".media-open,.cr-wall")) { ox = e.clientX; oy = e.clientY; } }, true);
  new MutationObserver(() => {
    const open = lbx.classList.contains("open");
    if (open && !on) {
      on = true;
      const R = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy));
      lbx.animate({ clipPath: [`circle(0px at ${ox}px ${oy}px)`, `circle(${R}px at ${ox}px ${oy}px)`] }, { duration: 780, easing: "cubic-bezier(.65,0,.2,1)" });
      stage.animate({ scale: [0.86, 1], opacity: [0, 1], filter: ["blur(14px)", "blur(0px)"] }, { duration: 950, delay: 140, easing: EASE, fill: "backwards" });
    } else if (!open && on) { on = false; ox = innerWidth / 2; oy = innerHeight / 2; }
  }).observe(lbx, { attributes: true, attributeFilter: ["class"] });
}

/* D · 3D tilt: certificate and portrait lean toward the pointer */
const tilt = (el, host, max) => {
  if (!el || !host) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
    const m = Math.hypot(cx, cy);
    el.style.rotate = m > 0.001 ? `${-cy} ${cx} 0 ${m * max}deg` : "";
    raf = m > 0.002 || Math.abs(tx) + Math.abs(ty) > 0.002 ? requestAnimationFrame(loop) : 0;
  };
  host.addEventListener("pointermove", e => {
    const r = host.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  host.addEventListener("pointerleave", () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
};
/* certificate: light real-3D lean while the pointer is on it (nothing else changes, no foil / glare) */
const lean = el => {
  if (!el) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, on = false;
  const loop = () => {
    cx += (tx - cx) * 0.1; cy += (ty - cy) * 0.1;
    if (on || Math.abs(cx) + Math.abs(cy) > 0.004) {
      el.style.transform = `perspective(1000px) rotateX(${(-cy * 5).toFixed(2)}deg) rotateY(${(cx * 7).toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    } else { el.style.transform = ""; el.style.transition = ""; el.style.willChange = ""; raf = 0; }
  };
  el.addEventListener("pointerenter", () => { on = true; el.style.transition = "none"; el.style.willChange = "transform"; if (!raf) raf = requestAnimationFrame(loop); });
  el.addEventListener("pointermove", e => { const r = el.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; }, { passive: true });
  el.addEventListener("pointerleave", () => { on = false; tx = ty = 0; });
};
if (fine) { lean($(".cert")); 
  const ph = $(".about-photo img"), ab = $("#about");
  if (ph && ab) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => { cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; ph.style.translate = `${(cx * -9).toFixed(2)}px ${(cy * -6).toFixed(2)}px`; raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0; };
    ab.addEventListener("pointermove", e => { const r = ab.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    ab.addEventListener("pointerleave", () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }
}

/* E · Music: expanding light rings while the music plays (big orb + small player) */
const orb = $("#tmOrb"), mini = $("#tmMini");
if (orb) {
  const ring = (host, orbEl) => {
    const i = document.createElement("i"); i.className = "tm-rip";
    if (orbEl) { const h = host.getBoundingClientRect(), o = orbEl.getBoundingClientRect(); Object.assign(i.style, { inset: "auto", left: o.left - h.left + "px", top: o.top - h.top + "px", width: o.width + "px", height: o.height + "px" }); }
    host.appendChild(i);
    const done = () => i.remove();
    i.animate([{ scale: 1, opacity: 0.6 }, { scale: 1.85, opacity: 0 }], { duration: 2400, easing: "cubic-bezier(.2,.7,.3,1)" }).finished.then(done, done);
  };
  const hv = orb.closest(".hero-visual") || orb.parentElement; let t = 0;
  const emit = () => ring(hv, orb);
  const sync = () => {
    const play = orb.getAttribute("aria-pressed") === "true";
    document.body.classList.toggle("tm-playing", play);
    clearInterval(t); if (play) { emit(); t = setInterval(emit, 1200); }
  };
  new MutationObserver(sync).observe(orb, { attributes: true, attributeFilter: ["aria-pressed"] });
}

/* F · Hero depth: tags, stars and orb drift gently against the pointer */
const hv = $(".hero-visual"), hero = $(".hero");
if (hv && hero && fine) {
  const L = $$(".floating-tag,.neon-star,.core", hv).map((el, i) => ({ el, d: el.classList.contains("core") ? 8 : 12 + (i % 4) * 8 }));
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    L.forEach(o => { o.el.style.translate = `${(cx * o.d).toFixed(2)}px ${(cy * o.d).toFixed(2)}px`; });
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
  };
  hero.addEventListener("pointermove", e => {
    tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
}
})();

/* ===== Part 3 · Services wheel: it now reacts to every turn ===== */
(() => {
"use strict";
const grid = document.querySelector("#services .service-grid");
if (!grid) return;
const cards = [...grid.querySelectorAll(":scope > article")];
if (cards.length < 3) return;
const EASE = "cubic-bezier(.16,1,.3,1)", SPRING = "cubic-bezier(.34,1.56,.64,1)";
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
const q = (c, sel) => c.querySelector(sel);

const halo = document.createElement("i"); halo.className = "tm-halo"; halo.setAttribute("aria-hidden", "true"); grid.prepend(halo);
cards.forEach(c => { const g = document.createElement("i"); g.className = "tm-glint"; g.setAttribute("aria-hidden", "true"); c.appendChild(g); });

/* the outlined number "decodes": random digits, then settles on the real one */
const decode = el => {
  const n = el.firstChild; if (!n || n.nodeType !== 3) return;
  const txt = n.nodeValue, t0 = performance.now();
  el.classList.remove("tm-lit");
  const step = now => {
    const p = Math.min(1, (now - t0) / 700);
    if (el.firstChild === n) n.nodeValue = p < 1 ? txt.replace(/\d/g, () => Math.floor(Math.random() * 10)) : txt;
    if (p < 1) requestAnimationFrame(step);
    else if (el.closest("article")?.classList.contains("is-active")) el.classList.add("tm-lit");   // neon only on the centre card
  };
  requestAnimationFrame(step);
};

/* every time a card becomes the centre card */
const onActive = card => {
  const ico = q(card, ":scope > span"), num = q(card, "small"), h = q(card, "h3"), p = q(card, "p"), g = q(card, ".tm-glint");
  ico?.animate([{ scale: 0.55, rotate: "-28deg", opacity: 0.4 }, { scale: 1.2, rotate: "7deg", opacity: 1, offset: 0.6 }, { scale: 1, rotate: "0deg", opacity: 1 }], { duration: 950, easing: SPRING });
  h?.animate({ translate: ["0 16px", "0 0"], opacity: [0, 1], filter: ["blur(9px)", "blur(0px)"] }, { duration: 780, delay: 140, easing: EASE, fill: "backwards" });
  p?.animate({ filter: ["blur(7px)", "blur(0px)"] }, { duration: 780, delay: 260, easing: EASE, fill: "backwards" });
  num && decode(num);
  if (g) { g.classList.remove("go"); void g.offsetWidth; g.classList.add("go"); }
  const i = cards.indexOf(card);
  grid.style.setProperty("--tmh", (272 - (i / (cards.length - 1)) * 86).toFixed(1));   // light colour glides purple -> cyan along the list
};
cards.forEach(c => {
  let was = c.classList.contains("is-active");
  new MutationObserver(() => { const now = c.classList.contains("is-active"); if (now && !was) onActive(c); if (!now && was) q(c, "small")?.classList.remove("tm-lit"); was = now; }).observe(c, { attributes: true, attributeFilter: ["class"] });
});

/* first appearance: the opening card decodes its number and lights up too */
if ("IntersectionObserver" in window) {
  const f = new IntersectionObserver(es => { if (es[0].isIntersecting) { f.disconnect(); const c = cards.find(x => x.classList.contains("is-active")), n = c && q(c, "small"); if (n) setTimeout(() => decode(n), 700); } }, { threshold: 0.4 });
  f.observe(grid);
}

/* the active card's icon and number drift against the pointer (CSS reads --px / --py) */
if (fine) {
  grid.addEventListener("pointermove", e => {
    const c = e.target.closest?.("article.is-active"); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--px", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
    c.style.setProperty("--py", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
  }, { passive: true });
  grid.addEventListener("pointerleave", () => cards.forEach(c => { c.style.setProperty("--px", 0); c.style.setProperty("--py", 0); }));
}

/* side rail: ticks swell like a dock near the pointer and show the service name */
const rail = grid.querySelector(".wheel-rail");
if (rail) {
  const ticks = [...rail.querySelectorAll(".wheel-tick")];
  const tips = () => ticks.forEach((t, i) => { const h = cards[i] && q(cards[i], "h3"); if (h) t.dataset.tip = h.textContent.trim(); });
  tips(); new MutationObserver(() => setTimeout(tips, 80)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (fine) {
    rail.addEventListener("pointermove", e => ticks.forEach(t => {
      const r = t.getBoundingClientRect(), d = Math.abs(e.clientY - (r.top + r.height / 2)), k = Math.exp(-(d * d) / (2 * 24 * 24));
      t.style.scale = `${(1 + k * 0.7).toFixed(3)} ${(1 + k * 1.3).toFixed(3)}`;
    }), { passive: true });
    rail.addEventListener("pointerleave", () => ticks.forEach(t => { t.style.scale = ""; }));
  }
}
})();

/* ===== Part 4 · mini player, toasts, enter gate ===== */
(() => {
"use strict";
const $ = (q, r = document) => r.querySelector(q);
const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
const http = /^https?:$/.test(location.protocol);

/* A · small music player: grab it anywhere, it glides with inertia and settles on the nearest side */
const mini = $("#tmMini");
if (mini) {
  let ox = 0, oy = 0, tx = 0, ty = 0, vx = 0, vy = 0, sx = 0, sy = 0, sox = 0, soy = 0, lx = 0, ly = 0, lt = 0, down = false, moved = false, raf = 0;
  const put = () => { mini.style.setProperty("--mx", ox.toFixed(1) + "px"); mini.style.setProperty("--my", oy.toFixed(1) + "px"); };
  const cl = (v, a, b) => Math.min(b, Math.max(a, v));
  const lim = () => { const r = mini.getBoundingClientRect(), bx = r.left - ox, by = r.top - oy, m = 12; return { x0: m - bx, x1: innerWidth - m - r.width - bx, y0: 84 - by, y1: innerHeight - m - r.height - by }; };
  const glide = () => {
    ox += (tx - ox) * 0.14; oy += (ty - oy) * 0.14; put();
    if (Math.abs(tx - ox) + Math.abs(ty - oy) > 0.4) raf = requestAnimationFrame(glide); else { ox = tx; oy = ty; put(); raf = 0; }
  };
  mini.addEventListener("pointerdown", e => {
    if (e.button > 0) return;
    down = true; moved = false; sx = lx = e.clientX; sy = ly = e.clientY; sox = ox; soy = oy; lt = performance.now(); vx = vy = 0;
    cancelAnimationFrame(raf); raf = 0;
    try { mini.setPointerCapture(e.pointerId); } catch (_) {}
  });
  mini.addEventListener("pointermove", e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) > 6) { moved = true; mini.classList.add("is-dragging"); }
    if (!moved) return;
    const L = lim(); ox = cl(sox + dx, L.x0, L.x1); oy = cl(soy + dy, L.y0, L.y1); put();
    const now = performance.now(), dt = Math.max(1, now - lt);
    vx = vx * 0.6 + ((e.clientX - lx) / dt) * 0.4; vy = vy * 0.6 + ((e.clientY - ly) / dt) * 0.4; lx = e.clientX; ly = e.clientY; lt = now;
  });
  const end = () => {
    if (!down) return; down = false; mini.classList.remove("is-dragging"); if (!moved) return;
    const L = lim(); tx = ox + vx * 260 > (L.x0 + L.x1) / 2 ? L.x1 : L.x0; ty = cl(oy + vy * 260, L.y0, L.y1);
    raf = requestAnimationFrame(glide);
  };
  mini.addEventListener("pointerup", end); mini.addEventListener("pointercancel", end);
  mini.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; } }, true);
  addEventListener("resize", () => { const L = lim(); tx = cl(ox, L.x0, L.x1); ty = cl(oy, L.y0, L.y1); if (!raf) raf = requestAnimationFrame(glide); });
}

/* B · toasts: the countdown line matches each toast's real lifetime */
const host = $("#toastHost");
if (host) new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
  if (n.nodeType === 1 && n.classList.contains("toast")) n.style.setProperty("--tm-dur", n.classList.contains("toast-success") ? "2600ms" : n.classList.contains("toast-welcome") ? "3800ms" : "3400ms");
}))).observe(host, { childList: true });

/* C · enter gate: logo glow + light sweep + 3D lean, and a burst when you enter */
const gate = $("#enterGate"), btn = $("#enterGateBtn"), wrap = gate && $(".enter-gate-logo-wrap", gate), img = gate && $(".enter-gate-logo", gate);
if (gate && btn && wrap && img) {
  const halo = document.createElement("i"); halo.className = "tm-gate-halo"; halo.setAttribute("aria-hidden", "true"); btn.prepend(halo);
  if (http) {   // the sweep is masked by the logo's own shape (needs http/https, not file://)
    const sh = document.createElement("i"); sh.className = "tm-gate-sheen"; sh.setAttribute("aria-hidden", "true");
    const u = `url("${img.currentSrc || img.src}")`; sh.style.webkitMaskImage = u; sh.style.maskImage = u; wrap.appendChild(sh);
  }
  if (fine) gate.addEventListener("pointermove", e => {
    wrap.style.transform = `perspective(800px) rotateY(${((e.clientX / innerWidth - 0.5) * 18).toFixed(2)}deg) rotateX(${((e.clientY / innerHeight - 0.5) * -14).toFixed(2)}deg)`;
  }, { passive: true });
  const go = e => {
    if (gate.classList.contains("tm-gate-go")) return; gate.classList.add("tm-gate-go");
    const x = e.clientX ?? innerWidth / 2, y = e.clientY ?? innerHeight / 2, R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const ring = document.createElement("div"); ring.className = "tm-ring";
    Object.assign(ring.style, { width: 2 * R + "px", height: 2 * R + "px", left: x - R + "px", top: y - R + "px" });
    document.body.appendChild(ring);
    const done = () => ring.remove();
    ring.animate([{ scale: 0, opacity: 0.9 }, { scale: 1, opacity: 0 }], { duration: 1100, easing: "cubic-bezier(.2,.7,.2,1)" }).finished.then(done, done);
  };
  btn.addEventListener("click", go, true);
  gate.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") go({}); }, true);
}
})();

/* ===== Part 5 · Before/After dressing (measured from the real photos) + language in the URL ===== */
(() => {
"use strict";
const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
const ar = () => document.documentElement.lang === "ar";
const lay = $(".ba-copy"), chips = lay && $(".ba-chips", lay), cta = lay && lay.querySelector(":scope > a.btn"), stage = $(".ba-stage");

if (lay && chips) {
  const tx = (en, a) => `data-en="${en}" data-ar="${a}"`, tt = (en, a) => (ar() ? a : en);
  if (cta) { cta.setAttribute("data-ar", "هل لديك صورة تحتاج إلى لمسة؟ ↖"); if (ar()) cta.innerHTML = cta.getAttribute("data-ar"); }

  /* ---- what changed between BEFORE and AFTER, measured on the real pixels ---- */
  const W = 160, H = 200;
  const grab = img => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
  const skinMask = d => {
    const n = W * H, k = new Uint8Array(n); let c = 0;
    for (let i = 0; i < n; i++) { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], y = 0.299 * r + 0.587 * g + 0.114 * b, cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b; if (y > 40 && cb > 77 && cb < 127 && cr > 133 && cr < 173) { k[i] = 1; c++; } }
    return { k, f: c / n };
  };
  const feat = (d, mask) => {
    const n = W * H, L = new Float32Array(n); let sl = 0, ss = 0, dk = 0;
    for (let i = 0; i < n; i++) { const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255, l = 0.299 * r + 0.587 * g + 0.114 * b; L[i] = l; sl += l; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); ss += mx ? (mx - mn) / mx : 0; if (l < 0.2) dk++; }
    const m = sl / n; let v = 0; for (let i = 0; i < n; i++) { const t = L[i] - m; v += t * t; }
    let sg = 0, kg = 0, kn = 0;
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) { const i = y * W + x, g = Math.abs(L[i + 1] - L[i]) + Math.abs(L[i + W] - L[i]); sg += g; if (mask[i]) { kg += g; kn++; } }
    return { m, sd: Math.sqrt(v / n), sat: ss / n, dark: dk / n, sharp: sg / ((W - 1) * (H - 1)), skin: kn ? kg / kn : 0 };
  };
  const analyze = (ib, ia) => {
    const db = grab(ib), da = grab(ia), sm = skinMask(da), fb = feat(db, sm.k), fa = feat(da, sm.k);
    let df = 0; for (let i = 0; i < W * H; i++) df += (Math.abs(db[i * 4] - da[i * 4]) + Math.abs(db[i * 4 + 1] - da[i * 4 + 1]) + Math.abs(db[i * 4 + 2] - da[i * 4 + 2])) / 765; df /= W * H;
    const c = (v, a) => Math.max(0, Math.min(1, v / a)), C = [];
    const dS = fa.sat - fb.sat, dL = fa.m - fb.m, dC = fa.sd - fb.sd, dSh = fa.sharp - fb.sharp, mono = fb.sat < 0.12;
    const skinDrop = fb.skin > 0.002 && sm.f > 0.04 ? (fb.skin - fa.skin) / fb.skin : 0;
    if (mono && dS > 0.06) C.push([c(dS, 0.3) + 0.15, "Colorization", "تلوين الصورة"]);
    else if (Math.abs(dS) > 0.04) C.push([c(Math.abs(dS), 0.25), dS > 0 ? "Color grading and vibrance" : "Color correction", dS > 0 ? "تدرّج الألوان وتعزيز الحيوية" : "تصحيح الألوان"]);
    if (Math.abs(dL) > 0.035) C.push([c(Math.abs(dL), 0.2), dL > 0 ? "Exposure and light recovery" : "Highlight control", dL > 0 ? "استرجاع الإضاءة والتعريض" : "ضبط الإضاءة الزائدة"]);
    if (fb.dark - fa.dark > 0.06) C.push([c(fb.dark - fa.dark, 0.3), "Shadow detail recovery", "استعادة تفاصيل الظلال"]);
    if (Math.abs(dC) > 0.025) C.push([c(Math.abs(dC), 0.12), dC > 0 ? "Tone and contrast" : "Tone softening", dC > 0 ? "الدرجات اللونية والتباين" : "تلطيف الدرجات"]);
    if (dSh > 0.004) C.push([c(dSh, 0.03), "Detail sharpening", "تعزيز الحدّة والتفاصيل"]);
    if (dSh < -0.004 && skinDrop <= 0.15) C.push([c(-dSh, 0.03), "Noise reduction", "إزالة التشويش"]);
    if (skinDrop > 0.15) C.push([c(skinDrop, 0.5) + 0.1, "Skin refinement", "صقل البشرة"]);
    if (mono && fa.sat < 0.2 && df > 0.04) C.push([c(df, 0.25) + 0.1, "Damage and scratch repair", "إصلاح التلف والخدوش"]);
    C.sort((a, b) => b[0] - a[0]);
    const pick = C.filter((x, i) => i < 3 || x[0] > 0.25).slice(0, 5);
    [[0.2, "Detail refinement", "صقل التفاصيل"], [0.18, "Light balance", "موازنة الإضاءة"], [0.15, "Final polish", "اللمسة النهائية"]].forEach(f => { if (pick.length < 3 && !pick.some(x => x[1] === f[1])) pick.push(f); });
    const has = n => pick.some(x => x[1] === n);
    const name = has("Colorization") || has("Damage and scratch repair") ? ["Photo restoration", "ترميم الصورة"] : has("Skin refinement") ? ["Portrait enhancement", "تحسين البورتريه"] : has("Exposure and light recovery") || has("Shadow detail recovery") || has("Noise reduction") ? ["Low-light enhancement", "تحسين الإضاءة"] : ["Photo enhancement", "تحسين الصورة"];
    return { name, list: pick.map(x => [x[1], x[2]]), w: pick.map(x => Math.round(35 + 65 * Math.min(1, x[0]))), pct: Math.round(Math.max(0.12, Math.min(1, df / 0.3)) * 100) };
  };
  /* Fixed layer presets per photo (stable names + count — no live analysis jitter) */
  const PRESETS = {
    1: { name: ["Low-light enhancement", "تحسين الإضاءة"], list: [["Exposure and light recovery", "استرجاع الإضاءة والتعريض"], ["Shadow detail recovery", "استعادة تفاصيل الظلال"], ["Tone and contrast", "الدرجات اللونية والتباين"], ["Detail sharpening", "تعزيز الحدّة والتفاصيل"]], w: [94, 86, 74, 62], pct: 75 },
    2: { name: ["Low-light enhancement", "تحسين الإضاءة"], list: [["Detail sharpening", "تعزيز الحدّة والتفاصيل"], ["Color grading and vibrance", "تدرّج الألوان وتعزيز الحيوية"], ["Tone and contrast", "الدرجات اللونية والتباين"], ["Exposure and light recovery", "استرجاع الإضاءة والتعريض"]], w: [90, 82, 70, 58], pct: 45 },
    3: { name: ["Portrait enhancement", "تحسين البورتريه"], list: [["Skin refinement", "صقل البشرة"], ["Color grading and vibrance", "تدرّج الألوان وتعزيز الحيوية"], ["Tone and contrast", "الدرجات اللونية والتباين"], ["Detail refinement", "صقل التفاصيل"]], w: [92, 84, 72, 60], pct: 58 },
    4: { name: ["Photo restoration", "ترميم الصورة"], list: [["Tone and contrast", "الدرجات اللونية والتباين"], ["Face detail", "تفاصيل الوجه"], ["Damage and scratch repair", "إصلاح التلف والخدوش"], ["Colorization", "تلوين الصورة"]], w: [93, 85, 73, 55], pct: 68 },
    5: { name: ["Photo enhancement", "تحسين الصورة"], list: [["Detail sharpening", "تعزيز الحدّة والتفاصيل"], ["Tone and contrast", "الدرجات اللونية والتباين"], ["Detail refinement", "صقل التفاصيل"], ["Light balance", "موازنة الإضاءة"]], w: [88, 78, 66, 54], pct: 22 },
    6: { name: ["Portrait enhancement", "تحسين البورتريه"], list: [["Color grading and vibrance", "تدرّج الألوان وتعزيز الحيوية"], ["Skin refinement", "صقل البشرة"], ["Light and glow", "إضاءة وتوهج"], ["Tone and contrast", "الدرجات اللونية والتباين"]], w: [91, 83, 71, 59], pct: 52 },
    7: { name: ["Low-light enhancement", "تحسين الإضاءة"], list: [["Exposure and light recovery", "استرجاع الإضاءة والتعريض"], ["Noise reduction", "إزالة التشويش"], ["Shadow detail recovery", "استعادة تفاصيل الظلال"], ["Background clean-up", "تنظيف الخلفية"]], w: [95, 84, 72, 60], pct: 70 },
    8: { name: ["Portrait enhancement", "تحسين البورتريه"], list: [["Skin refinement", "صقل البشرة"], ["Tone and contrast", "الدرجات اللونية والتباين"], ["Color grading and vibrance", "تدرّج الألوان وتعزيز الحيوية"], ["Final polish", "اللمسة النهائية"]], w: [90, 80, 68, 56], pct: 48 }
  };
  const TPL = {
    portrait: { n: ["Portrait enhancement", "تحسين البورتريه"], l: [["Color grading and vibrance", "تدرّج الألوان وتعزيز الحيوية"], ["Skin refinement", "صقل البشرة"], ["Light and glow", "إضاءة وتوهج"], ["Tone and contrast", "الدرجات اللونية والتباين"]] },
    night: { n: ["Low-light enhancement", "تحسين الإضاءة"], l: [["Exposure and light recovery", "استرجاع الإضاءة والتعريض"], ["Noise reduction", "إزالة التشويش"], ["Shadow detail recovery", "استعادة تفاصيل الظلال"], ["Background clean-up", "تنظيف الخلفية"]] },
    restore: { n: ["Photo restoration", "ترميم الصورة"], l: [["Tone and contrast", "الدرجات اللونية والتباين"], ["Face detail", "تفاصيل الوجه"], ["Damage and scratch repair", "إصلاح التلف والخدوش"], ["Colorization", "تلوين الصورة"]] }
  };
  const ORDER = ["portrait", "night", "restore", "restore", "restore", "portrait", "night", "portrait"];
  const fallback = n => {
    if (PRESETS[n]) return PRESETS[n];
    const t = TPL[ORDER[(n - 1) % ORDER.length]];
    return { name: t.n, list: t.l, w: [92, 80, 68, 56], pct: null };
  };
  const fromData = th => { const e = th.dataset.layersEn.split("|"), a = (th.dataset.layersAr || th.dataset.layersEn).split("|"); return { name: [th.dataset.titleEn || "Edits", th.dataset.titleAr || "التعديلات"], list: e.map((x, i) => [x, a[i] || x]), w: e.map((_, i) => [92, 80, 68, 58, 50][i] || 50), pct: th.dataset.intensity ? +th.dataset.intensity : null }; };

  const GR = ["linear-gradient(135deg,#8b35ff,#16d8ff)", "linear-gradient(135deg,#c4b5fd,#8b35ff)", "linear-gradient(135deg,#16d8ff,#6420b8)", "linear-gradient(135deg,#f0abfc,#7c3aed)", "linear-gradient(135deg,#475569,#1e1b2e)", "linear-gradient(135deg,#334155,#0f172a)"];
  const num = t => +((/ba(\d+)-before/.exec(t.dataset.before || "") || [])[1]) || 1;
  const thumbs = () => $$(".ba-thumb");
  const imgB = $(".ba-img-before"), imgA = $(".ba-img-after");
  const waitImg = (img, n) => new Promise(res => { let t = 0; const chk = () => { const m = /ba(\d+)-/.exec((img && (img.currentSrc || img.src)) || ""); if (m && +m[1] === n && img.complete && img.naturalWidth > 0) return res(img); if (++t > 150) return res(null); setTimeout(chk, 100); }; chk(); });

  const panel = document.createElement("div"); panel.className = "tm-layers"; panel.setAttribute("role", "group"); panel.setAttribute("aria-label", "Layers");
  let rows = [], total = 3, curN = -1, tok = 0, pct = null; const cache = {}, measured = {};
  const showPct = v => { const e = $(".tm-pct", panel); if (!e) return; e.style.display = pct == null ? "none" : ""; e.textContent = (ar() ? "شدّة التعديل " : "EDIT ") + v + "%"; };
  const countUp = () => { if (pct == null) return showPct(0); const t0 = performance.now(), to = pct, f = now => { const p = Math.min(1, (now - t0) / 800); showPct(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };
  const head = (name) => `<div class="tm-layers-h"><span ${tx("LAYERS", "الطبقات")}>${tt("LAYERS", "الطبقات")}</span>${name ? `<b ${tx(name[0], name[1])}>${tt(name[0], name[1])}</b>` : "<b></b>"}<em class="tm-pct"></em></div>`;
  const skeleton = () => { panel.innerHTML = head(null) + [0, 1, 2, 3].map(i => `<div class="tm-layer sk" style="--i:${i}"><i class="tm-eye"></i><i class="tm-th"></i><span class="tm-ln"></span><span class="tm-op"><i></i></span></div>`).join(""); rows = []; pct = null; showPct(0); };
  const draw = info => {
    /* Stable layer count (max 4, no "Original photo") so the CTA never jumps or gets clipped */
    const all = info.list.slice(0, 4); total = all.length; pct = info.pct;
    panel.innerHTML = head(info.name) + all.map((r, i) => `<div class="tm-layer" style="--i:${i};--g:${GR[i % GR.length]};--w:${(info.w && info.w[i]) || 100}%"><i class="tm-eye"></i><i class="tm-th"></i><span class="tm-ln" ${tx(r[0], r[1])}>${tt(r[0], r[1])}</span><span class="tm-op"><i></i></span></div>`).join("");
    rows = $$(".tm-layer", panel); countUp(); sync();
  };
  const render = async (n, force) => {
    if (n === curN && (!force || measured[n])) return; curN = n; const my = ++tok; skeleton();
    let info = cache[n];
    if (!info) {
      const th = thumbs().find(t => num(t) === n);
      /* Priority: data-attrs on thumb → fixed PRESETS → fallback (no live analyze = stable layers) */
      if (th && th.dataset.layersEn) { info = fromData(th); measured[n] = true; }
      else if (PRESETS[n]) { info = PRESETS[n]; measured[n] = true; }
      else { info = fallback(n); measured[n] = true; }
      if (info && measured[n]) cache[n] = info;
    }
    if (my === tok) draw(info);
  };
  /* the layers switch on as the slider reveals more of AFTER */
  function sync() {
    const p = parseFloat(stage ? stage.style.getPropertyValue("--p") : "50"), pr = Math.min(1, Math.max(0, 1 - (isNaN(p) ? 50 : p) / 100));
    rows.forEach((r, i) => { const last = i === rows.length - 1, th = ((total - i) / (total + 1)) * 0.95; r.classList.toggle("on", last || pr >= th); });
  }
  chips.after(panel); render(1);
  [imgB, imgA].forEach(im => im && im.addEventListener("load", () => { const m = /ba(\d+)-/.exec(im.currentSrc || im.src || ""); if (m && !measured[+m[1]]) render(+m[1], true); }));
  let pend = 0; const soon = () => { if (!pend) pend = requestAnimationFrame(() => { pend = 0; sync(); }); };
  if (stage) new MutationObserver(soon).observe(stage, { attributes: true, attributeFilter: ["style"] });
  const tw = $(".ba-thumbs");
  if (tw) new MutationObserver(() => { const a = $(".ba-thumb.is-active"); if (a) render(num(a)); }).observe(tw, { attributes: true, attributeFilter: ["class"], subtree: true });
  new MutationObserver(() => showPct(pct == null ? 0 : pct)).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* three steps (formal Arabic) */
  const S = [["Send your photo", "أرسل صورتك", "Share it on WhatsApp with a short note.", "أرسلها عبر واتساب مع ملاحظة موجزة."], ["Tell me what you need", "حدّد ما تحتاجه", "Enhancement, restoration, color correction or compositing.", "معالجة أو ترميم أو تصحيح ألوان أو دمج."], ["Get the final result", "استلم النتيجة النهائية", "A polished file, ready to use.", "ملف متقن جاهز للاستخدام."]];
  const steps = document.createElement("ol"); steps.className = "tm-steps";
  steps.innerHTML = S.map((x, i) => `<li class="tm-step" style="--i:${i}"><span class="tm-sn">${i + 1}</span><div><div class="tm-st-t" ${tx(x[0], x[1])}>${tt(x[0], x[1])}</div><div class="tm-st-d" ${tx(x[2], x[3])}>${tt(x[2], x[3])}</div></div></li>`).join("");
  panel.after(steps); if (cta) { cta.classList.add("ba-cta"); steps.after(cta); }
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { steps.classList.add("in"); io.disconnect(); } }, { threshold: 0.4 }); io.observe(steps); } else steps.classList.add("in");

  /* Glide only content above CTA so the button can stay sticky on desktop */
  let glideEl = lay;
  if (cta && lay) {
    const glide = document.createElement("div");
    glide.className = "ba-glide";
    [...lay.children].filter(el => el !== cta).forEach(el => glide.appendChild(el));
    lay.insertBefore(glide, cta);
    glideEl = glide;
  }

  /* the text column glides down with the page beside the tall viewer (desktop) */
  const layout = $(".ba-layout");
  if (layout && glideEl) {
    let cur = 0, raf = 0, near = false;
    const goal = () => {
      if (innerWidth <= 900) return 0;
      const lr = layout.getBoundingClientRect();
      const top = ($(".site-header")?.offsetHeight || 68) + 36;
      const h = glideEl.offsetHeight + (cta ? cta.offsetHeight + 28 : 0);
      return Math.min(Math.max(0, lr.height - h), Math.max(0, top - lr.top));
    };
    const step = () => {
      const t = goal();
      cur += (t - cur) * 0.12;
      if (Math.abs(t - cur) < 0.3) cur = t;
      glideEl.style.translate = `0 ${cur.toFixed(1)}px`;
      raf = near || cur !== t ? requestAnimationFrame(step) : 0;
    };
    new IntersectionObserver(es => { near = es[0].isIntersecting; if (near && !raf) raf = requestAnimationFrame(step); }, { rootMargin: "200px 0px" }).observe(layout);
  }
}

/* the chosen language lives in the URL (?lang=ar) so it can be shared and indexed */
new MutationObserver(() => { try { const u = new URL(location.href); u.searchParams.set("lang", ar() ? "ar" : "en"); history.replaceState(null, "", u); } catch (_) {} })
  .observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
})();
