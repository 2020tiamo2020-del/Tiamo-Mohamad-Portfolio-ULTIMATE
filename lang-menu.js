/* Language switch: one fixed button ("English ⌄" / "العربية ⌄") that opens a small list, the same in both languages. */
(function () {
  "use strict";
  const b = document.getElementById("langBtn"); if (!b || b.dataset.lm) return; b.dataset.lm = "1";
  const isAr = () => document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
  const chev = '<svg class="lm-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  const menu = document.createElement("div"); menu.className = "lm-menu"; menu.setAttribute("role", "listbox"); menu.hidden = true;
  menu.innerHTML = '<button type="button" role="option" data-l="ar" lang="ar">العربية</button><button type="button" role="option" data-l="en" lang="en">English</button>';
  document.body.appendChild(menu);
  let open = false, painting = false;
  const paint = () => {
    const want = isAr() ? "ar" : "en";
    if (b.dataset.lmv === want && b.querySelector(".lm-cur")) return;   // already painted: stops the observer from looping on our own change
    if (painting) return; painting = true; b.dataset.lmv = want;
    b.classList.add("lm-btn"); b.innerHTML = '<span class="lm-cur">' + (isAr() ? "العربية" : "English") + "</span>" + chev;
    b.setAttribute("aria-haspopup", "listbox"); b.setAttribute("aria-expanded", open ? "true" : "false"); b.setAttribute("aria-label", isAr() ? "اللغة" : "Language");
    menu.querySelectorAll("button").forEach(o => { const on = (o.dataset.l === "ar") === isAr(); o.classList.toggle("is-on", on); o.setAttribute("aria-selected", on ? "true" : "false"); });
    painting = false;
  };
  const place = () => { const r = b.getBoundingClientRect(); menu.style.top = Math.round(r.bottom + 8) + "px"; menu.style.right = Math.max(8, Math.round(innerWidth - r.right)) + "px"; menu.style.minWidth = Math.max(120, Math.round(r.width)) + "px"; };
  const set = v => { open = v; menu.hidden = !v; b.classList.toggle("is-open", v); b.setAttribute("aria-expanded", v ? "true" : "false"); if (v) place(); };
  b.addEventListener("click", e => { if (window.__lmPass || !e.isTrusted) return; /* script clicks (e.g. the side rail) switch the language directly */ e.stopImmediatePropagation(); e.preventDefault(); set(!open); }, true);
  menu.addEventListener("click", e => {
    const o = e.target.closest("button[data-l]"); if (!o) return;
    if ((o.dataset.l === "ar") !== isAr()) { window.__lmPass = true; b.click(); window.__lmPass = false; }
    set(false); b.focus();
  });
  document.addEventListener("pointerdown", e => { if (open && !menu.contains(e.target) && !b.contains(e.target)) set(false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && open) { set(false); b.focus(); } });
  addEventListener("resize", () => { if (open) place(); });
  new MutationObserver(paint).observe(b, { childList: true, characterData: true, subtree: true });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
  paint();
})();
