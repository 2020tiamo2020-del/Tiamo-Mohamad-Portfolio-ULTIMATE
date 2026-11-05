/* ==========================================================================
   03½ / BEYOND — cinematic trailer scene
   One fixed stage, driven only by scroll position (so when you stop scrolling, the picture stops).
   Timeline (p = 0..1 across the runway, entry/exit happen just before / after it):
     entry   a line of light splits the page, speed-lines rush at you, the stage opens like an aperture
     0.00    screen divides in two halves: TOP = strobing images, BOTTOM = title cards
     0.20    both halves slam shut on the centre seam -> flash -> the hero scene opens outward
     0.23    rider rises; words arrive behind him: from above / from the side / flickering in
     0.30    backdrops swap with wipes; windshield + mirrors reflect them, edges wrap their light
     0.55    close-up 1 (face)  ->  close-up 2 (headlight)  ->  impact pull-back
     0.79    FINAL FRAME HOLDS (nothing drifts) until the exit
   exit    the aperture closes back to a line while 04 AI CREATION rises
   Tuning: TRAVEL_* (scroll length), TL (timings), CINE_SAFE (no strobe/shake/flash).
   ========================================================================== */
(() => {
  "use strict";
  if (window.__cnFx) return;
  window.__cnFx = true;

  const sec = document.getElementById("cinema");
  if (!sec) return;

  /* ------------------------------ tunables ------------------------------ */
  const ASSET = "images/cine/";
  const TRAVEL_DESKTOP = 11.4;      // runway length in screen-heights
  const TRAVEL_MOBILE = 10.6;
  const PE = 0.66;                 // share of the runway used by the motorbike scene (the rest is the helmet finale)
  const P_END_OLD = 0.84;          // the motorbike timeline's own 0..1 range ends here
  const HM_HITS = [0.12, 0.20, 0.28, 0.36];   // the four word-slams of the helmet finale
  const SAFE = !!window.CINE_SAFE || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HM_FLASH = SAFE ? [] : [[0.03, 0.6], [0.54, 0.35], [0.70, 0.55]];                         // [q, strength]
  const HM_SHAKE = SAFE ? [] : [[0.03, 1.2], [0.12, 0.8], [0.20, 0.9], [0.28, 1.0], [0.36, 1.1], [0.54, 1.0], [0.70, 1.5], [0.84, 0.8]];
  const STROBE_MIN_MS = SAFE ? 420 : 85;   // hard cap on how fast the top-half images may cut (≈11 per second)
  const HOLD_FROM = 0.79;                  // from here on, the final frame is frozen
  const N_STROBE = 23;
  const PLAN = ["p16", "p07", "p04", "p10", "p19", "p21", "p03", "p09"];   // backdrops behind the rider, in order
  const TR = [                                                            // wipes between them (p-range + style)
    { a: 0.300, b: 0.336, t: 0 }, { a: 0.346, b: 0.382, t: 1 }, { a: 0.392, b: 0.428, t: 2 },
    { a: 0.438, b: 0.474, t: 3 }, { a: 0.484, b: 0.520, t: 4 }, { a: 0.528, b: 0.556, t: 0 },
    { a: 0.722, b: 0.752, t: 2 }
  ];
  const FLASHES = SAFE ? [] : [[0.222, 0.62], [0.560, 0.22], [0.745, 0.5]];   // [p, strength]
  const SHAKES = SAFE ? [] : [[0.036, 0.5], [0.222, 1.1], [0.272, 0.9], [0.322, 0.55], [0.358, 0.6], [0.558, 0.7], [0.745, 1.3], [0.77, 0.4]];

  /* ------------------------------ helpers ------------------------------ */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const E = {
    out3: t => 1 - Math.pow(1 - t, 3),
    io3: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outExp: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
  };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const pulse = (p, q, w) => (p >= q ? Math.exp(-(p - q) / w) : 0);
  const isAr = () => document.documentElement.lang === "ar";
  const run = (n, fn) => { try { fn(); } catch (e) { console.warn("[cine:" + n + "]", e); } };
  const pad = (n, l = 2) => String(n).padStart(l, "0");

  /* ------------------------------ copy (EN / AR) ------------------------------ */
  const COPY = {
    en: {
      words: ["POWERS", "BEYOND", "YOUR\nIMAGINATION"],
      cards: ["IMAGINE", "CREATE", "DESIGN", "ANIMATE", "BEYOND"],
      caps: [["01 / VISION", "Eyes on the impossible."], ["02 / POWER", "Built to outrun the ordinary."]],
      scene: "SCENE 03½ — <b>BEYOND</b>", intro: ["CHAPTER 03½", "BEYOND"], hint: "SCROLL", replay: "Replay", mini: "SIGNAL / INCOMING", ghost: "POWERS ✦ BEYOND ✦ YOUR IMAGINATION ✦ "
    },
    ar: {
      words: ["قدرات", "فوق", "خيالك"],
      cards: ["تخيّل", "ابتكر", "صمّم", "حرّك", "تجاوز"],
      caps: [["01 / الرؤية", "عينٌ على المستحيل."], ["02 / القوة", "صُمّم ليتجاوز المألوف."]],
      scene: "المشهد ٣½ — <b>ما وراء الخيال</b>", intro: ["الفصل ٣½", "ما وراء الخيال"], hint: "مرّر", replay: "إعادة المشهد", mini: "إشارة / قادمة", ghost: "قدرات ✦ فوق ✦ خيالك ✦ "
    }
  };
  const HMC = {
    en: { words: ["THE MIND", "BEHIND", "EVERY", "FRAME"], lock: ["LET'S BUILD", "YOURS."], trk: ["LOCK · VISION", "24 FPS · 4K"] },
    ar: { words: ["العقل المبدع", "خلف", "كل", "إطار"], lock: ["لنصنع", "مشهدك."], trk: ["تثبيت · الرؤية", "٢٤ إطار · 4K"] }
  };
  const L = () => COPY[isAr() ? "ar" : "en"];

  /* ------------------------------ stage DOM ------------------------------ */
  const stage = document.createElement("div");
  stage.className = "cn-stage";
  stage.setAttribute("aria-hidden", "true");
  stage.innerHTML =
    '<div class="cn-clip">' +
      '<div class="cn-world">' +
        '<canvas class="cn-bg"></canvas><div class="cn-tint"></div>' +
        '<div class="cn-ghost"><span></span><span></span></div>' +
        '<div class="cn-floor"><i class="cn-pool"></i><i class="cn-streaks"></i></div>' +
        '<div class="cn-words"></div>' +
        '<div class="cn-rig">' +
          '<img class="cn-aura" alt="" src="' + ASSET + 'aura.webp" decoding="async">' +
          '<img class="cn-refl" alt="" src="' + ASSET + 'rider.webp" decoding="async">' +
          '<img class="cn-rider" alt="" src="' + ASSET + 'rider.webp" decoding="async">' +
          '<canvas class="cn-fuse" width="320" height="310"></canvas>' +
          '<i class="cn-hl a"></i><i class="cn-hl b"></i><i class="cn-hl c"></i><i class="cn-hl d"></i><i class="cn-hl e"></i>' +
        '</div>' +
        '<div class="cn-anam"></div><div class="cn-beam"></div>' +
      '</div>' +
      '<div class="cn-hm">' +
        '<div class="cn-hm-glow"></div><div class="cn-hm-rays"></div><div class="cn-hm-words"></div>' +
        '<div class="cn-hm-fig">' +
          '<img class="cn-hm-a m" alt="" src="' + ASSET + 'helmet-face.webp" decoding="async">' +
          '<img class="cn-hm-b m" alt="" src="' + ASSET + 'helmet-closed.webp" decoding="async">' +
          '<img class="cn-hm-na m" alt="" src="' + ASSET + 'helmet-a-neon.webp" decoding="async">' +
          '<img class="cn-hm-na2 m" alt="" src="' + ASSET + 'helmet-a-neon.webp" decoding="async">' +
          '<div class="cn-hm-eyes"><i class="l"></i><i class="r"></i></div>' +
          '<img class="cn-hm-nb m" alt="" src="' + ASSET + 'helmet-b-neon.webp" decoding="async">' +
          '<img class="cn-hm-nb2" alt="" src="' + ASSET + 'helmet-b-neon.webp" decoding="async">' +
          '<canvas class="cn-hm-vis" width="768" height="594"></canvas><i class="cn-hm-wipe"></i>' +
          '<div class="cn-hm-trk"><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i><span class="t1"></span><span class="t2"></span></div>' +
        '</div>' +
        '<div class="cn-hm-bloom"></div><i class="cn-hm-ring"></i><canvas class="cn-hm-pt"></canvas>' +
        '<div class="cn-hm-ln"><img class="cn-hm-l" alt="" src="' + ASSET + 'launch.webp" decoding="async"><div class="cn-hm-wheel"><i></i></div></div>' +
        '<div class="cn-hm-lock"><strong></strong><strong></strong></div>' +
      '</div>' +
      '<div class="cn-split">' +
        '<canvas class="cn-tunnel"></canvas><div class="cn-intro"><small></small><b></b></div>' +
        '<div class="cn-half cn-top"><canvas class="cn-strobe"></canvas><div class="cn-rec"><i></i><span>REC</span></div><div class="cn-count"></div></div>' +
        '<div class="cn-half cn-bot"><div class="cn-mini"></div><div class="cn-card"></div></div>' +
        '<div class="cn-seam"></div>' +
      '</div>' +
      '<div class="cn-cap"><small></small><strong></strong></div>' +
      '<div class="cn-bar t"></div><div class="cn-bar b"></div>' +
      '<div class="cn-vig"></div><div class="cn-scan"></div><div class="cn-grain"></div>' +
      '<div class="cn-flash"></div>' +
      '<div class="cn-hud"><div class="l"></div><div class="r"></div><div class="bar"><i></i></div></div>' +
      '<button type="button" class="cn-snd" aria-label="Sound"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path class="w" d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/><path class="x" d="M17 9l5 6M22 9l-5 6"/></svg></button>' +
      '<div class="cn-hint"><span></span><i></i></div>' +
      '<button type="button" class="cn-replay"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg><span></span></button>' +
    '</div>' +
    '<div class="cn-gate"></div>';
  document.body.appendChild(stage);

  const q = s => stage.querySelector(s);
  const el = {
    clip: q(".cn-clip"), world: q(".cn-world"), bg: q(".cn-bg"), ghost: stage.querySelectorAll(".cn-ghost span"), words: q(".cn-words"),
    floor: q(".cn-floor"), rig: q(".cn-rig"), rider: q(".cn-rider"), refl: q(".cn-refl"), aura: q(".cn-aura"), fuse: q(".cn-fuse"),
    hlA: q(".cn-hl.a"), hlB: q(".cn-hl.b"), anam: q(".cn-anam"), beam: q(".cn-beam"),
    tunnel: q(".cn-tunnel"), intro: q(".cn-intro"), top: q(".cn-top"), bot: q(".cn-bot"), strobe: q(".cn-strobe"), count: q(".cn-count"),
    mini: q(".cn-mini"), card: q(".cn-card"), seam: q(".cn-seam"), cap: q(".cn-cap"), barT: q(".cn-bar.t"), barB: q(".cn-bar.b"),
    flash: q(".cn-flash"), hud: q(".cn-hud"), hudL: q(".cn-hud .l"), hudR: q(".cn-hud .r"), hint: q(".cn-hint"), gate: q(".cn-gate"), replay: q(".cn-replay"), hm: q(".cn-hm"), hmWords: q(".cn-hm-words"), hmFig: q(".cn-hm-fig"), hmA: q(".cn-hm-a"), hmB: q(".cn-hm-b"), hmVis: q(".cn-hm-vis"), hmWipe: q(".cn-hm-wipe"), hmLock: q(".cn-hm-lock"), hmLn: q(".cn-hm-ln"), hmL: q(".cn-hm-l"), hmWheel: q(".cn-hm-wheel i"), hmBloom: q(".cn-hm-bloom"), hmNa: q(".cn-hm-na"), hmNa2: q(".cn-hm-na2"), hmEyes: q(".cn-hm-eyes"), hmEyeL: q(".cn-hm-eyes .l"), hmEyeR: q(".cn-hm-eyes .r"), hmNb: q(".cn-hm-nb"), hmNb2: q(".cn-hm-nb2"), hmTrk: q(".cn-hm-trk"), hmPt: q(".cn-hm-pt"), hmRing: q(".cn-hm-ring"), snd: q(".cn-snd")
  };
  const ctx = {
    bg: el.bg.getContext("2d"), fuse: el.fuse.getContext("2d"), strobe: el.strobe.getContext("2d"), tunnel: el.tunnel.getContext("2d"), hmv: el.hmVis.getContext("2d"), hmpt: el.hmPt.getContext("2d")
  };
  const tmp = document.createElement("canvas");
  const tmpx = tmp.getContext("2d");

  /* ------------------------------ images ------------------------------ */
  const IM = { plates: {}, strobe: [], vr: [], mask: null, visor: null, ready: false, started: false };
  const loadImg = src => { const i = new Image(); i.decoding = "async"; i.src = src; return i; };
  const okImg = i => !!(i && i.complete && i.naturalWidth > 0);
  function loadAll() {
    if (IM.started) return;
    IM.started = true;
    PLAN.forEach(n => (IM.plates[n] = loadImg(ASSET + n + ".webp")));
    for (let i = 0; i < N_STROBE; i++) IM.strobe[i] = loadImg(ASSET + "s" + pad(i) + ".webp");
    IM.mask = loadImg(ASSET + "fuse-mask.png");
    IM.visor = loadImg(ASSET + "visor-mask.png");
    Aud.load();
    for (let i = 0; i < 10; i++) IM.vr[i] = loadImg(ASSET + "vr" + pad(i) + ".webp");
  }

  /* ------------------------------ layout ------------------------------ */
  let vw = 0, vh = 0, T = 1, rig = { x: 0, y: 0, w: 1, h: 1 }, safeTop = 82, port = false, bgS = 1, strS = 1;
  let words = [];   // {el, chars[], x, y, w, h, kind}
  const A_RIG = 1275 / 1233;
  const HEAD = { x: .533, y: .158 }, NOSE = { x: .372, y: .515 };   // focus points inside the rider image (0..1)

  function measureText(wd, fs, ls) {
    wd.el.style.fontSize = fs + "px";
    wd.el.style.letterSpacing = ls;
    return { w: wd.el.offsetWidth, h: wd.el.offsetHeight };
  }
  function fitWord(wd, targetW, maxH) {
    const ar = isAr();
    const m = measureText(wd, 100, ar ? "0" : ".02em");
    let fs = 100 * targetW / Math.max(1, m.w);
    fs = Math.min(fs, 100 * maxH / Math.max(1, m.h));
    const r = measureText(wd, fs, ar ? "0" : ".02em");
    wd.fs = fs; wd.w = r.w; wd.h = r.h;
  }

  /* ---------- helmet finale: words, figure, lock-up ---------- */
  let hmWords = [], hm = { s: 1, figW: 1, hA: 1, hB: 1, figTop: 0, topBar: 90, botBar: 60, cxA: 0, cxB: 0 };
  function buildHmWords() {
    el.hmWords.textContent = "";
    hmWords = [];
    const ar = isAr();
    HMC[ar ? "ar" : "en"].words.forEach(txt => {
      const d = document.createElement("div");
      d.className = "cn-w cn-hw";
      d.setAttribute("data-t", txt);
      d.setAttribute("lang", ar ? "ar" : "en");
      const chars = [];
      if (ar) { const s = document.createElement("span"); s.className = "cn-ch"; s.textContent = txt; d.appendChild(s); chars.push(s); }
      else txt.split("").forEach(c => {
        if (c === " ") { const sp = document.createElement("span"); sp.className = "cn-sp"; d.appendChild(sp); return; }
        const s = document.createElement("span"); s.className = "cn-ch"; s.textContent = c; d.appendChild(s); chars.push(s);
      });
      el.hmWords.appendChild(d);
      hmWords.push({ el: d, chars, fs: 100, x: 0, y: 0, w: 1, h: 1 });
    });
    const lk = HMC[ar ? "ar" : "en"].lock, st = el.hmLock.querySelectorAll("strong");
    st[0].textContent = lk[0]; st[1].textContent = lk[1];
  }
  function placeHm() {
    if (!vw) return;
    const ar = isAr();
    const topBar = Math.max(safeTop + 8, vh * .115), botBar = vh * .085;
    const s = Math.min((vh - topBar + 4) / 745, vw * (port ? 1.35 : .78) / 1024);
    const figW = 1024 * s, hA = 745 * s, hB = 791 * s;
    const figTop = port ? Math.max(topBar - 4, vh * .30) : topBar - 4;
    hm = { s, figW, hA, hB, figTop, topBar, botBar, cxA: port ? vw * .5 : (ar ? vw * .36 : vw * .64), cxB: vw * .5 };
    const f = el.hmFig.style;
    f.width = figW + "px"; f.height = hB + "px"; f.top = figTop + "px"; f.left = "0px";
    el.hmA.style.height = hA + "px"; el.hmB.style.height = hB + "px"; el.hmVis.style.height = hB + "px";
    el.hmNa.style.height = hA + "px"; el.hmNa2.style.height = hA + "px"; el.hmEyes.style.height = hA + "px";
    [[el.hmEyeL, 517, 321], [el.hmEyeR, 615, 343]].forEach(([e, x, y]) => { const d = 34 * s; e.style.width = d + "px"; e.style.height = d + "px"; e.style.left = (x * s - d / 2) + "px"; e.style.top = (y * s - d / 2) + "px"; }); el.hmNb.style.height = hB + "px"; el.hmNb2.style.height = hB + "px";
    const tk = el.hmTrk.style; tk.left = (478 * s) + "px"; tk.top = (305 * s) + "px"; tk.width = (190 * s) + "px"; tk.height = (72 * s) + "px";
    const trkT = HMC[ar ? "ar" : "en"].trk; el.hmTrk.querySelector(".t1").textContent = trkT[0]; el.hmTrk.querySelector(".t2").textContent = trkT[1];
    el.hmPt.width = Math.round(vw * .6); el.hmPt.height = Math.round(vh * .6);
    hm.vx = hm.cxB - figW / 2 + 520 * s; hm.vy = figTop + 345 * s;
    el.hmRing.style.left = hm.vx + "px"; el.hmRing.style.top = hm.vy + "px";
    stage.style.setProperty("--rx", (hm.cxB - figW / 2 + 520 * s) + "px");
    stage.style.setProperty("--ry", (figTop + 345 * s) + "px");
    const mx = (x, w) => (ar ? vw - x - w : x);
    // words: a stacked headline in the free column next to the figure
    const helmetLeft = hm.cxA - figW / 2 + 285 * s;
    let y = port ? safeTop + vh * .02 : topBar + vh * .03;
    const cols = port ? [.88, .80, .70, .70] : [.40, .31, .27, .27];
    hmWords.forEach((w, i) => {
      const helmetRight = hm.cxA - figW / 2 + 760 * s;
      const tw = Math.min(vw * cols[i], port ? vw * .9 : (ar ? vw - helmetRight : helmetLeft) - vw * .075);
      fitWord(w, Math.max(110, Math.min(tw, port ? vw * .9 : 1e9)), port ? vh * .062 : (ar ? vh * .205 : vh * .150));
      w.x = port ? (vw - w.w) / 2 : mx(vw * .05, w.w);
      w.y = y; y += w.h * (port ? 1.0 : (ar ? .86 : .98));
      w.el.style.left = w.x + "px"; w.el.style.top = w.y + "px";
    });
    // lock-up
    const st = el.hmLock.querySelectorAll("strong");
    const target = port ? vw * .8 : Math.max(150, (hm.cxB - figW * .27) - vw * .075);
    let fs = 100; el.hmLock.style.fontSize = "100px";
    el.hmLock.style.cssText += ";width:auto;left:0;top:0";
    const w100 = Math.max(st[0].offsetWidth, st[1].offsetWidth, 1);
    fs = Math.min(100 * target / w100, port ? vh * .08 : vh * .14);
    el.hmLock.style.fontSize = fs + "px";
    const lw = Math.max(st[0].offsetWidth, st[1].offsetWidth), lh = el.hmLock.offsetHeight;
    const lx = port ? (vw - lw) / 2 : mx(vw * .05, lw);
    const ly = port ? safeTop + vh * .03 : Math.max(topBar + vh * .08, (vh - lh) / 2 - vh * .02);
    el.hmLock.style.left = lx + "px"; el.hmLock.style.top = ly + "px";
    hm.lock = { x: lx, w: lw };
    // launch image: big, leaning at the camera; its front wheel runs out of the frame at the bottom
    const kk = Math.min(1.3 * vh / 1536, (port ? 1.25 : .9) * vw / 1024);
    const lnW = 1024 * kk, lnH = 1536 * kk, lcx = port ? vw * .5 : (ar ? vw * .40 : vw * .60), lnTop = topBar + 4;
    hm.ln = { w: lnW, h: lnH, cx: lcx, cy: lnTop + lnH / 2, left: lcx - lnW / 2, top: lnTop, k: kk };
    const ls = el.hmLn.style;
    ls.width = lnW + "px"; ls.height = lnH + "px"; ls.left = hm.ln.left + "px"; ls.top = lnTop + "px";
    // lock-up now sits beside the bike (opposite column), no longer beside the helmet
    const free = port ? vw * .8 : Math.max(150, (lcx - lnW / 2 + 110 * kk) - vw * .075);
    el.hmLock.style.fontSize = "100px";
    const w2 = Math.max(st[0].offsetWidth, st[1].offsetWidth, 1);
    const fs2 = Math.min(100 * free / w2, port ? vh * .075 : vh * .13);
    el.hmLock.style.fontSize = fs2 + "px";
    const lw2 = Math.max(st[0].offsetWidth, st[1].offsetWidth), lh2 = el.hmLock.offsetHeight;
    const lx2 = port ? (vw - lw2) / 2 : mx(vw * .05, lw2);
    const ly2 = port ? vh * .74 : Math.max(topBar + vh * .08, (vh - lh2) / 2);
    el.hmLock.style.left = lx2 + "px"; el.hmLock.style.top = ly2 + "px";
    hm.lock = { x: lx2, y: ly2, w: lw2, h: lh2 };
    // Replay sits right under the lock-up (never on top of the bike)
    el.replay.classList.toggle("fin", !port);
    if (!port) {
      el.replay.style.top = (ly2 + lh2 + 26) + "px";
      if (ar) { el.replay.style.right = (vw - (lx2 + lw2)) + "px"; el.replay.style.left = "auto"; }
      else { el.replay.style.left = lx2 + "px"; el.replay.style.right = "auto"; }
    } else { el.replay.style.top = ""; el.replay.style.left = ""; el.replay.style.right = ""; }
  }

  function placeWords() {
    placeHm();
    if (!words.length) return;
    const ar = isAr();
    const mx = (x, w) => (ar ? vw - x - w : x);
    const [w1, w2, w3] = words;
    if (!port) {
      fitWord(w1, vw * .34, vh * .30); w1.x = mx(vw * .05, w1.w); w1.y = safeTop + vh * .045;
      fitWord(w2, vw * .30, vh * .28); w2.x = mx(vw - vw * .05 - w2.w, w2.w); w2.y = rig.y + rig.h * .20;
      fitWord(w3, vw * (ar ? .20 : .235), vh * .26); w3.x = mx(vw * .05, w3.w); w3.y = rig.y + rig.h * .58;
    } else {
      fitWord(w1, vw * .8, vh * .16); w1.x = (vw - w1.w) / 2; w1.y = safeTop + vh * .012;
      fitWord(w2, vw * .74, vh * .15); w2.x = (vw - w2.w) / 2; w2.y = w1.y + w1.h * .84;
      fitWord(w3, vw * (ar ? .44 : .84), vh * .09); w3.x = (vw - w3.w) / 2; w3.y = Math.min(vh * .885 - w3.h, rig.y + rig.h + vh * .005);
    }
    words.forEach(w => { w.el.style.left = w.x + "px"; w.el.style.top = w.y + "px"; });
  }

  function buildWords() {
    el.words.textContent = "";
    words = [];
    const ar = isAr();
    L().words.forEach((txt, i) => {
      const d = document.createElement("div");
      d.className = "cn-w";
      d.setAttribute("data-t", txt.replace("\n", " "));
      d.setAttribute("lang", ar ? "ar" : "en");
      const chars = [];
      if (ar) {
        const s = document.createElement("span"); s.className = "cn-ch"; s.textContent = txt; d.appendChild(s); chars.push(s);   // Arabic is never split into letters (it would break the joins)
      } else {
        txt.split("").forEach(c => {
          if (c === "\n") { d.appendChild(document.createElement("br")); return; }
          if (c === " ") { const sp = document.createElement("span"); sp.className = "cn-sp"; d.appendChild(sp); return; }
          const s = document.createElement("span"); s.className = "cn-ch"; s.textContent = c; d.appendChild(s); chars.push(s);
        });
      }
      el.words.appendChild(d);
      words.push({ el: d, chars, kind: i, fs: 100, x: 0, y: 0, w: 1, h: 1 });
    });
  }

  function applyLangText() {
    const t = L(), ar = isAr();
    stage.setAttribute("data-lang", ar ? "ar" : "en");
    buildWords();
    buildHmWords();
    el.hudL.innerHTML = t.scene;
    el.intro.querySelector("small").textContent = t.intro[0];
    el.intro.querySelector("b").textContent = t.intro[1];
    el.hint.querySelector("span").textContent = t.hint;
    el.replay.querySelector("span").textContent = t.replay;
    el.replay.setAttribute("aria-label", t.replay);
    el.mini.textContent = t.mini;
    el.ghost.forEach(s => (s.textContent = t.ghost.repeat(4)));
    lastCard = -1; lastCap = -1;
    placeWords();
  }

  let lastVh = 0, lastVw = 0;
  function layout() {
    const w = document.documentElement.clientWidth || innerWidth;
    let h = innerHeight;
    if (w === lastVw && Math.abs(h - lastVh) < 150 && lastVh) h = Math.max(h, lastVh);   // mobile browser bars: keep the tallest height so nothing jumps
    lastVw = w; lastVh = h; vw = w; vh = h;
    port = vw <= 900 || vh > vw * 1.1;
    stage.style.width = vw + "px"; stage.style.height = vh + "px";
    T = Math.round(vh * (vw <= 900 ? TRAVEL_MOBILE : TRAVEL_DESKTOP));
    sec.style.height = (T + vh) + "px";
    const hd = document.querySelector(".site-header");
    const hb = hd ? hd.getBoundingClientRect().bottom : 0;
    safeTop = Math.max(hb > 20 && hb < 200 ? hb : 0, vw <= 900 ? 70 : 84);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    bgS = Math.min(dpr, vw <= 900 ? 1.25 : 1.1);
    strS = Math.min(dpr, 1.1);
    el.bg.width = Math.round(vw * bgS); el.bg.height = Math.round(vh * bgS);
    el.strobe.width = Math.round(vw * strS); el.strobe.height = Math.round(vh / 2 * strS);
    el.tunnel.width = Math.round(vw * .75); el.tunnel.height = Math.round(vh * .75);

    const bottom = vh * (port ? .86 : .885);
    const hMaxV = (bottom - safeTop - 22) / .927;
    const hMaxW = vw * (port ? 1.12 : .92) / A_RIG;
    const rh = Math.min(hMaxV, hMaxW, vh * .9), rw = rh * A_RIG;
    rig = { x: (vw - rw) / 2 + (port ? 0 : rw * .02), y: bottom - rh, w: rw, h: rh };
    el.rig.style.cssText = "left:" + rig.x + "px;top:" + rig.y + "px;width:" + rig.w + "px;height:" + rig.h + "px";
    el.refl.style.top = "calc(100% - " + (rig.h * .075) + "px)";
    stage.style.setProperty("--fy", (rig.y + rig.h * .72) + "px");
    placeWords();
    refreshTop();
    wake();
  }

  /* ------------------------------ camera targets ------------------------------ */
  function camTargets() {
    const hx = rig.x + rig.w * HEAD.x, hy = rig.y + rig.h * HEAD.y;
    const nx = rig.x + rig.w * NOSE.x, ny = rig.y + rig.h * NOSE.y;
    return {
      face: { S: port ? 2.7 : 2.45, fx: hx, fy: hy, tx: vw * (port ? .5 : .63), ty: vh * (port ? .42 : .5) },
      nose: { S: port ? 2.25 : 1.95, fx: nx, fy: ny, tx: vw * (port ? .5 : .56), ty: vh * (port ? .48 : .54) }
    };
  }

  /* ------------------------------ backdrop painting ------------------------------ */
  function cover(c, img, W, H, scale, ox, oy, alpha) {
    if (!okImg(img)) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(W / iw, H / ih) * scale, w = iw * s, h = ih * s;
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.drawImage(img, (W - w) / 2 + (ox || 0), (H - h) / 2 + (oy || 0), w, h);
    c.globalAlpha = 1;
  }
  function edgeGlow(c, x1, y1, x2, y2, w) {
    c.save(); c.globalCompositeOperation = "lighter";
    c.strokeStyle = "rgba(190,255,140,.95)"; c.lineWidth = w; c.shadowColor = "#6dff3c"; c.shadowBlur = 26;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
  }
  function paintBackdrop(c, W, H, p) {
    // which plate / transition?
    let cur = 0, nxt = -1, qv = 0, tt = 0;
    for (let i = 0; i < TR.length; i++) {
      if (p >= TR[i].b) cur = i + 1;
      else if (p >= TR[i].a) { cur = i; nxt = i + 1; qv = (p - TR[i].a) / (TR[i].b - TR[i].a); tt = TR[i].t; break; }
      else break;
    }
    const kb = 1.03 + .075 * seg(Math.min(p, HOLD_FROM), .23, HOLD_FROM);
    drawMix(c, W, H, IM.plates[PLAN[cur]], nxt < 0 ? null : IM.plates[PLAN[nxt]], qv, tt, kb, (Math.min(p, HOLD_FROM) - .3) * W * .05);
  }

  /* backdrop of the helmet finale: its own plates and wipes, so the world keeps moving behind the figures */
  const FIN = ["p09", "p16", "p07", "p19", "p03"];
  const FTR = [{ a: .13, b: .17, t: 0 }, { a: .21, b: .25, t: 3 }, { a: .29, b: .33, t: 1 }, { a: .67, b: .73, t: 2 }];   // the last one is the whip into the light trails
  function paintFinaleBackdrop(c, W, H, q) {
    let cur = 0, nxt = -1, qv = 0, tt = 0;
    const order = [0, 1, 2, 3, 4];
    for (let i = 0; i < FTR.length; i++) {
      if (q >= FTR[i].b) cur = i + 1;
      else if (q >= FTR[i].a) { cur = i; nxt = i + 1; qv = (q - FTR[i].a) / (FTR[i].b - FTR[i].a); tt = FTR[i].t; break; }
      else break;
    }
    drawMix(c, W, H, IM.plates[FIN[order[Math.min(cur, 4)]]], nxt < 0 ? null : IM.plates[FIN[order[Math.min(nxt, 4)]]], qv, tt, 1.08 + .05 * seg(q, 0, .7), (q - .5) * W * .03);
  }

  function drawMix(c, W, H, A, B, qv, tt, kb, drift) {
    c.fillStyle = "#020504"; c.fillRect(0, 0, W, H);
    cover(c, A, W, H, kb, drift, 0, 1);
    if (!B) return;
    const e = E.io3(qv);
    c.save();
    if (tt === 0) {                                   // diagonal slash
      const x0 = lerp(-.35 * W, 1.35 * W, e), sl = H * .38;
      c.beginPath(); c.moveTo(-sl, 0); c.lineTo(x0 + sl, 0); c.lineTo(x0, H); c.lineTo(-sl, H); c.closePath(); c.clip();
      cover(c, B, W, H, kb + .05 * (1 - e), 0, 0, 1);
      c.restore(); edgeGlow(c, x0 + sl, 0, x0, H, Math.max(3, W * .004));
      return;
    }
    if (tt === 1) {                                   // glitch slices
      const n = 14, hh = H / n;
      for (let i = 0; i < n; i++) {
        const show = hash(i * 3.1 + 7) < e * 1.2;
        const off = (hash(i * 5.7) - .5) * W * .22 * Math.sin(e * Math.PI);
        c.save(); c.beginPath(); c.rect(0, i * hh, W, hh + 1); c.clip();
        cover(c, show ? B : A, W, H, kb, off, 0, 1);
        c.restore();
      }
      c.restore(); return;
    }
    if (tt === 2) {                                   // whip zoom with smear
      c.globalCompositeOperation = "source-over";
      for (let k = 0; k < 3; k++) cover(c, A, W, H, kb * (1 + e * .55 + k * .03), (k - 1) * e * W * .03, 0, (1 - e) * .5);
      for (let k = 0; k < 3; k++) cover(c, B, W, H, kb * (1.55 - e * .55 - k * .03 * (1 - e)), (1 - k) * (1 - e) * W * .03, 0, e * .5);
      c.restore(); return;
    }
    if (tt === 3) {                                   // vertical blinds
      const n = 12, cw = W / n;
      for (let i = 0; i < n; i++) {
        const o = clamp(e * 1.7 - i * .06, 0, 1), w = cw * E.out3(o);
        c.save(); c.beginPath(); c.rect(i * cw + (cw - w) / 2, 0, w, H); c.clip();
        cover(c, B, W, H, kb, 0, 0, 1); c.restore();
      }
      c.restore(); return;
    }
    // iris from the rider
    const cx = rig.x * bgS + rig.w * bgS * .5, cy = rig.y * bgS + rig.h * bgS * .45;
    const r = e * Math.hypot(W, H);
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
    cover(c, B, W, H, kb, 0, 0, 1);
    c.restore();
    c.save(); c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(190,255,140,.8)"; c.lineWidth = Math.max(3, W * .004); c.shadowColor = "#6dff3c"; c.shadowBlur = 30;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); c.restore();
  }

  function paintFuse(p) {
    // windshield + mirrors reflect what is behind the rider; the outline picks up the same light
    const c = ctx.fuse;
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, 320, 310);
    c.imageSmoothingEnabled = true;
    // sample the backdrop region that sits behind the rig (slightly widened) and mirror it for the glass
    const sx = (rig.x - rig.w * .1) * bgS, sy = (rig.y - rig.h * .05) * bgS, sw = rig.w * 1.2 * bgS, sh = rig.h * 1.1 * bgS;
    c.save(); c.translate(320, 0); c.scale(-1, 1);
    try { c.drawImage(el.bg, clamp(sx, 0, el.bg.width - 2), clamp(sy, 0, el.bg.height - 2), Math.min(sw, el.bg.width - Math.max(sx, 0)), Math.min(sh, el.bg.height - Math.max(sy, 0)), 0, 0, 320, 310); } catch (e) { }
    c.restore();
    if (okImg(IM.mask)) { c.globalCompositeOperation = "destination-in"; c.drawImage(IM.mask, 0, 0, 320, 310); c.globalCompositeOperation = "source-over"; }
  }

  /* ------------------------------ top-half strobe ------------------------------ */
  let strobeIdx = -1, strobeShown = -1, lastCut = 0, strobeSeed = 1;
  function paintStrobe(c, W, H, img, t, seed) {
    c.fillStyle = "#020504"; c.fillRect(0, 0, W, H);
    if (!okImg(img)) return;
    const sc = 1 + .09 * t;
    cover(c, img, W, H, sc, 0, 0, 1);
    if (SAFE) return;
    // glitch bands + ghost
    const bands = 2 + ((hash(seed) * 3) | 0);
    for (let i = 0; i < bands; i++) {
      const by = hash(seed * 7 + i) * H, bh = H * (.04 + hash(seed * 3 + i) * .1), off = (hash(seed * 11 + i) - .5) * W * .12;
      c.save(); c.beginPath(); c.rect(0, by, W, bh); c.clip(); cover(c, img, W, H, sc, off, 0, 1); c.restore();
    }
    c.save(); c.globalCompositeOperation = "screen"; cover(c, img, W, H, sc * 1.02, W * .008 * (1 + hash(seed)), 0, .28); c.restore();
    c.fillStyle = "rgba(150,255,110," + (.16 * (1 - clamp(t / .18, 0, 1))) + ")"; c.fillRect(0, 0, W, H);
  }

  /* ------------------------------ speed-lines tunnel (entry) ------------------------------ */
  function paintTunnel(c, W, H, ph, k) {
    c.clearRect(0, 0, W, H);
    if (k <= .01) return;
    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) * .6;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * .55);
    g.addColorStop(0, "rgba(120,255,90," + (.5 * k) + ")"); g.addColorStop(.35, "rgba(30,160,60," + (.16 * k) + ")"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.lineCap = "round";
    for (let i = 0; i < 110; i++) {
      const a = hash(i * 1.7) * Math.PI * 2, sp = .5 + hash(i * 2.3) * 1.2;
      const t = ((ph * sp + hash(i * 4.1)) % 1 + 1) % 1, r0 = Math.pow(t, 2.1) * R, r1 = r0 + (6 + t * t * R * .22);
      const al = Math.min(1, t * 2.2) * k * (.25 + hash(i * 9.1) * .6);
      c.strokeStyle = "rgba(" + (150 + (hash(i) * 80) | 0) + ",255," + (100 + (hash(i * 3) * 80) | 0) + "," + al.toFixed(3) + ")";
      c.lineWidth = .6 + t * 2.4;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.stroke();
    }
  }

  /* ------------------------------ frame ------------------------------ */
  let pending = false;
  let lastCard = -1, lastCap = -1, lastY = null, lastMove = 0, raf = 0, wasOn = false, wasCover = false, curGhost = 0;
  const set = (n, v) => stage.style.setProperty(n, v);

  function frame(now) {
    raf = 0;
    const r = sec.getBoundingClientRect();
    const y = -r.top;
    if (lastY === null || Math.abs(y - lastY) > .4) lastMove = now;
    lastY = y;
    const act = clamp(1 - (now - lastMove) / 300, 0, 1);
    pending = false;
    stage.classList.toggle("idle", act === 0);       // 1 while scrolling, fades to 0 once you stop (shake / flash / glitch settle)

    if (!IM.started && r.top < vh * 3.5) loadAll();
    const enter = clamp((y + vh) / vh, 0, 1);
    const pr = clamp(y / T, 0, 1);                                  // raw position on the whole runway
    const p = pr < PE ? pr / PE * P_END_OLD : P_END_OLD;            // motorbike timeline (unchanged)
    const q = pr > PE ? (pr - PE) / (1 - PE) : 0;                   // helmet finale timeline 0..1
    const exit = clamp((y - T) / vh, 0, 1);
    const on = enter > 0 && exit < 1;

    if (on !== wasOn) {
      stage.classList.toggle("is-on", on); wasOn = on;
    }
    { const dts = Math.max(1, now - (frame.t || now - 16)); const spd = Math.abs(y - (frame.y == null ? y : frame.y)) / dts * 1000 / 1800; frame.t = now; frame.y = y; Aud.motion(pr, spd, act > 0, now, on); }
    if (on) { fire("enter", enter, ENTER_EV, .5); fire("p", p, P_EV, .15); fire("q", q, SND_EVENTS, .15); fire("exit", exit, EXIT_EV, .5); }
    else { prevs.enter = prevs.p = prevs.q = prevs.exit = null; }
    if (!on) { Aud.stop(); el.world.classList.remove("is-on"); if (wasCover) { document.body.classList.remove("cn-on"); wasCover = false; } if (act > 0) raf = requestAnimationFrame(frame); return; }

    let shx = 0, shy = 0;
    const pw = Math.min(p, HOLD_FROM);          // motion that must freeze in the final frame uses pw
    const ar = isAr();
    const side = ar ? -1 : 1;

    /* ---- entry / exit: the new section opens from the line under 03, and lifts away at the end ---- */
    const exitPx = clamp(y - T, 0, vh);
    let clipV = "none", gateTop = -20, gateW = 0, gateO = 0;
    if (y < 0 && r.top > .5) {                                   // entering: only the part below the line is the new world
      clipV = "inset(" + r.top.toFixed(1) + "px 0 0 0)";
      gateTop = r.top; gateW = 100 * E.out3(seg(enter, 0, .22)); gateO = 1 - seg(enter, .93, 1);
    } else if (exitPx > .5) {                                    // leaving: the world is pushed up, the line rides its lower edge
      clipV = "inset(0 0 " + exitPx.toFixed(1) + "px 0)";
      gateTop = vh - exitPx; gateW = 100 * (1 - seg(exit, .85, 1)); gateO = 1;
    }
    el.clip.style.clipPath = clipV;
    el.gate.style.top = gateTop.toFixed(1) + "px";
    el.gate.style.width = gateW + "vw";
    el.gate.style.opacity = String(gateO);
    const covering = on && r.top < vh * .45 && r.bottom > vh * .55;
    if (covering !== wasCover) { document.body.classList.toggle("cn-on", covering); wasCover = covering; }

    /* ---- tunnel + intro (before / around p=0) ---- */
    const tk0 = p > 0.036 || exitPx > 0 || q > 0 ? 0 : (1 - seg(p, 0, .036)) * E.out3(seg(enter, .1, .8));
    const spd = (q > 0 && exitPx <= 0) ? E.io3(seg(q, .70, .76)) * (1 - E.io3(seg(q, .88, .95))) * .9 : 0;
    const tk = Math.max(tk0, spd);
    if (tk > 0) paintTunnel(ctx.tunnel, el.tunnel.width, el.tunnel.height, spd > 0 ? q * 18 : enter * 5 + p * 60, tk);
    el.tunnel.style.opacity = tk > 0 ? "1" : "0";
    el.intro.style.opacity = String(E.out3(seg(enter, .5, .95)) * (1 - seg(p, 0, .02)));
    el.intro.style.transform = "translate(-50%,-50%) scale(" + lerp(1.35, 1, E.out3(seg(enter, .4, 1))) + ")";

    /* ---- split halves ---- */
    const halves = E.out3(seg(p, .004, .036)) * (1 - E.io3(seg(p, .205, .236)));
    const hi = (1 - halves) * 100;
    el.top.style.clipPath = "inset(" + hi.toFixed(2) + "% 0 0 0)";
    el.bot.style.clipPath = "inset(0 0 " + hi.toFixed(2) + "% 0)";
    el.top.style.visibility = el.bot.style.visibility = halves > 0.001 ? "visible" : "hidden";
    const seamV = (p > .004 && p < .236 ? 1 : 0) * (p < .205 ? .75 : 1 - seg(p, .222, .236));
    set("--seam", seamV.toFixed(3));

    if (halves > 0.001) {
      /* strobe: scroll sets the target frame, but cuts can never come faster than STROBE_MIN_MS */
      const N = 56, tf = seg(p, .036, .205) * N, target = Math.floor(tf);
      if (strobeIdx < 0) { strobeIdx = target; strobeShown = -1; }
      if (target !== strobeIdx) pending = true;
      if (target !== strobeIdx && now - lastCut >= STROBE_MIN_MS) { strobeIdx += Math.sign(target - strobeIdx); lastCut = now; if (act > 0) Aud.tick(strobeIdx); strobeSeed = (hash(strobeIdx * 1.3) * 1000) | 0; }
      const t = clamp(tf - strobeIdx, 0, 1);
      const img = IM.strobe[((strobeIdx % N_STROBE) + N_STROBE) % N_STROBE * 7 % N_STROBE];
      paintStrobe(ctx.strobe, el.strobe.width, el.strobe.height, img, t, strobeSeed);
      el.count.innerHTML = "<b>" + pad(Math.max(0, strobeIdx) + 1) + "</b> / " + N;

      /* title cards on the bottom half */
      const cf = seg(p, .042, .2) * 5, ci = Math.min(4, Math.floor(cf)), ct = cf - ci;
      if (ci !== lastCard) { el.card.textContent = L().cards[ci]; if (lastCard !== -1 && act > 0) Aud.card(ci); lastCard = ci; }
      const slam = E.outExp(Math.min(1, ct * 3.2));
      el.card.style.transform = "translate(-50%,-50%) scale(" + lerp(1.7, 1, slam).toFixed(3) + ") skewX(" + ((1 - slam) * -8 * side).toFixed(2) + "deg)";
      el.card.style.opacity = String(ct < .02 ? 0 : 1 - E.io3(seg(ct, .84, 1)));
      el.card.style.filter = "blur(" + ((1 - slam) * 9).toFixed(1) + "px) drop-shadow(0 0 .1em rgba(80,255,80,.6))";
    }

    /* ---- world (hero scene) ---- */
    const worldOn = p > .2 || exit > 0;
    el.world.classList.toggle("is-on", worldOn);
    if (worldOn) {
      /* camera */
      const ct = camTargets();
      const wA = E.io3(seg(p, .55, .60)) * (1 - E.io3(seg(p, .63, .67)));
      const wN = E.io3(seg(p, .63, .67)) * (1 - E.io3(seg(p, .705, .76)));
      const wW = Math.max(0, 1 - wA - wN);
      const S0 = 1 + .05 * E.io3(seg(pw, .235, .55));
      const imp = SAFE ? 0 : pulse(p, .745, .018) * (p < .8 ? 1 : 0);
      let S = wW * S0 + wA * ct.face.S + wN * ct.nose.S;
      S *= 1 + .035 * imp * act;
      let tx = wW * (vw / 2 * (1 - S0)) + wA * (ct.face.tx - ct.face.S * ct.face.fx) + wN * (ct.nose.tx - ct.nose.S * ct.nose.fx);
      let ty = wW * (vh / 2 * (1 - S0)) + wA * (ct.face.ty - ct.face.S * ct.face.fy) + wN * (ct.nose.ty - ct.nose.S * ct.nose.fy);
      // when S carries the impact pulse, keep the centre fixed
      if (imp > 0) { const k = 1 + .035 * imp * act; tx = tx * k + (vw / 2) * (1 - k); ty = ty * k + (vh / 2) * (1 - k); }
      const wh = E.io3(seg(q, 0, .05)) * (1 - E.io3(seg(q, .05, .10)));          // whip-zoom into the cut
      if (wh > 0) { const k = 1 + .3 * wh; S *= k; tx = tx * k + (vw / 2) * (1 - k); ty = ty * k + (vh / 2) * (1 - k); }
      const hmv = E.io3(seg(q, .03, .10));
      let shake = 0;
      for (let i = 0; i < SHAKES.length; i++) shake += SHAKES[i][1] * pulse(p, SHAKES[i][0], .011);
      for (let i = 0; i < HM_SHAKE.length; i++) shake += HM_SHAKE[i][1] * pulse(q, HM_SHAKE[i][0], .011);
      shake = Math.min(shake, 1.6) * act;
      const sx = (Math.sin(pr * 9100) + Math.sin(pr * 4310 + 1.3)) * .5 * shake * (port ? 5 : 9);
      const sy = (Math.sin(pr * 7700 + 2.1) + Math.sin(pr * 5120)) * .5 * shake * (port ? 5 : 9);
      shx = sx; shy = sy;
      el.world.style.transform = "translate3d(" + (tx + sx).toFixed(2) + "px," + (ty + sy).toFixed(2) + "px,0) scale(" + S.toFixed(4) + ")";

      /* backdrop */
      const W = el.bg.width, H = el.bg.height;
      if (q > 0) paintFinaleBackdrop(ctx.bg, W, H, q); else paintBackdrop(ctx.bg, W, H, p);
      const blurK = clamp(wA * .9 + wN * .55 + hmv * .3, 0, 1);
      if (blurK > .04) {
        const f = 1 / (1 + blurK * 9);
        if (tmp.width !== Math.round(W * f)) { tmp.width = Math.round(W * f); tmp.height = Math.round(H * f); }
        tmpx.drawImage(el.bg, 0, 0, tmp.width, tmp.height);
        ctx.bg.imageSmoothingEnabled = true;
        ctx.bg.drawImage(tmp, 0, 0, W, H);
      }
      paintFuse(p);
      set("--sat", lerp(1, .38, Math.max(wA, wN * .7)).toFixed(3));
      set("--bgb", (lerp(.82, .62, Math.max(wA, wN)) * (1 - .38 * hmv)).toFixed(3));
      set("--vig", Math.max(wA, wN, hmv * .8).toFixed(3));

      /* rider */
      const ru = E.out3(seg(p, .225, .30));
      el.rig.style.transform = "translate3d(0," + ((1 - ru) * rig.h * .09).toFixed(1) + "px,0) scale(" + lerp(1.12, 1, ru).toFixed(4) + ")";
      set("--rb", lerp(.2, 1, E.out3(seg(p, .23, .29))).toFixed(3));
      set("--rs", "1");
      const glow = .55 + .45 * E.io3(seg(p, .28, .42));
      set("--glow", glow.toFixed(3));
      set("--fuse", lerp(.4, .62, wW).toFixed(3));
      el.refl.style.opacity = (.24 * ru).toFixed(3);

      /* headlight flicker (close-up 2) + anamorphic streak */
      const fl = wN > .02 ? (.55 + .45 * (hash(Math.floor(p * 1400)) > .35 ? 1 : .25)) * wN : 0;
      const hlHold = HOLD_FROM <= p ? .5 : .5 * seg(p, .75, HOLD_FROM);
      set("--hl", clamp(fl + hlHold * wW, 0, 1).toFixed(3));
      set("--an", clamp(wN * .9 + imp * .8 * act, 0, 1).toFixed(3));
      el.anam.style.top = (rig.y + rig.h * NOSE.y - 1) + "px";

      /* light beam sweeps on each wipe */
      let bo = 0, bx = -50;
      for (let i = 0; i < TR.length; i++) { const s = seg(p, TR[i].a - .006, TR[i].b + .004); if (s > 0 && s < 1) { bo = Math.sin(s * Math.PI) * .9; bx = lerp(-40, 120, s) * (vw / 100); } }
      set("--bo", bo.toFixed(3)); set("--bx", bx.toFixed(1) + "px");

      /* ghost marquee */
      el.ghost[0].style.transform = "translate3d(" + (-pw * vw * 1.4 * side).toFixed(1) + "px,0,0)";
      el.ghost[1].style.transform = "translate3d(" + (-(1 - pw) * vw * 1.2 * side - vw * .6).toFixed(1) + "px,0,0)";
      el.ghost[0].style.opacity = el.ghost[1].style.opacity = String(seg(p, .25, .3) * (1 - Math.max(wA, wN) * .8));

      /* words */
      const wv = clamp(1 - E.io3(seg(p, .545, .565)) + E.io3(seg(p, .715, .745)), 0, 1);
      const re = (SAFE || p < .715) ? 0 : (1 - E.out3(seg(p, .715, .775)));         // re-entry slam after the close-ups
      el.words.style.opacity = wv.toFixed(3);
      el.words.style.transform = re > 0 ? "scale(" + (1 + .16 * re).toFixed(4) + ")" : "none";
      el.words.style.transformOrigin = (vw / 2) + "px " + (vh * .45) + "px";
      el.words.style.filter = re > .02 ? "blur(" + (re * 6).toFixed(1) + "px)" : "none";
      updWords(p, pw, act, side);
      const cutOut = 1 - E.io3(seg(q, .02, .06));
      el.rig.style.opacity = cutOut.toFixed(3); el.floor.style.opacity = cutOut.toFixed(3);
      el.words.style.opacity = (parseFloat(el.words.style.opacity) * cutOut).toFixed(3);
      el.ghost[0].style.opacity = String(parseFloat(el.ghost[0].style.opacity) * cutOut); el.ghost[1].style.opacity = el.ghost[0].style.opacity;

      /* floor reflection fades with the rider */
    }

    updHM(q, pr, act, now, side, shx, shy);

    /* ---- caption (close-ups) ---- */
    const capA = E.out3(seg(p, .575, .60)) * (1 - seg(p, .625, .64));
    const capN = E.out3(seg(p, .665, .69)) * (1 - seg(p, .70, .715));
    const ci2 = capA > 0 ? 0 : (capN > 0 ? 1 : -1);
    if (ci2 !== lastCap && ci2 >= 0) { const c2 = L().caps[ci2]; el.cap.querySelector("small").textContent = c2[0]; el.cap.querySelector("strong").textContent = c2[1]; lastCap = ci2; }
    set("--cap", Math.max(capA, capN).toFixed(3));
    const bw = Math.max(E.io3(seg(p, .55, .60)) * (1 - E.io3(seg(p, .70, .76))), 0);
    const hbk = E.io3(seg(q, .01, .07));
    set("--bar", (Math.min(vh * .085, 78) * bw).toFixed(1));
    set("--bart", (q > 0 ? hm.topBar * hbk : Math.min(vh * .085, 78) * bw).toFixed(1));
    set("--barb", (q > 0 ? hm.botBar * hbk : Math.min(vh * .085, 78) * bw).toFixed(1));

    /* ---- flash ---- */
    let fv = 0;
    for (let i = 0; i < FLASHES.length; i++) fv += FLASHES[i][1] * Math.max(0, 1 - Math.abs(p - FLASHES[i][0]) / .012);
    for (let i = 0; i < HM_FLASH.length; i++) fv += HM_FLASH[i][1] * Math.max(0, 1 - Math.abs(q - HM_FLASH[i][0]) / .012) * (q > 0 ? 1 : 0);
    el.flash.style.opacity = (Math.min(fv, .7) * act).toFixed(3);

    /* ---- HUD ---- */
    const hudV = E.out3(seg(p, .245, .28)) * (1 - E.io3(seg(exit, 0, .5)));
    set("--hud", hudV.toFixed(3));
    el.snd.style.opacity = hudV.toFixed(3); el.snd.style.pointerEvents = hudV > .6 ? "auto" : "none";
    set("--pp", pr.toFixed(4));
    set("--hint", (E.out3(seg(q, .94, .98)) * (1 - seg(exit, 0, .3))).toFixed(3));
    const rv = E.out3(seg(q, .94, .98)) * (1 - seg(exit, 0, .25));
    el.replay.style.opacity = rv.toFixed(3);
    el.replay.style.pointerEvents = rv > .6 ? "auto" : "none";
    const secs = pr * 24, ss = Math.floor(secs), ff = Math.floor((secs - ss) * 24);
    el.hudR.textContent = "TC 00:00:" + pad(ss) + ":" + pad(ff);

    if (act > 0 || pending) raf = requestAnimationFrame(frame);   // once you stop scrolling and everything has settled, drawing stops completely
    else if (!raf) raf = 0;
  }

  /* ------------------------------ sound: pre-rendered kit + a scroll-driven score ------------------------------
     audio/cine/*.mp3 are real recordings of a synthesised kit (F minor, 124 BPM) built offline; score.json holds the arrangement.
     While you scroll, a sequencer plays the groove for the section you are in (more layers when you scroll fast, a filtered pad
     follows your speed); stop scrolling and it fades out. Hits and risers are cued to exact moments of the picture. */
  const Aud = (() => {
    const BASE = ASSET.replace("images/cine/", "audio/cine/");
    let ac = null, master = null, fxBus = null, grBus = null, padG = null, padF = null, score = null, loading = false, ready = false;
    const buf = {}, tracked = {};
    let seqOn = false, nextT = 0, k = 0, timer = 0, lastMoveT = 0, curPr = 0, vel = 0, gOn = false;
    const NOTE = { f1: "bass_f1", ab1: "bass_ab1", c2: "bass_c2", eb2: "bass_eb2", db2: "bass_db2" };
    const ARP = { f3: "pl_f3", ab3: "pl_ab3", c4: "pl_c4", eb4: "pl_eb4", f4: "pl_f4", ab4: "pl_ab4", c5: "pl_c5" };
    const muted = () => !!window.CINE_MUTE || (() => { try { return localStorage.getItem("cine-mute") === "1"; } catch (_) { return false; } })();
    const ctx = () => {
      if (!ac) {
        try {
          const C = window.AudioContext || window.webkitAudioContext; ac = new C();
          const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = .004; comp.release.value = .2;
          master = ac.createGain(); master.gain.value = .9; master.connect(comp); comp.connect(ac.destination);
          fxBus = ac.createGain(); fxBus.connect(master); grBus = ac.createGain(); grBus.connect(master);
        } catch (_) { ac = null; }
      }
      if (ac && ac.state === "suspended") ac.resume().catch(() => {});
      return ac;
    };
    const load = () => {
      if (loading || muted()) return; loading = true;
      const a = ctx(); if (!a) return;
      const dec = (ab, n) => { const ok = b => { buf[n] = b; }; const p = a.decodeAudioData(ab, ok, () => {}); if (p && p.catch) p.catch(() => {}); };
      fetch(BASE + "score.json").then(r => r.json()).then(d => {
        score = d.score;
        let left = d.names.length;
        d.names.forEach(n => fetch(BASE + n + ".mp3").then(r => r.arrayBuffer()).then(ab => { dec(ab, n); if (--left === 0) ready = true; }).catch(() => { if (--left === 0) ready = true; }));
      }).catch(() => {});
    };
    const play = (n, vol, rate, when, bus, track) => {
      if (muted() || !ac || !buf[n]) return null;
      const s = ac.createBufferSource(); s.buffer = buf[n]; if (rate) s.playbackRate.value = rate;
      const g = ac.createGain(); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(bus || fxBus);
      s.start(when || 0);
      if (track) { tracked[track] = { s, g }; }
      return { s, g };
    };
    const stopTracked = name => { const t = tracked[name]; if (!t || !ac) return; try { t.g.gain.setTargetAtTime(0, ac.currentTime, .03); t.s.stop(ac.currentTime + .2); } catch (_) {} delete tracked[name]; };
    const duck = (depth, dur) => { if (!ac) return; const t = ac.currentTime; grBus.gain.cancelScheduledValues(t); grBus.gain.setTargetAtTime(depth, t, .01); grBus.gain.setTargetAtTime(1, t + .12, dur / 3); };
    /* ---- the groove ---- */
    const sectionAt = pr => { const s = score.sections; for (let i = 0; i < s.length; i++) if (pr >= s[i][0] && pr < s[i][1]) return s[i]; return s[s.length - 1]; };
    const step = (t, kk, sec) => {
      const st = kk % 16, bar = (kk / 16) | 0, lv = sec[10] * (.75 + .35 * vel), V = (n, v, r) => play(n, v, r, t, grBus);
      if (sec[3][st] === "x") V("kick", .95 * lv);
      if (sec[4][st] === "x") V("snare", .8 * lv);
      if (sec[5][st] === "x") V("clap", .7 * lv);
      if (sec[6][st] === "x") V("hat_c", (st % 2 ? .5 : .42) * lv); else if (vel > .55 && st % 2 === 1 && sec[10] > .7) V("hat_c", .24 * lv);
      if (sec[7][st] === "x") V("hat_o", .45 * lv);
      let [pat, notes] = sec[8].split(";"); let nl = (notes || "").split(",").filter(Boolean);
      if (pat && pat[st] === "x" && nl.length) V(NOTE[nl[(bar + ((st / 8) | 0)) % nl.length]], .9 * lv);
      [pat, notes] = sec[9].split(";"); nl = (notes || "").split(",").filter(Boolean);
      if (pat && pat[st] === "x" && nl.length) V(ARP[nl[((kk / 2) | 0) % nl.length]], .6 * lv);
    };
    const seq = () => {
      if (!ac || !ready || !score) return;
      if (performance.now() - lastMoveT > 900 || muted()) { seqOn = false; clearInterval(timer); timer = 0; return; }
      const dt = 60 / score.bpm / 4;
      if (nextT < ac.currentTime) nextT = ac.currentTime + .05;
      while (nextT < ac.currentTime + .13) { if (curPr > .003) step(nextT, k, sectionAt(curPr)); k++; nextT += dt; }
    };
    /* ---- pad drone that opens with your scroll speed ---- */
    const pad = () => {
      if (padG || !ac) return;
      padG = ac.createGain(); padG.gain.value = 0; padF = ac.createBiquadFilter(); padF.type = "lowpass"; padF.frequency.value = 300; padF.Q.value = 3;
      [[87.31, "sawtooth", 0], [130.81, "sawtooth", 6], [43.65, "sine", 0], [174.61, "triangle", -5]].forEach(([f, type, det]) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; const g = ac.createGain(); g.gain.value = type === "sine" ? .8 : .3; o.connect(g); g.connect(padF); o.start(); });
      padF.connect(padG); padG.connect(master);
    };
    return {
      muted, load, ready: () => ready, dbg: () => ({ seqOn, curPr, vel, k, ready, moving: performance.now() - lastMoveT, ctx: ac && ac.state, sec: score && sectionAt(curPr)[2] }),
      toggle() { try { localStorage.setItem("cine-mute", muted() ? "0" : "1"); } catch (_) { window.CINE_MUTE = !window.CINE_MUTE; } if (master) master.gain.setTargetAtTime(muted() ? 0 : .9, ac.currentTime, .05); },
      /* called every frame with the scroll position inside the scene and how fast you are moving */
      motion(pr, speed, moving, now, onStage) {
        if (!ac || !ready || muted()) return;
        curPr = pr; vel += (clamp(speed, 0, 1) - vel) * .12;
        if (moving) lastMoveT = now;
        if (onStage && moving && !seqOn && pr > .003) { seqOn = true; nextT = ac.currentTime + .05; timer = setInterval(seq, 25); }
        pad();
        const sec = score ? sectionAt(pr) : null, active = onStage && (now - lastMoveT < 1100);
        if (padG) {
          padG.gain.setTargetAtTime(active && sec ? .05 + .09 * sec[10] : 0, ac.currentTime, .25);
          padF.frequency.setTargetAtTime(260 + 2600 * vel + 900 * (sec ? sec[10] : 0), ac.currentTime, .12);
        }
      },
      stop() { if (padG && ac) padG.gain.setTargetAtTime(0, ac.currentTime, .15); seqOn = false; clearInterval(timer); timer = 0; Object.keys(tracked).forEach(stopTracked); },
      /* one-shots */
      hit(n, v, r) { return play(n, v, r); },
      riser(n, track) { return play(n, .85, 1, 0, fxBus, track || "riser"); },
      stopRiser() { stopTracked("riser"); },
      impact(n, v, depth) { play(n, v == null ? 1 : v); duck(depth || .35, .55); },
      tick(i) { play("tick", .55, [1, 1.12, 1.26, 1.5, 1.26, 1.12][((i % 6) + 6) % 6]); },
      card(i) { play("imp_small", .85, 1 + i * .06); play(["bass_f1", "bass_ab1", "bass_c2", "bass_eb2", "bass_f1"][i % 5], .9); },
      thump() { play("imp_small", .6); }
    };
  })();
  const Snd = Aud;   // the sound button in the HUD talks to the same engine

  /* cue tables: [position, action]. Risers are cut by the impact that resolves them, like in a real mix. */
  const ENTER_EV = [[.04, () => Aud.hit("rumble", .9)], [.18, () => Aud.hit("zap", .7)], [.5, () => Aud.riser("riser_s")]];
  const P_EV = [
    [.004, () => { Aud.stopRiser(); Aud.impact("imp_small", .9, .5); Aud.hit("shutter", .8); }], [.14, () => Aud.riser("riser_s")],
    [.222, () => { Aud.stopRiser(); Aud.impact("imp_big", 1, .3); Aud.hit("glitch", .8); }], [.23, () => Aud.hit("stab", .8)],
    [.262, () => Aud.hit("imp_small", .8)], [.285, () => Aud.hit("imp_small", .9, .9)], [.30, () => Aud.hit("shutter", .7)], [.318, () => Aud.hit("clunk", .8)],
    [.346, () => Aud.hit("shutter", .7)], [.352, () => Aud.hit("zap", .5)], [.392, () => Aud.hit("shutter", .7)], [.438, () => Aud.hit("shutter", .7)],
    [.484, () => Aud.hit("shutter", .7)], [.528, () => Aud.hit("shutter", .7)], [.548, () => Aud.hit("heart", 1)], [.628, () => Aud.hit("tom", .8)],
    [.69, () => Aud.riser("riser_s")], [.745, () => { Aud.stopRiser(); Aud.impact("imp_mid", .95, .4); Aud.hit("clunk", .6); }]
  ];
  const EXIT_EV = [[.05, () => { Aud.impact("imp_small", .8, .5); Aud.hit("clunk", .6); }]];
  const prevs = { enter: null, p: null, q: null, exit: null };
  const fire = (dom, v, list, maxJump) => {
    const pv = prevs[dom];
    if (pv !== null) for (const [t, fn] of list) if (pv < t && v >= t && v - pv < maxJump) { try { fn(); } catch (_) {} }
    prevs[dom] = v;
  };
  const SND_EVENTS = [
    [.03, () => { Aud.stopRiser(); Aud.impact("imp_big", 1, .3); Aud.hit("glitch", .8); }],
    [HM_HITS[0], () => { Aud.hit("pl_f3", 1); Aud.hit("imp_small", .8); Aud.tick(0); }],
    [HM_HITS[1], () => { Aud.hit("pl_ab3", 1); Aud.hit("imp_small", .8); Aud.tick(1); }],
    [HM_HITS[2], () => { Aud.hit("pl_c4", 1); Aud.hit("imp_small", .8); Aud.tick(2); }],
    [HM_HITS[3], () => { Aud.hit("pl_eb4", 1); Aud.impact("imp_mid", .8, .5); Aud.tick(3); }],
    [.31, () => Aud.hit("charge", .8)], [.40, () => { Aud.hit("powerup", .8); Aud.hit("ping", .7); }], [.45, () => Aud.hit("clunk", .7)],
    [.54, () => { Aud.impact("imp_mid", .9, .45); Aud.hit("clunk", .8); }], [.56, () => Aud.riser("riser_l")],
    [.70, () => { Aud.stopRiser(); Aud.impact("imp_big", 1, .25); Aud.hit("engine", 1); }], [.72, () => Aud.hit("whoosh", .9)]   // the bike launching: engine + the only whoosh
  ];

  /* ------------------------------ helmet finale: face -> visor -> reflections -> launch ------------------------------ */
  const ORDER_VR = [0, 1, 3, 2, 5, 8, 7, 0, 1, 3, 2, 8, 5, 7, 3, 1, 2, 8];
  let hmIdx = -1, hmLastCut = 0, hmVisible = false;

  function paintVisor(q, act, now) {
    const c = ctx.hmv, W = 768, H = 594;
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, W, H);
    if (!okImg(IM.visor)) return;
    const N = 26, tf = seg(q, .56, .68) * N, target = Math.floor(tf);
    if (hmIdx < 0) hmIdx = target;
    if (target !== hmIdx) pending = true;
    if (target !== hmIdx && now - hmLastCut >= STROBE_MIN_MS) { hmIdx += Math.sign(target - hmIdx); hmLastCut = now; if (act > 0) Aud.tick(hmIdx); }
    const t = clamp(tf - hmIdx, 0, 1), fin = q >= .68;
    const img = IM.vr[fin ? 9 : ORDER_VR[((hmIdx % ORDER_VR.length) + ORDER_VR.length) % ORDER_VR.length]];
    if (okImg(img)) {
      c.save(); c.setTransform(1, 0, -.08, 1, 36, 0);                  // slight shear: the glass is curved, not flat
      cover(c, img, W, H, 1.2 + .14 * t + (fin ? .12 * seg(q, .68, .74) : 0), (hash(hmIdx) - .5) * W * .05, 0, 1);
      c.restore();
    }
    // glass depth: darker toward the chin, a moving sheen and two neon streak accents
    const dg = c.createLinearGradient(0, 0, 0, H); dg.addColorStop(0, "rgba(0,0,0,0)"); dg.addColorStop(1, "rgba(0,0,0,.5)"); c.fillStyle = dg; c.fillRect(0, 0, W, H);
    const sx = lerp(-W * .3, W * 1.3, seg(q, .54, .72)), g = c.createLinearGradient(sx - 90, 0, sx + 90, H * .7);
    g.addColorStop(0, "rgba(200,255,180,0)"); g.addColorStop(.5, "rgba(220,255,200,.30)"); g.addColorStop(1, "rgba(200,255,180,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = "lighter"; c.strokeStyle = "rgba(150,255,110,.5)"; c.lineWidth = 2;
    for (let k = 0; k < 2; k++) { const y = H * (.28 + .3 * k) + Math.sin(q * 40 + k) * 6; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y - 50); c.stroke(); }
    c.globalCompositeOperation = "destination-in"; c.drawImage(IM.visor, 0, 0, W, H);      // everything is cut to the glass shape
    c.globalCompositeOperation = "source-over";
  }

  function paintParticles(q, act) {
    const cv = el.hmPt, c = ctx.hmpt, W = cv.width, H = cv.height, k = W / vw;
    c.clearRect(0, 0, W, H);
    const dust = E.io3(seg(q, .06, .16)) * (1 - E.io3(seg(q, .66, .74)));
    if (dust > .01) {
      c.fillStyle = "rgba(170,255,120,1)";
      for (let i = 0; i < 70; i++) {
        const sp = .4 + hash(i * 1.3) * 1.4, x = hash(i) * W, y = ((hash(i * 2.1) - q * sp * 1.4) % 1 + 1) % 1 * H, r = (.6 + hash(i * 3.7) * 1.8) * k * 1.6;
        c.globalAlpha = dust * (.15 + .6 * hash(i * 5.3)) * (.6 + .4 * Math.sin(q * 50 + i));
        c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
      }
    }
    const sp = E.out3(seg(q, .70, .84)) * (1 - E.io3(seg(q, .78, .90)));
    if (sp > .01) {
      const cx = hm.vx * k, cy = hm.vy * k, R = Math.hypot(W, H);
      c.lineCap = "round"; c.globalCompositeOperation = "lighter";
      for (let i = 0; i < 80; i++) {
        const a = hash(i * 1.9) * 6.283, d0 = E.out3(seg(q, .70, .84)) * (.25 + hash(i * 4.1) * .75) * R, d1 = d0 * (.55 + .3 * hash(i));
        c.strokeStyle = "rgba(" + (170 + hash(i) * 85 | 0) + ",255," + (100 + hash(i * 2) * 100 | 0) + "," + (sp * (.4 + .6 * hash(i * 7))).toFixed(3) + ")";
        c.lineWidth = (1 + hash(i * 6) * 2.2) * k * 1.5;
        c.beginPath(); c.moveTo(cx + Math.cos(a) * d1, cy + Math.sin(a) * d1); c.lineTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); c.stroke();
      }
      c.globalCompositeOperation = "source-over";
    }
    c.globalAlpha = 1;
  }

  function updHM(q, pr, act, now, side, shx, shy) {
    const on = q > 0;
    if (on !== hmVisible) { el.hm.classList.toggle("is-on", on); hmVisible = on; }
    if (!on) { el.hmFig.style.visibility = "hidden"; el.hmLn.style.visibility = "hidden"; return; }
    const ar = isAr(), s = hm.s;
    el.hm.style.transform = "translate3d(" + shx.toFixed(1) + "px," + shy.toFixed(1) + "px,0)";

    /* the figure: opens like a light slit, slides to centre while the visor closes, pushes into the visor, then rushes past */
    const rev = E.out3(seg(q, .03, .10)), inA = rev, wp = E.io3(seg(q, .44, .54)), mv = E.io3(seg(q, .46, .60));
    const push = E.io3(seg(q, .56, .70)), fx = E.io3(seg(q, .70, .80));
    const cx = lerp(hm.cxA, hm.cxB, mv);
    const sc = lerp(1.1, 1, E.out3(seg(q, .03, .12))) * lerp(1 + .045 * seg(q, .10, .44), 1, mv) * (1 + 1.15 * push) * (1 + .9 * fx);
    const tx = cx - hm.figW / 2 + (1 - rev) * (ar ? -70 : 70);
    const vx = hm.cxB - hm.figW / 2 + 520 * s, vy = hm.figTop + 345 * s;
    el.hmFig.style.transformOrigin = (vx - (cx - hm.figW / 2)) + "px " + (vy - hm.figTop) + "px";
    el.hmFig.style.transform = "translate3d(" + tx.toFixed(1) + "px,0,0) scale(" + sc.toFixed(4) + ")";
    const vis = (1 - fx);
    el.hmFig.style.opacity = vis.toFixed(3);
    el.hmFig.style.visibility = (rev > .003 && vis > .003) ? "visible" : "hidden";
    const inset = (1 - rev) * 50;
    el.hmFig.style.clipPath = inset > .1 ? "inset(" + inset.toFixed(2) + "% 0)" : "none";

    /* visor-close wipe: B (closed) is revealed from the top down, A (face) stays underneath */
    const wy = wp * hm.hB;
    el.hmA.style.clipPath = wp > 0 ? "inset(" + wy.toFixed(1) + "px 0 0 0)" : "none";
    el.hmA.style.visibility = wp >= 1 ? "hidden" : "visible";
    const bClip = wp <= 0 ? "inset(0 0 100% 0)" : "inset(0 0 " + Math.max(0, hm.hB - wy).toFixed(1) + "px 0)";
    el.hmB.style.clipPath = bClip; el.hmVis.style.clipPath = bClip; el.hmNb.style.clipPath = bClip; el.hmNb2.style.clipPath = bClip;
    el.hmNa.style.clipPath = el.hmA.style.clipPath;
    if (rev < 1) { el.hmWipe.style.top = (hm.hA / 2) + "px"; el.hmWipe.style.opacity = String(1 - rev); }
    else { el.hmWipe.style.top = wy.toFixed(1) + "px"; el.hmWipe.style.opacity = (wp > 0 && wp < 1) ? "1" : "0"; }

    /* neon: face lights pulse on the beats; after the visor shuts the whole helmet powers up in a sweep */
    let beat = 0; for (let i = 0; i < HM_HITS.length; i++) beat += pulse(q, HM_HITS[i], .02);
    beat = Math.min(1, beat) * act;
    const wake2 = E.io3(seg(q, .32, .42)), breathe = .85 + .15 * Math.sin(q * 90);
    el.hmNa.style.opacity = clamp(.30 + .7 * beat + .55 * wake2 * breathe, 0, 1).toFixed(3);
    el.hmNa2.style.opacity = (.85 * wake2 * breathe).toFixed(3);
    const eyeStep = q < .345 ? (hash(Math.floor(q * 420)) > .4 ? 1 : .15) : 1;               // the eyes stutter on, then hold
    el.hmEyes.style.opacity = (E.io3(seg(q, .31, .37)) * eyeStep * (.9 + .1 * Math.sin(q * 120)) * (1 + .5 * pulse(q, .40, .02))).toFixed(3);
    el.hmEyes.style.clipPath = el.hmA.style.clipPath || "none";
    const pw2 = E.io3(seg(q, .54, .64)), sw = lerp(-20, 130, seg(q, .54, .66));
    el.hmNb.style.opacity = (.22 + .55 * pw2).toFixed(3);
    el.hmNb2.style.opacity = (Math.sin(Math.PI * seg(q, .54, .66)) * 1).toFixed(3);
    stage.style.setProperty("--sw", sw.toFixed(1) + "%");
    el.hmA.style.filter = "brightness(" + (1 + .14 * beat).toFixed(3) + ")";
    el.hmB.style.filter = "brightness(" + (1 + .22 * Math.min(1, pulse(q, .54, .03) * act)).toFixed(3) + ")";

    /* eye tracker locks on during the face act */
    const trk = E.out3(seg(q, .14, .20)) * (1 - E.io3(seg(q, .42, .46)));
    el.hmTrk.style.opacity = trk.toFixed(3);
    el.hmTrk.style.transform = "scale(" + lerp(1.7, 1, trk).toFixed(3) + ")";
    el.hmTrk.classList.toggle("blink", beat > .3);

    /* reflections inside the visor glass (only while the closed helmet is on screen) */
    if (wp > .02 && fx < .98) paintVisor(q, act, now);
    set("--vis", (E.io3(seg(q, .52, .58)) * (.88 + .12 * Math.min(1, beat + pulse(q, .56, .03))) * (1 - fx)).toFixed(3));

    /* glow, rays, bloom, shock ring */
    stage.style.setProperty("--hx", cx + "px");
    set("--hg", clamp(.5 * inA + .55 * beat + .45 * wake2 + .35 * seg(q, .5, .8), 0, 1.5).toFixed(3));
    set("--rayo", (E.io3(seg(q, .52, .66)) * (1 - E.io3(seg(q, .84, .92))) * .9).toFixed(3));
    set("--ra", (Math.min(q, .9) * 260).toFixed(1) + "deg");
    const bloom = E.io3(seg(q, .62, .70)) * (1 - E.io3(seg(q, .70, .80)));
    el.hmBloom.style.opacity = (bloom * .8).toFixed(3);
    el.hmBloom.style.transform = "scale(" + (1 + bloom * 1.3).toFixed(3) + ")";
    const rg = seg(q, .70, .84);
    el.hmRing.style.opacity = (rg > 0 && rg < 1 ? (1 - rg) * .95 : 0).toFixed(3);
    el.hmRing.style.transform = "translate(-50%,-50%) scale(" + (.2 + E.out3(rg) * 16).toFixed(3) + ")";
    paintParticles(q, act);

    updHmWords(q, act, side);

    /* LAUNCH: the bike bursts out of the visor, tyre running out of frame, wheel spinning with the scroll */
    const u = seg(q, .70, .90), f = E.io3(u), L = hm.ln;
    if (u <= 0) { el.hmLn.style.visibility = "hidden"; }
    else {
      const S0 = .05, scl = S0 * Math.pow(1 / S0, f) * (1 + .05 * Math.sin(Math.PI * seg(q, .82, .92)));
      const ox = lerp(vx - L.cx, 0, Math.pow(f, .85)), oy = lerp(vy - L.cy, 0, Math.pow(f, .85));
      const vel = Math.abs(E.io3(u) - E.io3(Math.max(0, u - .025))) * 60;
      el.hmLn.style.visibility = "visible";
      el.hmLn.style.opacity = clamp(u * 9, 0, 1).toFixed(3);
      el.hmLn.style.transform = "translate3d(" + ox.toFixed(1) + "px," + oy.toFixed(1) + "px,0) rotate(" + lerp(-9, 0, f).toFixed(2) + "deg) scale(" + scl.toFixed(4) + ")";
      el.hmL.style.filter = vel > .4 ? "blur(" + clamp(vel, 0, 9).toFixed(1) + "px)" : "none";
      el.hmWheel.style.transform = "rotate(" + ((q - .70) * 2400).toFixed(1) + "deg)";   // tied to scroll: stops when you stop
      el.hmWheel.parentNode.style.opacity = (.35 + .55 * clamp(vel / 3, 0, 1)).toFixed(3);
    }

    /* lock-up beside the bike */
    const lk = E.out3(seg(q, .91, .96));
    el.hmLock.style.opacity = lk.toFixed(3);
    el.hmLock.style.transform = "translate3d(" + ((1 - lk) * -50 * side).toFixed(1) + "px,0,0)";
  }

  function updHmWords(q, act, side) {
    const ar = isAr(), dir = ar ? 1 : -1;     // the column sits on the right in Arabic, on the left in English
    hmWords.forEach((w, i) => {
      const t0 = HM_HITS[i], u = seg(q, t0, t0 + .045), ex = E.io3(seg(q, .44 + .012 * i, .50 + .012 * i));
      let tx = 0, ty = 0, sc = 1, sk = 0, op = u > 0 ? 1 : 0, blur = 0, clip = "none", gl = false;
      w.el.style.transformOrigin = ar ? "100% 50%" : "0% 50%";
      if (i === 0) { const e = E.outExp(u); tx = dir * (w.w + vw * .3) * (1 - e); sk = dir * 18 * (1 - e); blur = (1 - e) * 10; gl = !SAFE && act > 0 && u > 0 && u < .9; }
      else if (i === 1) { ty = -(w.y + w.h + 80) * (1 - E.bounce(u)); gl = !SAFE && act > 0 && u > 0 && u < .9; }
      else if (i === 2) { const e = E.outExp(u); sc = lerp(3.4, 1, e); blur = (1 - e) * 12; gl = !SAFE && act > 0 && u > 0 && u < .8; }
      else { op = u <= 0 ? 0 : (SAFE || u > .6 ? 1 : (hash(Math.floor(q * 900) + i) > .42 ? 1 : .1)); const rv = (1 - E.out3(u)) * 100; clip = "inset(0 " + (ar ? "0 0 " + rv + "%" : rv + "% 0 0") + ")"; gl = !SAFE && act > 0 && u > 0 && u < .8; }
      const fill = E.io3(seg(q, t0 + .02, t0 + .09));
      w.el.style.setProperty("--f", fill.toFixed(3));
      tx += -dir * ex * (w.w * .7); op *= (1 - ex); if (ex > 0 && ex < 1) gl = gl || (!SAFE && act > 0);
      w.el.style.opacity = op.toFixed(3);
      w.el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0) scale(" + sc.toFixed(3) + ") skewX(" + sk.toFixed(1) + "deg)";
      w.el.style.filter = blur > .3 ? "blur(" + blur.toFixed(1) + "px)" : "none";
      w.el.style.clipPath = clip;
      w.el.classList.toggle("is-gl", gl);
      if (gl) { w.el.style.setProperty("--gx", (10 * side) + "px"); const a1 = (hash(Math.floor(q * 700) + i) * 70) | 0; w.el.style.setProperty("--gc1", a1 + "% 0 " + (100 - a1 - 18) + "% 0"); w.el.style.setProperty("--gc2", (100 - a1 - 12) + "% 0 " + a1 + "% 0"); }
    });
  }

  /* ------------------------------ words animation ------------------------------ */
  function updWords(p, pw, act, side) {
    const ar = isAr();
    for (let k = 0; k < words.length; k++) {
      const w = words[k], n = w.chars.length;
      let opacity = 1, wtx = 0, wty = 0, blur = 0, skew = 0, gx = 0, glitch = false, fill = 1, ls = null;
      if (k === 0) {                                   // POWERS — falls from above, letter by letter, bounces, fills from the bottom
        fill = E.io3(seg(pw, .275, .36));
        for (let i = 0; i < n; i++) {
          const d = ar ? 0 : i * .009, u = seg(pw, .262 + d, .262 + d + .05);
          const c = w.chars[i], drop = -(w.y + w.h + 90);
          const bt = E.bounce(u);
          c.style.transform = u <= 0 ? "translate3d(0," + drop + "px,0)" : "translate3d(0," + (drop * (1 - bt)).toFixed(1) + "px,0) rotate(" + ((1 - u) * (i % 2 ? 9 : -9)).toFixed(2) + "deg) scaleY(" + (1 - .16 * Math.sin(clamp(u, .78, 1) * Math.PI * (u < 1 ? 1 : 0)) * 0).toFixed(3) + ")";
          c.style.opacity = u <= 0 ? "0" : "1";
        }
        const u0 = seg(pw, .262, .32);
        blur = (1 - E.out3(u0)) * (u0 > 0 ? 3 : 0);
        glitch = !SAFE && act > 0 && (u0 > 0 && u0 < .95 || pulse(p, .745, .01) > .3);
        gx = (1 - u0) * 26 * side;
      } else if (k === 1) {                            // BEYOND — slams in from the side, skewed, with an RGB-split smear
        fill = E.io3(seg(pw, .315, .39));
        const u = E.outExp(seg(pw, .30, .362));
        wtx = (vw * .72 + w.w) * (1 - u) * side;
        skew = -22 * (1 - u) * side;
        blur = (1 - u) * (1 - u) * 12;
        for (let i = 0; i < n; i++) { const c = w.chars[i]; c.style.transform = "translate3d(0," + (Math.sin(i * .9 + (1 - u) * 7) * 16 * (1 - u)).toFixed(1) + "px,0)"; c.style.opacity = "1"; }
        opacity = seg(pw, .30, .312);
        glitch = !SAFE && act > 0 && u < .97 && u > 0;
        gx = (1 - u) * 46 * side;
      } else {                                         // YOUR IMAGINATION — flickers on, tracking collapses
        const u = seg(pw, .345, .415);
        fill = E.io3(seg(pw, .365, .43));
        opacity = u <= 0 ? 0 : (u < .6 ? (hash(Math.floor(pw * 1100)) > .42 ? 1 : .08) : 1);
        if (SAFE) opacity = u > 0 ? 1 : 0;
        if (!ar) ls = lerp(.9, .02, E.out3(u)) + "em";
        for (let i = 0; i < n; i++) { const c = w.chars[i]; c.style.transform = "none"; c.style.opacity = "1"; }
        glitch = !SAFE && act > 0 && u > 0 && u < .8;
        gx = (1 - u) * 18 * side;
      }
      w.el.style.setProperty("--f", fill.toFixed(3));
      w.el.style.opacity = opacity.toFixed(3);
      w.el.style.transform = "translate3d(" + wtx.toFixed(1) + "px," + wty.toFixed(1) + "px,0) skewX(" + skew.toFixed(2) + "deg)";
      w.el.style.filter = blur > .2 ? "blur(" + blur.toFixed(1) + "px)" : "none";
      if (ls !== null) w.el.style.letterSpacing = ls;
      w.el.classList.toggle("is-gl", glitch);
      if (glitch) {
        w.el.style.setProperty("--gx", gx.toFixed(1) + "px");
        const a1 = (hash(Math.floor(p * 700) + k) * 70) | 0, a2 = (hash(Math.floor(p * 700) + k + 9) * 70) | 0;
        w.el.style.setProperty("--gc1", a1 + "% 0 " + (100 - a1 - 18) + "% 0");
        w.el.style.setProperty("--gc2", a2 + "% 0 " + (100 - a2 - 12) + "% 0");
      }
    }
  }

  /* ------------------------------ wiring ------------------------------ */
  const syncSnd = () => { el.snd.classList.toggle("off", Snd.muted()); el.snd.setAttribute("aria-pressed", String(!Snd.muted())); };
  el.snd.addEventListener("click", () => { Snd.toggle(); syncSnd(); if (!Snd.muted()) Aud.thump(); });
  syncSnd();
  el.replay.addEventListener("click", () => {
    const top = sec.getBoundingClientRect().top + scrollY;
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo) lenis.scrollTo(top + 2, { duration: 2.2 });
    else scrollTo({ top: top + 2, behavior: "smooth" });
  });
  function wake() { if (!raf) raf = requestAnimationFrame(frame); }
  let rt = 0;
  let topAbs = 1e9;
  const refreshTop = () => { topAbs = sec.getBoundingClientRect().top + scrollY; };
  const onScroll = () => {
    const y = scrollY;
    if (!IM.started && y > topAbs - vh * 3.5) loadAll();
    if (wasOn || raf || (y > topAbs - vh * 1.6 && y < topAbs + T + vh * 1.6)) wake();    /* otherwise: do nothing at all */
  };
  addEventListener("scroll", onScroll, { passive: true });
  if (window.ResizeObserver) { let rq = 0; new ResizeObserver(() => { cancelAnimationFrame(rq); rq = requestAnimationFrame(refreshTop); }).observe(document.documentElement); }
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); }, { passive: true });
  addEventListener("orientationchange", () => setTimeout(layout, 250));
  new MutationObserver(() => run("lang", () => { applyLangText(); wake(); })).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  run("init", () => {
    applyLangText();
    layout();
    wake();
    const fonts = document.fonts;
    if (fonts && fonts.load) {
      Promise.all([fonts.load('100px "CN Anton"', "POWERS BEYOND"), fonts.load('100px "CN Lalezar"', "قدرات فوق خيالك")]).then(() => { placeWords(); wake(); }).catch(() => { });
      fonts.ready && fonts.ready.then(() => { placeWords(); wake(); });
    }
    addEventListener("load", () => { layout(); });
  });

  window.__cinema = { aud: Aud, layout, wake, get p() { const r = sec.getBoundingClientRect(); return clamp(-r.top / T, 0, 1); }, T: () => T };
})();

