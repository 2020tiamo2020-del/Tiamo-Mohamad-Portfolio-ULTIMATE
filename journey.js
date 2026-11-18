/* JOURNEY MODE v2: ONE continuous world. Scroll flies a camera through it (right, left, up, forward); everything is linked by hologram lines. */
(() => {
  const btn = document.getElementById("jBtn");
  if (!btn) return;
  const D = document, H = D.documentElement, RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const ORDER = ["home", "about", "services", "work", "cinema", "creation", "beforeafter", "process", "findme", "brief", "contact"];
  const MAIN = ["home", "about", "services", "work", "contact"];
  const POS = { home: [0, 0, 0], about: [1800, -100, 500], services: [1900, -1300, 1000], work: [300, -1500, 1500], cinema: [-1500, -1300, 3800], creation: [-1900, -100, 4300], beforeafter: [-1100, 1100, 4800], process: [500, 1300, 5300], findme: [2000, 1100, 5800], brief: [2300, -100, 6300], contact: [1000, -1000, 6900] };
  const F = 900;
  const U = {
    en: { open: "Open in site", visit: "Visit ↗", exit: "Exit journey", more: "More", hint: "Scroll to fly  ·  arrows  ·  Esc to exit", close: "Close", before: "Before", after: "After", beforeS: "The original shot, untouched.", afterS: "The final result after retouching and compositing.", explore: "Explore my work", start: "Start a project", sector: "Sector", items: "Items", next: "Next", link: "Link", cr: ["Fantasy", "Supernatural", "Super Power", "Fashion Style"], overview: "Overview", includes: "Includes", section: "Section", kw: { about: ["AI", "Photoshop", "Compositing", "Colour", "Motion"], cinema: ["Cinematic", "Atmosphere", "Imagination"], creation: [["Realms", "Creatures", "Epic light"], ["Spirits", "Mystery", "Shadows"], ["Energy", "Heroes", "Impact"], ["Editorial", "Couture", "Glamour"]], beforeafter: [["Original", "Untouched"], ["Retouched", "Composited", "Colour graded"]], contact: ["WhatsApp", "Direct message"] } },
    ar: { open: "افتح في الموقع", visit: "زيارة ↗", exit: "الخروج من الرحلة", more: "المزيد", hint: "مرّر للتحليق  ·  الأسهم  ·  Esc للخروج", close: "إغلاق", before: "قبل", after: "بعد", beforeS: "الصورة الأصلية كما هي.", afterS: "النتيجة النهائية بعد التعديل والدمج.", explore: "شاهد أعمالي", start: "ابدأ مشروعك", sector: "قطاع", items: "عناصر", next: "التالي", link: "رابط", cr: ["فانتازيا", "خوارق", "قوى خارقة", "أسلوب الأزياء"], overview: "نظرة عامة", includes: "يشمل", section: "القسم", kw: { about: ["ذكاء اصطناعي", "فوتوشوب", "دمج صور", "ألوان", "حركة"], cinema: ["سينمائي", "أجواء", "خيال"], creation: [["عوالم", "مخلوقات", "ضوء ملحمي"], ["أرواح", "غموض", "ظلال"], ["طاقة", "أبطال", "تأثير"], ["تحرير أزياء", "أناقة", "جاذبية"]], beforeafter: [["الأصل", "بدون تعديل"], ["تحسين", "دمج", "تدرج ألوان"]], contact: ["واتساب", "رسالة مباشرة"] } }
  };
  const L = () => U[H.lang === "ar" ? "ar" : "en"];
  const T = e => (e && e.textContent || "").replace(/\s+/g, " ").trim();
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const two = n => String(n).padStart(2, "0");
  const lab = id => T(D.querySelector('#nav a[href="#' + id + '"]')) || id;
  const src = i => i.getAttribute("src") || i.dataset.src || i.currentSrc || "";
  const heads = (s, sel, n) => { const seen = new Set(), o = []; s.querySelectorAll(sel).forEach(h => { const t = T(h); if (t && t.length < 60 && !seen.has(t) && o.length < n) { seen.add(t); const nx = h.nextElementSibling; o.push({ t, s: nx ? T(nx).slice(0, 110) : "" }); } }); return o; };

  /* what each station shows, read live from the real section */
  function info(id) {
    const s = D.getElementById(id), l = L();
    if (!s) return { t: lab(id), p: "", c: [] };
    const h = id === "home" ? s.querySelector("h1") : s.querySelector("h1,h2");
    const p = [...s.querySelectorAll("p")].map(T).find(x => x.length > 24) || "";
    const imgs = [...s.querySelectorAll("img")].filter(i => src(i));
    let c = [];
    if (id === "home") c = [{ t: l.explore, go: "work" }, { t: l.start, go: "brief" }];
    else if (id === "about") c = imgs.slice(0, 2).map((i, k) => ({ t: k ? (i.alt || "Tiamo Mohamad") : (T(s.querySelector("h3")) || i.alt), img: src(i) })).concat([{ t: "Tiamo Mohamad", s: p.slice(0, 220), txt: 1 }]);
    else if (id === "services") c = heads(s, "h3", 6);
    else if (id === "work") { const st = Math.max(1, Math.floor(imgs.length / 6)), a = imgs.filter((_, k) => k % st === 0).slice(0, 6); c = a.map((i, k) => ({ t: i.alt || "Work", s: (i.alt || "Work").replace(/\s*\d+$/, "") + "  ·  " + (k + 1) + " / " + a.length, img: src(i) })); }
    else if (id === "cinema") c = [{ t: T(h) || lab(id), s: p.slice(0, 120) }];
    else if (id === "creation") c = l.cr.map(t => ({ t }));
    else if (id === "beforeafter") c = [{ t: l.before, s: l.beforeS }, { t: l.after, s: l.afterS }];
    else if (id === "process" || id === "brief") c = heads(s, "h3", 6).map((x, k) => ({ t: x.t, s: two(k + 1), d: x.s }));
    else if (id === "findme") { const seen = new Set(); c = [...s.querySelectorAll("a[href^=http]")].filter(a => !seen.has(a.href) && seen.add(a.href)).slice(0, 5).map(a => ({ t: T(a).slice(0, 34) || a.hostname, href: a.href, img: a.querySelector("img") ? src(a.querySelector("img")) : "" })); }
    else if (id === "contact") { const a = s.querySelector("a[href^=http]"); c = a ? [{ t: "WhatsApp", s: T(a).replace(/whatsapp/i, "").trim(), href: a.href }] : []; }
    return { t: T(h) || lab(id), p, c };
  }

  /* DOM */
  let jw, $, live = false, lastFocus = null, y0 = 0, inerted = [], cards = {};
  function build() {
    jw = D.createElement("div"); jw.id = "jw"; jw.setAttribute("role", "dialog"); jw.setAttribute("aria-modal", "true"); jw.setAttribute("aria-label", "Journey");
    jw.innerHTML = '<canvas id="jwroom" aria-hidden="true"></canvas><div class="jw-bg" id="jwbgA" aria-hidden="true"></div><div class="jw-bg" id="jwbgB" aria-hidden="true"></div><div class="jw-scrim" aria-hidden="true"></div><div class="jw-grid" aria-hidden="true"></div><canvas id="jwfx" aria-hidden="true"></canvas><div class="jw-w" id="jwW2"></div>' +
      '<header class="jw-nav"><div class="jw-in" id="jwIn"></div><div class="jw-pan" id="jwPan"><div class="jw-pin" id="jwPin"></div></div></header>' +
      '<button class="jw-x" id="jwX" type="button"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button><div class="jw-dots" id="jwD"></div><div class="jw-ro" id="jwRo" aria-hidden="true"></div><div class="jw-hint" id="jwH"></div><div class="jw-win" id="jwW"></div>';
    D.body.appendChild(jw); $ = id => D.getElementById(id);
    jw.addEventListener("click", onClick);
    jw.addEventListener("wheel", e => { e.stopPropagation(); if (jw.classList.contains("win")) return; fly = null; dirS = Math.sign(e.deltaY) || dirS; tgt = Math.max(0, Math.min(WPS.length - 1, tgt + e.deltaY * .0016)); idle(); }, { passive: true });
    let tx = 0, ty = 0, drag = false;
    jw.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; drag = true; }, { passive: true });
    jw.addEventListener("touchmove", e => { if (!drag || jw.classList.contains("win")) return; const x = e.touches[0].clientX, y = e.touches[0].clientY; fly = null; const dd = (ty - y) + (tx - x) * .6; dirS = Math.sign(dd) || dirS; tgt = Math.max(0, Math.min(WPS.length - 1, tgt + dd * .006)); tx = x; ty = y; idle(); }, { passive: true });
    jw.addEventListener("touchend", () => { drag = false; });
    jw.addEventListener("mousemove", e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); });
    new MutationObserver(() => { if (live) setTimeout(() => { render(); mark(); }, 80); }).observe(H, { attributes: true, attributeFilter: ["lang", "dir"] });
  }
  function render() {
    const l = L(); cards = {};
    $("jwIn").innerHTML = '<button class="jw-it jw-cur" type="button" data-jmore="1"><span id="jwCur"></span> ▾</button>' + MAIN.map(id => '<button class="jw-it" type="button" data-jgo="' + id + '">' + esc(lab(id)) + "</button>").join("") + '<button class="jw-it" type="button" data-jmore="1" id="jwMore">' + l.more + " ▾</button>";
    $("jwPin").innerHTML = ORDER.map(id => '<button class="jw-it' + (MAIN.includes(id) ? " m-only" : "") + '" type="button" data-jgo="' + id + '">' + esc(lab(id)) + "<small>" + two(ORDER.indexOf(id) + 1) + "</small></button>").join("");
    $("jwD").innerHTML = ORDER.map(id => '<button class="jw-dot" type="button" data-jgo="' + id + '" aria-label="' + esc(lab(id)) + '"></button>').join("");
    $("jwH").textContent = l.hint; $("jwX").setAttribute("aria-label", l.exit);
    layout();
  }
  let cur = "home";
  function mark() {
    const l = L(), inMore = !MAIN.includes(cur);
    jw.querySelectorAll("[data-jgo]").forEach(b => { const on = b.dataset.jgo === cur; b.classList.toggle("is-on", on); on ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"); });
    $("jwMore").classList.toggle("is-on", inMore); $("jwCur").textContent = lab(cur);
    $("jwX").setAttribute("aria-label", jw.classList.contains("win") ? l.close : l.exit);
  }
  const pan = v => { $("jwPan").classList.toggle("is-open", v); };

  /* THE WORLD: every item has a position in space; waypoints are where the camera stops */
  let W = 0, H2 = 0, LY, els = [], WPS = [], ST = {}, P = 0, tgt = 0, fly = null, cam = { x: 0, y: 0, z: 0 }, mx = 0, my = 0, idleT = 0, dirS = 1, clouds = {}, stars = [];
  function layout() {
    const mob = W < 760;
    LY = mob ? { hx: 0, hy: -H2 * .27, gx: 0, gy: H2 * .12, sx: 176, sy: 200, cw: 164, cols: 2, s0: 1, hw: Math.min(W - 40, 340) } : { hx: -430, hy: 40, gx: 330, gy: 0, sx: 340, sy: 300, cw: 300, cols: 3, s0: Math.min(1, W / 1560, H2 / 880), hw: 520 };
    const root = $("jwW2"); root.innerHTML = ""; els = []; WPS = []; ST = {};
    const add = (cls, html, x, y, z, st, extra) => { const isC = cls.slice(0, 2) === "jc", n = D.createElement(isC ? "button" : "div"); n.className = "je " + cls; if (isC) n.type = "button"; n.innerHTML = html; if (extra && extra.w) n.style.width = extra.w + "px"; root.appendChild(n); const o = Object.assign({ n, x, y, z, st, cls }, extra); els.push(o); return o; };
    const l = L();
    ORDER.forEach((id, si) => {
      const d = info(id), [hx, hy, hz] = POS[id], C = { x: hx, y: hy, z: hz }, cs = d.c, n = cs.length; cards[id] = cs;
      ST[id] = { C, wi: WPS.length, d };
      WPS.push({ id, x: C.x, y: C.y, z: C.z });
      add("jt", '<div class="jw-k">' + two(si + 1) + " / " + ORDER.length + " — " + esc(lab(id)) + "</div><h2>" + esc(d.t) + "</h2><p>" + esc(d.p) + "</p>", C.x + LY.hx, C.y + LY.hy, C.z, id, { w: LY.hw, wi: ST[id].wi });
      const cols = id === "work" ? 1 : Math.min(LY.cols, Math.max(1, n)), rows = Math.ceil(n / cols);
      cs.forEach((c, k) => {
        let x, y, z = C.z + (k % 3) * 40;
        if (id === "work") { const mb = W < 760; x = C.x + LY.gx + (k % 2 ? (mb ? 50 : 230) : (mb ? -50 : -200)) * (LY.cw / 300); y = C.y + (mb ? H2 * .2 : 0) + ((k % 3) - 1) * (mb ? 100 : 150); z = C.z + 380 * (k + .5); }
        else { x = C.x + LY.gx + ((k % cols) - (cols - 1) / 2) * LY.sx; y = C.y + LY.gy + (Math.floor(k / cols) - (rows - 1) / 2) * LY.sy + (k % cols) * 14; }
        const o = add("jc" + (c.txt ? " jc-txt" : ""), '<span class="jc-in">' + (c.img ? '<img src="' + esc(c.img) + '" alt="">' : "") + "<b>" + esc(c.t) + "</b>" + (c.s ? "<small>" + esc(c.s) + "</small>" : "") + "</span>", x, y, z, id, { w: id === "work" ? Math.round(LY.cw * 1.5) : LY.cw, id, k, wi: id === "work" ? WPS.length : ST[id].wi, work: id === "work" });
        if (c.img) { const im = o.n.querySelector("img"); im.onload = () => { const r = im.naturalWidth / im.naturalHeight; o.n.style.width = Math.round(LY.cw * (id === "work" ? 1.5 : 1) * (r > 1.15 ? 1.25 : r < .85 ? .8 : 1)) + "px"; }; }
        if (id === "work") WPS.push({ id, x: x, y: y, z: z - 30 });
      });
      const nx = ORDER[si + 1];
      add("jl", esc(l.sector) + " " + two(si + 1) + "<br>" + esc(l.items) + " " + two(n), C.x + LY.hx, C.y + LY.hy - (W < 760 ? 70 : 150), C.z, id, { w: 200, ann: 1, wi: ST[id].wi });
      if (nx) add("jl jl-r", esc(l.next) + " → " + esc(lab(nx)) + "<br>X " + POS[nx][0] + "  Y " + POS[nx][1], C.x + LY.gx + (W < 760 ? 0 : 330), C.y + (W < 760 ? 330 : 250), C.z, id, { w: 220, ann: 1, wi: ST[id].wi });
    });
    clouds = {}; stars = Array.from({ length: 650 }, () => ({ x: -3400 + Math.random() * 7400, y: -2800 + Math.random() * 5600, z: -300 + Math.random() * 7800, a: Math.random() }));
  }
  /* particles: they stream across the screen while you fly and settle into the shape of the station you reach */
  let PT = [], pcache = {}, pt0 = 0;
  const samp = draw => { const o = D.createElement("canvas"); o.width = W; o.height = H2; const c = o.getContext("2d"); draw(c); const d = c.getImageData(0, 0, W, H2).data, a = []; for (let y = 0; y < H2; y += 4) for (let x = 0; x < W; x += 4) if (d[(y * W + x) * 4 + 3] > 128) a.push([x, y]); return a; };
  const word = t => samp(c => { c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; const fs = Math.min(W * .9 / Math.max(t.length * .6, 3), H2 * .3, 280); c.font = "600 " + fs + "px Oswald,Impact,'Arial Narrow',sans-serif"; c.fillText(t, W / 2, H2 * .3); });
  const bust = () => samp(c => { const x = W > 760 ? W * .5 : W * .5, r = Math.min(H2 * .11, W * .2); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, H2 * .3, r * .82, r * 1.1, .1, 0, 7); c.fill(); c.fillRect(x - r * .3, H2 * .36, r * .6, H2 * .1); c.beginPath(); c.ellipse(x, H2 * .78, Math.min(W * .26, H2 * .34), H2 * .26, 0, 0, 7); c.fill(); });
  const rects = list => samp(c => { c.strokeStyle = "#fff"; c.lineWidth = 5; list.forEach(r => c.strokeRect(W * r[0], H2 * r[1], W * r[2], H2 * r[3])); });
  const fpts = id => pcache[id] || (pcache[id] = id === "home" ? word("TIAMO") : id === "about" ? bust() : /^(services|process)$/.test(id) ? rects([[.06, .16, .2, .1], [.1, .3, .2, .1], [.06, .44, .2, .1]]) : rects([[.08, .12, .22, .26], [.4, .08, .26, .3], [.72, .42, .2, .28], [.18, .56, .18, .22]]));
  function morph(id) {
    if (!PT.length) return; pt0 = performance.now(); PT.forEach(p => p.d = Math.random() * 300);
    if (/^(contact|findme|brief)$/.test(id)) { const x = W / 2, gy = H2 * .6; PT.forEach((p, i) => { if (i % 3) { p.col = 1; p.tx = x + (Math.random() - .5) * Math.min(70, W * .12) * Math.random(); p.ty = Math.random() * gy; p.v = 1.5 + Math.random() * 3; } else { p.col = 0; const t = Math.pow(Math.random(), 1.5); p.tx = x + (Math.random() - .5) * W * 1.5 * t; p.ty = gy + t * (H2 - gy); } }); return; }
    const a = fpts(id).slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    PT.forEach((p, i) => { const q = a[i % a.length]; p.tx = q[0] + (Math.random() - .5) * 2; p.ty = q[1] + (Math.random() - .5) * 2; p.col = 0; });
  }
  const initPT = () => { PT = Array.from({ length: W < 760 ? 900 : 1500 }, (_, i) => ({ x: W / 2, y: H2 * .45, tx: 0, ty: 0, d: 0, sp: Math.random(), ph: Math.random() * 6, r: .7 + Math.random() * 1.1, c: COL[i % 3] + ".8)", col: 0, v: 0 })); };


  /* ROOMS: each station is a real room. A WebGL layer fakes depth (radial parallax + dolly), so scrolling flies through the room and passes through light into the next one. */
  const RD = "rooms/";
  const RS = { home: ["hero", 0], about: ["oculus", 0], services: ["arch", 0], work: ["pink", 0], cinema: ["skylight", 0], creation: ["corridor", 0], beforeafter: ["dome", 0], process: ["plan", 0], findme: ["arch", 1], brief: ["pink", 1], contact: ["hero", 1] };
  const RN = ["hero", "oculus", "arch", "pink", "skylight", "corridor", "dome", "plan"];
  let rc, gl, prog, U2 = {}, TX = {}, TA = {}, rloaded = false, rmx = 0, rmy = 0, grp = [], rok = false;
  function roomLoad() {
    if (rloaded) return; rloaded = true;
    RN.forEach(n => { const im = new Image(); im.decoding = "async"; im.onload = () => { TA[n] = im; if (gl && !TX[n]) mkTex(n); if (!gl) cssBg(); }; im.src = RD + n + ".webp"; });
  }
  function mkTex(n) {
    const im = TA[n], t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    TX[n] = { t, a: im.naturalWidth / im.naturalHeight };
  }
  const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS = `precision highp float;
uniform sampler2D tA,tB;uniform vec2 res,m;uniform float aA,aB,fA,fB,zA,zB,mx,tr,tm,hA,hB;
vec3 room(sampler2D t,vec2 uv,float ia,float fl,float z){
  float sa=res.x/res.y;vec2 vp=vec2(.5,.45);vec2 d=uv-vp;
  float r=length(d*vec2(sa,1.));
  float s=1.-z*(.2+.8*smoothstep(0.,.95,r));
  vec2 p=vp+d*s;
  float near=smoothstep(0.,.9,r);
  p+=m*(.01+.045*near)*vec2(1.,.55);
  vec2 c=p-.5;
  if(ia>sa)c.x*=sa/ia;else c.y*=ia/sa;
  c*=.9;c.x*=fl;
  vec2 q=c+.5;q=1.-abs(1.-mod(q,2.));
  return texture2D(t,q).rgb;
}
vec3 samp(sampler2D t,vec2 uv,float ia,float fl,float z,float bl){
  vec3 a=vec3(0.);vec2 d=(uv-vec2(.5,.45));
  for(int i=0;i<8;i++){float k=float(i)/7.;a+=room(t,uv-d*bl*k,ia,fl,z);}
  return a/8.;
}
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/res;uv.y=1.-uv.y;
  float bl=tr*.14;
  vec3 col=samp(tA,uv,aA,fA,zA,bl);
  if(hB>.5){vec3 b=samp(tB,uv,aB,fB,zB,bl);col=mix(col,b,smoothstep(.3,.7,mx));}
  float gl_=pow(sin(3.14159*mx),2.)*tr;
  col=pow(col,vec3(1.45))*.7;
  col=mix(col*vec3(.74,.7,1.),col,.3);
  col+=vec3(.5,.38,1.)*gl_*.42;
  float sa=res.x/res.y;float v=smoothstep(1.15,.3,length((uv-.5)*vec2(sa,1.)*1.05));
  col*=mix(.38,1.,v);
  col+=(h(gl_FragCoord.xy+tm)-.5)*.035;
  gl_FragColor=vec4(col,1.);
}`;
  function roomInit() {
    if (rok) return; rok = true; roomLoad(); rc = $("jwroom");
    try { gl = rc.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); } catch (e) { gl = null; }
    if (!gl) { rc.style.display = "none"; return; }
    const sh = (ty, src) => { const o = gl.createShader(ty); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw 0; return o; };
    try {
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    } catch (e) { gl = null; rc.style.display = "none"; return; }
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["tA", "tB", "res", "m", "aA", "aB", "fA", "fB", "zA", "zB", "mx", "tr", "tm", "hA", "hB"].forEach(k => U2[k] = gl.getUniformLocation(prog, k));
    gl.uniform1i(U2.tA, 0); gl.uniform1i(U2.tB, 1);
    RN.forEach(n => { if (TA[n] && !TX[n]) mkTex(n); });
  }
  function roomSize() {
    if (!rc) return; const d = Math.min(devicePixelRatio || 1, W < 760 ? 1.25 : 1.6);
    rc.width = Math.round(W * d); rc.height = Math.round(H2 * d); if (gl) gl.viewport(0, 0, rc.width, rc.height);
  }
  /* waypoints that sit in the same room share one slow push-in */
  function groups() {
    grp = []; let i = 0; const key = k => RS[WPS[k].id].join(":");
    while (i < WPS.length) { let j = i; while (j + 1 < WPS.length && key(j + 1) === key(i)) j++; for (let k = i; k <= j; k++) grp[k] = [i, j]; i = j + 1; }
  }
  const rkey = id => RS[id].join(":");
  function cssBg() { /* fallback without WebGL: plain cross-fade of the room images */
    const A = $("jwbgA"), B = $("jwbgB"); if (!A) return; A.style.display = B.style.display = "block";
  }
  function roomDraw(t, dt) {
    rmx += (mx - rmx) * (1 - Math.exp(-dt * 4)); rmy += (my - rmy) * (1 - Math.exp(-dt * 4));
    const n = WPS.length; if (!n) return; if (grp.length !== n) groups();
    const pp = clamp(P, 0, n - 1), i = Math.floor(pp), j = Math.min(n - 1, i + 1), u = pp - i;
    const ia = WPS[i].id, ib = WPS[j].id, same = rkey(ia) === rkey(ib), ga = grp[i], br = RM ? 0 : .012 * Math.sin(t * .0004);
    const zA0 = .1 * clamp((pp - ga[0]) / Math.max(1, ga[1] - ga[0]), 0, 1) + br;
    const A = RS[ia], B = RS[ib];
    if (!gl) { const a = $("jwbgA"), b = $("jwbgB"); if (a && TA[A[0]]) { a.style.backgroundImage = "url(" + RD + A[0] + ".webp)"; a.style.transform = "scale(" + (1.06 + zA0 + (same ? 0 : u * .5)).toFixed(3) + ") scaleX(" + (A[1] ? -1 : 1) + ")"; a.style.opacity = same ? 1 : 1 - u; } if (b && TA[B[0]]) { b.style.backgroundImage = "url(" + RD + B[0] + ".webp)"; b.style.opacity = same ? 0 : u; b.style.transform = "scale(" + (1.06 + (1 - u) * -.05).toFixed(3) + ") scaleX(" + (B[1] ? -1 : 1) + ")"; } return; }
    const ta = TX[A[0]], tb = TX[B[0]]; if (!ta) return;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, ta.t);
    const hasB = !same && tb ? 1 : 0; if (hasB) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tb.t); }
    gl.uniform2f(U2.res, rc.width, rc.height); gl.uniform2f(U2.m, rmx, rmy);
    gl.uniform1f(U2.aA, ta.a); gl.uniform1f(U2.aB, hasB ? tb.a : 1); gl.uniform1f(U2.fA, A[1] ? -1 : 1); gl.uniform1f(U2.fB, B[1] ? -1 : 1);
    const ease = same ? 0 : u;
    gl.uniform1f(U2.zA, zA0 + (same ? 0 : ease * .75)); gl.uniform1f(U2.zB, hasB ? -(1 - ease) * .4 : 0);
    gl.uniform1f(U2.mx, ease); gl.uniform1f(U2.tr, same ? 0 : 1); gl.uniform1f(U2.tm, RM ? 0 : (t * .001) % 10);
    gl.uniform1f(U2.hA, 1); gl.uniform1f(U2.hB, hasB);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* camera path (Catmull-Rom through the waypoints) */
  const cr = (a, b, c, d, t) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  function camAt(p) {
    const n = WPS.length, i = Math.max(0, Math.min(n - 1, Math.floor(p))), u = Math.min(1, p - i), g = k => WPS[Math.max(0, Math.min(n - 1, k))];
    const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2), e = u * u * (3 - 2 * u), o = {};
    ["x", "y", "z"].forEach(k => o[k] = cr(a[k], b[k], c[k], d[k], e));
    return o;
  }
  const proj = (x, y, z) => { const dz = z - cam.z; if (dz < -F * .72) return null; const s = F / (F + dz) * LY.s0; return { x: W / 2 + (x - cam.x) * s - mx * 18 * s, y: H2 / 2 + (y - cam.y) * s - my * 12 * s, s, dz }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let fx, g, t0 = 0, lastT = 0, raf = 0, stopAt = 0, fr = 0;
  const COL = ["rgba(150,205,255,", "rgba(185,125,255,", "rgba(22,216,255,", "rgba(190,230,255,"];

  function frame(t) {
    if (!live && t > stopAt) { raf = 0; return; }
    const dt = Math.min(t - (lastT || t - 16), 120) / 1000; lastT = t; fr++;
    if (fly) { const k = clamp((t - fly.t0) / fly.dur, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; P = fly.a + (fly.b - fly.a) * e; tgt = P; if (k >= 1) fly = null; }
    else P += (tgt - P) * (RM ? 1 : 1 - Math.exp(-dt * 6));
    cam = camAt(P);
    const idx = Math.round(clamp(P, 0, WPS.length - 1)), id = WPS[idx].id; if (id !== cur) { cur = id; mark(); morph(id); }
    roomDraw(t, dt);
    g.clearRect(0, 0, W, H2);
    /* stars (parallax) */
    for (const s of stars) { const p = proj(s.x, s.y, s.z); if (!p || p.dz > 3600) continue; g.fillStyle = "rgba(190,200,255," + (clamp(1 - p.dz / 3600, 0, 1) * (.35 + s.a * .6)).toFixed(2) + ")"; const r = Math.max(.5, 1.7 * p.s); g.fillRect(p.x, p.y, r, r); }
    /* hologram path through every waypoint, with flowing light */
    const pts = WPS.map(w => proj(w.x, w.y, w.z)); g.lineWidth = 1.5; g.lineCap = "round";
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if (!a || !b || (a.dz > 3800 && b.dz > 3800)) continue; const al = clamp(1 - Math.min(a.dz, b.dz) / 3800, .12, 1);
      g.setLineDash([]); g.strokeStyle = "rgba(139,53,255," + (al * .22).toFixed(2) + ")"; g.lineWidth = 6 * Math.min(a.s, 1.4); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      g.setLineDash([12, 10]); g.lineDashOffset = -t * .05; g.strokeStyle = "rgba(22,216,255," + (al * .85).toFixed(2) + ")"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    g.setLineDash([]);
    /* stations: nodes, rotating rings, leader lines to every item and note, point clouds */
    ORDER.forEach(id => {
      const S = ST[id], h = proj(S.C.x, S.C.y, S.C.z); if (!h || h.dz > 2300) return; const al = clamp(1 - Math.max(0, h.dz) / 2300, 0, 1);
      g.strokeStyle = "rgba(22,216,255," + (al * .9).toFixed(2) + ")"; g.lineWidth = 1.4; const r = 9 * h.s; g.beginPath(); g.moveTo(h.x, h.y - r); g.lineTo(h.x + r, h.y); g.lineTo(h.x, h.y + r); g.lineTo(h.x - r, h.y); g.closePath(); g.stroke();
      g.setLineDash([20 * h.s, 12 * h.s]); g.lineDashOffset = -t * .02; g.strokeStyle = "rgba(139,53,255," + (al * .8).toFixed(2) + ")"; g.beginPath(); g.arc(h.x, h.y, 70 * h.s, 0, 6.283); g.stroke(); g.setLineDash([]);
      g.strokeStyle = "rgba(160,170,255," + (al * .38).toFixed(2) + ")"; g.lineWidth = 1; g.fillStyle = "rgba(22,216,255," + (al * .9).toFixed(2) + ")";
      els.forEach(e => { if (e.st !== id || e.cls === "jt") return; const q = proj(e.x, e.y, e.z); if (!q) return; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(q.x, q.y); g.stroke(); g.fillRect(q.x - 2, q.y - 2, 4, 4); });
    });
    const el = t - pt0; g.lineCap = "round"; g.globalAlpha = .8;
    for (const p of PT) {
      if (p.col) { p.ty += p.v * dt * 60; if (p.ty > H2 * .6) { p.ty = 0; p.y = 0; } }
      const k = el > p.d ? 1 - Math.exp(-dt * (3 + p.sp * 4)) : 0, ox = p.x, oy = p.y;
      p.x += (p.tx - p.x) * k + Math.sin(t * .0012 + p.ph) * .1; p.y += (p.ty - p.y) * k + Math.cos(t * .001 + p.ph) * .1;
      g.strokeStyle = p.c; g.lineWidth = p.r; g.beginPath(); g.moveTo(ox, oy); g.lineTo(p.x + .01, p.y); g.stroke(); g.fillStyle = p.c; g.fillRect(p.x - .6, p.y - .6, 1.2 + p.r * .8, 1.2 + p.r * .8);
    }
    g.globalAlpha = 1;
    /* DOM items follow the camera: scale, fade and soft focus by distance */
    for (const e of els) {
      const p = proj(e.x, e.y, e.z), n = e.n;
      if (!p || p.dz > 3300) { if (e.vis) { n.style.visibility = "hidden"; e.vis = 0; } continue; }
      const ip = e.work ? clamp((P - (e.wi - 1.3)) / .8, 0, 1) * clamp((e.wi + 1.1 - P) / .6, 0, 1) : clamp(1 - (Math.abs(P - e.wi) - .5) / .5, 0, 1);
      const op = ip * clamp((p.dz + 400) / 250, 0, 1) * clamp(1 - (p.dz - 1150) / 950, 0, 1);
      if (op < .02) { if (e.vis) { n.style.visibility = "hidden"; e.vis = 0; } continue; }
      const bl = Math.max(0, (p.dz - 900) / 450, (-p.dz - 120) / 90, (1 - ip) * 4); e.vis = 1;
      n.style.visibility = "visible"; n.style.opacity = op.toFixed(2); n.style.zIndex = 1000 - Math.round(p.dz / 10);
      n.style.transform = "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px) scale(" + Math.min(p.s, LY.s0 * 1.4).toFixed(3) + ") translate(-50%,-50%)";
      n.style.filter = bl > .3 ? "blur(" + Math.min(bl, 6).toFixed(1) + "px)" : "";
      if (e.cls[1] === "c") n.style.pointerEvents = p.dz > -240 && p.dz < 1300 && op > .55 ? "auto" : "none";
    }
    if (fr % 6 === 0) { const ro = $("jwRo"); ro.textContent = "X " + Math.round(cam.x) + "   Y " + Math.round(cam.y) + "   Z " + Math.round(cam.z); }
    raf = requestAnimationFrame(frame);
  }
  const idle = () => { clearTimeout(idleT); idleT = setTimeout(() => { if (!fly) tgt = clamp(dirS > 0 ? Math.ceil(tgt - .15) : Math.floor(tgt + .15), 0, WPS.length - 1); }, 380); };
  function flyTo(i) { i = clamp(i, 0, WPS.length - 1); const d = Math.abs(i - P); if (d < .01) return; fly = { a: P, b: i, t0: performance.now(), dur: RM ? 1 : 900 + Math.min(2400, d * 340) }; pan(false); }
  const goId = id => ST[id] && flyTo(ST[id].wi);
  const step = d => flyTo(Math.round(clamp(tgt, 0, WPS.length - 1)) + d);

  /* project / section window: it grows out of the card you pressed (video 2), the nav gives way to an X */
  const split = s => String(s || "").split(/,|،|;| and |\.|•|·/i).map(x => x.trim()).filter(x => x.length > 2 && x.length < 24).slice(0, 6).map(x => x[0].toUpperCase() + x.slice(1));
  function keywords(id, c, k, d, l) {
    if (id === "services") return split(c.s);
    if (id === "process" || id === "brief") return split(c.d);
    if (id === "home") return split(d.p);
    if (id === "work") return [(c.s || "").split("·")[0].trim()].filter(Boolean);
    if (id === "findme") return [c.t];
    const v = l.kw[id]; return !v ? [] : Array.isArray(v[0]) ? v[k] || [] : v;
  }
  const CP = [[14, 20], [72, 14], [86, 46], [74, 84], [16, 80], [6, 48]];
  function openWin(id, k) {
    const l = L(), c = cards[id][k], d = ST[id].d, kk = two(ORDER.indexOf(id) + 1) + " / " + ORDER.length + " — " + lab(id);
    const desc = c.d || (c.txt ? c.s : (c.s && c.s.length > 20 && c.s.indexOf("·") < 0 ? c.s : d.p)), kw = keywords(id, c, k, d, l);
    const holo = '<div class="jw-holo"><svg class="jw-hl" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">' + kw.map((w, i) => '<line x1="50" y1="30" x2="' + CP[i][0] + '" y2="' + (CP[i][1] * .6).toFixed(1) + '"/>').join("") + '</svg><div class="jw-hn" aria-hidden="true">' + two(ORDER.indexOf(id) + 1) + '</div><i class="jw-hr r1"></i><i class="jw-hr r2"></i><div class="jw-ht">' + esc(c.t) + "</div>" + kw.map((w, i) => '<span class="jw-hc" style="left:' + CP[i][0] + "%;top:" + CP[i][1] + '%">' + esc(w) + "</span>").join("") + '<div class="jw-hf">' + esc(l.sector) + " " + esc(kk) + "</div></div>";
    $("jwW").innerHTML = '<div class="jw-wp" data-id="' + id + '"><div class="jw-wi"><div class="jw-wk">' + esc(kk) + "</div><h3>" + esc(c.t) + '</h3><div class="jw-row"><b>' + l.overview + "</b><p>" + esc(desc) + "</p></div>" + (kw.length ? '<div class="jw-row"><b>' + l.includes + '</b><div class="jw-tags">' + kw.map(w => "<span>" + esc(w) + "</span>").join("") + "</div></div>" : "") + '<div class="jw-row"><b>' + l.section + "</b><p>" + esc(kk) + '</p></div><div class="jw-wb"><button class="jw-btn" type="button" data-jsite="' + id + '">' + l.open + "</button>" + (c.href ? '<a class="jw-btn alt" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + l.visit + "</a>" : "") + '</div></div><div class="jw-wm">' + (c.img ? '<img src="' + esc(c.img) + '" alt="">' : holo) + "</div></div>";
    jw.classList.add("win"); mark(); $("jwX").focus({ preventScroll: true });
  }
  const closeWin = () => { jw.classList.remove("win"); mark(); };
  function onClick(e) {
    const t = e.target, jc = t.closest(".jc"), g = t.closest("[data-jgo]"), m = t.closest("[data-jmore]"), s = t.closest("[data-jsite]");
    if (t.closest("#jwX")) return jw.classList.contains("win") ? closeWin() : exit();
    if (s) return exit(s.dataset.jsite);
    if (jc) { const o = els.find(x => x.n === jc), c = cards[o.id][o.k]; return c.go ? goId(c.go) : openWin(o.id, o.k, jc); }
    if (g) return goId(g.dataset.jgo);
    if (m) return pan(!$("jwPan").classList.contains("is-open"));
    if (t.id === "jwW") return closeWin();
    if (!t.closest(".jw-nav")) pan(false);
  }

  /* open / exit */
  function startId() { const a = D.querySelector("#nav a.is-active"), id = a ? a.getAttribute("href").slice(1) : "home"; return ORDER.includes(id) ? id : "home"; }
  const inertAll = v => { if (v) [...D.body.children].forEach(e => { if (e !== jw && !e.inert) { e.inert = true; inerted.push(e); } }); else { inerted.forEach(e => e.inert = false); inerted = []; } };
  function size() { pcache = {}; const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H2 = innerHeight; fx.width = W * d; fx.height = H2 * d; g = fx.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); roomSize(); }
  function open() {
    if (live) return; if (!jw) build();
    fx = $("jwfx"); size(); roomInit(); render();
    const r = btn.getBoundingClientRect(); jw.style.setProperty("--bx", r.left + r.width / 2 + "px"); jw.style.setProperty("--by", r.top + r.height / 2 + "px");
    lastFocus = D.activeElement; y0 = scrollY; H.classList.add("jw-lock"); window.__lenis && __lenis.stop && __lenis.stop(); inertAll(true);
    jw.classList.remove("win"); cur = startId(); P = tgt = ST[cur].wi; fly = null; mark(); initPT(); morph(cur);
    live = true; jw.classList.add("on"); cancelAnimationFrame(raf); lastT = 0; raf = requestAnimationFrame(frame); $("jwX").focus({ preventScroll: true });
  }
  function exit(target) {
    if (!live) return; live = false; stopAt = performance.now() + 1000; jw.classList.remove("on", "win"); H.classList.remove("jw-lock"); inertAll(false);
    window.__lenis && __lenis.start && __lenis.start();
    const a = target && D.querySelector('#nav a[href="#' + target + '"]');
    if (a) a.click(); else scrollTo(0, y0);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  btn.addEventListener("pointerenter", () => roomLoad(), { once: true }); btn.addEventListener("focus", () => roomLoad(), { once: true });
  btn.addEventListener("click", open);
  D.addEventListener("keydown", e => {
    if (!live) return;
    if (e.key === "Escape") { e.preventDefault(); jw.classList.contains("win") ? closeWin() : $("jwPan").classList.contains("is-open") ? pan(false) : exit(); return; }
    if (jw.classList.contains("win")) return;
    const rtl = H.dir === "rtl", k = e.key;
    if (k === "ArrowDown" || k === "PageDown" || k === (rtl ? "ArrowLeft" : "ArrowRight")) { e.preventDefault(); step(1); }
    else if (k === "ArrowUp" || k === "PageUp" || k === (rtl ? "ArrowRight" : "ArrowLeft")) { e.preventDefault(); step(-1); }
    else if (k === "Home") flyTo(0); else if (k === "End") flyTo(WPS.length - 1);
  });
  addEventListener("resize", () => { if (live) { size(); render(); } });
})();
