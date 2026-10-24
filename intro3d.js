/* ==========================================================================
   INTRO 3D
   ─ A dark carved TM logo. A cloudy blue light follows the mouse (and wanders on its own),
     leaving a fading trail. The picture has fake depth (parallax + relief lighting built
     from its own brightness), so the stone surface reacts to the light.
   ─ Loading: the light draws the logo ring while the real assets load (0 → 100 %).
   ─ ENTER: the camera dives into the logo, light floods the screen, the Home page appears,
     and the SAME canvas stays behind the Home section as a faint, interactive background.
   Tunables are in CONFIG just below.
   ========================================================================== */
(() => {
"use strict";
const root = document.getElementById("tm3d");
if (!root) return;

const CONFIG = {
  img: ["images/intro-logo.webp", "images/intro-logo.jpg"],
  minLoadMs: 2800,          // the ring is never drawn faster than this
  maxLoadMs: 7000,          // never wait longer than this
  holdMs: 2350,             // length of the dive-in = the sound's boom → riser → drop (drop lands at 2.34 s)
  sound: "audio/intro-enter.mp3",
  soundGain: 0.9,
  zoomEnd: 8.5,             // how deep the camera goes
  homeZoom: 1.55,           // logo size behind Home
  trailSeconds: 1.35,       // how long the light trail lingers
  bump: 15,                 // relief strength
};

const gate = document.getElementById("enterGate");
const btn = document.getElementById("enterGateBtn");
const cv = root.querySelector(".tm3d-canvas");
const flash = root.querySelector(".tm3d-flash");
const nameEl = root.querySelector(".tm3d-name");
const pctEl = root.querySelector(".tm3d-pct b");
const lineEl = root.querySelector(".tm3d-line i");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const isAr = () => document.documentElement.lang === "ar";

/* logo ring in image space (u = 0..1 left→right, d = 0..1 top→bottom), measured on the artwork */
const RING = { cu: 0.499, cd: 0.457, ru: 0.176, rd: 0.266 };

const S = {
  mode: "loading",        // loading → ready → enter → home
  entering: false,
  shown: 0,               // loader percentage that is displayed
  tasks: { font: 0, img: 0, prep: 0, page: 0 },
  t0: performance.now(),
  mx: 0.5, my: 0.5,       // pointer, 0..1 of the canvas box
  hasPointer: false, lastMove: -1e9,
  par: [0, 0], parT: [0, 0],
  light: [RING.cu, RING.cd], lightT: [RING.cu, RING.cd],
  spirit: { a: Math.random() * 6.28, u: RING.cu, d: RING.cd, init: false },
  zoom: 1, gain: 1, blur: 0, flash: 0, home: 0, cd: 0.553,
  enterT0: 0, visible: true,
};

/* ------------------------------------------------------------------ language labels */
const applyLang = () => root.querySelectorAll("[data-en]").forEach(el => {
  const v = el.getAttribute(isAr() ? "data-ar" : "data-en"); if (v) el.textContent = v;
});
applyLang();
new MutationObserver(applyLang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

/* ------------------------------------------------------------------ scratch title */
const letters = [];
if (nameEl) {
  const txt = (nameEl.getAttribute("aria-label") || nameEl.textContent).trim().toUpperCase();
  nameEl.textContent = "";
  [...txt].forEach(ch => {
    const s = document.createElement("span");
    if (ch === " ") { s.className = "sp"; } else { s.className = "c"; s.textContent = ch; letters.push(s); }
    nameEl.appendChild(s);
  });
  nameEl.setAttribute("role", "img");
  nameEl.setAttribute("aria-label", txt);
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "tm3d-scr"); svg.setAttribute("viewBox", "0 0 1000 200");
  svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("aria-hidden", "true");
  nameEl.appendChild(svg);
  nameEl._svg = svg;
}

const claw = (count = 4) => {
  const svg = nameEl && nameEl._svg; if (!svg || reduce) return;
  svg.textContent = "";
  const NS = "http://www.w3.org/2000/svg";
  const x0 = rnd(80, 560);
  for (let i = 0; i < count; i++) {
    const p = document.createElementNS(NS, "path");
    const x = x0 + i * rnd(46, 92), dx = rnd(150, 300);
    p.setAttribute("d", `M${x} ${rnd(-10, 40)} Q${x + dx * 0.45} ${rnd(70, 130)} ${x + dx} ${rnd(170, 210)}`);
    svg.appendChild(p);
    const L = p.getTotalLength ? p.getTotalLength() : 300;
    p.style.strokeDasharray = L;
    p.animate([{ strokeDashoffset: L, opacity: 0.95 }, { strokeDashoffset: 0, opacity: 0.95, offset: 0.35 }, { strokeDashoffset: 0, opacity: 0 }],
      { duration: 650 + i * 70, delay: i * 55, easing: "steps(9,end)", fill: "both" });
  }
};

const glitch = (el, strong) => {
  if (!el || !el.animate || reduce) return;
  const sh = (a, b) => `${a}px 0 rgba(255,60,120,.55),${b}px 0 rgba(60,200,255,.65),0 0 18px rgba(91,155,255,.6)`;
  el.animate([
    { transform: "none", clipPath: "inset(0)", textShadow: "0 0 22px rgba(91,155,255,.55)" },
    { transform: `translate(${rnd(-5, 5)}px,${rnd(-3, 3)}px) skewX(${rnd(-14, 14)}deg)`, clipPath: `inset(${rnd(0, 40)}% 0 ${rnd(10, 45)}% 0)`, textShadow: sh(-3, 3) },
    { transform: `translate(${rnd(-4, 4)}px,0) skewX(${rnd(-8, 8)}deg)`, clipPath: `inset(0 0 ${rnd(30, 60)}% 0)`, textShadow: sh(3, -3) },
    { transform: `translate(${rnd(-2, 2)}px,${rnd(-2, 2)}px)`, clipPath: `inset(${rnd(20, 50)}% 0 0 0)`, textShadow: sh(-2, 2) },
    { transform: "none", clipPath: "inset(0)", textShadow: "0 0 22px rgba(91,155,255,.55)" },
  ], { duration: strong ? 380 : 240, easing: "steps(4,end)" });
};

const revealTitle = () => {
  if (!letters.length) return;
  root.classList.add("in");
  claw(5);
  letters.forEach((el, i) => {
    if (reduce) { el.style.opacity = 1; return; }
    const d = 380 + i * 75 + rnd(0, 60);
    el.animate([
      { opacity: 0, clipPath: "inset(0 0 100% 0)", transform: "translate(-8px,6px) skewX(-18deg)", offset: 0 },
      { opacity: 1, clipPath: "inset(55% 0 10% 0)", transform: "translate(6px,-2px) skewX(10deg)", offset: 0.28 },
      { opacity: 1, clipPath: "inset(0 0 60% 0)", transform: "translate(-4px,1px) skewX(-6deg)", offset: 0.5 },
      { opacity: 1, clipPath: "inset(20% 0 20% 0)", transform: "translate(3px,0)", offset: 0.72 },
      { opacity: 1, clipPath: "inset(0)", transform: "none", offset: 1 },
    ], { duration: 720, delay: d, easing: "steps(6,end)", fill: "backwards" });
    el.style.opacity = 1;
    el.addEventListener("pointerenter", () => glitch(el, true));
  });
  /* alive: a random letter glitches, now and then a fresh claw mark */
  let n = 0;
  setInterval(() => {
    if (document.hidden || S.entering) return;
    const k = 1 + (Math.random() < 0.35 ? 1 : 0);
    for (let i = 0; i < k; i++) glitch(letters[(Math.random() * letters.length) | 0]);
    if (++n % 4 === 0) claw(3);
  }, 1900);
};

/* ------------------------------------------------------------------ WebGL */
const VERT = "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uImg,uH,uM;
uniform vec2 uRes,uImgSize,uPar,uLight,uCenter;
uniform float uTime,uZoom,uGain,uFlash,uBlur,uHome,uBump;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
void main(){
  vec2 sUv=vec2(vUv.x,1.-vUv.y);
  float sa=uRes.x/uRes.y,ia=uImgSize.x/uImgSize.y;
  vec2 sc=sa>ia?vec2(1.,ia/sa):vec2(sa/ia,1.);
  vec2 iuv=(sUv-.5)*sc/uZoom+uCenter;
  /* depth: brighter (raised) stone moves more than the dark base */
  float h0=texture2D(uH,iuv).r;
  iuv+=uPar*(h0-.28)*.05*(1.+.6*uHome)+uPar*.012;
  vec3 base;
  if(uBlur>.001){
    base=vec3(0.);
    for(int i=0;i<7;i++){float k=float(i)/6.;base+=texture2D(uImg,uCenter+(iuv-uCenter)*(1.-uBlur*.12*k)).rgb;}
    base/=7.;
  }else base=texture2D(uImg,iuv).rgb;
  base=pow(base,vec3(.78));
  /* relief from the heightmap */
  vec2 e=vec2(1./640.,1./360.)*1.5;
  float hl=texture2D(uH,iuv-vec2(e.x,0.)).r,hr=texture2D(uH,iuv+vec2(e.x,0.)).r;
  float hu=texture2D(uH,iuv-vec2(0.,e.y)).r,hd=texture2D(uH,iuv+vec2(0.,e.y)).r;
  vec3 N=normalize(vec3((hl-hr)*uBump,(hu-hd)*uBump,1.));
  vec2 d2=(uLight-iuv)*vec2(ia,1.);
  float dist=length(d2);
  vec3 L=normalize(vec3(d2,.2));
  float diff=max(dot(N,L),0.);
  float spec=pow(max(dot(reflect(-L,N),vec3(0.,0.,1.)),0.),16.);
  /* the light trail, with torn cloudy edges */
  float m=texture2D(uM,iuv).r;
  float n=fbm(iuv*vec2(ia,1.)*7.+vec2(uTime*.035,-uTime*.022));
  float mw=clamp(m*3.,0.,1.);
  float mm=m+(n-.5)*.7*(1.-(1.-mw)*(1.-mw));
  float c=smoothstep(.13,.66,mm);
  vec3 lc=vec3(.30,.56,1.);
  float lum=dot(base,vec3(.299,.587,.114));
  vec3 tint=mix(base,lum*lc*1.8+base*.35,.78);
  float lit=c*(.32+1.3*diff);
  vec3 col=base*.5;
  col+=tint*lit*uGain*2.4;
  col+=lc*pow(c,1.5)*(.05+.11*n)*uGain;
  col+=lc*spec*c*.6*uGain;
  /* faint carved outline so the logo is just readable before the light finds it */
  float edge=clamp(length(vec2(hr-hl,hd-hu))*7.,0.,1.);
  col+=lc*edge*.05*(1.-uHome*.5);
  float pool=exp(-dist*dist*70.);
  col+=tint*pool*diff*uGain*.6+lc*pool*.045;
  /* vignette + out-of-picture fade */
  float vig=smoothstep(1.45,.25,length((sUv-.5)*vec2(sa,1.)*.95));
  col*=mix(1.,vig,.75);
  vec2 q=smoothstep(vec2(0.),vec2(.1),iuv)*smoothstep(vec2(0.),vec2(.1),1.-iuv);
  col*=q.x*q.y;
  /* flash flood */
  col=mix(col,lc*1.5+vec3(.35),clamp(uFlash,0.,1.)*.88*(1.-.45*length(sUv-.5)));
  col=1.-exp(-col*1.35);
  col+=(hash(sUv*uRes+uTime)-.5)*.014;
  gl_FragColor=vec4(col,1.);
}`;

const MW = 512, MH = 288;
const M = new Float32Array(MW * MH), U8 = new Uint8Array(MW * MH);
const HW = 640, HH = 360;

let fbEl = null, gl = null, prog = null, U = {}, tex = {}, imgEl = null, imgAR = 1672 / 941;

const initGL = () => {
  try {
    gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: false })
      || cv.getContext("experimental-webgl");
  } catch (_) { gl = null; }
  if (!gl) return false;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("[intro3d] shader:", gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return false;
  prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  ["uImg", "uH", "uM", "uRes", "uImgSize", "uPar", "uLight", "uCenter", "uTime", "uZoom", "uGain", "uFlash", "uBlur", "uHome", "uBump"]
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
  const mk = unit => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  tex.img = mk(0); tex.h = mk(1); tex.m = mk(2);
  gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uH, 1); gl.uniform1i(U.uM, 2);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, MW, MH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, U8);
  return true;
};

/* height map from the picture's own brightness: blurred, stretched, gamma-lifted */
const buildHeight = img => {
  const c = document.createElement("canvas"); c.width = HW; c.height = HH;
  const x = c.getContext("2d", { willReadFrequently: true });
  x.drawImage(img, 0, 0, HW, HH);
  const d = x.getImageData(0, 0, HW, HH).data, n = HW * HH;
  let a = new Float32Array(n), b = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;
  const box = (src, dst, r, horiz) => {
    const w = HW, h = HH, k = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) {
      let s = 0;
      for (let o = -r; o <= r; o++) {
        const px = horiz ? clamp(xx + o, 0, w - 1) : xx, py = horiz ? y : clamp(y + o, 0, h - 1);
        s += src[py * w + px];
      }
      dst[y * w + xx] = s * k;
    }
  };
  box(a, b, 2, true); box(b, a, 2, false); box(a, b, 2, true); box(b, a, 2, false);
  const sorted = Float32Array.from(a).sort(), lo = sorted[(n * 0.02) | 0], hi = sorted[(n * 0.995) | 0];
  const out = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.pow(clamp((a[i] - lo) / Math.max(1e-4, hi - lo), 0, 1), 0.6);
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v * 255; out[i * 4 + 3] = 255;
  }
  return out;
};

const uploadStatic = img => {
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.img);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  const h = buildHeight(img);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.h);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, HW, HH, 0, gl.RGBA, gl.UNSIGNED_BYTE, h);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
};

/* ------------------------------------------------------------------ light trail (CPU, soft-clouds) */
const stamp = (u, d, r, a) => {
  const cx = u * MW, cy = d * MH, r2 = r * r;
  const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(MW - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(MH - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy, row = y * MW;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dd = dx * dx + dy * dy;
      if (dd >= r2) continue;
      const q = 1 - dd / r2, w = a * q * q, i = row + x;
      M[i] = 1 - (1 - M[i]) * (1 - w);
    }
  }
};
const brush = (u, d, a, r) => {
  stamp(u, d, r, a);
  stamp(u + rnd(-.012, .012), d + rnd(-.02, .02), r * rnd(.45, .7), a * .55);
  if (Math.random() < .5) stamp(u + rnd(-.02, .02), d + rnd(-.03, .03), r * .4, a * .4);
};
let lastBrush = null;
const brushTo = (u, d, a, r) => {
  if (!lastBrush) { brush(u, d, a, r); lastBrush = [u, d]; return; }
  const dx = (u - lastBrush[0]) * MW, dy = (d - lastBrush[1]) * MH, L = Math.hypot(dx, dy);
  const step = Math.max(3, r * .38), nSteps = Math.min(40, Math.ceil(L / step));
  for (let i = 1; i <= nSteps; i++) { const t = i / nSteps; brush(lerp(lastBrush[0], u, t), lerp(lastBrush[1], d, t), a, r); }
  lastBrush = [u, d];
};

/* ------------------------------------------------------------------ geometry helpers */
let cw = 1, chh = 1, dpr = 1;
const coverScale = () => {
  const sa = cw / chh;
  return sa > imgAR ? [1, imgAR / sa] : [sa / imgAR, 1];
};
const baseZoom = () => {
  const sa = cw / chh;
  return Math.min(1.06, (0.82 * sa) / (0.352 * imgAR));
};
const screenToImg = (px, py) => {          // px,py 0..1 of the canvas box  →  image (u,d)
  const [sx, sy] = coverScale(), z = S.zoom;
  return [0.5 + (px - 0.5) * sx / z, S.cd + (py - 0.5) * sy / z];
};
const ringPoint = ang => [RING.cu + RING.ru * Math.sin(ang), RING.cd - RING.rd * Math.cos(ang)];

const resize = () => {
  const host = cv.parentElement; if (!host) return;
  const r = host.getBoundingClientRect();
  cw = Math.max(2, r.width); chh = Math.max(2, r.height);
  dpr = Math.min(window.devicePixelRatio || 1, S.mode === "home" ? 1.15 : 1.5);
  const w = Math.round(cw * dpr), h = Math.round(chh * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (gl) gl.viewport(0, 0, w, h);
};
addEventListener("resize", resize, { passive: true });
if (window.ResizeObserver) new ResizeObserver(resize).observe(root);

/* ------------------------------------------------------------------ pointer */
addEventListener("pointermove", e => {
  const r = cv.getBoundingClientRect();
  if (!r.width) return;
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  if (S.mode === "home" && (x < -0.02 || x > 1.02 || y < -0.02 || y > 1.02)) return;
  S.mx = clamp(x, 0, 1); S.my = clamp(y, 0, 1); S.hasPointer = true; S.lastMove = performance.now();
}, { passive: true });

/* ------------------------------------------------------------------ loader */
const weights = { font: .15, img: .35, prep: .15, page: .35 };
const taskProgress = () => Object.keys(weights).reduce((s, k) => s + weights[k] * S.tasks[k], 0);
const done = k => { S.tasks[k] = 1; };

const loadImage = () => new Promise(res => {
  let i = 0;
  const tryNext = () => {
    if (i >= CONFIG.img.length) return res(null);
    const im = new Image(); im.decoding = "async";
    im.onload = () => res(im); im.onerror = () => { i++; tryNext(); };
    im.src = CONFIG.img[i];
  };
  tryNext();
});

const setReady = () => {
  if (S.mode !== "loading") return;
  S.mode = "ready";
  root.classList.add("ready");
  document.body.classList.add("tm3d-ready");
  if (btn) { btn.disabled = false; try { btn.focus({ preventScroll: true }); } catch (_) {} }
};

/* ------------------------------------------------------------------ frame loop */
let last = performance.now(), raf = 0, glOK = false;
const frame = now => {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (document.hidden) return;
  if (S.mode === "home" && !S.visible) return;

  /* loader numbers */
  if (S.mode === "loading") {
    const el = now - S.t0;
    let target = Math.min(taskProgress(), clamp(el / CONFIG.minLoadMs, 0, 1));
    if (el > CONFIG.maxLoadMs) target = 1;
    S.shown += (target * 100 - S.shown) * Math.min(1, dt * 5);
    if (target >= 1 && S.shown > 99.4) S.shown = 100;
    if (pctEl) pctEl.textContent = Math.round(S.shown);
    if (lineEl) lineEl.style.transform = "scaleX(" + (S.shown / 100).toFixed(3) + ")";
    if (S.shown >= 100 && !S.readyQueued) { S.readyQueued = true; setTimeout(setReady, 350); }
  }

  /* who leads the light: loader ring → pointer → wandering spirit */
  const sp = S.spirit;
  let lead = null, a = 0.5, r = 24;
  if (S.mode === "loading") {
    const ang = (S.shown / 100) * Math.PI * 2;
    lead = ringPoint(ang + 0.04 * Math.sin(now * 0.004)); a = 0.85; r = 27;
  } else if (S.mode === "enter") {
    const k = clamp((now - S.enterT0) / CONFIG.holdMs, 0, 1);
    const ang = k * Math.PI * 6;
    lead = ringPoint(ang); a = 1; r = 40;
  } else {
    const active = S.hasPointer && (now - S.lastMove) < 2600;
    if (active) {
      const p = screenToImg(S.mx, S.my); lead = p;
      a = 0.62; r = S.mode === "home" ? 30 : 24;
    } else {
      sp.a += dt * 0.42;
      const w = S.mode === "home" ? 0.95 : 0.85;
      const u = RING.cu + RING.ru * w * Math.cos(sp.a * 1.0 + Math.sin(sp.a * 0.6)) * (S.mode === "home" ? 1.4 : 1);
      const d = RING.cd + RING.rd * w * Math.sin(sp.a * 1.27) * (S.mode === "home" ? 1.2 : 1);
      lead = [u, d]; a = 0.4; r = 26;
    }
  }
  if (lead) {
    if (S.mode === "enter") {
      brushTo(lead[0], lead[1], a, r);
      for (let i = 0; i < 3; i++) brush(rnd(.2, .8), rnd(.1, .85), .5, rnd(30, 60));
    } else brushTo(lead[0], lead[1], a, r);
    S.lightT = lead;
  }
  S.light[0] += (S.lightT[0] - S.light[0]) * Math.min(1, dt * 9);
  S.light[1] += (S.lightT[1] - S.light[1]) * Math.min(1, dt * 9);

  /* parallax target: pointer, or a slow sway; scrolling Home adds depth */
  const scrollK = S.mode === "home" ? clamp(scrollY / Math.max(1, innerHeight), 0, 1.5) : 0;
  if (S.hasPointer && fine) { S.parT[0] = (S.mx - 0.5) * 2; S.parT[1] = (S.my - 0.5) * 2; }
  else { S.parT[0] = Math.sin(now * 0.00031) * 0.7; S.parT[1] = Math.cos(now * 0.00023) * 0.5; }
  S.par[0] += (S.parT[0] - S.par[0]) * Math.min(1, dt * 3);
  S.par[1] += (S.parT[1] + scrollK * 0.9 - S.par[1]) * Math.min(1, dt * 3);

  /* dive-in */
  if (S.mode === "enter") {
    const k = clamp((now - S.enterT0) / CONFIG.holdMs, 0, 1);
    const tSec = (now - S.enterT0) / 1000;
    S.zoom = lerp(glOK ? baseZoom() : 1, glOK ? CONFIG.zoomEnd : 5, Math.pow(k, 2.5)) * (1 + 0.05 * Math.exp(-tSec * 9));   // small punch on the boom
    S.cd = lerp(0.553, RING.cd, smooth(0, 0.8, k));
    S.gain = lerp(1, 2.4, k);
    S.blur = smooth(0.2, 1, k);
    S.flash = smooth(0.7, 1, k);
    if (flash) flash.style.opacity = (smooth(0.62, 0.98, k)).toFixed(3);
    if (k >= 1) toHome();
  }

  /* Home: the light settles from bright to calm while the sound's tail fades out */
  if (S.mode === "home") S.gain = lerp(1.7, 0.9, smooth(0, 1, (now - S.homeT0) / 3600));

  /* trail decay + upload */
  const decay = Math.exp(-dt / CONFIG.trailSeconds);
  for (let i = 0; i < M.length; i++) { const v = M[i] * decay; M[i] = v; U8[i] = v * 255; }

  if (!glOK) { if (fbEl) { fbEl.style.transformOrigin = "50% 46%"; fbEl.style.transform = "scale(" + S.zoom.toFixed(3) + ")"; } return; }
  gl.uniform2f(U.uRes, cv.width, cv.height);
  gl.uniform2f(U.uImgSize, 1672, 941);
  gl.uniform2f(U.uPar, S.par[0], S.par[1]);
  gl.uniform2f(U.uLight, S.light[0], S.light[1]);
  gl.uniform2f(U.uCenter, 0.5, S.cd);
  gl.uniform1f(U.uTime, now / 1000);
  gl.uniform1f(U.uZoom, S.zoom);
  gl.uniform1f(U.uGain, S.gain);
  gl.uniform1f(U.uFlash, S.flash);
  gl.uniform1f(U.uBlur, S.blur);
  gl.uniform1f(U.uHome, S.home);
  gl.uniform1f(U.uBump, CONFIG.bump);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex.m);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, MW, MH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, U8);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

/* ------------------------------------------------------------------ enter → home */
const startEnter = () => {
  if (S.entering || S.mode !== "ready") return;
  S.entering = true; S.mode = "enter"; S.enterT0 = performance.now();
  playIntroSound();                                      // inside the click gesture: instant boom
  window.__introHold = reduce ? 260 : CONFIG.holdMs;     // the site's own entrance (hero text, toast) waits for this
  root.classList.add("go");
  document.body.classList.add("tm3d-go");
  /* safety: even if the browser is slow to draw frames, the intro never blocks the site */
  setTimeout(toHome, CONFIG.holdMs + 500);
  /* ignite the whole ring at once */
  for (let i = 0; i < 60; i++) { const p = ringPoint(i / 60 * Math.PI * 2); brush(p[0], p[1], .9, 34); }
  if (reduce) { S.zoom = baseZoom(); setTimeout(toHome, 220); S.mode = "enter"; }
};

const toHome = () => {
  if (S.mode === "home") return;
  S.mode = "home"; S.home = 1; S.flash = 0; S.blur = 0; S.gain = 1.7; S.homeT0 = performance.now();
  S.zoom = CONFIG.homeZoom; S.cd = 0.5; M.fill(0);
  const hero = document.querySelector(".hero");
  if (hero && glOK) {
    cv.classList.add("tm3d-hero");
    hero.insertBefore(cv, hero.firstChild);
    new IntersectionObserver(es => es.forEach(e => { S.visible = e.isIntersecting; }), { threshold: 0 }).observe(hero);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(hero);
  }
  resize();
  if (!glOK) cancelAnimationFrame(raf);
  root.classList.add("done");
  if (flash) flash.style.opacity = 0;
  setTimeout(() => { root.remove(); }, 1500);
  dispatchEvent(new CustomEvent("tm3d:entered"));
};

/* the gate keeps its old handlers (sound, toast, unlock); we only decide WHEN they may run */
if (gate) {
  gate.addEventListener("click", e => {
    if (S.mode !== "ready") { e.stopPropagation(); e.preventDefault(); return; }
    startEnter();
  }, true);
  gate.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (S.mode !== "ready") { e.stopPropagation(); e.preventDefault(); return; }
    startEnter();
  }, true);
}

/* ------------------------------------------------------------------ intro sound
   audio/intro-enter.mp3 (trimmed): boom at 0 s  →  riser while the camera dives  →  drop at 2.34 s (flash)  →  settle tail.
   Decoded during loading, so the boom starts the instant ENTER is pressed. */
const SND = { ctx: null, buf: null, el: null, lim: null };
const prepSound = () => {
  try { SND.el = new Audio(CONFIG.sound); SND.el.preload = "auto"; SND.el.volume = Math.min(1, CONFIG.soundGain); } catch (_) {}
  if (location.protocol === "file:") return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    SND.ctx = new AC();
    SND.lim = SND.ctx.createDynamicsCompressor();
    SND.lim.threshold.value = -3; SND.lim.knee.value = 0; SND.lim.ratio.value = 20;
    SND.lim.connect(SND.ctx.destination);
    fetch(CONFIG.sound).then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
      .then(ab => new Promise((res, rej) => { const p = SND.ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }))
      .then(b => { SND.buf = b; }).catch(() => {});
  } catch (_) { SND.ctx = null; }
};
const playIntroSound = () => {
  const viaTag = () => { try { if (SND.el) { SND.el.currentTime = 0; const p = SND.el.play(); if (p && p.catch) p.catch(() => {}); } } catch (_) {} };
  if (!(SND.ctx && SND.buf)) return viaTag();
  const go = () => {
    try {
      const src = SND.ctx.createBufferSource(); src.buffer = SND.buf;
      const g = SND.ctx.createGain(); g.gain.value = CONFIG.soundGain;
      src.connect(g); g.connect(SND.lim); src.start();
    } catch (_) { viaTag(); }
  };
  if (SND.ctx.state === "suspended") SND.ctx.resume().then(go).catch(viaTag); else go();
};

/* ------------------------------------------------------------------ boot */
const boot = async () => {
  prepSound();
  glOK = initGL();
  resize();
  if (!glOK) {
    /* graceful fallback: the still picture, dimmed; the rest still works */
    cv.style.display = "none";
    const fb = fbEl = new Image(); fb.className = "tm3d-fallback"; fb.alt = ""; fb.src = CONFIG.img[0];
    fb.onerror = () => { fb.src = CONFIG.img[1]; };
    root.insertBefore(fb, root.firstChild);
  }
  S.zoom = glOK ? baseZoom() : 1;
  raf = requestAnimationFrame(frame);

  const fontP = (document.fonts && document.fonts.load ? document.fonts.load('64px "Rubik Dirt"', "TIAMO0123456789%") : Promise.resolve())
    .catch(() => {}).then(() => { done("font"); revealTitle(); });
  const imgP = loadImage().then(img => {
    imgEl = img; done("img");
    if (img && glOK) { imgAR = img.naturalWidth / img.naturalHeight; try { uploadStatic(img); } catch (e) { console.warn("[intro3d]", e); } }
    done("prep");
  });
  const pageP = new Promise(res => {
    if (document.readyState === "complete") res(); else addEventListener("load", res, { once: true });
    setTimeout(res, CONFIG.maxLoadMs - 400);
  }).then(() => done("page"));
  await Promise.all([fontP, imgP, pageP]);
};
boot();

/* Home background stays alive only while it can be seen */
document.addEventListener("visibilitychange", () => { last = performance.now(); });
})();
