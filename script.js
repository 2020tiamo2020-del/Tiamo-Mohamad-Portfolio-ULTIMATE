/* ---------- Start at the top on reload / back (no stray restored position) ---------- */
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
const reduceMotion = false; // animations always run, regardless of the OS "reduce motion" setting
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
      // 3D carousel placement: signed shortest distance from the active slide (read by style.css)
      const n = slides.length;
      let off = i - index;
      if (off > n / 2) off -= n; else if (off < -n / 2) off += n;
      const c = Math.max(-2, Math.min(2, off));
      slide.style.setProperty("--o", c);
      slide.style.setProperty("--a", Math.abs(c));
      slide.style.setProperty("--v", Math.abs(c) <= 1 ? 1 : 0);
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

  // Click on the tilted side cards (outer edges of the stage) to move to them
  slider.addEventListener("click", e => {
    if (slides.length < 2 || e.target.closest("a,button,.dots")) return;
    const r = slider.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (x < 0.15) go(index - 1, true); else if (x > 0.85) go(index + 1, true);
  });

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
  ["services", "work", "beforeafter"].forEach(id => {
    const sec = document.getElementById(id);
    const head = sec && sec.querySelector(".section-title, .ba-copy");
    if (!sec || !head) return;
    if (!("IntersectionObserver" in window)) { sec.classList.add("title-in"); return; }
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { sec.classList.add("title-in"); io.disconnect(); }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
    io.observe(head);
  });
}

/* ---------- Music orb: click the TM sphere to play / pause (loaded only on first click) ---------- */
{
  const orb = document.getElementById("tmOrb");
  if (orb) {
    const hint = document.querySelector(".core-hint");
    const mini = document.getElementById("tmMini");
    const eqBars = [...orb.querySelectorAll(".ico-eq i")];
    const miniBars = mini ? [...mini.querySelectorAll("i")] : [];
    const SRC = "audio/theme.mp3", VOL = 0.4;
    const canFFT = /^https?:$/.test(location.protocol);   // analyser needs a same-origin (http/https) source
    const BINS = [0, 2, 4, 7, 12], MINI_BINS = [1, 3, 6, 10];
    const MSG = { en: { play: "Play music", pause: "Pause music" }, ar: { play: "تشغيل الموسيقى", pause: "إيقاف الموسيقى" } };
    let audio = null, ctx = null, analyser = null, gain = null, data = null;
    let playing = false, token = 0, raf = 0, fadeT = 0, beatS = 0, avgB = 0, orbVisible = true, hinted = false;
    const mean = new Float32Array(BINS.length + MINI_BINS.length).fill(0.5);   // per-bar running average (keeps bars lively on loud or quiet tracks)

    const labels = () => {
      const m = MSG[isArabic() ? "ar" : "en"];
      orb.setAttribute("aria-label", playing ? m.pause : m.play);
      if (mini) mini.setAttribute("aria-label", m.pause);
    };
    const syncMini = () => {
      if (!mini) return;
      const show = playing && !orbVisible;
      mini.classList.toggle("show", show);
      mini.tabIndex = show ? 0 : -1;
    };
    const hideHint = () => { hinted = true; hint && hint.classList.remove("show"); };
    const setUI = on => {
      playing = on;
      orb.classList.toggle("is-playing", on);
      orb.setAttribute("aria-pressed", on ? "true" : "false");
      if (!on) { orb.classList.remove("is-buffering"); orb.style.removeProperty("--beat"); eqBars.concat(miniBars).forEach(b => (b.style.transform = "")); }
      const noFFT = on && !analyser;
      orb.classList.toggle("no-fft", noFFT);
      mini && mini.classList.toggle("no-fft", noFFT);
      labels(); syncMini();
      if (on) hideHint();
    };

    const ensureAudio = () => {
      if (audio) return;
      audio = new Audio();
      audio.preload = "auto"; audio.loop = true; audio.src = SRC;
      audio.setAttribute("playsinline", "");
      audio.addEventListener("waiting", () => playing && orb.classList.add("is-buffering"));
      audio.addEventListener("playing", () => orb.classList.remove("is-buffering"));
      audio.addEventListener("error", () => { console.warn("Music file not found:", SRC); setUI(false); });
    };
    const ensureGraph = () => {
      if (ctx || !canFFT) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        const src = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.6; analyser.minDecibels = -90; analyser.maxDecibels = -6;
        gain = ctx.createGain(); gain.gain.value = 0;
        src.connect(analyser); analyser.connect(gain); gain.connect(ctx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) { ctx = analyser = gain = data = null; }
    };
    const setLevel = (to, ms) => {
      if (gain) {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(to, t + ms / 1000);
      } else {
        clearInterval(fadeT);
        const from = audio.volume, steps = Math.max(1, Math.round(ms / 40));
        let i = 0;
        fadeT = setInterval(() => {
          i++; audio.volume = Math.min(1, Math.max(0, from + (to - from) * i / steps));
          if (i >= steps) clearInterval(fadeT);
        }, 40);
      }
    };

    const cur = new Float32Array(BINS.length + MINI_BINS.length).fill(0.3);   // smoothed bar heights (no flicker)
    const tick = () => {
      if (!playing || !analyser) return;
      analyser.getByteFrequencyData(data);
      const level = (bin, i, floor) => {               // relative to the bar's own recent average, then eased
        const v = data[bin] / 255;
        mean[i] += (v - mean[i]) * 0.04;
        const target = Math.max(floor, Math.min(1, 0.5 + (v - mean[i]) * 2.4 + (v - 0.5) * 0.3));
        cur[i] += (target - cur[i]) * (target > cur[i] ? 0.5 : 0.13);
        return cur[i];
      };
      for (let k = 0; k < eqBars.length; k++) eqBars[k].style.transform = "scaleY(" + level(BINS[k], k, 0.24).toFixed(3) + ")";
      const miniOn = mini && mini.classList.contains("show");
      for (let k = 0; k < miniBars.length; k++) {
        const s = level(MINI_BINS[k], BINS.length + k, 0.3);
        if (miniOn) miniBars[k].style.transform = "scaleY(" + s.toFixed(3) + ")";
      }
      const bass = (data[0] + data[1] + data[2]) / (3 * 255);
      avgB = avgB < 0 ? bass : avgB + (bass - avgB) * 0.05;
      const hit = Math.max(0, Math.min(1, (bass - avgB) * 4.5));
      beatS = Math.max(hit, beatS * 0.88);                               // instant attack, quick release (v1 feel)
      orb.style.setProperty("--beat", beatS.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    const startViz = () => { avgB = -1; cancelAnimationFrame(raf); if (analyser) raf = requestAnimationFrame(tick); };

    const start = async () => {
      const my = ++token;
      ensureAudio(); ensureGraph();
      audio.volume = gain ? 1 : 0;
      setUI(true);
      try {
        if (ctx && ctx.state === "suspended") await ctx.resume();
        await audio.play();
      } catch (e) { if (my === token) setUI(false); return; }
      if (my !== token) return;
      setLevel(VOL, 1400);
      startViz();
    };
    const stop = (ms = 800) => {
      const my = ++token;
      setUI(false); cancelAnimationFrame(raf);
      if (!audio) return;
      setLevel(0, ms);
      setTimeout(() => { if (token === my && audio) audio.pause(); }, ms + 60);
    };
    const toggle = () => (playing ? stop() : start());

    orb.addEventListener("click", toggle);
    orb.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    mini && mini.addEventListener("click", () => stop());
    document.addEventListener("visibilitychange", () => { if (document.hidden && playing) stop(600); });
    new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(es => es.forEach(e => { orbVisible = e.isIntersecting; syncMini(); }), { threshold: 0.2 }).observe(orb);
    }
    // one-time "tap" hint: appears shortly after load, fades by itself, disappears on first click
    if (hint) {
      setTimeout(() => { if (!hinted && !playing) hint.classList.add("show"); }, 1600);
      setTimeout(() => { if (!playing) hint.classList.remove("show"); }, 14000);
    }
    labels();
  }
}

/* ---------- Init ---------- */
const saved = store.get("tiamo-lang");
const initial = saved === "ar" || saved === "en" ? saved : ((navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en");
langBtn?.addEventListener("click", () => setLanguage(isArabic() ? "en" : "ar"));
setLanguage(initial);
updateScrollOrbit(true);
})();


/* ---------- Scroll-reactive section headings (Services / Selected Work) ----------
   Velocity-driven: every frame we measure how far the page actually moved.
   - scrolling down  -> heading is pushed UP and leads the cards
   - scrolling up    -> the motion reverses
   - scrolling stops -> velocity decays and the heading glides back to its place
   Only the heading wrapper is transformed, so card hover effects stay independent. ---------- */
(() => {
  const items = ["services", "work", "beforeafter"]
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .map(section => ({ section, heading: section.querySelector(".section-heading-scroll"), current: 0, max: section.id === "beforeafter" ? 76 : 56 }))
    .filter(item => item.heading);
  if (!items.length) return;

  const GAIN      = 2.0;     // px of shift per px of scroll speed (per frame)
  const FOLLOW    = 0.22;    // how quickly the heading follows its target (0-1)
  const DECAY     = 0.86;    // how quickly speed fades once scrolling stops
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let lastY = window.scrollY || 0;
  let vel = 0;               // smoothed signed scroll speed (+ down, - up)
  let raf = 0;

  // 0..1 : how much of the section is on screen (fades the effect in/out at the edges)
  const presence = rect => {
    const vh = window.innerHeight || 800;
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    if (visible <= 0) return 0;
    return clamp(visible / Math.min(rect.height || vh, vh * 0.6), 0, 1);
  };

  let lastT = 0;
  const frame = now => {
    const dt = clamp(lastT ? now - lastT : 16.7, 8, 50) / 16.7;   // frame-rate independent (60/90/120 Hz alike)
    lastT = now;
    const y = window.scrollY || 0;
    const dy = (y - lastY) / dt;
    lastY = y;

    // blend the new movement in, otherwise let the old speed fade out
    vel = Math.abs(dy) > 0.01 ? vel * 0.55 + dy * 0.45 : vel * Math.pow(DECAY, dt);
    if (Math.abs(vel) < 0.02) vel = 0;

    const follow = 1 - Math.pow(1 - FOLLOW, dt);
    let moving = vel !== 0;
    items.forEach(item => {
      const p = presence(item.section.getBoundingClientRect());
      const target = clamp(-vel * GAIN, -item.max, item.max) * p;   // down => negative => up
      item.current += (target - item.current) * follow;
      if (Math.abs(item.current) < 0.03 && target === 0) item.current = 0;
      if (item.current !== 0) moving = true;
      item.heading.style.setProperty("--tm-scroll-shift", item.current.toFixed(2) + "px");
    });

    if (moving) raf = requestAnimationFrame(frame); else { raf = 0; lastT = 0; }
  };

  const kick = () => { if (!raf) { lastT = 0; raf = requestAnimationFrame(frame); } };   // lastY is kept from the previous frame so the very first movement is measured

  addEventListener("scroll", kick, { passive: true });
  addEventListener("wheel", kick, { passive: true });
  addEventListener("touchmove", kick, { passive: true });
  addEventListener("resize", kick, { passive: true });
  document.addEventListener("visibilitychange", () => { vel = 0; kick(); });
})();

/* ---------- Before / After (portrait) ----------
   Works with placeholders until real images exist: images/ba1-before.jpg + ba1-after.jpg (also ba2, ba3).
   Pairs whose files are missing are skipped; one valid pair = no thumbnails; 2+ = thumbnail switcher. ---------- */
(() => {
  const root = document.getElementById("beforeafter");
  const stage = root && root.querySelector(".ba-stage");
  if (!stage) return;
  const card = root.querySelector(".ba-card");
  const range = stage.querySelector(".ba-range");
  const tagB = stage.querySelector(".ba-tag-before");
  const tagA = stage.querySelector(".ba-tag-after");
  const imgB = stage.querySelector(".ba-img-before");
  const imgA = stage.querySelector(".ba-img-after");
  const thumbsWrap = root.querySelector(".ba-thumbs");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  let p = 50, sweepRaf = 0, touched = false, dragging = false;

  const setP = v => {
    p = clamp(v, 0, 100);
    stage.style.setProperty("--p", p.toFixed(2));
    range.value = Math.round(p);
    tagB.classList.toggle("is-off", p < 16);
    tagA.classList.toggle("is-off", p > 84);
  };

  /* auto-sweep: glides through the given positions, then stops where the last one is */
  const stopSweep = () => { if (sweepRaf) { cancelAnimationFrame(sweepRaf); sweepRaf = 0; } };
  const sweep = (path, seg = 850) => {
    stopSweep();
    let i = 0, from = p, start = performance.now();
    const step = now => {
      const t = clamp((now - start) / seg, 0, 1);
      setP(from + (path[i] - from) * ease(t));
      if (t >= 1) {
        i++;
        if (i >= path.length) { sweepRaf = 0; return; }
        from = path[i - 1];
        start = now;
      }
      sweepRaf = requestAnimationFrame(step);
    };
    sweepRaf = requestAnimationFrame(step);
  };

  const markTouched = () => {
    if (!touched) { touched = true; stage.classList.add("touched"); }
    if (typeof scrubRaf !== "undefined" && scrubRaf) { cancelAnimationFrame(scrubRaf); scrubRaf = 0; }
    stopSweep();
  };

  /* pointer: drag anywhere on the frame; vertical swipes still scroll the page (touch-action: pan-y) */
  const fromEvent = e => {
    const r = stage.getBoundingClientRect();
    setP(((e.clientX - r.left) / r.width) * 100);
  };
  stage.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    markTouched();
    dragging = true;
    stage.classList.add("is-dragging");
    if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (_) {} }
    if (e.pointerType === "mouse") fromEvent(e);
  });
  stage.addEventListener("pointermove", e => { if (dragging) fromEvent(e); });
  const endDrag = () => { dragging = false; stage.classList.remove("is-dragging"); };
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(n => stage.addEventListener(n, endDrag));

  /* keyboard / assistive tech via the hidden range input */
  range.addEventListener("input", () => { markTouched(); setP(+range.value); });
  range.addEventListener("keydown", e => {
    const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
    if (step) { e.preventDefault(); markTouched(); setP(p + step); }
    else if (e.key === "Home") { e.preventDefault(); markTouched(); setP(0); }
    else if (e.key === "End") { e.preventDefault(); markTouched(); setP(100); }
  });

  /* soft 3D tilt (mouse only) */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    card.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse" || dragging) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      card.classList.add("is-tilting");
      card.style.setProperty("--ry", (x * 7).toFixed(2) + "deg");
      card.style.setProperty("--rx", (-y * 6).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }

  /* scroll-linked reveal: while the frame travels up the screen the line glides from BEFORE (right edge)
     to AFTER, settling at 50%. Fully reversible with scrolling; ends for good at the first touch/drag/key. */
  let scrubTarget = 100, scrubRaf = 0;
  const scrubProgress = () => {
    const r = stage.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const start = vh * 0.96;                      // frame top at the bottom edge  -> 0
    const end = (vh - r.height) / 2;              // frame centred                 -> 1
    return clamp((start - r.top) / Math.max(1, start - end), 0, 1);
  };
  const scrubTo = t => (t < 0.55 ? 100 - 84 * ease(t / 0.55) : 16 + 34 * ease((t - 0.55) / 0.45));
  const scrubStep = () => {
    scrubRaf = 0;
    if (touched) return;
    const d = scrubTarget - p;
    if (Math.abs(d) < 0.08) { setP(scrubTarget); return; }
    setP(p + d * 0.16);
    scrubRaf = requestAnimationFrame(scrubStep);
  };
  const onScrub = () => {
    if (touched) return;
    scrubTarget = scrubTo(scrubProgress());
    if (!scrubRaf) scrubRaf = requestAnimationFrame(scrubStep);
  };
  addEventListener("scroll", onScrub, { passive: true });
  addEventListener("resize", onScrub, { passive: true });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { io.disconnect(); stage.classList.add("is-in"); }
    }, { threshold: .35 });
    io.observe(stage);
  } else { stage.classList.add("is-in"); }

  /* images: use only pairs whose two files really exist; otherwise keep the elegant placeholders */
  const probe = src => new Promise(res => {
    if (!src) return res(false);
    const im = new Image();
    im.onload = () => res(true);
    im.onerror = () => res(false);
    im.src = src;
  });
  const thumbs = thumbsWrap ? Array.from(thumbsWrap.querySelectorAll(".ba-thumb")) : [];
  let current = null, busy = false;

  const apply = pair => {
    imgB.src = pair.before;
    imgA.src = pair.after;
    stage.classList.add("has-img");
    thumbs.forEach(t => t.classList.toggle("is-active", t === pair.el));
    current = pair;
  };
  const switchTo = pair => {
    if (busy || pair === current) return;
    busy = true;
    stage.classList.remove("has-img");
    setTimeout(() => {
      apply(pair);
      markTouched();
      sweep([70, 30, 50], 600);
      busy = false;
    }, 320);
  };

  (async () => {
    const ok = [];
    for (const el of thumbs) {
      const pair = { el, before: el.dataset.before, after: el.dataset.after };
      if ((await probe(pair.before)) && (await probe(pair.after))) ok.push(pair); else el.remove();
    }
    if (!ok.length) { if (thumbsWrap) thumbsWrap.remove(); return; }   // placeholder mode
    ok.forEach(pair => {
      pair.el.style.backgroundImage = `url("${pair.after}")`;
      pair.el.addEventListener("click", () => switchTo(pair));
    });
    if (ok.length > 1) thumbsWrap.classList.add("has-many"); else thumbsWrap.remove();
    apply(ok[0]);
  })();

  scrubTarget = scrubTo(scrubProgress());
  setP(scrubTarget);
})();

/* ---------- Visitor analytics (GoatCounter: free, privacy-friendly, no cookies) ----------
   Stays completely OFF until you create a free account at goatcounter.com and put your site code below.
   Example: const GOATCOUNTER_CODE = "tiamo";  ->  dashboard at https://tiamo.goatcounter.com
   It then records: visits, pages, countries, devices, browsers and WHERE visitors came from (referrer),
   plus clicks on WhatsApp / Facebook / Instagram / TikTok / Photoshop Mode links. ---------- */
(() => {
  const GOATCOUNTER_CODE = "";
  if (!GOATCOUNTER_CODE) return;

  const gc = document.createElement("script");
  gc.async = true;
  gc.dataset.goatcounter = "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count";
  gc.src = "//gc.zgo.at/count.js";
  document.head.appendChild(gc);

  const label = href => {
    if (/wa\.me|whatsapp/i.test(href)) return "whatsapp";
    if (/facebook\.com\/groups/i.test(href)) return "photoshop-mode-group";
    if (/facebook\.com/i.test(href)) return "facebook";
    if (/instagram\.com/i.test(href)) return "instagram";
    if (/tiktok\.com/i.test(href)) return "tiktok";
    return "";
  };
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    const name = label(a.href);
    if (!name || !window.goatcounter || !window.goatcounter.count) return;
    window.goatcounter.count({ path: "click/" + name, title: "Click: " + name, event: true });
  }, true);
})();

/* ---------- Work carousel: adaptive frames + glass reflection ----------
   Additive layer on top of the existing 3D slider (arrows, dots, swipe, autoplay, lightbox are untouched).
   - Each frame takes the exact proportions of its own image, so there are no empty bars inside the frame.
   - The stage gets a soft floor light, a mirrored reflection under the active frame and a "03 / 08" counter.
   If anything is missing (image not loaded yet), the original fixed layout stays in place for that slide. ---------- */
(() => {
  const pad2 = n => String(n).padStart(2, "0");
  document.querySelectorAll(".gallery-card .slider").forEach(slider => {
    const track = slider.querySelector(".slides");
    const figs = track ? [...track.querySelectorAll(":scope > figure")] : [];
    if (!figs.length) return;

    const mk = cls => { const d = document.createElement("div"); d.className = cls; d.setAttribute("aria-hidden", "true"); return d; };
    const floor = mk("stage-floor"), refl = mk("stage-reflect"), count = mk("stage-count");
    refl.appendChild(document.createElement("i"));
    slider.insertBefore(floor, track); slider.insertBefore(refl, track); slider.insertBefore(count, track);

    const geo = new Map();                       // figure -> {left, top, w, h, iw, ih}
    const imgOf = f => f.querySelector("img");
    const ratioOf = f => { const im = imgOf(f); return im && im.naturalWidth > 0 && im.naturalHeight > 0 ? im.naturalWidth / im.naturalHeight : 0; };

    const layout = () => {
      const W = slider.clientWidth, H = slider.clientHeight;
      if (!W || !H) return;
      const cy = H * 0.47;                      // optical centre: a little above the middle, room for the reflection
      let ready = 0;
      figs.forEach(f => {
        const r = ratioOf(f); if (!r) return;
        const im0 = imgOf(f), p = (parseFloat(getComputedStyle(f).paddingLeft) || 0) + (im0 ? parseFloat(getComputedStyle(im0).paddingLeft) || 0 : 0);
        const maxW = W * (r >= 1 ? 0.84 : 0.66), maxH = H * 0.78;
        const iw = Math.min(maxW - 2 * p, (maxH - 2 * p) * r), ih = iw / r;
        const w = iw + 2 * p, h = ih + 2 * p, top = cy - h / 2;
        geo.set(f, { left: (W - w) / 2, top, w, h, iw, ih, p });
        f.style.setProperty("--fw", w.toFixed(1) + "px");
        f.style.setProperty("--fh", h.toFixed(1) + "px");
        f.style.setProperty("--ft", top.toFixed(1) + "px");
        ready++;
      });
      if (ready) slider.classList.add("is-adaptive");
      sync(true);
    };

    let lastActive = null, swapTimer = 0;
    const sync = instant => {
      const i = Math.max(0, figs.findIndex(f => f.classList.contains("is-active")));
      const f = figs[i], g = geo.get(f);
      count.innerHTML = "<b>" + pad2(i + 1) + "</b><span> / " + pad2(figs.length) + "</span>";
      if (!g) return;
      const apply = () => {
        const W = slider.clientWidth, H = slider.clientHeight;
        const bottom = g.top + g.h - g.p;
        const rh = Math.max(0, Math.min(g.ih * 0.52, H - bottom - 34));
        const im = imgOf(f), src = im ? (im.currentSrc || im.src) : "";
        slider.style.setProperty("--rx", (g.left + g.p).toFixed(1) + "px");
        slider.style.setProperty("--ry", (bottom + 7).toFixed(1) + "px");
        slider.style.setProperty("--rw", g.iw.toFixed(1) + "px");
        slider.style.setProperty("--rh", rh.toFixed(1) + "px");
        slider.style.setProperty("--ih", g.ih.toFixed(1) + "px");
        slider.style.setProperty("--fcx", (W / 2).toFixed(1) + "px");
        slider.style.setProperty("--fb", bottom.toFixed(1) + "px");
        if (src) slider.style.setProperty("--rimg", 'url("' + src.replace(/"/g, "%22") + '")');
      };
      if (instant || lastActive === null) { apply(); slider.classList.add("stage-on"); }
      else if (lastActive !== f) {
        slider.classList.remove("stage-on"); clearTimeout(swapTimer);
        swapTimer = setTimeout(() => { apply(); slider.classList.add("stage-on"); }, 320);
      }
      lastActive = f;
    };

    figs.forEach(f => { const im = imgOf(f); if (im) { if (im.complete) { /* measured below */ } else im.addEventListener("load", layout, { once: true }); } });
    new MutationObserver(() => sync(false)).observe(track, { attributes: true, subtree: true, attributeFilter: ["class"] });
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(slider); else addEventListener("resize", layout);
    layout();
  });
})();
