/* PAGE FLIGHT (WebGL2) — the round scroll arrow flies a 3D camera over YOUR real page, laid flat on a studio floor.
   Same sequence as the reference video: tilt in -> one continuous glide down the page (floating elements lift toward the camera
   as it passes) -> rise overhead to see the whole page as one strip -> dive into the destination -> floating card + 4 logo tiles
   + brand badge + closing headline -> the real page appears.
   The page pictures come from /flight/*.webp (real captures of your sections) + /flight/flight.json (positions of floating elements).
   Rebuild them with tools/capture-flight.py when you change the design. No library: raw WebGL2.
   If anything is missing (no WebGL2, files not loaded yet) the arrow keeps its normal smooth scroll. */
(() => {
  "use strict";
  const orb = document.getElementById("scrollOrbit");
  if (!orb || window.__pageFlight) return;
  const BASE = (document.currentScript && document.currentScript.src) ? new URL(".", document.currentScript.src).href : "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const SECTIONS = [".hero", "#about", "#services", "#work", "#cinema", "#creation", "#beforeafter", "#process", "#findme", "#brief", "#contact"];

  /* ---------- timeline (ms) ---------- */
  const T = { fadeIn: 250, tilt: 900, glide: 6200, riseA: 5400, riseB: 6600, diveA: 6820, diveB: 7500, cardB: 8500, titleA: 8000, titleB: 8700, jump: 10150, fadeA: 10200, end: 10600 };
  const TILT = 58;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  // glide: ease only at the very start and end, constant speed in between
  const glide = g => { const A = .1, D = .15, n = A / 2 + (1 - A - D) + D / 2; g = clamp(g, 0, 1);
    const f = g < A ? g * g / (2 * A) : g < 1 - D ? A / 2 + (g - A) : A / 2 + (1 - A - D) + ((g - (1 - D)) - Math.pow(g - (1 - D), 2) / (2 * D)); return f / n; };

  /* ---------- mat4 ---------- */
  const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const id = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const tr = (x, y, z) => { const m = id(); m[12] = x; m[13] = y; m[14] = z; return m; };
  const sc = (x, y, z) => { const m = id(); m[0] = x; m[5] = y; m[10] = z; return m; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a), m = id(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a), m = id(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; };
  const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; };

  /* ---------- shaders ---------- */
  const SDF = "float sdr(vec2 q,vec2 h,float r){vec2 d=abs(q)-h+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}";
  const VS = "#version 300 es\nlayout(location=0) in vec2 p;uniform mat4 M;out vec2 uv;out float w;void main(){uv=p+.5;gl_Position=M*vec4(p,0.,1.);w=gl_Position.w;}";
  // page / element: mip-mapped texture, depth-of-field from the real depth, rounded corners, horizon fog
  const FS_TILE = "#version 300 es\nprecision highp float;in vec2 uv;in float w;uniform sampler2D T;uniform vec4 uvr;uniform vec2 size,qoff,qhalf;uniform float rad,F,K,alpha,lift;uniform vec3 fogc;out vec4 o;" + SDF +
    "void main(){vec2 q=(uv-.5)*size+qoff;float d=sdr(q,qhalf,rad);float a=1.-smoothstep(-1.,1.,d);" +
    "float lod=clamp(abs(w-F)/F*K,0.,5.5);vec3 c=textureLod(T,uvr.xy+uv*uvr.zw,lod).rgb;" +
    "c*=1.+lift*.06;c=mix(c,fogc,smoothstep(F*1.5,F*3.8,w)*.92);o=vec4(c,a*alpha);}";
  const FS_SHADOW = "#version 300 es\nprecision highp float;in vec2 uv;in float w;uniform vec2 size,half_;uniform float alpha,rad,blur,F;out vec4 o;" + SDF +
    "void main(){vec2 q=(uv-.5)*size;float d=sdr(q,half_,rad);float a=(1.-smoothstep(-blur,blur*1.5,d))*alpha*(1.-smoothstep(F*1.5,F*3.8,w)*.9);o=vec4(.015,.005,.05,a);}";
  const VS_FS = "#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}";
  const FS_FLOOR = "#version 300 es\nprecision highp float;uniform vec2 res;uniform vec3 c0,c1,c2;out vec4 o;" +
    "void main(){vec2 u=gl_FragCoord.xy/res;float a=res.x/res.y;float g=length((u-vec2(.5,.52))*vec2(a,1.));vec3 c=mix(c0,c1,smoothstep(0.,.55,g));c=mix(c,c2,smoothstep(.4,1.1,g));o=vec4(c,1.);}";
  const VS_OV = "#version 300 es\nlayout(location=0) in vec2 p;uniform vec4 r;out vec2 uv;void main(){uv=p+.5;gl_Position=vec4(r.xy+p*r.zw,0.,1.);}";
  const FS_OV = "#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D T;uniform float alpha;out vec4 o;void main(){vec4 c=texture(T,uv);o=vec4(c.rgb,c.a*alpha);}";
  const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

  /* ---------- preload the captures ---------- */
  let assets = null, loading = false;
  const preload = () => {
    if (loading || assets) return; loading = true;
    fetch(BASE + "flight/flight.json").then(r => r.json()).then(m =>
      Promise.all(m.frames.map(f => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = BASE + f.file; }))).then(imgs => { assets = { m, imgs }; })
    ).catch(() => { loading = false; });
  };
  addEventListener("load", () => setTimeout(preload, 3500));
  orb.addEventListener("pointerenter", preload, { passive: true });

  /* ---------- helpers: canvas textures ---------- */
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const SANS = '500 {s}px Geist, Inter, "Helvetica Neue", Arial, sans-serif', SERIF = 'italic 400 {s}px "Instrument Serif", Georgia, serif';
  const logoTile = (label, g0, g1) => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256; const c = cv.getContext("2d");
    c.fillStyle = "rgba(0,0,0,0)"; c.clearRect(0, 0, 256, 256);
    const g = c.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, g0); g.addColorStop(1, g1);
    rr(c, 6, 6, 244, 244, 56); c.fillStyle = g; c.fill(); c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 4; c.stroke();
    c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "800 " + (label.length > 2 ? 84 : 112) + "px Inter, sans-serif"; c.fillText(label, 128, 138);
    return cv;
  };
  const titleCanvas = (vw, vh, dpr, line1, line2) => {
    const W = Math.round(vw * dpr), H = Math.round(vh * .40 * dpr), cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const c = cv.getContext("2d"); c.scale(dpr, dpr); const w = vw, h = vh * .40, f1 = Math.min(vw * .058, vh * .09), f2 = f1 * 1.18;
    c.textAlign = "center"; c.textBaseline = "alphabetic";
    // brand badge
    c.font = '600 ' + Math.max(13, f1 * .27) + 'px Geist, Inter, sans-serif'; const label = "Tiamo Mohamad"; const bw = c.measureText(label).width + f1 * .62 + 24, bh = f1 * .52, bx = w / 2 - bw / 2, by = 4;
    rr(c, bx, by, bw, bh, bh / 2); c.fillStyle = "rgba(28,20,52,.88)"; c.fill(); c.strokeStyle = "rgba(255,255,255,.22)"; c.lineWidth = 1.2; c.stroke();
    const m = bh * .62, mg = c.createLinearGradient(bx, by, bx + m, by + m); mg.addColorStop(0, "#8b35ff"); mg.addColorStop(1, "#16d8ff");
    rr(c, bx + 8, by + (bh - m) / 2, m, m, m * .28); c.fillStyle = mg; c.fill();
    c.fillStyle = "#fff"; c.font = "800 " + m * .46 + "px Inter, sans-serif"; c.fillText("TM", bx + 8 + m / 2, by + bh / 2 + m * .17);
    c.textAlign = "left"; c.fillStyle = "#f4f0ff"; c.font = '600 ' + Math.max(13, f1 * .27) + 'px Geist, Inter, sans-serif'; c.fillText(label, bx + 8 + m + 9, by + bh / 2 + f1 * .09);
    c.textAlign = "center";
    c.font = SANS.replace("{s}", f1); c.fillStyle = "#ffffff"; c.fillText(line1, w / 2, by + bh + f1 * 1.12);
    c.font = SERIF.replace("{s}", f2); c.fillStyle = "#b99cff"; c.fillText(line2, w / 2, by + bh + f1 * 1.12 + f2 * .98);
    return cv;
  };
  const titleText = up => {
    const el = document.querySelector(up ? ".hero h1" : "#contact h2");
    const dflt = up ? ["Turning ideas into", "visual stories."] : ["Have an idea?", "Let’s make it visual."];
    if (!el) return dflt;
    const em = el.querySelector("em"); const tail = em ? em.textContent.replace(/\s+/g, " ").trim() : "";
    const all = el.textContent.replace(/\s+/g, " ").trim(); const head = tail ? all.replace(tail, "").trim() : all;
    return [head || dflt[0], tail || dflt[1]];
  };


  /* ---------- section cards: the cards that swing in from the left and right in every section ---------- */
  const clip = (x, n) => { x = (x || "").replace(/\s+/g, " ").trim(); return x.length > n ? x.slice(0, n - 1).trim() + "…" : x; };
  const navLabel = el => { const id = el.id || (el.classList.contains("hero") ? "home" : ""); const a = document.querySelector('#nav a[href="#' + id + '"]'); const l = a && (a.querySelector(".nav-home-label") || a); return l ? l.textContent.replace(/\s+/g, " ").trim() : id; };
  const sectionData = (el, i) => {
    const kick = el.querySelector(".section-kicker, .eyebrow span, .fm-k"), head = el.querySelector("h1,h2,.sc-title,.fm-t"), imgs = [];
    el.querySelectorAll("img").forEach(im => { const src = im.currentSrc || im.src; if (!src || /^data:/.test(src) || im.closest(".logo,.lightbox-stage") || !(im.complete && im.naturalWidth >= 90)) return; if (!imgs.some(o => o.src === src)) imgs.push({ src, el: im }); });
    let chips = [...el.querySelectorAll(".sc-tags li,.floating-tag,.service-grid article h3,.sc-chip")].map(n => clip(n.textContent, 26)).filter(Boolean);
    if (!chips.length) chips = [...el.querySelectorAll("h3")].map(n => clip(n.textContent, 26)).filter(Boolean);
    return { i, label: navLabel(el), kicker: clip(kick ? kick.textContent : navLabel(el), 36), titleHTML: head ? head.innerHTML.replace(/<(?!\/?em\b)[^>]*>/g, "") : navLabel(el),
      text: clip((el.querySelector(".lead,.section-title p,.sc-text,.contact p") || {}).textContent, 150), imgs: imgs.slice(0, 3), chips: chips.slice(0, 3) };
  };
  const cover = (c, im, x, y, w, h) => { const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.max(w / iw, h / ih), sw = w / k, sh2 = h / k; c.drawImage(im, (iw - sw) / 2, (ih - sh2) / 2, sw, sh2, x, y, w, h); };
  // one small vector icon per section (drawn, no files)
  const drawIcon = (c, i, x, y, S) => {
    const g = c.createLinearGradient(x, y, x + S, y + S); g.addColorStop(0, "#8b35ff"); g.addColorStop(1, "#16d8ff");
    rr(c, x, y, S, S, S * .28); c.fillStyle = g; c.fill();
    c.save(); c.translate(x + S / 2, y + S / 2); c.strokeStyle = "#fff"; c.fillStyle = "#fff"; c.lineWidth = S * .075; c.lineCap = c.lineJoin = "round"; const u = S * .26;
    switch (i) {
      case 0: c.beginPath(); c.moveTo(0, -u); c.quadraticCurveTo(0, 0, u, 0); c.quadraticCurveTo(0, 0, 0, u); c.quadraticCurveTo(0, 0, -u, 0); c.quadraticCurveTo(0, 0, 0, -u); c.fill(); break;                 // sparkle
      case 1: c.beginPath(); c.arc(0, -u * .35, u * .45, 0, 7); c.stroke(); c.beginPath(); c.arc(0, u * 1.15, u * .95, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); break;                              // person
      case 2: [[-1, -1], [.1, -1], [-1, .1], [.1, .1]].forEach(p => { rr(c, p[0] * u, p[1] * u, u * .9, u * .9, u * .2); c.fill(); }); break;                                                          // grid
      case 3: rr(c, -u, -u * .8, u * 2, u * 1.6, u * .25); c.stroke(); c.beginPath(); c.moveTo(-u * .8, u * .6); c.lineTo(-u * .15, -u * .1); c.lineTo(u * .3, u * .4); c.lineTo(u * .55, u * .1); c.lineTo(u * .8, u * .6); c.stroke(); break; // picture
      case 4: c.beginPath(); c.moveTo(-u * .55, -u * .8); c.lineTo(u * .9, 0); c.lineTo(-u * .55, u * .8); c.closePath(); c.fill(); break;                                                              // play
      case 5: c.beginPath(); c.moveTo(-u, u); c.lineTo(u * .6, -u * .6); c.stroke(); c.beginPath(); c.arc(u * .8, -u * .8, u * .22, 0, 7); c.fill(); break;                                              // wand
      case 6: rr(c, -u, -u * .85, u * 2, u * 1.7, u * .2); c.stroke(); c.beginPath(); c.moveTo(0, -u * .85); c.lineTo(0, u * .85); c.stroke(); break;                                                  // split
      case 7: [[-1, .2], [-.25, -.35], [.5, -.9]].forEach(p => { rr(c, p[0] * u, p[1] * u, u * .5, (1 - p[1]) * u, u * .1); c.fill(); }); break;                                                        // steps
      case 8: c.beginPath(); c.arc(0, -u * .2, u * .75, Math.PI, 0); c.lineTo(0, u * 1.0); c.closePath(); c.stroke(); c.beginPath(); c.arc(0, -u * .2, u * .22, 0, 7); c.fill(); break;                 // pin
      case 9: c.beginPath(); c.moveTo(-u, u); c.lineTo(-u * .75, u * .25); c.lineTo(u * .75, -u * 1.0); c.lineTo(u, -u * .75); c.lineTo(-u * .25, u * .75); c.closePath(); c.stroke(); break;      // pencil
      default: rr(c, -u * .6, -u, u * 1.2, u * 2, u * .3); c.stroke(); c.beginPath(); c.arc(0, u * .65, u * .09, 0, 7); c.fill();                                                                  // phone
    }
    c.restore();
  };
  const CARD_W = 1020, CARD_H = 590;
  const paintCard = (d, frameImg, rtl) => {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = Math.round(1024 * CARD_H / CARD_W); const c = cv.getContext("2d"); const DW = CARD_W, DH = CARD_H; c.scale(cv.width / DW, cv.width / DW);
    let g = c.createLinearGradient(0, 0, DW * .6, DH); g.addColorStop(0, "#1b1232"); g.addColorStop(.55, "#0c0818"); g.addColorStop(1, "#05040a"); c.fillStyle = g; c.fillRect(0, 0, DW, DH);
    let rg = c.createRadialGradient(DW * .8, DH * .1, 0, DW * .8, DH * .1, DW * .55); rg.addColorStop(0, "rgba(139,53,255,.45)"); rg.addColorStop(1, "rgba(139,53,255,0)"); c.fillStyle = rg; c.fillRect(0, 0, DW, DH);
    rg = c.createRadialGradient(DW * .1, DH * .95, 0, DW * .1, DH * .95, DW * .45); rg.addColorStop(0, "rgba(22,216,255,.22)"); rg.addColorStop(1, "rgba(22,216,255,0)"); c.fillStyle = rg; c.fillRect(0, 0, DW, DH);
    c.strokeStyle = "rgba(255,255,255,.16)"; c.lineWidth = 3; rr(c, 1.5, 1.5, DW - 3, DH - 3, 34); c.stroke();
    const FONT = "Inter, Cairo, system-ui, sans-serif", mx = x => rtl ? DW - x : x;
    const tile = (im, x, y, w, h, rot) => { c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot || 0); c.translate(-w / 2, -h / 2); c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 34; c.shadowOffsetY = 14; rr(c, 0, 0, w, h, 22); c.fillStyle = "#1a1330"; c.fill(); c.shadowColor = "transparent"; rr(c, 0, 0, w, h, 22); c.save(); c.clip(); try { cover(c, im, 0, 0, w, h); } catch (e) {} c.restore(); c.strokeStyle = "rgba(255,255,255,.2)"; c.lineWidth = 2; rr(c, 1, 1, w - 2, h - 2, 22); c.stroke(); c.restore(); };
    // pictures: the section's own photos when there are some, otherwise the real capture of the section
    const pics = d.imgs.length ? d.imgs.map(o => o.el) : [frameImg];
    const bx = rtl ? DW * .05 : DW * .56, bw = DW * .39;
    tile(pics[0], bx, DH * .1, bw, DH * .8, rtl ? -.03 : .03);
    if (pics[1]) tile(pics[1], rtl ? DW * .3 : DW * .43, DH * .6, DW * .17, DH * .3, rtl ? .05 : -.05);
    if (pics[2]) tile(pics[2], rtl ? DW * .2 : DW * .82, DH * .64, DW * .13, DH * .26, rtl ? -.04 : .04);
    // text
    const L = DW * .07, tw = DW * .44, X = mx(L); c.direction = rtl ? "rtl" : "ltr"; c.textAlign = rtl ? "right" : "left"; c.textBaseline = "alphabetic";
    drawIcon(c, d.i, rtl ? X - 84 : X, DH * .14, 84);
    c.font = "700 19px " + FONT; c.fillStyle = "#a79fc0"; if ("letterSpacing" in c) c.letterSpacing = rtl ? "0px" : "4px"; c.fillText(d.kicker.toUpperCase(), rtl ? X - 104 : X + 104, DH * .14 + 52); if ("letterSpacing" in c) c.letterSpacing = "0px";
    const tmp = document.createElement("div"); tmp.innerHTML = d.titleHTML; const words = [];
    tmp.childNodes.forEach(n => { const em = n.nodeType === 1; (n.textContent || "").split(/\s+/).filter(Boolean).forEach(w => words.push({ w, col: em ? "#9d66ff" : "#ffffff" })); });
    const tl = words.map(o => o.w).join(" ").length, fs = tl > 36 ? 58 : tl > 20 ? 72 : 86, lh = fs * (rtl ? 1.3 : 1.05);
    c.font = "800 " + fs + "px " + FONT; if ("letterSpacing" in c && !rtl) c.letterSpacing = (-fs * .035) + "px";
    const lines = []; let cur = [], cw = 0; const sp = c.measureText(" ").width;
    words.forEach(o => { const w = c.measureText(o.w).width; if (cur.length && cw + sp + w > tw) { lines.push(cur); cur = []; cw = 0; } cur.push({ ...o, width: w }); cw += (cur.length > 1 ? sp : 0) + w; });
    if (cur.length) lines.push(cur);
    let y = DH * .14 + 84 + 26 + fs; lines.slice(0, 3).forEach(Ln => { let x = X; Ln.forEach(o => { c.fillStyle = o.col; c.fillText(o.w, x, y); x += rtl ? -(o.width + sp) : (o.width + sp); }); y += lh; });
    if ("letterSpacing" in c) c.letterSpacing = "0px";
    if (d.text) { c.font = "400 22px " + FONT; c.fillStyle = "#a7a1b7"; y += 4; const ws = d.text.split(" "); let ln = "", n = 0; for (const w of ws) { const t = ln ? ln + " " + w : w; if (c.measureText(t).width > tw && ln) { c.fillText(ln, X, y); y += 34; ln = w; if (++n >= 3) { ln = ""; break; } } else ln = t; } if (ln && n < 3) c.fillText(ln, X, y); }
    let cx = X; const cy = Math.min(DH - 84, Math.max(y + 40, DH * .74));
    d.chips.forEach(t => { c.font = "700 18px " + FONT; const w = c.measureText(t).width + 40, x = rtl ? cx - w : cx; c.fillStyle = "rgba(30,22,60,.9)"; rr(c, x, cy, w, 42, 21); c.fill(); c.strokeStyle = "rgba(255,255,255,.22)"; c.lineWidth = 1.5; c.stroke(); c.fillStyle = "#f6f3ff"; c.textAlign = "center"; c.fillText(t, x + w / 2, cy + 27); c.textAlign = rtl ? "right" : "left"; cx += rtl ? -(w + 12) : (w + 12); });
    return cv;
  };

  /* ---------- WebGL2 scene ---------- */
  let S = null, raf = 0, t0 = 0, busy = false, jumped = false, skipFrom = -1, skipAt0 = 0, target = 0;
  const compile = (gl, vs, fs) => {
    const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const mkTex = (gl, src, maxA) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (maxA) gl.texParameterf(gl.TEXTURE_2D, maxA.TEXTURE_MAX_ANISOTROPY_EXT, 8); return t;
  };

  const setup = (up, cur, tgt) => {
    const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.75);
    const cv = document.createElement("canvas"); cv.className = "pf"; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    const gl = cv.getContext("webgl2", { antialias: true, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" }); if (!gl) return null;
    const { m, imgs } = assets, W = m.W, H = m.H, N = m.frames.length;
    const P = { tile: compile(gl, VS, FS_TILE), shadow: compile(gl, VS, FS_SHADOW), floor: compile(gl, VS_FS, FS_FLOOR), ov: compile(gl, VS_OV, FS_OV) };
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const maxA = gl.getExtension("EXT_texture_filter_anisotropic");
    const tex = imgs.map(im => mkTex(gl, im, maxA));
    const [l1, l2] = titleText(up);
    const tt = mkTex(gl, titleCanvas(vw, vh, dpr, l1, l2), null);
    const logos = [["TM", "#8b35ff", "#16d8ff", -70, -70, 176], ["Ai", "#ff6a3d", "#ffb347", W - 130, -96, 170], ["Ps", "#1f6bff", "#16d8ff", -96, 470, 154], ["Ae", "#7a3cff", "#c04cff", W - 70, 420, 160]]
      .map(a => ({ t: mkTex(gl, logoTile(a[0], a[1], a[2]), null), x: a[3], y: a[4], s: a[5] }));
    const secEls = SECTIONS.map(q => document.querySelector(q)), rtl = document.documentElement.dir === "rtl" || document.documentElement.lang === "ar";
    const cards = secEls.map((e, i) => { let cv; try { cv = paintCard(sectionData(e, i), imgs[i], rtl); return mkTex(gl, cv, maxA); } catch (err) { cv = paintCard({ ...sectionData(e, i), imgs: [] }, imgs[i], rtl); return mkTex(gl, cv, maxA); } });
    const els = []; m.frames.forEach((f, i) => f.rects.forEach((r, k) => els.push({ i, x: r[0], y: r[1], w: r[2], h: r[3], rad: Math.min(Math.max(r[4], 10), 28), dz: 22 + ((i * 37 + k * 53) % 19) })));
    document.body.appendChild(cv);
    const fov = 38 * Math.PI / 180, F = (vh / 2) / Math.tan(fov / 2);
    return { cv, gl, P, vao, tex, tt, logos, els, cards, vw, vh, W, H, N, F, fov, up, ya: 0, yb: 0, cur, tgt,
      sCover: Math.max(vw / W, vh / H), sFly: .9 * Math.min(vw / W, 1.6), sFit: Math.min(.9 * vh / (N * H), .9 * vw / W), sCard: Math.min(.46 * vh / H, .6 * vw / W) };
  };

  const render = t => {
    if (!S) return; const { gl, P, cv, vw, vh, W, H, N, F, fov } = S;
    gl.viewport(0, 0, cv.width, cv.height); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.bindVertexArray(S.vao);
    // camera pose
    const kT = eio(seg(t, 0, T.tilt)), kR = eio(seg(t, T.riseA, T.riseB)), kD = eio(seg(t, T.diveA, T.diveB)), kC = eio(seg(t, T.diveB, T.cardB));
    const th = TILT * kT * (1 - kR) * Math.PI / 180;
    let ls = lerp(Math.log(S.sCover), Math.log(S.sFly), kT); ls = lerp(ls, Math.log(S.sFit), kR); ls = lerp(ls, Math.log(S.sCover), kD); ls = lerp(ls, Math.log(S.sCard), kC);
    const s = Math.exp(ls);
    let y = lerp(S.ya, S.yg, glide(t / T.glide)); y = lerp(y, N * H / 2, kR); y = lerp(y, S.yb, kD); y -= (.2 * vh * kC) / s;
    const cam = mul(persp(fov, vw / vh, 10, 40000), mul(tr(0, 0, -F), mul(rx(-th), mul(sc(s, s, s), tr(0, y, 0)))));
    // floor
    gl.useProgram(P.floor.p); gl.uniform2f(P.floor.u.res, cv.width, cv.height); gl.uniform3fv(P.floor.u.c0, S.fl0); gl.uniform3fv(P.floor.u.c1, S.fl1); gl.uniform3fv(P.floor.u.c2, S.fl2); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(S.vao);
    const quad = (rot, cx, cy, cz, w, h) => mul(cam, mul(tr(cx, cy, cz), mul(ry(rot || 0), sc(w, h, 1))));
    const sh = (cx, cy, cz, w, h, half, rad, blur, alpha, rot) => {
      gl.useProgram(P.shadow.p); const u = P.shadow.u; gl.uniformMatrix4fv(u.M, false, quad(rot, cx, cy, cz, w, h));
      gl.uniform2f(u.size, w, h); gl.uniform2f(u.half_, half[0], half[1]); gl.uniform1f(u.alpha, alpha); gl.uniform1f(u.rad, rad); gl.uniform1f(u.blur, blur); gl.uniform1f(u.F, F); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const draw = (tex, cx, cy, cz, w, h, uvr, rad, qoff, qhalf, alpha, lift, rot) => {
      gl.useProgram(P.tile.p); const u = P.tile.u; gl.uniformMatrix4fv(u.M, false, quad(rot, cx, cy, cz, w, h));
      gl.uniform4fv(u.uvr, uvr); gl.uniform2f(u.size, w, h); gl.uniform2f(u.qoff, qoff[0], qoff[1]); gl.uniform2f(u.qhalf, qhalf[0], qhalf[1]);
      gl.uniform1f(u.rad, rad); gl.uniform1f(u.F, F); gl.uniform1f(u.K, 6.5); gl.uniform1f(u.alpha, alpha); gl.uniform1f(u.lift, lift); gl.uniform3fv(u.fogc, S.fl1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.T, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    // page shadow + page (one strip; only its outer corners are rounded)
    const SH = N * H, fo = 1 - kC; sh(0, -SH / 2 - 26, -3, W + 520, SH + 520, [W / 2, SH / 2], 24, 90, .62 * fo);
    for (let i = 0; i < N; i++) {
      const isT = i === S.tgt, a = isT ? 1 : fo; if (a < .003) continue;
      const qo = [0, (-(i * H + H / 2) + SH / 2) * (isT ? 1 - kC : 1)], qh = isT ? [lerp(W / 2, W / 2, kC), lerp(SH / 2, H / 2, kC)] : [W / 2, SH / 2];
      if (isT && kC > 0) sh(0, -(i * H + H / 2) - 14, -2, W + 360, H + 360, [W / 2, H / 2], 24, 60, .6 * kC);
      draw(S.tex[i], 0, -(i * H + H / 2), 0, W, H, [0, 0, 1, 1], 24, qo, qh, a, 0);
    }
    // floating elements lift toward the camera as it passes
    S.els.forEach(e => {
      const cyp = e.i * H + e.y + e.h / 2, near = 1 - sstep(H * .5, H * 2.4, Math.abs(cyp - y)), z = e.dz * (.25 + .75 * near);
      const cx = e.x + e.w / 2 - W / 2;
      const ea = e.i === S.tgt ? 1 : fo; if (ea < .003) return;
      sh(cx + 4, -cyp - 10, z * .3, e.w + 120, e.h + 120, [e.w / 2, e.h / 2], e.rad, 16 + z * .5, .55 * (.35 + .65 * near) * ea);
      draw(S.tex[e.i], cx, -cyp, z, e.w, e.h, [e.x / W, 1 - (e.y + e.h) / H, e.w / W, e.h / H], e.rad, [0, 0], [e.w / 2, e.h / 2], ea, near);
    });
    // section cards: swing in from the left / right with a tilt, straighten as the camera passes, then leave on the same side
    S.cards.forEach((ct, i) => {
      const yc = i * H + H / 2, e = sstep(H * 2.1, H * .3, Math.abs(yc - y)) * (1 - kR) * (i === S.tgt ? 1 - kC : 1); if (e < .01) return;
      const side = i % 2 ? -1 : 1, cx = side * lerp(W * 1.2, W * .3, e), yaw = side * lerp(54, 11, e) * Math.PI / 180, z = 150 + 30 * e, cy = -yc - H * .02;
      sh(cx + side * 10, cy - 18, z * .3, CARD_W + 220, CARD_H + 220, [CARD_W / 2, CARD_H / 2], 34, 40, .6 * e, yaw);
      draw(ct, cx, cy, z, CARD_W, CARD_H, [0, 0, 1, 1], 34, [0, 0], [CARD_W / 2, CARD_H / 2], Math.min(1, e * 1.4), e, yaw);
    });
    // four logo tiles: always around the hero; they also gather around the destination card for the final reveal
    const tiles = (fi, alpha) => S.logos.forEach((L, k) => {
      const z = 46 + 6 * Math.sin(t / 700 + k * 1.7), cx = L.x + L.s / 2 - W / 2, cy = fi * H + L.y + L.s / 2;
      sh(cx + 6, -cy - 14, 6, L.s + 120, L.s + 120, [L.s / 2, L.s / 2], 40, 26, .6 * alpha);
      draw(L.t, cx, -cy, z, L.s, L.s, [0, 0, 1, 1], 1, [0, 0], [L.s, L.s], alpha, 0);
    });
    tiles(0, 1); if (S.tgt !== 0) tiles(S.tgt, kD);
    // closing title (screen space)
    const ta = eio(seg(t, T.titleA, T.titleB));
    if (ta > .002) {
      gl.useProgram(P.ov.p); const u = P.ov.u, th2 = .40, rise = (1 - ta) * .03;
      gl.uniform4f(u.r, 0, 1 - th2 - .02 + rise - .04, 2, th2 * 2); gl.uniform1f(u.alpha, ta); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, S.tt); gl.uniform1i(u.T, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    cv.style.opacity = (eio(seg(t, 0, T.fadeIn)) * (1 - eio(seg(t, T.fadeA, T.end)))).toFixed(3);
  };

  /* ---------- run ---------- */
  const doJump = y => {
    window.__tmJumpUntil = performance.now() + 2200;
    try { if (window.__lenis && typeof window.__lenis.scrollTo === "function") window.__lenis.scrollTo(y, { immediate: true, force: true }); } catch (_) {}
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
  };
  const finish = () => {
    cancelAnimationFrame(raf); raf = 0;
    if (S) { try { const ext = S.gl.getExtension("WEBGL_lose_context"); S.cv.remove(); ext && ext.loseContext(); } catch (_) {} }
    S = null; busy = false; jumped = false; skipFrom = -1; document.body.classList.remove("pf-lock");
    try { window.dispatchEvent(new Event("scroll")); } catch (_) {}
  };
  const tick = now => {
    let t = now - t0; if (skipFrom >= 0) t = Math.max(t, skipFrom + (now - skipAt0));
    if (!jumped && t >= T.jump) { jumped = true; doJump(target); }
    if (t >= T.end) return finish();
    render(t); raf = requestAnimationFrame(tick);
  };
  const skip = () => { if (!busy || skipFrom >= 0 || !S) return; const now = performance.now(); if (now - t0 >= T.titleB) return; skipFrom = T.titleB; skipAt0 = now; };

  const start = up => {
    if (busy || !assets) return false;
    const els = SECTIONS.map(s => document.querySelector(s)); if (els.some(e => !e) || els.length !== assets.m.frames.length) return false;
    const mid = scrollY + innerHeight * .5; let cur = 0; els.forEach((e, i) => { if (e.getBoundingClientRect().top + scrollY <= mid) cur = i; });
    const tgt = up ? 0 : els.length - 1;
    try { S = setup(up, cur, tgt); } catch (e) { console.warn("page-flight:", e); try { S && S.cv.remove(); } catch (_) {} S = null; return false; }
    if (!S) return false;
    const H = S.H; S.ya = cur * H + H / 2; S.yb = tgt * H + H / 2;
    if (Math.abs(S.yb - S.ya) < H * 3) S.ya = clamp(S.yb + (up ? 1 : -1) * H * 3, H / 2, S.N * H - H / 2);   // always give the camera a stretch of page to glide over
    S.yg = lerp(S.ya, S.yb, .94);
    const light = document.body.classList.contains("light");
    S.fl0 = hex(light ? "#f4ecff" : "#1f1638"); S.fl1 = hex(light ? "#f1ebfa" : "#0b0814"); S.fl2 = hex(light ? "#e8e0f5" : "#05040a");
    busy = true; jumped = false; skipFrom = -1; target = up ? 0 : document.documentElement.scrollHeight;
    window.__scrollOrbitDir = up ? "up" : "down"; try { window.playScrollOrbitSound && window.playScrollOrbitSound(); } catch (_) {}
    document.body.classList.add("pf-lock"); S.cv.classList.add("is-on");
    S.cv.addEventListener("pointerdown", skip); S.cv.addEventListener("wheel", e => { e.preventDefault(); skip(); }, { passive: false }); S.cv.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
    S.cv.addEventListener("webglcontextlost", e => { e.preventDefault(); doJump(target); finish(); });
    render(0); t0 = performance.now(); raf = requestAnimationFrame(tick); return true;
  };

  document.addEventListener("keydown", e => { if (busy && (e.key === "Escape" || e.key === " " || e.key === "Enter")) { e.preventDefault(); skip(); } }, true);
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#scrollOrbit"); if (!b) return;
    if (busy) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (reduce.matches) return;
    if (start(b.classList.contains("is-up"))) { e.preventDefault(); e.stopImmediatePropagation(); }       // not ready / no WebGL2: the normal smooth scroll runs
  }, true);
  window.__pageFlight = { start, render, T, preload, _pause: () => cancelAnimationFrame(raf), _t: t => { if (S) render(t); }, get ready() { return !!assets; }, get ok() { return !!S; } };
})();
