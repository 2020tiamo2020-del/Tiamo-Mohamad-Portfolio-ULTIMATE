/* =====================================================================
   SERVICES STAGE — Synapse-style scene for 02 / SERVICES
   - the 12 services are read from the old .service-grid (kept as data + fallback)
   - one sticky scene; the page scroll scrubs a float "p" (0..N-1) that drives
     a 3D card carousel and a giant headline sliding sideways behind it
   - p is eased (critically damped) and, once scrolling stops, settles on the
     nearest card ("magnet")
   - arrows / ticks / swipe / click all just scroll the page to that card, so the
     scroll position stays the single source of truth
   - transforms + opacity only; the rAF loop runs only while the scene is visible
   - the portrait card from About is card #0 of the carousel: while About scrolls away the real card
     is swapped for a fixed "traveler" that descends (3D swing) into the centre slot, the other cards
     fan out around it and the giant headline slides in (Synapse hero -> carousel hand-off)
   ===================================================================== */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = n => String(n).padStart(2, "0");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAr = () => document.documentElement.lang === "ar";
  const rtl = () => getComputedStyle(document.documentElement).direction === "rtl";
  const sfx = () => { try { window.playOpenSound && window.playOpenSound(); } catch (_) {} };

  const sec = $("#services");
  const grid = sec && $(".service-grid", sec);
  if (!sec || !grid) return;
  const arts = $$(":scope > article", grid);
  if (arts.length < 3) return;

  /* ---------- data ---------- */
  const HUES = [268, 205, 325, 178, 285, 218, 342, 190, 258, 298, 208, 312];
  const data = arts.map((a, i) => {
    const h3 = $("h3", a), p = $("p", a), ic = $(":scope > span", a), sm = $("small", a);
    return {
      ico: ic ? ic.innerHTML : "✦", num: sm ? sm.textContent.trim() : pad(i + 1),
      tEn: (h3 && (h3.dataset.en || h3.textContent)) || "", tAr: (h3 && (h3.dataset.ar || h3.textContent)) || "",
      dEn: (p && (p.dataset.en || p.textContent)) || "", dAr: (p && (p.dataset.ar || p.textContent)) || "",
      hue: HUES[i % HUES.length]
    };
  });
  /* the About portrait: becomes card #0 (only if it exists on this page) */
  const aboutPhoto = $("#about .about-photo");
  const pic = aboutPhoto && $("picture", aboutPhoto);
  const me = !!(pic && $("img", pic));
  const svcCount = data.length;
  if (me) {
    const nb = $(".about-cap b", aboutPhoto);
    data.unshift({ me: true, ico: "", num: "00", tEn: (nb && nb.dataset.en) || "Tiamo Mohamad", tAr: (nb && nb.dataset.ar) || "تيامو محمد", dEn: "", dAr: "", hue: 268 });
  }
  const off = me ? 1 : 0;                                              // services start at index `off`
  const N = data.length;
  const h2 = $(".section-title h2", sec);
  const headEn = (h2 && h2.dataset.en) || "What I <em>create.</em>";
  const headAr = (h2 && h2.dataset.ar) || "ما <em>أُبدعه.</em>";

  /* ---------- DOM ---------- */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const i18n = (e, en, ar) => { e.dataset.en = en; e.dataset.ar = ar; e.innerHTML = isAr() ? ar : en; return e; };

  const root = el("div", "sv"); root.id = "sv"; root.style.setProperty("--n", N);
  root.setAttribute("role", "region"); root.setAttribute("aria-roledescription", "carousel"); root.setAttribute("aria-label", "Services");
  const pin = el("div", "sv-pin");
  const glow = el("div", "sv-glow"); glow.setAttribute("aria-hidden", "true");
  const tech = el("div", "sv-grid"); tech.setAttribute("aria-hidden", "true");
  const kick = i18n(el("div", "sv-kick"), "02 / SERVICES", "02 / الخدمات");

  const text = el("div", "sv-text"); text.setAttribute("aria-hidden", "true");
  const row = el("div", "sv-row");
  for (let k = 0; k < 4; k++) row.appendChild(i18n(el("span", "sv-seg"), headEn, headAr));
  text.appendChild(row);

  const scene = el("div", "sv-scene");
  const group = el("div", "sv-group");
  const floor = el("i", "sv-floor"); floor.setAttribute("aria-hidden", "true");
  /* a clone of the real portrait card (frame, photo, caption pill) that keeps every look rule of .about-photo */
  const cloneMe = () => {
    const c = aboutPhoto.cloneNode(true);
    c.removeAttribute("id"); c.classList.remove("ab3d-on", "sv-away"); c.classList.add("show");
    $$(".ab3d", c).forEach(n => n.remove());
    $$("[loading]", c).forEach(n => n.removeAttribute("loading"));
    c.setAttribute("aria-hidden", "true"); c.style.cssText = "";
    const w = el("div", "sv-me-in"); w.appendChild(c); return w;
  };
  const cards = data.map((d, i) => {
    const c = el("article", "sv-card" + (d.me ? " sv-me" : "")); c.style.setProperty("--h", d.hue); c.setAttribute("aria-hidden", "true");
    if (d.me) { c.appendChild(cloneMe()); c._i = i; c._v = true; group.appendChild(c); return c; }
    const top = el("div", "sv-top"); const ic = el("span", "sv-ico", d.ico); const nm = el("span", "sv-num", d.num + " / " + pad(svcCount));
    top.append(ic, nm);
    const orb = el("i", "sv-orb"); orb.setAttribute("aria-hidden", "true");
    const body = el("div", "sv-body"); const h3 = i18n(el("h3"), d.tEn, d.tAr); const p = i18n(el("p"), d.dEn, d.dAr);
    body.append(h3, p);
    const sc = (window.__svScenes || [])[i - off];                      // animated mini-scene for this service (services-scenes.js)
    if (sc) {
      const art = el("div", "sv-art sc" + (i - off + 1), sc.html); art.dataset.p = sc.p; art.dataset.f = sc.f; art.setAttribute("aria-hidden", "true");
      c.classList.add("has-art"); c.append(art, top, body);
      const v = $("video[data-src]", art);
      if (v) v.addEventListener("loadeddata", () => art.classList.add("ok"));
    } else c.append(orb, top, body);
    c._i = i; c._v = true;
    group.appendChild(c); return c;
  });
  group.prepend(floor);
  scene.appendChild(group);

  const foot = el("div", "sv-foot");
  const meta = el("div", "sv-meta"); const cnt = el("b"); const of = el("i"); of.style.fontStyle = "normal"; of.textContent = "/ " + pad(svcCount); const nameEl = el("span");
  meta.append(cnt, of, nameEl);
  const ticks = el("div", "sv-ticks");
  const tickEls = data.map((d, i) => { const b = el("button", "sv-tick" + (d.me ? " me" : "")); b.type = "button"; ticks.appendChild(b); b.addEventListener("click", () => goIndex(i, true)); return b; });
  const cta = el("a", "sv-cta"); cta.href = "#brief";
  cta.innerHTML = '<span></span><b aria-hidden="true">→</b>'; const ctaT = $("span", cta);
  i18n(ctaT, "Start a project", "ابدأ مشروعك");
  foot.append(meta, ticks, cta);
  const live = el("div", "sv-live"); live.setAttribute("aria-live", "polite");
  pin.append(glow, tech, kick, text, scene, foot, live);
  root.appendChild(pin);

  /* ---------- traveler: the card that flies from About into the carousel ---------- */
  const travelOn = me && !reduce;
  let tvWrap = null, tv = null;
  if (travelOn) {
    tvWrap = el("div", "sv-tv"); tvWrap.setAttribute("aria-hidden", "true");
    tv = el("div", "sv-tv-card"); tv.appendChild(cloneMe()); tvWrap.appendChild(tv);
    document.body.appendChild(tvWrap);
  }
  const GEOM = { fl: 4, fb: 4, fr: 0.14, rad: 16 };                    // frame offsets of the real card (read from its CSS)
  const readGeom = () => {
    if (!me) return;
    try {
      const cs = getComputedStyle(pic, "::before"), H = pic.getBoundingClientRect().height;
      const t = parseFloat(cs.top), l = parseFloat(cs.left), b = parseFloat(cs.bottom), rd = parseFloat(cs.borderTopLeftRadius);
      if (isFinite(t) && H > 20) GEOM.fr = clamp(t / H, 0, 0.4);
      if (isFinite(l)) GEOM.fl = Math.abs(l);
      if (isFinite(b)) GEOM.fb = Math.abs(b);
      if (isFinite(rd)) GEOM.rad = rd;
    } catch (_) {}
    [root, tvWrap].forEach(n => { if (!n) return; n.style.setProperty("--fl", GEOM.fl + "px"); n.style.setProperty("--fb", GEOM.fb + "px"); n.style.setProperty("--fr", GEOM.fr.toFixed(4)); n.style.setProperty("--frad", GEOM.rad + "px"); });
  };
  let S0 = null, tvShown = false;
  const ease3 = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  /* returns q: 0 = card still sits in About, 1 = card has landed in the carousel */
  function travel(r) {
    if (!travelOn) return 1;
    const pr = pic.getBoundingClientRect();
    if (pr.width < 10 || pr.height < 10) { if (tvShown) { tvWrap.classList.remove("on"); tvShown = false; } aboutPhoto.classList.remove("sv-away"); return 1; }
    const vh = innerHeight, y0 = vh * 0.12;
    const dist = r.top - pr.top;
    const q = clamp((y0 - pr.top) / Math.max(1, y0 + dist), 0, 1);       // 0 when the card top sits 12% down the screen, 1 when the scene pins
    if (q <= 0) { S0 = { l: pr.left, w: pr.width, h: pr.height }; if (tvShown) { tvWrap.classList.remove("on"); tvShown = false; } aboutPhoto.classList.remove("sv-away"); return 0; }
    if (q >= 1) { if (tvShown) { tvWrap.classList.remove("on"); tvShown = false; } return 1; }
    if (!S0) S0 = { l: pr.left, w: pr.width, h: pr.height };
    if (!tvShown) { tvWrap.classList.add("on"); tvShown = true; }
    aboutPhoto.classList.add("sv-away");
    const { fl, fb, fr } = GEOM, d = dir();
    const a = { l: S0.l - fl, t: y0 + fr * S0.h, w: S0.w + 2 * fl, h: S0.h * (1 - fr) + fb };
    const sr = scene.getBoundingClientRect(), pn = pin.getBoundingClientRect();
    const eh = cards[0].offsetHeight * 1.06, ew = cards[0].offsetWidth * 1.06;
    const b = { w: ew, h: eh, l: (innerWidth - ew) / 2, t: (sr.top - pn.top) + (sr.height - eh) / 2 };
    const e = ease3(q), sw = Math.sin(Math.PI * q);
    tv.style.width = lerp(a.w, b.w, e).toFixed(1) + "px";
    tv.style.height = lerp(a.h, b.h, e).toFixed(1) + "px";
    tv.style.transform = `translate3d(${lerp(a.l, b.l, e).toFixed(1)}px,${lerp(a.t, b.t, e).toFixed(1)}px,${(-sw * 140).toFixed(1)}px) rotateX(${(sw * -9).toFixed(2)}deg) rotateY(${(sw * 32 * d).toFixed(2)}deg) rotateZ(${(sw * -3.5 * d).toFixed(2)}deg)`;
    return q;
  }

  /* ---------- state ---------- */
  let cw = 240, S = 200, segW = 1, DEPTH = 150, ROT = 34;
  let cur = 0, pS = 0, dragOff = 0, dragging = false, lastScroll = 0, last = 0, raf = 0, inView = false, activeIdx = -1;
  let px = 0, py = 0, tpx = 0, tpy = 0, vis = 0;

  const measure = () => {
    const mob = innerWidth <= 760;
    cw = cards[0].offsetWidth || 240;
    S = cw * (mob ? 0.9 : 0.9);
    DEPTH = mob ? 90 : 150; ROT = mob ? 28 : 34; vis = mob ? 2.3 : 3.2;
    const sg = $(".sv-seg", row); segW = sg ? sg.getBoundingClientRect().width : 1;
  };
  const dir = () => (rtl() ? -1 : 1);

  /* ---------- scroll <-> index ---------- */
  const rect = () => root.getBoundingClientRect();
  const scrollP = r => {
    const span = Math.max(1, root.offsetHeight - innerHeight);
    const t = clamp(-r.top / span, 0, 1);
    return clamp((t - 0.04) / 0.92, 0, 1) * (N - 1);                  // small dwell on the first and last card
  };
  const yFor = k => { const top = rect().top + scrollY, span = root.offsetHeight - innerHeight; return top + (0.04 + 0.92 * (k / (N - 1))) * span; };
  const scrollYTo = y => {
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo && !lenis.isStopped) { lenis.scrollTo(y, { duration: 1.2 }); return; }
    const html = document.documentElement, prevSB = html.style.scrollBehavior;
    if (reduce) { html.style.scrollBehavior = "auto"; scrollTo(0, y); html.style.scrollBehavior = prevSB; return; }
    const y0 = scrollY, d = y - y0, t0 = performance.now(), dur = Math.min(1400, 480 + Math.abs(d) * 0.2);
    let stop = false; const cancel = () => { stop = true; };
    addEventListener("wheel", cancel, { once: true, passive: true }); addEventListener("touchstart", cancel, { once: true, passive: true });
    html.style.scrollBehavior = "auto";
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      scrollTo(0, y0 + d * e);
      if (t < 1 && !stop) requestAnimationFrame(step); else html.style.scrollBehavior = prevSB;
    };
    requestAnimationFrame(step);
  };
  let reqIdx = 0, reqAt = 0;                                          // quick repeated key presses add up instead of all starting from the same card
  const baseIdx = () => (performance.now() - reqAt < 1100 ? reqIdx : Math.round(pS));
  function goIndex(k, sound) {
    k = clamp(k, 0, N - 1);
    if (sound && k !== baseIdx()) sfx();
    reqIdx = k; reqAt = performance.now();
    scrollYTo(yFor(k)); kick0();
  }
  const kick0 = () => { lastScroll = performance.now(); loop(); };

  /* ---------- render ---------- */
  const eo = t => 1 - Math.pow(1 - t, 3);
  function place(p, enter, leave, q) {
    const rv = (() => { const t = clamp((q - 0.55) / 0.45, 0, 1); return t * t * (3 - 2 * t); })();   // 0..1 once the card is almost home
    const d = dir();
    for (let i = 0; i < N; i++) {
      const c = cards[i], o = i - p, a = Math.abs(o);
      if (a > vis || (me && i === 0 && q < 0.999)) { if (c._v) { c.style.visibility = "hidden"; c._v = false; } continue; }
      if (!c._v) { c.style.visibility = ""; c._v = true; }
      const sg = o < 0 ? -1 : 1;
      const x = (a <= 1 ? a * S : S + (a - 1) * S * 0.74) * sg * d * (i === 0 && me ? 1 : 0.2 + 0.8 * rv);   // the other cards fan out from the landed card
      const ry = sg * d * Math.min(a, 1.6) / 1.6 * ROT * -1;
      const z = -Math.min(a, 3) * DEPTH;
      const s = 1 - Math.min(a, 2.2) * 0.075 + Math.max(0, 1 - a) * 0.06;
      const fade = a > vis - 0.8 ? clamp((vis - a) / 0.8, 0, 1) : 1;
      c.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      c.style.opacity = (fade * (i === 0 && me ? 1 : rv)).toFixed(3);
      c.style.setProperty("--dim", (Math.min(a, 2.4) * 0.2).toFixed(3));
      c.style.zIndex = String(100 - Math.round(a * 10));
    }
    // hue follows the position between neighbouring cards
    const f = Math.floor(p), g = Math.min(N - 1, f + 1), t = p - f;
    let h0 = data[f].hue, h1 = data[g].hue;
    if (h1 - h0 > 180) h1 -= 360; else if (h0 - h1 > 180) h1 += 360;
    root.style.setProperty("--hue", ((h0 + (h1 - h0) * t) % 360 + 360) % 360 + "");
    // giant headline slides sideways: one card = ~55% of the viewport, wraps seamlessly
    const m = ((p * innerWidth * 0.55) % Math.max(1, segW));
    row.style.transform = `translate3d(${(reduce ? 0 : (-m + (1 - rv) * innerWidth * 0.3) * d).toFixed(1)}px,0,0)`;   // slides in as the card lands
    text.style.opacity = (enter * rv * (1 - leave * 0.75)).toFixed(3);
    glow.style.opacity = (0.15 + 0.85 * rv).toFixed(3); foot.style.opacity = rv.toFixed(3); kick.style.opacity = rv.toFixed(3);
    // group: parallax with the pointer + intro rise / outro dissolve
    const iy = (1 - enter) * innerHeight * 0.16 - leave * innerHeight * 0.05;
    const sc = (0.9 + 0.1 * enter) * (1 - leave * 0.06);
    group.style.transform = `translate3d(0,${iy.toFixed(1)}px,0) scale(${sc.toFixed(4)}) rotateX(${(py * -3).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    group.style.opacity = (enter * (1 - leave * 0.55)).toFixed(3);
  }
  /* mini-scenes: every scene rests on its "poster" frame; only the card in the middle plays (from the start) */
  const artOf = c => c.querySelector(".sv-art");
  const anims = a => (a._an || (a._an = a.getAnimations({ subtree: true })));
  const freeze = a => { if (!a) return; const f = +a.dataset.f || 0; anims(a).forEach(an => { try { an.pause(); an.currentTime = f; } catch (_) {} }); };
  const play = a => { if (!a || reduce) return; anims(a).forEach(an => { try { an.currentTime = 0; an.play(); } catch (_) {} }); };
  let playing = -1;
  function setScene(k) {
    if (k === playing) return;
    if (playing >= 0 && cards[playing]) freeze(artOf(cards[playing]));
    playing = k;
    if (cards[k]) play(artOf(cards[k]));
  }
  function syncVideos(k) {                                             // only neighbours of the active card hold a video source; only the active one plays
    cards.forEach((c, i) => {
      const v = $("video[data-src]", c); if (!v) return;
      const near = Math.abs(i - k) <= 1, art = artOf(c);
      if (near && !v.getAttribute("src")) { v.src = v.dataset.src; try { v.load(); } catch (_) {} }
      else if (!near && v.getAttribute("src")) { v.pause(); v.removeAttribute("src"); try { v.load(); } catch (_) {} art.classList.remove("ok"); }
      if (i === k && !document.hidden && !reduce) { const pr = v.play(); pr && pr.catch && pr.catch(() => {}); } else v.pause();
    });
  }
  function paintMeta(k) {
    activeIdx = k;
    setScene(k); syncVideos(k);
    cards.forEach((c, i) => { const on = i === k; c.classList.toggle("on", on); on ? c.removeAttribute("aria-hidden") : c.setAttribute("aria-hidden", "true"); });
    tickEls.forEach((b, i) => { b.setAttribute("aria-current", i === k ? "true" : "false"); b.setAttribute("aria-label", data[i].me ? (isAr() ? "البطاقة الشخصية" : "Profile") : (isAr() ? "الخدمة " : "Service ") + (i + 1 - off)); });
    cnt.textContent = data[k].me ? "00" : pad(k + 1 - off);
    const nm = isAr() ? data[k].tAr : data[k].tEn;
    nameEl.innerHTML = nm; live.textContent = (data[k].me ? "" : (isAr() ? "الخدمة " : "Service ") + (k + 1 - off) + " / " + svcCount + ": ") + nameEl.textContent;
    const act = tickEls[k];
    if (act) ticks.scrollTo({ left: act.offsetLeft - ticks.clientWidth / 2 + act.offsetWidth / 2, behavior: "auto" });
  }

  /* ---------- loop ---------- */
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.12, (now - last) / 1000 || 0.016); last = now;
    const r = rect();
    const q = reduce ? 1 : travel(r);
    if (r.top >= innerHeight * 1.02 && q <= 0) { if (inView) raf = requestAnimationFrame(frame); return; }   // scene still below the fold, card still in About
    pS = scrollP(r);
    const idle = now - lastScroll > 170 && !dragging;                  // scrolling stopped -> settle on the nearest card
    const target = dragging ? clamp(pS + dragOff, 0, N - 1) : idle ? Math.round(pS) : pS;
    const k = reduce ? 1 : 1 - Math.exp(-dt * (dragging ? 20 : 7.5));
    cur += (target - cur) * k;
    px += (tpx - px) * (reduce ? 0 : 0.08); py += (tpy - py) * (reduce ? 0 : 0.08);
    const enter = reduce ? 1 : eo(clamp((innerHeight - r.top) / (innerHeight * 0.85), 0, 1));
    const leave = reduce ? 0 : clamp(1 - r.bottom / innerHeight, 0, 1);
    place(cur, enter, leave, q);
    const a = clamp(Math.round(cur), 0, N - 1);
    if (a !== activeIdx) paintMeta(a);
    if (inView) raf = requestAnimationFrame(frame);
  }
  function loop() { if (!raf && inView) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ---------- input ---------- */
  pin.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    tpx = (e.clientX / innerWidth - 0.5) * 2; tpy = (e.clientY / innerHeight - 0.5) * 2;
  });
  pin.addEventListener("pointerleave", () => { tpx = tpy = 0; });
  let sx = 0, sy = 0, st = 0, sid = null, down = false;
  scene.addEventListener("pointerdown", e => { if (e.button > 0) return; down = true; sx = e.clientX; sy = e.clientY; st = performance.now(); sid = e.pointerId; });
  scene.addEventListener("pointermove", e => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.1) { dragging = true; try { scene.setPointerCapture(sid); } catch (_) {} loop(); }
    if (dragging) dragOff = -dx / (S * dir());
  });
  const endDrag = e => {
    if (!down) return; down = false;
    const dx = e.clientX - sx, dy = e.clientY - sy, dt = Math.max(1, performance.now() - st);
    if (dragging) {
      const flick = Math.abs(dx / dt) > 0.45 ? (dx < 0 ? 1 : -1) * dir() : 0;      // a quick flick moves one card further
      const k = clamp(Math.round(pS + dragOff + flick * 0.55), 0, N - 1);
      dragging = false; dragOff = 0; goIndex(k, true); return;
    }
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8 && dt < 500) {
      const c = e.target.closest && e.target.closest(".sv-card");
      if (c && c._i !== activeIdx) goIndex(c._i, true);
    }
  };
  scene.addEventListener("pointerup", endDrag);
  scene.addEventListener("pointercancel", () => { down = false; dragging = false; dragOff = 0; });
  document.addEventListener("keydown", e => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    const r = rect();
    if (!(r.top <= innerHeight * 0.3 && r.bottom >= innerHeight * 0.7)) return;       // only while the scene is pinned
    const nx = rtl() ? "ArrowLeft" : "ArrowRight", pv = rtl() ? "ArrowRight" : "ArrowLeft";
    if (e.key === nx) { goIndex(baseIdx() + 1, true); }
    else if (e.key === pv) { goIndex(baseIdx() - 1, true); }
  });
  cta.addEventListener("click", e => {
    e.preventDefault(); sfx();
    if (typeof window.__frameSection === "function") window.__frameSection("brief");
    else { const b = document.getElementById("brief"); b && b.scrollIntoView({ behavior: "smooth" }); }
  });
  addEventListener("scroll", () => { lastScroll = performance.now(); loop(); }, { passive: true });

  /* ---------- "Services" in the nav / side rail: land with the scene pinned under the header ---------- */
  window.__frameServices = () => {
    scrollYTo(rect().top + scrollY + 2);
    setTimeout(() => { try { window.__updateActiveNav && window.__updateActiveNav(); } catch (_) {} }, 450);
  };

  /* ---------- lifecycle ---------- */
  const relayout = () => { measure(); readGeom(); loop(); };
  addEventListener("resize", relayout);
  new MutationObserver(() => { setTimeout(() => { measure(); paintMeta(activeIdx < 0 ? 0 : activeIdx); }, 120); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { inView = es[0].isIntersecting; if (inView) loop(); }, { rootMargin: "20% 0px 140% 0px" }).observe(root);   // starts early: the card leaves About before the scene is on screen
  } else inView = true;

  grid.after(root);
  sec.classList.add("sv-on");
  cards.forEach(c => freeze(artOf(c)));                                // every scene starts on its poster frame
  document.addEventListener("visibilitychange", () => { if (activeIdx >= 0) syncVideos(activeIdx); });
  measure(); readGeom();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  paintMeta(0);
  const r0 = rect(); cur = scrollP(r0);
  place(cur, 1, 0, me && !reduce ? 0 : 1);
  window.__svDebug = { go: goIndex, get state() { return { cur: +cur.toFixed(2), pS: +pS.toFixed(2), active: activeIdx, inView }; } };
})();
