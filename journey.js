/* JOURNEY MODE v3: THE STUDIO. A glossy purple-white studio in five rooms (ceiling, desk, windows, wall screen, floor).
   Each room is a photo + a depth map drawn with WebGL, so the camera can move and zoom through it with real parallax.
   Your 11 sections live inside the rooms as hotspots; the hologram lines, nav, cards and project window sit on top. */
(() => {
  const btn = document.getElementById("jBtn");
  if (!btn) return;
  const D = document, H = D.documentElement, RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const ORDER = ["home", "about", "services", "work", "cinema", "creation", "beforeafter", "process", "findme", "brief", "contact"];
  const MAIN = ["home", "about", "services", "work", "contact"];
  const BASE = ((D.currentScript && D.currentScript.src) || location.href).replace(/[?#].*$/, "").replace(/[^/]*$/, "") + "studio/";
  const U = {
    en: { open: "Open in site", visit: "Visit ↗", exit: "Exit journey", more: "More", hint: "Scroll or arrows to move through the studio  ·  Esc to exit", close: "Close", before: "Before", after: "After", beforeS: "The original shot, untouched.", afterS: "The final result after retouching and compositing.", explore: "Explore my work", start: "Start a project", sector: "Sector", items: "Items", next: "Next", link: "Link", cr: ["Fantasy", "Supernatural", "Super Power", "Fashion Style"], overview: "Overview", includes: "Includes", section: "Section", kw: { about: ["AI", "Photoshop", "Compositing", "Colour", "Motion"], cinema: ["Cinematic", "Atmosphere", "Imagination"], creation: [["Realms", "Creatures", "Epic light"], ["Spirits", "Mystery", "Shadows"], ["Energy", "Heroes", "Impact"], ["Editorial", "Couture", "Glamour"]], beforeafter: [["Original", "Untouched"], ["Retouched", "Composited", "Colour graded"]], contact: ["WhatsApp", "Direct message"] } },
    ar: { open: "افتح في الموقع", visit: "زيارة ↗", exit: "الخروج من الرحلة", more: "المزيد", hint: "مرّر أو استخدم الأسهم للتنقل في الاستوديو  ·  Esc للخروج", close: "إغلاق", before: "قبل", after: "بعد", beforeS: "الصورة الأصلية كما هي.", afterS: "النتيجة النهائية بعد التعديل والدمج.", explore: "شاهد أعمالي", start: "ابدأ مشروعك", sector: "قطاع", items: "عناصر", next: "التالي", link: "رابط", cr: ["فانتازيا", "خوارق", "قوى خارقة", "أسلوب الأزياء"], overview: "نظرة عامة", includes: "يشمل", section: "القسم", kw: { about: ["ذكاء اصطناعي", "فوتوشوب", "دمج صور", "ألوان", "حركة"], cinema: ["سينمائي", "أجواء", "خيال"], creation: [["عوالم", "مخلوقات", "ضوء ملحمي"], ["أرواح", "غموض", "ظلال"], ["طاقة", "أبطال", "تأثير"], ["تحرير أزياء", "أناقة", "جاذبية"]], beforeafter: [["الأصل", "بدون تعديل"], ["تحسين", "دمج", "تدرج ألوان"]], contact: ["واتساب", "رسالة مباشرة"] } }
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

  /* ---------- the studio: rooms, camera stops, hotspot anchors ---------- */
  const ROOMS = ["ceiling", "desk", "windows", "screen", "floor"], IA = 1672 / 941, F0 = .5;
  /* flight order: [section, room, focus x, focus y, zoom] */
  const FL = [["home", 0, .5, .36, 1.2], ["creation", 0, .52, .5, 1.45], ["services", 1, .5, .58, 1.15], ["work", 1, .5, .46, 1.4], ["about", 2, .42, .52, 1.15], ["findme", 2, .72, .42, 1.5], ["cinema", 3, .58, .46, 1.25], ["beforeafter", 3, .42, .7, 1.5], ["process", 4, .45, .6, 1.15], ["brief", 4, .36, .55, 1.6], ["contact", 4, .5, .76, 1.75]];
  const FID = FL.map(f => f[0]);
  const AN = [
    [[.5, .26], [.2, .33], [.82, .3], [.52, .62], [.18, .84], [.55, .88], [.85, .84], [.5, .46]],
    [[.5, .43], [.34, .45], [.66, .45], [.19, .66], [.82, .66], [.5, .72], [.27, .2], [.72, .2], [.06, .42], [.95, .4], [.24, .5]],
    [[.27, .32], [.6, .38], [.88, .5], [.22, .66], [.42, .64], [.8, .72], [.05, .4], [.95, .55], [.68, .22]],
    [[.58, .45], [.3, .36], [.9, .3], [.25, .66], [.1, .56], [.95, .56], [.65, .8], [.05, .28]],
    [[.2, .52], [.36, .56], [.76, .42], [.45, .74], [.76, .74], [.2, .76], [.62, .4], [.1, .35]]];
  const AI = { home: [3, 0], creation: [1, 2, 3, 7], services: [3, 4, 5, 6, 7, 10], work: [1, 0, 2, 10, 3, 4], about: [0, 1, 4], findme: [1, 2, 5, 7, 8], cinema: [0], beforeafter: [3, 6], process: [0, 1, 2, 3, 4, 5], brief: [0, 1, 3, 5, 6, 7], contact: [3] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const S = i => ({ room: FL[i][1], fx: FL[i][2], fy: FL[i][3], Z: FL[i][4] });

  /* ---------- DOM ---------- */
  let jw, $, live = false, lastFocus = null, y0 = 0, inerted = [], cards = {}, ST = {}, cur = "home", idx = 0, W = 1, H2 = 1;
  let cv, gl, loc = {}, ln, lg, fbc, fbg, tr = null, vis = null, MK = [], mx = 0, my = 0, smx = 0, smy = 0, SHx = 0, SHy = 0, raf = 0, stopAt = 0, lastT = 0, ht = 0, wacc = 0, wt = 0;
  const room = [];
  function build() {
    jw = D.createElement("div"); jw.id = "jw"; jw.setAttribute("role", "dialog"); jw.setAttribute("aria-modal", "true"); jw.setAttribute("aria-label", "Journey");
    jw.innerHTML = '<canvas id="jwgl" aria-hidden="true"></canvas><canvas id="jwln" aria-hidden="true"></canvas><div class="jw-vig" aria-hidden="true"></div><div class="jw-load" id="jwLd"></div>' +
      '<div id="jwM" class="jw-m"></div><div class="jw-t" id="jwT"></div>' +
      '<header class="jw-nav"><div class="jw-in" id="jwIn"></div><div class="jw-pan" id="jwPan"><div class="jw-pin" id="jwPin"></div></div></header>' +
      '<button class="jw-x" id="jwX" type="button"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button><div class="jw-dots" id="jwD"></div><div class="jw-hint" id="jwH"></div><div class="jw-win" id="jwW"></div>';
    D.body.appendChild(jw); $ = id => D.getElementById(id);
    cv = $("jwgl"); ln = $("jwln"); lg = ln.getContext("2d");
    jw.addEventListener("click", onClick);
    jw.addEventListener("wheel", e => { e.stopPropagation(); if (jw.classList.contains("win") || tr) return; wacc += e.deltaY; clearTimeout(wt); wt = setTimeout(() => wacc = 0, 220); if (Math.abs(wacc) > 50) { step(wacc > 0 ? 1 : -1); wacc = 0; } }, { passive: true });
    let tx = 0, ty = 0;
    jw.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    jw.addEventListener("touchend", e => { if (jw.classList.contains("win") || tr) return; const dx = tx - e.changedTouches[0].clientX, dy = ty - e.changedTouches[0].clientY, d = Math.abs(dy) >= Math.abs(dx) ? dy : dx; if (Math.abs(d) > 60) step(d > 0 ? 1 : -1); });
    jw.addEventListener("mousemove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    new MutationObserver(() => { if (live) setTimeout(() => { render(); setHead(); buildMarkers(); mark(); }, 80); }).observe(H, { attributes: true, attributeFilter: ["lang", "dir"] });
  }
  function render() {
    const l = L(); cards = {}; ST = {};
    ORDER.forEach(id => { const d = info(id); ST[id] = { d }; cards[id] = d.c; });
    $("jwIn").innerHTML = '<button class="jw-it jw-cur" type="button" data-jmore="1"><span id="jwCur"></span> ▾</button>' + MAIN.map(id => '<button class="jw-it" type="button" data-jgo="' + id + '">' + esc(lab(id)) + "</button>").join("") + '<button class="jw-it" type="button" data-jmore="1" id="jwMore">' + l.more + " ▾</button>";
    $("jwPin").innerHTML = FID.map((id, i) => '<button class="jw-it' + (MAIN.includes(id) ? " m-only" : "") + '" type="button" data-jgo="' + id + '">' + esc(lab(id)) + "<small>" + two(i + 1) + "</small></button>").join("");
    $("jwD").innerHTML = FID.map(id => '<button class="jw-dot" type="button" data-jgo="' + id + '" aria-label="' + esc(lab(id)) + '"></button>').join("");
    $("jwH").textContent = l.hint; $("jwX").setAttribute("aria-label", l.exit);
  }
  function mark() {
    const l = L(), inMore = !MAIN.includes(cur);
    jw.querySelectorAll("[data-jgo]").forEach(b => { const on = b.dataset.jgo === cur; b.classList.toggle("is-on", on); on ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"); });
    $("jwMore").classList.toggle("is-on", inMore); $("jwCur").textContent = lab(cur);
    $("jwX").setAttribute("aria-label", jw.classList.contains("win") ? l.close : l.exit);
  }
  const pan = v => { $("jwPan").classList.toggle("is-open", v); };
  function setHead() {
    const d = ST[cur].d;
    $("jwT").innerHTML = '<div class="jw-k">' + two(idx + 1) + " / " + FL.length + " — " + esc(lab(cur)) + "</div><h2>" + esc(d.t) + "</h2><p>" + esc(d.p) + "</p>";
  }
  function buildMarkers() {
    const box = $("jwM"); box.classList.remove("show"); box.innerHTML = ""; MK = [];
    const a = AN[FL[idx][1]], ids = AI[cur] || [0];
    (cards[cur] || []).forEach((it, k) => {
      const an = a[ids[k % ids.length]], b = D.createElement("button");
      b.type = "button"; b.className = "jm"; b.dataset.id = cur; b.dataset.k = k; b.style.setProperty("--d", k * 80 + "ms");
      b.innerHTML = "<i></i><span>" + esc(it.t) + "</span>"; box.appendChild(b); MK.push({ el: b, u: an[0], v: an[1], x: 0, y: 0 });
    });
    setTimeout(() => box.classList.add("show"), 40);
  }

  /* ---------- WebGL: a photo + its depth map, with a depth-aware zoom and parallax ---------- */
  /* the room is drawn twice: a flat zoomed photo underneath (never tears), and on top a mesh of triangles whose vertices
     are pushed by the depth map (so near things move more than far things and the surface stretches instead of breaking) */
  const VS = "attribute vec2 p;varying vec2 s;void main(){s=p*.5+.5;s.y=1.-s.y;gl_Position=vec4(p,0.,1.);}";
  const FSF = "precision highp float;varying vec2 s;uniform sampler2D im;uniform vec2 C,F;uniform float Z,A;void main(){vec2 p=(s-.5)*C+.5;gl_FragColor=vec4(texture2D(im,clamp(F+(p-F)/Z,0.,1.)).rgb,A);}";
  const VSM = "attribute vec2 a;uniform sampler2D dp;uniform vec2 C,F,SH,PXY;uniform float Z,A,WP;varying vec2 uv;varying float k;void main(){float d=texture2D(dp,a).r;float z=1.+(Z-1.)*(.84+.32*d);vec2 p=F+(a-SH*(d-.5)-F)*z;vec2 s=(p-.5)/C+.5;gl_Position=vec4(s.x*2.-1.,1.-s.y*2.,(1.-d)*.9,1.);uv=a;float g=max(abs(texture2D(dp,a+vec2(PXY.x,0.)).r-texture2D(dp,a-vec2(PXY.x,0.)).r),abs(texture2D(dp,a+vec2(0.,PXY.y)).r-texture2D(dp,a-vec2(0.,PXY.y)).r));float e=g*((Z-1.)*.32*length(a-F)+length(SH))*WP;k=A*(1.-smoothstep(16.,44.,e));}";
  const FSM = "precision highp float;varying vec2 uv;varying float k;uniform sampler2D im;void main(){gl_FragColor=vec4(texture2D(im,uv).rgb,k);}";
  const NX = 320, NY = 180;
  let pf, pm, lf = {}, lm = {}, qbuf, vbuf, ibuf, icount = 0, meshOK = false;
  function initGL() {
    try { gl = cv.getContext("webgl", { alpha: false, depth: true, antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
    if (!gl) return false;
    const prog = (v, f, name) => {
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }, p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, name); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    pf = prog(VS, FSF, "p"); if (!pf) { gl = null; return false; }
    ["im", "C", "F", "Z", "A"].forEach(n => lf[n] = gl.getUniformLocation(pf, n));
    meshOK = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0; pm = meshOK ? prog(VSM, FSM, "a") : null; meshOK = !!pm;
    qbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    if (meshOK) {
      ["im", "dp", "C", "F", "SH", "PXY", "Z", "A", "WP"].forEach(n => lm[n] = gl.getUniformLocation(pm, n));
      const va = new Float32Array((NX + 1) * (NY + 1) * 2), ia = new Uint16Array(NX * NY * 6); let o = 0, q = 0;
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) { va[o++] = i / NX; va[o++] = j / NY; }
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a0 = j * (NX + 1) + i, b0 = a0 + 1, c0 = a0 + NX + 1, d0 = c0 + 1; ia[q++] = a0; ia[q++] = b0; ia[q++] = c0; ia[q++] = b0; ia[q++] = d0; ia[q++] = c0; }
      vbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbuf); gl.bufferData(gl.ARRAY_BUFFER, va, gl.STATIC_DRAW);
      ibuf = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ia, gl.STATIC_DRAW); icount = ia.length;
    }
    gl.enableVertexAttribArray(0); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthFunc(gl.LEQUAL); return true;
  }
  const mkTex = im => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v)); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); return t; };
  function loadRoom(r, tries) {
    if (room[r]) return; tries = tries || 0;
    const m = room[r] = { ready: false, failed: false, dd: null, tries }, a = new Image(), b = new Image(); let n = 0, dead = false;
    const bad = () => {                                                  // a missing / slow file: try again (3 attempts), then show the retry message
      if (dead) return; dead = true;
      if (tries < 2) setTimeout(() => { if (room[r] === m) { room[r] = null; loadRoom(r, tries + 1); } }, 800 * (tries + 1));
      else m.failed = true;
    };
    const done = () => {
      if (dead || ++n < 2) return;
      try { if (gl) { m.ti = mkTex(a); m.td = mkTex(b); } m.im = a; m.ai = a; m.bi = b; const c = D.createElement("canvas"); c.width = 128; c.height = 72; const x = c.getContext("2d"); x.drawImage(b, 0, 0, 128, 72); const px = x.getImageData(0, 0, 128, 72).data; m.dd = new Uint8Array(128 * 72); for (let i = 0; i < m.dd.length; i++) m.dd[i] = px[i * 4]; } catch (e) { /* depth lookup stays flat */ }
      if (gl && !m.ti) { bad(); return; }
      m.ready = true;
    };
    const q = tries ? "?r=" + tries : "";
    a.crossOrigin = b.crossOrigin = "anonymous"; a.onload = b.onload = done; a.onerror = b.onerror = bad;
    a.src = BASE + ROOMS[r] + ".webp" + q; b.src = BASE + ROOMS[r] + "-depth.webp" + q;
  }
  const retryRoom = r => { room[r] = null; loadRoom(r, 0); };
  /* the GPU can drop the WebGL context (low memory, tab in background): stop drawing, then rebuild programs and textures when it comes back */
  let glLost = false;
  function bindLoss(c) {
    c.addEventListener("webglcontextlost", e => { e.preventDefault(); glLost = true; });
    c.addEventListener("webglcontextrestored", () => {
      try { if (initGL()) room.forEach(m => { if (m && m.ready && m.ai) { m.ti = mkTex(m.ai); m.td = mkTex(m.bi); } }); } catch (e) { /* keeps the loading state */ }
      glLost = false;
    });
  }
  const cover = () => { const sa = W / H2; return sa > IA ? [1, IA / sa] : [sa / IA, 1]; };
  function dsamp(r, u, v) {
    const m = room[r]; if (!m || !m.dd) return F0;
    const x = clamp(u, 0, 1) * 127, y = clamp(v, 0, 1) * 71, x0 = x | 0, y0_ = y | 0, x1 = Math.min(127, x0 + 1), y1 = Math.min(71, y0_ + 1), fx = x - x0, fy = y - y0_, d = m.dd;
    return ((d[y0_ * 128 + x0] * (1 - fx) + d[y0_ * 128 + x1] * fx) * (1 - fy) + (d[y1 * 128 + x0] * (1 - fx) + d[y1 * 128 + x1] * fx) * fy) / 255;
  }
  /* where does a point of the photo land on screen (same maths as the shader, solved by iteration) */
  function scr(st, u, v) {
    const C = cover(), d = dsamp(st.room, u, v), z = 1 + (st.Z - 1) * (.84 + .32 * d);
    const px = st.fx + (u - st.fx - SHx * (d - F0)) * z, py = st.fy + (v - st.fy - SHy * (d - F0)) * z;
    return [((px - .5) / C[0] + .5) * W, ((py - .5) / C[1] + .5) * H2];
  }
  function pass(r, Z, fx, fy, A) {
    const m = room[r]; if (!m || !m.ready) return false; const C = cover();
    if (gl) {
      gl.useProgram(pf); gl.bindBuffer(gl.ARRAY_BUFFER, qbuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, m.ti); gl.uniform1i(lf.im, 0);
      gl.uniform2f(lf.C, C[0], C[1]); gl.uniform2f(lf.F, fx, fy); gl.uniform1f(lf.Z, Z); gl.uniform1f(lf.A, A); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (meshOK && m.td) {
        gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.useProgram(pm);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, m.ti); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, m.td); gl.uniform1i(lm.im, 0); gl.uniform1i(lm.dp, 1);
        gl.uniform2f(lm.C, C[0], C[1]); gl.uniform2f(lm.F, fx, fy); gl.uniform2f(lm.SH, SHx, SHy); gl.uniform2f(lm.PXY, 2 / NX, 2 / NY); gl.uniform1f(lm.Z, Z); gl.uniform1f(lm.A, A); gl.uniform1f(lm.WP, W);
        gl.drawElements(gl.TRIANGLES, icount, gl.UNSIGNED_SHORT, 0); gl.disable(gl.DEPTH_TEST);
      }
    } else if (fbg && m.im) {
      const ze = 1 + (Z - 1) * .98, lo = (c, f) => f + (.5 - c / 2 - f) / ze, hi = (c, f) => f + (.5 + c / 2 - f) / ze, iw = m.im.naturalWidth, ih = m.im.naturalHeight;
      const x0 = lo(C[0], fx), x1 = hi(C[0], fx), y0_ = lo(C[1], fy), y1 = hi(C[1], fy);
      fbg.globalAlpha = A; fbg.drawImage(m.im, x0 * iw, y0_ * ih, (x1 - x0) * iw, (y1 - y0_) * ih, 0, 0, fbc.width, fbc.height); fbg.globalAlpha = 1;
    }
    return true;
  }

  /* ---------- camera ---------- */
  function fly(i) {
    i = clamp(i, 0, FL.length - 1); if (i === idx && !tr) return;
    const from = vis || S(idx); idx = i; cur = FL[i][0]; loadRoom(FL[i][1]);
    tr = { from: { room: from.room, Z: from.Z, fx: from.fx, fy: from.fy }, t0: performance.now(), dur: RM ? 1 : from.room === FL[i][1] ? 1300 : 1900 };
    $("jwM").classList.remove("show"); const T = $("jwT"); T.classList.add("off"); clearTimeout(ht); ht = setTimeout(() => { setHead(); T.classList.remove("off"); }, RM ? 0 : 420);
    mark(); pan(false);
  }
  const goId = id => { const i = FID.indexOf(id); if (i >= 0) fly(i); };
  const step = d => { if (!tr) fly(idx + d); };
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function frame(t) {
    if (!live && t > stopAt) { raf = 0; return; }
    if (glLost) { $("jwLd").classList.add("on"); raf = requestAnimationFrame(frame); return; }
    lastT = t; smx += (mx - smx) * .06; smy += (my - smy) * .06;
    SHx = -smx * .06 + Math.sin(t * .00035) * .006; SHy = -smy * .035 + Math.cos(t * .0003) * .004;
    const tg = S(idx); let passes;
    if (tr) {
      if (!(room[tg.room] && room[tg.room].ready)) tr.t0 = t;
      const k = clamp((t - tr.t0) / tr.dur, 0, 1), e = ease(k), f = tr.from;
      if (f.room === tg.room) passes = [[tg.room, f.Z + (tg.Z - f.Z) * e, f.fx + (tg.fx - f.fx) * e, f.fy + (tg.fy - f.fy) * e, 1]];
      else passes = [[f.room, f.Z * (1 + e * .7), f.fx, f.fy, 1], [tg.room, tg.Z * (1 + (1 - e) * .45), tg.fx, tg.fy, e]];
      const L_ = passes[passes.length - 1]; vis = { room: L_[0], Z: L_[1], fx: L_[2], fy: L_[3] };
      if (k >= 1) { tr = null; vis = null; buildMarkers(); }
    } else passes = [[tg.room, tg.Z, tg.fx, tg.fy, 1]];
    if (gl) { gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(.04, .03, .08, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); } else if (fbg) { fbg.fillStyle = "#0a0714"; fbg.fillRect(0, 0, fbc.width, fbc.height); }
    let ok = false; passes.forEach(p => { if (pass(p[0], p[1], p[2], p[3], p[4])) ok = true; });
    const ld = $("jwLd"), rm = room[tg.room]; ld.classList.toggle("on", !ok); ld.classList.toggle("err", !ok && !!(rm && rm.failed));
    drawLines(t, tg);
    raf = requestAnimationFrame(frame);
  }
  /* hologram layer: a ring on the focus point, spokes to every hotspot, and a flowing path through them */
  function drawLines(t, st) {
    lg.clearRect(0, 0, W, H2); if (tr || !MK.length) return;
    const F = scr(st, st.fx, st.fy), P = MK.map(m => { const p = scr(st, m.u, m.v); m.x = p[0]; m.y = p[1]; m.el.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px) translate(-50%,-50%)"; m.el.classList.toggle("fl", H.dir === "rtl" ? p[0] < 230 : p[0] > W - 230); return p; });
    /* holographic overlay: every stroke is an ink underlay (contrast on the light studio) + coloured neon body + white-hot core */
    const CY = "#18e4ff", VI = "#8b5cff", WH = "#ffffff", INK = "rgba(26,12,120,.38)", k = ln.width / W;
    const neon = (draw, w, col, glow, dash, off) => {
      lg.lineCap = "round"; lg.lineJoin = "round"; lg.setLineDash(dash || []); lg.lineDashOffset = off || 0;
      lg.shadowBlur = 0; lg.strokeStyle = INK; lg.lineWidth = w + 3.2; draw();
      lg.strokeStyle = col; lg.lineWidth = w; lg.shadowColor = glow; lg.shadowBlur = 14 * k; draw(); lg.shadowBlur = 0;
      lg.strokeStyle = WH; lg.lineWidth = Math.max(.8, w * .36); draw(); lg.setLineDash([]);
    };
    const ctl = (p, i) => { const dx = p[0] - F[0], dy = p[1] - F[1], L = Math.hypot(dx, dy) || 1, o = L * .13 * (i % 2 ? 1 : -1) * (1 + .12 * Math.sin(t * .0012 + i)); return [(F[0] + p[0]) / 2 - dy / L * o, (F[1] + p[1]) / 2 + dx / L * o]; };
    const C = P.map(ctl);
    /* energy lines from the focus to every marker */
    P.forEach((p, i) => {
      const g = lg.createLinearGradient(F[0], F[1], p[0], p[1]); g.addColorStop(0, VI); g.addColorStop(1, CY);
      const path = () => { lg.beginPath(); lg.moveTo(F[0], F[1]); lg.quadraticCurveTo(C[i][0], C[i][1], p[0], p[1]); lg.stroke(); };
      neon(path, 2, g, "rgba(24,228,255,.9)");
      lg.setLineDash([2, 16]); lg.lineDashOffset = -t * .04; lg.strokeStyle = WH; lg.lineWidth = 3.4; lg.shadowColor = CY; lg.shadowBlur = 10 * k; path(); lg.shadowBlur = 0; lg.setLineDash([]);
      const u = ((t * .00042 + i * .23) % 1), a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u, px = a * F[0] + b * C[i][0] + c * p[0], py = a * F[1] + b * C[i][1] + c * p[1];
      lg.fillStyle = WH; lg.shadowColor = CY; lg.shadowBlur = 18 * k; lg.beginPath(); lg.arc(px, py, 3.6, 0, 6.283); lg.fill(); lg.shadowBlur = 0;
    });
    /* chain between the markers */
    if (P.length > 1) {
      const g2 = lg.createLinearGradient(P[0][0], P[0][1], P[P.length - 1][0], P[P.length - 1][1]); g2.addColorStop(0, CY); g2.addColorStop(1, VI);
      const chain = () => { lg.beginPath(); lg.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length - 1; i++) lg.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2); lg.lineTo(P[P.length - 1][0], P[P.length - 1][1]); lg.stroke(); };
      neon(chain, 2.2, g2, "rgba(139,92,255,.9)", [14, 9], -t * .05);
    }
    /* the focus: a rotating holographic target */
    lg.save(); lg.translate(F[0], F[1]); const rot = t * .0007;
    neon(() => { lg.beginPath(); for (let n = 0; n < 48; n++) { const a = n / 48 * 6.2832 - rot * .5, l = n % 6 ? 4 : 10; lg.moveTo(Math.cos(a) * 74, Math.sin(a) * 74); lg.lineTo(Math.cos(a) * (74 + l), Math.sin(a) * (74 + l)); } lg.stroke(); }, 1.3, CY, "rgba(24,228,255,.8)");
    neon(() => { lg.beginPath(); for (let n = 0; n < 3; n++) { const a = rot + n * 2.0944; lg.moveTo(Math.cos(a) * 56, Math.sin(a) * 56); lg.arc(0, 0, 56, a, a + 1.2); } lg.stroke(); }, 3, VI, "rgba(139,92,255,.95)");
    neon(() => { lg.beginPath(); lg.arc(0, 0, 38, 0, 6.2832); lg.stroke(); }, 1.6, CY, "rgba(24,228,255,.9)", [3, 7], rot * 120);
    neon(() => { lg.beginPath(); for (let n = 0; n < 2; n++) { const a = -rot * 1.6 + n * 3.1416; lg.moveTo(Math.cos(a) * 26, Math.sin(a) * 26); lg.arc(0, 0, 26, a, a + 1.5); } lg.stroke(); }, 2, WH, "rgba(255,255,255,.9)");
    neon(() => { lg.beginPath(); [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(q => { lg.moveTo(q[0] * 92, q[1] * 76); lg.lineTo(q[0] * 92, q[1] * 92); lg.lineTo(q[0] * 76, q[1] * 92); }); lg.stroke(); }, 1.8, CY, "rgba(24,228,255,.8)");
    const pu = (t % 2400) / 2400; lg.strokeStyle = "rgba(24,228,255," + (.85 * (1 - pu)).toFixed(3) + ")"; lg.lineWidth = 2; lg.shadowColor = CY; lg.shadowBlur = 10 * k; lg.beginPath(); lg.arc(0, 0, 22 + pu * 62, 0, 6.2832); lg.stroke(); lg.shadowBlur = 0;
    neon(() => { lg.beginPath(); lg.moveTo(0, -9); lg.lineTo(9, 0); lg.lineTo(0, 9); lg.lineTo(-9, 0); lg.closePath(); lg.stroke(); }, 2.4, VI, "rgba(139,92,255,1)");
    lg.fillStyle = WH; lg.shadowColor = VI; lg.shadowBlur = 12 * k; lg.beginPath(); lg.arc(0, 0, 2.6, 0, 6.2832); lg.fill(); lg.shadowBlur = 0; lg.restore();
  }

  function onClick(e) {
    const t = e.target, jm = t.closest(".jm"), g = t.closest("[data-jgo]"), m = t.closest("[data-jmore]"), s = t.closest("[data-jsite]");
    if (t.closest(".jw-load.err")) return retryRoom(FL[idx][1]);
    if (t.closest("#jwX")) return jw.classList.contains("win") ? closeWin() : exit();
    if (s) return exit(s.dataset.jsite);
    if (jm) { const c = cards[jm.dataset.id][+jm.dataset.k]; return c.go ? goId(c.go) : openWin(jm.dataset.id, +jm.dataset.k); }
    if (g) return goId(g.dataset.jgo);
    if (m) return pan(!$("jwPan").classList.contains("is-open"));
    if (t.id === "jwW") return closeWin();
    if (!t.closest(".jw-nav")) pan(false);
  }

  /* ---------- open / exit ---------- */
  function startId() { const a = D.querySelector("#nav a.is-active"), id = a ? a.getAttribute("href").slice(1) : "home"; return FID.includes(id) ? id : "home"; }
  const inertAll = v => { if (v) [...D.body.children].forEach(e => { if (e !== jw && !e.inert) { e.inert = true; inerted.push(e); } }); else { inerted.forEach(e => e.inert = false); inerted = []; } };
  function size() {
    const d = Math.min(devicePixelRatio || 1, 1.5), d2 = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H2 = innerHeight;
    cv.width = Math.round(W * d); cv.height = Math.round(H2 * d); ln.width = Math.round(W * d2); ln.height = Math.round(H2 * d2); lg.setTransform(d2, 0, 0, d2, 0, 0);
    if (fbc) { fbc.width = cv.width; fbc.height = cv.height; }
  }
  let glTried = false;
  function open() {
    if (live) return; if (!jw) build();
    size(); if (!glTried) { glTried = true; if (initGL()) bindLoss(cv); else { fbc = D.createElement("canvas"); fbc.id = "jwgl"; cv.replaceWith(fbc); cv = fbc; fbg = fbc.getContext("2d"); size(); } }
    render();
    const r = btn.getBoundingClientRect(); jw.style.setProperty("--bx", r.left + r.width / 2 + "px"); jw.style.setProperty("--by", r.top + r.height / 2 + "px");
    lastFocus = D.activeElement; y0 = scrollY; H.classList.add("jw-lock"); window.__lenis && __lenis.stop && __lenis.stop(); inertAll(true);
    jw.classList.remove("win"); cur = startId(); idx = FID.indexOf(cur); const s = S(idx); loadRoom(s.room); ROOMS.forEach((_, i) => setTimeout(() => loadRoom(i), 500 + i * 350));
    tr = { from: { room: s.room, Z: s.Z * 1.5, fx: s.fx, fy: s.fy }, t0: performance.now(), dur: RM ? 1 : 2000 }; vis = null;
    $("jwM").innerHTML = ""; MK = []; setHead(); mark();
    live = true; jw.classList.add("on"); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); $("jwX").focus({ preventScroll: true });
  }
  function exit(target) {
    if (!live) return; live = false; stopAt = performance.now() + 1000; jw.classList.remove("on", "win"); H.classList.remove("jw-lock"); inertAll(false);
    window.__lenis && __lenis.start && __lenis.start();
    const a = target && D.querySelector('#nav a[href="#' + target + '"]');
    if (a) a.click(); else scrollTo(0, y0);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  btn.addEventListener("click", open);
  D.addEventListener("keydown", e => {
    if (!live) return;
    if (e.key === "Escape") { e.preventDefault(); jw.classList.contains("win") ? closeWin() : $("jwPan").classList.contains("is-open") ? pan(false) : exit(); return; }
    if (jw.classList.contains("win")) return;
    const rtl = H.dir === "rtl", k = e.key;
    if (k === "ArrowDown" || k === "PageDown" || k === (rtl ? "ArrowLeft" : "ArrowRight")) { e.preventDefault(); step(1); }
    else if (k === "ArrowUp" || k === "PageUp" || k === (rtl ? "ArrowRight" : "ArrowLeft")) { e.preventDefault(); step(-1); }
    else if (k === "Home") fly(0); else if (k === "End") fly(FL.length - 1);
  });
  addEventListener("resize", () => { if (live) size(); });
})();
