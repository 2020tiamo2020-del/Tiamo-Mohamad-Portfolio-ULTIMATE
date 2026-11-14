/* =====================================================================
   SEAMS — 10 cinematic transitions, one per section boundary.
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

  /* ---------------------------------------------------------------- 0  HERO → ABOUT
     the world irises shut onto the medallion, then the dark curtain lifts away upward */
  function dIris(c, W, H, p, g) {
    const diag = Math.hypot(W, H), rmin = Math.min(W, H) * .075;
    const e1 = ease(sub(p, 0, .42)), lift = ease(sub(p, .58, 1));
    let R = lerp(diag, rmin, e1);
    const hold = sub(p, .42, .58); if (hold > 0 && hold < 1) R *= 1 + .14 * Math.sin(hold * Math.PI);
    c.save(); c.translate(0, -lift * H * 1.2);
    c.beginPath(); c.rect(-2, -2, W + 4, H + 4); c.moveTo(g.cx + R, g.cy); c.arc(g.cx, g.cy, R, 0, TAU);
    c.fillStyle = dk(.97); c.fill("evenodd");
    c.beginPath(); c.arc(g.cx, g.cy, R, 0, TAU);
    c.lineWidth = 2; c.strokeStyle = GOLD(.85); c.shadowColor = "rgba(139,53,255,.9)"; c.shadowBlur = 26; c.stroke();
    c.shadowBlur = 0;
    if (lift > .001) {
      const gr = c.createLinearGradient(0, H, 0, H + 150); gr.addColorStop(0, dk(.75)); gr.addColorStop(1, dk(0));
      c.fillStyle = gr; c.fillRect(0, H, W, 150); c.fillStyle = GOLD(.6); c.fillRect(0, H - 1.5, W, 1.5);
    }
    c.restore();
  }

  /* ---------------------------------------------------------------- 1  ABOUT → SERVICES  whip-pan right */
  function dWhip(c, W, H, p, g) {
    const Wp = W * 1.15, x = lerp(0, W + Wp, ease(p)), x0 = x - Wp;
    const gr = c.createLinearGradient(x0, 0, x, 0);
    gr.addColorStop(0, dk(0)); gr.addColorStop(.5, dk(.9)); gr.addColorStop(1, dk(.98));
    c.fillStyle = gr; c.fillRect(x0, 0, Wp, H);
    c.save(); c.beginPath(); c.rect(x0, 0, Wp, H); c.clip();
    const cols = ["201,168,255", "22,216,255", "255,255,255"];
    c.lineCap = "round";
    for (let i = 0; i < STREAK.length; i++) {
      const s = STREAK[i], y = s[0] * H, len = (.18 + s[1] * .6) * W, end = x - s[2] * Wp * .8, st = end - len;
      const lg = c.createLinearGradient(st, 0, end, 0);
      lg.addColorStop(0, "rgba(" + cols[i % 3] + ",0)"); lg.addColorStop(1, "rgba(" + cols[i % 3] + "," + (.22 + s[3] * .5) + ")");
      c.strokeStyle = lg; c.lineWidth = 1 + s[3] * 2.2; c.beginPath(); c.moveTo(st, y); c.lineTo(end, y); c.stroke();
    }
    c.restore();
    const gl = c.createLinearGradient(x - 70, 0, x + 34, 0);
    gl.addColorStop(0, "rgba(139,53,255,0)"); gl.addColorStop(.7, "rgba(139,53,255,.5)"); gl.addColorStop(1, "rgba(139,53,255,0)");
    c.fillStyle = gl; c.fillRect(x - 70, 0, 104, H);
    c.fillStyle = "rgba(22,216,255,.55)"; c.fillRect(x + 2, 0, 2, H);
    c.fillStyle = GOLD(.95); c.fillRect(x - 2, 0, 3, H);
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

  /* ---------------------------------------------------------------- 6  BEFORE/AFTER → PROCESS  elevator descent */
  function dElev(c, W, H, p, g) {
    const bell = Math.pow(Math.sin(Math.PI * p), .8);
    c.fillStyle = dk(.9 * bell); c.fillRect(0, 0, W, H);
    const L = [[34, 1.1, .06, 1], [78, 2.6, .1, 1.4], [170, 5.2, .18, 2]];
    for (let k = 0; k < L.length; k++) {
      const sp = L[k][0], off = (p * L[k][1] * H) % sp;
      c.fillStyle = LILAC(L[k][2] * bell);
      for (let y = -sp + off; y < H; y += sp) { c.fillRect(0, y, W, L[k][3]); if (k > 0) { c.fillRect(W * .05, y, 36 + k * 14, 2); c.fillRect(W * .95 - 36 - k * 14, y, 36 + k * 14, 2); } }
    }
    if (g.num != null) {
      const fs = Math.min(W, H) * .3, t = ease(p);
      c.font = "600 " + fs + "px Cinzel,'Instrument Serif',serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = GOLD(1);
      const ga = c.globalAlpha;
      c.globalAlpha = ga * (1 - t); c.fillText(pad2(Math.max(0, g.num - 1)), W / 2, H / 2 - t * H * .8);
      c.globalAlpha = ga * t; c.fillText(pad2(g.num), W / 2, H / 2 + (1 - t) * H * .8);
      c.globalAlpha = ga;
    }
  }

  /* ---------------------------------------------------------------- 7  PROCESS → FIND ME  card pile fans out */
  function dFan(c, W, H, p, g) {
    const bell = Math.pow(Math.sin(Math.PI * p), .7);
    c.fillStyle = dk(.9 * bell); c.fillRect(0, 0, W, H);
    const cw = Math.min(W * .17, H * .3), ch = cw * 1.42;
    const spread = ease(sub(p, .1, .55)), rise = ease(sub(p, 0, .5)), out = ease(sub(p, .62, 1)), al = 1 - sub(p, .7, .97);
    const ga = c.globalAlpha; c.globalAlpha = ga * al;
    const order = [0, 4, 1, 3, 2];
    for (let k = 0; k < order.length; k++) {
      const i = order[k], a = (i - 2) * .2 * spread, px = W / 2 + (i - 2) * cw * .2 * spread, py = lerp(H * .98, H * .66, rise) - out * H * .6;
      c.save(); c.translate(px, py); c.rotate(a); c.scale(1, .9 + .1 * spread);
      const gr = c.createLinearGradient(0, -ch, 0, 0); gr.addColorStop(0, "rgba(139,53,255,.6)"); gr.addColorStop(1, "rgba(20,8,48,.95)");
      c.beginPath(); rr(c, -cw / 2, -ch, cw, ch, 16); c.fillStyle = gr; c.fill(); c.lineWidth = 1.6; c.strokeStyle = GOLD(.55); c.stroke();
      c.font = "600 " + (cw * .22) + "px Cinzel,serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = GOLD(i === 2 ? .95 : .45);
      c.fillText("TM", 0, -ch / 2);
      c.restore();
    }
    c.globalAlpha = ga;
  }

  /* ---------------------------------------------------------------- 8  FIND ME → BRIEF  card flip */
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

  /* ---------------------------------------------------------------- 9  BRIEF → CONTACT  zoom into the ticket → WhatsApp pill */
  function dTicket(c, W, H, p, g) {
    const bell = Math.pow(Math.sin(Math.PI * p), .6);
    c.fillStyle = dk(.9 * bell); c.fillRect(0, 0, W, H);
    const tw = Math.min(W * .3, 360), th = tw * 1.32, sc = lerp(.5, 1.5, ease(sub(p, 0, .46))), t = ease(sub(p, .44, .8));
    const w = lerp(tw * sc, 300, t), h = lerp(th * sc, 74, t), rad = lerp(26 * sc, h / 2, t);
    const ga = c.globalAlpha; c.globalAlpha = ga * (1 - sub(p, .88, 1));
    c.save(); c.translate(W / 2, H / 2);
    c.beginPath(); rr(c, -w / 2, -h / 2, w, h, rad);
    c.fillStyle = mix([42, 15, 85], [16, 130, 76], t); c.fill(); c.lineWidth = 2; c.strokeStyle = GOLD(.8 - .3 * t); c.stroke();
    const ga2 = c.globalAlpha;
    if (t < .98) {
      c.globalAlpha = ga2 * (1 - t);
      c.font = "600 " + (h * .2) + "px Cinzel,serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = GOLD(.95); c.fillText("TM", 0, -h * .24);
      c.fillStyle = LILAC(.45);
      for (let i = 0; i < 3; i++) c.fillRect(-w * .34, h * .02 + i * h * .1, w * .68 * (1 - i * .18), 3 * sc);
      c.fillStyle = dk(.9 * bell);
      c.beginPath(); c.arc(-w / 2, h * .2, 11 * sc, 0, TAU); c.fill();
      c.beginPath(); c.arc(w / 2, h * .2, 11 * sc, 0, TAU); c.fill();
    }
    if (t > .15) {
      c.globalAlpha = ga2 * sub(t, .35, 1);
      c.font = "700 " + Math.min(h * .34, w * .09) + "px Inter,sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff";
      c.fillText("WhatsApp \u2197", 0, 1);
    }
    c.restore(); c.globalAlpha = ga;
  }

  /* chapter caption shown during every seam */
  function drawLabel(c, W, H, p, text) {
    if (!text) return;
    const a = clamp01((Math.sin(Math.PI * p) - .4) / .6); if (a <= .01) return;
    const x = Math.round(W * .05), y = Math.round(H - Math.max(40, H * .065));
    c.save(); c.globalAlpha *= a;
    c.font = "600 12px Inter,sans-serif"; try { c.letterSpacing = "5px"; } catch (e) {}
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.fillStyle = GOLD(.9); c.fillText(text, x, y); c.fillRect(x, y - 24, 42, 1);
    c.restore();
  }

  /* ---------------------------------------------------------------- wiring */
  const q = s => document.querySelector(s);
  const SEAMS = [
    { sel: () => q(".ab-pin-wrap") || q("#about"), d: dIris, def: ["01 / ABOUT", "01 / \u0639\u0646\u0651\u064A"] },
    { sel: () => q("#services"), d: dWhip, def: ["02 / SERVICES", "02 / \u0627\u0644\u062E\u062F\u0645\u0627\u062A"] },
    { sel: () => q("#work"), d: dDolly, def: ["03 / SELECTED WORK", "03 / \u0623\u0639\u0645\u0627\u0644 \u0645\u062E\u062A\u0627\u0631\u0629"] },
    { sel: () => q("#cinema"), d: dAperture, def: ["BEYOND", "\u0645\u0627 \u0648\u0631\u0627\u0621 \u0627\u0644\u062E\u064A\u0627\u0644"], noKick: true },
    { sel: () => q("#creation"), d: dRoll, def: ["CREATION", "\u0627\u0644\u0625\u0628\u062F\u0627\u0639"] },
    { sel: () => q("#beforeafter"), d: dWipe, def: ["BEFORE / AFTER", "\u0642\u0628\u0644 / \u0628\u0639\u062F"] },
    { sel: () => q("#process"), d: dElev, def: ["06 / PROCESS", "06 / \u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0639\u0645\u0644"] },
    { sel: () => q(".social-strip.fm"), d: dFan, def: ["07 / FIND ME", "07 / \u062A\u062C\u062F\u0646\u064A \u0647\u0646\u0627"] },
    { sel: () => q("#brief"), d: dFlip, def: ["08 / START A PROJECT", "08 / \u0627\u0628\u062F\u0623 \u0645\u0634\u0631\u0648\u0639\u0643"] },
    { sel: () => q("#contact"), d: dTicket, def: ["09 / CONTACT", "09 / \u062A\u0648\u0627\u0635\u0644"] }
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
    const m = (txt || s.def[0]).match(/\d+/); if (m && s.d === dElev) g.num = parseInt(m[0], 10);
    if (s.d === dIris) {
      const o = document.getElementById("tmOrb"), r = o && o.getBoundingClientRect();
      if (r && r.width > 4) { g.cx = Math.min(W * .9, Math.max(W * .1, r.left + r.width / 2)); g.cy = Math.min(H * .85, Math.max(H * .15, r.top + r.height / 2)); }
    }
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
      s.d(ctx, W, H, s.cur, g); drawLabel(ctx, W, H, s.cur, g.label);
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
