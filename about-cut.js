/* ==========================================================================
   ABOUT · "Cut" background  (pairs with about-cut.css)
   Your works re-cut behind the portrait through strips, in one colour family,
   plus a light shine that runs only over the portrait's silhouette.
   ========================================================================== */
(() => {
  "use strict";

  /* ---------------- CONFIG: tweak here ---------------- */
  const CONFIG = {
    images: [                       /* your works - missing files are skipped automatically */
      "images/pm1.jpg","images/pm2.jpg","images/pm3.jpg","images/pm4.jpg",
      "images/pm5.jpg","images/pm6.jpg","images/pm7.jpg","images/pm8.jpg"
    ],
    bandsDesktop: 7,                /* number of strips */
    bandsMobile: 5,
    hold: 2300,                     /* ms the picture stays before the next cut */
    holdMobile: 3000,
    wipe: 520,                      /* ms one strip needs to slide in */
    stagger: 58,                    /* ms between strips */
    firstDelay: 1700,               /* ms after the portrait appears before the first cut */
    shineEvery: 2,                  /* shine on every Nth cut (0 = never) */
    glitch: true,                   /* short jitter on 2 strips + white blink at each cut */
    tones: [                        /* colour grades, cycled each cut: [top, bottom] */
      ["#7d2cff", "#16d8ff"],       /* violet -> cyan  (site colours) */
      ["#16d8ff", "#7d2cff"],       /* cyan -> violet */
      ["#a21cff", "#ff3dc8"],       /* violet -> pink */
      ["#5b2bff", "#2affd0"]        /* indigo -> aqua */
    ]
  };
  /* ---------------------------------------------------- */

  const sec = document.getElementById("about");
  const photo = sec && sec.querySelector(".about-photo");
  const host = photo && photo.querySelector(".about-float");
  if (!sec || !photo || !host || !host.animate) return;

  const mobile = () => matchMedia("(max-width:900px)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- build DOM ---------- */
  const cut = document.createElement("div");
  cut.className = "ab-cut";
  cut.setAttribute("aria-hidden", "true");
  const flash = document.createElement("i"); flash.className = "ab-flash";
  const scan = document.createElement("i"); scan.className = "ab-scan";
  cut.append(flash, scan);
  host.insertBefore(cut, host.firstChild);

  const shine = document.createElement("div");
  shine.className = "ab-shine";
  shine.setAttribute("aria-hidden", "true");
  host.appendChild(shine);

  /* ---------- state ---------- */
  let pics = [];          /* urls that really loaded */
  let idx = 0, cutN = 0, bands = [], H = 0, timer = 0, busy = false;
  let wantRun = false, inView = false, shown = false;

  /* ---------- preload (only keep files that exist) ---------- */
  const preload = () => Promise.all(CONFIG.images.map(src => new Promise(res => {
    const im = new Image();
    im.onload = () => res(src);
    im.onerror = () => res(null);
    im.src = src;
  }))).then(list => list.filter(Boolean));

  /* ---------- bands ---------- */
  function build() {
    bands.forEach(b => b.el.remove());
    bands = [];
    const n = mobile() ? CONFIG.bandsMobile : CONFIG.bandsDesktop;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div"); el.className = "ab-band";
      const a = document.createElement("div"); a.className = "ab-l a";
      const b = document.createElement("div"); b.className = "ab-l b";
      el.append(a, b);
      cut.insertBefore(el, flash);
      bands.push({ el, a, b });
    }
    layout();
    bands.forEach(o => { o.a.style.backgroundImage = `url("${pics[idx]}")`; });
  }
  function layout() {
    H = cut.clientHeight;
    const n = bands.length || 1, h = H / n;
    bands.forEach((o, i) => {
      /* +1px overlap so no hairline shows between strips */
      o.el.style.top = (i * h).toFixed(2) + "px";
      o.el.style.height = (h + 1).toFixed(2) + "px";
      [o.a, o.b].forEach(l => { l.style.top = (-i * h).toFixed(2) + "px"; l.style.height = H + "px"; });
    });
  }

  /* ---------- order of the strips for each cut ---------- */
  function order(n) {
    const kind = cutN % 3, idxs = [...Array(n).keys()];
    if (kind === 0) return idxs;                                        /* top -> bottom */
    if (kind === 1) {                                                   /* centre -> out */
      const c = (n - 1) / 2; return idxs.sort((x, y) => Math.abs(x - c) - Math.abs(y - c));
    }
    for (let i = n - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [idxs[i], idxs[j]] = [idxs[j], idxs[i]]; }
    return idxs;                                                        /* random */
  }

  /* ---------- one cut ---------- */
  function doCut() {
    if (busy || pics.length < 2) return;
    busy = true;
    const next = (idx + 1) % pics.length;
    const url = `url("${pics[next]}")`;
    const n = bands.length, ord = order(n), same = cutN % 2 === 0;
    let done = 0;

    /* colour grade changes with each cut */
    const t = CONFIG.tones[(cutN + 1) % CONFIG.tones.length];
    cut.style.setProperty("--abc-t1", t[0]);
    cut.style.setProperty("--abc-t2", t[1]);

    bands.forEach((o, i) => {
      o.b.style.backgroundImage = url;
      const fromLeft = same ? true : i % 2 === 0;
      const anim = o.b.animate(
        [{ clipPath: fromLeft ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0)" }],
        { duration: CONFIG.wipe, delay: ord.indexOf(i) * CONFIG.stagger, easing: "cubic-bezier(.7,0,.2,1)", fill: "both" }
      );
      anim.onfinish = () => {
        o.a.style.backgroundImage = url;       /* the new picture becomes the base */
        anim.cancel();                          /* strip B goes back to hidden */
        if (++done === n) { idx = next; cutN++; busy = false; schedule(); }
      };
    });

    if (CONFIG.glitch) {
      flash.animate([{ opacity: 0 }, { opacity: .55 }, { opacity: 0 }], { duration: 260, easing: "ease-out" });
      for (let k = 0; k < 2; k++) {
        const o = bands[(Math.random() * n) | 0];
        setTimeout(() => { o.a.classList.remove("glitch"); void o.a.offsetWidth; o.a.classList.add("glitch"); }, rnd(80, CONFIG.wipe));
      }
    }
    if (CONFIG.shineEvery && (cutN + 1) % CONFIG.shineEvery === 0) setTimeout(runShine, 260);
  }

  function runShine() {
    if (!shine.style.getPropertyValue("--abc-mask")) return;
    shine.classList.remove("go"); void shine.offsetWidth; shine.classList.add("go");
  }

  /* ---------- loop control ---------- */
  function schedule() {
    clearTimeout(timer);
    if (!wantRun) return;
    timer = setTimeout(doCut, mobile() ? CONFIG.holdMobile : CONFIG.hold);
  }
  function update() {
    const should = shown && inView && !document.hidden && pics.length > 1;
    if (should === wantRun) return;
    wantRun = should;
    if (should) { clearTimeout(timer); timer = setTimeout(doCut, busy ? 400 : CONFIG.firstDelay); }
    else clearTimeout(timer);
  }

  /* shine mask = the portrait's own transparent PNG (never the opaque JPG fallback) */
  function armShine() {
    const img = photo.querySelector("img");
    if (!img) return;
    const apply = () => {
      const src = img.currentSrc || img.src || "";
      if (/\.png(\?|$)/i.test(src)) shine.style.setProperty("--abc-mask", `url("${src}")`);
    };
    if (img.complete) apply(); else img.addEventListener("load", apply, { once: true });
  }

  /* ---------- go ---------- */
  preload().then(list => {
    if (list.length < 1) return;                      /* no images -> feature stays off */
    pics = list;
    cut.classList.add("has");
    build();
    armShine();

    /* rebuild on resize (strip count + pixel heights) */
    let rz = 0, lastMobile = mobile();
    addEventListener("resize", () => {
      clearTimeout(rz);
      rz = setTimeout(() => {
        if (busy) return layout();
        if (lastMobile !== mobile()) { lastMobile = mobile(); build(); } else layout();
      }, 160);
    }, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(() => { if (!busy) layout(); }).observe(cut);

    /* visible only while the portrait is "shown" by about-fx.js */
    const syncShown = () => {
      shown = photo.classList.contains("show");
      cut.classList.toggle("on", shown);
      update();
    };
    new MutationObserver(syncShown).observe(photo, { attributes: true, attributeFilter: ["class"] });
    syncShown();

    new IntersectionObserver(es => { inView = es[0].isIntersecting; update(); }, { threshold: .12 }).observe(sec);
    document.addEventListener("visibilitychange", update);
  });
})();
