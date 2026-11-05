/* =====================================================================
   WORK STAGE — builds the cinematic "chapters" view for 03 / SELECTED WORK
   from the media already listed in the old .gallery-grid (that markup stays
   in the page as the data source + the fallback if this script fails).
   Scroll       -> switches chapter (A photo / B reels / C ads / D VFX) with a HUD-lock transition
   Swipe/arrows -> switches item inside a chapter
   The frame morphs to each item's own ratio; a colour glow sampled from the
   media fills the rest of the stage. Only the visible video ever plays.
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, "0");
  const isAr = () => document.documentElement.lang === "ar";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const work = $("#work");
  const grid = work && $(".gallery-grid", work);
  if (!work || !grid) return;
  const cards = $$(".gallery-card", grid);
  if (cards.length < 2) return;

  /* ---------- data: read chapters + items from the old cards ---------- */
  const DEF_RATIO = [0.75, 0.5625, 1.5, 1.7778];
  const chapters = cards.map((c, i) => {
    const h3 = $("h3", c), sm = $("small", c);
    return {
      i, key: String.fromCharCode(65 + i), card: c, items: [], els: [],
      en: (h3 && (h3.dataset.en || h3.textContent)) || "Work",
      ar: (h3 && (h3.dataset.ar || h3.textContent)) || "أعمال",
      kEn: (sm && sm.dataset.en) || "", kAr: (sm && sm.dataset.ar) || "",
      vid: !!$("video", c), at: 0
    };
  });
  const harvest = ch => {
    const seen = new Set(ch.items.map(x => x.src));
    $$(".slides > figure", ch.card).forEach(f => {
      const v = $("video", f);
      if (v) {
        const src = v.dataset.src || v.getAttribute("src");
        if (!src || seen.has(src)) return;
        seen.add(src);
        const a = $("a", f);
        ch.items.push({ t: "v", src, ratio: +v.dataset.ratio || DEF_RATIO[ch.i], link: a ? a.href : "", poster: v.dataset.poster || "" });
      } else {
        const im = $("img", f); if (!im) return;
        const thumb = im.getAttribute("src") || im.dataset.src || "";
        const b = $(".media-open", f);
        const src = (b && b.dataset.full) || thumb;
        if (!src || seen.has(src)) return;
        seen.add(src);
        ch.items.push({ t: "i", src, thumb, ratio: 0 });
      }
    });
  };
  chapters.forEach(harvest);
  if (!chapters.some(c => c.items.length)) return;

  /* ---------- build DOM ---------- */
  const T = (en, ar) => (isAr() ? ar : en);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const i18n = (e, en, ar) => { e.dataset.en = en; e.dataset.ar = ar; e.textContent = T(en, ar); return e; };

  const root = el("div", "ws");
  root.id = "ws"; root.style.setProperty("--n", chapters.length);
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Selected work");
  const pin = el("div", "ws-pin");
  const glow = el("div", "ws-glow"); glow.setAttribute("aria-hidden", "true"); glow.append(el("i"), el("i"));
  const tech = el("div", "ws-grid"); tech.setAttribute("aria-hidden", "true");

  const bar = el("div", "ws-bar");
  const tabs = el("div", "ws-tabs"); tabs.setAttribute("role", "tablist");
  const tabEls = chapters.map(ch => {
    const b = el("button", "ws-tab"); b.type = "button"; b.setAttribute("role", "tab");
    const k = el("b"); k.textContent = ch.key;
    const s = el("span"); i18n(s, ch.en, ch.ar);
    b.append(k, s); tabs.appendChild(b); return b;
  });
  const prog = el("div", "ws-prog"); const progI = el("i"); prog.appendChild(progI);
  const kick = el("div", "ws-kick"); i18n(kick, "03 / SELECTED WORK", "03 / أعمال مختارة");
  bar.append(kick, tabs, prog);

  const area = el("div", "ws-area");
  const ghost = el("div", "ws-ghost"); ghost.setAttribute("aria-hidden", "true"); const ghostS = el("span"); ghost.appendChild(ghostS);
  const frame = el("div", "ws-frame"); frame.tabIndex = 0;
  frame.setAttribute("aria-roledescription", "carousel");
  const media = el("div", "ws-media");
  const hud = el("div", "ws-hud"); hud.setAttribute("aria-hidden", "true");
  hud.innerHTML = '<i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i><div class="meta"><span class="ws-rec">REC</span><span class="ws-tc">00:00</span></div>';
  const CHEV = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15 4.5 7.5 12 15 19.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const prev = el("button", "ws-nav prev", CHEV); prev.type = "button";
  const next = el("button", "ws-nav next", CHEV); next.type = "button";
  prev.setAttribute("aria-label", "Previous"); next.setAttribute("aria-label", "Next");
  const fb = el("button", "ws-fb"); fb.type = "button";
  fb.innerHTML = '<b aria-hidden="true">f</b><span></span>';
  const fbT = $("span", fb);
  /* "click to enlarge" hint for photos: a small glass chip that follows the pointer (a fixed badge on touch screens) */
  const zoomChip = el("div", "ws-zoom"); zoomChip.setAttribute("aria-hidden", "true");
  zoomChip.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.2 15.2 20 20M10.5 8v5M8 10.5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span></span>';
  i18n($("span", zoomChip), "Click to enlarge", "اضغط للتكبير");
  frame.append(media, hud, zoomChip, fb);
  /* chapter change = "HUD lock": camera brackets close in on the frame, the chapter letter rolls A -> B, then the lock opens on the new chapter */
  const lock = el("div", "ws-lock"); lock.setAttribute("aria-hidden", "true");
  lock.innerHTML = '<i class="lk-v"></i><i class="lk-c tl"></i><i class="lk-c tr"></i><i class="lk-c bl"></i><i class="lk-c br"></i>' +
    '<div class="lk-mid"><div class="lk-roll"><span class="lk-a"></span><span class="lk-b"></span></div><small class="lk-name"></small><i class="lk-bar"><b></b></i></div>';
  const lkA = $(".lk-a", lock), lkB = $(".lk-b", lock), wipeL = $(".lk-name", lock);
  frame.appendChild(lock);
  area.append(ghost, frame, prev, next);

  const foot = el("div", "ws-foot");
  const info = el("div", "ws-info");
  const infoH = el("h3"), infoK = el("small"), infoC = el("span", "ws-count");
  info.append(infoH, infoK, infoC);
  const rail = el("div", "ws-rail");
  const cta = el("button", "ws-cta"); cta.type = "button";
  foot.append(info, rail, cta);
  const hint = el("div", "ws-hint"); i18n(hint, "SWIPE ⟷ · SCROLL ↓", "اسحب ⟷ · مرّر ↓");

  pin.append(glow, tech, bar, area, foot, hint);
  root.appendChild(pin);

  const full = el("div", "ws-full"); full.setAttribute("role", "dialog"); full.setAttribute("aria-modal", "true");
  const fullImg = el("img"); fullImg.alt = "";
  const fx = el("button", "x", "✕"), fp = el("button", "p", "‹"), fn = el("button", "n", "›");
  fx.type = fp.type = fn.type = "button"; fx.setAttribute("aria-label", "Close"); fp.setAttribute("aria-label", "Previous"); fn.setAttribute("aria-label", "Next");
  full.append(fullImg, fx, fp, fn);

  /* ---------- state ---------- */
  let ci = 0, busy = false, want = null, live = false, hintShown = false;
  let glowK = 0, sampleT = 0;
  const rtl = () => getComputedStyle(document.documentElement).direction === "rtl";
  const sfx = () => { try { window.playOpenSound && window.playOpenSound(); } catch (_) {} };   // the site's own audio/open.mp3
  const cur = () => chapters[ci];
  const curItem = () => cur().items[cur().at];
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 6;
  const cx = canvas.getContext && canvas.getContext("2d", { willReadFrequently: true });
  const PAL = ["139,53,255", "22,216,255", "190,90,255", "22,150,255"];

  /* ---------- glow colour sampling (tiny 6x6 canvas) ---------- */
  const setGlow = rgb => {
    const l = glow.children; glowK ^= 1;
    l[glowK].style.setProperty("--gc", rgb);
    l[glowK].classList.add("on"); l[glowK ^ 1].classList.remove("on");
    root.style.setProperty("--gc", rgb);
  };
  const sample = src => {
    if (!cx || !src) return null;
    try {
      cx.drawImage(src, 0, 0, 6, 6);
      const d = cx.getImageData(0, 0, 6, 6).data; let r = 0, g = 0, b = 0, n = 0;
      for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; }
      r /= n; g /= n; b /= n;
      const m = Math.max(r, g, b, 1), boost = 215 / m;                  // lift dark averages so the glow stays visible
      const f = Math.min(boost, 2.6);
      return [r, g, b].map(v => Math.round(clamp(v * f, 30, 255))).join(",");
    } catch (_) { return null; }
  };

  /* ---------- slides ---------- */
  const preload = it => { if (it && it.t === "i" && !it.pre) { it.pre = new Image(); it.pre.decoding = "async"; it.pre.src = it.src; } };
  const makeSlide = (ch, idx) => {
    const it = ch.items[idx];
    const s = el("div", "ws-slide");
    const fail = el("div", "ws-fail"); i18n(fail, "Preview unavailable — open the reel", "المعاينة غير متاحة — افتح الريل"); 
    let m;
    if (it.t === "v") {
      m = document.createElement("video");
      m.muted = true; m.defaultMuted = true; m.loop = true; m.playsInline = true; m.preload = "metadata";
      m.setAttribute("muted", ""); m.setAttribute("playsinline", ""); m.setAttribute("disablepictureinpicture", ""); m.draggable = false;
      m.setAttribute("aria-label", T("Video " + (idx + 1), "فيديو " + (idx + 1)));
      m.addEventListener("loadedmetadata", () => {
        if (m.videoWidth) { it.ratio = m.videoWidth / m.videoHeight; if (ch === cur() && ch.at === idx) fit(); }
      });
      m.addEventListener("loadeddata", () => { if (ch === cur() && ch.at === idx) glowFrom(m); });
      m.addEventListener("timeupdate", () => { if (ch === cur() && ch.at === idx) tc(m.currentTime); });
      m.addEventListener("error", () => s.classList.add("bad"));
      if (it.poster) m.poster = it.poster; else if (ch.posters) m.poster = posterUrl(it);
      m.src = it.src;
    } else {
      m = document.createElement("img"); m.decoding = "async"; m.draggable = false; m.alt = T("Work " + ch.key + (idx + 1), "عمل " + ch.key + (idx + 1));
      m.addEventListener("load", () => {
        it.ratio = m.naturalWidth / m.naturalHeight;
        if (ch === cur() && ch.at === idx) { fit(); glowFrom(m); }
      });
      m.addEventListener("error", () => s.classList.add("bad"));
      m.src = it.src;
    }
    s.append(m, fail); s._m = m;
    return s;
  };
  const glowFrom = src => { const c = sample(src); if (c) setGlow(c); };
  const tc = t => { const e = $(".ws-tc", hud); if (e) e.textContent = pad(Math.floor(t / 60)) + ":" + pad(Math.floor(t % 60)); };

  const playCurrent = () => {
    const ch = cur();
    ch.els.forEach((s, k) => {
      if (!s || !s._m || s._m.tagName !== "VIDEO") return;
      if (k === ch.at && live && !document.hidden) { const p = s._m.play(); p && p.catch && p.catch(() => {}); }
      else s._m.pause();
    });
    clearInterval(sampleT);
    const it = curItem(), s = ch.els[ch.at];
    if (it && it.t === "v" && s && live) sampleT = setInterval(() => { if (s._m.readyState > 2) glowFrom(s._m); }, 900);
  };

  /* ---------- frame size: morph to the item's own ratio ---------- */
  function fit() {
    const it = curItem(); if (!it) return;
    const ch = cur();
    const r = clamp(it.ratio || DEF_RATIO[ch.i], 0.5, 2.1);
    const cs = getComputedStyle(area);
    const aw = area.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - (innerWidth > 760 ? 2 * (clamp(area.clientWidth * 0.09, 80, 150) + 72) : 0);
    const ah = area.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (aw < 40 || ah < 40) return;
    const h = Math.min(ah, aw / r), w = h * r;
    frame.style.setProperty("--fw", Math.round(w) + "px");
    frame.style.setProperty("--fh", Math.round(h) + "px");
  }

  /* ---------- labels / rail / cta ---------- */
  function paintInfo() {
    const ch = cur(), it = curItem();
    infoH.dataset.en = ch.en; infoH.dataset.ar = ch.ar; infoH.textContent = T(ch.en, ch.ar);
    infoK.dataset.en = ch.kEn; infoK.dataset.ar = ch.kAr; infoK.textContent = T(ch.kEn, ch.kAr);
    infoC.textContent = pad(ch.at + 1) + " / " + pad(ch.items.length);
    progI.style.transform = "scaleX(" + ((ch.at + 1) / Math.max(1, ch.items.length)).toFixed(3) + ")";
    prev.disabled = ch.at <= 0; next.disabled = ch.at >= ch.items.length - 1;
    const rec = $(".ws-rec", hud);
    rec.classList.toggle("still", !it || it.t !== "v");
    rec.textContent = it && it.t === "v" ? "REC" : ch.key + " · STILL";
    if (!it || it.t !== "v") tc(0), $(".ws-tc", hud).textContent = pad(ch.at + 1) + "/" + pad(ch.items.length);
    const isV = !!it && it.t === "v";
    frame.classList.toggle("is-still", !!it && it.t === "i");
    fb.hidden = !isV;
    fbT.dataset.en = "Tap to watch the full video on Facebook"; fbT.dataset.ar = "اضغط لمشاهدة الفيديو كاملاً على فيسبوك";
    fbT.textContent = T(fbT.dataset.en, fbT.dataset.ar);
    if (isV) { cta.dataset.en = "Watch full video on Facebook ↗"; cta.dataset.ar = "شاهد الفيديو كاملاً على فيسبوك ↖"; }
    else { cta.dataset.en = "View full size ⤢"; cta.dataset.ar = "عرض بالحجم الكامل ⤢"; }
    cta.textContent = T(cta.dataset.en, cta.dataset.ar);
    $$(".ws-th", rail).forEach((b, k) => b.setAttribute("aria-current", k === ch.at ? "true" : "false"));
    const act = $$(".ws-th", rail)[ch.at];
    if (act) rail.scrollTo({ left: act.offsetLeft - rail.clientWidth / 2 + act.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" });
    tabEls.forEach((b, k) => { b.setAttribute("aria-selected", k === ci ? "true" : "false"); b.tabIndex = k === ci ? 0 : -1; });
    frame.setAttribute("aria-label", T(ch.en, ch.ar) + " — " + (ch.at + 1) + "/" + ch.items.length);
  }
  const thumbRatio = it => clamp(it.ratio || 0, 0.56, 1.78) || 1;
  function buildRail() {
    const ch = cur(); rail.textContent = "";
    ch.items.forEach((it, k) => {
      const b = el("button", "ws-th" + (it.t === "v" ? " v" : "")); b.type = "button"; b.setAttribute("aria-label", T("Item ", "عنصر ") + (k + 1));
      b.style.setProperty("--r", (it.ratio ? thumbRatio(it) : DEF_RATIO[ch.i]).toFixed(3));
      if (it.t === "i") {
        const im = el("img"); im.loading = "lazy"; im.decoding = "async"; im.alt = ""; im.src = it.thumb || it.src;
        im.addEventListener("load", () => b.style.setProperty("--r", clamp(im.naturalWidth / im.naturalHeight, 0.56, 1.78).toFixed(3)));
        b.appendChild(im);
      } else {
        const pu = it.poster || it.thumbURL;
        if (pu) {
          const im = el("img"); im.alt = ""; im.decoding = "async";
          im.addEventListener("load", () => b.style.setProperty("--r", clamp(im.naturalWidth / im.naturalHeight, 0.56, 1.78).toFixed(3)));
          im.addEventListener("error", () => { im.remove(); it.poster = ""; it.thumbURL = ""; ch.posters = false; captureThumbs(ch); });   // image missing -> fall back to a frame from the video
          im.src = pu; b.appendChild(im);
        }
        b.appendChild(el("em", null, pad(k + 1)));
      }
      b.addEventListener("click", () => goItem(k, true));
      rail.appendChild(b);
    });
    captureThumbs(ch);
  }
  /* first-frame previews for video thumbnails: hidden <video> seeks to ~0.6 s, a tiny canvas keeps the frame (2 at a time, current chapter only) */
  let thumbTok = 0;
  const grab = it => new Promise(res => {
    const v = document.createElement("video"); let done = false;
    const fin = url => { if (done) return; done = true; clearTimeout(to); v.removeAttribute("src"); try { v.load(); } catch (_) {} res(url); };
    const to = setTimeout(() => fin(null), 9000);
    v.muted = true; v.playsInline = true; v.preload = "metadata"; v.crossOrigin = "anonymous";
    v.addEventListener("error", () => fin(null));
    v.addEventListener("loadedmetadata", () => {
      if (v.videoWidth) it.ratio = v.videoWidth / v.videoHeight;
      try { v.currentTime = Math.min(0.6, (v.duration || 2) / 3); } catch (_) { fin(null); }
    });
    v.addEventListener("seeked", () => {
      try {
        const h = 96, w = Math.round(h * clamp(v.videoWidth / v.videoHeight || 1, 0.56, 1.78));
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(v, 0, 0, w, h);
        fin(c.toDataURL("image/jpeg", 0.72));
      } catch (_) { fin(null); }
    });
    v.src = it.src;
  });
  /* Posters: if a .webp with the same name sits next to the video (Cinematic/cinematic0.webp), it is used for the thumbnail AND as the
     video's poster (instant first paint, nothing downloaded from the videos). Only the first video is probed; no posters -> frame capture above. */
  const POSTER_EXTS = [".jpg", ".webp", ".jpeg", ".png"];
  let posterExt = ".jpg";                                              // set to whichever extension is found next to the videos
  const posterUrl = it => it.src.replace(/\.(webm|mp4)(\?.*)?$/i, posterExt);
  const probeImg = url => new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth > 0); im.onerror = () => res(false); im.src = url; });
  const probePoster = async first => {                                 // tries the extensions in order on the first video of the chapter
    for (const ext of POSTER_EXTS) {
      const url = first.src.replace(/\.(webm|mp4)(\?.*)?$/i, ext);
      if (await probeImg(url)) { posterExt = ext; return true; }
    }
    return false;
  };
  function captureThumbs(ch) {
    const tok = ++thumbTok;
    const vids = ch.items.filter(it => it.t === "v");
    if (!vids.length) return;
    const withPosters = () => {
      ch.items.forEach((it, k) => {
        if (it.t !== "v") return;
        it.thumbURL = it.thumbURL || it.poster || posterUrl(it);
        const b = $$(".ws-th", rail)[k];
        if (b && ch === cur() && !$("img", b)) { const im = el("img"); im.alt = ""; im.decoding = "async"; im.addEventListener("load", () => b.style.setProperty("--r", clamp(im.naturalWidth / im.naturalHeight, 0.56, 1.78).toFixed(3))); im.src = it.thumbURL; b.prepend(im); }
      });
      ch.els.forEach((sl, k) => { if (sl && sl._m && sl._m.tagName === "VIDEO" && !sl._m.poster && ch.items[k]) sl._m.poster = posterUrl(ch.items[k]); });
    };
    const withCapture = () => {
      const todo = ch.items.map((it, k) => [it, k]).filter(([it]) => it.t === "v" && !it.thumbURL && !it.thumbTried);
      let idx = 0;
      const run = () => {
        if (tok !== thumbTok || idx >= todo.length) return;
        const [it, k] = todo[idx++]; it.thumbTried = true;
        grab(it).then(url => {
          if (!url) return;
          it.thumbURL = url;
          const b = $$(".ws-th", rail)[k];
          if (b && ch === cur()) {
            const im = el("img"); im.alt = ""; im.src = url; b.prepend(im);
            b.style.setProperty("--r", thumbRatio(it).toFixed(3));
          }
        }).then(() => setTimeout(run, 40));
      };
      run(); run();
    };
    const go = () => { if (tok !== thumbTok) return; ch.posters ? withPosters() : withCapture(); };
    if (vids.every(it => it.poster)) ch.posters = true;                // every video names its poster in index.html (data-poster): no probing needed
    if (ch.posters === undefined) probePoster(vids[0]).then(ok => { ch.posters = ok; go(); }); else go();
  }

  /* ---------- show an item (crossfade inside the frame) ---------- */
  function showItem(k, instant) {
    const ch = cur(); if (!ch.items.length) return;
    k = clamp(k, 0, ch.items.length - 1);
    const old = ch.els[ch.at];
    ch.at = k;
    if (!ch.els[k]) { ch.els[k] = makeSlide(ch, k); media.appendChild(ch.els[k]); }
    $$(".ws-slide", media).forEach(s => { if (s !== ch.els[k]) { s.classList.remove("on"); } });
    if (old && old !== ch.els[k]) old.classList.add("out");
    const n = ch.els[k];
    requestAnimationFrame(() => { n.classList.remove("out"); n.classList.add("on"); });
    preload(ch.items[k + 1]); preload(ch.items[k - 1]);
    fit(); paintInfo(); playCurrent();
    const g = n._m && n._m.tagName === "IMG" && n._m.complete && n._m.naturalWidth ? n._m : (n._m && n._m.readyState > 2 ? n._m : null);
    if (g) glowFrom(g); else if (!ch.items[k].glowSet) { setGlow(PAL[ch.i % PAL.length]); }
    if (instant) n.style.transition = "none", requestAnimationFrame(() => (n.style.transition = ""));
  }
  const goItem = (k, sound) => { const ch = cur(); if (k < 0 || k >= ch.items.length || k === ch.at) return; hintShown = true; root.classList.remove("hint"); if (sound !== false) sfx(); showItem(k); };

  /* ---------- chapter switch with HUD lock ---------- */
  function swapChapter(n) {
    ci = n;
    media.textContent = ""; chapters.forEach(c => (c.els = []));
    clearInterval(sampleT);
    ghostS.textContent = cur().key; ghostS.classList.remove("sw");
    buildRail();
    showItem(cur().at, true);
    chapters[ci].items.forEach(preload);
  }
  function goChapter(n, back) {
    n = clamp(n, 0, chapters.length - 1);
    if (n === ci) return;
    if (busy) { want = n; return; }
    if (reduce) { swapChapter(n); return; }
    busy = true; want = null;
    lkA.textContent = cur().key; lkB.textContent = chapters[n].key;
    wipeL.textContent = T(chapters[n].en, chapters[n].ar);
    lock.classList.toggle("back", !!back);
    lock.classList.remove("go"); void lock.offsetWidth; lock.classList.add("go");
    ghostS.classList.add("sw");
    setTimeout(() => swapChapter(n), 360);
    setTimeout(() => {
      lock.classList.remove("go"); busy = false;
      if (want != null && want !== ci) { const w = want; want = null; goChapter(w, w < ci); }
    }, 800);
  }

  /* ---------- scroll -> chapter ---------- */
  let ticking = false, navTarget = null, navT = 0;
  const endNav = () => { clearTimeout(navT); if (navTarget == null) return; navTarget = null; onScroll(); };
  ["wheel", "touchstart", "pointerdown"].forEach(ev => addEventListener(ev, e => { if (navTarget != null && !(e.target.closest && e.target.closest(".ws-tabs,.ws-tab"))) endNav(); }, { passive: true }));
  const chapterFromScroll = () => {
    const r = root.getBoundingClientRect(), span = Math.max(1, root.offsetHeight - innerHeight);
    const p = clamp(-r.top / span, 0, 0.9999);
    return Math.floor(p * chapters.length);
  };
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const r = root.getBoundingClientRect();
      const inView = r.top < innerHeight * 0.9 && r.bottom > innerHeight * 0.1;
      if (inView !== live) { live = inView; playCurrent(); if (live && !hintShown) root.classList.add("hint"); }
      if (!live) return;
      if (navTarget != null) return;                                  // a tab / arrow-key jump is travelling: don't show the chapters it flies past
      const t = chapterFromScroll();
      if (t !== ci) goChapter(t, t < ci);
    });
  };
  const scrollYTo = y => {
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo && !lenis.isStopped) { lenis.scrollTo(y, { duration: 1.3 }); return; }
    const html = document.documentElement, prevSB = html.style.scrollBehavior;
    if (reduce) { html.style.scrollBehavior = "auto"; scrollTo(0, y); html.style.scrollBehavior = prevSB; return; }
    const y0 = scrollY, d = y - y0, t0 = performance.now(), dur = Math.min(1500, 520 + Math.abs(d) * 0.22);
    let stop = false; const cancel = () => { stop = true; };
    addEventListener("wheel", cancel, { once: true, passive: true }); addEventListener("touchstart", cancel, { once: true, passive: true });
    html.style.scrollBehavior = "auto";                               // our own easing; the CSS smooth-scroll would fight every frame
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      scrollTo(0, y0 + d * e);
      if (t < 1 && !stop) requestAnimationFrame(step); else html.style.scrollBehavior = prevSB;
    };
    requestAnimationFrame(step);
  };
  const scrollToChapter = k => {
    navTarget = k; clearTimeout(navT); navT = setTimeout(endNav, 1800);   // jump straight to the chosen chapter, ignore the ones in between
    goChapter(k, k < ci);
    const top = root.getBoundingClientRect().top + scrollY, span = root.offsetHeight - innerHeight;
    scrollYTo(top + (k + 0.5) / chapters.length * span);
  };
  /* "Work" in the top bar / side menu: land exactly where the stage is pinned under the header (chapter A) */
  window.__frameWork = () => {
    scrollYTo(root.getBoundingClientRect().top + scrollY + 2);
    setTimeout(() => { try { window.__updateActiveNav && window.__updateActiveNav(); } catch (_) {} }, 450);
  };
  tabEls.forEach((b, k) => b.addEventListener("click", () => { sfx(); scrollToChapter(k); }));
  tabs.addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const d = e.key === "ArrowRight" ? 1 : -1, k = clamp(ci + d, 0, chapters.length - 1);
    tabEls[k].focus(); scrollToChapter(k); e.preventDefault();
  });

  /* ---------- input: swipe / drag / click / keys ---------- */
  let sx = 0, sy = 0, st = 0, drag = false;
  frame.addEventListener("pointerdown", e => { if (e.target.closest(".ws-nav")) return; drag = true; sx = e.clientX; sy = e.clientY; st = performance.now(); });
  const end = e => {
    if (!drag) return; drag = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) { goItem(cur().at + ((dx < 0) !== rtl() ? 1 : -1)); return; }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && performance.now() - st < 500 && !e.target.closest(".ws-nav")) tap();
  };
  frame.addEventListener("pointerup", end);
  frame.addEventListener("pointercancel", () => { drag = false; });
  frame.addEventListener("wheel", e => {                              // trackpad sideways swipe changes item; vertical still scrolls the page
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && Math.abs(e.deltaX) > 24) { e.preventDefault(); if (!frame._w) { goItem(cur().at + ((e.deltaX > 0) !== rtl() ? 1 : -1)); frame._w = 1; setTimeout(() => (frame._w = 0), 450); } }
  }, { passive: false });
  prev.addEventListener("click", () => goItem(cur().at - 1));
  next.addEventListener("click", () => goItem(cur().at + 1));
  frame.addEventListener("pointermove", e => {
    if (e.pointerType === "touch") return;
    const r = frame.getBoundingClientRect(), x = Math.max(64, Math.min(r.width - 64, e.clientX - r.left)), y = Math.max(34, Math.min(r.height - 34, e.clientY - r.top));
    zoomChip.style.setProperty("--zx", x.toFixed(0) + "px"); zoomChip.style.setProperty("--zy", y.toFixed(0) + "px");
  });
  const tap = () => {
    const it = curItem(), s = cur().els[cur().at];
    if (!it) return;
    if (it.t === "v") openFB(it); else openFull();
  };
  const openFB = it => { sfx(); window.open(it.link || "https://www.facebook.com/tiamo.mohamad/", "_blank", "noopener,noreferrer"); };
  cta.addEventListener("click", () => {
    const it = curItem(); if (!it) return;
    if (it.t === "v") openFB(it); else openFull();
  });
  fb.addEventListener("click", e => { e.stopPropagation(); const it = curItem(); if (it && it.t === "v") openFB(it); });
  fb.addEventListener("pointerdown", e => e.stopPropagation());
  document.addEventListener("keydown", e => {
    if (full.classList.contains("on")) {
      if (e.key === "Escape") closeFull(); else if (e.key === (rtl() ? "ArrowLeft" : "ArrowRight")) fullStep(1); else if (e.key === (rtl() ? "ArrowRight" : "ArrowLeft")) fullStep(-1);
      return;
    }
    if (!live || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    if (e.target.closest && e.target.closest(".ws-tabs")) return;
    const nx = rtl() ? "ArrowLeft" : "ArrowRight", pv = rtl() ? "ArrowRight" : "ArrowLeft";
    if (e.key === nx) goItem(cur().at + 1); else if (e.key === pv) goItem(cur().at - 1);
  });

  /* ---------- full view (photos) ---------- */
  function openFull() {
    const it = curItem(); if (!it || it.t !== "i") return;
    sfx(); fullImg.src = it.src; full.classList.add("on"); window.__lenis && window.__lenis.stop && window.__lenis.stop(); fx.focus();
  }
  function closeFull() { full.classList.remove("on"); window.__lenis && window.__lenis.start && window.__lenis.start(); frame.focus({ preventScroll: true }); }
  function fullStep(d) {
    const ch = cur(); let k = ch.at;
    do { k += d; } while (ch.items[k] && ch.items[k].t !== "i");
    if (!ch.items[k]) return; goItem(k, false); sfx(); fullImg.src = ch.items[k].src;
  }
  fx.addEventListener("click", closeFull); fp.addEventListener("click", () => fullStep(-1)); fn.addEventListener("click", () => fullStep(1));
  full.addEventListener("click", e => { if (e.target === full) closeFull(); });

  /* ---------- keep going when the old script discovers more photos (images/pm9.jpg ...) ---------- */
  if (window.MutationObserver) {
    let mt = 0;
    const mo = new MutationObserver(() => {
      clearTimeout(mt);
      mt = setTimeout(() => {
        chapters.forEach(ch => { const b = ch.items.length; harvest(ch); if (ch.items.length !== b && ch === cur()) { buildRail(); paintInfo(); } });
      }, 250);
    });
    cards.forEach(c => { const tr = $(".slides", c); tr && mo.observe(tr, { childList: true }); });
  }

  /* ---------- language switch: refresh dynamic labels ---------- */
  new MutationObserver(() => { paintInfo(); wipeL.textContent = ""; }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  /* ---------- mount ---------- */
  grid.after(root);
  document.body.appendChild(full);
  work.classList.add("ws-on");
  new ResizeObserver(() => fit()).observe(area);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { fit(); onScroll(); });
  document.addEventListener("visibilitychange", playCurrent);
  swapChapter(0);
  onScroll();
  window.__wsDebug = { go: k => goChapter(k, k < ci), item: goItem, get state() { return { ci, at: cur().at, live, busy }; } };
})();
