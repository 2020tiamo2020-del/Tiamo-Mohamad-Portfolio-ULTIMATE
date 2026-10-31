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
  const TRAVEL_DESKTOP = 7.6;      // runway length in screen-heights
  const TRAVEL_MOBILE = 7.0;
  const SAFE = !!window.CINE_SAFE || matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    flash: q(".cn-flash"), hud: q(".cn-hud"), hudL: q(".cn-hud .l"), hudR: q(".cn-hud .r"), hint: q(".cn-hint"), gate: q(".cn-gate"), replay: q(".cn-replay")
  };
  const ctx = {
    bg: el.bg.getContext("2d"), fuse: el.fuse.getContext("2d"), strobe: el.strobe.getContext("2d"), tunnel: el.tunnel.getContext("2d")
  };
  const tmp = document.createElement("canvas");
  const tmpx = tmp.getContext("2d");

  /* ------------------------------ images ------------------------------ */
  const IM = { plates: {}, strobe: [], mask: null, ready: false, started: false };
  const loadImg = src => { const i = new Image(); i.decoding = "async"; i.src = src; return i; };
  const okImg = i => !!(i && i.complete && i.naturalWidth > 0);
  function loadAll() {
    if (IM.started) return;
    IM.started = true;
    PLAN.forEach(n => (IM.plates[n] = loadImg(ASSET + n + ".webp")));
    for (let i = 0; i < N_STROBE; i++) IM.strobe[i] = loadImg(ASSET + "s" + pad(i) + ".webp");
    IM.mask = loadImg(ASSET + "fuse-mask.png");
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

  function placeWords() {
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
    const A = IM.plates[PLAN[cur]];
    c.fillStyle = "#020504"; c.fillRect(0, 0, W, H);
    const drift = (Math.min(p, HOLD_FROM) - .3) * W * .05;
    cover(c, A, W, H, kb, drift, 0, 1);
    if (nxt < 0) return;
    const B = IM.plates[PLAN[nxt]];
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
  let lastCard = -1, lastCap = -1, lastY = null, lastMove = 0, raf = 0, wasOn = false, wasCover = false, curGhost = 0;
  const set = (n, v) => stage.style.setProperty(n, v);

  function frame(now) {
    raf = 0;
    const r = sec.getBoundingClientRect();
    const y = -r.top;
    if (lastY === null || Math.abs(y - lastY) > .4) lastMove = now;
    lastY = y;
    const act = clamp(1 - (now - lastMove) / 300, 0, 1);       // 1 while scrolling, fades to 0 once you stop (shake / flash / glitch settle)

    if (!IM.started && r.top < vh * 3.5) loadAll();
    const enter = clamp((y + vh) / vh, 0, 1);
    const p = clamp(y / T, 0, 1);
    const exit = clamp((y - T) / vh, 0, 1);
    const on = enter > 0 && exit < 1;

    if (on !== wasOn) {
      stage.classList.toggle("is-on", on); wasOn = on;
    }
    if (!on) { el.world.classList.remove("is-on"); if (wasCover) { document.body.classList.remove("cn-on"); wasCover = false; } if (act > 0) raf = requestAnimationFrame(frame); return; }

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
    const tk = p > 0.036 || exitPx > 0 ? 0 : (1 - seg(p, 0, .036)) * E.out3(seg(enter, .1, .8));
    if (tk > 0) paintTunnel(ctx.tunnel, el.tunnel.width, el.tunnel.height, enter * 5 + p * 60, tk);
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
      if (target !== strobeIdx && now - lastCut >= STROBE_MIN_MS) { strobeIdx += Math.sign(target - strobeIdx); lastCut = now; strobeSeed = (hash(strobeIdx * 1.3) * 1000) | 0; }
      const t = clamp(tf - strobeIdx, 0, 1);
      const img = IM.strobe[((strobeIdx % N_STROBE) + N_STROBE) % N_STROBE * 7 % N_STROBE];
      paintStrobe(ctx.strobe, el.strobe.width, el.strobe.height, img, t, strobeSeed);
      el.count.innerHTML = "<b>" + pad(Math.max(0, strobeIdx) + 1) + "</b> / " + N;

      /* title cards on the bottom half */
      const cf = seg(p, .042, .2) * 5, ci = Math.min(4, Math.floor(cf)), ct = cf - ci;
      if (ci !== lastCard) { el.card.textContent = L().cards[ci]; lastCard = ci; }
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
      let shake = 0;
      for (let i = 0; i < SHAKES.length; i++) shake += SHAKES[i][1] * pulse(p, SHAKES[i][0], .011);
      shake = Math.min(shake, 1.6) * act;
      const sx = (Math.sin(p * 9100) + Math.sin(p * 4310 + 1.3)) * .5 * shake * (port ? 5 : 9);
      const sy = (Math.sin(p * 7700 + 2.1) + Math.sin(p * 5120)) * .5 * shake * (port ? 5 : 9);
      el.world.style.transform = "translate3d(" + (tx + sx).toFixed(2) + "px," + (ty + sy).toFixed(2) + "px,0) scale(" + S.toFixed(4) + ")";

      /* backdrop */
      const W = el.bg.width, H = el.bg.height;
      paintBackdrop(ctx.bg, W, H, p);
      const blurK = clamp(wA * .9 + wN * .55, 0, 1);
      if (blurK > .04) {
        const f = 1 / (1 + blurK * 9);
        if (tmp.width !== Math.round(W * f)) { tmp.width = Math.round(W * f); tmp.height = Math.round(H * f); }
        tmpx.drawImage(el.bg, 0, 0, tmp.width, tmp.height);
        ctx.bg.imageSmoothingEnabled = true;
        ctx.bg.drawImage(tmp, 0, 0, W, H);
      }
      paintFuse(p);
      set("--sat", lerp(1, .38, Math.max(wA, wN * .7)).toFixed(3));
      set("--bgb", lerp(.82, .62, Math.max(wA, wN)).toFixed(3));
      set("--vig", Math.max(wA, wN).toFixed(3));

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

      /* floor reflection fades with the rider */
    }

    /* ---- caption (close-ups) ---- */
    const capA = E.out3(seg(p, .575, .60)) * (1 - seg(p, .625, .64));
    const capN = E.out3(seg(p, .665, .69)) * (1 - seg(p, .70, .715));
    const ci2 = capA > 0 ? 0 : (capN > 0 ? 1 : -1);
    if (ci2 !== lastCap && ci2 >= 0) { const c2 = L().caps[ci2]; el.cap.querySelector("small").textContent = c2[0]; el.cap.querySelector("strong").textContent = c2[1]; lastCap = ci2; }
    set("--cap", Math.max(capA, capN).toFixed(3));
    const bw = Math.max(E.io3(seg(p, .55, .60)) * (1 - E.io3(seg(p, .70, .76))), 0);
    set("--bar", (Math.min(vh * .085, 78) * bw).toFixed(1));

    /* ---- flash ---- */
    let fv = 0;
    for (let i = 0; i < FLASHES.length; i++) fv += FLASHES[i][1] * Math.max(0, 1 - Math.abs(p - FLASHES[i][0]) / .012);
    el.flash.style.opacity = (Math.min(fv, .7) * act).toFixed(3);

    /* ---- HUD ---- */
    const hudV = E.out3(seg(p, .245, .28)) * (1 - E.io3(seg(exit, 0, .5)));
    set("--hud", hudV.toFixed(3));
    set("--pp", p.toFixed(4));
    set("--hint", (E.out3(seg(p, .80, .85)) * (1 - seg(exit, 0, .3))).toFixed(3));
    const rv = E.out3(seg(p, .82, .87)) * (1 - seg(exit, 0, .25));
    el.replay.style.opacity = rv.toFixed(3);
    el.replay.style.pointerEvents = rv > .6 ? "auto" : "none";
    const secs = p * 24, ss = Math.floor(secs), ff = Math.floor((secs - ss) * 24);
    el.hudR.textContent = "TC 00:00:" + pad(ss) + ":" + pad(ff);

    if (act > 0 || p > 0.001 && p < 1) raf = requestAnimationFrame(frame);
    else if (!raf) raf = 0;
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

  window.__cinema = { layout, wake, get p() { const r = sec.getBoundingClientRect(); return clamp(-r.top / T, 0, 1); }, T: () => T };
})();
