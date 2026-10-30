/* ==========================================================================
   SECTION CUT · scroll transition between sections  (pairs with section-cut.css)
   When the mouse wheel (or a menu click) carries the visitor into a new section,
   the screen is re-cut through violet / cyan strips and the section's name hits
   the screen in huge type, then the strips clear and the section is revealed.
   It never takes over the scroll: the visitor keeps scrolling underneath.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__sxCut) return;
  window.__sxCut = true;

  /* ---------------- CONFIG: tweak here ---------------- */
  const CONFIG = {
    enabled: true,
    mobile: true,           /* false = effect only on desktop */
    stripsDesktop: 8,
    stripsMobile: 6,
    wipe: 250,              /* ms one strip needs to cross the screen */
    stagger: 28,            /* ms between strips */
    hold: 300,              /* ms the name stays on screen when fully covered */
    minGap: 1500,           /* ms after one transition before the next may start */
    flash: true,            /* white blink at the cut */
    tones: [                /* colour pair per transition (cycled) */
      ["#7d2cff", "#16d8ff"],
      ["#16d8ff", "#7d2cff"],
      ["#a21cff", "#ff3dc8"],
      ["#5b2bff", "#2affd0"]
    ],
    /* fallback names for sections that have no numbered kicker: [number, EN, AR] */
    names: {
      hero: ["00", "HOME", "الرئيسية"],
      process: ["06", "PROCESS", "العملية"],
      brief: ["08", "START A PROJECT", "ابدأ مشروعك"]
    }
  };
  /* ---------------------------------------------------- */

  if (!CONFIG.enabled || !document.documentElement.animate) return;
  const isMobile = () => matchMedia("(max-width:900px)").matches;
  if (isMobile() && !CONFIG.mobile) return;
  const isAr = () => document.documentElement.lang === "ar";

  const secs = ["section.hero", "#about", "#services", "#work", "#creation", "#beforeafter",
    "#process", "section.social-strip", "#brief", "#contact"]
    .map(s => document.querySelector(s)).filter(Boolean);
  if (secs.length < 2) return;

  /* ---------- label for a section ---------- */
  function labelOf(sec) {
    const k = sec.querySelector(".section-kicker");
    if (k) {
      const raw = (k.getAttribute(isAr() ? "data-ar" : "data-en") || k.textContent || "").replace(/\s+/g, " ").trim();
      const m = raw.match(/^(\d{1,2})\s*[\/\-–]\s*(.+)$/);
      if (m) return [m[1], m[2]];
      if (raw) return ["", raw];
    }
    const key = sec.classList.contains("hero") ? "hero" : sec.id === "process" ? "process" : sec.id === "brief" ? "brief" : "";
    const f = CONFIG.names[key];
    return f ? [f[0], isAr() ? f[2] : f[1]] : ["", ""];
  }

  /* ---------- overlay (built once, lazily) ---------- */
  let root, strips = [], tNum, tWord, tBox, flash, builtFor = 0;
  function build() {
    const n = isMobile() ? CONFIG.stripsMobile : CONFIG.stripsDesktop;
    if (root && builtFor === n) return;
    if (root) root.remove();
    builtFor = n; strips = [];
    root = document.createElement("div");
    root.id = "sx"; root.setAttribute("aria-hidden", "true");
    for (let i = 0; i < n; i++) {
      const s = document.createElement("i");
      const fromLeft = i % 2 === 0;
      s.className = "sx-s " + (i % 2 === 0 ? "c " : "d ") + (fromLeft ? "l" : "r");
      s.style.top = (i * 100 / n) + "%";
      s.style.height = `calc(${100 / n}% + 1px)`;
      s._fromLeft = fromLeft;
      root.appendChild(s); strips.push(s);
    }
    tBox = document.createElement("div"); tBox.className = "sx-t";
    tNum = document.createElement("div"); tNum.className = "sx-n";
    tWord = document.createElement("div"); tWord.className = "sx-w";
    tBox.append(tNum, tWord);
    flash = document.createElement("i"); flash.className = "sx-f";
    const scan = document.createElement("i"); scan.className = "sx-l2";
    root.append(scan, tBox, flash);
    document.body.appendChild(root);
  }

  /* ---------- the transition ---------- */
  let busy = false, lastEnd = 0, toneN = 0, anims = [];
  const EASE = "cubic-bezier(.7,0,.2,1)";

  function play(dir, getIdx) {
    build();
    busy = true;
    const n = strips.length;
    const t = CONFIG.tones[toneN++ % CONFIG.tones.length];
    root.style.setProperty("--sx-a", t[0]);
    root.style.setProperty("--sx-b", t[1]);
    root.classList.add("run");
    anims = [];

    const order = i => (dir >= 0 ? i : n - 1 - i);
    const inDur = (n - 1) * CONFIG.stagger + CONFIG.wipe;

    /* 1 · strips cover the screen */
    strips.forEach((s, i) => {
      s.style.transform = "";
      const from = s._fromLeft ? "-101%" : "101%";
      anims.push(s.animate(
        [{ transform: `translate3d(${from},0,0)` }, { transform: "translate3d(0,0,0)" }],
        { duration: CONFIG.wipe, delay: order(i) * CONFIG.stagger, easing: EASE, fill: "both" }
      ));
    });

    /* 2 · fully covered: name hits the screen */
    setTimeout(() => {
      const [num, word] = labelOf(secs[getIdx()]);
      tNum.textContent = num; tWord.textContent = word;
      anims.push(tBox.animate(
        [
          { opacity: 0, transform: "translate3d(0,34px,0) scale(1.14)" },
          { opacity: 1, transform: "translate3d(0,0,0) scale(1)" }
        ],
        { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
      ));
      if (CONFIG.flash) flash.animate([{ opacity: 0 }, { opacity: .38 }, { opacity: 0 }], { duration: 300, easing: "ease-out" });
    }, inDur);

    /* 3 · strips leave on the far side, revealing the section */
    setTimeout(() => {
      anims.push(tBox.animate(
        [
          { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
          { opacity: 0, transform: "translate3d(0,-34px,0) scale(.94)" }
        ],
        { duration: 200, easing: "ease-in", fill: "both" }
      ));
      let done = 0;
      strips.forEach((s, i) => {
        const to = s._fromLeft ? "101%" : "-101%";
        const a = s.animate(
          [{ transform: "translate3d(0,0,0)" }, { transform: `translate3d(${to},0,0)` }],
          { duration: CONFIG.wipe, delay: order(i) * CONFIG.stagger, easing: EASE, fill: "both" }
        );
        a.onfinish = () => { if (++done === n) cleanup(); };
        anims.push(a);
      });
    }, inDur + CONFIG.hold);
  }

  function cleanup() {
    anims.forEach(a => { try { a.cancel(); } catch (_) {} });
    anims = [];
    root.classList.remove("run");
    busy = false;
    lastEnd = performance.now();
  }

  /* ---------- which section is under the middle of the screen ---------- */
  let cur = -1, armed = false, raf = 0;
  function sectionAtMiddle() {
    const y = innerHeight * 0.5;
    for (let i = 0; i < secs.length; i++) {
      const r = secs[i].getBoundingClientRect();
      if (r.top <= y && r.bottom > y) return i;
    }
    return -1;
  }
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const n = sectionAtMiddle();
      if (n < 0 || n === cur) return;
      const prev = cur; cur = n;
      if (prev < 0 || !armed || busy) return;
      if (performance.now() - lastEnd < CONFIG.minGap) return;
      play(n > prev ? 1 : -1, () => (cur < 0 ? n : cur));
    });
  }

  /* only after the visitor really starts interacting (never during the intro / first paint) */
  const arm = () => { armed = true; };
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(ev => addEventListener(ev, arm, { passive: true, once: true }));
  document.addEventListener("click", e => { if (e.target.closest && e.target.closest("nav a, .nav a, a[href^='#']")) arm(); }, true);

  addEventListener("scroll", onScroll, { passive: true });
  cur = sectionAtMiddle();
})();
