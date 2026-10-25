/* ==========================================================================
   INTRO 3D  (relief renderer)
   ─ The logo picture is the surface colour (its identity is never repainted). A depth map built
     from the picture itself (images/intro-depth.webp) gives the T, the M and the ring their real height.
   ─ Every pixel ray-marches that height field from a perspective camera (true occlusion parallax),
     marches again toward the light (real self-shadows), and gets light shafts that pass between the
     columns, ground mist and floating dust at three depths.
   ─ The camera drifts on its own and orbits with the mouse. The light follows the mouse and leaves a fading trail.
   ─ Loading: the light draws the ring while the real assets load (0 → 100 %).
   ─ ENTER: the camera dives through the logo, light blooms, and the SAME canvas stays behind the
     Home section as a faint 3D watermark graded in the site's purple / cyan.
   Tunables: CONFIG below.   Test a lower quality:  add  ?q=0  or  ?q=1  to the address.
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
  depthMap: "images/intro-depth.webp",
  depth: 0.10,              // how tall the columns stand (in screen heights)
  lightH: 0.30,             // height of the light above the stone (lower = longer shadows)
  trailSeconds: 1.35,       // how long the light trail lingers
  bump: 14,                 // surface relief strength
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
  light: [RING.cu, RING.cd], lightT: [RING.cu, RING.cd],
  spirit: { a: Math.random() * 6.28, u: RING.cu, d: RING.cd, init: false },
  zoom: 1, cd: 0.5, cu: 0.5, gain: 1, flash: 0, home: 0, dolly: 0, fade: 0, cam: [0, 0], camT: [0, 0], q: 2, ema: 16, qT: 0,
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

/* ------------------------------------------------------------------ WebGL
   Relief renderer: the logo picture is the surface colour, a depth map (images/intro-depth.webp, built from the
   picture itself) gives every column its real height. Per pixel we ray-march that height field from a
   perspective camera (true occlusion parallax), march again toward the light (real self-shadows), and add
   light shafts that pass between the columns, ground mist and floating dust. */
const VERT = "attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uImg,uD,uM;
uniform vec2 uRes,uImgSize,uCenter,uCam,uLight,uSun;
uniform float uTime,uZoom,uDolly,uGain,uFlash,uHome,uBump,uDepth,uSteps,uShSteps,uRays,uAmb,uLightH,uFade;
uniform vec3 uKey,uRim,uAcc;
const int NS=30;
const int SS=14;
const int RS=22;

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*vnoise(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
float H(vec2 uv){return texture2D(uD,uv).r;}

void main(){
  vec2 sUv=vec2(vUv.x,1.-vUv.y);
  float sa=uRes.x/uRes.y,ia=uImgSize.x/uImgSize.y;
  vec2 sc=sa>ia?vec2(1.,ia/sa):vec2(sa/ia,1.);
  vec2 K=sc/uZoom/vec2(sa,1.);                 /* screen-height units -> image uv */
  vec2 gc=(sUv-.5)*vec2(sa,1.);                /* pixel position, screen-height units */
  vec2 g=uCenter+gc*K;                         /* where the pixel's ray meets the ground plane */

  /* ---- camera + occlusion parallax ---- */
  vec3 E=vec3(uCam*.55,mix(1.55,.62,uDolly));
  vec3 V=normalize(E-vec3(gc,0.));
  vec2 dir=(V.xy/V.z)*uDepth*K;
  float h=1.,hP=1.;
  vec2 u=g+dir,uP=u;
  float Hs=H(u),HP=Hs;
  for(int i=0;i<NS;i++){
    if(float(i)>=uSteps||Hs>=h)break;
    hP=h;uP=u;HP=Hs;
    h-=1./uSteps;
    u=g+dir*h;
    Hs=H(u);
  }
  float f0=HP-hP,f1=Hs-h;
  float t=clamp(f0/(f0-f1-1e-5),0.,1.);
  vec2 uv=mix(uP,u,t);
  float hh=mix(hP,h,t);

  /* ---- surface ---- */
  vec3 baseRaw=texture2D(uImg,uv).rgb;
  if(uDolly>.05){
    vec2 sv=dir*(.02+.05*uDolly);
    baseRaw=(baseRaw*2.+texture2D(uImg,uv-sv).rgb+texture2D(uImg,uv+sv).rgb+texture2D(uImg,uv-sv*2.).rgb*.5+texture2D(uImg,uv+sv*2.).rgb*.5)/5.;
  }
  vec3 base=pow(baseRaw,vec3(.74))*1.1;
  vec2 e=vec2(1./1024.,1./576.)*1.6;
  vec3 dl=texture2D(uD,uv-vec2(e.x,0.)).rgb,dr=texture2D(uD,uv+vec2(e.x,0.)).rgb;
  vec3 du=texture2D(uD,uv-vec2(0.,e.y)).rgb,dd=texture2D(uD,uv+vec2(0.,e.y)).rgb;
  vec3 dc=texture2D(uD,uv).rgb;
  vec2 gMacro=vec2(dl.r-dr.r,du.r-dd.r);
  vec2 gMicro=vec2(dl.g-dr.g,du.g-dd.g);
  vec3 N=normalize(vec3(gMacro*uBump*.5+gMicro*uBump*.05,1.));

  /* ---- key light (follows the pointer) + memory of where it has been ---- */
  vec2 Ld=(uLight-uv)/K;
  vec3 L=normalize(vec3(Ld,uLightH-hh*uDepth));
  float dist=length(Ld);
  float att=1./(1.+pow(dist/.27,2.4));
  float trail=texture2D(uM,uv).r;
  float diff=max(dot(N,L),0.);
  float lit=clamp(att+trail*.55,0.,1.2);

  /* self shadow: march from the surface toward the light through the height field */
  float sh=1.;
  vec2 ldir=(L.xy/max(L.z,.12))*uDepth*K;
  for(int k=1;k<=SS;k++){
    if(float(k)>uShSteps)break;
    float fk=float(k)/uShSteps;
    float hk=hh+(1.-hh)*fk;
    vec2 us=uv+ldir*(hk-hh);
    float blk=H(us)-hk;
    sh=min(sh,1.-smoothstep(-.01,.05,blk)*.92);
  }
  float ao=.55+.45*smoothstep(.0,.35,hh+dc.r*.4);

  vec3 col=base*uAmb*ao;
  col+=base*uKey*lit*(.2+.95*diff)*sh*uGain*1.15;
  col+=uKey*pow(max(dot(reflect(-L,N),vec3(0.,0.,1.)),0.),26.)*lit*sh*.16*uGain*(.3+dc.b);
  /* rim light: from behind the logo, grazing the tops of the columns */
  vec3 Lr=normalize(vec3(-.35,-.55,.5));
  float rim=pow(max(dot(N,Lr),0.),2.)*smoothstep(.1,.6,hh)*(.35+dc.b);
  col+=uRim*rim*.22*(.5+.5*uGain);

  /* ---- light shafts between the columns (the height field is the occluder) ---- */
  float rays=0.;
  if(uRays>.5){
    vec2 sun=uSun;
    float acc=0.,dec=1.;
    for(int r=0;r<RS;r++){
      if(float(r)>=uRays)break;
      float fr=(float(r)+hash(sUv*91.+uTime))/uRays;
      vec2 sp=mix(uv,sun,fr);
      float occ=smoothstep(.22,.55,H(sp));
      acc+=(1.-occ)*dec; dec*=.93;
    }
    float toSun=length((uv-sun)/K);
    rays=acc/uRays*exp(-toSun*1.5)*smoothstep(.0,.25,toSun);
  }
  col+=mix(uRim,uAcc,.35)*rays*(.28+.6*uHome)*uGain;

  /* ---- ground mist, brighter where the light touches it ---- */
  float mist=fbm(uv*vec2(ia,1.)*3.2+vec2(uTime*.018,-uTime*.011));
  float mistAmt=smoothstep(.35,.8,mist)*(1.-hh)*(.5+.5*smoothstep(.0,.5,1.-dc.b));
  col+=(uKey*.12+uAcc*.04)*mistAmt*(.08+lit*.7)*uGain;

  /* ---- dust motes in 3 depth layers: they parallax with the camera ---- */
  float dust=0.;
  for(int dl2=0;dl2<3;dl2++){
    float fl=float(dl2);
    float sz=7.+fl*6.;
    vec2 p=sUv*vec2(sa,1.)*sz+uCam*(.35+fl*.5)*(1.+fl)+vec2(uTime*(.03+.015*fl),-uTime*(.05+.02*fl))+fl*13.7;
    vec2 id=floor(p),fp=fract(p);
    float r=hash(id+fl*3.1);
    vec2 o=vec2(hash(id+1.7),hash(id+9.2))*.7+.15;
    float d=length(fp-o);
    float tw=.55+.45*sin(uTime*(1.2+r*3.)+r*40.);
    dust+=smoothstep(.07-fl*.012,.0,d)*step(.74,r)*tw*(.45-fl*.1);
  }
  col+=mix(uRim,vec3(1.),.35)*dust*(.12+lit*1.1)*(.4+.6*uGain);

  /* ---- grade: the logo keeps its shading; in Home its colours follow the site palette ---- */
  float lum=dot(col,vec3(.299,.587,.114));
  /* purple in the bases and shadows, cyan on the lit edges of the columns: the site's own two colours */
  vec3 hg=mix(uKey,uRim,smoothstep(.18,.85,hh*.7+lum*1.1));
  col=mix(col,vec3(lum)*hg*1.55+col*.10,uHome*.9);

  /* ---- vignette, picture edges ---- */
  float vig=smoothstep(1.25,.15,length(gc*vec2(.9,1.1)));
  col*=mix(1.,vig,.9);
  vec2 q=smoothstep(vec2(0.),vec2(.1),uv)*smoothstep(vec2(0.),vec2(.1),1.-uv);
  col*=q.x*q.y;

  /* ---- flash flood while diving in ---- */
  float fl=clamp(uFlash,0.,1.);
  vec3 fcol=mix(vec3(.62,.8,1.),mix(uKey,uRim,.5)*1.5+vec3(.25),uHome);
  /* the flash is light blooming around the logo, not a flat wash: shapes stay readable until the very end */
  float bloom=smoothstep(.0,.55,lum)*.9+.25;
  col=col*(1.-fl*.5)+fcol*fl*bloom*(1.-.35*length(gc))*1.05;
  /* filmic tone map: bright areas roll off instead of blowing out */
  col=col*1.15;
  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  col+=(hash(sUv*uRes+uTime)-.5)*.016;
  gl_FragColor=vec4(clamp(col,0.,1.)*uFade,1.);
}`;

const MW = 512, MH = 288;
const M = new Float32Array(MW * MH), U8 = new Uint8Array(MW * MH);

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
  ["uImg", "uD", "uM", "uRes", "uImgSize", "uCenter", "uCam", "uLight", "uSun", "uTime", "uZoom", "uDolly", "uGain", "uFlash", "uHome",
   "uBump", "uDepth", "uSteps", "uShSteps", "uRays", "uAmb", "uLightH", "uFade", "uKey", "uRim", "uAcc"]
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
  const mk = unit => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  tex.img = mk(0); tex.d = mk(1); tex.m = mk(2);
  gl.uniform1i(U.uImg, 0); gl.uniform1i(U.uD, 1); gl.uniform1i(U.uM, 2);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  /* neutral depth until the real one arrives: flat ground, no relief */
  gl.activeTexture(gl.TEXTURE1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 128, 0]));
  gl.activeTexture(gl.TEXTURE2);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, MW, MH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, U8);
  return true;
};

const uploadStatic = (img, depth) => {
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.img);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
  if (depth) {
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.d);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, depth);
  }
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
/* the whole ring (0.352 x 0.532 of the picture) is always framed, never cropped */
const fitZoom = (hFrac, wFrac) => {
  const [sx, sy] = coverScale();
  return Math.min(hFrac * sy / 0.532, wFrac * sx / 0.352);
};
const QT = [{ st: 12, sh: 4, ry: 8, dpr: 1 }, { st: 20, sh: 8, ry: 14, dpr: 1.25 }, { st: 30, sh: 14, ry: 22, dpr: 1.5 }];
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const P_INTRO = { key: [0.50, 0.68, 0.96], rim: [0.66, 0.80, 0.98], acc: [0.44, 0.62, 0.95] };
const P_HOME = { key: [0.52, 0.28, 1.0], rim: [0.10, 0.80, 1.0], acc: [0.92, 0.30, 0.90] };
const screenToImg = (px, py) => {          // px,py 0..1 of the canvas box  →  image (u,d)
  const [sx, sy] = coverScale(), z = S.zoom;
  return [S.cu + (px - 0.5) * sx / z, S.cd + (py - 0.5) * sy / z];
};
const ringPoint = ang => [RING.cu + RING.ru * Math.sin(ang), RING.cd - RING.rd * Math.cos(ang)];

const resize = () => {
  const host = cv.parentElement; if (!host) return;
  const r = host.getBoundingClientRect();
  cw = Math.max(2, r.width); chh = Math.max(2, r.height);
  dpr = Math.min(window.devicePixelRatio || 1, QT[S.q].dpr, S.mode === "home" ? 1.15 : 1.5);
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
const qParam = /[?&]q=([0-2])/.exec(location.search), forcedQ = !!qParam;
const kDbgM = /[?&]tm3dk=([0-9.]+)/.exec(location.search);
let dbgK = kDbgM ? +kDbgM[1] : null;                       // test hook: freeze the dive at a chosen point
window.__tm3dK = v => { dbgK = v; };
const enterK = now => (dbgK !== null ? dbgK : clamp((now - S.enterT0) / CONFIG.holdMs, 0, 1));
S.q = qParam ? +qParam[1] : (!fine || (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2);
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
    const k = enterK(now);
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

  /* camera: pointer orbit, or a slow cinematic drift; scrolling Home moves it */
  const tt = now / 1000;
  const scrollK = S.mode === "home" ? clamp(scrollY / Math.max(1, innerHeight), 0, 1.5) : 0;
  if (S.hasPointer && (now - S.lastMove) < 6000) { S.camT[0] = (S.mx - 0.5) * 2 * 0.95; S.camT[1] = (S.my - 0.5) * 2 * 0.6; }
  else { S.camT[0] = Math.sin(tt * 0.23) * 0.5; S.camT[1] = Math.cos(tt * 0.17) * 0.25; }

  /* framing + the dive-in */
  const [, sy] = coverScale();
  const zI = fitZoom(0.50, 0.66), cdI = RING.cd + (0.5 - 0.41) * sy / zI, zH = fitZoom(0.92, 0.74);
  const rtl = document.documentElement.dir === "rtl" || document.documentElement.lang === "ar";
  const [sxH] = coverScale(), cuH = RING.cu - ((rtl ? 0.47 : 0.53) - 0.5) * sxH / zH, cdH = RING.cd + (0.5 - 0.5) * sy / zH;
  let dolly = 0, flashK = 0, homeMix = 0, gain = 1, amb = 0.42;
  if (S.mode === "enter") {
    const k = enterK(now), tSec = (now - S.enterT0) / 1000;
    S.zoom = lerp(zI, zI * 2.7, Math.pow(k, 2.3)) * (1 + 0.04 * Math.exp(-tSec * 9));      // small punch on the boom
    S.cd = lerp(cdI, RING.cd, smooth(0, 0.85, k)); S.cu = 0.5;
    dolly = Math.pow(k, 1.7); gain = lerp(1, 1.9, k); flashK = smooth(0.72, 1, k); homeMix = smooth(0.5, 1, k);
    S.camT[0] = Math.sin(k * 2.4) * 0.55; S.camT[1] = -0.25 * k;
    amb = lerp(0.42, 0.55, homeMix);
    if (flash) flash.style.opacity = (smooth(0.66, 1, k) * 0.5).toFixed(3);
    if (k >= 1) toHome();
  } else if (S.mode === "home") {
    S.zoom = zH; S.cd = cdH; S.cu = cuH; homeMix = 1; amb = 0.3;
    gain = lerp(1.5, 1.0, smooth(0, 1, (now - S.homeT0) / 3600));   // the light settles while the sound's tail fades
    S.camT[1] += scrollK * 0.5;
  } else { S.zoom = zI; S.cd = cdI; S.cu = 0.5; }
  S.cam[0] += (S.camT[0] - S.cam[0]) * Math.min(1, dt * 2.6);
  S.cam[1] += (S.camT[1] - S.cam[1]) * Math.min(1, dt * 2.6);
  S.fade = S.mode === "loading" ? clamp((now - S.t0) / 1400, 0, 1) : 1;

  /* adapt quality to the device: if frames are slow, drop the ray-march cost */
  S.ema = S.ema * 0.94 + dt * 1000 * 0.06;
  if (!forcedQ && S.ema > 27 && S.q > 0 && now - S.qT > 2500 && now - S.t0 > 2500) { S.q--; S.qT = now; S.ema = 18; resize(); }

  /* trail decay + upload */
  const decay = Math.exp(-dt / (S.mode === "loading" ? 7 : CONFIG.trailSeconds));
  for (let i = 0; i < M.length; i++) { const v = M[i] * decay; M[i] = v; U8[i] = v * 255; }

  if (!glOK) { if (fbEl) { fbEl.style.transformOrigin = "50% 46%"; fbEl.style.transform = "scale(" + (S.mode === "enter" ? S.zoom / zI : 1).toFixed(3) + ")"; } return; }
  const Q = QT[S.q], key = lerp3(P_INTRO.key, P_HOME.key, homeMix), rim = lerp3(P_INTRO.rim, P_HOME.rim, homeMix), acc = lerp3(P_INTRO.acc, P_HOME.acc, homeMix);
  gl.uniform2f(U.uRes, cv.width, cv.height);
  gl.uniform2f(U.uImgSize, 1672, 941);
  gl.uniform2f(U.uCenter, S.cu, S.cd);
  gl.uniform2f(U.uCam, S.cam[0], S.cam[1]);
  gl.uniform2f(U.uLight, S.light[0], S.light[1]);
  gl.uniform2f(U.uSun, RING.cu + 0.02 * Math.sin(tt * 0.3), RING.cd - 0.17);
  gl.uniform1f(U.uTime, tt);
  gl.uniform1f(U.uZoom, S.zoom);
  gl.uniform1f(U.uDolly, dolly);
  gl.uniform1f(U.uGain, gain);
  gl.uniform1f(U.uFlash, flashK);
  gl.uniform1f(U.uHome, homeMix);
  gl.uniform1f(U.uBump, CONFIG.bump);
  gl.uniform1f(U.uDepth, CONFIG.depth);
  gl.uniform1f(U.uSteps, Math.min(30, Q.st + Math.round(dolly * 8)));
  gl.uniform1f(U.uShSteps, Q.sh);
  gl.uniform1f(U.uRays, S.mode === "home" ? Math.round(Q.ry * 0.7) : Q.ry);
  gl.uniform1f(U.uAmb, amb);
  gl.uniform1f(U.uLightH, CONFIG.lightH);
  gl.uniform1f(U.uFade, smooth(0, 1, S.fade));
  gl.uniform3f(U.uKey, key[0], key[1], key[2]);
  gl.uniform3f(U.uRim, rim[0], rim[1], rim[2]);
  gl.uniform3f(U.uAcc, acc[0], acc[1], acc[2]);
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
  if (dbgK === null) setTimeout(toHome, CONFIG.holdMs + 500);
  /* ignite the whole ring at once */
  for (let i = 0; i < 60; i++) { const p = ringPoint(i / 60 * Math.PI * 2); brush(p[0], p[1], .9, 34); }
  if (reduce) { setTimeout(toHome, 220); }
};

const toHome = () => {
  if (S.mode === "home") return;
  S.mode = "home"; S.home = 1; S.homeT0 = performance.now();
  M.fill(0);
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
  S.zoom = glOK ? fitZoom(0.50, 0.66) : 1;
  raf = requestAnimationFrame(frame);

  const fontP = (document.fonts && document.fonts.load ? document.fonts.load('64px "Rubik Dirt"', "TIAMO0123456789%") : Promise.resolve())
    .catch(() => {}).then(() => { done("font"); revealTitle(); });
  const loadDepth = () => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = CONFIG.depthMap; });
  const imgP = Promise.all([loadImage(), loadDepth()]).then(([img, dep]) => {
    imgEl = img; done("img");
    if (img && glOK) { imgAR = img.naturalWidth / img.naturalHeight; try { uploadStatic(img, dep); } catch (e) { console.warn("[intro3d]", e); } }
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
