/* PAGE FLIGHT (WebGL2) — the round scroll arrow flies a 3D camera over YOUR real page, laid flat on a studio floor.
   Same sequence as the reference video: tilt in -> one continuous glide down the page (floating elements lift toward the camera
   as it passes) -> rise overhead to see the whole page as one strip -> dive into the destination and land exactly where the real page is -> the real page takes over without a jump.
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
  const T = { fadeIn: 250, tilt: 900, glide: 6200, riseA: 5400, riseB: 6600, diveA: 6820, diveB: 7500, cardB: 8500, jump: 8900, fadeA: 8950, end: 9450 };
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
  const rz = a => { const c = Math.cos(a), s = Math.sin(a), m = id(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; };
  const eob = k => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a), m = id(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; };
  const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; };

  /* ---------- shaders ---------- */
  const SDF = "float sdr(vec2 q,vec2 h,float r){vec2 d=abs(q)-h+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}";
  const VS = "#version 300 es\nlayout(location=0) in vec2 p;uniform mat4 M;out vec2 uv;out float w;void main(){uv=p+.5;gl_Position=M*vec4(p,0.,1.);w=gl_Position.w;}";
  // page / element: mip-mapped texture, depth-of-field from the real depth, rounded corners, horizon fog
  const FS_TILE = "#version 300 es\nprecision highp float;in vec2 uv;in float w;uniform sampler2D T;uniform vec4 uvr;uniform vec2 size,qoff,qhalf;uniform float rad,F,K,alpha,lift,keyT,lodF,shd,wipe;uniform vec3 fogc;out vec4 o;" + SDF +
    "void main(){vec2 q=(uv-.5)*size+qoff;float d=sdr(q,qhalf,rad);float a=1.-smoothstep(-1.,1.,d);" +
    "float lod=lodF>=0.?lodF:clamp(abs(w-F)/F*K,0.,5.5);vec4 tx=textureLod(T,uvr.xy+uv*uvr.zw,lod);vec3 c=tx.rgb;" +
    "float kk=mix(1.,smoothstep(.12,.36,max(max(c.r,c.g),c.b)),keyT);c*=(1.+lift*.06)*shd;c=mix(c,fogc,smoothstep(F*1.5,F*3.8,w)*.92);float wp=1.-smoothstep(wipe-.18,wipe,uv.x);o=vec4(c,a*alpha*kk*tx.a*wp);}";
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
  const VER = "?v=9", loadImg = u => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = BASE + u + VER; });
  const preload = () => {
    if (loading || assets) return; loading = true;
    fetch(BASE + "flight/flight.json" + VER).then(r => r.json()).then(m => {
      const sp = []; m.frames.forEach((f, i) => (f.sprites || []).forEach(o => sp.push({ i, o })));
      return Promise.all([Promise.all(m.frames.map(f => loadImg(f.file))), Promise.all(sp.map(q => loadImg(q.o.file)))]).then(([imgs, simgs]) => { assets = { m, imgs, sprites: sp.map((q, k) => ({ i: q.i, o: q.o, im: simgs[k] })) }; });
    }).catch(() => { loading = false; });
  };
  addEventListener("load", () => setTimeout(preload, 3500));
  orb.addEventListener("pointerenter", preload, { passive: true });

  /* ---------- helpers: canvas textures ---------- */
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const SANS = '500 {s}px Geist, Inter, "Helvetica Neue", Arial, sans-serif', SERIF = 'italic 400 {s}px "Instrument Serif", Georgia, serif';
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
  const CARD_W = 940, CARD_H = 545;
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
    let fs = 90, lines, lh;
    for (;;) {
      lh = fs * (rtl ? 1.3 : 1.05); c.font = "800 " + fs + "px " + FONT; if ("letterSpacing" in c && !rtl) c.letterSpacing = (-fs * .035) + "px";
      const sp0 = c.measureText(" ").width; lines = []; let cur0 = [], cw0 = 0, tooWide = false;
      words.forEach(o => { const w = c.measureText(o.w).width; if (w > tw) tooWide = true; if (cur0.length && cw0 + sp0 + w > tw) { lines.push(cur0); cur0 = []; cw0 = 0; } cur0.push({ ...o, width: w }); cw0 += (cur0.length > 1 ? sp0 : 0) + w; });
      if (cur0.length) lines.push(cur0);
      if ((!tooWide && lines.length <= 3) || fs <= 34) break; fs -= 4;
    }
    const sp = c.measureText(" ").width;
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
    const vw = innerWidth, vh = innerHeight, lite = Math.min(vw, vh) < 700, dpr = Math.min(devicePixelRatio || 1, lite ? 1.25 : 1.75);
    const cv = document.createElement("canvas"); cv.className = "pf"; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    const gl = cv.getContext("webgl2", { antialias: true, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" }); if (!gl) return null;
    const { m, imgs } = assets, W = m.W, N = m.frames.length, FH = m.frames.map(f => f.h || m.H), OFF = [], HREF = 800; let TOT = 0; FH.forEach(h => { OFF.push(TOT); TOT += h; });
    const P = { tile: compile(gl, VS, FS_TILE), shadow: compile(gl, VS, FS_SHADOW), floor: compile(gl, VS_FS, FS_FLOOR), ov: compile(gl, VS_OV, FS_OV) };
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao); const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const maxA = gl.getExtension("EXT_texture_filter_anisotropic");
    const tex = imgs.map(im => mkTex(gl, im, maxA));
    const cards = [];
    const ringCache = {};
    const bgTex = (i, x, y, w, h) => {                                                       // average colour of the page just around a rect
      let c = ringCache[i]; if (!c) { const cv2 = document.createElement("canvas"); cv2.width = Math.round(W / 4); cv2.height = Math.round(FH[i] / 4); const g = cv2.getContext("2d", { willReadFrequently: true }); g.drawImage(imgs[i], 0, 0, cv2.width, cv2.height); c = ringCache[i] = { g, w: cv2.width, h: cv2.height }; }
      const q = v => Math.round(v / 4), X0 = clamp(q(x) - 3, 0, c.w - 1), Y0 = clamp(q(y) - 3, 0, c.h - 1), X1 = clamp(q(x + w) + 2, 0, c.w - 1), Y1 = clamp(q(y + h) + 2, 0, c.h - 1), pts = [[X0, Y0], [X1, Y0], [X0, Y1], [X1, Y1], [(X0 + X1) >> 1, Y0], [(X0 + X1) >> 1, Y1], [X0, (Y0 + Y1) >> 1], [X1, (Y0 + Y1) >> 1]];
      let r = 0, g2 = 0, b = 0; pts.forEach(pt => { const d = c.g.getImageData(pt[0], pt[1], 1, 1).data; r += d[0]; g2 += d[1]; b += d[2]; });
      const one = document.createElement("canvas"); one.width = one.height = 2; const o = one.getContext("2d"); o.fillStyle = "rgb(" + Math.round(r / 8) + "," + Math.round(g2 / 8) + "," + Math.round(b / 8) + ")"; o.fillRect(0, 0, 2, 2);
      return mkTex(gl, one, null);
    };
    const els = [];
    m.frames.forEach((f, i) => {
      const rs = [...f.rects].sort((a, b) => a[1] - b[1]), G = 26, par = rs.map((_, k) => k), fd = k => par[k] === k ? k : (par[k] = fd(par[k]));
      for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) {            // rects that touch or overlap become one group, so small text never rides over big text
        const A = rs[a], B = rs[b]; if (A[0] < B[0] + B[2] + G && B[0] < A[0] + A[2] + G && A[1] < B[1] + B[3] + G && B[1] < A[1] + A[3] + G) par[fd(b)] = fd(a);
      }
      const gid = {}, gs = {}; rs.forEach((r, k) => { const g = fd(k); (gs[g] = gs[g] || []).push(k); });
      Object.keys(gs).forEach((g, gi) => {
        const mem = gs[g], cy = mem.reduce((s, k) => s + OFF[i] + rs[k][1] + rs[k][3] / 2, 0) / mem.length, dz = 22 + ((i * 37 + gi * 53) % 17), delay = gi * HREF * .05, vr = (i * 7 + gi * 5) % 12;
        mem.forEach(k => { const r = rs[k], kind = r[5] === undefined ? 2 : r[5];
          els.push({ i, x: r[0], y: r[1], w: r[2], h: r[3], kind, rad: kind === 0 || kind === 6 ? 0 : Math.min(Math.max(r[4], 8), 30), dz, delay, vr, multi: mem.length > 1, cy, pt: bgTex(i, r[0], r[1], r[2], r[3]) }); });
      });
    });
    const sprites = assets.sprites.map((q, k) => ({ i: q.i, x: q.o.x, y: q.o.y, w: q.o.w, h: q.o.h, patch: null, tex: mkTex(gl, q.im, maxA), delay: HREF * .1 }));
    document.body.appendChild(cv);
    const fov = 38 * Math.PI / 180, F = (vh / 2) / Math.tan(fov / 2);
    return { cv, gl, P, vao, tex, els, sprites, lite, vw, vh, W, N, FH, OFF, TOT, HREF, F, fov, up, ya: 0, yb: 0, cur, tgt,
      sCover: vw / W, sFly: .66 * Math.min(vw / W, 1.6), sFit: Math.min(.9 * vh / TOT, .9 * vw / W), sEnd: vw / W };
  };

  const render = t => {
    if (!S) return; const { gl, P, cv, vw, vh, W, N, F, fov, FH, OFF, TOT, HREF } = S;
    gl.viewport(0, 0, cv.width, cv.height); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.bindVertexArray(S.vao);
    // camera pose
    const kT = eio(seg(t, 0, T.tilt)), kR = eio(seg(t, T.riseA, T.riseB)), kD = eio(seg(t, T.diveA, T.diveB)), kC = eio(seg(t, T.diveB, T.cardB));
    const th = TILT * kT * (1 - kR) * Math.PI / 180;
    let ls = lerp(Math.log(S.sCover), Math.log(S.sFly), kT); ls = lerp(ls, Math.log(S.sFit), kR); ls = lerp(ls, Math.log(S.sCover), kD); ls = lerp(ls, Math.log(S.sEnd), kC);
    const s = Math.exp(ls);
    let y = lerp(S.ya, S.yg, glide(t / T.glide)); y = lerp(y, TOT / 2, kR); y = lerp(y, S.yb, kD);
    // the end frame is laid exactly over the real section (measured from the page itself), so the hand-over is seamless
    const yEnd = OFF[S.tgt] + FH[S.tgt] / 2 - (S.eC - vh / 2) / s; y = lerp(y, yEnd, kC);
    const cam = mul(persp(fov, vw / vh, 10, 40000), mul(tr(0, 0, -F), mul(rx(-th), mul(sc(s, s, s), tr(0, y, 0)))));
    // floor
    gl.useProgram(P.floor.p); gl.uniform2f(P.floor.u.res, cv.width, cv.height); gl.uniform3fv(P.floor.u.c0, S.fl0); gl.uniform3fv(P.floor.u.c1, S.fl1); gl.uniform3fv(P.floor.u.c2, S.fl2); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(S.vao);
    const quad = (rot, cx, cy, cz, w, h) => mul(cam, mul(tr(cx, cy, cz), mul(Array.isArray(rot) ? rot : ry(rot || 0), sc(w, h, 1))));
    const sh = (cx, cy, cz, w, h, half, rad, blur, alpha, rot) => {
      gl.useProgram(P.shadow.p); const u = P.shadow.u; gl.uniformMatrix4fv(u.M, false, quad(rot, cx, cy, cz, w, h));
      gl.uniform2f(u.size, w, h); gl.uniform2f(u.half_, half[0], half[1]); gl.uniform1f(u.alpha, alpha); gl.uniform1f(u.rad, rad); gl.uniform1f(u.blur, blur); gl.uniform1f(u.F, F); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const draw = (tex, cx, cy, cz, w, h, uvr, rad, qoff, qhalf, alpha, lift, rot, keyT, lodF, shd, wipe) => {
      gl.useProgram(P.tile.p); const u = P.tile.u; gl.uniformMatrix4fv(u.M, false, quad(rot, cx, cy, cz, w, h));
      gl.uniform4fv(u.uvr, uvr); gl.uniform2f(u.size, w, h); gl.uniform2f(u.qoff, qoff[0], qoff[1]); gl.uniform2f(u.qhalf, qhalf[0], qhalf[1]);
      gl.uniform1f(u.rad, rad); gl.uniform1f(u.F, F); gl.uniform1f(u.K, 3.2); gl.uniform1f(u.alpha, alpha); gl.uniform1f(u.lift, lift); gl.uniform1f(u.keyT, keyT || 0); gl.uniform1f(u.lodF, lodF === undefined ? -1 : lodF); gl.uniform1f(u.shd, shd === undefined ? 1 : shd); gl.uniform1f(u.wipe, wipe === undefined ? 2 : wipe); gl.uniform3fv(u.fogc, S.fl1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.T, 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    // page shadow + page (one strip; only its outer corners are rounded)
    const SH = TOT, fo = 1; sh(0, -SH / 2 - 26, -3, W + 520, SH + 520, [W / 2, SH / 2], 24, 90, .62 * (1 - kC));
    for (let i = 0; i < N; i++) {
      const hh = FH[i], cyp = OFF[i] + hh / 2, qo = [0, -cyp + SH / 2], qh = [W / 2, SH / 2];
      draw(S.tex[i], 0, -cyp, 0, W, hh, [0, 0, 1, 1], lerp(24, 0, kC), qo, qh, 1, 0);
    }
    // everything that rises out of the page is built from stacked layers, so it has real thickness (3D)
    const LAYERS = { 0: [8, 2.6], 1: [5, 2.8], 2: [4, 3], 3: [4, 2.6], 4: [5, 2.8], 6: [7, 3.4] };
    // every element enters in its own way: lift, slide from the left or right, flip, pop with a bounce, or a tilted roll; text also writes itself in from the side
    const pick = (kind, v) => kind === 6 ? [0, 4][v % 2] : kind === 0 ? [1, 2, 0][v % 3] : kind === 1 ? [3, 4, 5, 4][v % 4] : kind === 3 || kind === 4 ? [4, 5, 0][v % 3] : [0, 3, 4, 1, 2, 5][v % 6];
    const rise = (key, i, x, y0, w, h, delay, wide, tex, uvr, rad, kind, dz, pt, vr, multi) => {
      const cyp = OFF[i] + y0 + h / 2, d = Math.abs(cyp - y);
      const en = sstep(HREF * 1.8, HREF * .28, d + delay) * (1 - kR) * (1 - kC);
      const cx0 = x + w / 2 - W / 2, bot = OFF[i] + y0 + h;
      if (en < .01) return;
      const k = eio(en), phi = th * k * .8, vt = kind === 5 ? 0 : multi ? [0, 1, 2, 0][(vr || 0) % 4] : pick(kind, vr || 0), inv = 1 - k;
      const ps = vt === 4 ? .55 + .45 * eob(k) : 1, ww = w * ps, hh = h * ps;
      const cx = cx0 + (vt === 1 ? -1 : vt === 2 ? 1 : 0) * inv * 70;
      const yaw = vt === 3 ? inv * 1.15 : 0, roll = vt === 5 ? inv * Math.min(.3, 70 / Math.max(w, h)) * (vr % 2 ? 1 : -1) : 0;
      const rot = mul(rx(phi), mul(tr(0, hh / 2, 0), mul(rz(roll), ry(yaw))));
      const wp = kind === 0 ? clamp(k * 1.3, 0, 1.3) : 2;
      if (pt) draw(pt, cx0, -(OFF[i] + y0 + h / 2), .6, w + 6, h + 6, [0, 0, 1, 1], rad, [0, 0], [(w + 6) / 2, (h + 6) / 2], Math.min(1, k * 1.3), 0, 0, 0);   // the spot it left behind (flat page colour)
      sh(cx, -bot - 4, 1, ww * 1.15 + 80, hh * .5 + 80, [ww * .5, hh * .12], rad || 6, 18 + hh * .05, .55 * k * (kind === 0 ? .5 : 1));
      let [L, st] = kind === 5 ? [7, 4.5] : LAYERS[kind] || [3, 3];
      if (S.lite) L = Math.min(L, kind === 5 ? 3 : 2);     // phones: fewer stacked layers
      for (let l = 0; l < L; l++) {                                                                  // back to front: dark rim, bright face
        const front = l === L - 1, z = 3 + dz * k - (L - 1 - l) * st * k, shd = front ? 1 : .32 + .32 * l / L;
        draw(tex, cx, -bot, z, ww, hh, uvr, rad, [0, 0], [ww / 2, hh / 2], front ? Math.min(1, en * 2.2) : Math.min(1, en * 2.2) * .95, k, rot, kind === 0 || kind === 6 ? 1 : 0, undefined, shd, wp);
      }
    };
    const list = [];
    S.els.forEach(e => { if (e.w > W * .56 && e.kind !== 0) return; list.push({ d: Math.abs(e.cy - y) + e.w * e.h * 1e-4, f: () => rise("e", e.i, e.x, e.y, e.w, e.h, e.delay, 0, S.tex[e.i], [e.x / W, 1 - (e.y + e.h) / FH[e.i], e.w / W, e.h / FH[e.i]], e.rad, e.kind, e.dz, e.pt, e.vr, e.multi) }); });
    S.sprites.forEach(q => list.push({ d: Math.abs(OFF[q.i] + q.y + q.h / 2 - y), f: () => rise("s", q.i, q.x, q.y, q.w, q.h, q.delay, 0, q.tex, [0, 0, 1, 1], 0, 5, 46, null, 0) }));
    list.sort((p, q) => q.d - p.d).forEach(o => o.f());
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
    if (!jumped && t >= T.jump) { jumped = true; doJump(S && S.up ? 0 : document.documentElement.scrollHeight); }
    if (t >= T.end) return finish();
    render(t); raf = requestAnimationFrame(tick);
  };
  const skip = () => { if (!busy || skipFrom >= 0 || !S) return; const now = performance.now(); if (now - t0 >= T.cardB) return; skipFrom = T.cardB; skipAt0 = now; };

  const start = up => {
    if (busy || !assets) return false;
    const els = SECTIONS.map(s => document.querySelector(s)); if (els.some(e => !e) || els.length !== assets.m.frames.length) return false;
    const mid = scrollY + innerHeight * .5; let cur = 0; els.forEach((e, i) => { if (e.getBoundingClientRect().top + scrollY <= mid) cur = i; });
    const tgt = up ? 0 : els.length - 1;
    try { S = setup(up, cur, tgt); } catch (e) { console.warn("page-flight:", e); try { S && S.cv.remove(); } catch (_) {} S = null; return false; }
    if (!S) return false;
    const H = S.HREF, cr = els[cur].getBoundingClientRect(), s0 = S.sCover;
    S.ya = S.OFF[cur] + S.FH[cur] / 2 - (cr.top + cr.height / 2 - S.vh / 2) / s0;      // the first frame lies exactly over what is on screen now
    S.eC = endCenter(tgt, S.vh); S.yb = S.OFF[tgt] + S.FH[tgt] / 2;
    if (Math.abs(S.yb - S.ya) < H * 3 && cur === tgt) S.ya = clamp(S.yb + (up ? 1 : -1) * H * 3, H / 2, S.TOT - H / 2);   // always give the camera a stretch of page to glide over
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

  // where the real section's centre sits on screen once the page has jumped to its destination (top of the page, or the very bottom incl. footer)
  const endCenter = (tgt, vh) => {
    const el = document.querySelector(SECTIONS[tgt]); if (!el) return vh / 2;
    const r = el.getBoundingClientRect(), top = r.top + scrollY, ts = tgt === 0 ? 0 : Math.max(0, document.documentElement.scrollHeight - vh);
    return top - ts + r.height / 2;
  };
  const onResize = () => {
    if (!S) return; const { cv, W, FH, tgt } = S, vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, S.lite ? 1.25 : 1.75);
    S.vw = vw; S.vh = vh; cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    S.F = (vh / 2) / Math.tan(S.fov / 2); S.sCover = vw / W; S.sFly = .66 * Math.min(vw / W, 1.6); S.sFit = Math.min(.9 * vh / S.TOT, .9 * vw / W); S.sEnd = vw / W; S.eC = endCenter(tgt, vh);
  };
  addEventListener("resize", onResize); addEventListener("orientationchange", () => setTimeout(onResize, 120));
  document.addEventListener("keydown", e => { if (busy && (e.key === "Escape" || e.key === " " || e.key === "Enter")) { e.preventDefault(); skip(); } }, true);
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#scrollOrbit"); if (!b) return;
    if (busy) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (reduce.matches) return;
    if (start(b.classList.contains("is-up"))) { e.preventDefault(); e.stopImmediatePropagation(); }       // not ready / no WebGL2: the normal smooth scroll runs
  }, true);
  window.__pageFlight = { start, render, T, preload, _pause: () => cancelAnimationFrame(raf), _t: t => { if (S) render(t); }, get ready() { return !!assets; }, get ok() { return !!S; } };
})();
