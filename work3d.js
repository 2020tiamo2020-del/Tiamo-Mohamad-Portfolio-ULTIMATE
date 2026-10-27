/* ============================================================================
   03 / SELECTED WORK  -  WebGL "Helix Gallery" (Three.js r128)
   OUTSIDE : you look into a glass drum - every work is a panel on a rising spiral.
   INSIDE  : "Enter" flies the camera to the axis; you climb the spiral surrounded by the work.
   The 4 original gallery cards stay in the DOM (hidden) as the data source, the lightbox
   trigger and the fallback: if WebGL / Three.js fails, the old grid comes back untouched.
   Tuning: RISE, GAP, RANGE, AUTO_MS below.
   ========================================================================== */
(() => {
  "use strict";
  const D = document, H = D.documentElement, work = D.getElementById("work");
  if (!work || !H.classList.contains("w3d")) return;
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const RISE = 2.05, GAP = 0.38, RANGE = 8, AUTO_MS = 3800, TAU = Math.PI * 2;
  const CATS = [
    { en: "Photo Manipulation", ar: "دمج وتعديل الصور", asp: 0.8 },
    { en: "Cinematic Reels", ar: "ريلز سينمائية", asp: 0.5625 },
    { en: "Advertising & Design", ar: "إعلانات وتصميم", asp: 1.5 },
    { en: "VFX & Creative Motion", ar: "VFX والحركة الإبداعية", asp: 1.7778 }
  ];
  const TX = {
    all: ["All", "الكل"], enter: ["Enter the gallery", "ادخل المعرض"], exit: ["Exit", "خروج"],
    view: ["View", "عرض"], watch: ["Watch reel ↗", "شاهد الريل ↖"], loading: ["Loading the gallery…", "جاري تحميل المعرض…"],
    hOut: ["Drag to turn · click a work to go in", "اسحب للتدوير · اضغط على عمل للدخول"],
    hIn: ["Drag or scroll to climb · ← → keys · Esc to exit", "اسحب أو مرّر للصعود · الأسهم · Esc للخروج"]
  };
  const ar = () => H.lang === "ar", t = k => TX[k][ar() ? 1 : 0], cn = c => CATS[c][ar() ? "ar" : "en"];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const el = (tag, cls, html) => { const e = D.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };

  /* ---------- stage skeleton (created at once so the page height never jumps) ---------- */
  const slot = el("div", "w3d-slot"), wrap = el("div", "w3d is-loading");
  wrap.tabIndex = 0; wrap.setAttribute("data-lenis-prevent", ""); wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", "3D gallery");
  const cv = el("canvas"); cv.setAttribute("aria-hidden", "true");
  const chips = el("div", "w3d-chips"), modeBtn = el("button", "w3d-mode");
  const top = el("div", "w3d-top"); top.append(chips, modeBtn);
  const nTxt = el("b", "w3d-n"), tTxt = el("span", "w3d-t"), actBtn = el("button", "w3d-act");
  const cap = el("div", "w3d-cap"); cap.append(nTxt, tTxt);
  const bot = el("div", "w3d-bot"); bot.append(cap, actBtn);
  const hint = el("div", "w3d-hint"), load = el("div", "w3d-load");
  const bPrev = el("button", "w3d-arrow prev", "‹"), bNext = el("button", "w3d-arrow next", "›");
  bPrev.setAttribute("aria-label", "Previous"); bNext.setAttribute("aria-label", "Next");
  [modeBtn, actBtn].forEach(b => b.type = "button"); [bPrev, bNext].forEach(b => b.type = "button");
  wrap.append(cv, top, bPrev, bNext, bot, hint, load); slot.appendChild(wrap);
  const grid = work.querySelector(".gallery-grid");
  grid ? grid.after(slot) : work.appendChild(slot);
  const fail = () => { H.classList.remove("w3d"); H.classList.add("w3d-failed"); slot.remove(); };

  /* ---------- lazy: Three.js is fetched only when the section is near the screen ---------- */
  let started = false;
  const boot = () => {
    if (started) return; started = true;
    if (window.THREE) return init();
    const s = el("script"); s.src = THREE_URL; s.crossOrigin = "anonymous";
    const to = setTimeout(fail, 15000);
    s.onload = () => { clearTimeout(to); try { init(); } catch (e) { console.warn("[work3d]", e); fail(); } };
    s.onerror = () => { clearTimeout(to); fail(); };
    D.head.appendChild(s);
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: "1400px 0px" });
    io.observe(slot);
  } else boot();

  function init() {
    const T = window.THREE;
    let renderer;
    try { renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return fail(); }
    const small = matchMedia("(max-width:760px)").matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    const aniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(42, 1, 0.1, 80);
    const geo = new T.PlaneGeometry(1, 1), blank = new T.DataTexture(new Uint8Array([12, 10, 20, 255]), 1, 1, T.RGBAFormat); blank.needsUpdate = true;

    /* ---------- panel shader: rounded corners, vignette, moving sheen, glowing rim ---------- */
    const VS = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
    const FS = `uniform sampler2D uTex;uniform float uRd,uAsp,uF,uH,uT,uA,uDim,uSd;varying vec2 vUv;
float sdb(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
void main(){
 vec2 p=(vUv-.5)*vec2(uAsp,1.);float d=sdb(p,vec2(uAsp,1.)*.5,.045);
 float a=1.-smoothstep(-.004,.004,d);if(a<.01)discard;
 vec3 c=texture2D(uTex,vUv).rgb;
 vec3 ph=mix(vec3(.05,.04,.1),vec3(.14,.09,.24),vUv.y+.18*sin(uT*.9+uSd));
 c=mix(ph,c,uRd);
 c*=mix(uDim,1.,uF)*(1.+.14*uH);
 c*=.8+.2*smoothstep(1.1,.2,length(vUv-.5)*1.25);
 float sh=smoothstep(0.,.5,1.-abs(fract(vUv.x*.7+vUv.y*.5-uT*.16+uSd)-.5)*5.);
 c+=vec3(.5,.72,1.)*sh*.07*uF;
 float rim=smoothstep(-.012,-.002,d)*(.22+.78*uF);
 c=mix(c,vec3(.5,.82,1.),rim*(.3+.45*uH));
 gl_FragColor=vec4(c,a*uA);}`;

    /* ---------- state ---------- */
    let items = [], vis = [], filter = -1, R = 5, Rc = 5, pos = 0, tp = 0, k = 0, kT = 0, fi = -1;
    let inside = false, running = false, last = 0, T0 = performance.now(), hov = null, drag = null, idleAt = 0, dir = 1, lastAuto = 0;
    const mouse = new T.Vector2(9, 9), ray = new T.Raycaster(), sm = { x: 0, y: 0 };

    /* ---------- dust ---------- */
    const dn = small ? 260 : 620, dp = new Float32Array(dn * 3);
    for (let i = 0; i < dn; i++) { const a = Math.random() * TAU, r = 1 + Math.random() * 9; dp[i * 3] = Math.sin(a) * r; dp[i * 3 + 1] = (Math.random() - 0.3) * 18; dp[i * 3 + 2] = Math.cos(a) * r; }
    const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(dp, 3));
    const dust = new T.Points(dg, new T.PointsMaterial({ size: 0.04, color: 0x9fe8ff, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
    scene.add(dust);

    /* ---------- items ---------- */
    const slotSize = a => { let h = a < 1 ? 1.6 : 1.35, w = h * a; if (w > 2.3) { w = 2.3; h = w / a; } return [w, h]; };
    function collect() {
      const out = [];
      work.querySelectorAll(".gallery-card").forEach((card, c) => {
        if (c > 3) return;
        card.querySelectorAll(".slides>figure").forEach(fig => {
          const v = fig.querySelector("video"), a = fig.querySelector("a"), b = fig.querySelector(".media-open");
          if (v) { const s = v.dataset.src || v.getAttribute("src"); s && out.push({ key: s, cat: c, type: "v", src: s, href: a && a.href, asp: +v.dataset.ratio || CATS[c].asp }); }
          else if (b) { const im = fig.querySelector("img"), s = b.dataset.full || (im && im.getAttribute("src")); s && out.push({ key: s, cat: c, type: "i", src: s, btn: b, asp: CATS[c].asp }); }
        });
      });
      return out;
    }
    function make(it) {
      const [w, h] = slotSize(it.asp);
      Object.assign(it, { w, h, fw: w, fh: h, ph: 0, phT: 0, a: 0, aT: 1, f: 0, hv: 0, rd: 0, rdT: 0, st: 0, born: performance.now(), sd: Math.random() * 6 });
      it.mat = new T.ShaderMaterial({
        vertexShader: VS, fragmentShader: FS, transparent: true,
        uniforms: { uTex: { value: blank }, uRd: { value: 0 }, uAsp: { value: w / h }, uF: { value: 0 }, uH: { value: 0 }, uT: { value: 0 }, uA: { value: 0 }, uDim: { value: 0.6 }, uSd: { value: it.sd } }
      });
      it.mesh = new T.Mesh(geo, it.mat); it.mesh.visible = false; it.mesh.userData.it = it; scene.add(it.mesh);
      return it;
    }
    function fit(it, a) {
      if (a > it.w / it.h) { it.fw = it.w; it.fh = it.w / a; } else { it.fh = it.h; it.fw = it.h * a; }
      it.mat.uniforms.uAsp.value = it.fw / it.fh;
    }
    function setTex(it, tex, w, h) {
      if (it.tex && it.tex !== tex) it.tex.dispose();
      it.tex = tex; it.mat.uniforms.uTex.value = tex; it.rdT = 1; if (w && h) fit(it, w / h);
    }
    function drop(it) {
      if (it.tex) { it.tex.dispose(); it.tex = null; }
      it.mat.uniforms.uTex.value = blank; it.rdT = 0; it.rd = 0;
      if (it.v) { it.v.pause(); it.v.removeAttribute("src"); it.v.load(); it.v = null; }
      it.st = 0;
    }
    function loadImg(it) {
      it.st = 1;
      new T.TextureLoader().load(it.src, tx => {
        if (it.st !== 1) { tx.dispose(); return; }
        tx.anisotropy = aniso; tx.minFilter = T.LinearMipmapLinearFilter; it.st = 2;
        setTex(it, tx, tx.image.width, tx.image.height);
      }, undefined, () => { it.st = -1; it.dead = true; sync(true); });
    }
    function startVid(it) {
      const v = D.createElement("video"); v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("playsinline", ""); v.setAttribute("muted", "");
      v.src = v.canPlayType("video/webm") ? it.src : it.src.replace(/\.webm(\?.*)?$/i, ".mp4");
      it.v = v; it.st = 1;
      v.addEventListener("loadeddata", () => { if (it.v !== v) return; const tx = new T.VideoTexture(v); tx.minFilter = tx.magFilter = T.LinearFilter; tx.generateMipmaps = false; it.st = 2; setTex(it, tx, v.videoWidth, v.videoHeight); }, { once: true });
      v.addEventListener("error", () => { if (it.v === v) it.st = -1; }, { once: true });
    }

    /* ---------- layout: every work sits on one rising spiral (natural proportions kept) ---------- */
    function layout() {
      vis = items.filter(i => filter < 0 || i.cat === filter);
      let sum = 0; vis.forEach(i => sum += i.w + GAP);
      R = clamp(sum / (TAU * 1.35), 3.4, 7.2);
      let acc = 0;
      vis.forEach((i, n) => { if (n) acc += (vis[n - 1].w + i.w) / 2 + GAP; i.phT = acc / R; });
      items.forEach(i => { i.aT = vis.includes(i) ? 1 : 0; });
      if (first) { first = false; items.forEach(i => i.ph = i.phT); }
      fi = -1;
    }
    let first = true;
    const nearest = p => { let b = 0, d = 1e9; vis.forEach((i, n) => { const e = Math.abs(i.phT - p); if (e < d) { d = e; b = n; } }); return b; };
    const snap = p => vis.length ? vis[nearest(p)].phT : 0;
    const maxP = () => vis.length ? vis[vis.length - 1].phT : 0;

    /* merge DOM changes (the page keeps discovering pm/project files after load) */
    let sig = "";
    function sync(force) {
      const cur = items.filter(i => !i.dead), nx = collect(), have = new Map(cur.map(i => [i.key, i]));
      const dead = new Set(items.filter(i => i.dead).map(i => i.key));
      const list = nx.filter(n => !dead.has(n.key)).map(n => have.get(n.key) || make(n));
      const s = list.map(i => i.key).join("|");
      if (!force && s === sig) return; sig = s;
      items.filter(i => !list.includes(i)).forEach(i => { drop(i); scene.remove(i.mesh); i.mat.dispose(); });
      items = list; layout();
      if (items.length) wrap.classList.remove("is-loading");
      tp = clamp(tp, 0, maxP()); ui();
    }
    let st; const mo = new MutationObserver(() => { clearTimeout(st); st = setTimeout(() => sync(), 350); });
    grid && mo.observe(grid, { childList: true, subtree: true });

    /* ---------- HUD ---------- */
    const count = c => items.filter(i => c < 0 || i.cat === c).length;
    function ui() {
      chips.textContent = "";
      [-1, 0, 1, 2, 3].forEach(c => {
        const n = count(c); if (c >= 0 && !n) return;
        const b = el("button", "w3d-chip" + (c === filter ? " on" : ""), (c < 0 ? t("all") : cn(c)) + "<i>" + n + "</i>"); b.type = "button";
        b.addEventListener("click", () => { filter = c; layout(); pos = clamp(pos, 0, maxP()); tp = vis.length ? vis[0].phT : 0; ui(); });
        chips.appendChild(b);
      });
      modeBtn.textContent = inside ? t("exit") : t("enter"); hint.textContent = inside ? t("hIn") : t("hOut");
      load.textContent = t("loading"); focusUI();
    }
    function focusUI() {
      const it = vis[fi]; if (!it) { nTxt.textContent = "00 / 00"; tTxt.textContent = ""; actBtn.style.visibility = "hidden"; return; }
      nTxt.textContent = String(fi + 1).padStart(2, "0") + " / " + String(vis.length).padStart(2, "0");
      tTxt.textContent = cn(it.cat); actBtn.textContent = it.type === "v" ? t("watch") : t("view"); actBtn.style.visibility = "visible";
    }
    new MutationObserver(ui).observe(H, { attributes: true, attributeFilter: ["lang"] });

    /* ---------- actions ---------- */
    const openItem = it => { if (!it) return; if (it.type === "v") it.href && window.open(it.href, "_blank", "noopener"); else it.btn && it.btn.click(); };
    const go = n => { if (!vis.length) return; tp = vis[clamp(n, 0, vis.length - 1)].phT; idleAt = performance.now(); };
    const lenis = f => { try { window.__lenis && window.__lenis[f] && window.__lenis[f](); } catch (_) {} };
    function setMode(on) {
      inside = on; kT = on ? 1 : 0; wrap.classList.toggle("is-in", on); D.body.classList.toggle("w3d-in", on);
      on ? lenis("stop") : lenis("start"); ui(); on && wrap.focus({ preventScroll: true });
    }
    modeBtn.addEventListener("click", () => setMode(!inside));
    actBtn.addEventListener("click", () => openItem(vis[fi]));
    bPrev.addEventListener("click", () => go(fi - 1)); bNext.addEventListener("click", () => go(fi + 1));
    wrap.addEventListener("keydown", e => {
      const lb = D.getElementById("mediaLightbox"); if (lb && lb.classList.contains("open")) return;
      if (e.key === "ArrowRight") { go(fi + 1); e.preventDefault(); } else if (e.key === "ArrowLeft") { go(fi - 1); e.preventDefault(); }
      else if (e.key === "Escape" && inside) setMode(false);
      else if (e.key === "Enter" && e.target === wrap) inside ? openItem(vis[fi]) : setMode(true);
    });
    wrap.addEventListener("wheel", e => {
      if (!inside) return; e.preventDefault();
      tp = clamp(tp + (e.deltaY + e.deltaX) * 0.0022, 0, maxP()); idleAt = performance.now();
      clearTimeout(wheelT); wheelT = setTimeout(() => { tp = snap(tp); }, 170);
    }, { passive: false });
    let wheelT;

    const setMouse = e => { const r = cv.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    const pick = () => { ray.setFromCamera(mouse, cam); const h = ray.intersectObjects(vis.map(i => i.mesh).filter(m => m.visible), false)[0]; return h ? h.object.userData.it : null; };
    cv.addEventListener("pointerdown", e => {
      if (e.button) return; setMouse(e);
      drag = { x: e.clientX, y: e.clientY, tp0: tp, moved: false, lx: e.clientX, lt: performance.now(), v: 0 };
      try { cv.setPointerCapture(e.pointerId); } catch (_) {} wrap.classList.add("is-drag");
    });
    cv.addEventListener("pointermove", e => {
      setMouse(e); if (!drag) return;
      const dx = e.clientX - drag.x; if (Math.abs(dx) > 6) drag.moved = true;
      if (drag.moved) {
        const now = performance.now(), dt = Math.max(1, now - drag.lt);
        drag.v = (-(e.clientX - drag.lx) * 0.0016) / dt * 1000; drag.lx = e.clientX; drag.lt = now;
        tp = clamp(drag.tp0 - dx * 0.0016, -0.2, maxP() + 0.2); idleAt = now;
      }
    });
    const up = e => {
      if (!drag) return; const d = drag; drag = null; wrap.classList.remove("is-drag");
      if (d.moved) { tp = snap(clamp(tp + clamp(d.v, -3, 3) * 0.22, 0, maxP())); idleAt = performance.now(); return; }
      if (e.type === "pointercancel") return;
      setMouse(e); const it = pick(); if (!it) return;
      const n = vis.indexOf(it);
      if (n !== fi) go(n); else if (inside) openItem(it); else setMode(true);
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", () => { mouse.set(9, 9); });

    /* ---------- size / visibility ---------- */
    const resize = () => { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(wrap); resize();
    let onScreen = true;
    new IntersectionObserver(es => { onScreen = es[0].isIntersecting; wake(); }, { threshold: 0.05 }).observe(wrap);
    D.addEventListener("visibilitychange", wake);
    function wake() { const should = (onScreen || inside) && !D.hidden; if (should && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); } else if (!should) running = false; }

    /* ---------- loop ---------- */
    const V = new T.Vector3(), LK = new T.Vector3(), tmp = new T.Vector3();
    let slow = 0;
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now; const tt = (now - T0) / 1000;
      const ex = x => 1 - Math.exp(-dt * x);
      pos += (tp - pos) * ex(inside ? 7 : 5); k += (kT - k) * ex(3.2); Rc += (R - Rc) * ex(3);
      sm.x += (mouse.x - sm.x) * ex(3); sm.y += (mouse.y - sm.y) * ex(3);
      if (vis.length) { const n = nearest(pos); if (n !== fi) { fi = n; focusUI(); } }

      /* outside: gentle autoplay (ping-pong) until the visitor touches it */
      if (!inside && !drag && vis.length > 1 && now - idleAt > 2600 && now - lastAuto > AUTO_MS && !wrap.matches(":hover")) {
        lastAuto = now; if (fi + dir > vis.length - 1 || fi + dir < 0) dir = -dir; go(fi + dir); idleAt = 0;
      }

      /* hover */
      hov = drag && drag.moved ? null : (vis.length && Math.abs(mouse.x) <= 1 ? pick() : null);
      cv.style.cursor = hov ? "pointer" : "";

      /* panels */
      const e = k * k * (3 - 2 * k);
      items.forEach(it => {
        const m = it.mesh, u = it.mat.uniforms, isF = vis[fi] === it;
        it.ph += (it.phT - it.ph) * ex(5); it.f += ((isF ? 1 : 0) - it.f) * ex(7); it.hv += ((hov === it ? 1 : 0) - it.hv) * ex(10);
        const born = Math.max(0, (now - it.born - 120 - Math.min(vis.indexOf(it) < 0 ? 0 : Math.abs(vis.indexOf(it) - Math.max(fi, 0)), 14) * 55) / 700);
        it.a += ((born > 0 ? it.aT : 0) - it.a) * ex(5); it.rd += (it.rdT - it.rd) * ex(5);
        if (it.a < 0.01) { m.visible = false; return; } m.visible = true;
        const y = it.ph / TAU * RISE, pull = 1 - 0.06 * it.f;
        m.position.set(Math.sin(it.ph) * Rc * pull, y, -Math.cos(it.ph) * Rc * pull); m.lookAt(0, y, 0);
        const s = (1 + 0.1 * it.f + 0.025 * it.hv) * (0.55 + 0.45 * it.a); m.scale.set(it.fw * s, it.fh * s, 1);
        u.uF.value = it.f; u.uH.value = it.hv; u.uT.value = tt; u.uA.value = it.a; u.uRd.value = it.rd; u.uDim.value = inside ? 0.72 : 0.5 + 0.1 * (1 - e);
      });

      /* camera: orbits outside, climbs the spiral inside - one blend, one scalar (pos) */
      const y = pos / TAU * RISE, D0 = Rc * 1.75 + 3.4;
      cam.position.set(-D0 * Math.sin(pos) + sm.x * 0.9 * (1 - e), y + Rc * 0.28 + sm.y * 0.5 * (1 - e) + Math.sin(tt * 0.4) * 0.05, D0 * Math.cos(pos));
      const ang = pos - sm.x * 0.2; LK.set(Math.sin(ang) * 10, y + sm.y * 1.1, -Math.cos(ang) * 10);
      cam.position.lerp(tmp.set(0, y, 0), e);
      V.set(0, y, 0).lerp(LK, e); cam.lookAt(V);
      const fov = 42 + 26 * e; if (Math.abs(cam.fov - fov) > 0.02) { cam.fov = fov; cam.updateProjectionMatrix(); }
      dust.rotation.y = tt * 0.02; dust.position.y = y * 0.6;

      /* lazy media: textures near the focus, videos only for focus ±1 */
      if (now - slow > 320) { slow = now; stream(); }
      renderer.render(scene, cam);
    }
    function stream() {
      if (fi < 0) return; let vids = 0;
      vis.forEach((it, n) => {
        const d = Math.abs(n - fi);
        if (it.type === "i") { if (d <= RANGE && !it.st) loadImg(it); else if (d > RANGE + 5 && it.st === 2) drop(it); return; }
        if (d <= 2 && !it.v && it.st !== -1 && vids < 4) startVid(it);
        if (it.v) {
          vids++;
          if (d <= 1 && running) { const p = it.v.play(); p && p.catch && p.catch(() => {}); } else it.v.pause();
          if (d > 5) drop(it);
        }
      });
      items.forEach(it => { if (!vis.includes(it) && it.st) drop(it); });
    }

    sync(true); wake(); ui();
    /* lose-context safety: bring back the old grid instead of a black box */
    cv.addEventListener("webglcontextlost", e => { e.preventDefault(); fail(); });
    window.__work3d = { go, enter: () => setMode(true), exit: () => setMode(false) };
  }
})();
