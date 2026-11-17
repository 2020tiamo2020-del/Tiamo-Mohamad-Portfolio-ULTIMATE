/* JOURNEY MODE: a separate full-screen world built from the site's own sections. The normal page is never changed. */
(() => {
  const btn = document.getElementById("jBtn");
  if (!btn) return;
  const D = document, H = D.documentElement, RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const ORDER = ["home", "about", "services", "work", "cinema", "creation", "beforeafter", "process", "findme", "brief", "contact"];
  const MAIN = ["home", "about", "services", "work", "contact"];
  const U = {
    en: { open: "Open in site", visit: "Visit ↗", exit: "Exit journey", more: "More", hint: "Scroll, swipe or use the arrow keys  ·  Esc to exit", close: "Close", before: "Before", after: "After", beforeS: "The original shot", afterS: "The final result", explore: "Explore my work", start: "Start a project", cr: ["Fantasy", "Supernatural", "Super Power", "Fashion Style"] },
    ar: { open: "افتح في الموقع", visit: "زيارة ↗", exit: "الخروج من الرحلة", more: "المزيد", hint: "مرّر أو اسحب أو استخدم الأسهم  ·  Esc للخروج", close: "إغلاق", before: "قبل", after: "بعد", beforeS: "الصورة الأصلية", afterS: "النتيجة النهائية", explore: "شاهد أعمالي", start: "ابدأ مشروعك", cr: ["فانتازيا", "خوارق", "قوى خارقة", "أسلوب الأزياء"] }
  };
  const L = () => U[H.lang === "ar" ? "ar" : "en"];
  const T = e => (e && e.textContent || "").replace(/\s+/g, " ").trim();
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const two = n => String(n).padStart(2, "0");
  const lab = id => T(D.querySelector('#nav a[href="#' + id + '"]')) || id;
  const src = i => i.getAttribute("src") || i.dataset.src || i.currentSrc || "";
  const heads = (s, sel, n) => { const seen = new Set(), o = []; s.querySelectorAll(sel).forEach(h => { const t = T(h); if (t && t.length < 60 && !seen.has(t) && o.length < n) { seen.add(t); const nx = h.nextElementSibling; o.push({ t, s: nx ? T(nx).slice(0, 90) : "" }); } }); return o; };

  /* what each scene shows, read live from the real section (so language and edits follow the site) */
  function info(id) {
    const s = D.getElementById(id), l = L();
    if (!s) return { t: lab(id), p: "", c: [] };
    const h = id === "home" ? s.querySelector("h1") : s.querySelector("h1,h2");
    const p = [...s.querySelectorAll("p")].map(T).find(x => x.length > 24) || "";
    const imgs = [...s.querySelectorAll("img")].filter(i => src(i));
    let c = [];
    if (id === "home") c = [{ t: l.explore, go: "work" }, { t: l.start, go: "brief" }];
    else if (id === "about") c = imgs.slice(0, 2).map((i, k) => ({ t: k ? (i.alt || "Tiamo Mohamad") : (T(s.querySelector("h3")) || i.alt), img: src(i) }));
    else if (id === "services") c = heads(s, "h3", 6);
    else if (id === "work") { const st = Math.max(1, Math.floor(imgs.length / 6)); c = imgs.filter((_, k) => k % st === 0).slice(0, 6).map(i => ({ t: i.alt || "Work", img: src(i) })); }
    else if (id === "cinema") c = [{ t: T(h) || lab(id) }];
    else if (id === "creation") c = l.cr.map(t => ({ t }));
    else if (id === "beforeafter") c = [{ t: l.before, s: l.beforeS }, { t: l.after, s: l.afterS }];
    else if (id === "process" || id === "brief") c = heads(s, "h3", 6).map((x, k) => ({ t: x.t, s: two(k + 1) }));
    else if (id === "findme") { const seen = new Set(); c = [...s.querySelectorAll("a[href^=http]")].filter(a => !seen.has(a.href) && seen.add(a.href)).slice(0, 5).map(a => ({ t: T(a).slice(0, 34) || a.hostname, href: a.href, img: a.querySelector("img") ? src(a.querySelector("img")) : "" })); }
    else if (id === "contact") { const a = s.querySelector("a[href^=http]"); c = a ? [{ t: "WhatsApp", s: T(a).replace(/whatsapp/i, "").trim(), href: a.href }] : []; }
    return { t: T(h) || lab(id), p, c };
  }

  /* DOM */
  let jw, $, cur = "home", busy = false, live = false, lastFocus = null, y0 = 0, inerted = [], cards = {};
  function build() {
    jw = D.createElement("div"); jw.id = "jw"; jw.setAttribute("role", "dialog"); jw.setAttribute("aria-modal", "true"); jw.setAttribute("aria-label", "Journey");
    jw.innerHTML = '<canvas id="jwfx" aria-hidden="true"></canvas><div class="jw-grid" aria-hidden="true"></div>' +
      '<svg class="jw-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="46 12 4 12"/><circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="110 70"/></svg>' +
      '<div id="jwS"></div><header class="jw-nav"><div class="jw-in" id="jwIn"></div><div class="jw-pan" id="jwPan"><div class="jw-pin" id="jwPin"></div></div></header>' +
      '<button class="jw-x" id="jwX" type="button"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button><div class="jw-dots" id="jwD"></div><div class="jw-hint" id="jwH"></div><div class="jw-win" id="jwW"></div>';
    D.body.appendChild(jw); $ = id => D.getElementById(id);
    jw.addEventListener("click", onClick);
    jw.addEventListener("wheel", e => { e.stopPropagation(); if (!jw.classList.contains("win") && !busy && Math.abs(e.deltaY) > 18) step(e.deltaY > 0 ? 1 : -1); }, { passive: true });
    let tx = 0, ty = 0; jw.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    jw.addEventListener("touchend", e => { if (jw.classList.contains("win")) return; const dx = tx - e.changedTouches[0].clientX, dy = ty - e.changedTouches[0].clientY, mob = innerWidth < 760, d = mob ? dx : dy; if (Math.abs(d) > 70 && (!mob || Math.abs(dx) > Math.abs(dy))) step((d > 0 ? 1 : -1) * (mob && H.dir === "rtl" ? -1 : 1)); });
    jw.addEventListener("mousemove", e => { if (RM) return; jw.style.setProperty("--mx", e.clientX - innerWidth / 2 + "px"); jw.style.setProperty("--my", e.clientY - innerHeight / 2 + "px"); });
    new MutationObserver(() => { if (live) setTimeout(() => { render(); mark(); }, 80); }).observe(H, { attributes: true, attributeFilter: ["lang", "dir"] });
  }
  function render() {
    const l = L();
    cards = {};
    $("jwS").innerHTML = ORDER.map((id, i) => {
      const d = info(id); cards[id] = d.c; d.id = id;
      const n = d.c.length;
      return '<section class="jw-s" data-id="' + id + '" aria-label="' + esc(d.t) + '"><div class="jw-t"><div class="jw-k">' + two(i + 1) + " / " + ORDER.length + " — " + esc(lab(id)) + "</div><h2>" + esc(d.t) + "</h2><p>" + esc(d.p) + '</p></div><div class="jw-cards">' +
        d.c.map((c, j) => { const a = (j / n) * 6.283 - 1.2, w = n > 4 ? 190 : 230;
          return '<button class="jc" type="button" data-id="' + id + '" data-i="' + j + '" style="--x:' + (70 + Math.cos(a) * 19).toFixed(1) + "%;--y:" + (44 + Math.sin(a) * 27).toFixed(1) + "%;--w:" + w + "px;--d:" + (-j * 1.3) + "s;--z:" + ((j % 3 + 1) * .012) + '"><span class="jc-in">' + (c.img ? '<img src="' + esc(c.img) + '" alt="" loading="lazy">' : "") + "<b>" + esc(c.t) + "</b>" + (c.s ? "<small>" + esc(c.s) + "</small>" : "") + "</span></button>"; }).join("") + "</div></section>";
    }).join("");
    $("jwIn").innerHTML = '<button class="jw-it jw-cur" type="button" data-jmore="1"><span id="jwCur"></span> ▾</button>' + MAIN.map(id => '<button class="jw-it" type="button" data-jgo="' + id + '">' + esc(lab(id)) + "</button>").join("") + '<button class="jw-it" type="button" data-jmore="1" id="jwMore">' + l.more + " ▾</button>";
    $("jwPin").innerHTML = ORDER.map(id => '<button class="jw-it' + (MAIN.includes(id) ? " m-only" : "") + '" type="button" data-jgo="' + id + '">' + esc(lab(id)) + "<small>" + two(ORDER.indexOf(id) + 1) + "</small></button>").join("");
    $("jwD").innerHTML = ORDER.map(id => '<button class="jw-dot" type="button" data-jgo="' + id + '" aria-label="' + esc(lab(id)) + '"></button>').join("");
    $("jwH").textContent = l.hint; $("jwX").setAttribute("aria-label", l.exit);
  }
  function mark() {
    const l = L(), inMore = !MAIN.includes(cur);
    jw.querySelectorAll("[data-jgo]").forEach(b => { const on = b.dataset.jgo === cur; b.classList.toggle("is-on", on); on ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"); });
    $("jwMore").classList.toggle("is-on", inMore); $("jwCur").textContent = lab(cur);
    jw.querySelectorAll(".jw-s").forEach(s => s.classList.toggle("on", s.dataset.id === cur));
    $("jwX").setAttribute("aria-label", jw.classList.contains("win") ? l.close : l.exit);
  }
  const sc = id => jw.querySelector('.jw-s[data-id="' + id + '"]');
  const pan = v => { $("jwPan").classList.toggle("is-open", v); };

  /* travel between scenes */
  function go(id) {
    if (busy || id === cur || !ORDER.includes(id)) { pan(false); return; }
    const f = ORDER.indexOf(id) > ORDER.indexOf(cur); busy = true;
    jw.style.setProperty("--si", f ? .7 : 1.45); jw.style.setProperty("--so", f ? 1.5 : .7);
    const o = sc(cur), n = sc(id); o.classList.add("out"); setTimeout(() => o.classList.remove("out"), 900);
    cur = id; mark(); morph(id); pan(false); setTimeout(() => busy = false, RM ? 50 : 950);
  }
  const step = d => { const i = ORDER.indexOf(cur) + d; if (i >= 0 && i < ORDER.length) go(ORDER[i]); };

  /* project / section window (video 2: the nav gives way to an X, a window opens with details) */
  function openWin(id, c) {
    const l = L(), d = info(id), k = two(ORDER.indexOf(id) + 1) + " / " + ORDER.length + " — " + lab(id);
    $("jwW").innerHTML = '<div class="jw-wp" data-id="' + id + '"><div class="jw-wi"><div class="jw-wk">' + esc(k) + "</div><h3>" + esc(c.t) + "</h3><p>" + esc(c.s || d.p) + '</p><div class="jw-wb"><button class="jw-btn" type="button" data-jsite="' + id + '">' + l.open + "</button>" + (c.href ? '<a class="jw-btn alt" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + l.visit + "</a>" : "") + '</div></div><div class="jw-wm">' + (c.img ? '<img src="' + esc(c.img) + '" alt="">' : '<div class="jw-wf">' + esc(c.t) + "</div>") + "</div></div>";
    jw.classList.add("win"); mark(); $("jwX").focus({ preventScroll: true });
  }
  const closeWin = () => { jw.classList.remove("win"); mark(); };

  function onClick(e) {
    const t = e.target;
    const jc = t.closest(".jc"), g = t.closest("[data-jgo]"), m = t.closest("[data-jmore]"), s = t.closest("[data-jsite]");
    if (t.closest("#jwX")) return jw.classList.contains("win") ? closeWin() : exit();
    if (s) return exit(s.dataset.jsite);
    if (jc) { const c = cards[jc.dataset.id][+jc.dataset.i]; return c.go ? go(c.go) : openWin(jc.dataset.id, c); }
    if (g) return go(g.dataset.jgo);
    if (m) return pan(!$("jwPan").classList.contains("is-open"));
    if (t.id === "jwW") return closeWin();
    if (!t.closest(".jw-nav")) pan(false);
  }

  /* particles: the world's light (formations per scene, time-based so any frame rate looks the same) */
  const COL = ["rgba(150,205,255,.95)", "rgba(185,125,255,.95)", "rgba(22,216,255,.95)"];
  let fx, g, W = 0, H2 = 0, P = [], raf = 0, t0 = 0, lastT = 0, cache = {};
  function size() { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H2 = innerHeight; fx.width = W * d; fx.height = H2 * d; g = fx.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.lineCap = "round"; g.fillStyle = "#05040a"; g.fillRect(0, 0, W, H2); cache = {}; }
  function samp(draw) { const o = D.createElement("canvas"); o.width = W; o.height = H2; const c = o.getContext("2d"); draw(c); const d = c.getImageData(0, 0, W, H2).data, a = []; for (let y = 0; y < H2; y += 3) for (let x = 0; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 128) a.push([x, y]); return a; }
  const word = t => samp(c => { c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; const fs = Math.min(W * .9 / Math.max(t.length * .6, 3), H2 * .34, 300); c.font = "600 " + fs + "px Oswald,Impact,'Arial Narrow',sans-serif"; c.fillText(t, W / 2, H2 * .42); });
  const bust = () => samp(c => { const x = W > 760 ? W * .64 : W * .5, r = Math.min(H2 * .12, W * .2); c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x, H2 * .32, r * .82, r * 1.1, .1, 0, 7); c.fill(); c.fillRect(x - r * .3, H2 * .38, r * .6, H2 * .12); c.beginPath(); c.ellipse(x, H2 * .86, Math.min(W * .3, H2 * .38), H2 * .3, 0, 0, 7); c.fill(); });
  const rects = list => samp(c => { c.strokeStyle = "#fff"; c.lineWidth = 5; list.forEach(r => c.strokeRect(W * r[0], H2 * r[1], W * r[2], H2 * r[3])); });
  const pts = id => cache[id] || (cache[id] = id === "home" ? word("TIAMO") : id === "about" ? bust().concat(rects([[.08, .2, .22, .12], [.11, .36, .22, .12]])) : /^(services|process)$/.test(id) ? rects([[.1, .18, .22, .12], [.14, .34, .22, .12], [.1, .5, .22, .12]]).concat(word(lab(id)).filter((_, i) => i % 3 === 0)) : /^(work|cinema|creation|beforeafter)$/.test(id) ? rects([[.2, .16, .26, .3], [.5, .24, .28, .32], [.36, .56, .17, .2], [.68, .08, .14, .14]]) : word(lab(id)));
  function morph(id) {
    t0 = performance.now(); lastT = 0; P.forEach(p => p.d = Math.random() * 380);
    if (/^(contact|findme|brief)$/.test(id)) { const x = W / 2, gy = H2 * .6; P.forEach((p, i) => { if (i % 3) { p.col = 1; p.tx = x + (Math.random() - .5) * Math.min(70, W * .12) * Math.random(); p.ty = Math.random() * gy; p.v = 1.5 + Math.random() * 3; } else { p.col = 0; const t = Math.pow(Math.random(), 1.5); p.tx = x + (Math.random() - .5) * W * 1.5 * t; p.ty = gy + t * (H2 - gy); } }); return; }
    const a = pts(id).slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    P.forEach((p, i) => { const q = a[i % a.length]; p.tx = q[0] + (Math.random() - .5) * 2; p.ty = q[1] + (Math.random() - .5) * 2; p.col = 0; });
  }
  function loop(t) {
    if (!live && t > stopAt) { raf = 0; return; }
    const dt = Math.min(t - (lastT || t - 16), 200) / 1000; lastT = t; const el = t - t0;
    g.fillStyle = "rgba(5,4,10," + Math.min(.5, .2 * dt * 60) + ")"; g.fillRect(0, 0, W, H2);
    for (const p of P) {
      if (p.col) { p.ty += p.v * dt * 60; if (p.ty > H2 * .6) { p.ty = 0; p.y = 0; } }
      const k = el > p.d ? 1 - Math.exp(-dt * (3 + p.sp * 4)) : 0, ox = p.x, oy = p.y;
      p.x += (p.tx - p.x) * k + Math.sin(t * .0012 + p.ph) * .1; p.y += (p.ty - p.y) * k + Math.cos(t * .001 + p.ph) * .1;
      g.strokeStyle = p.c; g.lineWidth = p.r; g.beginPath(); g.moveTo(ox, oy); g.lineTo(p.x + .01, p.y); g.stroke();
    }
    raf = requestAnimationFrame(loop);
  }
  let stopAt = 0;

  /* open / exit */
  function startId() { const a = D.querySelector("#nav a.is-active"), id = a ? a.getAttribute("href").slice(1) : "home"; return ORDER.includes(id) ? id : "home"; }
  const inertAll = v => { if (v) [...D.body.children].forEach(e => { if (e !== jw && !e.inert) { e.inert = true; inerted.push(e); } }); else { inerted.forEach(e => e.inert = false); inerted = []; } };
  function open() {
    if (live) return; if (!jw) build();
    render(); fx = $("jwfx"); size();
    P = Array.from({ length: W < 760 ? 1000 : 1700 }, (_, i) => ({ x: W / 2, y: H2 * .45, tx: 0, ty: 0, d: 0, sp: Math.random(), ph: Math.random() * 6, r: .7 + Math.random() * 1.1, c: COL[i % 3], col: 0, v: 0 }));
    const r = btn.getBoundingClientRect(); jw.style.setProperty("--bx", r.left + r.width / 2 + "px"); jw.style.setProperty("--by", r.top + r.height / 2 + "px");
    lastFocus = D.activeElement; y0 = scrollY; H.classList.add("jw-lock"); window.__lenis && __lenis.stop && __lenis.stop(); inertAll(true);
    jw.classList.remove("win"); cur = startId(); mark(); morph(cur);
    live = true; jw.classList.add("on"); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); $("jwX").focus({ preventScroll: true });
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
    else if (k === "Home") go(ORDER[0]); else if (k === "End") go(ORDER[ORDER.length - 1]);
  });
  addEventListener("resize", () => { if (live) { size(); morph(cur); } });
})();
