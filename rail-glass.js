/* LIQUID GLASS RAIL v2 — decorates the existing .st-rail (navigation/scroll-spy/language stay story.js's). */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const ar = () => document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
  const I = {
    home: '<path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5"/>',
    about: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
    services: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
    work: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 9"/>',
    cinema: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
    creation: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    beforeafter: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 5v14"/>',
    process: '<circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/><path d="M7.2 12h2.6M14.2 12h2.6"/>',
    findme: '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="m8.3 10.8 7.4-3.6M8.3 13.2l7.4 3.6"/>',
    brief: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
    contact: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3.5 7 8.5 6 8.5-6"/>'
  };
  const V = '<svg viewBox="0 0 244 124">', E = "</svg>", L = k => '<g class="L" style="--k:' + k + '">';
  const sil = '<circle class="fl" cx="122" cy="48" r="17"/><path class="fl" d="M82 124c0-26 18-38 40-38s40 12 40 38z"/>';
  const S = {
    home: V + L(3) + '<circle class="ln" cx="122" cy="62" r="46"/><circle class="ln sp" cx="122" cy="62" r="34"/></g>' + L(9) + '<circle class="fl" cx="122" cy="62" r="19"/><text x="122" y="67" class="tx">TM</text></g>' + E,
    about: V + L(4) + '<circle class="ln" cx="122" cy="62" r="44"/></g>' + L(8) + '<circle class="fl" cx="122" cy="52" r="15"/><path class="fl" d="M92 98c0-18 13-26 30-26s30 8 30 26z"/></g><g class="orb"><circle class="dot" cx="122" cy="18" r="4"/><circle class="dot c" cx="166" cy="62" r="3"/><circle class="dot" cx="86" cy="86" r="3.5"/></g>' + E,
    services: V + L(3) + '<polygon class="ln" points="122,76 186,98 122,120 58,98"/></g>' + L(7) + '<polygon class="ln" points="122,52 186,74 122,96 58,74"/></g>' + L(12) + '<polygon class="fl" points="122,26 186,48 122,70 58,48"/></g>' + E,
    work: V + L(3) + '<rect class="fl f1" x="94" y="22" width="56" height="82" rx="9"/></g>' + L(6) + '<rect class="fl f2" x="94" y="22" width="56" height="82" rx="9"/></g>' + L(11) + '<rect class="fl" x="94" y="20" width="56" height="82" rx="9"/><circle class="dot" cx="134" cy="38" r="5"/><path class="ln w" d="M102 92l14-18 10 11 8-8 8 15z"/></g>' + E,
    cinema: V + L(5) + '<rect class="ln" x="52" y="22" width="140" height="80" rx="12"/><path class="ln pul" d="M52 34h140M52 90h140"/></g>' + L(11) + '<polygon class="fl" points="112,46 112,78 142,62"/><path class="ln w" d="M180 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>' + E,
    creation: V + L(4) + '<path class="ln pul" d="M60 90L100 40L150 70L190 34M100 40L122 96M150 70L122 96"/></g>' + L(9) + '<circle class="dot" cx="60" cy="90" r="5"/><circle class="dot c" cx="100" cy="40" r="6"/><circle class="dot" cx="150" cy="70" r="5"/><circle class="dot c" cx="190" cy="34" r="5"/><circle class="fl" cx="122" cy="96" r="8"/></g>' + E,
    beforeafter: '<div class="ba"><div class="bl b1">' + V + sil + E + '</div><div class="bl b2">' + V + sil + E + '</div><u></u></div>',
    process: V + L(3) + '<path class="ln" d="M44 62H200"/><path class="ln pf" d="M44 62H200"/></g>' + L(8) + '<circle class="dot" cx="44" cy="62" r="7"/><circle class="dot n2" cx="96" cy="62" r="7"/><circle class="dot n3" cx="148" cy="62" r="7"/><circle class="dot n4" cx="200" cy="62" r="7"/></g>' + E,
    findme: V + L(4) + '<circle class="ln" cx="122" cy="62" r="40"/></g>' + L(9) + '<circle class="fl" cx="122" cy="62" r="12"/></g><g class="orb"><circle class="dot" cx="122" cy="22" r="6"/><circle class="dot c" cx="162" cy="62" r="6"/><circle class="dot" cx="122" cy="102" r="6"/><circle class="dot c" cx="82" cy="62" r="6"/></g>' + E,
    brief: V + L(4) + '<rect class="ln" x="66" y="20" width="112" height="84" rx="12"/><path class="ln" d="M82 44h60M82 60h80M82 76h44"/></g>' + L(10) + '<circle class="fl pulse" cx="170" cy="94" r="14"/><path class="ln w" d="M170 87v14M163 94h14"/></g>' + E,
    contact: V + L(4) + '<circle class="ln pg" cx="122" cy="62" r="20"/><circle class="ln pg p2" cx="122" cy="62" r="20"/></g>' + L(9) + '<rect class="fl" x="92" y="44" width="60" height="38" rx="8"/><path class="ln w" d="M95 48l27 20 27-20"/></g>' + E
  };
  const T = {
    home: ["The full picture, from the top.", "الصورة الكاملة من البداية."],
    about: ["The person behind the work.", "مين وراء الشغل."],
    services: ["Design, video, AI & VFX — what I deliver.", "التصميم والفيديو والـ AI والـ VFX — اللي بقدّمه."],
    work: ["Selected projects, sorted by category.", "مشاريع مختارة مقسّمة حسب النوع."],
    cinema: ["Cinematic worlds beyond imagination.", "عوالم سينمائية ما وراء الخيال."],
    creation: ["AI visuals & experiments.", "صور وتجارب بالذكاء الاصطناعي."],
    beforeafter: ["Move your mouse: raw vs. finished.", "حرّك الماوس: قبل وبعد."],
    process: ["How an idea becomes a final piece.", "إزاي الفكرة بتتحول لشغل نهائي."],
    findme: ["All my channels in one place.", "كل صفحاتي في مكان واحد."],
    brief: ["Tell me about your project.", "احكيلي عن مشروعك."],
    contact: ["Say hello — I reply fast.", "قولّي أهلاً — برد بسرعة."]
  };
  const G = { home: 1, work: 1, process: 1 };
  const svg = d => '<svg class="rg-ic" viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>";
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  let tries = 0;
  const boot = () => {
    const rail = $(".st-rail");
    if (!rail || !rail.querySelector("li a")) { if (tries++ < 100) setTimeout(boot, 150); return; }
    if (!rail.classList.contains("rg")) build(rail);
  };
  const build = rail => {
    rail.classList.add("rg");
    rail.insertAdjacentHTML("afterbegin", '<i class="rg-slab"></i><i class="rg-glass"></i>');
    const ol = $("ol", rail);
    const items = [...ol.children].filter(li => li.querySelector("a")).map((li, i) => {
      const a = $("a", li), id = a.getAttribute("href").slice(1);
      a.insertAdjacentHTML("afterbegin", svg(I[id] || I.home)); a.style.setProperty("--i", i);
      return { li, a, id, k: 0 };
    });
    items.forEach(o => { if (G[o.id]) { const g = document.createElement("li"); g.className = "rg-grp"; g.setAttribute("aria-hidden", "true"); ol.insertBefore(g, o.li); } });
    const pill = document.createElement("i"), act = document.createElement("i");
    pill.className = "rg-pill"; act.className = "rg-act"; ol.append(pill, act);
    const top = el => el.getBoundingClientRect().top - ol.getBoundingClientRect().top;
    const put = (el, a, z) => { el.style.transform = "translateY(" + (a.offsetTop + a.parentNode.offsetTop) + "px) translateZ(" + z + "px)"; el.style.height = a.offsetHeight + "px"; };
    let cur = null;
    const sync = () => {
      const on = items.find(o => o.a.classList.contains("on")); if (!on) return;
      if (on !== cur) { act.classList.remove("mv"); void act.offsetWidth; if (cur) act.classList.add("mv"); }
      cur = on; put(act, on.a, 5); act.classList.toggle("beyond", on.id === "cinema");
    };
    new MutationObserver(sync).observe(ol, { attributes: true, attributeFilter: ["class"], subtree: true });
    addEventListener("resize", sync); setTimeout(sync, 80); setTimeout(sync, 900);

    /* profile card + proxied actions */
    const logo = $(".logo-img"), foot = document.createElement("div"); foot.className = "rg-foot";
    foot.innerHTML = '<div class="rg-me"><span class="rg-av">' + (logo && logo.currentSrc ? '<img alt="" src="' + logo.currentSrc + '">' : "TM") + '</span><span class="rg-who"><b>Tiamo Mohamad</b><small></small></span></div>' +
      '<div class="rg-act-row"><button class="rg-b" type="button" data-k="lang"></button><button class="rg-b" type="button" data-k="j" aria-label="Journey 3D"><svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg></button>' +
      '<button class="rg-b wa" type="button" data-k="wa" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12Z"/><path d="M9 9.5c.4 2.4 2.6 4.6 5 5l1.2-1.2-2-1-.8.8c-.8-.4-1.6-1.2-2-2l.8-.8-1-2L9 9.5Z"/></svg></button></div>';
    rail.appendChild(foot);
    const fl = () => { $(".rg-who small", foot).textContent = ar() ? "فنان AI · متاح لمشاريع" : "AI Art Director · Available"; $("[data-k=lang]", foot).textContent = ar() ? "EN" : "AR"; if (hov) fill(hov, true); };
    foot.addEventListener("click", e => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      if (b.dataset.k === "lang") $("#langBtn") && $("#langBtn").click();
      else if (b.dataset.k === "j") $("#jBtn") && $("#jBtn").click();
      else { const w = $(".mini-wa"); w && window.open(w.href, "_blank", "noopener"); }
    });

    /* interactive section card */
    const card = document.createElement("div"); card.className = "rg-card";
    card.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="rgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b35ff" stop-opacity=".85"/><stop offset="1" stop-color="#16d8ff" stop-opacity=".6"/></linearGradient></defs></svg>' +
      '<div class="rg-ci"><div class="rg-scene"></div><div class="rg-ct"><b></b><p></p><span></span></div><i class="rg-gl"></i></div>';
    document.body.appendChild(card);
    const sc = $(".rg-scene", card), ci = $(".rg-ci", card);
    let hov = null, shown = "";
    const fill = (o, force) => {
      if (shown !== o.id || force) { if (shown !== o.id) sc.innerHTML = S[o.id] || ""; shown = o.id; }
      $("b", card).textContent = $(".st-lbl", o.a).textContent; $("p", card).textContent = (T[o.id] || ["", ""])[ar() ? 1 : 0]; $("span", card).textContent = ar() ? "افتح القسم ↗" : "OPEN SECTION ↗";
    };
    fl(); new MutationObserver(fl).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    card.addEventListener("pointermove", e => { const r = ci.getBoundingClientRect(); card.style.setProperty("--mx", ((e.clientX - r.left) / r.width).toFixed(3)); card.style.setProperty("--my", ((e.clientY - r.top) / r.height).toFixed(3)); });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--mx", .5); card.style.setProperty("--my", .5); });
    card.addEventListener("click", () => hov && hov.a.click());
    card.addEventListener("pointerenter", () => open(true));
    card.addEventListener("pointerleave", () => open(false));

    /* open / dock-lift / tilt / edge light */
    let ct = 0, pt = 0, raf = 0;
    const st = { px: null, py: null, rx: 0, ry: 0, ang: 0 };
    const hide = () => { pill.classList.remove("on"); card.classList.remove("on"); clearTimeout(pt); hov = null; };
    const open = v => { clearTimeout(ct); if (v) rail.classList.add("rg-open"); else ct = setTimeout(() => { rail.classList.remove("rg-open"); hide(); }, 260); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const loop = () => {
      raf = 0; let mv = false;
      const rr = rail.getBoundingClientRect(), inside = st.py != null;
      items.forEach(o => {
        const r = o.li.getBoundingClientRect();
        const t = inside && !reduce ? Math.exp(-((st.py - (r.top + r.height / 2)) ** 2) / (2 * 42 * 42)) : 0;
        o.k += (t - o.k) * .22; if (Math.abs(t - o.k) > .004) mv = true; else o.k = t;
        o.a.style.setProperty("--z", (o.k * 24).toFixed(1) + "px"); o.a.style.setProperty("--s", (1 + o.k * .06).toFixed(3));
      });
      const dx = inside ? (st.px - (rr.left + rr.width / 2)) / Math.max(rr.width, 140) : 0, dy = inside ? (st.py - (rr.top + rr.height / 2)) / rr.height : 0;
      const trx = reduce ? 0 : -dy * 9, tryy = reduce ? 0 : dx * 12, tang = inside ? Math.atan2(dy, dx) * 57.3 + 90 : st.ang;
      st.rx += (trx - st.rx) * .12; st.ry += (tryy - st.ry) * .12;
      let da = ((tang - st.ang + 540) % 360) - 180; st.ang += da * .14;
      if (Math.abs(trx - st.rx) > .02 || Math.abs(tryy - st.ry) > .02 || Math.abs(da) > .3) mv = true;
      rail.style.setProperty("--rx", st.rx.toFixed(2) + "deg"); rail.style.setProperty("--ry", st.ry.toFixed(2) + "deg"); rail.style.setProperty("--ang", st.ang.toFixed(1) + "deg");
      if (mv || inside) kick();
    };
    rail.addEventListener("pointerenter", e => e.pointerType !== "touch" && open(true));
    rail.addEventListener("pointerleave", () => { st.px = st.py = null; kick(); open(false); });
    rail.addEventListener("focusin", () => open(true));
    rail.addEventListener("focusout", e => { if (!rail.contains(e.relatedTarget)) open(false); });
    rail.addEventListener("keydown", e => { if (e.key === "Escape") { rail.classList.remove("rg-open"); hide(); } });
    rail.addEventListener("pointermove", e => {
      const r = rail.getBoundingClientRect(); st.px = e.clientX; st.py = e.clientY;
      rail.style.setProperty("--mx", e.clientX - r.left + "px"); rail.style.setProperty("--my", e.clientY - r.top + "px"); kick();
    });
    ol.addEventListener("pointerleave", () => pill.classList.remove("on"));
    items.forEach(o => {
      const show = () => {
        put(pill, o.a, 3); pill.classList.add("on"); clearTimeout(pt);
        pt = setTimeout(() => {
          hov = o; fill(o);
          const r = o.a.getBoundingClientRect(), rr = rail.getBoundingClientRect(), h = card.offsetHeight || 215;
          card.style.top = Math.max(12, Math.min(innerHeight - h - 12, r.top + r.height / 2 - h / 2)) + "px";
          card.style.insetInlineStart = (ar() ? innerWidth - rr.right : rr.left) + 214 + 12 + "px"; card.classList.add("on");
        }, 90);
      };
      o.a.addEventListener("pointerenter", show); o.a.addEventListener("focus", show);
      o.a.addEventListener("pointerdown", e => { const r = o.a.getBoundingClientRect(), p = document.createElement("i"); p.className = "rg-rip"; p.style.left = e.clientX - r.left + "px"; p.style.top = e.clientY - r.top + "px"; o.a.appendChild(p); setTimeout(() => p.remove(), 650); });
    });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
