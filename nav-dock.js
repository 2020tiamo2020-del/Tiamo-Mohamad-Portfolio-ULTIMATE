/* TOP NAV — morphing pill + magnifying dock. Reads the existing #nav links (spy, language, smooth-scroll and sounds stay theirs): a dock click just clicks the real link. */
(() => {
  const nav = document.getElementById("nav");
  if (!nav || document.getElementById("tmDock")) return;
  const links = [...nav.querySelectorAll("a[href^='#']")];
  if (!links.length) return;
  const ICON = {
    "#home": '<path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5"/>',
    "#about": '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
    "#services": '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
    "#work": '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 9"/>',
    "#cinema": '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="m19 16 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>',
    "#creation": '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
    "#beforeafter": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 5v14"/><path d="M3 8a3 3 0 0 1 3-3h6v14H6a3 3 0 0 1-3-3Z" fill="currentColor" fill-opacity=".3"/>',
    "#contact": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3.5 7 8.5 6 8.5-6"/>'
  };
  const label = a => (a.textContent || "").replace(/\s+/g, " ").trim();
  const dock = document.createElement("div");
  dock.className = "tmd"; dock.id = "tmDock";
  dock.innerHTML = '<div class="tmd-pill"><button class="tmd-rest" type="button" aria-expanded="false" aria-controls="tmdItems"><i class="tmd-dot"></i><span class="tmd-name"></span>' +
    '<svg class="tmd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
    '<div class="tmd-items" id="tmdItems" role="navigation" aria-label="Sections"></div><div class="tmd-prog"><i></i></div></div><div class="tmd-tip" aria-hidden="true"></div>';
  document.body.appendChild(dock);
  const rest = dock.querySelector(".tmd-rest"), nameEl = dock.querySelector(".tmd-name"), box = dock.querySelector(".tmd-items"), tip = dock.querySelector(".tmd-tip"), prog = dock.querySelector(".tmd-prog i");
  const items = links.map((a, i) => {
    const href = a.getAttribute("href");
    const b = document.createElement("a");
    b.className = "tmd-it" + (href === "#cinema" ? " is-beyond" : ""); b.href = href;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICON[href] || ICON["#home"]) + "</svg>";
    b.addEventListener("click", e => { e.preventDefault(); a.click(); });
    if (i === 1) { const sep = document.createElement("i"); sep.className = "tmd-sep"; box.appendChild(sep); }
    box.appendChild(b);
    return { a, b, s: 1, t: 1, x: 0, tx: 0, c: 0 };
  });
  const sync = () => {
    let cur = items.find(o => o.a.classList.contains("is-active")) || items[0];
    items.forEach(o => { const on = o === cur; o.b.classList.toggle("is-active", on); if (on) o.b.setAttribute("aria-current", "page"); else o.b.removeAttribute("aria-current"); o.b.setAttribute("aria-label", label(o.a)); });
    nameEl.textContent = label(cur.a);
  };
  new MutationObserver(sync).observe(nav, { attributes: true, attributeFilter: ["class"], subtree: true, characterData: true, childList: true });
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
  sync();

  /* open / close */
  let open = false, closeT = 0, px = null, raf = 0;
  const setOpen = v => {
    if (open === v) return; open = v; dock.classList.toggle("is-open", v); rest.setAttribute("aria-expanded", v);
    if (v) measure(); else { px = null; hideTip(); }
    kick();
  };
  const arm = () => { clearTimeout(closeT); setOpen(true); };
  const disarm = () => { clearTimeout(closeT); closeT = setTimeout(() => { if (!dock.matches(":focus-within") || !dock.matches(":hover")) setOpen(false); }, 260); };
  dock.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") arm(); });
  dock.addEventListener("pointerleave", e => { if (e.pointerType !== "touch") { px = null; disarm(); } });
  dock.addEventListener("focusin", arm);
  dock.addEventListener("focusout", e => { if (!dock.contains(e.relatedTarget)) disarm(); });
  rest.addEventListener("click", () => setOpen(!open));
  dock.addEventListener("keydown", e => { if (e.key === "Escape") { setOpen(false); rest.focus(); } });
  document.addEventListener("pointerdown", e => { if (open && !dock.contains(e.target)) setOpen(false); }, { passive: true });

  /* magnify: scale each icon by distance to the pointer, push neighbours apart so the pill never jitters */
  const W = 40, MAXS = 0.62, SIG = 46;
  const measure = () => { items.forEach(o => { o.c = o.b.offsetLeft + o.b.offsetWidth / 2; }); };
  box.addEventListener("pointermove", e => { const r = box.getBoundingClientRect(); px = e.clientX - r.left; kick(); });
  box.addEventListener("pointerleave", () => { px = null; hideTip(); kick(); });
  const showTip = o => {
    tip.textContent = label(o.a);
    const pr = dock.getBoundingClientRect(), r = o.b.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2 - pr.left) + "px"; tip.classList.add("on");
  };
  const hideTip = () => tip.classList.remove("on");
  let tipFor = null;
  const frame = () => {
    raf = 0; let moving = false;
    const order = items.slice().sort((a, b) => a.c - b.c);
    order.forEach(o => { o.t = px == null ? 1 : 1 + MAXS * Math.exp(-((px - o.c) ** 2) / (2 * SIG * SIG)); o.s += (o.t - o.s) * 0.28; if (Math.abs(o.t - o.s) > 0.002) moving = true; else o.s = o.t; });
    const E = order.reduce((n, o) => n + (o.s - 1) * W, 0); let acc = 0;
    order.forEach(o => { const ex = (o.s - 1) * W; const tx = -E / 2 + acc + ex / 2; o.tx += (tx - o.tx) * 0.5; acc += ex; o.b.style.setProperty("--s", o.s.toFixed(3)); o.b.style.setProperty("--tx", o.tx.toFixed(2) + "px"); });
    if (open && px != null) { let best = null, bd = 1e9; order.forEach(o => { const d = Math.abs(px - o.c); if (d < bd) { bd = d; best = o; } }); if (best && bd < 34 && best !== tipFor) { tipFor = best; showTip(best); } else if (bd >= 34 && tipFor) { tipFor = null; hideTip(); } }
    else tipFor = null;
    if (moving || (open && px != null)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener("resize", () => { measure(); });

  /* thin page-progress line under the pill */
  let pt = 0;
  const progress = () => { pt = 0; const h = document.documentElement.scrollHeight - innerHeight; prog.style.setProperty("--p", h > 0 ? Math.min(1, Math.max(0, (scrollY || 0) / h)).toFixed(4) : 0); };
  addEventListener("scroll", () => { if (!pt) pt = requestAnimationFrame(progress); }, { passive: true });
  progress();
})();
