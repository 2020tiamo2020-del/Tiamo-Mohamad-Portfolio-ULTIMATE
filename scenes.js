/* ==========================================================================
   SCROLL SCENES (2026-10-24) - scenes.js   (replaces process-brief.js)
   - Field   : 3D particle cloud (2D canvas, own perspective maths) that MORPHS between shapes as you scroll
   - Scene   : pinned stage; the mouse wheel drives a horizontal film-strip, bar-wipe text reveals,
               outlined numerals that fill, marquee words, velocity skew, card-open / card-close edges
   - Process : 7 panels (intro + 6 steps)       - Brief : 6 panels + live 3D ticket + WhatsApp message
   No libraries, no images. Everything is drawn procedurally so it works offline.
   WhatsApp is opened with window.open from a <button> (script.js rewrites <a href*="wa.me/"> on language switch).
   Nothing is stored or sent anywhere except the WhatsApp link the visitor opens.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__scFx) return;
  window.__scFx = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAr = () => document.documentElement.lang === "ar";
  const run = (n, fn) => { try { fn(); } catch (e) { console.warn("[sc:" + n + "]", e); } };
  const onReady = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();
  const onLang = fn => new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const isSmall = () => innerWidth <= 900;
  const WA_NUMBER = "201278536645";

  /* ------------------------------ deterministic random ------------------------------ */
  let _s = 20261024;
  const rnd = () => (_s = (_s * 16807) % 2147483647) / 2147483647;
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;

  /* ------------------------------ target shapes (unit space) ------------------------------ */
  const SHAPES = {
    cloud(n) {
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = Math.cbrt(rnd()) * 1.2, s = Math.sqrt(1 - u * u);
        a[i * 3] = r * s * Math.cos(th) * 1.15; a[i * 3 + 1] = r * u * .8; a[i * 3 + 2] = r * s * Math.sin(th);
      }
      return a;
    },
    seed(n) {
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { a[i * 3] = gauss() * .3; a[i * 3 + 1] = gauss() * .3; a[i * 3 + 2] = gauss() * .3; }
      return a;
    },
    planes(n) {
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const c = i % 3, ang = (c - 1) * .42;
        let u = rnd() - .5, v = rnd() - .5;
        if (rnd() < .3) { if (rnd() < .5) u = (u < 0 ? -.5 : .5); else v = (v < 0 ? -.5 : .5); }
        const x = u * 1.45, y = v * .98, z = (c - 1) * .5;
        a[i * 3] = x * Math.cos(ang) + z * Math.sin(ang); a[i * 3 + 1] = y; a[i * 3 + 2] = -x * Math.sin(ang) + z * Math.cos(ang);
      }
      return a;
    },
    sphere(n) {
      const a = new Float32Array(n * 3), g = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i;
        a[i * 3] = Math.cos(th) * r * .95; a[i * 3 + 1] = y * .95; a[i * 3 + 2] = Math.sin(th) * r * .95;
      }
      return a;
    },
    torus(n) {
      const a = new Float32Array(n * 3), R = .7, r = .3;
      for (let i = 0; i < n; i++) {
        const u = rnd() * Math.PI * 2, v = rnd() * Math.PI * 2;
        a[i * 3] = (R + r * Math.cos(v)) * Math.cos(u); a[i * 3 + 1] = r * Math.sin(v) * 1.1; a[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
      }
      return a;
    },
    loop(n) {
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const t = rnd() * Math.PI * 2;
        a[i * 3] = Math.sin(t) * 1.0 + gauss() * .035; a[i * 3 + 1] = Math.sin(t) * Math.cos(t) * .62 + gauss() * .035; a[i * 3 + 2] = Math.cos(t) * .5 + gauss() * .035;
      }
      return a;
    },
    cube(n) {
      const a = new Float32Array(n * 3), s = .62;
      for (let i = 0; i < n; i++) {
        const p = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1];
        const ax = (rnd() * 3) | 0; p[ax] = rnd() < .5 ? -1 : 1;
        if (rnd() < .42) { const b = (ax + 1 + ((rnd() * 2) | 0)) % 3; p[b] = rnd() < .5 ? -1 : 1; }
        a[i * 3] = p[0] * s; a[i * 3 + 1] = p[1] * s; a[i * 3 + 2] = p[2] * s;
      }
      return a;
    },
    ring(n) {
      const a = new Float32Array(n * 3), R = .92, r = .055, tilt = .55, ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < n; i++) {
        const u = rnd() * Math.PI * 2, v = rnd() * Math.PI * 2;
        const x = (R + r * Math.cos(v)) * Math.cos(u), y = r * Math.sin(v), z = (R + r * Math.cos(v)) * Math.sin(u);
        a[i * 3] = x; a[i * 3 + 1] = y * ct - z * st; a[i * 3 + 2] = y * st + z * ct;
      }
      return a;
    }
  };

  /* ------------------------------ colour helpers ------------------------------ */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const colorAt = (pal, u) => {
    const x = clamp(u, 0, .9999) * (pal.length - 1), i = Math.floor(x), f = x - i;
    return [0, 1, 2].map(k => Math.round(lerp(pal[i][k], pal[i + 1][k], f)));
  };
  const makeSprite = rgb => {
    const c = document.createElement("canvas");
    c.width = c.height = 48;
    const g = c.getContext("2d"), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(.22, "rgba(" + rgb.join(",") + ",.9)");
    gr.addColorStop(1, "rgba(" + rgb.join(",") + ",0)");
    g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    return c;
  };

  /* ------------------------------ Field: morphing 3D particle cloud ------------------------------ */
  class Field {
    constructor(canvas, o) {
      this.cv = canvas; this.ctx = canvas.getContext("2d");
      this.n = o.count; this.nDraw = o.count; this.shapes = o.shapes.map(nm => SHAPES[nm](this.n));
      this.P = new Float32Array(this.shapes[0]);
      this.rate = new Float32Array(this.n); this.sz = new Float32Array(this.n); this.bk = new Uint8Array(this.n);
      for (let i = 0; i < this.n; i++) { this.rate[i] = .045 + rnd() * .09; this.sz[i] = .55 + rnd() * .9; this.bk[i] = (rnd() * 16) | 0; }
      this.cx = o.cx; this.cy = o.cy; this.scale = o.scale; this.size = o.size || 2.2; this.zoom = 1; this.zoomS = 1;
      this.mix = 0; this.mixS = 0; this.px = 0; this.py = 0; this.tpx = 0; this.tpy = 0; this.energy = 0; this.spin = 1;
      this.setPalette(o.palette);
      this.resize();
    }
    setPalette(list) {
      this.pal = list.map(hex);
      this.sprites = Array.from({ length: 16 }, (_, k) => makeSprite(colorAt(this.pal, k / 15)));
    }
    resize() {
      const r = this.cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.75);
      this.dpr = d; this.w = this.cv.width = Math.max(2, Math.round(r.width * d)); this.h = this.cv.height = Math.max(2, Math.round(r.height * d));
    }
    pulse() { this.energy = 1; }
    draw(now, dt = 1) {
      const ctx = this.ctx, W = this.w, H = this.h, S = this.shapes.length;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      this.mixS += (this.mix - this.mixS) * (reduce ? 1 : 1 - Math.pow(.88, dt));
      const kp = 1 - Math.pow(.94, dt); this.px += (this.tpx - this.px) * kp; this.py += (this.tpy - this.py) * kp;
      this.zoomS += (this.zoom - this.zoomS) * (1 - Math.pow(.92, dt));
      this.energy *= Math.pow(.94, dt);
      const m = clamp(this.mixS, 0, S - 1), i0 = Math.min(Math.floor(m), S - 2), f = S > 1 ? smoother(m - i0) : 0;
      const A = this.shapes[i0], B = this.shapes[Math.min(i0 + 1, S - 1)];
      const yaw = (reduce ? 0 : now * .00011 * this.spin * (1 + this.energy * 3)) + this.px * .7;
      const pit = -.18 + this.py * .35, cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit);
      const base = Math.min(W, H) * this.scale * this.zoomS, F = 2.8, cx = W * this.cx, cy = H * this.cy;
      const P = this.P, d = this.dpr, wob = reduce ? 0 : .014;
      const nd = Math.min(this.n, this.nDraw), boost = this.n / nd;
      for (let i = 0; i < nd; i++) {
        const k = i * 3, r = dt === 1 ? this.rate[i] : 1 - Math.pow(1 - this.rate[i], dt);
        const wx = Math.sin(now * .0009 + i * 1.7) * wob, wy = Math.cos(now * .0011 + i * 2.3) * wob;
        P[k] += (A[k] + (B[k] - A[k]) * f + wx - P[k]) * r;
        P[k + 1] += (A[k + 1] + (B[k + 1] - A[k + 1]) * f + wy - P[k + 1]) * r;
        P[k + 2] += (A[k + 2] + (B[k + 2] - A[k + 2]) * f - P[k + 2]) * r;
        const x = P[k], y = P[k + 1], z = P[k + 2];
        const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        const s = F / (F + z2), X = cx + x1 * base * s, Y = cy + y2 * base * s;
        const sz = this.size * d * s * this.sz[i] * (1 + this.energy * .8) * Math.min(1.5, boost);
        ctx.globalAlpha = clamp(.2 + .8 * (s - .6) * 1.6, .12, 1);
        ctx.drawImage(this.sprites[this.bk[i]], X - sz, Y - sz, sz * 2, sz * 2);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------ one shared frame loop ------------------------------ */
  const scenes = [];
  let lastY = scrollY, lastT = 0, rafOn = false, ema = 16.7, lastAdapt = 0;
  const frame = now => {
    const ms = lastT ? clamp(now - lastT, 4, 250) : 16.7; lastT = now;
    const dt = clamp(ms / 16.667, .5, 8);
    ema = ema * .9 + ms * .1;
    const dy = scrollY - lastY; lastY = scrollY;
    let any = false;
    scenes.forEach(sc => { if (sc.active) { any = true; sc.tick(now, dy, dt); } });
    /* adaptive quality: slow device -> draw fewer particles */
    if (any && !window.__scNoAdapt && ema > 34 && now - lastAdapt > 700) {
      lastAdapt = now;
      scenes.forEach(sc => { const f = sc.field; if (f.nDraw > 260) f.nDraw = Math.max(260, Math.floor(f.nDraw * .72)); });
    }
    rafOn = any;
    if (any) requestAnimationFrame(frame); else lastT = 0;
  };
  const wake = () => { if (!rafOn) { rafOn = true; lastY = scrollY; lastT = 0; requestAnimationFrame(frame); } };

  /* ------------------------------ Scene: pinned stage driven by the wheel ------------------------------ */
  class Scene {
    constructor(sec, cfg) {
      this.sec = sec; this.cfg = cfg;
      this.stage = $(".sc-stage", sec); this.track = $(".sc-track", sec);
      this.panels = $$(".sc-panel", sec); this.N = this.panels.length;
      this.num = $(".sc-count b", sec); this.nameEl = $(".sc-name", sec); this.dots = $$(".sc-dots button", sec);
      this.m1 = $$(".sc-marq-row", sec);
      this.t = 0; this.raw = 0; this.idx = -1; this.vel = 0; this.active = false;
      this.field = new Field($(".sc-fx", sec), cfg.field());
      this.rv = this.panels.map(p => $$(".rv", p));
      this.tags = this.panels.map(p => $$(".sc-tags li", p));
      this.far = this.panels.map(() => false);
      this.measure();
      this.dots.forEach((b, i) => b.addEventListener("click", () => this.goTo(i)));
      sec.addEventListener("focusin", e => {
        const p = e.target.closest && e.target.closest(".sc-panel");
        if (p) { const i = this.panels.indexOf(p); if (i !== Math.round(this.t) && this.focusTo !== i) { this.focusTo = i; this.goTo(i); setTimeout(() => { this.focusTo = -1; }, 900); } }
      });
      this.stage.addEventListener("pointermove", e => {
        const r = this.stage.getBoundingClientRect();
        this.nx = ((e.clientX - r.left) / r.width - .5) * 2; this.ny = ((e.clientY - r.top) / r.height - .5) * 2;
        this.field.tpx = this.nx * (isAr() ? -1 : 1); this.field.tpy = this.ny; this.mx = e.clientX; this.my = e.clientY;
        cfg.onPointer && cfg.onPointer(this, e);
      }, { passive: true });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(es => es.forEach(e => { this.active = e.isIntersecting; if (this.active) wake(); }), { rootMargin: "70% 0px 70% 0px" }).observe(sec);
      } else { this.active = true; wake(); }
      let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => this.measure(), 120); }, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.measure());
      onLang(() => { this.idx = -1; setTimeout(() => this.measure(), 120); });
    }
    measure() {
      const w = document.documentElement.clientWidth;
      this.sec.style.setProperty("--sc-w", w + "px");
      this.pw = w; this.sec.style.setProperty("--sc-pw", w + "px");
      this.field.cx = this.cfg.cx(); this.field.cy = this.cfg.cy(); this.field.scale = this.cfg.scale();
      this.field.n > 0 && this.field.resize();
    }
    goTo(i) {
      const vh = innerHeight, total = this.sec.offsetHeight - vh, top = this.sec.getBoundingClientRect().top + scrollY;
      const y = top + .1 * vh + (i / (this.N - 1)) * (total - .2 * vh);
      const lenis = window.__lenis;
      lenis && lenis.scrollTo ? lenis.scrollTo(y, { duration: 1.5 }) : scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    }
    tick(now, dy, dt = 1) {
      const vh = innerHeight, r = this.sec.getBoundingClientRect(), total = Math.max(1, this.sec.offsetHeight - vh), pad = .1 * vh, N = this.N;
      const dir = isAr() ? 1 : -1;
      this.raw = clamp((-r.top - pad) / Math.max(1, total - 2 * pad), 0, 1) * (N - 1);
      const i = Math.min(Math.floor(this.raw), N - 2), f = this.raw - i, snapped = i + lerp(f, smoother(f), .82);
      this.t += ((N > 1 ? snapped : 0) - this.t) * (reduce ? 1 : 1 - Math.pow(.84, dt));
      this.vel += (dy - this.vel) * (1 - Math.pow(.82, dt));
      const t = this.t, st = this.stage.style;

      /* card-open / card-close edges */
      const enter = clamp(1 - r.top / vh, 0, 1), leave = clamp(1 - r.bottom / vh, 0, 1), eo = 1 - smooth(enter);
      st.setProperty("--in-x", Math.max(eo * 7, leave * 5).toFixed(2) + "%");
      st.setProperty("--in-r", Math.max(eo * 46, leave * 38).toFixed(1) + "px");
      st.setProperty("--dim", (leave * .75).toFixed(3));
      st.setProperty("--vel", reduce ? 0 : clamp(this.vel, -34, 34).toFixed(2));
      st.setProperty("--hint", (1 - clamp(this.raw / .3, 0, 1)).toFixed(3));
      st.setProperty("--p", (t / Math.max(1, N - 1)).toFixed(4));

      /* film strip */
      this.track.style.setProperty("--tx", (dir * t * this.pw).toFixed(1) + "px");
      const mp = t / Math.max(1, N - 1);
      this.m1[0] && this.m1[0].style.setProperty("--m1", (dir * mp * 1500).toFixed(1) + "px");
      this.m1[1] && this.m1[1].style.setProperty("--m2", (-dir * (mp * 1500 - 800)).toFixed(1) + "px");

      /* per-panel choreography */
      for (let p = 0; p < N; p++) {
        const px = t - p, ap = Math.abs(px);
        if (ap >= 1.6) { if (this.far[p]) continue; this.far[p] = true; } else this.far[p] = false;
        const q = clamp(1 - ap, 0, 1), el = this.panels[p];
        el.style.setProperty("--px", clamp(px, -1.6, 1.6).toFixed(3));
        el.style.setProperty("--fq", clamp((q - .22) / .55, 0, 1).toFixed(3));
        this.rv[p].forEach((b, k) => {
          const rr = clamp((q - (.36 + .045 * k)) / .34, 0, 1);
          b.style.setProperty("--bx", (rr < .5 ? -101 + rr * 2 * 101 : (rr - .5) * 2 * 101).toFixed(1) + "%");
          b.style.setProperty("--cx", (rr < .5 ? 100 : (1 - (rr - .5) * 2) * 100).toFixed(1) + "%");
        });
        this.tags[p].forEach((li, k) => li.style.setProperty("--o", clamp((q - (.5 + .04 * k)) / .22, 0, 1).toFixed(3)));
      }

      /* HUD + background hue */
      const idx = clamp(Math.round(t), 0, N - 1);
      if (idx !== this.idx) {
        this.idx = idx;
        if (this.num) this.num.textContent = String(idx + 1).padStart(2, "0");
        const h3 = $(".sc-title .rv-t", this.panels[idx]);
        if (this.nameEl) this.nameEl.textContent = h3 ? h3.textContent.replace(/\s+/g, " ").trim() : "";
        this.dots.forEach((b, k) => { b.classList.toggle("on", k === idx); b.setAttribute("aria-current", k === idx ? "true" : "false"); });
        this.cfg.onIndex && this.cfg.onIndex(this, idx);
      }
      const hs = this.cfg.hues, hp = clamp(t, 0, hs.length - 1), h0 = Math.floor(hp), h1 = Math.min(h0 + 1, hs.length - 1);
      st.setProperty("--h", lerp(hs[h0], hs[h1], hp - h0).toFixed(1));
      st.setProperty("--bgx", (isAr() ? 28 : 72) + "%");

      /* 3D field */
      this.field.mix = clamp(t * (this.field.shapes.length - 1) / Math.max(1, N - 1), 0, this.field.shapes.length - 1);
      this.cfg.onFrame && this.cfg.onFrame(this, now);
      this.field.draw(now, dt);
    }
  }

  /* ------------------------------ PROCESS ------------------------------ */
  onReady(() => run("process", () => {
    const sec = $("#process");
    if (!sec) return;
    const small = () => isSmall();
    const sc = new Scene(sec, {
      hues: [265, 285, 205, 318, 172, 250, 190],
      field: () => ({ shapes: ["cloud", "seed", "planes", "sphere", "torus", "loop", "cube"], count: small() ? 520 : 1150, cx: .7, cy: .5, scale: .4, size: 2.5, palette: ["#8b35ff", "#16d8ff", "#ff4fd8"] }),
      cx: () => (small() ? .5 : isAr() ? .3 : .7), cy: () => (small() ? .3 : .5), scale: () => (small() ? .27 : .4)
    });
    scenes.push(sc);
  }));

  /* ------------------------------ BRIEF ------------------------------ */
  onReady(() => run("brief", () => {
    const sec = $("#brief");
    if (!sec) return;
    const svc = $$("#bbService .sc-chip", sec), use = $$("#bbUsage .sc-chip", sec);
    const qty = $("#bbQty", sec), day = $("#bbDays", sec), idea = $("#bbIdea", sec), nm = $("#bbName", sec);
    const qBig = $("#bbQtyBig", sec), dBig = $("#bbDaysBig", sec), cnt = $("#bbCount", sec);
    const sSvc = $("#bsSvc", sec), sUse = $("#bsUse", sec), sQty = $("#bsQty", sec), sDay = $("#bsDay", sec), sIdea = $("#bsIdea", sec), sNm = $("#bsName", sec);
    const meter = $("#bbMeter", sec), hint = $("#bbHint", sec), send = $("#bbSend", sec), copy = $("#bbCopy", sec), skip = $("#bbSkip", sec);
    const tkWrap = $(".tk-wrap", sec), tkSvc = $("#tkSvc", sec), tkQty = $("#tkQty", sec), tkDay = $("#tkDay", sec), tkIdea = $("#tkIdea", sec), tkFg = $("#tkFg", sec), tkPct = $("#tkPct", sec), tkDate = $("#tkDate", sec), tk = $(".tk", sec);

    const T = {
      en: {
        none: "Not chosen yet", noIdea: "Not added yet", day1: "within 1 day", dayN: n => "within " + n + " days", dayShort: n => n + (n === 1 ? " day" : " days"),
        tag: d => d <= 2 ? "Rush" : d <= 7 ? "Quick" : d <= 14 ? "Standard" : "Flexible",
        hSvc: "Choose at least one service to continue.", hUse: "Tell me where the work will be used.",
        hIdea: "Add a short idea or a reference link for a faster start.", hOk: "Your brief is ready to send.",
        copied: "Copied ✓", hello: "Hello Tiamo 👋", intro: "I found your portfolio and I'd like to start a project.",
        l: { svc: "Service", use: "Use", qty: "Quantity", dl: "Deadline", idea: "Idea / notes", nm: "Name" },
        outro: "Sent from the Brief Builder on your portfolio.", unit: "pieces", unit1: "piece",
        ph: { idea: "Describe your idea, style, or paste a reference link…", nm: "Your name (optional)" }, pick: "Pick a service"
      },
      ar: {
        none: "لم يُحدَّد بعد", noIdea: "لم تُضَف بعد", day1: "خلال يوم واحد", dayN: n => (n === 2 ? "خلال يومين" : n <= 10 ? "خلال " + n + " أيام" : "خلال " + n + " يومًا"),
        dayShort: n => (n === 1 ? "يوم" : n === 2 ? "يومان" : n <= 10 ? n + " أيام" : n + " يومًا"),
        tag: d => d <= 2 ? "عاجل" : d <= 7 ? "سريع" : d <= 14 ? "عادي" : "مرن",
        hSvc: "اختر خدمة واحدة على الأقل للمتابعة.", hUse: "أخبرني أين سيُستخدم العمل.",
        hIdea: "أضف فكرة مختصرة أو رابط مرجع لتبدأ بشكل أسرع.", hOk: "الملخص جاهز للإرسال.",
        copied: "تم النسخ ✓", hello: "مرحبًا تيامو 👋", intro: "شاهدت معرض أعمالك وأرغب في بدء مشروع.",
        l: { svc: "الخدمة", use: "الاستخدام", qty: "الكمية", dl: "الموعد", idea: "الفكرة / ملاحظات", nm: "الاسم" },
        outro: "أُرسلت من منشئ الطلب في معرض أعمالك.", unit: "أعمال", unit1: "عمل",
        ph: { idea: "صف فكرتك أو أسلوبك المطلوب، أو الصق رابط مرجع…", nm: "اسمك (اختياري)" }, pick: "اختر خدمة"
      }
    };
    const L = () => T[isAr() ? "ar" : "en"];
    const lab = b => b.getAttribute(isAr() ? "data-ar" : "data-en") || b.textContent;
    const chosenSvc = () => svc.filter(b => b.getAttribute("aria-checked") === "true");
    const chosenUse = () => use.find(b => b.getAttribute("aria-checked") === "true");
    const fill = r => r.style.setProperty("--v", ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + "%");
    const trim = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
    const days = () => +day.value;
    const qtyText = () => {
      const n = +qty.value;
      if (!isAr()) return n + " " + (n === 1 ? L().unit1 : L().unit);
      return n === 1 ? "عمل واحد" : n === 2 ? "عملان" : n <= 10 ? n + " أعمال" : n + " عملًا";
    };
    const dayText = () => (days() === 1 ? L().day1 : L().dayN(days()));
    const setDD = (el, text, empty) => { el.textContent = text; el.classList.toggle("empty", !!empty); };
    const PALS = { rush: ["#ff4fa3", "#ff9a3d", "#ffd36b"], quick: ["#ff4fd8", "#8b35ff", "#16d8ff"], std: ["#8b35ff", "#16d8ff", "#7df1ff"], flex: ["#16d8ff", "#1fe7a6", "#b6ffd9"] };
    let palKey = "std";

    const small = () => isSmall();
    const sc = new Scene(sec, {
      hues: [265, 300, 300, 300, 300, 195],
      field: () => ({ shapes: ["cloud", "ring", "ring", "ring", "ring", "cube"], count: small() ? 480 : 1000, cx: .74, cy: .5, scale: .46, size: 2.4, palette: PALS.std }),
      cx: () => (small() ? .5 : isAr() ? .26 : .74), cy: () => (small() ? .3 : .5), scale: () => (small() ? .26 : .46),
      onFrame(s, now) {
        if (!tk) return;
        const ta = clamp(s.t * 1.3, 0, 1);
        tkWrap.style.opacity = ta.toFixed(3);
        tkWrap.style.translate = ((isAr() ? -1 : 1) * (1 - smooth(ta)) * 90).toFixed(1) + "px 0";
        s.rx = (s.rx || 0) + (((s.ny || 0) * -9) - (s.rx || 0)) * .08;
        s.ry = (s.ry || 0) + (((s.nx || 0) * 13) - (s.ry || 0)) * .08;
        tk.style.setProperty("--rx", s.rx.toFixed(2) + "deg");
        tk.style.setProperty("--ry", s.ry.toFixed(2) + "deg");
        tk.style.setProperty("--ty", (reduce ? 0 : Math.sin(now / 900) * 9).toFixed(1) + "px");
        tk.style.setProperty("--gx", (50 + (s.nx || 0) * 45).toFixed(0) + "%");
        tk.style.setProperty("--gy", (30 + (s.ny || 0) * 40).toFixed(0) + "%");
        tk.style.setProperty("--hue", ((now / 24) % 360).toFixed(0) + "deg");
      },
      onPointer(s, e) {
        /* magnetic chips / buttons */
        $$(".sc-chip,.sc-btn", sec).forEach(b => {
          const r = b.getBoundingClientRect();
          if (r.right < 0 || r.left > innerWidth) return;
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), R = 110;
          if (d < R && !reduce) { const k = (1 - d / R) * .32; b.style.setProperty("--mx", (dx * k).toFixed(1) + "px"); b.style.setProperty("--my", (dy * k).toFixed(1) + "px"); }
          else if (b.style.getPropertyValue("--mx")) { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); }
        });
      }
    });
    scenes.push(sc);

    const render = () => {
      const l = L(), s = chosenSvc(), u = chosenUse(), text = idea.value.trim(), name = nm.value.trim();
      fill(qty); fill(day);
      qBig.innerHTML = "<b>" + String(qty.value).padStart(2, "0") + "</b><small>" + (+qty.value === 1 ? l.unit1 : l.unit) + "</small>";
      dBig.innerHTML = "<b>" + String(days()).padStart(2, "0") + "</b><small>" + (isAr() ? (days() === 1 ? "يوم" : "أيام") : (days() === 1 ? "day" : "days")) + " · " + l.tag(days()) + "</small>";
      cnt.textContent = idea.value.length + " / 400";
      idea.placeholder = l.ph.idea; nm.placeholder = l.ph.nm;
      setDD(sSvc, s.length ? s.map(lab).join(isAr() ? "، " : ", ") : l.none, !s.length);
      setDD(sUse, u ? lab(u) : l.none, !u);
      setDD(sQty, qtyText(), false);
      setDD(sDay, dayText(), false);
      setDD(sIdea, text ? trim(text, 110) : l.noIdea, !text);
      setDD(sNm, name || "—", !name);
      const score = (s.length ? 35 : 0) + (u ? 20 : 0) + (text.length >= 20 ? 30 : text ? 15 : 0) + (name ? 15 : 0);
      meter.style.setProperty("--m", score + "%");
      hint.textContent = !s.length ? l.hSvc : !u ? l.hUse : text.length < 20 ? l.hIdea : l.hOk;
      send.setAttribute("aria-disabled", s.length ? "false" : "true");
      /* ticket */
      tkSvc.innerHTML = "";
      (s.length ? s : [null]).slice(0, 6).forEach(b => {
        const sp = document.createElement("span");
        if (b) sp.textContent = lab(b); else { sp.className = "ph"; sp.textContent = l.pick; }
        tkSvc.appendChild(sp);
      });
      tkQty.textContent = qtyText(); tkDay.textContent = l.dayShort(days()) + " · " + l.tag(days());
      tkIdea.textContent = text ? trim(text, 90) : l.noIdea;
      tkFg.style.strokeDashoffset = (138.2 * (1 - score / 100)).toFixed(1);
      tkPct.textContent = score + "%";
      tkDate.textContent = new Date().toLocaleDateString(isAr() ? "ar-EG" : "en-GB", { day: "numeric", month: "short", year: "numeric" });
      /* 3D field reacts to the answers */
      const key = days() <= 2 ? "rush" : days() <= 7 ? "quick" : days() <= 14 ? "std" : "flex";
      if (key !== palKey) { palKey = key; sc.field.setPalette(PALS[key]); }
      sc.field.zoom = .88 + (+qty.value / 20) * .42;
      sc.field.spin = 1 + (30 - days()) / 30 * 2.2;
    };

    const message = () => {
      const l = L(), s = chosenSvc(), u = chosenUse(), text = idea.value.trim(), name = nm.value.trim();
      const lines = [l.hello, l.intro, "",
        "• " + l.l.svc + ": " + s.map(lab).join(isAr() ? "، " : ", "),
        u ? "• " + l.l.use + ": " + lab(u) : "",
        "• " + l.l.qty + ": " + qtyText(),
        "• " + l.l.dl + ": " + dayText(),
        text ? "• " + l.l.idea + ": " + text : "",
        name ? "• " + l.l.nm + ": " + name : "",
        "", l.outro];
      return lines.filter((x, i) => x !== "" || (i > 0 && lines[i - 1] !== "")).join("\n");
    };

    svc.forEach(b => b.addEventListener("click", () => { b.setAttribute("aria-checked", b.getAttribute("aria-checked") === "true" ? "false" : "true"); sc.field.pulse(); render(); }));
    use.forEach(b => b.addEventListener("click", () => {
      const was = b.getAttribute("aria-checked") === "true";
      use.forEach(x => x.setAttribute("aria-checked", "false"));
      b.setAttribute("aria-checked", was ? "false" : "true"); sc.field.pulse(); render();
    }));
    [qty, day].forEach(el => el.addEventListener("input", () => { sc.field.pulse(); render(); }));
    [idea, nm].forEach(el => el.addEventListener("input", render));
    skip && skip.addEventListener("click", () => sc.goTo(sc.N - 1));

    send.addEventListener("click", () => {
      if (!chosenSvc().length) {
        const g = $("#bbService", sec);
        g.classList.remove("sc-shake"); void g.offsetWidth; g.classList.add("sc-shake");
        sc.goTo(1);
        return;
      }
      sc.field.pulse();
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message()), "_blank", "noopener");
    });
    copy.addEventListener("click", async () => {
      const msg = message();
      try { await navigator.clipboard.writeText(msg); }
      catch (_) {
        const ta = document.createElement("textarea"); ta.value = msg; ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove();
      }
      copy.textContent = L().copied;
      setTimeout(() => { copy.innerHTML = copy.getAttribute(isAr() ? "data-ar" : "data-en"); }, 1600);
    });
    onLang(() => setTimeout(render, 30));
    render();
  }));
})();
