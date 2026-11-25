/* JOURNEY MODE v7: THE STUDIO + STUDIO LIGHTING (day / sunset / rain / night, rain drops, sun rays, lightning, storm sound). A glossy purple-white studio in five rooms (ceiling, desk, windows, wall screen, floor).
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
  const ROOMS = ["intro", "ceiling", "desk", "windows", "screen", "floor"], IA = 1672 / 941, F0 = .5;
  /* flight order: [section, room, focus x, focus y, zoom] */
  const FL = [["home", 0, .5, .5, 1.04], ["creation", 1, .52, .5, 1.45], ["services", 2, .5, .58, 1.15], ["work", 2, .5, .46, 1.4], ["about", 3, .42, .52, 1.15], ["findme", 3, .72, .42, 1.5], ["cinema", 4, .58, .46, 1.25], ["beforeafter", 4, .42, .7, 1.5], ["process", 5, .45, .6, 1.15], ["brief", 5, .36, .55, 1.6], ["contact", 5, .5, .76, 1.75]];
  const FID = FL.map(f => f[0]);
  const SEC_ICO = { home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>', about: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>', services: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>', work: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>', cinema: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M7 6L5 3M12 6l-2-3M17 6l-2-3"/>', creation: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>', beforeafter: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16M7 10l-2 2 2 2M17 10l2 2-2 2"/>', process: '<circle cx="5" cy="18" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="19" cy="15" r="2"/><path d="M6.4 16.4l4.3-7.3M13.7 8.3l4.2 5.2"/>', findme: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', brief: '<path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"/>', contact: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>' };
  const AN = [
    [[.34, .66], [.2, .56], [.34, .34], [.78, .4]],
    [[.5, .26], [.2, .33], [.82, .3], [.52, .62], [.18, .84], [.55, .88], [.85, .84], [.5, .46]],
    [[.5, .43], [.34, .45], [.66, .45], [.19, .66], [.82, .66], [.5, .72], [.27, .2], [.72, .2], [.06, .42], [.95, .4], [.24, .5]],
    [[.27, .32], [.6, .38], [.88, .5], [.22, .66], [.42, .64], [.8, .72], [.05, .4], [.95, .55], [.68, .22]],
    [[.58, .45], [.3, .36], [.9, .3], [.25, .66], [.1, .56], [.95, .56], [.65, .8], [.05, .28]],
    [[.2, .52], [.36, .56], [.76, .42], [.45, .74], [.76, .74], [.2, .76], [.62, .4], [.1, .35]]];
  const AI = { home: [3, 0], creation: [1, 2, 3, 7], services: [3, 4, 5, 6, 7, 10], work: [1, 0, 2, 10, 3, 4], about: [0, 1, 4], findme: [1, 2, 5, 7, 8], cinema: [0], beforeafter: [3, 6], process: [0, 1, 2, 3, 4, 5], brief: [0, 1, 3, 5, 6, 7], contact: [3] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let LT = false, LR = 0;   /* lighting mode: everything but the room and the lighting panel is hidden */
  const S = i => LT ? { room: LR, fx: .5, fy: .5, Z: 1 } : ({ room: FL[i][1], fx: FL[i][2], fy: FL[i][3], Z: FL[i][4] });

  /* ---------- DOM ---------- */
  let jw, $, live = false, lastFocus = null, y0 = 0, inerted = [], cards = {}, ST = {}, cur = "home", idx = 0, W = 1, H2 = 1;
  let cv, gl, loc = {}, ln, lg, fbc, fbg, tr = null, vis = null, MK = [], mx = 0, my = 0, smx = 0, smy = 0, SHx = 0, SHy = 0, raf = 0, stopAt = 0, lastT = 0, ht = 0, wacc = 0, wt = 0;
  const room = [];
  function build() {
    jw = D.createElement("div"); jw.id = "jw"; jw.setAttribute("role", "dialog"); jw.setAttribute("aria-modal", "true"); jw.setAttribute("aria-label", "Journey");
    jw.innerHTML = '<canvas id="jwgl" aria-hidden="true"></canvas><canvas id="jwln" aria-hidden="true"></canvas><div class="jw-vig" aria-hidden="true"></div><div class="jw-load" id="jwLd"></div>' +
      '<div id="jwM" class="jw-m"></div><div class="jw-t" id="jwT"></div>' +
      '<header class="jw-nav"><div class="jw-in" id="jwIn"></div><div class="jw-pan" id="jwPan"><div class="jw-pin" id="jwPin"></div></div></header>' +
      '<button class="jw-x" id="jwX" type="button"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button><div class="jw-dots" id="jwD"></div><div class="jw-hint" id="jwH"></div><div class="jw-win" id="jwW"></div>' +
      '<div class="jw-rd" id="jwRd" role="group">' + ROOMS.map((_, i) => '<button class="jw-rdd" type="button" data-rd="' + i + '"></button>').join("") + '</div>' +
      '<div class="jw-tl"><button class="jw-ltb" id="jwLt" type="button" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z"/></svg><span id="jwLtT"></span></button><button class="jw-sb" id="jwSnd" type="button" aria-pressed="false"><svg class="off" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zM17 9l4 6M21 9l-4 6"/></svg><svg class="on" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg></button></div>' +
      '<div class="jw-lp" id="jwLp" role="group"><div class="jw-lph"><h3 id="jwLpT"></h3></div><div class="jw-cards">' + MOODS.map(k => '<button class="jw-card" type="button" data-fx="' + k + '" aria-pressed="false"><svg viewBox="0 0 24 24">' + FXI[k] + "</svg><span><b></b><small></small></span></button>").join("") + '</div><label class="jw-br"><span id="jwBrL"></span><input type="range" id="jwBr" min="70" max="130" value="100"></label></div>';
    D.body.appendChild(jw); $ = id => D.getElementById(id);
    cv = $("jwgl"); ln = $("jwln"); lg = ln.getContext("2d");
    jw.addEventListener("click", onClick);
    jw.addEventListener("click", e => { const b = e.target.closest("[data-fx]"); if (b) { setMood(b.dataset.fx); if (want === "rain" && LT && !sOn && !sMuted) soundOn(true); } else if (e.target.closest("#jwSnd")) { soundOn(!sOn); sMuted = !sOn; } else if (e.target.closest("#jwLt")) toggleLT(!LT); else if (e.target.closest("[data-rd]")) ltGo(+e.target.closest("[data-rd]").dataset.rd); });
    $("jwBr").addEventListener("input", e => { bright = e.target.value / 100; });
    jw.addEventListener("pointermove", e => { const el = e.target.closest && e.target.closest(".jw-lp,.jw-card,.jw-ltb"); if (el) { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", e.clientX - r.left + "px"); el.style.setProperty("--my", e.clientY - r.top + "px"); } });
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
    $("jwD").innerHTML = FID.map(id => '<button class="jw-dot" type="button" data-jgo="' + id + '" aria-label="' + esc(lab(id)) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + (SEC_ICO[id] || SEC_ICO.home) + "</svg><span>" + esc(lab(id)) + "</span></button>").join("");
    $("jwH").textContent = l.hint; $("jwX").setAttribute("aria-label", l.exit); fxLabels();
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
    pp = prog(VS, FXF, "p"); if (pp) [ "uS", "uD", "uB", "uRes", "uSun", "uSunC", "uTime", "uRain", "uSunS", "uFlash", "uBolt", "uExp", "uR", "uDr", "uDa", "uAt", "uRT" ].forEach(n => lp_[n] = gl.getUniformLocation(pp, n));
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
      try { if (initGL()) { fS = fD = null; bTex = null; dTex = null; dLoad = false; room.forEach(m => { if (m && m.ready && m.ai) { m.ti = mkTex(m.ai); m.td = mkTex(m.bi); } if (m && m.mi) { m.tm = {}; for (const k in m.mi) m.tm[k] = mkTex(m.mi[k]); } if (m && m.si) m.tsky = mkTex(m.si); }); } } catch (e) { /* keeps the loading state */ }
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
  function pass(r, Z, fx, fy, A, tx) {
    const m = room[r]; if (!m || !m.ready || !rdy(r)) return false; const C = cover(), TI = tx || m.ti;
    if (gl) {
      gl.useProgram(pf); gl.bindBuffer(gl.ARRAY_BUFFER, qbuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TI); gl.uniform1i(lf.im, 0);
      gl.uniform2f(lf.C, C[0], C[1]); gl.uniform2f(lf.F, fx, fy); gl.uniform1f(lf.Z, Z); gl.uniform1f(lf.A, A); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (meshOK && m.td) {
        gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.useProgram(pm);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TI); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, m.td); gl.uniform1i(lm.im, 0); gl.uniform1i(lm.dp, 1);
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

  /* ---------- STUDIO LIGHTING: moods (day / sunset / rain / night), rain on the glass, sun rays, lightning, storm sound ---------- */
  /* The scene is drawn into a texture, then one extra pass adds: refracting rain drops, light shafts from the windows, flashes and bolts.
     A second texture holds the depth map seen through the same camera, so shafts and bolts only ever appear through window glass. */
  const MOODS = ["day", "sunset", "rain", "night"];
  const FXP = { day: { rain: 0, sun: .4, col: [1, .94, .78], p: "s" }, sunset: { rain: 0, sun: 1, col: [1, .62, .3], p: "s" }, rain: { rain: 1, sun: 0, col: [.7, .8, 1], p: "s" }, night: { rain: 0, sun: .45, col: [.62, .74, 1], p: "m" } };
  /* sun and moon position inside each photo (pixels of the 1672 x 941 image) */
  const SPOS = { intro: { s: [224, 420], m: [315, 255] }, desk: { s: [1195, 325], m: [1355, 128] }, windows: { s: [390, 438], m: [365, 128] }, screen: { s: [25, 440], m: [75, 205] }, floor: { s: [690, 285], m: [355, 110] }, ceiling: { s: [903, 912], m: [228, 666] } };
  const SND_EV = [19.5, 34.2, 80.4, 87.9, 96.8, 122.1, 140.45, 161.9, 173.4, 190.35];   /* seconds of the thunder cracks inside rain-storm-loop.mp3 */
  const FXL = { en: { t: "Studio lighting", day: "Day", dayS: "Clear sky", sunset: "Sunset", sunsetS: "Low amber light", rain: "Rain", rainS: "Storm on glass", night: "Night", nightS: "Moon over the city", br: "Brightness", snd: "Storm sound", rooms: ["Studio", "Ceiling", "Desk", "Windows", "Screen", "Floor"] }, ar: { t: "إضاءة الاستوديو", day: "نهار", dayS: "سماء صافية", sunset: "غروب", sunsetS: "ضوء كهرماني هادئ", rain: "مطر", rainS: "عاصفة على الزجاج", night: "ليل", nightS: "قمر فوق المدينة", br: "السطوع", snd: "صوت العاصفة", rooms: ["الاستوديو", "السقف", "المكتب", "الشبابيك", "الشاشة", "الأرضية"] } };
  const FXI = { day: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', sunset: '<path d="M7 17a5 5 0 0110 0M12 6v3M4.5 10.5l1.8 1.8M19.5 10.5l-1.8 1.8M2 17h20M6 21h12"/>', rain: '<path d="M7 15a4.5 4.5 0 01-.5-9 6 6 0 0111.4 1.5A3.8 3.8 0 0117 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3"/>', night: '<path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/>' };
  const FXF = `precision highp float;varying vec2 s;uniform sampler2D uS,uD,uB,uR;uniform vec4 uDr[14],uDa[14];uniform vec2 uAt;uniform float uRT;uniform vec2 uRes,uSun;uniform vec3 uSunC;uniform float uTime,uRain,uSunS,uFlash,uBolt,uExp;
vec3 h31(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.103,.0973));q+=dot(q,q.yxz+33.33);return fract((q.xxy+q.yzz)*q.zyx);}
vec4 SC(vec2 u){return texture2D(uS,vec2(u.x,1.-u.y));}
float DP(vec2 u){return texture2D(uD,vec2(u.x,1.-u.y)).r;}
/* a water drop is a tiny lens: the picture inside it is flipped and magnified, with a sharp highlight, a bright caustic on the low edge and a dark rim */
vec4 lens(vec2 n,float m,float r,float sc){float nl=length(n);vec2 off=-n*m*r/sc*(.9+.9*nl*nl);
 vec3 N=normalize(vec3(n*.9,sqrt(max(0.,1.-min(nl*nl,1.)))+.15));vec3 H=normalize(normalize(vec3(-.45,-.6,.65))+vec3(0.,0.,1.));
 float spec=pow(max(dot(N,H),0.),38.)*m;float caust=smoothstep(.45,.95,nl)*max(0.,dot(normalize(n+vec2(1e-4)),vec2(.45,.9)))*m;
 return vec4(off,spec+caust*.5,smoothstep(.7,1.,nl)*m);}
/* real water streaks (shapes cut from a photo of drops): each is a sprite; its edges bend the picture behind it like a lens, its highlights catch the light */
vec4 streaks(vec2 ua,float ra){vec2 off=vec2(0.);float spec=0.,rim=0.;
 for(int i=0;i<14;i++){vec4 P=uDr[i];if(P.w<.01)continue;vec4 R=uDa[i];float asp=R.z*uAt.x/(R.w*uAt.y),hh=abs(P.z)*.5,hw=hh*asp;float fl=P.z<0.?-1.:1.;
  vec2 d=ua-vec2(P.x*ra,P.y);vec2 l=vec2(d.x/hw*fl,d.y/hh);if(abs(l.x)>1.||abs(l.y)>1.)continue;
  vec2 q=R.xy+(l*.5+.5)*R.zw,e=vec2(2.)/uAt;vec4 t=texture2D(uR,q);float ax=texture2D(uR,q+vec2(e.x,0.)).a-texture2D(uR,q-vec2(e.x,0.)).a,ay=texture2D(uR,q+vec2(0.,e.y)).a-texture2D(uR,q-vec2(0.,e.y)).a;
  float lum=dot(t.rgb,vec3(.3,.59,.11));off+=-vec2(ax*fl,ay)*abs(P.z)*.1*P.w;spec+=smoothstep(.74,.98,lum)*t.a*1.5*P.w;rim+=(t.a*.2+(abs(ax)+abs(ay))*.6)*P.w;}
 return vec4(off.x*ra,off.y,spec,rim);}
/* drops that stick and just sit there, slowly breathing */
vec4 stuck(vec2 u,float sc,float seed,out float clr){vec2 g=u*sc,id=floor(g),f=fract(g);vec3 h=h31(id+seed);float life=.55+.45*sin(uTime*.1+h.x*6.28);
 vec2 c=.2+.6*h.yz;float r=.06+.12*h.x*h.x;float on=step(.62,fract(h.x*7.13+h.y*3.7))*smoothstep(0.,5.,uRT-h.y*26.);float m=smoothstep(r,r*.8,length(f-c))*on*life;clr=m;return lens((f-c)/r,m,r,sc);}
vec3 rays(vec2 c,vec2 sp){vec2 dir=sp-c;float ang=atan(dir.y,dir.x);vec3 acc=vec3(0.);
 for(int i=0;i<24;i++){float t=float(i)/24.;vec2 q=c+dir*t*.92;float on=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);q=clamp(q,.002,.998);vec3 sc=SC(q).rgb;float l=dot(sc,vec3(.3,.59,.11));float far=smoothstep(.35,.65,DP(q));acc+=smoothstep(.5,.9,l)*far*(1.-t)*sc*on;}
 return acc/24.*(.7+.3*sin(ang*26.+uTime*.2)*sin(ang*11.-uTime*.13));}
float dust(vec2 u){vec2 g=u*vec2(15.,9.)+vec2(uTime*.012,uTime*.02);vec2 id=floor(g),f=fract(g);vec3 h=h31(id+4.);vec2 c=.2+.6*h.xy+.08*sin(uTime*.5+h.xy*6.28);return smoothstep(.07,0.,length(f-c))*step(.6,h.z)*(.5+.5*sin(uTime*1.3+h.x*20.));}
void main(){float ra=uRes.x/uRes.y;vec2 u=s,ua=vec2(u.x*ra,u.y);float c4,c5;
 vec4 w=streaks(ua,ra)+stuck(ua,20.,11.,c4)+stuck(ua,42.,5.,c5);
 vec2 off=w.xy*uRain;off.x/=ra;float spec=w.z*uRain,rim=w.w*uRain;
 vec2 p=u+off;vec3 col=SC(p).rgb;
 float far=smoothstep(.35,.65,DP(p));
 if(uSunS>.01){vec3 r=rays(p,uSun)*uSunC*uSunS*1.5;float fall=smoothstep(1.4,0.,length(u-uSun));col+=r*(.55+fall)+dust(ua)*uSunS*fall*uSunC*.7;}
 col+=spec*vec3(.95,.97,1.)*1.1;col*=1.-rim*.4;
 col+=vec3(.8,.88,1.)*texture2D(uB,p).r*uBolt*far*1.7;
 col=col*(1.+uFlash*(.2+.8*far))+vec3(.04,.05,.09)*uFlash*(1.-far)+vec3(.14,.17,.32)*uFlash*far;
 gl_FragColor=vec4(col*uExp,1.);}`;
  let pp, lp_ = {}, fS, fD, fW = 0, fH = 0, bTex, bCv, bX, bPend = false, bBuf = null;
  let mood = "day", want = "day", MF = { from: "day", to: "day", t: 1 }, Fx = { rain: 0, sun: 0, col: [1, 1, 1], pos: [.5, .5] }, fxT = 0;
  let AC, comp, bedG, bedSrc, bedBuf, bedStart = 0, thBufs = [], sLoad = null, sOn = false, lastClip = -1, lastPos = -1, sMuted = false, nextBolt = 1e12, pulses = [];
  const rdy = r => { const m = room[r]; if (!m || !m.ready) return false; const ok = k => k === "day" || !gl || !!(m.tm && m.tm[k]); return ok(MF.to) && (MF.t >= 1 || ok(MF.from)); };
  const moodTex = (r, k) => { const m = room[r]; return !m ? null : k === "day" ? m.ti : (m.tm && m.tm[k]) || null; };
  function loadMood(r, k) {
    const m = room[r]; if (!m || !gl || k === "day") return; m.tm = m.tm || {}; m.mi = m.mi || {}; m.lp = m.lp || {}; if (m.tm[k] || m.lp[k]) return; m.lp[k] = 1;
    const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { try { if (gl) { m.mi[k] = im; m.tm[k] = mkTex(im); } } catch (e) { m.lp[k] = 0; } }; im.onerror = () => { m.lp[k] = 0; };
    im.src = BASE + ROOMS[r] + "-" + k + ".webp";
  }
  function setMood(k) { want = k; fxUI(); loadMood(FL[idx][1], k); }
  const fxL = () => FXL[H.lang === "ar" ? "ar" : "en"];
  function fxUI() { if (!jw) return; jw.querySelectorAll("[data-fx]").forEach(b => b.setAttribute("aria-pressed", b.dataset.fx === want)); const sb = $("jwSnd"); if (sb) sb.setAttribute("aria-pressed", sOn); const lb = $("jwLt"); if (lb) lb.setAttribute("aria-pressed", LT); jw.classList.toggle("jw-rainy", want === "rain"); }
  function fxLabels() { const l = fxL(); if (!$("jwLp")) return; $("jwLtT").textContent = l.t; $("jwLpT").textContent = l.t; $("jwBrL").textContent = l.br; $("jwSnd").setAttribute("aria-label", l.snd); jw.querySelectorAll("[data-rd]").forEach(b => b.setAttribute("aria-label", l.rooms[+b.dataset.rd])); rdUI(); jw.querySelectorAll("[data-fx]").forEach(b => { b.querySelector("b").textContent = l[b.dataset.fx]; b.querySelector("small").textContent = l[b.dataset.fx + "S"]; }); fxUI(); }
  function mkFBO(w, h) {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; gl.bindFramebuffer(gl.FRAMEBUFFER, null); return ok ? { f, t, rb } : null;
  }
  function ensureFBO() {
    if (fS && fD && fW === cv.width && fH === cv.height) return true;
    [fS, fD].forEach(o => { if (o) { gl.deleteFramebuffer(o.f); gl.deleteTexture(o.t); gl.deleteRenderbuffer(o.rb); } });
    fW = cv.width; fH = cv.height; fS = mkFBO(fW, fH); fD = fS && mkFBO(fW, fH); bBuf = null; if (!fS || !fD) { fS = fD = null; pp = null; return false; } return true;
  }
  /* color passes: during a mood change the old and new photo are cross-faded with exact coverage maths */
  function colorPasses(passes) {
    let ok = false;
    passes.forEach(p => {
      const [r, Z, fx, fy, A] = p, m = room[r], day = m && m.ti;
      if (MF.t < 1) { const e = MF.t * MF.t * (3 - 2 * MF.t); if (pass(r, Z, fx, fy, A * (1 - e) / (1 - A * e), moodTex(r, MF.from) || day)) ok = true; pass(r, Z, fx, fy, A * e, moodTex(r, MF.to) || day); }
      else if (pass(r, Z, fx, fy, A, moodTex(r, MF.to) || day)) ok = true;
    });
    return ok;
  }
  /* lightning: found in the depth picture (window glass only), drawn in screen space, shown through the shader */
  function makeBolt() {
    bPend = false; const w = fW, h = fH; if (!bBuf) bBuf = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, bBuf);
    const st = 12, far = (x, y) => x >= 0 && y >= 0 && x < w && y < h && bBuf[((h - 1 - y) * w + x) * 4] > 128, c = [];
    for (let y = st; y < h; y += st) for (let x = st; x < w; x += st) if (far(x, y)) c.push(x, y);
    if (c.length < 80) return;
    let x, y0, y1, hh = 0, tries = 0;
    while (hh < 70 && tries++ < 8) { const i = (Math.random() * c.length / 2 | 0) * 2; x = c[i]; const y = c[i + 1]; y0 = y; y1 = y; while (far(x, y0 - st)) y0 -= st; while (far(x, y1 + st)) y1 += st; hh = y1 - y0; }
    if (hh < 70) return;
    const ym = (y0 + y1) / 2; let xl = x, xr = x; while (far(xl - st, ym)) xl -= st; while (far(xr + st, ym)) xr += st; const ww = Math.max(60, xr - xl);
    if (!bCv) { bCv = D.createElement("canvas"); bX = bCv.getContext("2d"); }
    bCv.width = w; bCv.height = h; bX.fillStyle = "#000"; bX.fillRect(0, 0, w, h); bX.lineJoin = bX.lineCap = "round"; bX.shadowColor = "#fff";
    const base = Math.max(1.8 * w / W, Math.min(5 * w / W, hh / 85)), line = (pts, wd, al, bl) => { bX.beginPath(); pts.forEach((q, i) => i ? bX.lineTo(q[0], q[1]) : bX.moveTo(q[0], q[1])); bX.shadowBlur = bl; bX.lineWidth = wd; bX.strokeStyle = "rgba(255,255,255," + al + ")"; bX.stroke(); };
    const seg = (a, b, d, o) => { if (d < 2.5) { o.push(b); return; } const m = [(a[0] + b[0]) / 2 + (Math.random() - .5) * d, (a[1] + b[1]) / 2 + (Math.random() - .5) * d * .45]; seg(a, m, d / 2, o); seg(m, b, d / 2, o); };
    const x0 = Math.max(xl + ww * .15, Math.min(xr - ww * .15, x)), s0 = [x0, y0 + hh * .03], e0 = [x0 + (Math.random() - .5) * ww * .35, y0 + hh * (.7 + .25 * Math.random())], pts = [s0];
    seg(s0, e0, hh * .2, pts); line(pts, base * 2.6, .3, base * 6); line(pts, base, 1, base * 2.5);
    for (let k = 0; k < 3; k++) { const a = pts[Math.floor(pts.length * (.12 + .6 * Math.random()))], b = [a[0] + (Math.random() - .5) * ww * .5, a[1] + hh * (.12 + .25 * Math.random())], br = [a]; seg(a, b, hh * .09, br); line(br, base * .55, .8, base * 2.5); }
    if (!bTex) { bTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, bTex); [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v)); }
    gl.bindTexture(gl.TEXTURE_2D, bTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bCv);
  }
  function fire(clip) { const n = performance.now(); pulses.push([n, 1], [n + 110, .7]); if (Math.random() < .5) pulses.push([n + 230, .45]); bPend = true; if (clip) setTimeout(playClip, 150 + Math.random() * 900); }
  /* sound: rain-storm-loop.mp3 is the bed (bolts follow its own thunder); thunder-0..13.mp3 add extra claps */
  const fetchDec = u => fetch(BASE + "audio/" + u).then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => AC.decodeAudioData(b, res, rej)));
  function ensureAC() { if (AC) return AC; AC = new (window.AudioContext || window.webkitAudioContext)(); comp = AC.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 4; comp.connect(AC.destination); return AC; }
  function loadSnd() {
    return sLoad || (sLoad = (async () => {
      ensureAC(); bedBuf = await fetchDec("rain-storm-loop.mp3"); bedG = AC.createGain(); bedG.gain.value = 0; bedG.connect(comp);
      bedSrc = AC.createBufferSource(); bedSrc.buffer = bedBuf; bedSrc.loop = true; bedSrc.connect(bedG); bedStart = AC.currentTime; bedSrc.start();
      thBufs = (await Promise.all(Array.from({ length: 14 }, (_, i) => fetchDec("thunder-" + i + ".mp3").catch(() => null)))).filter(Boolean);
    })().catch(e => { sLoad = null; console.warn("storm sound:", e); }));
  }
  function audioMood() { if (bedG && sOn) bedG.gain.setTargetAtTime(want === "rain" ? .8 : 0, AC.currentTime, want === "rain" ? 1.2 : .5); }
  function soundOn(on) { sOn = on; fxUI(); if (on) { ensureAC().resume(); loadSnd().then(audioMood); } else if (bedG) bedG.gain.setTargetAtTime(0, AC.currentTime, .25); }
  const bedPos = () => (AC.currentTime - bedStart) % bedBuf.duration;
  function playClip() {
    if (!bedG || !sOn || mood !== "rain" || !thBufs.length) return; let i; do { i = Math.random() * thBufs.length | 0; } while (i === lastClip && thBufs.length > 1); lastClip = i;
    const s = AC.createBufferSource(); s.buffer = thBufs[i]; s.playbackRate.value = .95 + Math.random() * .08; const g = AC.createGain(); g.gain.value = .85; s.connect(g); g.connect(comp); s.start();
  }
  const nearEvent = p => SND_EV.some(e => p > e - 3 && p < e + 5.5);
  function bedTick() {
    if (RM || !bedG || !sOn || mood !== "rain") { lastPos = -1; return; } const pos = bedPos();
    if (lastPos >= 0) for (const e of SND_EV) { const t = e - .14; if (lastPos <= pos ? (lastPos < t && t <= pos) : (t > lastPos || t <= pos)) fire(false); } lastPos = pos;
  }
  function randBolt(now) {
    if (RM || mood !== "rain" || now < nextBolt) return;
    if (bedG && sOn) { if (nearEvent(bedPos())) { nextBolt = now + 2500; return; } fire(true); nextBolt = now + 9000 + Math.random() * 8000; } else { fire(false); nextBolt = now + 4000 + Math.random() * 7000; }
  }
  /* water streaks: sprites from a real photo of drops; they appear one by one (never all at once), creep down the glass, then dry */
  const NDR = 14; let dTex = null, dLoad = false, dAt = [1791, 640], dRects = [[0, 0, .12898, 1], [.13233, 0, .19207, 1], [.32775, 0, .09324, 1], [.42434, 0, .18258, 1], [.61027, 0, .16527, 1], [.77889, 0, .21776, 1]], dst = [], rainT = 0, dP = new Float32Array(NDR * 4), dA = new Float32Array(NDR * 4);
  function loadDrops() { if (dTex || dLoad || !gl) return; dLoad = true; const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => { try { if (gl) dTex = mkTex(im); } catch (e) { dLoad = false; } }; im.onerror = () => { dLoad = false; }; im.src = BASE + "rain-drops.webp"; }
  function dropSeed(d, born) { const big = Math.random() < .8; d.r = big ? Math.random() * 5 | 0 : 5; d.sz = big ? .17 + Math.random() * .2 : .22 + Math.random() * .12; d.x = .05 + Math.random() * .9; d.y = -.02 + Math.random() * .5; d.f = Math.random() < .5 ? -1 : 1; d.sp = .004 + Math.random() * .009; d.life = 26 + Math.random() * 22; d.born = born; }
  function dropsStep(dt, raining) {
    if (raining) rainT += dt; else if (Fx.rain < .02 && rainT > 0) { rainT = 0; dst = []; }
    if (!dst.length) for (let i = 0; i < NDR; i++) { const d = {}; dropSeed(d, i * 1.5 + Math.random() * 2); dst.push(d); }
    dst.forEach((d, i) => {
      let a = rainT - d.born; if (a > d.life) { dropSeed(d, rainT + Math.random() * 3); a = rainT - d.born; }
      const al = a < 0 ? 0 : Math.min(1, a / 4) * Math.min(1, (d.life - a) / 4) * Fx.rain, r = dRects[d.r], y = d.y + d.sp * (a + .6 * Math.sin(a * .9 + d.x * 9));
      dP[i * 4] = d.x; dP[i * 4 + 1] = y; dP[i * 4 + 2] = d.sz * d.f; dP[i * 4 + 3] = al; dA[i * 4] = r[0]; dA[i * 4 + 1] = r[1]; dA[i * 4 + 2] = r[2]; dA[i * 4 + 3] = r[3];
    });
  }
  let bright = 1;
  function rdUI() { if (jw) jw.querySelectorAll("[data-rd]").forEach(b => b.setAttribute("aria-current", +b.dataset.rd === LR)); }
  function ltGo(r) {
    if (!LT || tr || r === LR || r < 0 || r >= ROOMS.length) return; const from = vis || S(idx);
    LR = r; loadRoom(r); tr = { from: { room: from.room, Z: from.Z, fx: from.fx, fy: from.fy }, t0: performance.now(), dur: RM ? 1 : 1900 }; rdUI();
  }
  function loadSky(r) {   /* window-glass mask: white = glass. lightning, flashes and light shafts only exist where this is white */
    const m = room[r]; if (!m || !gl || m.sk) return; m.sk = 1; const im = new Image(); im.crossOrigin = "anonymous";
    im.onload = () => { try { if (gl) { m.si = im; m.tsky = mkTex(im); } } catch (e) { m.sk = 0; } }; im.src = BASE + ROOMS[r] + "-sky.webp";
  }
  function toggleLT(on) {
    if (!jw || on === LT) return; const from = vis || S(idx);
    LT = on; if (on) { LR = 0; loadRoom(0); } jw.classList.toggle("jw-lt", on); pan(false); $("jwM").classList.remove("show");
    tr = { from: { room: from.room, Z: from.Z, fx: from.fx, fy: from.fy }, t0: performance.now(), dur: RM ? 1 : (from.room === S(idx).room ? 1100 : 1900) };
    rdUI();
    if (on) { if (!sMuted) soundOn(true); } else { bright = 1; $("jwBr").value = 100; }
    fxUI();
  }
  function fxOpen() { if (sOn && AC) { AC.resume(); audioMood(); } }
  function fxClose() { if (AC && AC.state === "running") { if (bedG) bedG.gain.setTargetAtTime(0, AC.currentTime, .1); setTimeout(() => { if (!live && AC) AC.suspend(); }, 400); } }
  /* one step of the effect state per frame; returns whether the post pass runs */
  function fxStep(t, tg) {
    const dt = Math.min(.05, Math.max(0, (t - fxT) / 1e3)); fxT = t; const k = 1 - Math.exp(-dt * 2.4), kp = 1 - Math.exp(-dt * 6);
    loadSky(tg.room); if (LT) [LR - 1, LR + 1].forEach(r => { if (room[r] && room[r].ready) { loadMood(r, MF.to); loadSky(r); } });
    if (rdy(tg.room)) { loadMood(tg.room, want); if (want !== MF.to && (want === "day" || moodTex(tg.room, want))) { MF = { from: MF.to, to: want, t: 0 }; mood = want; audioMood(); if (want === "rain") nextBolt = t + 2500; } }
    else loadMood(tg.room, MF.to);
    if (MF.t < 1) MF.t = Math.min(1, MF.t + dt / 1.3);
    const f = FXP[MF.to], q = SPOS[ROOMS[tg.room]][f.p], sp = scr(vis || tg, q[0] / 1672, q[1] / 941);
    Fx.rain += (f.rain - Fx.rain) * k; Fx.sun += (f.sun - Fx.sun) * k; for (let i = 0; i < 3; i++) Fx.col[i] += (f.col[i] - Fx.col[i]) * k;
    Fx.pos[0] += (sp[0] / W - Fx.pos[0]) * kp; Fx.pos[1] += (sp[1] / H2 - Fx.pos[1]) * kp;
    if (want === "rain") loadDrops(); dropsStep(dt, MF.to === "rain"); bedTick(); randBolt(t);
    let fl = 0; pulses = pulses.filter(p => t - p[0] < 900); pulses.forEach(p => { if (t >= p[0]) fl += p[1] * Math.exp(-(t - p[0]) / 85); }); return RM ? 0 : fl;
  }
  function drawPost(t, fl, needD) {
    gl.useProgram(pp); gl.bindBuffer(gl.ARRAY_BUFFER, qbuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, fS.t); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, fD.t); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, bTex || fD.t);
    gl.uniform1i(lp_.uS, 0); gl.uniform1i(lp_.uD, 1); gl.uniform1i(lp_.uB, 2); gl.uniform2f(lp_.uRes, cv.width, cv.height); gl.uniform2f(lp_.uSun, Fx.pos[0], Fx.pos[1]); gl.uniform3f(lp_.uSunC, Fx.col[0], Fx.col[1], Fx.col[2]);
    gl.uniform1f(lp_.uTime, t * .001 * (RM ? .25 : 1)); gl.uniform1f(lp_.uRain, Fx.rain); gl.uniform1f(lp_.uSunS, Fx.sun); gl.uniform1f(lp_.uFlash, fl); gl.uniform1f(lp_.uBolt, bTex ? Math.min(1, fl * 1.2) : 0); gl.uniform1f(lp_.uExp, bright); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, dTex || fD.t); gl.uniform1i(lp_.uR, 3); gl.uniform4fv(lp_.uDr, dP); gl.uniform4fv(lp_.uDa, dA); gl.uniform2f(lp_.uAt, dAt[0], dAt[1]); gl.uniform1f(lp_.uRT, rainT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /* ---------- camera ---------- */
  function fly(i) {
    if (LT) return; i = clamp(i, 0, FL.length - 1); if (i === idx && !tr) return;
    const from = vis || S(idx); idx = i; cur = FL[i][0]; loadRoom(FL[i][1]);
    tr = { from: { room: from.room, Z: from.Z, fx: from.fx, fy: from.fy }, t0: performance.now(), dur: RM ? 1 : from.room === FL[i][1] ? 1300 : 1900 };
    $("jwM").classList.remove("show"); const T = $("jwT"); T.classList.add("off"); clearTimeout(ht); ht = setTimeout(() => { setHead(); T.classList.remove("off"); }, RM ? 0 : 420);
    mark(); pan(false);
  }
  const goId = id => { const i = FID.indexOf(id); if (i >= 0) fly(i); };
  const step = d => { if (LT) { if (!tr) ltGo(LR + d); return; } if (!tr) fly(idx + d); };
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function frame(t) {
    if (!live && t > stopAt) { raf = 0; return; }
    if (glLost) { $("jwLd").classList.add("on"); raf = requestAnimationFrame(frame); return; }
    lastT = t; smx += (mx - smx) * .06; smy += (my - smy) * .06;
    SHx = -smx * .06 + Math.sin(t * .00035) * .006; SHy = -smy * .035 + Math.cos(t * .0003) * .004;
    const tg = S(idx); let passes;
    if (tr) {
      if (!rdy(tg.room)) tr.t0 = t;
      const k = clamp((t - tr.t0) / tr.dur, 0, 1), e = ease(k), f = tr.from;
      if (f.room === tg.room) passes = [[tg.room, f.Z + (tg.Z - f.Z) * e, f.fx + (tg.fx - f.fx) * e, f.fy + (tg.fy - f.fy) * e, 1]];
      else passes = [[f.room, f.Z * (1 + e * .7), f.fx, f.fy, 1], [tg.room, tg.Z * (1 + (1 - e) * .45), tg.fx, tg.fy, e]];
      const L_ = passes[passes.length - 1]; vis = { room: L_[0], Z: L_[1], fx: L_[2], fy: L_[3] };
      if (k >= 1) { tr = null; vis = null; buildMarkers(); }
    } else passes = [[tg.room, tg.Z, tg.fx, tg.fy, 1]];
    let ok = false;
    if (gl) {
      const post = !!pp && ensureFBO(), fl = fxStep(t, tg);
      gl.viewport(0, 0, cv.width, cv.height); if (post) gl.bindFramebuffer(gl.FRAMEBUFFER, fS.f);
      gl.clearColor(.04, .03, .08, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      ok = colorPasses(passes);
      if (post) {
        const needD = Fx.sun > .01 || fl > .004 || bPend;
        if (needD) { gl.bindFramebuffer(gl.FRAMEBUFFER, fD.f); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); passes.forEach(p => { const sk = room[p[0]].tsky; if (sk) pass(p[0], p[1], p[2], p[3], p[4], sk); }); if (bPend) makeBolt(); }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); drawPost(t, fl, needD);
      }
    } else { if (fbg) { fbg.fillStyle = "#0a0714"; fbg.fillRect(0, 0, fbc.width, fbc.height); } passes.forEach(p => { if (pass(p[0], p[1], p[2], p[3], p[4])) ok = true; }); }
    const ld = $("jwLd"), rm = room[tg.room]; ld.classList.toggle("on", !ok); ld.classList.toggle("err", !ok && !!(rm && rm.failed));
    drawLines(t, tg);
    raf = requestAnimationFrame(frame);
  }
  /* hologram layer: a ring on the focus point, spokes to every hotspot, and a flowing path through them */
  /* every marker (dot + label) is kept fully on screen, off the side rail, and clear of the title card and the top buttons */
  function markerGeom() {
    const rtl = H.dir === "rtl", obs = [];
    ["jwT", "jwLt", "jwSnd"].forEach(id => { const e = $(id); if (!e || !e.offsetWidth || e.classList.contains("off") || (id === "jwSnd" && !jw.classList.contains("jw-rainy"))) return; const b = e.getBoundingClientRect(); obs.push([b.left - 12, b.top - 12, b.right + 12, b.bottom + 12]); });
    return { rtl, s0: rtl ? -1 : 1, R: 25, lo: 16 + (rtl ? 86 : 0), hi: W - 16 - (rtl ? 0 : 86), t: 72, b: 46, obs };
  }
  function fitMarker(m, p, g) {
    if (m.lw == null) { const sp = m.el.querySelector("span"); m.lw = sp && sp.offsetWidth ? sp.offsetWidth : 0; }
    const R = g.R, ext = m.lw ? 21 + m.lw : R, ex = s => s > 0 ? [-R, ext] : [-ext, R], cx = (x, e) => Math.max(g.lo - e[0], Math.min(g.hi - e[1], x)), cy = y => Math.max(g.t + R, Math.min(H2 - g.b - R, y));
    const cost = s => Math.abs(cx(p[0], ex(s)) - p[0]) + (s === (m.side || g.s0) ? 0 : 14), s = cost(g.s0) <= cost(-g.s0) ? g.s0 : -g.s0, e = ex(s); m.side = s;
    let x = cx(p[0], e), y = cy(p[1]); const hit = (a, b, o) => a + e[1] > o[0] && a + e[0] < o[2] && b + R > o[1] && b - R < o[3];
    if (g.obs.some(o => hit(x, y, o))) {
      let best = null;
      g.obs.forEach(o => [[x, o[1] - R], [x, o[3] + R], [o[0] - e[1], y], [o[2] - e[0], y]].forEach(c => { const a = cx(c[0], e), b = cy(c[1]); if (g.obs.some(q => hit(a, b, q))) return; const dd = Math.hypot(a - x, b - y); if (!best || dd < best[2]) best = [a, b, dd]; }));
      if (best) { x = best[0]; y = best[1]; }
    }
    p[0] = x; p[1] = y; return s !== g.s0;
  }
  function drawLines(t, st) {
    lg.clearRect(0, 0, W, H2); if (tr || !MK.length) return;
    const G = markerGeom(), F = scr(st, st.fx, st.fy), P = MK.map(m => { const p = scr(st, m.u, m.v), fl = fitMarker(m, p, G); m.x = p[0]; m.y = p[1]; m.el.style.transform = "translate(" + p[0].toFixed(1) + "px," + p[1].toFixed(1) + "px) translate(-50%,-50%)"; m.el.classList.toggle("fl", fl); return p; });
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
    const d = Math.min(devicePixelRatio || 1, 1.5), d2 = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H2 = innerHeight; MK.forEach(m => { m.lw = null; });
    cv.width = Math.round(W * d); cv.height = Math.round(H2 * d); ln.width = Math.round(W * d2); ln.height = Math.round(H2 * d2); lg.setTransform(d2, 0, 0, d2, 0, 0);
    if (fbc) { fbc.width = cv.width; fbc.height = cv.height; }
  }
  let glTried = false;
  function open() {
    if (live) return; if (!jw) build();
    size(); if (!glTried) { glTried = true; if (initGL()) bindLoss(cv); else { fbc = D.createElement("canvas"); fbc.id = "jwgl"; cv.replaceWith(fbc); cv = fbc; fbg = fbc.getContext("2d"); size(); } }
    jw.classList.toggle("jw-nofx", !gl || !pp); fxOpen();
    render();
    const r = btn.getBoundingClientRect(); jw.style.setProperty("--bx", r.left + r.width / 2 + "px"); jw.style.setProperty("--by", r.top + r.height / 2 + "px");
    lastFocus = D.activeElement; y0 = scrollY; H.classList.add("jw-lock"); window.__lenis && __lenis.stop && __lenis.stop(); inertAll(true);
    jw.classList.remove("win"); cur = "home"; idx = 0;   /* the studio always opens at Home, wherever you were on the page */ const s = S(idx); loadRoom(s.room); ROOMS.forEach((_, i) => setTimeout(() => loadRoom(i), 500 + i * 350));
    tr = { from: { room: s.room, Z: s.Z * 1.5, fx: s.fx, fy: s.fy }, t0: performance.now(), dur: RM ? 1 : 2000 }; vis = null;
    $("jwM").innerHTML = ""; MK = []; setHead(); mark();
    live = true; jw.classList.add("on"); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); $("jwX").focus({ preventScroll: true });
  }
  function exit(target) {
    if (!live) return; if (LT) toggleLT(false); live = false; fxClose(); stopAt = performance.now() + 1000; jw.classList.remove("on", "win"); H.classList.remove("jw-lock"); inertAll(false);
    window.__lenis && __lenis.start && __lenis.start();
    const a = target && D.querySelector('#nav a[href="#' + target + '"]');
    if (a) a.click(); else { const back = () => { if (window.__lenis && __lenis.scrollTo) __lenis.scrollTo(y0, { immediate: true, force: true }); else scrollTo({ top: y0, left: 0, behavior: "instant" }); }; back(); requestAnimationFrame(back); }   /* closing returns you to exactly where you were */
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  btn.addEventListener("click", open);
  D.addEventListener("keydown", e => {
    if (!live) return;
    if (e.key === "Escape") { e.preventDefault(); if (LT) { toggleLT(false); return; } jw.classList.contains("win") ? closeWin() : $("jwPan").classList.contains("is-open") ? pan(false) : exit(); return; }
    if (jw.classList.contains("win")) return;
    const rtl = H.dir === "rtl", k = e.key;
    if (k === "ArrowDown" || k === "PageDown" || k === (rtl ? "ArrowLeft" : "ArrowRight")) { e.preventDefault(); step(1); }
    else if (k === "ArrowUp" || k === "PageUp" || k === (rtl ? "ArrowRight" : "ArrowLeft")) { e.preventDefault(); step(-1); }
    else if (k === "Home") fly(0); else if (k === "End") fly(FL.length - 1);
  });
  addEventListener("resize", () => { if (live) size(); });
})();
