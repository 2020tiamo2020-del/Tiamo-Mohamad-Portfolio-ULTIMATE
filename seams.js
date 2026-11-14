/* ==========================================================================
   SEAMS — cinematic scroll transitions between sections.  (needs seams.css)
   - Pure scroll-scrub overlay: progress p (0..1) comes from where the NEXT section's top edge
     sits in the viewport. Nothing in the page is moved or restyled.
   - 10 boundaries, 9 designs (Find Me → Brief → Contact is a two-part ticket story).
   - Fast jumps (nav clicks, flicks) fade the layer out so nothing strobes.
   - Phones / "reduce motion" get one calm veil instead of the heavy versions.
   - Tuning knobs are in CFG. Debug: window.__seams.set(index, p) freezes a seam at p.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__seams) return;

  const CFG = {
    enter: 0.95,         // p = 0 when the next section's top is at 95% of the viewport height
    leave: -0.05,        // p = 1 when it is at -5%
    fastPx: 2800,        // px/s above which the layer fades out (nav jumps, big flicks)
    fastSpan: 2200,
    magnet: true,        // if scrolling stops mid-seam, glide to the nearest end (in scroll direction)
    magnetIdle: 220,
  };

  const $ = (s) => document.querySelector(s);
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eo = (t) => 1 - Math.pow(1 - t, 3);
  const ei = (t) => t * t * t;
  const bell = (p) => Math.sin(Math.PI * clamp(p));
  const isRtl = () => document.documentElement.getAttribute("dir") === "rtl";
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();

  const root = document.createElement("div");
  root.id = "sm";
  root.setAttribute("aria-hidden", "true");
  document.body.appendChild(root);

  const mk = (cls, parent, html, tag) => {
    const e = document.createElement(tag || "div");
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    (parent || root).appendChild(e);
    return e;
  };
  const put = (el, t) => { el.style.transform = t; };
  const show = (el, on) => { const v = on ? "" : "none"; if (el.style.display !== v) el.style.display = v; };

  /* section words (en / ar) ------------------------------------------------ */
  const WORDS = {
    about: ["ABOUT", "عنّي", "01"], services: ["SERVICES", "الخدمات", "02"], work: ["WORK", "الأعمال", "03"],
    beyond: ["BEYOND", "ما بعد", "03½"], creation: ["AI CREATION", "إبداع الذكاء الاصطناعي", "04"],
    ba: ["BEFORE / AFTER", "قبل وبعد", "05"], process: ["PROCESS", "طريقة العمل", "06"],
    fm: ["FIND ME", "تجدني هنا", "07"], brief: ["START A PROJECT", "ابدأ مشروعك", "08"], contact: ["CONTACT", "تواصل", "09"],
  };
  const word = (k) => WORDS[k][isRtl() ? 1 : 0];
  const label = (k) => `${WORDS[k][2]} — ${word(k)}`;

  /* ----------------------------------------------------------------------- */
  /* the seam designs. Each: { sel, key, build(root), update(p, ctx) }        */
  /* ----------------------------------------------------------------------- */
  const D = [];

  /* 1 · Home → About : the camera dives into the medallion */
  D.push({
    sel: ".ab-pin-wrap, #about", key: "about",
    build(el) {
      el.classList.add("sm-s1");
      this.v1 = mk("sm-v1", el); this.v2 = mk("sm-v2", el);
      this.r = [1, 2, 3].map((n) => mk("sm-rg r" + n, el, null, "i"));
      this.tm = mk("sm-tm", el, "TM", "b"); this.lab = mk("sm-lab", el);
    },
    update(p) {
      const a = eio(seg(p, 0, 0.5)), b = eio(seg(p, 0.5, 1));
      show(this.v1, p < 0.5); show(this.v2, p >= 0.5);
      this.v1.style.clipPath = `circle(${lerp(0, 62, a).toFixed(2)}vmax at 50% 50%)`;
      const h = lerp(0, 62, b).toFixed(2);
      const m = `radial-gradient(circle at 50% 50%,transparent ${h}vmax,#000 ${(+h + 4).toFixed(2)}vmax)`;
      this.v2.style.webkitMaskImage = m; this.v2.style.maskImage = m;
      this.r.forEach((r, i) => {
        const s = lerp(0.15, 7 + i * 3, eio(clamp(p * 1.05 - i * 0.04)));
        put(r, `scale(${s.toFixed(3)})`); r.style.opacity = (bell(p) * 0.95).toFixed(3);
      });
      put(this.tm, `scale(${lerp(0.7, 6.5, ei(seg(p, 0.08, 0.5))).toFixed(3)})`);
      this.tm.style.opacity = (seg(p, 0.02, 0.15) * (1 - seg(p, 0.34, 0.5))).toFixed(3);
      this.lab.textContent = label("about"); this.lab.style.opacity = (seg(p, 0.3, 0.45) * (1 - seg(p, 0.55, 0.7))).toFixed(3);
    },
  });

  /* 2 · About → Services : the page turns over */
  D.push({
    sel: "#services", key: "services",
    build(el) {
      el.classList.add("sm-s2");
      const face = (cls) => {
        const p = mk("sm-pg " + cls, el);
        mk("sm-grid", p); const big = mk("sm-big", p); mk("sm-shade", p); mk("sm-edge", p); return { p, big, shade: p.querySelector(".sm-shade") };
      };
      this.A = face("sm-pgA"); this.B = face("sm-pgB"); this.lab = mk("sm-lab", el);
    },
    update(p) {
      const a = eio(seg(p, 0, 0.5)), b = eio(seg(p, 0.5, 1));
      const t = word("services");
      [this.A, this.B].forEach((f) => { if (f.big.dataset.t !== t) { f.big.textContent = WORDS.services[2] + " " + t; f.big.dataset.t = t; f.big.style.fontSize = "clamp(50px,11vw,170px)"; } });
      show(this.A.p, p < 0.5); show(this.B.p, p >= 0.5);
      put(this.A.p, `rotateX(${lerp(-90, 0, a).toFixed(2)}deg)`);
      this.A.shade.style.opacity = (1 - a) * 0.85;
      put(this.B.p, `rotateX(${lerp(0, 90, b).toFixed(2)}deg)`);
      this.B.shade.style.opacity = b * 0.85;
      this.lab.textContent = ""; // the big word is the label here
    },
  });

  /* 3 · Services → Work : direction change, a slab sweeps across horizontally */
  D.push({
    sel: "#work", key: "work",
    build(el) {
      el.classList.add("sm-s3");
      this.sA = mk("sm-slab sm-slA", el); this.spd = mk("sm-spd", this.sA); this.big = mk("sm-big", this.sA);
      this.sB = mk("sm-slab sm-slB", el); this.ln = mk("sm-slL sm-slab", el); this.ln.style.width = "6px"; this.ln.style.left = "0"; this.lab = mk("sm-lab", el);
    },
    update(p) {
      const dir = isRtl() ? -1 : 1;
      const e = eio(p);
      const x = lerp(112, -112, e) * dir;               // % of slab width (150% of screen)
      put(this.sA, `translateX(${x.toFixed(2)}%) skewX(${(-14 * dir).toFixed(1)}deg)`);
      put(this.sB, `translateX(${(x - 5 * dir).toFixed(2)}%) skewX(${(-14 * dir).toFixed(1)}deg)`);
      const edge = -25 + x * 1.5;                                     // vw: slab is 150vw wide, left -25vw
      this.ln.style.left = (dir > 0 ? edge : 100 - edge) + "vw"; this.ln.style.opacity = bell(p) > 0.04 ? 1 : 0;
      const t = word("work");
      if (this.big.dataset.t !== t) { this.big.textContent = t; this.big.dataset.t = t; }
      put(this.big, `translateX(${(lerp(30, -30, e) * dir).toFixed(2)}%) skewX(${14 * dir}deg)`);
      this.big.style.left = "50%"; this.big.style.top = "50%";
      this.lab.textContent = label("work"); this.lab.style.opacity = (bell(seg(p, 0.25, 0.75)) ** 2).toFixed(3);
    },
  });

  /* 4 · Work → Beyond : light splits the screen */
  D.push({
    sel: "#cinema", key: "beyond",
    build(el) {
      el.classList.add("sm-s4");
      this.T = mk("sm-hf sm-hfT", el); this.B = mk("sm-hf sm-hfB", el);
      this.fl = mk("sm-fl", el); this.ln = mk("sm-ln", el); this.wh = mk("sm-wh", el); this.lab = mk("sm-lab", el);
    },
    update(p) {
      const inn = eo(seg(p, 0.02, 0.42)), out = eio(seg(p, 0.58, 1));
      const y = p < 0.5 ? lerp(-100, 0, inn) : lerp(0, -100, out);
      const y2 = p < 0.5 ? lerp(100, 0, inn) : lerp(0, 100, out);
      put(this.T, `translateY(${y.toFixed(2)}%)`); put(this.B, `translateY(${y2.toFixed(2)}%)`);
      const ln = eo(seg(p, 0.3, 0.5)) * (1 - seg(p, 0.55, 0.72));
      put(this.ln, `scaleX(${ln.toFixed(3)})`); this.ln.style.opacity = ln.toFixed(3);
      const f = clamp(1 - Math.abs(p - 0.5) / 0.12);
      this.fl.style.opacity = (f).toFixed(3); put(this.fl, `scaleX(${(0.4 + f * 1.2).toFixed(3)})`);
      this.wh.style.opacity = (Math.max(0, 1 - Math.abs(p - 0.5) / 0.045) * 0.26).toFixed(3);
      this.lab.textContent = label("beyond"); this.lab.style.opacity = (seg(p, 0.38, 0.5) * (1 - seg(p, 0.5, 0.66))).toFixed(3);
    },
  });

  /* 5 · Beyond → AI Creation : the last frame shatters into the image wall */
  const COLS = 10, ROWS = 6;
  D.push({
    sel: "#creation", key: "creation",
    build(el) {
      el.classList.add("sm-s5");
      this.t = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const e = mk("sm-tl" + ((r * 7 + c * 3) % 11 === 0 ? " hi" : ""), el);
        e.style.cssText += `left:${(c * 100) / COLS - 0.05}%;top:${(r * 100) / ROWS - 0.05}%;width:${100 / COLS + 0.1}%;height:${100 / ROWS + 0.1}%;`;
        const dx = (c + 0.5) / COLS - 0.5, dy = (r + 0.5) / ROWS - 0.5;
        this.t.push({ e, d: Math.min(1, Math.hypot(dx, dy) * 1.45), rz: (rnd() - 0.5) * 70, rx: (rnd() - 0.5) * 90, ry: (rnd() - 0.5) * 90, x: dx, y: dy, k: rnd() });
      }
      this.lab = mk("sm-lab", el);
    },
    update(p) {
      const A = seg(p, 0, 0.5), B = seg(p, 0.5, 1), K = 0.55;
      for (const t of this.t) {
        if (p < 0.5) {
          const l = eo(clamp(A * (1 + K) - (1 - t.d) * K * 0.0 - t.k * K * 0.6 - t.d * K * 0.4));
          const z = lerp(900, 0, l);
          put(t.e, `translate3d(${(t.x * 40 * (1 - l)).toFixed(1)}vw,${(t.y * 40 * (1 - l)).toFixed(1)}vh,${z.toFixed(0)}px) rotateX(${(t.rx * (1 - l)).toFixed(1)}deg) rotateY(${(t.ry * (1 - l)).toFixed(1)}deg) rotateZ(${(t.rz * (1 - l)).toFixed(1)}deg)`);
          t.e.style.opacity = clamp(l * 1.6).toFixed(3);
        } else {
          const l = ei(clamp(B * (1 + K) - (1 - t.d) * K - t.k * 0.25));
          put(t.e, `translate3d(${(t.x * 18 * l).toFixed(1)}vw,${(l * 120).toFixed(1)}vh,${(-l * 500).toFixed(0)}px) rotateX(${(t.rx * l).toFixed(1)}deg) rotateZ(${(t.rz * l).toFixed(1)}deg)`);
          t.e.style.opacity = (1 - clamp(l * 1.15)).toFixed(3);
        }
      }
      this.lab.textContent = label("creation"); this.lab.style.opacity = (seg(p, 0.35, 0.5) * (1 - seg(p, 0.5, 0.62))).toFixed(3);
    },
  });

  /* 6 · AI Creation → Before/After : a light line sweeps; it ends as the slider handle */
  D.push({
    sel: "#beforeafter", key: "ba",
    build(el) {
      el.classList.add("sm-s6");
      this.v = mk("sm-cv", el); this.v.style.left = "0"; this.v.style.right = "0";
      this.L = mk("sm-cv", el); this.R = mk("sm-cv", el);
      this.ln = mk("sm-cl", el); this.cg = mk("sm-cg", el); this.lab = mk("sm-lab", el);
    },
    update(p) {
      const stage = $(".ba-stage"); let cx = 50;
      if (stage) { const r = stage.getBoundingClientRect(); if (r.width) cx = clamp(((r.left + r.width / 2) / innerWidth) * 100, 20, 80); }
      const dir = isRtl() ? -1 : 1;
      if (p < 0.5) {
        const x = lerp(0, 100, eio(seg(p, 0, 0.5)));
        show(this.v, true); show(this.L, false); show(this.R, false);
        const px = dir > 0 ? x : 100 - x;
        this.v.style.clipPath = dir > 0 ? `inset(0 ${(100 - x).toFixed(2)}% 0 0)` : `inset(0 0 0 ${(100 - x).toFixed(2)}%)`;
        this.ln.style.left = px + "%"; this.cg.style.left = px + "%";
        this.ln.style.opacity = (1 - seg(p, 0.46, 0.5)).toFixed(3); this.cg.style.opacity = this.ln.style.opacity;
      } else {
        const b = eio(seg(p, 0.52, 0.94));
        show(this.v, false); show(this.L, true); show(this.R, true);
        this.L.style.left = "0"; this.L.style.width = cx + "%"; this.L.style.right = "auto"; this.L.style.transformOrigin = "0 50%"; put(this.L, `scaleX(${(1 - b).toFixed(3)})`);
        this.R.style.left = cx + "%"; this.R.style.width = 100 - cx + "%"; this.R.style.transformOrigin = "100% 50%"; put(this.R, `scaleX(${(1 - b).toFixed(3)})`);
        this.ln.style.left = cx + "%"; this.cg.style.left = cx + "%";
        const o = seg(p, 0.5, 0.58) * (1 - seg(p, 0.9, 1));
        this.ln.style.opacity = o.toFixed(3); this.cg.style.opacity = (o * 0.8).toFixed(3);
      }
      this.lab.textContent = label("ba"); this.lab.style.opacity = (seg(p, 0.3, 0.45) * (1 - seg(p, 0.5, 0.6))).toFixed(3);
    },
  });

  /* 7 · Before/After → Process : spin 90° into the film strip */
  D.push({
    sel: "#process", key: "process",
    build(el) {
      el.classList.add("sm-s7");
      this.rl = mk("sm-rl", el); this.big = mk("sm-big", this.rl);
      this.fr = mk("sm-fr", el); this.fr.innerHTML = Array.from({ length: 9 }, (_, i) => `<i style="left:${i * 24 - 8}%"></i>`).join(""); this.lab = mk("sm-lab", el);
    },
    update(p) {
      const a = eio(seg(p, 0, 0.5)), b = eio(seg(p, 0.5, 1));
      const rot = p < 0.5 ? lerp(90, 0, a) : lerp(0, -90, b);
      const sc = p < 0.5 ? lerp(0.12, 1, a) : lerp(1, 2.8, ei(b));
      put(this.rl, `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`);
      this.rl.style.opacity = (p < 0.5 ? clamp(a * 3) : 1 - ei(b)).toFixed(3);
      const t = word("process");
      if (this.big.dataset.t !== t) { this.big.textContent = t; this.big.dataset.t = t; this.big.style.fontSize = "clamp(60px,10vw,160px)"; }
      const dir = isRtl() ? -1 : 1;
      const fx = lerp(-60, 60, eio(seg(p, 0.3, 0.95))) * dir;
      put(this.fr, `translateX(${fx.toFixed(2)}%)`); this.fr.style.opacity = (bell(seg(p, 0.28, 0.95)) ** 0.6).toFixed(3);
      this.lab.textContent = label("process"); this.lab.style.opacity = (seg(p, 0.36, 0.5) * (1 - seg(p, 0.5, 0.62))).toFixed(3);
    },
  });

  /* 8 · Process → Find Me : marquee words rain down, the cards open as a fan */
  const RAIN = ["BRIEF ✦ DIRECTION ✦ CREATION", "SCRIPT ✦ DESIGN ✦ MOTION", "EDIT ✦ SOUND ✦ DELIVERY", "IDEA ✦ FRAME ✦ FINISH"];
  const RAIN_AR = ["فكرة ✦ اتجاه ✦ إبداع", "سيناريو ✦ تصميم ✦ حركة", "مونتاج ✦ صوت ✦ تسليم", "لقطة ✦ لمسة ✦ تسليم"];
  D.push({
    sel: "section.social-strip.fm, .social-strip.fm", key: "fm",
    win: [0.98, 0.5], nomagnet: true,      /* Find Me is a short strip with its own fan of live links: finish before it opens, never cover it */
    build(el) {
      el.classList.add("sm-s8");
      this.v = mk("sm-vl", el); this.cols = [];
      const N = 11;
      for (let i = 0; i < N; i++) {
        const c = mk("sm-rn" + (i % 4 === 1 ? " f" : ""), el);
        c.style.left = `${(i + 0.5) * (100 / N)}%`;
        this.cols.push({ e: c, d: rnd() * 0.35, i });
      }
      this.bl = [];
      this.lab = mk("sm-lab", el);
    },
    update(p) {
      const ar = isRtl();
      this.v.style.opacity = (0.55 * bell(clamp(p / 0.95)) ** 0.8).toFixed(3);
      const rain = seg(p, 0, 0.82);
      for (const c of this.cols) {
        const l = eio(clamp(rain * 1.5 - c.d));
        const t = (ar ? RAIN_AR : RAIN)[c.i % 4];
        if (c.e.dataset.t !== t) { c.e.textContent = t; c.e.dataset.t = t; }
        put(c.e, `translateY(${lerp(-115, 115, l).toFixed(1)}%)`);
        c.e.style.opacity = (bell(l) * 1.4).toFixed(3);
      }
      this.lab.textContent = label("fm"); this.lab.style.opacity = (seg(p, 0.3, 0.45) * (1 - seg(p, 0.6, 0.78))).toFixed(3);
    },
  });

  /* 9a · Find Me → Brief : the ticket sweeps in; 9b · Brief → Contact : it lands in the number */
  const ticketHTML = '<i class="sm-gl"></i><b>TM</b><span class="tkl"></span><u></u><em class="tkn">No.0001</em>';
  const setTk = (tk) => { const sp = tk.querySelector(".tkl"); const t = isRtl() ? "ملخّص المشروع" : "PROJECT BRIEF"; if (sp.textContent !== t) sp.textContent = t; };
  D.push({
    sel: ".sc-brief, #brief", key: "brief",
    win: [0.36, -0.05],                    /* starts only after the Find Me strip has mostly scrolled away */
    build(el) {
      el.classList.add("sm-s9");
      this.vt = mk("sm-vt", el);
      this.g = [0.1, 0.05].map(() => { const g = mk("sm-tk sm-tg", el, ticketHTML); return g; });
      this.tk = mk("sm-tk", el, ticketHTML); this.lab = mk("sm-lab", el);
    },
    update(p) {
      this.vt.style.opacity = (0.82 * bell(seg(p, 0.05, 0.95))).toFixed(3);
      const dir = isRtl() ? -1 : 1;
      const place = (el, q, off) => {
        q = clamp(q);
        const e = eio(q);
        const x = lerp(-70, 70, e) * dir, y = lerp(55, -55, e) + Math.sin(e * Math.PI) * -6;
        const s = 0.55 + Math.sin(e * Math.PI) * 1.05;
        put(el, `translate3d(${x.toFixed(2)}vw,${y.toFixed(2)}vh,${(Math.sin(e * Math.PI) * 120).toFixed(0)}px) rotateY(${(lerp(70, -70, e) * dir).toFixed(1)}deg) rotateX(${lerp(24, -16, e).toFixed(1)}deg) rotateZ(${(lerp(-24, 18, e) * dir).toFixed(1)}deg) scale(${s.toFixed(3)})`);
        el.style.opacity = (q > 0.001 && q < 0.999 ? 1 : 0).toFixed(0) * (off || 1);
      };
      place(this.tk, seg(p, 0.06, 0.94), 1);
      this.g.forEach((g, i) => { setTk(g); place(g, seg(p, 0.06, 0.94) - (i + 1) * 0.07, 0.35 - i * 0.12); });
      setTk(this.tk);
      this.lab.textContent = label("brief"); this.lab.style.opacity = (seg(p, 0.55, 0.7) * (1 - seg(p, 0.82, 0.95))).toFixed(3);
    },
  });

  D.push({
    sel: "#contact", key: "contact",
    build(el) {
      el.classList.add("sm-s9");
      this.vt = mk("sm-vt", el); this.tk = mk("sm-tk", el, ticketHTML); this.pu = mk("sm-pu", el); this.lab = mk("sm-lab", el);
    },
    update(p) {
      setTk(this.tk);
      const btn = $("#contact .contact-btn") || $("#contact a") || $("#contact");
      const r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight * 0.6, width: 0, height: 0 };
      const tx = clamp(r.left + r.width / 2, 0, innerWidth), ty = clamp(r.top + r.height / 2, 0, innerHeight);
      const dx = tx - innerWidth / 2, dy = ty - innerHeight / 2, dir = isRtl() ? -1 : 1;
      this.vt.style.opacity = (0.7 * bell(seg(p, 0.05, 0.85))).toFixed(3);
      const q = seg(p, 0.05, 0.78), e = eio(q);
      const sx = 62 * dir, sy = -62;                         // start: top-right, off screen
      const x = lerp(sx * innerWidth / 100, dx, e), y = lerp(sy * innerHeight / 100, dy, eo(q));
      const s = lerp(1.7, 0.16, ei(q) * 0.65 + e * 0.35);
      put(this.tk, `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${(lerp(160, 0, e)).toFixed(0)}px) rotateY(${lerp(-60 * dir, 0, e).toFixed(1)}deg) rotateX(${lerp(-20, 0, e).toFixed(1)}deg) rotateZ(${(lerp(26 * dir, 0, e)).toFixed(1)}deg) scale(${s.toFixed(3)})`);
      this.tk.style.opacity = (q > 0.001 ? 1 - seg(p, 0.76, 0.84) : 0).toFixed(3);
      const hit = seg(p, 0.76, 1);
      this.pu.style.left = tx + "px"; this.pu.style.top = ty + "px";
      put(this.pu, `scale(${lerp(0.1, 1.4, eo(hit)).toFixed(3)})`); this.pu.style.opacity = (hit > 0 ? 1 - hit : 0).toFixed(3);
      this.lab.textContent = label("contact"); this.lab.style.opacity = (seg(p, 0.3, 0.45) * (1 - seg(p, 0.55, 0.7))).toFixed(3);
    },
  });

  /* calm — phones / reduced motion ------------------------------------------ */
  const calm = (() => {
    const el = mk("sm-s sm-s0", root); mk("sm-z", el); const lab = mk("sm-lab", el);
    return { el, z: el.querySelector(".sm-z"), lab };
  })();

  /* wire up ------------------------------------------------------------------ */
  const seams = D.map((d, i) => {
    const el = mk("sm-s sm-s-" + i, root);
    d.build(el);
    return { d, el, i, target: null, p: 0, on: false };
  });
  const resolve = (s) => { const t = s.d.sel.split(",").map((x) => x.trim()); for (const q of t) { const e = $(q); if (e) return e; } return null; };

  const calmMode = () => matchMedia("(prefers-reduced-motion: reduce)").matches || innerWidth < 820 || matchMedia("(pointer: coarse)").matches;

  let lastY = scrollY, lastT = performance.now(), vel = 0, gate = 1, raf = 0, lastMove = performance.now(), dir = 1, frozen = null, busy = 0;

  const frame = () => {
    raf = 0;
    const now = performance.now(), y = scrollY, vh = innerHeight || 1;
    const dt = Math.max(8, now - lastT);
    const v = ((y - lastY) / dt) * 1000;
    vel += (v - vel) * (1 - Math.exp(-dt / 90)); lastY = y; lastT = now;
    if (Math.abs(v) > 1) { lastMove = now; if (Math.abs(v) > 4) dir = v > 0 ? 1 : -1; }
    const fast = clamp((Math.abs(vel) - CFG.fastPx) / CFG.fastSpan);
    gate += ((1 - fast) - gate) * (1 - Math.exp(-dt / 70));
    root.style.opacity = gate.toFixed(3);

    const cm = calmMode();
    let any = false, calmP = 0, calmKey = null, active = null;
    for (const s of seams) {
      if (!s.target || !s.target.isConnected) s.target = resolve(s);
      let p = 0;
      if (s.target) {
        const w = s.d.win || [CFG.enter, CFG.leave], top = s.target.getBoundingClientRect().top / vh;
        p = clamp((w[0] - top) / (w[0] - w[1]));
      }
      if (frozen && frozen.i === s.i) p = frozen.p;
      s.p = p;
      const live = p > 0.004 && p < 0.996;
      if (live) { any = true; active = active || s; }
      if (cm) {
        if (s.on) { s.el.style.visibility = "hidden"; s.on = false; }
        if (live && bell(p) > calmP) { calmP = bell(p); calmKey = s.d.key; }
        continue;
      }
      if (live) {
        if (!s.on) { s.el.style.visibility = "visible"; s.on = true; }
        s.d.update(p);
      } else if (s.on) { s.el.style.visibility = "hidden"; s.on = false; }
    }
    if (cm) {
      calm.el.style.visibility = calmP > 0 ? "visible" : "hidden";
      if (calmP > 0) {
        calm.el.style.opacity = (calmP * 0.9).toFixed(3);
        put(calm.z, `scaleX(${calmP.toFixed(3)})`);
        calm.lab.textContent = calmKey ? label(calmKey) : ""; calm.lab.style.opacity = (calmP ** 2).toFixed(3);
      }
    } else if (calm.el.style.visibility !== "hidden") calm.el.style.visibility = "hidden";

    /* keep the loop alive only while something is moving */
    if (any || Math.abs(vel) > 2 || Math.abs(gate - 1) > 0.01) schedule();

    /* magnet: stopped in the dead centre of a seam → glide on in the scroll direction */
    if (CFG.magnet && !cm && active && !active.d.nomagnet && !frozen && !busy && now - lastMove > CFG.magnetIdle && Math.abs(vel) < 4) {
      const p = active.p;
      if (p > 0.1 && p < 0.9 && !document.body.classList.contains("lightbox-open")) {
        const abs = active.target.getBoundingClientRect().top + scrollY;
        const w = active.d.win || [CFG.enter, CFG.leave];
        const goal = dir > 0 ? abs - w[1] * vh + 2 : abs - w[0] * vh - 2;
        busy = 1; setTimeout(() => { busy = 0; }, 1400);
        const L = window.__lenis;
        if (L && L.scrollTo) L.scrollTo(goal, { duration: 1.0, lock: false });
        else window.scrollTo({ top: goal, behavior: "smooth" });
      }
    }
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule, { passive: true });
  document.addEventListener("visibilitychange", schedule);
  schedule();

  window.__seams = {
    CFG, count: seams.length,
    set(i, p) { frozen = i == null ? null : { i, p }; schedule(); },
    state() { return seams.map((s) => +s.p.toFixed(3)); },
  };
})();
