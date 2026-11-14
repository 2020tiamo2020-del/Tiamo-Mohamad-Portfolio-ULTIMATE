/* =====================================================================
   SEAMS — 9 cinematic transitions between sections (Process → Find Me is done by the real Find Me cards, see findme-fan.js).
   - Each seam is scrubbed by the page scroll (reversible, no wheel-hijack).
   - Everything is drawn on ONE fixed canvas (#seamsCv); sections are never transformed.
   - The canvas is only visible/drawn while a boundary is crossing the screen.
   - If the visitor stops scrolling, the overlay dissolves after ~0.2s so content is never left covered.
   - Fast jumps (nav links) fade the effect out instead of flashing through every seam.
   - Desktop + mouse only; off for touch, <=900px and prefers-reduced-motion.
   - Add ?noseams to the URL to compare with the effect switched off.
   ===================================================================== */
(() => {
  "use strict";
  if (window.__tmSeams) return;
  if (/[?&]noseams/.test(location.search)) return;
  window.__tmSeams = true;

  const mqDesk = matchMedia("(min-width:901px) and (hover:hover) and (pointer:fine)");
  const mqRed = matchMedia("(prefers-reduced-motion: reduce)");
  const on = () => mqDesk.matches && !mqRed.matches;

  const TAU = Math.PI * 2;
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sub = (p, a, b) => clamp01((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const dk = a => "rgba(5,4,10," + a + ")";
  const GOLD = a => "rgba(243,231,196," + a + ")";
  const LILAC = a => "rgba(201,168,255," + a + ")";
  const pad2 = n => (n < 10 ? "0" : "") + n;
  const isAr = () => document.documentElement.lang === "ar";

  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mk = (n, k, seed) => { const r = rng(seed), a = []; for (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < k; j++) row.push(r()); a.push(row); } return a; };
  const STREAK = mk(44, 4, 11), STARS = mk(120, 3, 23), DEBRIS = mk(70, 3, 37);

  function rr(c, x, y, w, h, r) {            // rounded-rect sub-path (no beginPath)
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function poly(c, cx, cy, r, n, rot) {      // regular polygon sub-path
    for (let k = 0; k < n; k++) { const a = rot + k * TAU / n, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath();
  }
  const mix = (a, b, t) => "rgb(" + Math.round(lerp(a[0], b[0], t)) + "," + Math.round(lerp(a[1], b[1], t)) + "," + Math.round(lerp(a[2], b[2], t)) + ")";

  /* ---------------------------------------------------------------- 0  HOME → ABOUT
     anamorphic letterbox: cinema bars close to a slit, a blue anamorphic flare blooms along it,
     the chapter title lights up, then the bars open onto About */
  function dCine(c, W, H, p, g) {
    const cx = W / 2, cy = H / 2, half = H / 2 - 1.5;
    const close = ease(sub(p, 0, .38)), open = ease(sub(p, .62, 1));
    const b = half * (p < .5 ? close : 1 - open);
    const fl = ease(sub(p, .28, .5)) * (1 - ease(sub(p, .62, .82)));
    if (b > .5) for (let k = 0; k < 2; k++) {         // top bar, bottom bar
      const e = k ? H - b : b;
      c.fillStyle = dk(.99); c.fillRect(-2, k ? e : -2, W + 4, b + 2);
      const gr = c.createLinearGradient(0, e, 0, e + (k ? -60 : 60));
      gr.addColorStop(0, "rgba(90,150,255," + (.28 * (.25 + fl)) + ")"); gr.addColorStop(1, "rgba(90,150,255,0)");
      c.fillStyle = gr; c.fillRect(0, k ? e - 60 : e, W, 60);
      c.fillStyle = GOLD(.55); c.fillRect(0, k ? e : e - 1.5, W, 1.5);
    }
    if (fl > .002) {
      const L = W * (.12 + .46 * fl);
      c.save(); c.translate(cx, cy); c.scale(1, .05);
      const rg = c.createRadialGradient(0, 0, 0, 0, 0, W * .5);
      rg.addColorStop(0, "rgba(190,225,255," + (.75 * fl) + ")"); rg.addColorStop(.35, "rgba(70,140,255," + (.35 * fl) + ")"); rg.addColorStop(1, "rgba(70,140,255,0)");
      c.fillStyle = rg; c.beginPath(); c.arc(0, 0, W * .5, 0, TAU); c.fill(); c.restore();
      const lg = c.createLinearGradient(cx - L, 0, cx + L, 0);
      lg.addColorStop(0, "rgba(22,216,255,0)"); lg.addColorStop(.5, "rgba(255,255,255," + fl + ")"); lg.addColorStop(1, "rgba(22,216,255,0)");
      c.fillStyle = lg; c.fillRect(cx - L, cy - 1.5 - 2 * fl, L * 2, 3 + 4 * fl);
      const gh = [[-.32, 5, "139,53,255"], [-.17, 12, "22,216,255"], [.13, 8, "243,231,196"], [.27, 16, "139,53,255"], [.4, 6, "22,216,255"]];
      for (let i = 0; i < gh.length; i++) {
        const x = cx + gh[i][0] * W * fl + (p - .5) * 40 * (i % 2 ? 1 : -1), r = gh[i][1] * (.6 + fl);
        const og = c.createRadialGradient(x, cy, 0, x, cy, r);
        og.addColorStop(0, "rgba(" + gh[i][2] + "," + (.5 * fl) + ")"); og.addColorStop(1, "rgba(" + gh[i][2] + ",0)");
        c.fillStyle = og; c.beginPath(); c.arc(x, cy, r, 0, TAU); c.fill();
      }
    }
    const ta = sub(p, .42, .54) * (1 - sub(p, .6, .7));
    if (ta > .01 && g.title) {
      const fs = Math.min(W, H) * .075, ga = c.globalAlpha;
      c.globalAlpha = ga * ta; c.textAlign = "center"; c.textBaseline = "alphabetic";
      try { c.letterSpacing = isAr() ? "0px" : Math.round(fs * .45) + "px"; } catch (e) {}
      c.font = "600 " + fs + "px Cinzel,'Instrument Serif',serif"; c.fillStyle = GOLD(1);
      c.fillText(g.title, cx + (isAr() ? 0 : fs * .22), cy - H * .055 - (1 - ta) * 14);
      if (g.num) { try { c.letterSpacing = "6px"; } catch (e) {} c.font = "600 13px Inter,sans-serif"; c.fillStyle = LILAC(.9); c.fillText(g.num, cx, cy + H * .085 + (1 - ta) * 14); }
      try { c.letterSpacing = "0px"; } catch (e) {}
      c.globalAlpha = ga;
    }
  }

  /* ---------------------------------------------------------------- 2  SERVICES → WORK  dolly-through */
  function dDolly(c, W, H, p, g) {
    const cx = W / 2, cy = H / 2, diag = Math.hypot(W, H);
    const fin = sub(p, 0, .14), grow = ease(sub(p, .12, .92)), hs = lerp(.05, 2.4, grow);
    const hw = W * hs, hh = H * hs;
    c.save();
    c.beginPath(); c.rect(-2, -2, W + 4, H + 4); rr(c, cx - hw / 2, cy - hh / 2, hw, hh, 40 * hs);
    c.fillStyle = dk(.97 * fin); c.fill("evenodd"); c.clip("evenodd");
    c.lineCap = "round";
    for (let i = 0; i < STARS.length; i++) {
      const s = STARS[i], ang = s[0] * TAU, t = (s[1] + p * (1.2 + s[2])) % 1;
      const r = Math.pow(t, 2.2) * diag * .6, len = 6 + t * t * 150, ca = Math.cos(ang), sa = Math.sin(ang);
      c.strokeStyle = (i % 4 ? LILAC : GOLD)(.12 + .75 * t); c.lineWidth = .6 + t * 2;
      c.beginPath(); c.moveTo(cx + ca * r, cy + sa * r); c.lineTo(cx + ca * (r + len), cy + sa * (r + len)); c.stroke();
    }
    const ks = [1.22, 1.55, 2, 2.6];
    for (let i = 0; i < ks.length; i++) {
      c.beginPath(); rr(c, cx - hw * ks[i] / 2, cy - hh * ks[i] / 2, hw * ks[i], hh * ks[i], 40 * hs * ks[i]);
      c.lineWidth = 1.5; c.strokeStyle = GOLD(.5 / ks[i]); c.stroke();
    }
    const spread = ease(sub(p, .1, .9)), sc = .25 + ease(sub(p, .05, .9)) * 2.6;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + .4, d = spread * 1.2 * diag * .5 * (.9 + .1 * (i % 2));
      const cw = W * .11 * sc, ch = cw * 1.38;
      c.save(); c.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .8); c.rotate((a - Math.PI / 2) * .1);
      c.beginPath(); rr(c, -cw / 2, -ch / 2, cw, ch, 10 * sc);
      c.fillStyle = "rgba(139,53,255,.32)"; c.fill(); c.lineWidth = 1.5; c.strokeStyle = GOLD(.55); c.stroke();
      c.restore();
    }
    c.restore();
  }

  /* ---------------------------------------------------------------- 3  WORK → BEYOND  lens aperture + flash */
  function dAperture(c, W, H, p, g) {
    const cx = W / 2, cy = H / 2, R0 = Math.hypot(W, H) * .62, n = 8, rot = p * 1.1;
    const r = R0 * Math.pow(Math.abs(Math.cos(Math.PI * p)), 1.7) + 2;
    c.beginPath(); c.rect(-2, -2, W + 4, H + 4); poly(c, cx, cy, r, n, rot);
    c.fillStyle = dk(.985); c.fill("evenodd");
    c.save(); c.beginPath(); c.rect(-2, -2, W + 4, H + 4); poly(c, cx, cy, r, n, rot); c.clip("evenodd");
    c.strokeStyle = "rgba(255,255,255,.09)"; c.lineWidth = 1;
    for (let k = 0; k < n; k++) { const a = rot + k * TAU / n; c.beginPath(); c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.lineTo(cx + Math.cos(a + .55) * R0 * 1.4, cy + Math.sin(a + .55) * R0 * 1.4); c.stroke(); }
    c.restore();
    c.beginPath(); poly(c, cx, cy, r, n, rot); c.lineWidth = 2; c.strokeStyle = GOLD(.8); c.stroke();
    const f = Math.pow(Math.max(0, 1 - Math.abs(p - .5) / .05), 1.5);
    if (f > 0) { c.fillStyle = "rgba(246,240,255," + (f * .85) + ")"; c.fillRect(0, 0, W, H); }
  }

  /* ---------------------------------------------------------------- 4  BEYOND → CREATION  tilted curtain falls (capped roll) */
  function dRoll(c, W, H, p, g) {
    const ang = .3 * Math.sin(Math.PI * p), Hp = H * 1.25, Wp = W * 1.9, m = Math.sin(.3) * W * .95 + 20;
    const panel = (prog, a, fill, edge) => {
      const y = lerp(-Hp / 2 - m, H + Hp / 2 + m, ease(clamp01(prog)));
      c.save(); c.translate(W / 2, y); c.rotate(a);
      c.fillStyle = fill; c.fillRect(-Wp / 2, -Hp / 2, Wp, Hp);
      if (edge) {
        const eg = c.createLinearGradient(0, Hp / 2 - 90, 0, Hp / 2 + 4);
        eg.addColorStop(0, "rgba(139,53,255,0)"); eg.addColorStop(.9, "rgba(139,53,255,.45)"); eg.addColorStop(1, GOLD(.9));
        c.fillStyle = eg; c.fillRect(-Wp / 2, Hp / 2 - 90, Wp, 94);
      }
      c.restore();
    };
    panel(p - .09, -ang * .6, "rgba(120,60,220,.34)", false);
    panel(p, ang, dk(.985), true);
    c.fillStyle = LILAC(.55);
    for (let i = 0; i < DEBRIS.length; i++) {
      const s = DEBRIS[i], y = (((s[1] + p * (1.5 + s[2] * 2)) % 1.3) - .15) * H, z = 1 + s[2] * 3;
      c.fillRect(s[0] * W, y, z, z * (2 + s[1] * 5));
    }
  }

  /* ---------------------------------------------------------------- 5  CREATION → BEFORE/AFTER  slider line wipe */
  function dWipe(c, W, H, p, g) {
    const pre = sub(p, 0, .22), t = ease(sub(p, .22, .82)), x = lerp(-W * .04, W * 1.05, t);
    if (x < W) { c.fillStyle = dk(.95 * pre); c.fillRect(x, 0, W - x + 2, H); }
    if (p > .15 && p < .9 && x > -4 && x < W + 4) {
      const gl = c.createLinearGradient(x - 110, 0, x, 0); gl.addColorStop(0, "rgba(139,53,255,0)"); gl.addColorStop(1, "rgba(139,53,255,.32)");
      c.fillStyle = gl; c.fillRect(x - 110, 0, 110, H);
      c.fillStyle = GOLD(.95); c.fillRect(x - 1, 0, 2, H);
      const y = H / 2;
      c.beginPath(); c.arc(x, y, 28, 0, TAU); c.fillStyle = dk(.92); c.fill(); c.lineWidth = 2; c.strokeStyle = GOLD(.95); c.stroke();
      c.fillStyle = GOLD(.95);
      c.beginPath(); c.moveTo(x - 7, y - 7); c.lineTo(x - 14, y); c.lineTo(x - 7, y + 7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x + 7, y - 7); c.lineTo(x + 14, y); c.lineTo(x + 7, y + 7); c.closePath(); c.fill();
    }
  }

  /* ---------------------------------------------------------------- 7  FIND ME → BRIEF  card flip */
  function dFlip(c, W, H, p, g) {
    const bell = Math.pow(Math.sin(Math.PI * p), .7);
    c.fillStyle = dk(.92 * bell); c.fillRect(0, 0, W, H);
    const w = Math.min(W * .46, 560), h = w * .62;
    const s = lerp(.55, 1, ease(sub(p, .05, .5))) * (1 + ease(sub(p, .62, .97)) * 1.8);
    const ang = Math.PI * ease(sub(p, .15, .6)), sx = Math.cos(ang), front = ang < Math.PI / 2;
    const ga = c.globalAlpha; c.globalAlpha = ga * (1 - sub(p, .8, .98));
    c.save(); c.translate(W / 2, H / 2); c.scale(s * Math.max(Math.abs(sx), .002), s);
    const gr = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    if (front) { gr.addColorStop(0, "#2a0f55"); gr.addColorStop(1, "#0c0914"); } else { gr.addColorStop(0, "#c9a8ff"); gr.addColorStop(1, "#6d2ad6"); }
    c.beginPath(); rr(c, -w / 2, -h / 2, w, h, 22); c.fillStyle = gr; c.fill(); c.lineWidth = 2; c.strokeStyle = GOLD(.7); c.stroke();
    c.textAlign = "center"; c.textBaseline = "middle";
    if (front) { c.font = "600 " + (h * .42) + "px Cinzel,serif"; c.fillStyle = GOLD(.95); c.fillText("TM", 0, 0); }
    else { c.font = "700 " + (h * .15) + "px Inter,sans-serif"; c.fillStyle = "#12071f"; c.fillText(isAr() ? "ابدأ مشروعك" : "START A BRIEF", 0, 0); }
    c.beginPath(); rr(c, -w / 2, -h / 2, w, h, 22); c.fillStyle = "rgba(0,0,0," + (.55 * (1 - Math.abs(sx))) + ")"; c.fill();
    c.restore(); c.globalAlpha = ga;
  }

  /* chapter caption shown during every seam */
  function drawLabel(c, W, H, p, text) {
    if (!text) return;
    const a = clamp01((Math.sin(Math.PI * p) - .4) / .6); if (a <= .01) return;
    const x = Math.round(W * .05), y = Math.round(H - Math.max(40, H * .065));
    c.save(); c.globalAlpha *= a;
    c.font = "600 12px Inter,sans-serif"; try { c.letterSpacing = isAr() ? "0px" : "5px"; } catch (e) {}
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.fillStyle = GOLD(.9); c.fillText(text, x, y); c.fillRect(x, y - 24, 42, 1);
    c.restore();
  }

  /* ---------------------------------------------------------------- wiring */
  const q = s => document.querySelector(s);
  const SEAMS = [
    { sel: () => q("#work"), d: dDolly, def: ["03 / SELECTED WORK", "03 / \u0623\u0639\u0645\u0627\u0644 \u0645\u062E\u062A\u0627\u0631\u0629"] },
    { sel: () => q("#cinema"), d: dAperture, def: ["BEYOND", "\u0645\u0627 \u0648\u0631\u0627\u0621 \u0627\u0644\u062E\u064A\u0627\u0644"], noKick: true },
    { sel: () => q("#creation"), d: dRoll, def: ["CREATION", "\u0627\u0644\u0625\u0628\u062F\u0627\u0639"] },
  ];
  SEAMS.forEach(s => { s.cur = 0; });

  const cv = document.createElement("canvas");
  cv.id = "seamsCv"; cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1, shown = false, raf = 0, lastT = 0, lastY = scrollY, lastScrollT = 0, amp = 0;

  function size() {
    W = innerWidth; H = innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function hide() { if (shown) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = "none"; shown = false; } }

  function geo(s, el) {
    const kick = el.querySelector && el.querySelector(".section-kicker");
    const txt = kick ? (kick.textContent || "").trim() : "";
    const g = { label: txt || s.def[isAr() ? 1 : 0], num: null, cx: W / 2, cy: H * .42 };
    
    if (s.d === dCine) { const pr = g.label.split("/"); g.num = pr.length > 1 ? pr[0].trim() : ""; g.title = (pr.length > 1 ? pr.slice(1).join("/") : g.label).trim(); }
    return g;
  }

  function frame(t) {
    raf = 0;
    if (!on()) { hide(); return; }
    const dt = Math.min(.05, Math.max(.001, (t - lastT) / 1000 || .016)); lastT = t;
    const y = scrollY, speed = Math.abs(y - lastY) / dt; lastY = y;
    const idle = performance.now() - lastScrollT > 220;
    const tgtAmp = (idle || speed > H * 5.5 || document.body.classList.contains("tm-zoom-lock")) ? 0 : 1;
    amp += (tgtAmp - amp) * (1 - Math.exp(-dt * (tgtAmp ? 6 : 12)));
    const k = 1 - Math.exp(-dt * 14);
    let best = -1, bestBell = 0, unsettled = false;
    for (let i = 0; i < SEAMS.length; i++) {
      const s = SEAMS[i], el = s.sel(); if (!el) continue;
      const top = el.getBoundingClientRect().top;
      const tgt = clamp01((H * .95 - top) / (H * 1.05));
      s.cur += (tgt - s.cur) * k;
      if (Math.abs(tgt - s.cur) > .0008) unsettled = true;
      const bell = Math.sin(Math.PI * s.cur);
      if (s.cur > .003 && s.cur < .997 && bell > bestBell) { best = i; bestBell = bell; }
    }
    if (best >= 0 && amp > .01) {
      const s = SEAMS[best], el = s.sel();
      if (!shown) { cv.style.display = "block"; shown = true; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = amp;
      const g = geo(s, el);
      s.d(ctx, W, H, s.cur, g); if (!s.noLabel) drawLabel(ctx, W, H, s.cur, g.label);
      ctx.globalAlpha = 1;
    } else hide();
    if (best >= 0 || unsettled || amp > .01) raf = requestAnimationFrame(frame);
  }
  function kick() { lastScrollT = performance.now(); if (!raf && on()) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }

  size();
  addEventListener("scroll", kick, { passive: true });
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); kick(); }, 120); });
  const mqc = () => { if (!on()) hide(); else kick(); };
  if (mqDesk.addEventListener) { mqDesk.addEventListener("change", mqc); mqRed.addEventListener("change", mqc); }

  if (window.__TM_SEAMS_TEST) window.__tmSeamsTest = { SEAMS, size, geo, setSize: (w, h) => { W = w; H = h; } };
})();
