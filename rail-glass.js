/* LIQUID GLASS RAIL — decorates the existing .st-rail: icons, groups, sliding glass pill, liquid active tab, cursor glow, profile card, section preview. All navigation stays story.js's. */
(() => {
  const P = {
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
  const G = [["Main", "الأساسي", "home"], ["Work", "الأعمال", "work"], ["Connect", "التواصل", "process"]];
  const $ = (s, r = document) => r.querySelector(s);
  const ar = () => document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
  const svg = d => '<svg class="rg-ic" viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>";
  let tries = 0;
  const boot = () => {
    const rail = $(".st-rail");
    if (!rail || !rail.querySelector("li a")) { if (tries++ < 100) setTimeout(boot, 150); return; }
    if (!rail.classList.contains("rg")) build(rail);
  };
  const build = rail => {
    rail.classList.add("rg");
    const ol = $("ol", rail), lis = [...ol.children].filter(li => li.querySelector("a"));
    const items = lis.map(li => { const a = $("a", li), id = a.getAttribute("href").slice(1); a.insertAdjacentHTML("afterbegin", svg(P[id] || P.home)); return { li, a, id }; });
    G.forEach(([en, a, first]) => {
      const it = items.find(o => o.id === first); if (!it) return;
      const g = document.createElement("li"); g.className = "rg-grp"; g.setAttribute("aria-hidden", "true");
      g.innerHTML = "<span></span>"; g.dataset.en = en; g.dataset.ar = a; ol.insertBefore(g, it.li);
    });
    const grps = [...ol.querySelectorAll(".rg-grp")];
    const lang = () => grps.forEach(g => { $("span", g).textContent = ar() ? g.dataset.ar : g.dataset.en; });
    lang(); new MutationObserver(lang).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    const pill = document.createElement("i"), act = document.createElement("i");
    pill.className = "rg-pill"; act.className = "rg-act"; ol.append(pill, act);
    const top = el => el.getBoundingClientRect().top - ol.getBoundingClientRect().top;
    const put = (el, a) => { el.style.transform = "translateY(" + top(a) + "px)"; el.style.height = a.offsetHeight + "px"; };
    let cur = null;
    const sync = () => {
      const on = items.find(o => o.a.classList.contains("on")); if (!on) return;
      if (on !== cur) { act.classList.remove("mv"); void act.offsetWidth; if (cur) act.classList.add("mv"); }
      cur = on; put(act, on.a); act.classList.toggle("beyond", on.id === "cinema");
    };
    new MutationObserver(sync).observe(ol, { attributes: true, attributeFilter: ["class"], subtree: true });
    addEventListener("resize", sync); setTimeout(sync, 60); setTimeout(sync, 700);

    /* footer: profile card + proxied actions (the real header buttons keep their own logic) */
    const logo = $(".logo-img"), foot = document.createElement("div"); foot.className = "rg-foot";
    foot.innerHTML = '<div class="rg-me"><span class="rg-av">' + (logo ? '<img alt="" src="' + logo.currentSrc + '">' : "TM") + '</span><span class="rg-who"><b>Tiamo Mohamad</b><small></small></span></div>' +
      '<div class="rg-act-row"><button class="rg-b" type="button" data-k="lang"></button>' +
      '<button class="rg-b" type="button" data-k="j" aria-label="Journey 3D"><svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg></button>' +
      '<button class="rg-b wa" type="button" data-k="wa" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12Z"/><path d="M9 9.5c.4 2.4 2.600 4.600 5 5l1.200-1.200-2-1-.8.8c-.8-.4-1.600-1.200-2-2l.8-.8-1-2L9 9.500Z"/></svg></button></div>';
    rail.appendChild(foot);
    const fl = () => { $(".rg-who small", foot).textContent = ar() ? "فنان AI · متاح لمشاريع" : "AI Art Director · Available"; $('[data-k=lang]', foot).textContent = ar() ? "EN" : "AR"; };
    fl(); new MutationObserver(fl).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    foot.addEventListener("click", e => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      if (b.dataset.k === "lang") $("#langBtn") && $("#langBtn").click();
      else if (b.dataset.k === "j") $("#jBtn") && $("#jBtn").click();
      else { const w = $(".mini-wa"); w && window.open(w.href, "_blank", "noopener"); }
    });

    /* open / glow / pill / preview */
    const prev = document.createElement("div"); prev.className = "rg-prev"; prev.setAttribute("aria-hidden", "true"); prev.innerHTML = "<i></i><b></b>"; document.body.appendChild(prev);
    const cache = {}, thumb = id => {
      if (id in cache) return cache[id];
      const el = id === "home" ? $(".hero") : document.getElementById(id); let u = null;
      if (el) { const v = $("video[poster]", el); u = v && v.getAttribute("poster");
        if (!u) { const im = [...el.querySelectorAll("img")].find(i => (i.currentSrc || i.src || i.dataset.src) && !/logo|icon|avatar|sprite/i.test(i.currentSrc || i.src || i.dataset.src || "")); u = im && (im.currentSrc || im.src || im.dataset.src); } }
      return (cache[id] = u || "");
    };
    let ct = 0, pt = 0;
    const open = v => { clearTimeout(ct); if (v) rail.classList.add("rg-open"); else ct = setTimeout(() => { rail.classList.remove("rg-open"); hide(); }, 240); };
    const hide = () => { pill.classList.remove("on"); prev.classList.remove("on"); clearTimeout(pt); };
    rail.addEventListener("pointerenter", e => e.pointerType !== "touch" && open(true));
    rail.addEventListener("pointerleave", () => open(false));
    rail.addEventListener("focusin", () => open(true));
    rail.addEventListener("focusout", e => { if (!rail.contains(e.relatedTarget)) open(false); });
    rail.addEventListener("keydown", e => { if (e.key === "Escape") { rail.classList.remove("rg-open"); hide(); } });
    rail.addEventListener("pointermove", e => { const r = rail.getBoundingClientRect(); rail.style.setProperty("--mx", e.clientX - r.left + "px"); rail.style.setProperty("--my", e.clientY - r.top + "px"); });
    items.forEach(o => {
      const show = () => {
        put(pill, o.a); pill.classList.add("on"); clearTimeout(pt);
        pt = setTimeout(() => {
          const u = thumb(o.id), r = o.a.getBoundingClientRect(), rr = rail.getBoundingClientRect(), h = 190;
          $("i", prev).style.backgroundImage = u ? 'url("' + u + '")' + ",linear-gradient(135deg,#2a1260,#0c6a86)" : "";
          $("b", prev).textContent = $(".st-lbl", o.a).textContent;
          const y = Math.max(12, Math.min(innerHeight - h - 12, r.top + r.height / 2 - h / 2));
          prev.style.top = y + "px"; prev.style.insetInlineStart = (ar() ? innerWidth - rr.right : rr.left) + 268 + 14 + "px"; prev.classList.add("on");
        }, 150);
      };
      o.a.addEventListener("pointerenter", show); o.a.addEventListener("focus", show);
    });
    ol.addEventListener("pointerleave", hide);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
