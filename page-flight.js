/* PAGE FLIGHT (WebGL2) — press the round arrow and a 3D camera flies through your sections.
   Every section is a card with its real title, text and pictures. Cards swing in from the left and right with a tilt,
   straighten as they pass the camera, and leave on the opposite side. The last card fills the screen and the real page appears.
   Built live from the page (nothing to maintain). No library: raw WebGL2. If WebGL2 is missing, the arrow keeps its normal smooth scroll. */
(() => {
  "use strict";
  const orb = document.getElementById("scrollOrbit");
  if (!orb || window.__pageFlight) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const SECTIONS = [".hero", "#about", "#services", "#work", "#cinema", "#creation", "#beforeafter", "#process", "#findme", "#brief", "#contact"];

  /* ---------- timeline (ms) ---------- */
  const T = { fade: 280, flyA: 250, flyB: 3500, zoomA: 900, zoomB: 3300, jump: 3980, end: 4420 };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const eios = k => .5 - Math.cos(Math.PI * k) / 2;
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const clip = (s, n) => { s = (s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trim() + "…" : s; };

  /* ---------- tiny mat4 (column-major) ---------- */
  const m4 = {
    id: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul: (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    persp: (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; },
    tr: (x, y, z) => { const m = m4.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
    sc: (x, y, z) => { const m = m4.id(); m[0] = x; m[5] = y; m[10] = z; return m; },
    ry: a => { const c = Math.cos(a), s = Math.sin(a), m = m4.id(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; },
    rz: a => { const c = Math.cos(a), s = Math.sin(a), m = m4.id(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
  };

  /* ---------- shaders ---------- */
  const VS = "#version 300 es\nin vec2 p;uniform mat4 M;out vec2 uv;void main(){uv=p+.5;gl_Position=M*vec4(p,0.,1.);}";
  const SDF = "float sdr(vec2 q,vec2 h,float r){vec2 d=abs(q)-h+r;return length(max(d,0.))+min(max(d.x,d.y),0.)-r;}";
  const FS_CARD = "#version 300 es\nprecision highp float;in vec2 uv;uniform sampler2D T;uniform vec2 size;uniform float lod,fog,shade,alpha,rad;uniform vec3 bg;out vec4 o;" + SDF +
    "void main(){vec2 q=(uv-.5)*size;float d=sdr(q,size*.5,rad);float a=1.-smoothstep(-1.2,.8,d);" +
    "vec3 c=textureLod(T,uv,lod).rgb*shade;c+=(1.-smoothstep(0.,3.,-d))*.07;c=mix(c,bg,fog);o=vec4(c,a*alpha);}";
  const FS_SHADOW = "#version 300 es\nprecision highp float;in vec2 uv;uniform vec2 size,half_;uniform float alpha,rad,blur;out vec4 o;" + SDF +
    "void main(){vec2 q=(uv-.5)*size;float d=sdr(q,half_,rad);float a=(1.-smoothstep(-blur,blur*1.6,d))*.62*alpha;o=vec4(vec3(.10,.03,.26),a);}";
  const VS_BG = "#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}";
  const FS_BG = "#version 300 es\nprecision highp float;uniform vec2 res;uniform float prog;uniform vec3 c0,c1,c2;out vec4 o;" +
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
    "float stars(vec2 p,float s){vec2 g=floor(p*s),f=fract(p*s)-.5;float r=h(g);vec2 j=vec2(h(g+3.1),h(g+7.7))-.5;float d=length(f-j*.6);return step(.93,r)*smoothstep(.07,0.,d)*(.4+.6*h(g+1.7));}" +
    "void main(){vec2 u=gl_FragCoord.xy/res;float asp=res.x/res.y;vec2 q=(u-vec2(.75,.92))*vec2(asp,1.);float g=length(q);" +
    "vec3 c=mix(c0,c1,smoothstep(0.,.46,g));c=mix(c,c2,smoothstep(.3,.95,g));" +
    "c+=vec3(.55,.2,1.)*.05*exp(-g*3.5);c+=vec3(.08,.7,1.)*.035*exp(-length((u-vec2(.1,.1))*vec2(asp,1.))*3.);" +
    "vec2 sp=u*vec2(asp,1.)+vec2(0.,prog*.06);float s=stars(sp,38.)+stars(sp*1.7+4.,30.)*.7;c+=vec3(.75,.7,1.)*s*.5;" +
    "c*=1.-.35*smoothstep(.5,1.1,length((u-.5)*vec2(asp,1.)));o=vec4(c,1.);}";

  const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

  /* ---------- read the live page ---------- */
  const navLabel = el => {
    const id = el.id || (el.classList.contains("hero") ? "home" : "");
    const a = document.querySelector('#nav a[href="#' + id + '"]');
    const l = a && (a.querySelector(".nav-home-label") || a);
    return l ? l.textContent.replace(/\s+/g, " ").trim() : id;
  };
  const sectionData = el => {
    const kick = el.querySelector(".section-kicker, .eyebrow span, .fm-k");
    const head = el.querySelector("h1,h2,.sc-title,.fm-t");
    const imgs = [];
    el.querySelectorAll("img").forEach(im => {
      const src = im.currentSrc || im.src;
      if (!src || /^data:/.test(src) || im.closest(".logo,.lightbox-stage") || !(im.complete && im.naturalWidth >= 90)) return;
      if (!imgs.some(o => o.src === src)) imgs.push({ src, el: im });
    });
    let chips = [...el.querySelectorAll(".sc-tags li,.floating-tag,.service-grid article h3,.sc-chip")].map(n => clip(n.textContent, 26)).filter(Boolean);
    if (!chips.length) chips = [...el.querySelectorAll("h3")].map(n => clip(n.textContent, 26)).filter(Boolean);
    const num = ((kick && kick.textContent.match(/\d{1,2}/)) || [""])[0];
    return {
      label: navLabel(el), kicker: clip(kick ? kick.textContent : navLabel(el), 36),
      titleHTML: head ? head.innerHTML.replace(/<(?!\/?em\b)[^>]*>/g, "") : navLabel(el),
      text: clip((el.querySelector(".lead,.section-title p,.sc-text,.contact p") || {}).textContent, 170),
      imgs: imgs.slice(0, 3), chips: chips.slice(0, 3), num: num ? num.padStart(2, "0") : "", y: el.getBoundingClientRect().top + scrollY
    };
  };

  /* ---------- paint a section into a 2D canvas (becomes the card texture) ---------- */
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const cover = (c, im, x, y, w, h) => {
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k;
    c.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
  };
  const FONT = 'Inter, Cairo, system-ui, sans-serif';
  const paintCard = (d, DW, DH, tex, rtl, portrait, withImgs) => {
    const cv = document.createElement("canvas"); cv.width = tex; cv.height = Math.round(tex * DH / DW);
    const c = cv.getContext("2d"), S = cv.width / DW; c.scale(S, S);
    const light = document.body.classList.contains("light");
    // page-coloured background with the same purple/cyan glows
    let g = c.createLinearGradient(0, 0, DW * .6, DH); g.addColorStop(0, "#17102b"); g.addColorStop(.55, "#0a0714"); g.addColorStop(1, "#05040a");
    c.fillStyle = g; c.fillRect(0, 0, DW, DH);
    let rg = c.createRadialGradient(DW * .78, DH * .1, 0, DW * .78, DH * .1, DW * .6); rg.addColorStop(0, "rgba(139,53,255,.42)"); rg.addColorStop(1, "rgba(139,53,255,0)"); c.fillStyle = rg; c.fillRect(0, 0, DW, DH);
    rg = c.createRadialGradient(DW * .1, DH * .95, 0, DW * .1, DH * .95, DW * .5); rg.addColorStop(0, "rgba(22,216,255,.20)"); rg.addColorStop(1, "rgba(22,216,255,0)"); c.fillStyle = rg; c.fillRect(0, 0, DW, DH);
    c.strokeStyle = "rgba(255,255,255,.13)"; c.lineWidth = 2; rr(c, 1, 1, DW - 2, DH - 2, 26); c.stroke();
    if (d.num) { c.font = "800 " + (portrait ? 150 : 190) + "px " + FONT; c.fillStyle = "rgba(255,255,255,.045)"; c.textBaseline = "alphabetic"; c.textAlign = rtl ? "left" : "right"; c.fillText(d.num, rtl ? DW * .04 : DW * .96, DH * .26); }

    // pictures: one large tile + two small ones, like floating photos
    const imgs = withImgs ? d.imgs : [];
    const tile = (im, x, y, w, h, rot) => {
      c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot || 0); c.translate(-w / 2, -h / 2);
      c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 38; c.shadowOffsetY = 16; rr(c, 0, 0, w, h, 20); c.fillStyle = "#1a1330"; c.fill();
      c.shadowColor = "transparent"; rr(c, 0, 0, w, h, 20); c.save(); c.clip(); try { cover(c, im.el, 0, 0, w, h); } catch (e) {} c.restore();
      c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 2; rr(c, 1, 1, w - 2, h - 2, 20); c.stroke(); c.restore();
    };
    const mx = x => rtl ? DW - x : x;                                    // mirror x for Arabic
    if (imgs[0]) {
      if (portrait) { tile(imgs[0], DW * .08, DH * .5, DW * .84, DH * .4, -.02); }
      else { const w = DW * .34, h = DH * .78; tile(imgs[0], rtl ? DW * .05 : DW * .61, DH * .11, w, h, rtl ? -.035 : .035); }
    } else {
      const R = (portrait ? DW : DW * .4) * .5; const ox = portrait ? DW * .5 : mx(DW * .76), oy = portrait ? DH * .72 : DH * .5;
      const og = c.createRadialGradient(ox, oy, 0, ox, oy, R); og.addColorStop(0, "rgba(139,53,255,.45)"); og.addColorStop(.6, "rgba(22,216,255,.10)"); og.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = og; c.fillRect(0, 0, DW, DH);
      c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.strokeStyle = "rgba(157,102,255," + (.32 - i * .08) + ")"; c.beginPath(); c.ellipse(ox, oy, R * (.45 + i * .27), R * (.2 + i * .12), -.35, 0, 7); c.stroke(); }
    }
    if (imgs[1]) { portrait ? tile(imgs[1], DW * .08, DH * .43, DW * .34, DH * .17, .03) : tile(imgs[1], rtl ? DW * .30 : DW * .46, DH * .58, DW * .16, DH * .3, rtl ? .05 : -.05); }
    if (imgs[2]) { portrait ? tile(imgs[2], DW * .66, DH * .43, DW * .26, DH * .17, -.03) : tile(imgs[2], rtl ? DW * .22 : DW * .8, DH * .64, DW * .13, DH * .26, rtl ? -.04 : .04); }

    // text
    const left = portrait ? DW * .08 : DW * .07, tw = portrait ? DW * .84 : DW * .46, top = portrait ? DH * .1 : DH * .3;
    const X = rtl ? DW - left : left;
    c.direction = rtl ? "rtl" : "ltr"; c.textAlign = rtl ? "right" : "left"; c.textBaseline = "alphabetic";
    c.fillStyle = "#16d8ff"; c.shadowColor = "#16d8ff"; c.shadowBlur = 14; c.beginPath(); c.arc(rtl ? X - 6 : X + 6, top - 8, 6, 0, 7); c.fill(); c.shadowBlur = 0; c.shadowColor = "transparent";
    c.font = "700 17px " + FONT; c.fillStyle = "#a79fc0"; if ("letterSpacing" in c) c.letterSpacing = rtl ? "0px" : "4px";
    c.fillText(d.kicker.toUpperCase(), rtl ? X - 24 : X + 24, top); if ("letterSpacing" in c) c.letterSpacing = "0px";
    // title (words keep their colour: <em> = purple)
    const tmp = document.createElement("div"); tmp.innerHTML = d.titleHTML; const words = [];
    tmp.childNodes.forEach(n => { const em = n.nodeType === 1; (n.textContent || "").split(/\s+/).filter(Boolean).forEach(w => words.push({ w, col: em ? "#9d66ff" : "#ffffff" })); });
    const tl = (words.map(o => o.w).join(" ")).length, fs = portrait ? (tl > 30 ? 50 : 62) : (tl > 36 ? 54 : tl > 20 ? 66 : 80), lh = fs * (rtl ? 1.3 : 1.05);
    c.font = "800 " + fs + "px " + FONT; if ("letterSpacing" in c && !rtl) c.letterSpacing = (-fs * .035) + "px";
    const lines = []; let cur = [], cw = 0; const sp = c.measureText(" ").width;
    words.forEach(o => { const w = c.measureText(o.w).width; if (cur.length && cw + sp + w > tw) { lines.push(cur); cur = []; cw = 0; } cur.push({ ...o, width: w }); cw += (cur.length > 1 ? sp : 0) + w; });
    if (cur.length) lines.push(cur);
    let y = top + 22 + fs;
    lines.slice(0, 4).forEach(L => { let x = X; L.forEach(o => { c.fillStyle = o.col; c.fillText(o.w, x, y); x += rtl ? -(o.width + sp) : (o.width + sp); }); y += lh; });
    if ("letterSpacing" in c) c.letterSpacing = "0px";
    if (d.text) {
      c.font = "400 " + (portrait ? 22 : 21) + "px " + FONT; c.fillStyle = "#a7a1b7"; y += 8;
      const ws = d.text.split(" "); let ln = "", n = 0;
      for (const w of ws) { const t = ln ? ln + " " + w : w; if (c.measureText(t).width > tw * .95 && ln) { c.fillText(ln, X, y); y += 33; ln = w; if (++n >= 3) { ln = ""; break; } } else ln = t; }
      if (ln && n < 3) c.fillText(ln, X, y);
    }
    // chips
    let cx = X; const cy = portrait ? DH * .4 : Math.min(DH - 74, y + 62);
    d.chips.forEach(t => {
      c.font = "700 17px " + FONT; const w = c.measureText(t).width + 38, x = rtl ? cx - w : cx;
      c.fillStyle = "rgba(30,22,60,.85)"; rr(c, x, cy, w, 40, 20); c.fill(); c.strokeStyle = "rgba(255,255,255,.2)"; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = "#f6f3ff"; c.textAlign = "center"; c.fillText(t, x + w / 2, cy + 26); c.textAlign = rtl ? "right" : "left";
      cx += rtl ? -(w + 12) : (w + 12);
    });
    return cv;
  };

  /* ---------- WebGL2 scene ---------- */
  let S = null, raf = 0, t0 = 0, busy = false, jumped = false, skipFrom = -1, skipAt0 = 0;
  const compile = (gl, vs, fs) => {
    const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };

  const setup = (order) => {
    const vw = innerWidth, vh = innerHeight, dpr = Math.min(devicePixelRatio || 1, 1.75);
    const cv = document.createElement("canvas"); cv.className = "pf";
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    const gl = cv.getContext("webgl2", { antialias: true, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!gl) return null;
    const portrait = vh > vw * 1.05, DW = portrait ? 760 : 1280, DH = DW * vh / vw, rtl = document.documentElement.dir === "rtl" || document.documentElement.lang === "ar";
    const tex = Math.min(1280, gl.getParameter(gl.MAX_TEXTURE_SIZE), Math.round(vw * dpr * (portrait ? 1 : .8)));
    const progs = { card: compile(gl, VS, FS_CARD), shadow: compile(gl, VS, FS_SHADOW), bg: compile(gl, VS_BG, FS_BG) };
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW);
    ["card", "shadow"].forEach(k => { const l = gl.getAttribLocation(progs[k].p, "p"); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0); });
    const maxA = gl.getExtension("EXT_texture_filter_anisotropic");
    const upload = (d, withImgs) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paintCard(d, DW, DH, tex, rtl, portrait, withImgs));
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (maxA) gl.texParameterf(gl.TEXTURE_2D, maxA.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      return t;
    };
    const cards = order.map(d => { let t; try { t = upload(d, true); } catch (e) { t = upload(d, false); } return { d, t }; });   // tainted picture? paint the card without it
    const light = document.body.classList.contains("light");
    const col = light ? { c0: "#f1e9ff", c1: "#f6f2fc", c2: "#f6f2fc" } : { c0: "#17102b", c1: "#07050d", c2: "#05040a" };
    document.body.appendChild(cv);
    return { cv, gl, progs, vao, cards, vw, vh, DW, DH, CW: vw, CH: vh, fov: 40 * Math.PI / 180, col: { c0: hex(col.c0), c1: hex(col.c1), c2: hex(col.c2) }, bgHex: col.c2, m: cards.length, rtl };
  };

  const render = (t) => {
    if (!S) return;
    const { gl, progs, cv, vw, vh, CW, CH, fov, m, col } = S;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const Fc = (vh / 2) / Math.tan(fov / 2), Ff = Fc * 1.3;
    let F = lerp(Fc, Ff, eio(seg(t, 0, T.zoomA))); F = lerp(F, Fc, eio(seg(t, T.zoomB, T.jump + 20)));
    const u = (m - 1) * eios(seg(t, T.flyA, T.flyB));
    const P = m4.persp(fov, vw / vh, 10, 30000);
    // background (full screen, page colours)
    gl.bindVertexArray(S.vao); gl.useProgram(progs.bg.p);
    gl.uniform2f(progs.bg.u.res, cv.width, cv.height); gl.uniform1f(progs.bg.u.prog, u);
    gl.uniform3fv(progs.bg.u.c0, col.c0); gl.uniform3fv(progs.bg.u.c1, col.c1); gl.uniform3fv(progs.bg.u.c2, col.c2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // cards, far to near
    const Dz = vw * .62, X0 = vw * .60, YAW = 44 * Math.PI / 180;
    const list = S.cards.map((c, k) => ({ c, k, d: k - u })).filter(o => o.d > -1.15 && o.d < 3.6).sort((a, b) => b.d - a.d);
    list.forEach(({ c, k, d }) => {
      const side = k % 2 ? -1 : 1;
      let x, yaw, roll, y;
      if (d >= 0) { const a = sstep(0, 1.7, d); x = side * X0 * a; yaw = side * YAW * a; roll = side * .06 * a; y = side * -vh * .06 * a; }
      else { const b = sstep(0, 1.0, -d); x = -side * X0 * 1.25 * b; yaw = -side * YAW * b; roll = -side * .06 * b; y = -side * -vh * .05 * b; }
      const zpos = -(Math.max(d, 0)) * Dz + (d < 0 ? -d * Dz * .55 : 0);
      const alpha = (1 - sstep(2.5, 3.5, d)) * (1 - sstep(.75, 1.1, -d));
      if (alpha <= .002) return;
      const fog = clamp((d - .7) / 3.2, 0, .6) * .9;
      const lod = clamp(Math.abs(d) * .85 - .15, 0, 3.2);                    // far / passing cards are slightly soft (depth of field)
      const base = m4.mul(P, m4.tr(0, 0, -F));
      const pose = m4.mul(m4.tr(x, y, zpos), m4.mul(m4.rz(roll), m4.ry(yaw)));
      // shadow
      let M = m4.mul(base, m4.mul(pose, m4.mul(m4.tr(0, -CH * .045, -4), m4.sc(CW * 1.5, CH * 1.5, 1))));
      gl.useProgram(progs.shadow.p); const su = progs.shadow.u;
      gl.uniformMatrix4fv(su.M, false, M); gl.uniform2f(su.size, CW * 1.5, CH * 1.5); gl.uniform2f(su.half_, CW * .5, CH * .5);
      gl.uniform1f(su.alpha, alpha * (1 - fog)); gl.uniform1f(su.rad, 28 * (CW / S.DW)); gl.uniform1f(su.blur, CW * .035);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // card
      M = m4.mul(base, m4.mul(pose, m4.sc(CW, CH, 1)));
      gl.useProgram(progs.card.p); const cu = progs.card.u;
      gl.uniformMatrix4fv(cu.M, false, M); gl.uniform2f(cu.size, CW, CH); gl.uniform1f(cu.lod, lod); gl.uniform1f(cu.fog, fog);
      gl.uniform1f(cu.shade, .7 + .3 * Math.cos(yaw)); gl.uniform1f(cu.alpha, alpha); gl.uniform1f(cu.rad, 26 * (CW / S.DW));
      gl.uniform3fv(cu.bg, col.c2);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, c.t); gl.uniform1i(cu.T, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
    cv.style.opacity = (eio(seg(t, 0, T.fade)) * (1 - eio(seg(t, T.jump + 40, T.end)))).toFixed(3);
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
    S = null; busy = false; jumped = false; skipFrom = -1;
    document.body.classList.remove("pf-lock");
    try { window.dispatchEvent(new Event("scroll")); } catch (_) {}
  };
  let target = 0;
  const tick = now => {
    let t = now - t0; if (skipFrom >= 0) t = Math.max(t, skipFrom + (now - skipAt0));
    if (!jumped && t >= T.jump) { jumped = true; doJump(target); }
    if (t >= T.end) return finish();
    render(t); raf = requestAnimationFrame(tick);
  };
  const skip = () => { if (!busy || skipFrom >= 0 || !S) return; const now = performance.now(); if (now - t0 >= T.zoomB) return; skipFrom = T.zoomB - 60; skipAt0 = now; };

  const start = up => {
    if (busy) return false;
    const els = SECTIONS.map(s => document.querySelector(s)).filter(Boolean); if (els.length < 2) return false;
    const data = els.map(sectionData), mid = scrollY + innerHeight * .5; let cur = 0; data.forEach((d, i) => { if (d.y <= mid) cur = i; });
    const tgt = up ? 0 : data.length - 1; let a = cur;
    if (a === tgt) a = clamp(tgt + (up ? 1 : -1), 0, data.length - 1);
    const order = []; for (let i = a; i !== tgt; i += (tgt > a ? 1 : -1)) order.push(data[i]); order.push(data[tgt]);
    try { S = setup(order); } catch (e) { console.warn("page-flight:", e); if (S && S.cv) S.cv.remove(); S = null; return false; }
    if (!S) return false;
    busy = true; jumped = false; skipFrom = -1; target = up ? 0 : document.documentElement.scrollHeight;
    window.__scrollOrbitDir = up ? "up" : "down";
    try { window.playScrollOrbitSound && window.playScrollOrbitSound(); } catch (_) {}
    document.body.classList.add("pf-lock"); S.cv.classList.add("is-on");
    S.cv.addEventListener("pointerdown", skip); S.cv.addEventListener("wheel", e => { e.preventDefault(); skip(); }, { passive: false });
    S.cv.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
    S.cv.addEventListener("webglcontextlost", e => { e.preventDefault(); doJump(target); finish(); });
    render(0); t0 = performance.now(); raf = requestAnimationFrame(tick);
    return true;
  };

  document.addEventListener("keydown", e => { if (busy && (e.key === "Escape" || e.key === " " || e.key === "Enter")) { e.preventDefault(); skip(); } }, true);
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#scrollOrbit");
    if (!b || reduce.matches || busy && S) { if (b && busy) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
    if (start(b.classList.contains("is-up"))) { e.preventDefault(); e.stopImmediatePropagation(); }   // WebGL2 failed? let the normal smooth scroll run
  }, true);

  window.__pageFlight = { start, render, T, _pause: () => cancelAnimationFrame(raf), _t: t => { if (S) render(t); }, get ok() { return !!S; } };
})();
