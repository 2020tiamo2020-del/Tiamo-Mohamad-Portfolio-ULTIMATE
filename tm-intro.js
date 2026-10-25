/* ==========================================================================
   TM INTRO — cinematic 3D relief logo
   The artwork is never redrawn or altered: it is the albedo of a real-time
   relief (normal + height maps derived from it), lit by your pointer.
   Loading -> Enter with sound -> camera pushes through the emblem -> the same
   3D logo settles, transparent and still reactive, behind Home only.
   Raw WebGL, no libraries. If WebGL is unavailable, a flat fallback is used.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__tmIntro) return;
  window.__tmIntro = true;

  const gate = document.getElementById("enterGate");
  const cv = document.getElementById("tmIntroCv");
  const stage = document.getElementById("tmIntroStage");
  const btn = document.getElementById("enterGateBtn");
  if (!gate || !cv || !stage || !btn || !gate.classList.contains("tm-intro")) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOut5 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const IMG_W = 1600, IMG_H = 900, RING_D = 560;          /* source size / the emblem ring diameter inside it */
  const SRC = { alb: "images/intro-albedo.jpg", nor: "images/intro-normal.jpg", hei: "images/intro-height.jpg" };

  gate.classList.add("tm-js");
  const numEl = document.getElementById("tmLoadNum"), barEl = document.getElementById("tmLoadBar");
  btn.disabled = true;

  /* ------------------------------------------------------------------ GL */
  const VS = "attribute vec2 aPos;varying vec2 vP;void main(){vP=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}";
  const FS = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH", "precision highp float;", "#else", "precision mediump float;", "#endif",
    "varying vec2 vP;",
    "uniform sampler2D uAlb,uNor,uHei;",
    "uniform vec2 uRes,uZc,uTilt;",
    "uniform vec4 uRect;",
    "uniform float uZoom,uAmb,uInt,uTime,uAlphaMode,uOpacity;",
    "uniform vec3 uCol;",
    "uniform vec4 uL[16];",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);",
    " return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}",
    "float fbm(vec2 p){float a=0.5,s=0.0;for(int i=0;i<4;i++){s+=a*noise(p);p*=2.03;a*=0.5;}return s;}",
    "void main(){",
    " vec2 p=vec2(vP.x,1.0-vP.y)*uRes;",
    /* pass 1: height at uniform zoom, used to make nearer (taller) stone magnify more = real dolly parallax */
    " vec2 q0=uZc+(p-uZc)/(1.0+uZoom);",
    " float h0=texture2D(uHei,(q0-uRect.xy)/uRect.zw).r;",
    " float sc=1.0+uZoom*(0.62+0.95*h0);",
    " vec2 q=uZc+(p-uZc)/sc;",
    " q-=uTilt*(h0-0.32)*uRect.z*0.022;",                   /* pointer tilt = parallax by depth */
    " vec2 uv=(q-uRect.xy)/uRect.zw;",
    " vec3 col=vec3(0.0);float lum=0.0;",
    " if(uv.x>0.0&&uv.x<1.0&&uv.y>0.0&&uv.y<1.0){",
    "  float h=texture2D(uHei,uv).r;",
    "  vec3 alb=texture2D(uAlb,uv).rgb;",
    "  vec3 n=normalize(texture2D(uNor,uv).rgb*2.0-1.0);",
    "  vec3 base=uCol;",
    "  col=alb*uAmb*base*1.2;",
    "  for(int i=0;i<16;i++){",
    "   vec4 L=uL[i];",
    "   if(L.w>0.001){",
    "    vec2 dv=L.xy-p;float d=length(dv);",
    "    float a=1.0-clamp(d/L.z,0.0,1.0);a=a*a*(3.0-2.0*a);",
    "    float m=smoothstep(0.02,0.42,a*1.55+(h-0.38)*0.55);",   /* raised stone catches the light first -> rocky, ragged edge */
    "    vec3 ld=normalize(vec3(dv/L.z,0.55));",
    "    float dif=max(dot(n,ld),0.0);",
    "    float sp=pow(max(dot(n,normalize(ld+vec3(0.0,0.0,1.0))),0.0),30.0);",
    "    float rim=smoothstep(0.08,0.5,length(n.xy));",
    "    vec3 lc=uCol*1.1;",
    "    col+=alb*(0.6+0.55*dif)*0.8*m*L.w*(uCol*0.9+0.25)+lc*sp*m*L.w*0.3+uCol*rim*m*L.w*0.2;",
    "   }",
    "  }",
    "  float fog=fbm(q*0.0045+vec2(uTime*0.035,-uTime*0.02));",
    "  col+=vec3(0.04,0.09,0.2)*fog*0.9*uAmb*3.0;",
    "  float vk=mix(2.05,1.85,uAlphaMode);",
    "  float v=smoothstep(1.0,0.28,length((uv-0.5)*vec2(1.0,1.15)*vk));",
    "  v*=smoothstep(0.0,0.26,uv.x)*smoothstep(0.0,0.26,1.0-uv.x)*smoothstep(0.0,0.3,uv.y)*smoothstep(0.0,0.3,1.0-uv.y);",
    "  col*=v*uInt;",
    "  col=1.0-exp(-col*0.8);",
    "  lum=dot(col,vec3(0.299,0.587,0.114));",
    " }",
    " vec2 bp=(p/uRes-vec2(0.5,0.46))*vec2(1.0,1.25);",
    " vec3 bg=mix(vec3(0.043,0.071,0.149),vec3(0.016,0.02,0.047),smoothstep(0.0,1.0,length(bp)*1.25));",
    " float ef=mix(smoothstep(0.0,0.2,vP.x)*smoothstep(0.0,0.2,1.0-vP.x)*smoothstep(0.0,0.16,vP.y)*smoothstep(0.0,0.24,1.0-vP.y),1.0,uAlphaMode);",
    " lum*=ef;col*=ef;",
    " float a=mix(clamp(lum*2.8,0.0,1.0),1.0,uAlphaMode)*uOpacity;",
    " vec3 rgb=mix(min(col,vec3(a)),(col+bg)*uOpacity,uAlphaMode);",
    " gl_FragColor=vec4(rgb,a);",
    "}"
  ].join("\n");

  const PVS = [
    "attribute vec4 aP;attribute float aS;",
    "uniform vec2 uRes,uZc,uTilt;uniform float uZoom,uTime,uDpr,uAlphaMode;",
    "varying float vA;",
    "void main(){",
    " float t=uTime*(0.018+aP.w*0.03);",
    " vec2 pos=vec2(fract(aP.x+sin(t*6.2831+aP.w*12.0)*0.03),fract(aP.y-t*0.7));",
    " vec2 p=pos*uRes;",
    " p+=uTilt*(aP.z-0.4)*46.0;",
    " float sc=1.0+uZoom*(0.45+1.7*aP.z);",
    " p=uZc+(p-uZc)*sc;",
    " gl_Position=vec4(p.x/uRes.x*2.0-1.0,1.0-p.y/uRes.y*2.0,0.0,1.0);",
    " gl_PointSize=max(1.0,(1.2+aP.z*3.6)*aS*sc*uDpr);",
    " vA=(0.12+0.5*aP.z)*(0.55+0.45*sin(uTime*1.4+aP.w*30.0))*mix(0.55,1.0,uAlphaMode);",
    "}"
  ].join("\n");
  const PFS = [
    "precision mediump float;varying float vA;",
    "void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.0,d)*vA;",
    " gl_FragColor=vec4(vec3(0.55,0.78,1.0)*a,a*0.7);}"
  ].join("\n");

  let gl = null;
  try {
    const opt = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" };
    gl = cv.getContext("webgl", opt) || cv.getContext("experimental-webgl", opt);
  } catch (_) { gl = null; }

  let prog = null, pprog = null, U = {}, PU = {}, quad = null, pbuf = null, PN = 0;
  const tex = {};
  const imgs = { alb: new Image(), nor: new Image(), hei: new Image() };
  const state = { alb: false, nor: false, hei: false, font: false };

  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const link = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  };
  const initGL = () => {
    prog = link(VS, FS); pprog = link(PVS, PFS);
    ["uAlb","uNor","uHei","uRes","uZc","uTilt","uRect","uZoom","uAmb","uInt","uTime","uAlphaMode","uOpacity","uL","uCol"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    ["uRes","uZc","uTilt","uZoom","uTime","uDpr","uAlphaMode"].forEach((n) => { PU[n] = gl.getUniformLocation(pprog, n); });
    quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    PN = 150; const d = new Float32Array(PN * 5);
    for (let i = 0; i < PN; i++) { d[i*5] = Math.random(); d[i*5+1] = Math.random(); d[i*5+2] = Math.random(); d[i*5+3] = Math.random(); d[i*5+4] = 0.6 + Math.random() * 0.9; }
    pbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  };
  const upload = (key, unit) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[key]);
    tex[key] = t;
  };

  /* ------------------------------------------------------------ geometry */
  let W = 0, H = 0, dpr = 1, mode = "intro";                       /* mode: intro | home */
  let rect = [0, 0, 1, 1], zc = [0, 0], R = 160, cx = 0, cy = 0;
  let host = null;                                                 /* the hero element once we live there */

  const layout = () => {
    if (mode === "intro") {
      W = innerWidth; H = innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5) * renderScale;
      const target = Math.min(W * 0.8, H * 0.46);
      const S = target / RING_D; R = target / 2;
      cx = W / 2; cy = H * 0.42;
      rect = [cx - IMG_W * S / 2, cy - IMG_H * S / 2, IMG_W * S, IMG_H * S];
      gate.style.setProperty("--tm-r", R.toFixed(1) + "px");
    } else {
      const r = host.getBoundingClientRect();
      W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1 : 1.25) * renderScale;
      const wide = innerWidth > 900;
      const target = clamp(Math.min(H * 0.5, W * (wide ? 0.44 : 0.74)), 200, 560);
      const S = target / RING_D; R = target / 2;
      cx = wide ? W * 0.68 : W * 0.5; cy = wide ? H * 0.5 : H * 0.42;
      rect = [cx - IMG_W * S / 2, cy - IMG_H * S / 2, IMG_W * S, IMG_H * S];
    }
    zc = [cx, cy];
    cv.width = Math.max(2, Math.round(W * dpr)); cv.height = Math.max(2, Math.round(H * dpr));
  };

  /* ---------------------------------------------------------- the torch */
  let pts = [], lastEmit = null, px = -1, py = -1, lastMove = 0, moved = false, ptrInside = false;
  const lights = new Float32Array(64);
  const emit = (x, y, k, rr) => { pts.push({ x, y, t: performance.now(), r: rr * (0.85 + Math.random() * 0.35), k }); if (pts.length > 40) pts.splice(0, pts.length - 40); };
  const move = (x, y, k, rr, step) => {
    if (!lastEmit) { lastEmit = { x, y }; emit(x, y, k, rr); return; }
    const dx = x - lastEmit.x, dy = y - lastEmit.y, d = Math.hypot(dx, dy);
    if (d < step) return;
    const n = Math.max(1, Math.floor(d / step));
    for (let i = 1; i <= n; i++) emit(lastEmit.x + dx * i / n, lastEmit.y + dy * i / n, k, rr);
    lastEmit = { x, y };
  };
  const torchR = () => (mode === "intro" ? clamp(R * 0.98, 90, 280) : clamp(R * 0.78, 110, 260));

  gate.addEventListener("pointermove", (e) => {
    if (entering || mode !== "intro") return;
    px = e.clientX; py = e.clientY; lastMove = performance.now(); moved = true;
    move(px, py, 0.42, torchR(), 34);
  }, { passive: true });
  addEventListener("pointermove", (e) => {
    if (mode !== "home" || !host) return;
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    ptrInside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
    if (!ptrInside) return;
    px = x; py = y; lastMove = performance.now(); moved = true;
    move(x, y, 0.3, torchR(), 46);
  }, { passive: true });

  /* ------------------------------------------------------------ frame loop */
  let ready = false, entering = false, enterT = 0, handT = 0, raf = 0, alive = true, shown = 0, t0 = performance.now();
  let tilt = [0, 0], homeVisible = true, lastNow = 0, slow = 0, fast = 0, renderScale = 1;
  let amb = 0.1, inten = 1, zoomV = 0, opac = 1, alphaMode = 1;
  const ZOOM_MAX = 2.4, PUSH = 1500;

  const fillLights = (now) => {
    lights.fill(0);
    let n = 0;
    const life = mode === "intro" ? 1800 : 1500;
    for (let i = pts.length - 1; i >= 0 && n < 13; i--) {
      const p = pts[i], age = (now - p.t) / life;
      if (age >= 1) continue;
      lights[n * 4] = p.x; lights[n * 4 + 1] = p.y; lights[n * 4 + 2] = p.r * (1 + age * 0.3); lights[n * 4 + 3] = Math.pow(1 - age, 1.45) * p.k;
      n++;
    }
    if (pts.length > 24) pts = pts.filter((p) => now - p.t < life);
    /* slot 13: live pointer light */
    if (moved && px >= 0 && !entering) {
      const f = clamp(1 - (now - lastMove) / 1300, 0, 1);
      lights[52] = px; lights[53] = py; lights[54] = torchR() * 0.8; lights[55] = f * (mode === "intro" ? 0.22 : 0.16);
    }
    /* slot 14: the camera's own light drifting over the relief (always alive, so 3D is visible without a mouse) */
    {
      const t = (now - t0) / 1000;
      const gx = cx + Math.cos(t * 0.55) * R * 0.85 + Math.sin(t * 1.3) * R * 0.18;
      const gy = cy + Math.sin(t * 0.72) * R * 0.62;
      lights[56] = gx; lights[57] = gy; lights[58] = R * (mode === "intro" ? 1.15 : 1.1);
      lights[59] = mode === "intro" ? (moved && now - lastMove < 2400 ? 0.05 : 0.14) : 0.13;
    }
    /* slot 15: ignition when entering */
    if (entering && mode === "intro") {
      const o = easeOut((now - enterT) / 950);
      lights[60] = cx; lights[61] = cy; lights[62] = R * (0.5 + 2.2 * o); lights[63] = 0.5 * o;
    }
  };

  const draw = (now) => {
    const sec = (now - t0) / 1000;
    /* camera tilt: pointer when present, otherwise a slow breathing sway */
    const idle = !moved || now - lastMove > 2600;
    const tx = idle ? Math.sin(sec * 0.45) * 0.55 : clamp((px / W - 0.5) * 2, -1, 1);
    const ty = idle ? Math.cos(sec * 0.37) * 0.35 : clamp((py / H - 0.5) * 2, -1, 1);
    tilt[0] += (tx - tilt[0]) * 0.05; tilt[1] += (ty - tilt[1]) * 0.05;

    fillLights(now);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const loc = gl.getAttribLocation(prog, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(U.uAlb, 0); gl.uniform1i(U.uNor, 1); gl.uniform1i(U.uHei, 2);
    gl.uniform2f(U.uRes, W, H); gl.uniform2f(U.uZc, zc[0], zc[1]); gl.uniform2f(U.uTilt, tilt[0], tilt[1]);
    gl.uniform4f(U.uRect, rect[0], rect[1], rect[2], rect[3]);
    gl.uniform1f(U.uZoom, zoomV); gl.uniform1f(U.uAmb, amb); gl.uniform1f(U.uInt, inten);
    gl.uniform1f(U.uTime, sec); gl.uniform1f(U.uAlphaMode, alphaMode); gl.uniform1f(U.uOpacity, opac);
    gl.uniform4fv(U.uL, lights);
    if (mode === "intro") gl.uniform3f(U.uCol, 0.40, 0.62, 1.0); else gl.uniform3f(U.uCol, 0.58, 0.46, 1.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    /* depth dust */
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(pprog);
    gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
    const a0 = gl.getAttribLocation(pprog, "aP"), a1 = gl.getAttribLocation(pprog, "aS");
    gl.enableVertexAttribArray(a0); gl.vertexAttribPointer(a0, 4, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(a1); gl.vertexAttribPointer(a1, 1, gl.FLOAT, false, 20, 16);
    gl.uniform2f(PU.uRes, W, H); gl.uniform2f(PU.uZc, zc[0], zc[1]); gl.uniform2f(PU.uTilt, tilt[0], tilt[1]);
    gl.uniform1f(PU.uZoom, zoomV); gl.uniform1f(PU.uTime, sec); gl.uniform1f(PU.uDpr, dpr); gl.uniform1f(PU.uAlphaMode, alphaMode);
    gl.drawArrays(gl.POINTS, 0, mode === "home" ? 70 : PN);
  };

  const frame = (now) => {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (document.hidden) { lastNow = 0; return; }
    const dt = lastNow ? Math.min(now - lastNow, 200) : 16.7;
    lastNow = now;
    /* adaptive quality: weak GPUs render fewer pixels instead of stuttering */
    if (gl && prog && !/tmfull/.test(location.search) && (mode === "intro" || homeVisible)) {
      if (dt > 42) { slow++; fast = 0; } else if (dt < 24) { fast++; slow = Math.max(0, slow - 1); }
      if (slow > 14 && renderScale > 0.5) { renderScale = Math.max(0.5, renderScale - 0.15); slow = 0; layout(); }
    }

    /* loading counter (min ~2s so the scene can breathe) */
    if (!ready) {
      const real = (state.alb ? 30 : 0) + (state.nor ? 30 : 0) + (state.hei ? 30 : 0) + (state.font ? 10 : 0);
      const cap = clamp(((now - t0) / 2000) * 100, 0, 100);
      const target = Math.min(real, cap);
      shown += (target - shown) * (1 - Math.exp(-dt / 110));
      if (real >= 100 && cap >= 100 && shown > 99.4) setReady();
      else { numEl.textContent = Math.floor(shown) + "%"; barEl.style.width = shown.toFixed(1) + "%"; }
    }

    /* the camera push */
    if (entering && mode === "intro") {
      const t = (now - enterT) / PUSH;
      zoomV = ZOOM_MAX * easeInOut(t);
      inten = 1 + 0.08 * easeOut((now - enterT) / 900);
      amb = 0.1 + 0.07 * easeOut((now - enterT) / 900);
    }
    /* the settle behind Home */
    if (mode === "home" && handT) {
      const t = now - handT;
      zoomV = ZOOM_MAX * (1 - easeOut5(t / 3800));
      opac = 0.62 * easeOut(t / 1700);
      amb = lerp(0.3, 0.24, easeOut(t / 2600));
      if (t > 4000) handT = 0;
    }
    if (mode === "home" && !homeVisible) return;
    if (!gl || !prog) return;
    draw(now);
  };

  /* ------------------------------------------------------------- loading */
  const setReady = () => {
    ready = true;
    numEl.textContent = "100%"; barEl.style.width = "100%";
    gate.classList.add("is-ready");
    btn.disabled = false;
    try { btn.focus({ preventScroll: true }); } catch (_) {}
  };
  const one = (k) => () => { state[k] = true; };
  imgs.alb.onload = one("alb"); imgs.alb.onerror = one("alb");
  imgs.nor.onload = one("nor"); imgs.nor.onerror = one("nor");
  imgs.hei.onload = one("hei"); imgs.hei.onerror = one("hei");
  imgs.alb.src = SRC.alb; imgs.nor.src = SRC.nor; imgs.hei.src = SRC.hei;
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('30px "Rubik Dirt"', "0123456789%"), new Promise((r) => setTimeout(r, 2500))]).then(() => { state.font = true; }, () => { state.font = true; });
  } else state.font = true;
  const failsafe = setTimeout(() => { state.alb = state.nor = state.hei = state.font = true; }, 10000);

  /* texture upload as soon as every map is in */
  let texDone = false;
  const tryUpload = () => {
    if (texDone || !gl) return;
    if (!(imgs.alb.naturalWidth && imgs.nor.naturalWidth && imgs.hei.naturalWidth)) return;
    try { initGL(); upload("alb", 0); upload("nor", 1); upload("hei", 2); texDone = true; } catch (e) { console.warn("[tm-intro] GL init failed", e); gl = null; fallback(); }
  };
  const upTimer = setInterval(() => { tryUpload(); if (texDone || !alive) clearInterval(upTimer); }, 80);

  /* flat fallback (no WebGL / lost context) */
  let heroBgEl = null;
  function ensureFallbackBg() {
    const hero = document.querySelector(".hero");
    if (!hero) return null;
    let el = hero.querySelector(".hero-logo-bg");
    if (!el) { el = document.createElement("div"); el.className = "hero-logo-bg"; el.setAttribute("aria-hidden", "true"); el.appendChild(document.createElement("i")); hero.insertBefore(el, hero.firstChild); }
    return el;
  }
  function fallback() {
    stage.classList.add("tm-nogl");
    cv.style.display = "none";
    if (!ready) { state.alb = state.nor = state.hei = true; }
  }
  if (!gl) fallback();

  /* ---------------------------------------------------------- resize */
  layout();
  let rsT = 0;
  addEventListener("resize", () => { clearTimeout(rsT); rsT = setTimeout(() => { if (alive && gl && prog) layout(); }, 120); }, { passive: true });
  cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); gl = null; fallback(); });

  raf = requestAnimationFrame(frame);

  /* --------------------------------------------------------------- Enter */
  const heroEl = document.querySelector(".hero");
  const dropPh = () => { const ph = document.querySelector("[data-tm-ph]"); if (ph) ph.remove(); };

  /* the first Home entrance (enhance.js) must wait for the camera push */
  const prevRestagger = window.__restaggerHero;
  window.__restaggerHero = function () {
    const a = arguments, self = this;
    if (!window.__tmGoing) { return typeof prevRestagger === "function" ? prevRestagger.apply(self, a) : undefined; }
    const d = Math.max(0, (window.__tmIntroDelay || 0) - 180);
    setTimeout(() => {
      try { if (typeof prevRestagger === "function") prevRestagger.apply(self, a); } catch (_) {}
      const h1 = document.querySelector(".hero h1"); if (h1) h1.classList.remove("hero-pending");
      setTimeout(dropPh, 60);
    }, d);
  };

  const enter = () => {
    if (entering || !ready) return;
    entering = true; enterT = performance.now();
    window.__tmGoing = true;
    window.__tmIntroDelay = reduce ? 150 : 1150;
    gate.classList.add("tm-go");
    document.body.classList.add("tm-zoom-lock");
    /* hold the title back + keep a gate stand-in (same id, hidden) so enhance.js does not start Home too early;
       getElementById keeps returning the real gate while it exists */
    setTimeout(() => {
      const h1 = document.querySelector(".hero h1"); if (h1) h1.classList.add("hero-pending");
      if (!document.querySelector("[data-tm-ph]")) { const ph = document.createElement("div"); ph.id = "enterGate"; ph.setAttribute("data-tm-ph", "1"); ph.hidden = true; ph.setAttribute("aria-hidden", "true"); document.body.appendChild(ph); }
    }, 190);

    stage.style.transformOrigin = cx + "px " + cy + "px";
    stage.classList.add("tm-flying");
    document.body.appendChild(stage);

    const useGL = !!(gl && prog);
    const fadeDelay = reduce ? 0 : 1100, fadeDur = reduce ? 300 : 750;
    let flat = null;
    if (!useGL && !reduce) flat = stage.animate([{ transform: "scale(1)" }, { transform: "scale(3.4)" }], { duration: PUSH, easing: "cubic-bezier(.6,0,.18,1)", fill: "forwards" });
    const fade = stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeDur, delay: fadeDelay, easing: "ease-in-out", fill: "forwards" });

    if (reduce) { /* no push for reduced motion: skip straight to the settle */ zoomV = ZOOM_MAX; }

    setTimeout(() => {
      /* hand the canvas to Home (it is invisible right now) */
      try { fade.cancel(); } catch (_) {}
      try { if (flat) flat.cancel(); } catch (_) {}
      stage.remove();
      document.body.classList.remove("tm-zoom-lock");
      if (useGL && heroEl) {
        host = heroEl; mode = "home";
        cv.className = "tm-hero-cv"; cv.style.display = "";
        heroEl.insertBefore(cv, heroEl.firstChild);
        alphaMode = 0; opac = 0; zoomV = ZOOM_MAX; inten = 1; amb = 0.3;
        pts = []; lastEmit = null; moved = false; entering = false;
        layout();
        handT = performance.now();
        if ("IntersectionObserver" in window) new IntersectionObserver((es) => { homeVisible = es[0].isIntersecting; }, { threshold: 0 }).observe(heroEl);
        if ("ResizeObserver" in window) { let t = 0; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (mode === "home" && gl && prog) layout(); }, 100); }).observe(heroEl); }
      } else {
        alive = false; cancelAnimationFrame(raf);
        heroBgEl = ensureFallbackBg();
        if (heroBgEl) { heroBgEl.style.opacity = "0"; const a = heroBgEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1800, fill: "forwards" }); a.finished.then(() => { heroBgEl.style.opacity = ""; try { a.cancel(); } catch (_) {} }, () => {}); }
      }
      clearTimeout(failsafe);
    }, fadeDelay + fadeDur + 60);
  };
  btn.addEventListener("click", enter);
  window.__tmIntroState = () => ({ mode, opac, zoomV, amb, homeVisible, W, H, dpr, rect, zc, handT, alphaMode, renderScale, glOK: !!(gl && prog) });

  /* if the gate is removed some other way, clean up */
  const mo = new MutationObserver(() => { if (!gate.isConnected && !window.__tmGoing && !document.getElementById("tmIntroStage")) { alive = false; cancelAnimationFrame(raf); mo.disconnect(); } });
  mo.observe(document.body, { childList: true });
})();


/* ==========================================================================
   UI SOUNDS + SCRATCH/GLITCH TEXT
   - tick-click.wav  : side menu buttons (press)
   - tick-hover.wav  : every button inside "Start a project" (hover; tap on touch)
   - intro: name + Enter button glitch (synthesised scratch sound, no file needed)
   Browsers only allow sound after the first click/tap/key, so hover sounds start then.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__tmUiFx) return;
  window.__tmUiFx = true;

  /* ---------- audio ---------- */
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null;
  const bufs = {};
  const SRC = { click: "audio/tick-click.wav", hover: "audio/tick-hover.wav" };
  const getAC = () => {
    if (!AC) return null;
    if (!ac) { try { ac = new AC(); } catch (_) { return null; } }
    if (ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  };
  const load = (k) => {
    if (bufs[k] || !ac) return;
    bufs[k] = "loading";
    fetch(SRC[k]).then((r) => r.arrayBuffer()).then((ab) => new Promise((res, rej) => ac.decodeAudioData(ab, res, rej)))
      .then((b) => { bufs[k] = b; }).catch(() => { bufs[k] = null; });
  };
  const unlock = () => { if (getAC()) { load("click"); load("hover"); } };
  ["pointerdown", "keydown", "touchstart"].forEach((e) => addEventListener(e, unlock, { once: true, passive: true, capture: true }));
  let lastTick = 0;
  const tick = (k, vol) => {
    const a = getAC(); if (!a || a.state !== "running") return;
    const now = performance.now(); if (now - lastTick < 35) return; lastTick = now;
    const b = bufs[k]; if (!b || b === "loading") { load(k); return; }
    const src = a.createBufferSource(), g = a.createGain();
    src.buffer = b; g.gain.value = vol; src.connect(g); g.connect(a.destination); src.start();
  };

  /* side menu: press */
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".st-rail a")) tick("click", 0.9); }, true);
  /* "Start a project": every button */
  const BRIEF_BTN = "button, .sc-chip, .sc-btn, .sc-skip, a, [role=button], [role=radio], [role=checkbox]";
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    const t = e.target.closest && e.target.closest("#brief"); if (!t) return;
    const b = e.target.closest(BRIEF_BTN); if (!b || !t.contains(b)) return;
    if (e.relatedTarget && b.contains(e.relatedTarget)) return;
    tick("hover", 0.8);
  }, true);
  document.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "touch") return;
    const t = e.target.closest && e.target.closest("#brief"); if (!t) return;
    if (e.target.closest(BRIEF_BTN)) tick("hover", 0.8);
  }, true);

  /* ---------- scratch / glitch text ---------- */
  const gate = document.getElementById("enterGate");
  if (!gate || !gate.classList.contains("tm-intro")) return;
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true"); svg.style.cssText = "position:absolute;width:0;height:0";
  svg.innerHTML = '<filter id="tmGlitchF" x="-8%" y="-20%" width="116%" height="140%" color-interpolation-filters="sRGB"><feTurbulence id="tmGlitchT" type="fractalNoise" baseFrequency="0.012 0.7" numOctaves="1" seed="3" result="n"/><feDisplacementMap id="tmGlitchD" in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.appendChild(svg);
  const turb = svg.querySelector("#tmGlitchT"), disp = svg.querySelector("#tmGlitchD");

  const gls = Array.from(gate.querySelectorAll(".tm-gl"));
  const sync = () => gls.forEach((el) => { el.setAttribute("data-text", el.textContent); });
  sync();
  gls.forEach((el) => new MutationObserver(sync).observe(el, { childList: true, characterData: true, subtree: true }));

  let busy = 0;
  const burst = (el, strength) => {
    if (!el.isConnected || busy > 1) return;
    busy++;
    el.classList.add("tm-burst");
    let n = 0;
    const iv = setInterval(() => {
      n++;
      turb.setAttribute("seed", String((Math.random() * 90) | 0));
      turb.setAttribute("baseFrequency", (0.004 + Math.random() * 0.02).toFixed(3) + " " + (0.35 + Math.random() * 0.6).toFixed(2));
      disp.setAttribute("scale", String(n >= 5 ? 0 : (strength * (0.5 + Math.random())).toFixed(1)));
      if (n >= 5) { clearInterval(iv); el.classList.remove("tm-burst"); busy--; }
    }, 42);
  };
  const loop = (el, min, max, str) => {
    const go = () => { if (!el.isConnected) return; burst(el, str); setTimeout(go, min + Math.random() * (max - min)); };
    setTimeout(go, 900 + Math.random() * 900);
  };
  const nameEl = gate.querySelector(".tm-intro-name"), wordEl = gate.querySelector(".tm-enter-word");
  if (nameEl) loop(nameEl, 2200, 4800, 16);
  if (wordEl) loop(wordEl, 3000, 6000, 9);

  /* synthesised scratch / crackle */
  const scratch = (kind) => {
    const a = getAC(); if (!a) return;
    if (a.state !== "running") { if (kind === "click") a.resume().then(() => { if (a.state === "running") scratch(kind); }).catch(() => {}); return; }
    const dur = kind === "click" ? 0.34 : 0.13, n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    const step = kind === "click" ? 22 : 12; let hv = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n, env = Math.pow(1 - t, kind === "click" ? 1.8 : 2.6);
      if (i % step === 0) hv = Math.random() * 2 - 1;
      const f = kind === "click" ? 150 + t * 520 : 1100 + t * 600;
      const sq = (Math.floor(i / (a.sampleRate / f)) % 2 ? 1 : -1) * 0.45;
      const crackle = Math.random() < 0.015 ? (Math.random() * 2 - 1) * 1.6 : 0;
      d[i] = (hv * 0.6 + sq * 0.35 + crackle) * env;
    }
    const src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = kind === "click" ? 1400 : 2600; bp.Q.value = 0.8;
    g.gain.value = kind === "click" ? 0.34 : 0.16;
    src.connect(bp); bp.connect(g); g.connect(a.destination); src.start();
    if (kind === "click") {              /* low hit under the scratch */
      const o = a.createOscillator(), og = a.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(110, a.currentTime); o.frequency.exponentialRampToValueAtTime(42, a.currentTime + 0.3);
      og.gain.setValueAtTime(0.32, a.currentTime); og.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.32);
      o.connect(og); og.connect(a.destination); o.start(); o.stop(a.currentTime + 0.35);
    }
  };
  const enterBtn = document.getElementById("enterGateBtn");
  if (enterBtn) {
    enterBtn.addEventListener("pointerenter", () => { if (wordEl) burst(wordEl, 18); scratch("hover"); });
    enterBtn.addEventListener("focus", () => { if (wordEl) burst(wordEl, 18); });
    enterBtn.addEventListener("click", () => { if (wordEl) burst(wordEl, 26); if (nameEl) burst(nameEl, 22); }, true);   /* no sound on press */
  }
})();
