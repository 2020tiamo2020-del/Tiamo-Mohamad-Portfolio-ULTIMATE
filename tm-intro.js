/* ==========================================================================
   TM INTRO v5 — carved-stone relief, lit by drifting blue mist (TM + the three thin rings are now hollow too)
   The artwork is never repainted: it is the albedo of a real-time relief (normal + height maps derived from it).
   Loading -> Enter with sound -> the camera pushes into the medallion -> the same 3D relief settles, transparent and
   still reactive, behind Home only.

   THE LIGHT (not a torch):
     A low-resolution "mist field" remembers where light has been. The pointer (and two slow wanderers) pour light
     into it; every frame it  fades slowly (the trail lingers)  and  diffuses along the stone: it flows easily along a
     groove or a ledge at the same height and is held back by steps, so the glow creeps round the rings between the
     rocks. The shader turns the field into ragged, cloudy blue light that pools in the grooves, clings to the cobbles
     and outlines the ridges. On top of it:  cold ambient · drifting fog lit from below · rim light ·
     small coloured point lights (turquoise / green / pink / amber / violet) that flash when the mist reaches them.

   ORDER AFTER "ENTER" (all times come from window.__tmTL in index.html <head>)
     0 ms sound + push -> logo settles -> header -> music orb -> title + copy -> role words -> toast (+sound) -> side rail

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
  window.__tmDirected = true;      /* script.js / story.js: "the intro director owns the timing now" */

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeOut5 = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 5);
  const easeOutBack = (t) => { t = clamp(t, 0, 1); const c = 1.25; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const easeInOut = (t) => { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAr = () => document.documentElement.lang === "ar";

  /* artwork geometry: 1600x900 source; the medallion's outer ring is 469 px wide and centred at (802,446) */
  const IMG_W = 1600, IMG_H = 900, RING_D = 469, EMB_X = 802, EMB_Y = 446;
  const SRC = { alb: "images/intro-albedo.jpg?v=6", nor: "images/intro-normal.jpg?v=4", hei: "images/intro-height.jpg?v=6", cls: "images/intro-cavity.png?v=6", lz: "images/intro-laser.png?v=7" };
  const NMK = 10;
  const GW = 192, GH = 108;                      /* mist-field resolution */

  gate.classList.add("tm-js");
  const numEl = document.getElementById("tmLoadNum"), barEl = document.getElementById("tmLoadBar"), msgEl = document.getElementById("tmLoadMsg");
  btn.disabled = true;

  /* ------------------------------------------------------------------ GL */
  const VS = "attribute vec2 aPos;varying vec2 vP;void main(){vP=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}";
  const FS = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH", "precision highp float;", "#else", "precision mediump float;", "#endif",
    "varying vec2 vP;",
    "uniform sampler2D uAlb,uNor,uHei,uFld,uSp,uCls,uLz;",
    "uniform vec4 uLzR;",
    "uniform vec2 uRes,uZc,uTilt,uEmb;",
    "uniform vec4 uRect;",
    "uniform float uZoom,uAmb,uInt,uTime,uAlphaMode,uOpacity,uRing,uMk,uGlow,uFlood,uPop,uBeat,uLit;",
    "uniform vec4 uM[" + NMK + "];",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);",
    " return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}",
    "float fbm(vec2 p){float a=0.5,s=0.0;for(int i=0;i<3;i++){s+=a*noise(p);p*=2.03;a*=0.5;}return s;}",
    /* marker palette: turquoise / green / soft pink / amber / violet */
    "vec3 mkCol(float i){float k=mod(i,5.0);",
    " if(k<0.5)return vec3(0.08,0.95,0.86); if(k<1.5)return vec3(0.38,1.0,0.48); if(k<2.5)return vec3(1.0,0.46,0.78);",
    " if(k<3.5)return vec3(1.0,0.62,0.22); return vec3(0.62,0.45,1.0);}",
    "void shade(vec2 p,out vec3 col,out float lum){",
    /* pass 1: height at uniform zoom, so nearer (taller) stone magnifies more = real dolly parallax */
    " vec2 q=uZc+(p-uZc)/(1.0+uZoom);",                       /* the camera push is a pure, even zoom: the relief never swims or stretches */
    " float h0=texture2D(uHei,(q-uRect.xy)/uRect.zw).r;",
    " q-=uTilt*(h0-0.32)*uRect.z*0.0085;",                    /* tiny side-to-side parallax, the shape is untouched */
    " vec2 uv=(q-uRect.xy)/uRect.zw;",
    " col=vec3(0.0);lum=0.0;",
    " if(uv.x>0.0&&uv.x<1.0&&uv.y>0.0&&uv.y<1.0){",
    "  float t=uTime;",
    "  float h=texture2D(uHei,uv).r;",
    "  vec3 alb=texture2D(uAlb,uv).rgb;",
    "  vec3 n=normalize(texture2D(uNor,uv).rgb*2.0-1.0);",
    "  vec3 ac=pow(alb,vec3(1.35));",
    "  float lumA=dot(alb,vec3(0.299,0.587,0.114));",
    "  float rr=length(q-uEmb)/uRing;",
    /* fog */
    "  float f1=fbm(q*0.0042+vec2(t*0.030,-t*0.018));",
    "  float f2=fbm(q*0.0095+vec2(-t*0.022,t*0.012)+7.3);",
    "  float fog=smoothstep(0.30,0.86,f1*0.62+f2*0.38);",
    "  float low=smoothstep(0.10,0.95,uv.y);",
    /* the mist field: ragged, cloudy edges (the noise only bites where there is light) */
    "  float nz=fbm(q*0.0065+vec2(t*0.035,-t*0.020));",
    "  float nz2=noise(q*0.021+vec2(-t*0.05,t*0.03));",
    "  vec2 wv=(vec2(nz,nz2)-0.5)*0.022;",
    "  float fr=texture2D(uFld,uv+wv).r;",
    "  float m=smoothstep(0.07,0.55,fr+(nz-0.5)*0.46*smoothstep(0.0,0.35,fr));",
    "  m=max(m,uFlood*smoothstep(0.22,0.80,nz+0.20*(1.0-clamp(rr*0.25,0.0,1.0))));",
    "  float halo=smoothstep(0.0,0.45,fr);",
    "  vec3 mc=mix(vec3(0.015,0.05,0.20),vec3(0.17,0.34,0.62),pow(m,0.85));",
    "  float cav=pow(1.0-smoothstep(0.14,0.50,h),1.2);",
    "  float edge=smoothstep(0.14,0.62,length(n.xy));",
    /* cold ambient: the relief is always faintly there */
    "  col=ac*vec3(0.20,0.42,0.74)*uAmb;",
    /* mist light between the rocks: pools in the grooves, clings to the cobbles */
    "  float stone=0.55+0.9*lumA;",
    "  col+=mc*m*cav*stone*uGlow*1.5;",
    /* fog lit from below */
    "  vec2 gq=(q-uEmb-vec2(0.0,uRing*0.9))/vec2(uRing*2.7,uRing*1.4);",
    "  float under=exp(-dot(gq,gq)*1.4);",
    "  vec3 fogC=vec3(0.012,0.045,0.095)+vec3(0.02,0.10,0.22)*under*uGlow*(0.35+0.6*m);",
    "  float fk=clamp(fog*(0.26+0.55*low),0.0,1.0)*0.80;",
    "  col=col*(1.0-fk*0.55)+fogC*fk;",
    /* coloured point lights: they wake up when the mist reaches them */
    "  for(int i=0;i<" + NMK + ";i++){",
    "   vec4 mk=uM[i];",
    "   if(mk.z>0.0&&uMk>0.001){",
    "    vec2 mp=uRect.xy+mk.xy*uRect.zw;",
    "    float r=mk.z*uRing;",
    "    vec2 dv=mp-q;float d=length(dv);",
    "    float fl=pow(max(0.0,sin(t*(0.55+0.5*fract(mk.w*3.7))+mk.w*40.0)),6.0);",
    "    float near=texture2D(uFld,mk.xy).r;",
    "    float k=(0.14+0.55*fl+1.1*smoothstep(0.05,0.5,near))*uMk;",
    "    vec3 c=mkCol(float(i));",
    "    float a=1.0-clamp(d/(r*3.4),0.0,1.0);a*=a;",
    "    vec3 ld=normalize(vec3(dv/(r*2.2),0.7));",
    "    float dif=max(dot(n,ld),0.0);",
    "    col+=c*ac*(0.9+2.6*dif)*a*k*1.9;",
    "    col+=c*exp(-d*d/(r*r*0.05))*k*1.5;",
    "    col+=c*exp(-d/(r*1.5))*0.20*k*(0.5+fog);",
    "   }",
    "  }",
    /* music: EVERY carved hollow glows with the spectrum band that matches its size.
       uCls (pre-computed from the height map): R = size class (0 = wide valley ... 1 = hair-thin groove), G = a random phase per hollow.
       wide hollows follow the bass, mid-size grooves the mids, the TM strokes and the three thin rings the highs;
       the light is cloudy (same mist noise as the intro) and flows along the groove instead of flashing flat. */
    "  if(uLit>0.003){",
    "   vec3 cl=texture2D(uCls,uv).rgb;",
    "   float b=clamp(cl.r+(cl.g-0.5)*0.10,0.0,1.0);",
    "   float lv=texture2D(uSp,vec2(0.012+0.40*pow(b,1.15),0.5)).r;",
    "   lv=clamp(lv*(0.85+1.9*b),0.0,1.4);",
    "   float bass=texture2D(uSp,vec2(0.02,0.5)).r;",
    "   float thin=smoothstep(0.42,0.55,b);",
    "   float flow=mix(0.60+0.40*sin(t*(1.1+2.2*b)+cl.g*25.0+nz*7.0),0.88+0.12*sin(t*1.7+cl.g*20.0),thin);",
    "   float cm=pow(1.0-smoothstep(0.14,0.46,h),1.25);",
    "   cm=mix(cm,1.0-smoothstep(0.06,0.27,h),thin);",
    "   float zone=1.0-smoothstep(1.6,3.3,rr);",
    "   float zin=mix(1.0,0.62,smoothstep(1.1,1.9,rr));",
    "   vec2 lzp=(uv-uLzR.xy)/uLzR.zw; vec3 lz=texture2D(uLz,lzp).rgb;",
    "   cm*=1.0-lz.b;",
    "   float cloud=mix(0.70+0.60*nz,0.86+0.28*nz,thin);",
    "   float lt=uLit*cm*zone*zin*cloud*(0.05+0.72*lv*flow+0.22*uBeat*(1.0-0.7*b)+0.10*bass*(1.0-b));",
    "   vec3 cc=mix(vec3(0.10,0.26,0.62),vec3(0.30,0.52,0.92),smoothstep(0.0,0.6,b));",
    "   cc=mix(cc,vec3(0.60,0.80,1.0),thin);",
    "   float st2=stone;",
    "   col+=cc*lt*st2*1.0+vec3(0.35,0.58,1.0)*lt*lt*0.16;",
    "   float lsx=texture2D(uSp,vec2(0.04+0.26*clamp(lzp.x,0.0,1.0),0.5)).r;",
    "   float lI=uLit*(0.55+0.95*clamp(lsx*1.5,0.0,1.0)+0.45*uBeat)*(0.82+0.18*sin(t*2.1+lzp.x*9.0-lzp.y*5.0));",
    "   col+=vec3(0.42,0.74,1.0)*lz.r*lI*1.7+vec3(0.08,0.30,0.95)*lz.g*lI*0.95;",
    "  }",
    /* contrast: vignette, filmic curve, crushed blacks */
    "  float vk=mix(1.72,1.80,uAlphaMode);",
    "  float v=smoothstep(1.0,0.22,length((uv-0.5)*vec2(1.0,1.12)*vk));",
    "  v*=smoothstep(0.0,0.14,uv.x)*smoothstep(0.0,0.14,1.0-uv.x)*smoothstep(0.0,0.16,uv.y)*smoothstep(0.0,0.16,1.0-uv.y);",
    "  col*=v*uInt;",
    "  col=1.0-exp(-col*1.15);",
    "  col=max(col-0.006,0.0);",
    "  col=pow(col,vec3(1.34));",
    "  lum=dot(col,vec3(0.299,0.587,0.114));",
    " }",
    "}",
    "void main(){",
    " vec2 p=vec2(vP.x,1.0-vP.y)*uRes;",
    /* the medallion is the player: it rises out of its socket (lifted face, side wall, cast shadow, empty socket) */
    " float s=1.0+uPop*0.04;",
    " vec2 c1=uEmb+vec2(uTilt.x*uRing*0.012,-uRing*0.05)*uPop;",
    " float rf=length(p-c1)/(uRing*s);",
    " bool face=uPop>0.002&&rf<1.0;",
    " vec2 ps=face?uEmb+(p-c1)/s:p;",
    " vec3 col;float lum;",
    " shade(ps,col,lum);",
    " if(uPop>0.002){",
    "  if(face){",
    "   float rim=smoothstep(0.93,1.0,rf);",
    "   float top=0.5+0.5*dot(normalize(p-c1+vec2(0.001)),vec2(-0.5,-0.85));",
    "   col*=1.0+uPop*0.16;",
    "   col+=vec3(0.30,0.52,0.92)*rim*top*uPop*0.32;lum+=rim*top*uPop*0.32;",
    "  }else{",
    "   float r0=length(p-uEmb)/uRing;",
    "   vec2 sdv=(p-c1-vec2(uRing*0.03,uRing*0.16*uPop))/(uRing*s);",
    "   float shd=(1.0-smoothstep(0.95,1.55,length(sdv)))*uPop*0.7;",
    "   col*=1.0-shd;lum*=1.0-shd;",
    "   float hole=(1.0-smoothstep(0.985,1.0,r0))*uPop;",
    "   col*=1.0-hole*0.9;lum*=1.0-hole*0.9;",
    "   for(int i=0;i<8;i++){",
    "    float k=float(i)/7.0;",
    "    vec2 ci=mix(uEmb,c1,k);float ri=uRing*mix(1.0,s,k);",
    "    float mi=1.0-smoothstep(ri-1.2,ri,length(p-ci));",
    "    float lit=0.5+0.5*dot(normalize(p-ci+vec2(0.001)),vec2(-0.55,-0.83));",
    "    vec3 wc=vec3(0.10,0.20,0.38)*(0.40+0.9*k)*(0.45+1.1*lit);",
    "    col=mix(col,wc,mi);lum=mix(lum,dot(wc,vec3(0.299,0.587,0.114))*3.2,mi);",
    "   }",
    "  }",
    " }",
    " vec2 bp=(p/uRes-vec2(0.5,0.44))*vec2(1.0,1.25);",
    " vec3 bg=mix(vec3(0.026,0.050,0.108),vec3(0.010,0.014,0.036),smoothstep(0.0,1.0,length(bp)*1.25));",
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
    const opt = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "default" };
    gl = cv.getContext("webgl", opt) || cv.getContext("experimental-webgl", opt);
  } catch (_) { gl = null; }

  let prog = null, pprog = null, U = {}, PU = {}, quad = null, pbuf = null, PN = 0;
  let hintGo = false, spTex = null, popV = 0, popVel = 0, beatV = 0, litV = 0, hintAt = 0, hintDone = false; const spBytes = new Uint8Array(64), spv = new Float32Array(64);   /* medallion-as-player state */
  const tex = {};
  const imgs = {};
  const state = { alb: 0, nor: 0, hei: 0, cls: 0, lz: 0 };       /* 0 = pending, 1 = loaded, -1 = gave up */
  const markers = new Float32Array(NMK * 4);

  /* shaders compile in the background when the browser supports KHR_parallel_shader_compile, so the counter keeps moving */
  let pse = null;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const link = (vs, fs) => {
    const a = compile(gl.VERTEX_SHADER, vs), b = compile(gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
    gl.attachShader(p, a); gl.attachShader(p, b); gl.linkProgram(p);
    p.__sh = [a, b];
    return p;
  };
  const done = (p) => !pse || gl.getProgramParameter(p, pse.COMPLETION_STATUS_KHR);
  const verify = (p) => {
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const info = (p.__sh || []).map((x) => gl.getShaderInfoLog(x)).join(" ") + " " + gl.getProgramInfoLog(p);
      throw new Error(info);
    }
  };
  const startGL = () => {
    pse = gl.getExtension("KHR_parallel_shader_compile");
    prog = link(VS, FS); pprog = link(PVS, PFS);
  };
  const initGL = () => {
    verify(prog); verify(pprog);
    ["uAlb","uNor","uHei","uFld","uRes","uZc","uTilt","uEmb","uRect","uZoom","uAmb","uInt","uTime","uAlphaMode","uOpacity","uRing","uMk","uGlow","uFlood","uM","uSp","uCls","uLz","uLzR","uPop","uBeat","uLit"].forEach((n) => { U[n] = gl.getUniformLocation(prog, n); });
    ["uRes","uZc","uTilt","uZoom","uTime","uDpr","uAlphaMode"].forEach((n) => { PU[n] = gl.getUniformLocation(pprog, n); });
    quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    PN = 150; const d = new Float32Array(PN * 5);
    for (let i = 0; i < PN; i++) { d[i*5] = Math.random(); d[i*5+1] = Math.random(); d[i*5+2] = Math.random(); d[i*5+3] = Math.random(); d[i*5+4] = 0.6 + Math.random() * 0.9; }
    pbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pbuf); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW);
    spTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, spTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 64, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, spBytes);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
  };
  const setTexParams = () => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  const upload = (key, unit) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    setTexParams();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[key]);
    tex[key] = t;
  };

  /* ------------------------------------------------------------ the mist field
     fld   : how much light each cell holds (0..1.4)
     condH / condV : how easily light flows between two neighbouring cells = exp(-|height step|):
                     flat ground and grooves conduct, rock steps resist -> the glow follows the stone */
  const fld = new Float32Array(GW * GH), fu8 = new Uint8Array(GW * GH);
  const condH = new Float32Array((GW - 1) * GH), condV = new Float32Array(GW * (GH - 1));
  let fldTex = null, fldBoot = false;
  const buildField = () => {
    let hl = null;
    try {
      const c = document.createElement("canvas"); c.width = GW; c.height = GH;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(imgs.hei, 0, 0, GW, GH);
      const d = x.getImageData(0, 0, GW, GH).data;
      hl = new Float32Array(GW * GH);
      for (let i = 0; i < GW * GH; i++) hl[i] = d[i * 4] / 255;
    } catch (_) { hl = null; }
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW - 1; x++) condH[y * (GW - 1) + x] = hl ? Math.exp(-Math.abs(hl[y * GW + x] - hl[y * GW + x + 1]) * 7) : 0.8;
    for (let y = 0; y < GH - 1; y++) for (let x = 0; x < GW; x++) condV[y * GW + x] = hl ? Math.exp(-Math.abs(hl[y * GW + x] - hl[(y + 1) * GW + x]) * 7) : 0.8;
    gl.activeTexture(gl.TEXTURE3);
    fldTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, fldTex); setTexParams();
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GW, GH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, fu8);
    fldBoot = true;
  };
  const dep = (u, v, amt, rad) => {                         /* pour light at image position (u,v), radius in cells */
    const cxc = u * GW, cyc = v * GH, r2 = rad * 2.2;
    const x0 = Math.max(0, Math.floor(cxc - r2)), x1 = Math.min(GW - 1, Math.ceil(cxc + r2));
    const y0 = Math.max(0, Math.floor(cyc - r2)), y1 = Math.min(GH - 1, Math.ceil(cyc + r2));
    const k = 1 / (2 * rad * rad * 0.3);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cxc, dy = y + 0.5 - cyc, w = Math.exp(-(dx * dx + dy * dy) * k);
      const i = y * GW + x; const nv = fld[i] + amt * w; fld[i] = nv > 1.4 ? 1.4 : nv;
    }
  };
  const stepField = (dt) => {
    const decay = Math.exp(-dt / (mode === "intro" ? 3200 : 2400));
    for (let i = 0; i < fld.length; i++) fld[i] *= decay;
    const subs = dt > 28 ? 4 : 2, K = 0.21;
    for (let s = 0; s < subs; s++) {
      for (let y = 0; y < GH; y++) {
        const row = y * GW, crow = y * (GW - 1);
        for (let x = 0; x < GW - 1; x++) { const f = (fld[row + x] - fld[row + x + 1]) * condH[crow + x] * K; fld[row + x] -= f; fld[row + x + 1] += f; }
      }
      for (let y = 0; y < GH - 1; y++) {
        const row = y * GW;
        for (let x = 0; x < GW; x++) { const f = (fld[row + x] - fld[row + GW + x]) * condV[row + x] * K; fld[row + x] -= f; fld[row + GW + x] += f; }
      }
    }
    for (let i = 0; i < fld.length; i++) { const v = fld[i] * 255; fu8[i] = v > 255 ? 255 : v; }
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, fldTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.LUMINANCE, gl.UNSIGNED_BYTE, fu8);
  };

  /* ------------------------------------------------------------ markers
     Small coloured point lights sit on the raised stone around the medallion (picked from the height map). */
  const pickMarkers = () => {
    let rnd = 20261026;
    const rand = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 4294967296; };
    let hd = null, hw = 160, hh = 90;
    try {
      const c = document.createElement("canvas"); c.width = hw; c.height = hh;
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(imgs.hei, 0, 0, hw, hh);
      hd = x.getImageData(0, 0, hw, hh).data;
    } catch (_) { hd = null; }
    const R0 = RING_D / 2, list = [];
    for (let tries = 0; tries < 900 && list.length < NMK; tries++) {
      const ang = rand() * Math.PI * 2, rho = 1.25 + Math.pow(rand(), 0.8) * 1.5;
      const px = EMB_X + Math.cos(ang) * rho * R0 * 1.15, py = EMB_Y + Math.sin(ang) * rho * R0 * 0.82;
      if (px < IMG_W * 0.08 || px > IMG_W * 0.92 || py < IMG_H * 0.08 || py > IMG_H * 0.92) continue;
      const hv = hd ? hd[((Math.floor(py / IMG_H * hh)) * hw + Math.floor(px / IMG_W * hw)) * 4] / 255 : 0.5;
      if (hv < 0.42) continue;
      if (list.some((m) => Math.hypot(m.x - px, m.y - py) < R0 * 0.55)) continue;
      list.push({ x: px, y: py });
    }
    for (let i = 0; i < NMK; i++) {
      const m = list[i];
      markers[i*4] = m ? m.x / IMG_W : 0.5; markers[i*4+1] = m ? m.y / IMG_H : 0.5;
      markers[i*4+2] = m ? 0.040 + rand() * 0.050 : 0;      /* radius in ring units (0 = off) */
      markers[i*4+3] = rand();                              /* flash phase */
    }
  };

  /* ------------------------------------------------------------ geometry */
  let W = 0, H = 0, dpr = 1, mode = "intro";                       /* mode: intro | home */
  let rect = [0, 0, 1, 1], zc = [0, 0], R = 160, cx = 0, cy = 0;
  let host = null;                                                 /* the hero element once we live there */

  /* ---- Home background: the new carved-stone picture takes the old logo's place (same centre + size as the old medallion) ---- */
  const BG = { w: 1672, h: 941, ex: 838, ey: 466, d: 490 };       /* picture size, medallion centre, medallion ring diameter (px) */
  /* the three grooves of the medallion (picture px): the TM disc | ring C | ring B | fixed frame */
  const G = [{ x: 836.45, y: 457.8, r: 153.3 }, { x: 836.45, y: 457.8, r: 173.45 }, { x: 836.45, y: 457.8, r: 190.76 }];       /* rebuilt rings: perfectly concentric, uniform width */
  const RING_REF = 196;                                         /* half-size (picture px) of the ring images */
  let homeImg = null, pl = null, plS = 1;
  const placeHomeImg = () => {
    if (!homeImg) return;
    const S = (R * 2) / BG.d; plS = S;
    homeImg.style.width = (BG.w * S).toFixed(1) + "px"; homeImg.style.height = (BG.h * S).toFixed(1) + "px";
    homeImg.style.left = (cx - BG.ex * S).toFixed(1) + "px"; homeImg.style.top = (cy - BG.ey * S).toFixed(1) + "px";
    homeImg.style.setProperty("--mx", (BG.ex * S).toFixed(1) + "px"); homeImg.style.setProperty("--my", (BG.ey * S).toFixed(1) + "px");
    homeImg.style.setProperty("--rx", (R * 3.1).toFixed(1) + "px"); homeImg.style.setProperty("--ry", (R * 1.9).toFixed(1) + "px");
    homeImg.style.transformOrigin = (BG.ex * S).toFixed(1) + "px " + (BG.ey * S).toFixed(1) + "px";
    /* the hero's own edges, in picture coordinates: the picture melts away before it can be cut */
    const L = cx - BG.ex * S, T = cy - BG.ey * S;
    homeImg.style.setProperty("--hx0", (-L).toFixed(1) + "px"); homeImg.style.setProperty("--hx1", (W - L).toFixed(1) + "px");
    homeImg.style.setProperty("--hy0", (-T).toFixed(1) + "px"); homeImg.style.setProperty("--hy1", (H - T).toFixed(1) + "px");
    placePlayer(S);
  };

  /* ---------------------------------------------------------------- the player: a mechanical lock built from the picture itself
     the picture is cut into layers (same image, circular masks): the TM disc, ring C, ring B.
     play  -> ring C and ring B turn against each other in clicking steps (tilted in 3D) -> the TM disc is pushed up out of its socket, in 3 clicks
     pause -> the TM disc sinks back, then the rings turn back and lock. T and M are one piece (they live on the same disc). */
  const buildPlayer = () => {
    const mk = (cls, par) => { const d = document.createElement("div"); d.className = cls; par.appendChild(d); return d; };
    const root = mk("tm-pl", homeImg);
    pl = { root, track: mk("tmx-track", root) };
    pl.wB = mk("tmx-ring tmx-ring-b", root); pl.ringB = mk("tmx-ring-img", pl.wB); pl.litB = mk("tmx-ring-lit", pl.wB);
    pl.wC = mk("tmx-ring tmx-ring-c", root); pl.ringC = mk("tmx-ring-img", pl.wC); pl.litC = mk("tmx-ring-lit", pl.wC);
    pl.hole = mk("tm-hole", root); pl.g = mk("tm-core-g", root);
    pl.sh = mk("tm-core-sh", pl.g); pl.core = mk("tm-pl-l", pl.g); pl.rim = mk("tm-core-rim", pl.g);
  };
  const placePlayer = (S) => {
    if (!pl) return;
    const bgSize = (BG.w * S).toFixed(1) + "px " + (BG.h * S).toFixed(1) + "px";
    const box = (el, c, r) => {                                  /* a square box around a groove, picture shown through it at the right offset */
      const rr = r * S + 3, l = c.x * S - rr, t = c.y * S - rr;
      el.style.left = l.toFixed(1) + "px"; el.style.top = t.toFixed(1) + "px"; el.style.width = el.style.height = (rr * 2).toFixed(1) + "px";
      el.style.backgroundSize = bgSize; el.style.backgroundPosition = (-l).toFixed(1) + "px " + (-t).toFixed(1) + "px";
      return rr;
    };
    const disc = (c, r, rr) => "radial-gradient(circle at " + rr.toFixed(1) + "px " + rr.toFixed(1) + "px, #000 " + (r * S - 0.7).toFixed(1) + "px, transparent " + (r * S + 0.7).toFixed(1) + "px)";
    const rbox = (w) => { const half = RING_REF * S; w.style.left = (G[0].x * S - half).toFixed(1) + "px"; w.style.top = (G[0].y * S - half).toFixed(1) + "px"; w.style.width = w.style.height = (half * 2).toFixed(1) + "px"; };
    rbox(pl.wB); rbox(pl.wC); rbox(pl.track);
    pl.track.style.background = "radial-gradient(circle closest-side, transparent " + ((G[0].r - 1.6) * S).toFixed(1) + "px, #04060d " + ((G[0].r - 0.8) * S).toFixed(1) + "px, #04060d " + ((G[2].r + 0.8) * S).toFixed(1) + "px, transparent " + ((G[2].r + 1.8) * S).toFixed(1) + "px)";
    const rc = box(pl.core, G[0], G[0].r); pl.core.style.webkitMaskImage = pl.core.style.maskImage = disc(G[0], G[0].r, rc);
    /* the group that lifts: shadow + disc + rim, one transform */
    const gl_ = G[0].x * S - rc, gt_ = G[0].y * S - rc;
    pl.g.style.left = pl.g.style.top = "0px"; pl.g.style.width = homeImg.style.width; pl.g.style.height = homeImg.style.height;
    pl.g.style.transformOrigin = (G[0].x * S).toFixed(1) + "px " + (G[0].y * S).toFixed(1) + "px";
    const hr = G[0].r * S + 2;
    for (const el of [pl.hole, pl.sh, pl.rim]) { el.style.left = (G[0].x * S - hr).toFixed(1) + "px"; el.style.top = (G[0].y * S - hr).toFixed(1) + "px"; el.style.width = el.style.height = (hr * 2).toFixed(1) + "px"; }
    pl.rim.style.width = pl.rim.style.height = (G[0].r * S * 2).toFixed(1) + "px"; pl.rim.style.left = (G[0].x * S - G[0].r * S).toFixed(1) + "px"; pl.rim.style.top = (G[0].y * S - G[0].r * S).toFixed(1) + "px";
    pl.root.style.perspective = (R * 5.2).toFixed(0) + "px"; pl.root.style.perspectiveOrigin = (G[0].x * S).toFixed(1) + "px " + (G[0].y * S).toFixed(1) + "px";
    pl.root.style.transformOrigin = (G[0].x * S).toFixed(1) + "px " + (G[0].y * S).toFixed(1) + "px";
  };
  let plTeaserDone = false, plTeaserUntil = 0, plP = 0, plHov = 0, plHovT = 0, plBass = 0, plNx = 0, plNy = 0, plTx = 0, plTy = 0;
  /* a clicking step: quick snap with a little overshoot, then a pause -- the "tk" of a mechanism */
  const tk = (x, n) => { x = clamp(x, 0, 1); const v = x * n, i = Math.floor(v), f = v - i, e = f < 0.42 ? easeOutBack(f / 0.42) : 1; return Math.min(1.04, (i + e) / n); };
  const stepPlayer = (now, dt) => {
    if (!pl) return;
    const M = window.__tmMusic || {};
    /* one-time teaser: when the entrance is over, the lock opens and closes once by itself, so a visitor sees that the medallion is a player */
    if (hintGo && !plTeaserDone && !reduce) { plTeaserDone = true; plTeaserUntil = now + 4600; }
    const target = (M.playing || now < plTeaserUntil) ? 1 : 0;
    if (reduce) plP = target; else { const sp = dt / (target ? 3300 : 2700); plP = target > plP ? Math.min(1, plP + sp) : Math.max(0, plP - sp); }
    plHov += (plHovT - plHov) * (1 - Math.exp(-dt / 160)); plNx += (plTx - plNx) * (1 - Math.exp(-dt / 180)); plNy += (plTy - plNy) * (1 - Math.exp(-dt / 180));
    const d = M.data; let b = 0; if (M.playing && d && d.length > 2) b = Math.min(1, (d[0] + d[1] + d[2]) / (3 * 200)); plBass += (b - plBass) * (1 - Math.exp(-dt / 90));
    const rp = clamp(plP / 0.55, 0, 1), cp = clamp((plP - 0.45) / 0.55, 0, 1);       /* rings first, then the disc (and back in the opposite order) */
    const aC = tk(rp, 8) * 240, aB = -tk(rp, 10) * 300;                               /* counter-rotation, different click counts */
    /* no tilt: the rings only turn flat on their own axis */
    pl.ringC.style.transform = "rotateZ(" + aC.toFixed(2) + "deg)";
    pl.ringB.style.transform = "rotateZ(" + aB.toFixed(2) + "deg)";
    const lift = tk(cp, 3), L = Math.min(1, lift);
    const sc = 1 + 0.038 * lift + 0.02 * plHov + 0.01 * plBass * L;       /* the disc rises (shadow + parallax), it does not swallow the rings that are its key */
    pl.g.style.transform = "translate3d(0," + (-R * 0.05 * lift).toFixed(2) + "px," + (R * 0.06 * lift).toFixed(1) + "px) scale(" + sc.toFixed(4) + ")";
    pl.core.style.filter = L > 0.01 ? "brightness(" + (1 + 0.16 * L + 0.1 * plBass).toFixed(3) + ") contrast(" + (1 + 0.06 * L).toFixed(3) + ")" : "none";
    pl.hole.style.opacity = L > 0.004 ? "1" : "0";
    pl.sh.style.opacity = (0.95 * L).toFixed(3); pl.sh.style.transform = "translate(" + (R * 0.055 * lift).toFixed(1) + "px," + (R * 0.085 * lift).toFixed(1) + "px) scale(" + (1.05 + 0.06 * lift).toFixed(3) + ")";
    pl.rim.style.opacity = (L * (0.45 + 0.55 * plBass + 0.1 * Math.sin(now / 420))).toFixed(3);
    pl.root.style.transform = "scale(" + (1 + 0.012 * plHov).toFixed(4) + ")";
  };

  const layout = () => {
    if (mode === "intro") {
      W = innerWidth; H = innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5) * renderScale;
      const portrait = W < H * 0.9;
      let S = Math.min(W * 0.8, H * 0.46) / RING_D * (portrait ? 1 : 1.12);
      if (!portrait) S = Math.max(S, W / IMG_W * 1.02, H / IMG_H * 1.02);     /* wide screens: the relief covers the whole viewport */
      R = RING_D / 2 * S;
      cx = W / 2; cy = H * (portrait ? 0.36 : 0.385);
      rect = [cx - EMB_X * S, cy - EMB_Y * S, IMG_W * S, IMG_H * S];
      gate.style.setProperty("--tm-r", R.toFixed(1) + "px");
      gate.style.setProperty("--tm-ty", Math.round(cy + R * 0.98 + 14) + "px");
    } else {
      const r = host.getBoundingClientRect();
      W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1 : 1.25) * renderScale;
      const wide = innerWidth > 900;
      const target = clamp(Math.min(H * 0.62, W * (wide ? 0.50 : 0.80)), 220, 640);
      const S = target / RING_D; R = target / 2;
      const rtl = document.documentElement.dir === "rtl" || isAr();      /* Arabic: text on the right, the medallion on the left */
      cx = wide ? W * (rtl ? 0.32 : 0.68) : W * 0.5; cy = wide ? H * 0.5 : H * 0.42;
      rect = [cx - EMB_X * S, cy - EMB_Y * S, IMG_W * S, IMG_H * S];
    }
    zc = [cx, cy];
    if (mode === "home") placeHomeImg();
    if (mode === "home" && !homeImg) { cv.style.setProperty("--tm-cx", cx.toFixed(1) + "px"); cv.style.setProperty("--tm-cy", cy.toFixed(1) + "px"); cv.style.setProperty("--tm-r", R.toFixed(1) + "px"); if (stoneEl) placeHint(); }
    cv.width = Math.max(2, Math.round(W * dpr)); cv.height = Math.max(2, Math.round(H * dpr));
  };

  /* ---------------------------------------------------- the pointer pours light */
  let px = -1, py = -1, lpx = -1, lpy = -1, lastMove = 0, moved = false;
  const toUV = (x, y) => [(x - rect[0]) / rect[2], (y - rect[1]) / rect[3]];
  gate.addEventListener("pointermove", (e) => {
    if (entering || mode !== "intro") return;
    px = e.clientX; py = e.clientY; lastMove = performance.now(); moved = true;
  }, { passive: true });
  addEventListener("pointermove", (e) => {
    if (mode !== "home" || !host) return;
    const r = host.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return;
    px = x; py = y; lastMove = performance.now(); moved = true;
  }, { passive: true });

  const pourPointer = (now) => {
    if (!moved || px < 0) return;
    if (lpx < 0 || now - lastMove > 400) { lpx = px; lpy = py; }
    const dx = px - lpx, dy = py - lpy, dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const cell = rect[2] / GW;                                      /* one field cell in screen px */
    const n = Math.max(1, Math.ceil(dist / (cell * 1.4)));          /* samples are spaced by distance, never by frame rate */
    const rad = mode === "intro" ? 8.5 : 7;
    const per = mode === "intro" ? 0.095 : 0.07;
    for (let i = 1; i <= n; i++) { const u = toUV(lpx + dx * i / n, lpy + dy * i / n); dep(u[0], u[1], per, rad); }
    lpx = px; lpy = py;
  };
  /* two slow wanderers keep light alive between the rocks even when nobody touches the mouse */
  const pourWanderers = (now, dt) => {
    const t = (now - t0) / 1000;
    const idle = !moved || now - lastMove > 3000;
    const amt = (idle ? 0.20 : 0.07) * (dt / 1000);               /* per second, so every frame rate looks the same */
    const R0 = RING_D / 2;
    for (let k = 0; k < 2; k++) {
      const ang = t * (0.17 + k * 0.06) + k * 3.1, rho = 1.15 + 0.85 * (0.5 + 0.5 * Math.sin(t * 0.13 + k * 2.0));
      const x = EMB_X + Math.cos(ang) * rho * R0 * 1.12, y = EMB_Y + Math.sin(ang) * rho * R0 * 0.82;
      dep(x / IMG_W, y / IMG_H, amt, 8);
    }
    /* inner wanderers: one sweeps the TM, one rides the three thin rings (r = 0.63 / 0.71 / 0.78 of the medallion) */
    {
      const a1 = t * 0.55, r1 = 0.34 * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.21)));
      dep((800 + Math.cos(a1) * r1 * R0) / IMG_W, (441 + Math.sin(a1 * 1.3) * r1 * R0 * 0.9) / IMG_H, amt * 1.2, 3.6);
      const a2 = -t * 0.42 + 1.7, r2 = 0.63 + 0.15 * (0.5 + 0.5 * Math.sin(t * 0.37));
      dep((800.3 + Math.cos(a2) * r2 * R0) / IMG_W, (437.8 + Math.sin(a2) * r2 * R0) / IMG_H, amt * 1.1, 3.0);
    }
  };
  /* the push: a ring of light opens outward from the medallion */
  const pourEntry = (now, dt) => {
    const e = clamp((now - enterT) / 1300, 0, 1), rho = 0.15 + 3.2 * easeOut(e), R0 = RING_D / 2;
    const amt = 0.10 * (1 - e * 0.6) * (dt / 16.7);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + now * 0.0004;
      dep((EMB_X + Math.cos(a) * rho * R0) / IMG_W, (EMB_Y + Math.sin(a) * rho * R0 * 0.85) / IMG_H, amt, 5.5);
    }
  };

  /* ------------------------------------------------------------ frame loop */
  let ready = false, readyPending = false, entering = false, enterT = 0, handT = 0, raf = 0, alive = true, shown = 0, t0 = performance.now(), litT = 0;
  let tilt = [0, 0], homeVisible = true, lastNow = 0, slow = 0, fast = 0, renderScale = 1;
  let amb = 0.55, inten = 1.1, zoomV = 0, opac = 1, alphaMode = 1, glow = 0, mk = 0, flood = 0;
  const ZOOM_MAX = 2.4, PUSH = 1500;

  const draw = (now) => {
    const sec = (now - t0) / 1000;
    /* camera tilt: pointer when present, otherwise a slow breathing sway */
    const idle = !moved || now - lastMove > 2600;
    const tx = idle ? Math.sin(sec * 0.32) * 0.5 : clamp((px / W - 0.5) * 2, -1, 1) * 0.6;   /* light left-right only */
    const ty = 0;
    tilt[0] += (tx - tilt[0]) * 0.05; tilt[1] += (ty - tilt[1]) * 0.05;

    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);

    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const loc = gl.getAttribLocation(prog, "aPos"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(U.uAlb, 0); gl.uniform1i(U.uNor, 1); gl.uniform1i(U.uHei, 2); gl.uniform1i(U.uFld, 3); gl.uniform1i(U.uCls, 5); gl.uniform1i(U.uLz, 6); gl.uniform4f(U.uLzR, 670 / 1600, 335 / 900, 265 / 1600, 215 / 900);
    gl.uniform2f(U.uRes, W, H); gl.uniform2f(U.uZc, zc[0], zc[1]); gl.uniform2f(U.uTilt, tilt[0], tilt[1]); gl.uniform2f(U.uEmb, cx, cy);
    gl.uniform4f(U.uRect, rect[0], rect[1], rect[2], rect[3]);
    gl.uniform1f(U.uZoom, zoomV); gl.uniform1f(U.uAmb, amb); gl.uniform1f(U.uInt, inten);
    gl.uniform1f(U.uTime, sec); gl.uniform1f(U.uAlphaMode, alphaMode); gl.uniform1f(U.uOpacity, opac);
    gl.uniform1f(U.uRing, R); gl.uniform1f(U.uMk, 0); gl.uniform1f(U.uGlow, glow); gl.uniform1f(U.uFlood, 0);
    gl.uniform4fv(U.uM, markers);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, spTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 64, 1, gl.LUMINANCE, gl.UNSIGNED_BYTE, spBytes);
    gl.uniform1i(U.uSp, 4); gl.uniform1f(U.uPop, popV); gl.uniform1f(U.uBeat, beatV); gl.uniform1f(U.uLit, litV);
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
    gl.drawArrays(gl.POINTS, 0, mode === "home" ? ((popV > 0.02 || litV > 0.02) ? 0 : 70) : PN);
  };

  /* The carved medallion is the player: it follows the music state published by script.js (window.__tmMusic) */
  const stepMusic = (now, dt) => {
    const M = window.__tmMusic || {}, on = !!M.playing && mode === "home";
    const hov = mode === "home" && moved && Math.hypot(px - cx, py - cy) < R * 1.05;
    const target = on ? 1 : (hov ? 0.38 : 0), h = Math.min(dt, 50) / 1000;
    const k = reduce ? 400 : (on ? 70 : 55), c = reduce ? 60 : (on ? 10 : 14);   /* a spring: rises with a slight overshoot, sinks back calmly */
    popVel += (k * (target - popV) - c * popVel) * h; popV += popVel * h;
    if (popV < 0) { popV = 0; popVel = 0; }
    litV += ((on ? 1 : 0) - litV) * (1 - Math.exp(-Math.min(dt, 100) / (on ? 450 : 800)));
    const t = now / 1000;
    for (let i = 0; i < 64; i++) {
      let v = 0;
      if (on) v = M.data ? M.data[Math.min(M.data.length - 1, i)] / 255 : (0.22 + 0.5 * Math.abs(Math.sin(t * 2.1 + i * 0.37))) * (0.65 + 0.35 * Math.sin(t * 5.3 + i * 0.7));
      spv[i] += (v - spv[i]) * (v > spv[i] ? 0.55 : 0.12);
      spBytes[i] = Math.round(clamp(spv[i], 0, 1) * 255);
    }
    const b = on ? (M.data ? (M.beat || 0) : Math.pow(Math.max(0, Math.sin(t * Math.PI / 0.64)), 6)) : 0;
    beatV += (b - beatV) * 0.35;
    if (host) { const want = hov ? "pointer" : ""; if (host.style.cursor !== want) host.style.cursor = want; }
    if (stoneEl) stoneEl.classList.toggle("show", !on && hintDone);
    if (mode === "home" && !hintDone && hintGo) { hintDone = true; placeHint(); }       /* the stone label arrives last, after the role words */
  };
  /* "TAP TO PLAY": carved stone letters that drift strangely in place, under the medallion. Visible while the music is stopped. */
  let stoneEl = null, stoneLang = "";
  const buildStone = () => {
    if (homeImg) return null;                                    /* the player is paused for now: no label */
    const hv = host || document.querySelector(".hero"); if (!hv) return null;
    if (!stoneEl) { stoneEl = document.createElement("div"); stoneEl.className = "tm-stone"; stoneEl.setAttribute("aria-hidden", "true"); hv.appendChild(stoneEl); }
    const ar = isAr(), key = ar ? "ar" : "en";
    if (stoneLang !== key) {
      stoneLang = key; stoneEl.classList.toggle("tm-stone-ar", ar); stoneEl.textContent = "";
      const txt = ar ? "اضغط للتشغيل" : "TAP TO PLAY";
      const mk = (c, k, n) => {
        const i = document.createElement("i"); i.textContent = c; i.setAttribute("data-c", c);
        const r = (a) => ((Math.sin((k + 1) * a) * 43758.5453) % 1 + 1) % 1;
        i.style.setProperty("--d", (3.2 + r(12.9) * 3.4).toFixed(2) + "s"); i.style.setProperty("--dl", (-r(78.2) * 6).toFixed(2) + "s");
        i.style.setProperty("--rx", ((r(3.1) - 0.5) * 34).toFixed(1) + "deg"); i.style.setProperty("--ry", ((r(5.7) - 0.5) * 46).toFixed(1) + "deg");
        i.style.setProperty("--rz", ((r(9.3) - 0.5) * 12).toFixed(1) + "deg"); i.style.setProperty("--tz", (6 + r(2.2) * 16).toFixed(0) + "px");
        i.style.setProperty("--ty", ((r(7.7) - 0.5) * 7).toFixed(1) + "px");
        return i;
      };
      if (ar) stoneEl.appendChild(mk(txt, 3));                /* Arabic stays one joined word */
      else Array.from(txt).forEach((c, k) => { if (c === " ") { const sp = document.createElement("b"); stoneEl.appendChild(sp); } else stoneEl.appendChild(mk(c, k)); });
    }
    return stoneEl;
  };
  const placeHint = () => {
    const el = buildStone();
    if (!el || !host || mode !== "home") return;
    el.style.left = cx + "px"; el.style.top = (cy + R * 0.80 + 10) + "px";       /* hero coordinates: the hero itself never moves during the entrance */
    el.style.setProperty("--ts", clamp(R / 300, 0.72, 1.1).toFixed(2));
  };
  new MutationObserver(() => { if (stoneEl) buildStone(); if (mode === "home" && gl && prog) { layout(); placeHint(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });

  const MIN_LOAD = reduce ? 200 : 1100;    /* the counter always has time to breathe, but never longer than this */
  const MSG = [
    [0,  "Waking the stone",   "إيقاظ الحجر"],
    [28, "Gathering light",    "جمع الضوء"],
    [62, "Tracing the relief", "رسم التضاريس"],
    [92, "Ready",              "جاهز"]
  ];
  let msgI = -1;
  const setMsg = (pct) => {
    let i = 0; for (let k = 0; k < MSG.length; k++) if (pct >= MSG[k][0]) i = k;
    if (i === msgI || !msgEl) return;
    msgI = i; msgEl.setAttribute("data-en", MSG[i][1]); msgEl.setAttribute("data-ar", MSG[i][2]);
    msgEl.textContent = isAr() ? MSG[i][2] : MSG[i][1];
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

    /* loading counter: REAL progress (three maps + GL set-up); the logo is guaranteed to be there when it hits 100 */
    if (!ready) {
      const real = (state.alb ? 20 : 0) + (state.nor ? 20 : 0) + (state.hei ? 20 : 0) + (state.cls ? 20 : 0) + (texDone || flat ? 20 : 0);
      const cap = clamp(((now - t0) / MIN_LOAD) * 100, 0, 100);
      const target = Math.min(real, cap);
      shown += (target - shown) * (1 - Math.exp(-dt / 90));
      if (!readyPending) {
        if (real >= 100 && cap >= 100 && shown > 99.4) setReady();
        else { numEl.textContent = String(Math.floor(shown)).padStart(3, "0"); barEl.style.width = shown.toFixed(1) + "%"; setMsg(shown); }
      }
    }

    /* the mist field lives only while the scene is on screen */
    if (gl && prog && texDone && fldBoot && (mode === "intro" || homeVisible)) {
      pourPointer(now);
      stepField(dt);
    }

    /* lights fade up once the scene is ready, so the first thing you see is the relief emerging from black */
    if (mode === "intro") {
      if (texDone && !litT) litT = now;
      const lt = litT ? now - litT : 0;
      glow = easeOut(lt / 2000);
      mk = easeOut((lt - 600) / 2000);
      if (!entering) { amb = 0.82 * easeOut(lt / 1600); inten = 1.12; flood = 0; }
    }
    /* the camera push */
    if (entering && mode === "intro") {
      const t = (now - enterT) / PUSH;
      zoomV = ZOOM_MAX * easeInOut(t);
      inten = 1.12 + 0.02 * easeOut((now - enterT) / 900);
      amb = 0.82 + 0.02 * easeOut((now - enterT) / 900);
      glow = 1; mk = 1 + 0.4 * easeOut((now - enterT) / 900);
      flood = 0.5 * easeOut((now - enterT) / 1100);
    }
    /* the settle behind Home */
    if (mode === "home" && handT) {
      const t = now - handT;
      zoomV = ZOOM_MAX * (1 - easeOut5(t / 3800));
      opac = 0.92 * easeOut(t / 1700);
      amb = lerp(0.70, 0.62, easeOut(t / 2600));
      glow = lerp(1.0, 0.80, easeOut(t / 2600));
      mk = lerp(1.2, 0.75, easeOut(t / 3200));
      flood = lerp(0.5, 0.12, easeOut(t / 3600));
      if (t > 4000) handT = 0;
    }
    if (mode === "home" && homeImg) { if (homeVisible) stepPlayer(now, dt); return; }       /* Home is a picture + a CSS mechanism: no WebGL work at all */
    if (mode === "home") stepMusic(now, dt);
    if (mode === "home" && !homeVisible) return;
    if (!gl || !prog || !texDone) return;
    draw(now);
  };

  /* ------------------------------------------------------------- loading
     The three maps start loading from <head> (window.__tmImgs). Each one retries on failure, and the Enter button
     only unlocks when WebGL really holds the textures (or when we know for sure that the flat fallback will be used),
     so the logo can never be missing after "Enter". */
  let texDone = false, flat = false, failsafe = 0;
  const setReady = () => {
    readyPending = true;
    numEl.textContent = "100"; barEl.style.width = "100%"; setMsg(100);
    gate.classList.add("is-full");
    setTimeout(() => {                         /* a short beat on 100 %, then the counter dissolves into the button */
      ready = true;
      gate.classList.add("is-ready");
      btn.disabled = false;
      try { btn.focus({ preventScroll: true }); } catch (_) {}
      window.dispatchEvent(new CustomEvent("tm:ready"));
    }, reduce ? 0 : 750);
  };
  const early = window.__tmImgs || {};
  const grab = (k, tries) => {
    const im = (tries === 0 && early[k]) ? early[k] : new Image();
    imgs[k] = im;
    const ok = () => { state[k] = 1; };
    const bad = () => {
      if (tries < 4) setTimeout(() => grab(k, tries + 1), 350 * (tries + 1));
      else state[k] = -1;
    };
    im.onload = ok; im.onerror = bad;
    if (tries > 0 || !im.src) im.src = SRC[k] + (tries ? "&r=" + tries + "_" + (Date.now() % 100000) : "");
    if (im.complete) { if (im.naturalWidth) ok(); else if (tries > 0 || early[k]) bad(); }
  };
  ["alb", "nor", "hei", "cls", "lz"].forEach((k) => grab(k, 0));

  /* stand-in for the hollow-size map: every hollow behaves as a mid-size one */
  const flatCls = () => { const c = document.createElement("canvas"); c.width = c.height = 2; const x = c.getContext("2d"); x.fillStyle = "rgb(120,128,0)"; x.fillRect(0, 0, 2, 2); return c; };
  const flatLz = () => { const c = document.createElement("canvas"); c.width = c.height = 2; return c; };      /* black = no laser */
  let started = false;
  const tryUpload = () => {
    if (texDone || flat || !gl) return;
    /* step 1: shaders start compiling immediately, in parallel with the downloads */
    if (!started) { started = true; try { startGL(); } catch (e) { console.warn("[tm-intro] GL start failed", e); gl = null; fallback(); return; } }
    if (state.alb === -1 || state.nor === -1 || state.hei === -1) { fallback(); return; }
    if (!(imgs.alb.naturalWidth && imgs.nor.naturalWidth && imgs.hei.naturalWidth)) return;
    if (state.cls === 0 || state.lz === 0) return;                         /* the hollow-size map is still on its way */
    if (!done(prog) || !done(pprog)) return;
    /* step 2: maps + shaders are both here */
    try { initGL(); upload("alb", 0); upload("nor", 1); upload("hei", 2); if (state.cls !== 1 || !imgs.cls.naturalWidth) imgs.cls = flatCls(); upload("cls", 5); if (state.lz !== 1 || !imgs.lz.naturalWidth) imgs.lz = flatLz(); upload("lz", 6); buildField(); pickMarkers(); texDone = true; layout(); }
    catch (e) { console.warn("[tm-intro] GL init failed", e); gl = null; prog = null; fallback(); }
  };
  const upTimer = setInterval(() => { tryUpload(); if (texDone || flat || !alive) clearInterval(upTimer); }, 40);
  /* after 12 s of nothing we stop waiting: the flat picture is shown instead of a dead gate */
  failsafe = setTimeout(() => { if (!texDone) fallback(); }, 12000);

  /* flat fallback (no WebGL / lost context / assets that never arrive) */
  let heroBgEl = null;
  function ensureFallbackBg() {
    const hero = document.querySelector(".hero");
    if (!hero) return null;
    let el = hero.querySelector(".hero-logo-bg");
    if (!el) { el = document.createElement("div"); el.className = "hero-logo-bg"; el.setAttribute("aria-hidden", "true"); el.appendChild(document.createElement("i")); hero.insertBefore(el, hero.firstChild); }
    return el;
  }
  function fallback() {
    flat = true;
    stage.classList.add("tm-nogl");
    cv.style.display = "none";
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
  const at = (name, fn) => (window.__tmAt ? window.__tmAt(name, fn) : setTimeout(fn, (window.__tmTL && window.__tmTL[name]) || 0));
  const FLOATERS = ".st-rail, .st-chap, .float-wa, .scroll-orbit";
  const pop = (els, kf, opt) => els.forEach((el) => { try { el.animate(kf, Object.assign({ easing: "cubic-bezier(.16,1,.3,1)" }, opt)); } catch (_) {} });

  const enter = () => {
    if (entering || !ready) return;
    entering = true; enterT = performance.now();
    window.__tmGoing = true;
    if (window.__tmMark) window.__tmMark();
    gate.classList.add("tm-go");
    document.body.classList.add("tm-zoom-lock", "tm-pre-h", "tm-pre-r");

    /* the title is held back, and a hidden stand-in keeps "#enterGate" alive until Home starts */
    const h1 = document.querySelector(".hero h1"); if (h1) h1.classList.add("hero-pending");
    if (!document.querySelector("[data-tm-ph]")) { const ph = document.createElement("div"); ph.id = "enterGate"; ph.setAttribute("data-tm-ph", "1"); ph.hidden = true; ph.setAttribute("aria-hidden", "true"); document.body.appendChild(ph); }

    stage.style.transformOrigin = cx + "px " + cy + "px";
    stage.classList.add("tm-flying");
    document.body.appendChild(stage);

    const useGL = !!(gl && prog && texDone);
    const fadeDelay = reduce ? 0 : 1100, fadeDur = reduce ? 300 : 750;
    let flatAnim = null;
    if (!useGL && !reduce) flatAnim = stage.animate([{ transform: "scale(1)" }, { transform: "scale(3.4)" }], { duration: PUSH, easing: "cubic-bezier(.6,0,.18,1)", fill: "forwards" });
    const fade = stage.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fadeDur, delay: fadeDelay, easing: "ease-in-out", fill: "forwards" });
    if (reduce) zoomV = ZOOM_MAX;

    /* ---- the director: one clock, one order ---- */
    /* 1 · the stage hands the canvas to Home (invisible at this moment) and the relief settles in */
    setTimeout(() => {
      try { fade.cancel(); } catch (_) {}
      try { if (flatAnim) flatAnim.cancel(); } catch (_) {}
      stage.remove();
      document.body.classList.remove("tm-zoom-lock");
      if (window.__tmFire) window.__tmFire("handoff");
      if (heroEl) {
        host = heroEl; mode = "home";
        homeImg = document.createElement("div"); homeImg.className = "tm-home";
        const bgImg = document.createElement("img"); bgImg.className = "tm-home-bg"; bgImg.alt = ""; bgImg.decoding = "async";
        bgImg.setAttribute("aria-hidden", "true"); bgImg.draggable = false; bgImg.src = "images/home-bg.webp?v=2"; homeImg.appendChild(bgImg);
        buildPlayer();
        heroEl.insertBefore(homeImg, heroEl.firstChild);
        /* pointer: hover = a gentle zoom / tilt of the player; click on the medallion = play / pause */
        const inside = (e) => { const r = heroEl.getBoundingClientRect(); const dx = e.clientX - r.left - cx, dy = e.clientY - r.top - cy; return { dx, dy, hit: Math.hypot(dx, dy) < R * 0.8 }; };
        heroEl.addEventListener("pointermove", (e) => {
          if (mode !== "home") return;
          const o = inside(e), t = e.target, free = t === heroEl || (t.closest && t.closest(".hero-visual") && !t.closest("a,button,input,textarea,select,[role=button],[tabindex]"));
          plHovT = o.hit && free ? 1 : 0; plTx = clamp(o.dx / (R * 0.8), -1, 1); plTy = clamp(o.dy / (R * 0.8), -1, 1); heroEl.style.cursor = plHovT ? "pointer" : "";
        });
        heroEl.addEventListener("pointerleave", () => { plHovT = 0; plTx = plTy = 0; heroEl.style.cursor = ""; });
        heroEl.addEventListener("click", (e) => {
          const t = e.target;
          if (mode !== "home" || !(t === heroEl || (t.closest && t.closest(".hero-visual") && !t.closest("a,button,input,textarea,select,[role=button],[tabindex]")))) return;
          if (!inside(e).hit) return;
          const o = document.getElementById("tmOrb"); if (o) o.click();
        });
        entering = false; layout();
        /* the camera "lands" on it: the picture settles from a close-up and melts in */
        if (!reduce && homeImg.animate) homeImg.animate([{ opacity: 0, transform: "scale(1.32)" }, { opacity: 1, transform: "scale(1)" }], { duration: 3200, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
        if ("ResizeObserver" in window) { let t = 0; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (mode === "home") layout(); }, 100); }).observe(heroEl); }
        new MutationObserver(() => { if (mode === "home") layout(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
      }
      clearTimeout(failsafe);
    }, fadeDelay + fadeDur + 60);

    /* 2 · the top bar glides down */
    at("header", () => {
      document.body.classList.remove("tm-pre-h");
      const hd = document.querySelector(".site-header");
      if (hd) pop([hd], [{ opacity: 0, translate: "0 -22px", filter: "blur(8px)" }, { opacity: 1, translate: "0 0", filter: "blur(0px)" }], { duration: 1100 });
    });
    /* 3 · the music orb flies in, then the title and copy (enhance.js plays them in its own order after this call) */
    at("orb", () => {
      const t = document.querySelector(".hero h1"); if (t) t.classList.remove("hero-pending");
      try { if (typeof window.__restaggerHero === "function") window.__restaggerHero(); } catch (_) {}
      setTimeout(dropPh, 60);
    });
    at("rail", () => setTimeout(() => { hintGo = true; }, 700));
    /* 4 · side rail + floating buttons arrive last (the toast and its sound are timed by script.js with the same clock) */
    at("rail", () => {
      document.body.classList.remove("tm-pre-r");
      pop(Array.from(document.querySelectorAll(FLOATERS)), [{ opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)" }], { duration: 1000 });
    });
    /* safety net: nothing may stay hidden whatever happens */
    setTimeout(() => { document.body.classList.remove("tm-pre-h", "tm-pre-r"); dropPh(); const t = document.querySelector(".hero h1"); if (t) t.classList.remove("hero-pending"); }, 14000);
  };
  btn.addEventListener("click", enter);
  gate.addEventListener("click", (e) => { if (!e.target.closest || !e.target.closest("button")) btn.click(); });   /* a tap anywhere on the gate = the Enter button */
  gate.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") enter(); });
  window.__tmIntroState = () => ({ mode, opac, zoomV, amb, glow, mk, flood, homeVisible, W, H, dpr, rect, zc, handT, alphaMode, renderScale, texDone, flat, ready, glOK: !!(gl && prog) });
  window.__tmField = () => ({ max: Math.max.apply(null, Array.from(fu8)), mean: fu8.reduce((a, b) => a + b, 0) / fu8.length });

  /* if the gate is removed some other way, clean up */
  const mo = new MutationObserver(() => { if (!gate.isConnected && !window.__tmGoing && !document.getElementById("tmIntroStage")) { alive = false; cancelAnimationFrame(raf); mo.disconnect(); } });
  mo.observe(document.body, { childList: true });
})();


/* ==========================================================================
   UI SOUNDS + INTRO TEXT FX
   - tick-click.wav : side menu buttons (press)
   - tick-hover.wav : every button inside "Start a project" (hover; tap on touch)
   The intro itself is silent until you press Enter (no hover / glitch sounds on the gate any more).
   Browsers only allow sound after the first click/tap/key, so these start then.
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

  /* ================================================================== intro text FX (silent) ==================
     Every glitch is part of ONE score, not random noise:
       1 DECODE  : each letter flickers through a few random glyphs, then locks in with a bright flash (left -> right)
       2 SWEEP   : every ~7 s a scan-line passes left -> right; each letter splits into cyan / magenta ghosts for an instant
       3 TWITCH  : between sweeps, one single letter hiccups (glyph swap + 1-2 px split) every few seconds
     The Enter button text decodes when the button appears and again (fast) on hover / focus.
     Arabic text is never split (it would break the joined letters) - it just fades.                              */
  const gate = document.getElementById("enterGate");
  if (!gate || !gate.classList.contains("tm-intro")) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const GLY = "ABCDEFGHJKLMNPRSTUVXYZ0123456789#/<>+=*";
  const rg = () => GLY[(Math.random() * GLY.length) | 0];
  const hasAr = (s) => /[\u0600-\u06FF]/.test(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const nameEl = gate.querySelector(".tm-intro-name");
  const wordEl = gate.querySelector(".tm-enter-word");
  const enterBtn = document.getElementById("enterGateBtn");

  /* split an element's text into letter spans (idempotent, language aware) */
  const rigs = new Map();
  const split = (el) => {
    const text = (el.dataset.src && el.dataset.own === "1") ? el.dataset.src : el.textContent;
    if (reduce || hasAr(text) || document.documentElement.lang === "ar") { unsplit(el, text); return null; }
    el.dataset.src = text; el.dataset.own = "1";
    el.setAttribute("aria-label", text);
    el.classList.add("tm-split");
    rigs.get(el) && rigs.get(el).mo.disconnect();
    el.textContent = "";
    const spans = [];
    for (const ch of text) {
      const s = document.createElement("span");
      if (ch === " ") { s.className = "tm-sp"; s.textContent = "\u00a0"; }
      else { s.className = "tm-ch"; s.textContent = ch; s.setAttribute("data-c", ch); s.setAttribute("aria-hidden", "true"); spans.push(s); }
      el.appendChild(s);
    }
    const rig = { spans, text, mo: null };
    rig.mo = new MutationObserver(() => {                       /* the language switch overwrote our spans: rebuild */
      if (el.querySelector(".tm-ch")) return;
      rig.mo.disconnect(); el.dataset.own = "0"; split(el); const r = rigs.get(el); if (r) lockWidths(r);
    });
    rig.mo.observe(el, { childList: true });
    rigs.set(el, rig);
    return rig;
  };
  const unsplit = (el, text) => {
    const r = rigs.get(el); if (r) { r.mo.disconnect(); rigs.delete(el); }
    el.classList.remove("tm-split"); el.dataset.own = "0"; el.removeAttribute("aria-label");
    if (el.querySelector(".tm-ch")) el.textContent = text;
  };
  /* fix each letter's width so scrambled glyphs never make the line jump */
  const lockWidths = (rig) => rig.spans.forEach((s) => { s.style.width = ""; const w = s.getBoundingClientRect().width; if (w > 0) s.style.width = w.toFixed(2) + "px"; });

  /* 1 · decode */
  const decode = (el, o) => {
    const rig = rigs.get(el); if (!rig) { el.classList.add("tm-shown"); return Promise.resolve(); }
    o = Object.assign({ delay: 0, per: 70, cycles: 7, step: 42 }, o || {});
    const jobs = rig.spans.map((s, i) => new Promise((res) => {
      const real = s.getAttribute("data-c");
      s.classList.remove("on", "lock"); s.textContent = real;
      setTimeout(async () => {
        s.classList.add("on", "scr");
        for (let k = 0; k < o.cycles; k++) { s.textContent = rg(); await wait(o.step); }
        s.textContent = real; s.classList.remove("scr"); s.classList.add("lock");
        setTimeout(() => s.classList.remove("lock"), 320);
        res();
      }, o.delay + i * o.per);
    }));
    return Promise.all(jobs);
  };
  /* 2 · sweep */
  const sweep = (el) => {
    const rig = rigs.get(el); if (!rig) return;
    rig.spans.forEach((s, i) => setTimeout(() => { s.classList.add("gl"); setTimeout(() => s.classList.remove("gl"), 150); }, i * 58));
  };
  /* 3 · twitch */
  const twitch = (el) => {
    const rig = rigs.get(el); if (!rig || !rig.spans.length) return;
    const s = rig.spans[(Math.random() * rig.spans.length) | 0], real = s.getAttribute("data-c");
    s.classList.add("gl", "tw"); s.textContent = rg();
    setTimeout(() => { s.textContent = rg(); }, 55);
    setTimeout(() => { s.textContent = real; s.classList.remove("gl", "tw"); }, 120);
  };

  /* score for the name */
  const sec = (el) => document.body.contains(el) && !document.hidden && !window.__tmGoing;
  const score = (el) => {
    let nextSweep = performance.now() + 5200, nextTw = performance.now() + 2600;
    const loop = () => {
      if (!el.isConnected || window.__tmGoing) return;
      const now = performance.now();
      if (sec(el)) {
        if (now >= nextSweep) { sweep(el); nextSweep = now + 6800 + Math.random() * 1800; nextTw = Math.max(nextTw, now + 2200); }
        else if (now >= nextTw) { twitch(el); nextTw = now + 2400 + Math.random() * 2200; }
      }
      setTimeout(loop, 200);
    };
    loop();
  };

  const fontsReady = () => new Promise((res) => {
    const to = setTimeout(res, 1100);
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('600 30px "Cinzel"', "TIAMO"), document.fonts.load('13px "Michroma"', "ENTER 0123456789")]).then(() => { clearTimeout(to); res(); }, () => { clearTimeout(to); res(); });
    } else { clearTimeout(to); res(); }
  });

  /* name: decode as soon as the fonts are in (the loader is already running underneath) */
  if (nameEl) {
    const rig = split(nameEl);
    if (rig) {
      fontsReady().then(async () => {
        lockWidths(rig);
        await wait(380);
        await decode(nameEl, { per: 78, cycles: 8, step: 44 });
        score(nameEl);
      });
      setTimeout(() => rig.spans.forEach((s) => s.classList.add("on")), 7000);          /* safety: never leave it hidden */
    }
  }
  /* Enter text: decode when the button appears, again (fast) when pointed at */
  if (wordEl && enterBtn) {
    const r0 = split(wordEl);
    const show = () => { const r = rigs.get(wordEl); if (r) { lockWidths(r); decode(wordEl, { per: 55, cycles: 6, step: 40 }); } };
    if (r0) setTimeout(() => r0.spans.forEach((s) => s.classList.add("on")), 9000);
    window.addEventListener("tm:ready", () => setTimeout(show, 120));
    let busy = 0;
    const again = () => { if (busy || window.__tmGoing) return; const r = rigs.get(wordEl); if (!r) return; busy = 1; decode(wordEl, { per: 28, cycles: 4, step: 34 }).then(() => { busy = 0; }); };
    enterBtn.addEventListener("pointerenter", again);
    enterBtn.addEventListener("focus", again);
    /* language switch: re-split the new word */
    new MutationObserver(() => { if (!wordEl.querySelector(".tm-ch") && !hasAr(wordEl.textContent) && document.documentElement.lang !== "ar") { wordEl.dataset.own = "0"; const r = split(wordEl); if (r) { r.spans.forEach((s) => s.classList.add("on")); lockWidths(r); } } else if (hasAr(wordEl.textContent)) wordEl.classList.add("tm-shown"); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  /* the press: one clean chromatic hit on both lines, no sound */
  if (enterBtn) enterBtn.addEventListener("click", () => { [nameEl, wordEl].forEach((el) => { const r = el && rigs.get(el); if (r) r.spans.forEach((s, i) => setTimeout(() => { s.classList.add("gl"); setTimeout(() => s.classList.remove("gl"), 160); }, i * 22)); }); }, true);
})();
