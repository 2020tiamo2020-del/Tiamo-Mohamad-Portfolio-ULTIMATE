/* ==========================================================================
   STORY LAYER (2026-10-24) - story.js
   1 gate loader (% + line-drawn TM)   2 text scramble (hero roles + kickers)
   3 side rail with progress line      4 per-section aura (background colour)
   5 Work scenes (scroll-scrub depth + ghost chapter letters)
   Every module is isolated: if one fails, the others still run.
   Undo: remove story.css / story.js and their 3 tags in index.html.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__storyFx) return;
  window.__storyFx = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAr = () => document.documentElement.lang === "ar";
  const run = (name, fn) => { try { fn(); } catch (e) { console.warn("[story:" + name + "]", e); } };
  const onReady = fn => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();

  /* ---- shared: scramble-decode a text node's content ---- */
  const GL = "ABCDEFGHJKLMNPQRSTUVWXYZ#%<>+=*0123456789";
  const scramble = (el, final, dur = 650, delay = 0) => {
    const fin = () => (typeof final === "function" ? final() : final) || "";
    if (reduce) { el.textContent = fin(); return; }
    cancelAnimationFrame(el.__stRaf);
    clearTimeout(el.__stTo);
    el.__stTo = setTimeout(() => {
      const t0 = performance.now();
      const step = now => {
        const target = fin();
        const n = target.length;
        const p = clamp((now - t0) / dur, 0, 1);
        const lock = Math.floor(p * n);
        let out = "";
        for (let i = 0; i < n; i++) {
          const c = target[i];
          out += (i < lock || c === " " || c === "/") ? c : GL[(Math.random() * GL.length) | 0];
        }
        el.textContent = p < 1 ? out : target;
        if (p < 1) el.__stRaf = requestAnimationFrame(step);
      };
      el.__stRaf = requestAnimationFrame(step);
    }, delay);
  };

  /* =====================  1. GATE LOADER  ===================== */
  run("loader", () => {
    const gate = $("#enterGate");
    if (!gate) return;
    const btn = $("#enterGateBtn", gate);
    const box = document.createElement("div");
    box.className = "st-load";
    box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      '<svg class="st-mono" viewBox="0 0 240 120" focusable="false">' +
      '<defs><linearGradient id="stGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="240" y2="120">' +
      '<stop offset="0" stop-color="#d8c4ff"/><stop offset="1" stop-color="#16d8ff"/></linearGradient></defs>' +
      '<path d="M22 24H104M63 24V98" pathLength="1" stroke="url(#stGrad)"/>' +
      '<path d="M128 98V24L166 70L204 24V98" pathLength="1" stroke="url(#stGrad)"/></svg>' +
      '<div class="st-pct"><b class="st-num">0</b><i>%</i></div><div class="st-bar"><i></i></div>';
    gate.insertBefore(box, btn || gate.firstChild);
    gate.classList.add("st-loading");

    const num = $(".st-num", box), bar = $(".st-bar i", box), paths = $$(".st-mono path", box);
    let loaded = document.readyState === "complete";
    window.addEventListener("load", () => { loaded = true; }, { once: true });
    const MIN = reduce ? 1 : 1700, MAX = 4200, t0 = performance.now();
    let shown = 0;

    const finish = () => {
      gate.classList.remove("st-loading");
      gate.classList.add("st-ready");
      paths.forEach(p => { p.style.strokeDashoffset = 0; });
      const cta = $(".enter-gate-cta", gate);
      if (cta && cta.animate && !reduce) {
        cta.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
          { duration: 800, easing: "cubic-bezier(.22,1,.36,1)" });
      }
    };
    const tick = now => {
      const t = now - t0;
      const target = t > MAX ? 100 : clamp(t / MIN, 0, 1) * (loaded ? 100 : 88);
      shown += (target - shown) * 0.14;
      if (target - shown < 0.35) shown = target;
      num.textContent = Math.round(shown);
      bar.style.transform = "scaleX(" + (shown / 100).toFixed(3) + ")";
      paths[0] && (paths[0].style.strokeDashoffset = 1 - clamp(shown / 50, 0, 1));
      paths[1] && (paths[1].style.strokeDashoffset = 1 - clamp((shown - 50) / 50, 0, 1));
      if (shown >= 100) { setTimeout(finish, 220); return; }
      if (!document.body.contains(gate) || !gate.isConnected) return;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  /* =====================  2. TEXT SCRAMBLE  ===================== */
  run("roles", () => {
    const role = $(".hero .role");
    if (!role) return;
    const words = [];
    Array.from(role.childNodes).forEach(n => {
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const raw = n.textContent, txt = raw.trim();
      const s = document.createElement("span");
      s.className = "st-w";
      s.dataset.final = txt;
      s.textContent = txt;
      const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
      role.replaceChild(s, n);
      if (lead) role.insertBefore(document.createTextNode(lead), s);
      if (trail) role.insertBefore(document.createTextNode(trail), s.nextSibling);
      words.push(s);
    });
    if (!words.length) return;

    const lock = () => words.forEach(w => { w.style.minWidth = ""; });
    const measure = () => { lock(); words.forEach(w => { const wd = w.offsetWidth; if (wd) w.style.minWidth = wd + "px"; }); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(measure, 60));
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(measure, 200); }, { passive: true });

    const one = (w, d = 650, delay = 0) => scramble(w, w.dataset.final, d, delay);
    const play = () => words.forEach((w, i) => one(w, 750 + i * 60, 350 + i * 160));
    words.forEach(w => w.addEventListener("pointerenter", () => one(w, 450)));
    let k = 0;
    const loop = () => setInterval(() => {
      if (document.hidden) return;
      const r = role.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      one(words[k++ % words.length], 620);
    }, 4200);

    if (document.body.classList.contains("gate-locked")) {
      const mo = new MutationObserver(() => {
        if (!document.body.classList.contains("gate-locked")) { mo.disconnect(); play(); loop(); }
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    } else { play(); loop(); }
  });

  run("kickers", () => {
    const ks = $$("#services .section-kicker,#work .section-kicker,#creation .section-kicker,#beforeafter .section-kicker,#contact .section-kicker")
      .filter(k => !k.children.length);
    if (!ks.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      const k = e.target;
      if (!e.isIntersecting) { k.__stIn = false; return; }
      if (k.__stIn) return;
      k.__stIn = true;
      if (isAr()) return;
      scramble(k, () => k.getAttribute("data-en") || k.textContent, 650, 250);
    }), { threshold: 0.9 });
    ks.forEach(k => io.observe(k));
  });

  /* =====================  3-5. RAIL + AURA + SCRUB  ===================== */
  onReady(() => run("scroll-story", () => {
    const defs = [
      ["home", ".hero", "Home", "الرئيسية"],
      ["about", "#about", "About", "عنّي"],
      ["services", "#services", "Services", "الخدمات"],
      ["work", "#work", "Work", "الأعمال"],
      ["creation", "#creation", "AI Creation", "إبداع الـ AI"],
      ["beforeafter", "#beforeafter", "Before & After", "قبل وبعد"],
      ["contact", "#contact", "Contact", "تواصل"]
    ].map(([id, sel, en, ar]) => ({ id, el: $(sel), en, ar })).filter(d => d.el);
    if (!defs.length) return;

    /* --- rail --- */
    const rail = document.createElement("nav");
    rail.className = "st-rail";
    rail.setAttribute("aria-label", "Sections");
    const ol = document.createElement("ol");
    const line = document.createElement("div");
    line.className = "st-rail-line";
    line.innerHTML = "<i></i>";
    ol.appendChild(line);
    defs.forEach(d => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + d.id;
      a.innerHTML = '<span class="st-dot"></span><span class="st-lbl"></span>';
      d.a = a; d.lbl = $(".st-lbl", a);
      a.addEventListener("click", ev => {
        ev.preventDefault();
        const lenis = window.__lenis;
        if (d.id === "home") {
          lenis && lenis.scrollTo ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: "smooth" });
        } else if (lenis && lenis.scrollTo) {
          lenis.scrollTo(d.el, { offset: -70, duration: 1.6 });
        } else {
          d.el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      li.appendChild(a);
      ol.appendChild(li);
    });
    rail.appendChild(ol);
    document.body.appendChild(rail);
    const setLabels = () => defs.forEach(d => {
      const t = isAr() ? d.ar : d.en;
      d.lbl.textContent = t;
      d.a.setAttribute("aria-label", t);
    });
    setLabels();
    new MutationObserver(setLabels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    /* --- aura --- */
    const aura = document.createElement("div");
    aura.className = "st-aura";
    aura.setAttribute("aria-hidden", "true");
    defs.forEach(d => { const i = document.createElement("i"); i.dataset.s = d.id; aura.appendChild(i); });
    const particles = $("#particles");
    particles && particles.parentNode === document.body ? particles.after(aura) : document.body.prepend(aura);

    /* --- ghost chapter letters + scrub targets --- */
    const cards = $$("#work .gallery-card");
    cards.forEach((c, i) => {
      if ($(".st-ghost", c)) return;
      const g = document.createElement("span");
      g.className = "st-ghost";
      g.setAttribute("aria-hidden", "true");
      g.textContent = String.fromCharCode(65 + i);
      c.appendChild(g);
    });
    const wide = matchMedia("(min-width:901px)");
    const work = $("#work");
    const grid = work && $(".gallery-grid", work);
    const pinMQ = matchMedia("(min-width:1100px) and (min-height:620px)");
    const PIN_TOP = 96;
    const chap = document.createElement("div");
    chap.className = "st-chap";
    const chapBtns = cards.map((c, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = "<i>" + String.fromCharCode(65 + i) + "</i><span></span>";
      b.addEventListener("click", () => {
        if (!grid || !pinMQ.matches) return;
        const vh = innerHeight;
        const dwell = parseFloat(getComputedStyle(cards[0]).marginBottom) || vh * 0.24;
        let y = grid.getBoundingClientRect().top + scrollY;
        for (let j = 0; j < i; j++) y += cards[j].offsetHeight + dwell;
        const to = y - PIN_TOP;
        const lenis = window.__lenis;
        lenis && lenis.scrollTo ? lenis.scrollTo(to, { duration: 1.5 }) : scrollTo({ top: to, behavior: "smooth" });
      });
      chap.appendChild(b);
      return b;
    });
    if (cards.length > 1) document.body.appendChild(chap);

    /* --- one scroll controller --- */
    let active = "", flashT = 0, ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight, y = scrollY;
      const probe = vh * 0.4;
      let cur = defs[0];
      defs.forEach(d => { if (d.el.getBoundingClientRect().top <= probe) cur = d; });
      if (y >= document.documentElement.scrollHeight - vh - 6) cur = defs[defs.length - 1];
      if (cur.id !== active) {
        active = cur.id;
        document.body.dataset.stSec = active;
        defs.forEach(d => d.a.classList.toggle("on", d === cur));
        rail.classList.add("st-flash");
        clearTimeout(flashT);
        flashT = setTimeout(() => rail.classList.remove("st-flash"), 1400);
      }
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      rail.style.setProperty("--st-prog", clamp(y / max, 0, 1).toFixed(4));
      aura.style.setProperty("--st-y", Math.round(y));

      const pin = !!grid && cards.length > 1 && pinMQ.matches && !reduce;
      work && work.classList.toggle("st-pin", pin);
      if (pin) {
        cards.forEach((c, i) => {
          const h = c.offsetHeight || 1;
          c.style.setProperty("--st-fit", clamp((vh - PIN_TOP - 24) / h, 0.55, 1).toFixed(3));
          const nx = cards[i + 1];
          let cover = 0;
          if (nx) cover = clamp((vh - nx.getBoundingClientRect().top) / (vh - PIN_TOP), 0, 1);
          c.style.setProperty("--st-cover", cover.toFixed(3));
          c.style.setProperty("--st-g", clamp((c.getBoundingClientRect().top - PIN_TOP) / vh, -1.5, 1.5).toFixed(3));
          c.style.pointerEvents = cover > 0.55 ? "none" : "";
          c.style.removeProperty("--st-d");
        });
        const gr = grid.getBoundingClientRect();
        const showChap = gr.top < vh * 0.6 && gr.bottom > vh * 0.55;
        chap.classList.toggle("show", showChap);
        let act = 0;
        cards.forEach((c, i) => { if (c.getBoundingClientRect().top <= vh * 0.55) act = i; });
        chapBtns.forEach((b, i) => {
          b.classList.toggle("on", i === act);
          const h3 = $("h3", cards[i]);
          const t = h3 ? h3.textContent : "";
          const sp = b.lastChild;
          if (sp.textContent !== t) { sp.textContent = t; b.setAttribute("aria-label", t); }
        });
      } else {
        chap.classList.remove("show");
        cards.forEach(c => {
          c.style.removeProperty("--st-fit"); c.style.removeProperty("--st-cover"); c.style.pointerEvents = "";
        });
        if (wide.matches && !reduce) {
          const mid = vh / 2;
          cards.forEach(c => {
            const r = c.getBoundingClientRect();
            const dist = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0;
            const off = (r.top + r.height / 2 - mid) / vh;
            c.style.setProperty("--st-d", clamp(dist / (vh * 0.9), 0, 1).toFixed(3));
            c.style.setProperty("--st-g", clamp(off, -1.5, 1.5).toFixed(3));
          });
        } else {
          cards.forEach(c => { c.style.removeProperty("--st-d"); c.style.removeProperty("--st-g"); });
        }
      }
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req, { passive: true });
    addEventListener("load", req, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(req);
    update();
  }));
})();
