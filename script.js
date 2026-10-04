/* ---------- Always start at the top on reload / back (no stray restored position) ---------- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
{
  const goTop = () => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };
  const navType = performance.getEntriesByType("navigation")[0]?.type;
  if (navType === "reload" || navType === "back_forward") goTop();
  addEventListener("pageshow", e => { if (e.persisted) goTop(); });
}

(() => {
"use strict";

/* ---------- Helpers ---------- */
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } }
};
const reduceMotion = matchMedia("(prefers-reduced-motion:reduce)").matches;
const isArabic = () => document.documentElement.lang === "ar";

/* ---------- Language ---------- */
const WA_TEXT = {
  en: "Hello Tiamo 👋 I found your portfolio and I'd like to discuss a creative project.",
  ar: "مرحبًا تيامو 👋 وجدت ملف أعمالك وأريد مناقشة مشروع إبداعي."
};
const UI = {
  en: { lang: "Switch to Arabic", menu: "Menu", down: "Scroll to bottom", up: "Scroll to top", slide: n => `Go to slide ${n}`, prev: "Previous", next: "Next" },
  ar: { lang: "التبديل إلى الإنجليزية", menu: "القائمة", down: "انتقل لأسفل الصفحة", up: "انتقل لأعلى الصفحة", slide: n => `اذهب إلى الشريحة ${n}`, prev: "السابق", next: "التالي" }
};
const langBtn = document.getElementById("langBtn");
const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

const setLanguage = lang => {
  lang = lang === "ar" ? "ar" : "en";
  const t = UI[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-en]").forEach(el => {
    const v = el.getAttribute(lang === "ar" ? "data-ar" : "data-en");
    if (v !== null) el.innerHTML = v;
  });
  if (langBtn) { langBtn.textContent = lang === "ar" ? "EN" : "AR"; langBtn.setAttribute("aria-label", t.lang); }
  menuBtn?.setAttribute("aria-label", t.menu);
  document.querySelectorAll(".arrow.prev").forEach(b => b.setAttribute("aria-label", t.prev));
  document.querySelectorAll(".arrow.next").forEach(b => b.setAttribute("aria-label", t.next));
  document.querySelectorAll(".dots button").forEach((b, i) => b.setAttribute("aria-label", t.slide(+b.dataset.n || i + 1)));
  // WhatsApp greeting follows the page language
  document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
    const base = a.href.split("?")[0];
    a.href = `${base}?text=${encodeURIComponent(WA_TEXT[lang])}`;
  });
  store.set("tiamo-lang", lang);
  updateScrollOrbit(true);
};

/* ---------- Smart scroll orb ---------- */
const scrollOrbit = document.getElementById("scrollOrbit");
let orbitUp = null, ticking = false;
const pageProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? scrollY / max : 0;
};
function updateScrollOrbit(force = false) {
  if (!scrollOrbit) return;
  const up = pageProgress() > 0.5;               // second half of the page -> "go to top"
  if (!force && up === orbitUp) return;          // touch the DOM only when the state changes
  orbitUp = up;
  scrollOrbit.classList.toggle("is-up", up);
  const core = scrollOrbit.querySelector(".scroll-orbit-core");
  const label = scrollOrbit.querySelector(".scroll-orbit-label");
  if (core) core.textContent = up ? "⌃" : "⌄";
  scrollOrbit.setAttribute("aria-label", UI[isArabic() ? "ar" : "en"][up ? "up" : "down"]);
  if (label) {
    label.setAttribute("data-en", up ? "TOP" : "DOWN");
    label.setAttribute("data-ar", up ? "للأعلى" : "لأسفل");
    label.textContent = label.getAttribute(isArabic() ? "data-ar" : "data-en");
  }
}
scrollOrbit?.addEventListener("click", () => {
  window.scrollTo({ top: orbitUp ? 0 : document.documentElement.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
});
addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateScrollOrbit(); ticking = false; });
}, { passive: true });
addEventListener("resize", () => updateScrollOrbit());

/* ---------- Mobile menu ---------- */
const closeMenu = () => {
  if (!nav?.classList.contains("open")) return;
  nav.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", "false");
};
menuBtn?.setAttribute("aria-expanded", "false");
menuBtn?.addEventListener("click", () => {
  const open = nav?.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(!!open));
});
nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
addEventListener("scroll", closeMenu, { passive: true });
document.addEventListener("click", e => {
  if (!nav?.contains(e.target) && !menuBtn?.contains(e.target)) closeMenu();
});

/* ---------- Reveal on scroll ---------- */
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const ro = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("visible"); ro.unobserve(e.target); }
  }), { threshold: 0.12 });
  revealEls.forEach(e => ro.observe(e));
} else {
  revealEls.forEach(e => e.classList.add("visible"));
}

const aboutPhoto = document.querySelector(".about-photo"), aboutSec = document.getElementById("about");
if (aboutPhoto && aboutSec && "IntersectionObserver" in window) {
  new IntersectionObserver(es => es.forEach(e => aboutPhoto.classList.toggle("show", e.isIntersecting)), { threshold: 0.35 }).observe(aboutSec);
}

/* ---------- Missing assets: logo fallback + friendly placeholders ---------- */
document.querySelectorAll(".logo-img").forEach(img => {
  img.addEventListener("error", () => {
    const mark = document.createElement("span");
    mark.className = "logo-mark";
    mark.textContent = "TM";
    img.replaceWith(mark);
  }, { once: true });
});
document.querySelectorAll(".slides img").forEach(img => {
  img.addEventListener("error", () => img.closest("figure")?.classList.add("is-missing"), { once: true });
});

/* ---------- Sliders ---------- */
document.querySelectorAll(".slider").forEach(slider => {
  const track = slider.querySelector(".slides");
  const slides = [...slider.querySelectorAll(".slides>figure")];
  const prev = slider.querySelector(".prev"), next = slider.querySelector(".next"), dots = slider.querySelector(".dots");
  if (!track || !slides.length) return;

  let index = 0, hoverPaused = false, touchPaused = false, inView = true, timer = null;
  const delay = +slider.dataset.delay || 4000;
  const canPlay = () => !reduceMotion && slides.length > 1 && inView && !hoverPaused && !touchPaused && !document.hidden;

  slider.setAttribute("role", "region");
  slider.setAttribute("aria-roledescription", "carousel");
  slider.tabIndex = 0;

  const setBg = (slide, on) => {
    if (!on) { slide.style.removeProperty("--media-bg"); return; }
    const media = slide.querySelector("img");
    const src = media ? (media.currentSrc || media.src || "") : "";
    if (src) slide.style.setProperty("--media-bg", `url("${src.replace(/"/g, "%22")}")`);
  };

  const render = () => {
    const near = i => i === index || i === (index + 1) % slides.length || i === (index - 1 + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.toggleAttribute("inert", !active);          // hidden slides can't take focus
      slide.setAttribute("aria-hidden", String(!active));
      setBg(slide, near(i));                            // blurred backdrop only for visible + neighbours
    });
    dots?.querySelectorAll("button").forEach((d, i) => {
      d.classList.toggle("active", i === index);
      i === index ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current");
    });
  };

  const stop = () => { clearInterval(timer); timer = null; };
  const play = () => { stop(); if (canPlay()) timer = setInterval(() => { if (canPlay()) go(index + 1); }, delay); };

  function go(n, manual = false) {
    index = (n + slides.length) % slides.length;
    track.style.transform = `translate3d(${-index * 100}%,0,0)`;
    render();
    if (manual) play();
  }

  slides.forEach((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.dataset.n = i + 1;
    d.setAttribute("aria-label", UI[isArabic() ? "ar" : "en"].slide(i + 1));
    d.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); go(i, true); });
    dots?.appendChild(d);
  });

  prev?.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); go(index - 1, true); });
  next?.addEventListener("click", e => { e.preventDefault(); e.stopPropagation(); go(index + 1, true); });

  // Hover pause only for real mouse pointers (touch devices emit fake mouseenter events)
  slider.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { hoverPaused = true; play(); } });
  slider.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { hoverPaused = false; play(); } });
  slider.addEventListener("focusin", () => { hoverPaused = true; play(); });
  slider.addEventListener("focusout", () => { hoverPaused = false; play(); });

  // Keyboard: ← → move between slides (direction-aware is unnecessary: slider is always LTR)
  slider.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1, true); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); go(index - 1, true); }
  });

  // Touch swipe: horizontal gestures only, so vertical page scroll never changes slides
  let tx = null, ty = null;
  slider.addEventListener("touchstart", e => {
    tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; touchPaused = true;
  }, { passive: true });
  slider.addEventListener("touchend", e => {
    if (tx !== null) {
      const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) go(index + (dx < 0 ? 1 : -1), true);
    }
    tx = ty = null; touchPaused = false; play();
  }, { passive: true });
  slider.addEventListener("touchcancel", () => { tx = ty = null; touchPaused = false; play(); }, { passive: true });

  // Don't animate offscreen sliders or hidden tabs
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { inView = es[0].isIntersecting; play(); }, { threshold: 0.2 }).observe(slider);
  }
  document.addEventListener("visibilitychange", play);

  go(0);
  play();
});

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById("mediaLightbox");
const image = document.getElementById("lightboxImage");
const closeBtn = document.querySelector(".lightbox-close");
let lastTrigger = null;

const closeLightbox = () => {
  if (!lightbox?.classList.contains("open")) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  image?.removeAttribute("src");
  lastTrigger?.focus?.();
  lastTrigger = null;
};
const openImage = btn => {
  const src = btn.dataset.full || btn.querySelector("img")?.src;
  if (!src || !lightbox || !image) return;
  lastTrigger = btn;
  image.src = src;
  image.alt = btn.querySelector("img")?.alt || "Tiamo Mohamad artwork";
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  setTimeout(() => closeBtn?.focus(), 60);   // wait for the overlay to become visible, otherwise focus() is ignored
};
document.querySelectorAll(".media-open").forEach(btn => btn.addEventListener("click", e => {
  e.preventDefault(); e.stopPropagation(); openImage(btn);
}));
// Reel links intentionally keep their native Facebook href (open in a new tab).
lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
closeBtn?.addEventListener("click", closeLightbox);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeLightbox(); closeMenu(); }
  if (e.key === "Tab" && lightbox?.classList.contains("open")) { e.preventDefault(); closeBtn?.focus(); } // minimal focus trap
});

/* ---------- Cursor glow ---------- */
const glow = document.querySelector(".cursor-glow");
if (glow && matchMedia("(pointer:fine)").matches) {
  let gx = 0, gy = 0, gf = false;
  addEventListener("pointermove", e => {
    gx = e.clientX; gy = e.clientY;
    if (gf) return;
    gf = true;
    requestAnimationFrame(() => {
      glow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`;
      glow.style.opacity = "1";
      gf = false;
    });
  }, { passive: true });
}

/* ---------- Particles ---------- */
const canvas = document.getElementById("particles"), ctx = canvas?.getContext("2d");
if (canvas && ctx && !reduceMotion) {
  let p = [], lastW = 0, raf = 0, resizeT = 0;
  const build = () => {
    const dpr = devicePixelRatio || 1;
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    p = Array.from({ length: Math.min(55, Math.floor(innerWidth / 25)) }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 1.3 + .3, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18
    }));
    lastW = innerWidth;
  };
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.fillStyle = "rgba(181,140,255,.45)";
    p.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > innerWidth) a.vx *= -1;
      if (a.y < 0 || a.y > innerHeight) a.vy *= -1;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    });
    raf = requestAnimationFrame(draw);
  };
  // Rebuild only when the WIDTH changes (mobile URL-bar resizes fire resize on every scroll)
  addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (innerWidth !== lastW) build(); }, 150);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf); else { cancelAnimationFrame(raf); draw(); }
  });
  build(); draw();
}

/* ---------- About text entrance + title-first reveal (Services / Work) ---------- */
{
  const aboutSection = document.getElementById("about");
  if (aboutSection) {
    // same trigger as the photo, so text (from the left) and photo (from the right) meet together
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => aboutSection.classList.toggle("about-in", e.isIntersecting)), { threshold: 0.35 }).observe(aboutSection);
    } else { aboutSection.classList.add("about-in"); }
  }
  ["services", "work"].forEach(id => {
    const sec = document.getElementById(id);
    const head = sec && sec.querySelector(".section-title");
    if (!sec || !head) return;
    if (!("IntersectionObserver" in window)) { sec.classList.add("title-in"); return; }
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { sec.classList.add("title-in"); io.disconnect(); }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
    io.observe(head);
  });
}

/* ---------- Init ---------- */
const saved = store.get("tiamo-lang");
const initial = saved === "ar" || saved === "en" ? saved : ((navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en");
langBtn?.addEventListener("click", () => setLanguage(isArabic() ? "en" : "ar"));
setLanguage(initial);
updateScrollOrbit(true);
})();


/* ---------- Scroll-reactive section heading motion (Services / Selected Work) ----------
   Robust, direction-aware motion tied to the user's actual scroll gesture.
   The heading moves ahead of the cards while scrolling, then smoothly returns
   to its natural position when scrolling settles. Cards keep their own hover
   transforms because only the heading wrapper receives this transform. ---------- */
(() => {
  const items = ["services", "work"]
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(section => ({
      section,
      heading: section.querySelector(".section-heading-scroll"),
      current: 0,
      target: 0
    }))
    .filter(item => item.heading);

  if (!items.length) return;

  let lastY = window.scrollY || 0;
  let direction = 1; // 1 = down, -1 = up
  let raf = 0;
  let idleTimer = 0;
  let isScrolling = false;

  const reduced = matchMedia("(prefers-reduced-motion:reduce)").matches;
  if (reduced) return; // CSS already disables the transform; no need to run the loop
  const MAX_SHIFT = reduced ? 18 : 48;
  const SMOOTH = reduced ? 0.24 : 0.18;
  const IDLE_MS = reduced ? 90 : 130;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const easeInOut = t => t * t * (3 - 2 * t);

  const visibilityFactor = rect => {
    const vh = window.innerHeight || 800;
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    if (visible <= 0) return 0;
    // Strongest response when the section is meaningfully inside the viewport.
    return easeInOut(clamp(visible / Math.min(rect.height || vh, vh), 0, 1));
  };

  const calculateTargets = () => {
    const pageY = window.scrollY || 0;
    const dy = pageY - lastY;
    if (Math.abs(dy) > 0.2) direction = dy > 0 ? 1 : -1;
    lastY = pageY;

    items.forEach(item => {
      const rect = item.section.getBoundingClientRect();
      const factor = visibilityFactor(rect);

      if (!isScrolling || factor <= 0.02) {
        item.target = 0;
        return;
      }

      // Downward scroll makes the heading rise ahead of the cards.
      // Upward scroll reverses the movement naturally.
      const signed = direction > 0 ? -1 : 1;
      item.target = signed * MAX_SHIFT * factor;
    });
  };

  const render = () => {
    let active = false;
    items.forEach(item => {
      item.current += (item.target - item.current) * SMOOTH;
      if (Math.abs(item.target - item.current) > 0.08) active = true;
      item.heading.style.setProperty("--tm-scroll-shift", `${item.current.toFixed(2)}px`);
    });
    raf = active ? requestAnimationFrame(render) : 0;
  };

  const scheduleRender = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  const settle = () => {
    isScrolling = false;
    items.forEach(item => { item.target = 0; });
    scheduleRender();
  };

  const onScroll = () => {
    isScrolling = true;
    calculateTargets();
    scheduleRender();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(settle, IDLE_MS);
  };

  const onResize = () => {
    items.forEach(item => { item.target = 0; });
    scheduleRender();
  };

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize, { passive: true });
  addEventListener("blur", settle);

  calculateTargets();
  settle();
})();

/* ---------- Safe Before / After activator ----------
   The component appears only when the actual BEFORE image is available.
   This prevents a broken-image block from ever replacing the live Photoshop gallery. ---------- */
(() => {
  document.querySelectorAll("[data-before-after]").forEach(module => {
    const beforeSrc = module.getAttribute("data-before-after");
    const after = module.querySelector(".ba-after");
    const beforeWrap = module.querySelector(".ba-before-wrap");
    const before = module.querySelector(".ba-before");
    const divider = module.querySelector(".ba-divider");
    const range = module.querySelector(".ba-range");
    if (!beforeSrc || !after || !beforeWrap || !before || !divider || !range) return;

    const activate = () => {
      module.classList.add("is-ready");
      module.setAttribute("aria-hidden", "false");
      const refresh = () => {
        const w = module.querySelector(".before-after-stage")?.clientWidth || 0;
        before.style.width = `${w}px`;
        apply(+range.value || 50);
      };
      const apply = value => {
        const v = clamp(value, 0, 100);
        beforeWrap.style.width = `${v}%`;
        divider.style.left = `${v}%`;
      };
      const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
      range.addEventListener("input", e => apply(+e.target.value));
      addEventListener("resize", refresh, { passive:true });
      refresh();
    };

    const imageProbe = new Image();
    imageProbe.onload = () => activate();
    imageProbe.onerror = () => {
      module.remove();
    };
    imageProbe.src = beforeSrc;
  });
})();
