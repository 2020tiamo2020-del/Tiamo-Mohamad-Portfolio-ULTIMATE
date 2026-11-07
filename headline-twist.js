/* Headline twist — plays on the About and Contact headings, EN + AR, only when the section has fully settled:
   the heading is on screen, scrolling has stopped, no other finite animation/transition in the section is still running
   (and for About, the cards have met). It plays again each time you come back to the section. Nothing runs before or after. */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const IDLE = 480, MAXWAIT = 5200;
  let lastMove = performance.now();
  const bump = () => { lastMove = performance.now(); };
  addEventListener("scroll", bump, { passive: true }); addEventListener("wheel", bump, { passive: true }); addEventListener("touchmove", bump, { passive: true });

  const AR = /[\u0600-\u06FF]/;
  const wrap = (h) => {
    if (h.__cxBusy) return;
    h.__cxBusy = true;
    const text = h.textContent.replace(/\s+/g, " ").trim();
    const word = AR.test(text);
    const main = document.createElement("span"); main.className = "cx-main"; main.innerHTML = h.innerHTML;
    let n = 0;
    const proc = (node) => {
      [...node.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { f.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "cxw";
            if (word) { const s = document.createElement("span"); s.className = "cxc"; s.style.setProperty("--i", n++); s.textContent = tok; w.appendChild(s); }
            else [...tok].forEach(ch => { const s = document.createElement("span"); s.className = "cxc"; s.style.setProperty("--i", n++); s.textContent = ch; w.appendChild(s); });
            f.appendChild(w);
          });
          c.replaceWith(f);
        } else if (c.nodeType === 1) proc(c);
      });
    };
    proc(main);
    const echo = main.cloneNode(true); echo.className = "cx-echo";
    main.setAttribute("aria-hidden", "true"); echo.setAttribute("aria-hidden", "true");
    h.textContent = ""; h.append(main, echo);
    h.setAttribute("aria-label", text);
    h.style.setProperty("--cxs", (word ? 110 : Math.max(18, Math.min(42, 1500 / Math.max(1, n)))) + "ms");
    h.classList.add("cx-ready");
    h.__cxBusy = false;
  };

  const busy = (sec, h) => sec.getAnimations({ subtree: true }).some(a => {
    const tg = a.effect && a.effect.target;
    if (!tg || h.contains(tg) || a.playState !== "running") return false;
    const t = a.effect.getComputedTiming && a.effect.getComputedTiming();
    return !!t && isFinite(t.endTime) && t.endTime > 0 && t.progress !== 1;
  });

  const arm = (secSel, hSel, ready) => {
    const sec = document.querySelector(secSel), h = sec && sec.querySelector(hSel);
    if (!sec || !h) return;
    wrap(h);
    new MutationObserver(() => { if (!h.__cxBusy && !h.querySelector(".cx-main")) { const was = h.classList.contains("cx-go"); wrap(h); if (was) h.classList.add("cx-go"); } }).observe(h, { childList: true });
    let seenAt = 0, timer = 0;
    const calm = () => {
      if (h.classList.contains("cx-go")) return;
      const waited = performance.now() - seenAt;
      const ok = performance.now() - lastMove > IDLE && !busy(sec, h) && (!ready || ready());
      if (ok || waited > MAXWAIT) h.classList.add("cx-go");
    };
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting && e.intersectionRatio >= 0.55) { if (!timer) { seenAt = performance.now(); timer = setInterval(calm, 100); } }
      else if (!e.isIntersecting) { clearInterval(timer); timer = 0; h.classList.remove("cx-go"); }
    }), { threshold: [0, 0.55] }).observe(h);
  };
  const go = () => {
    arm("#about", ".section-title h2", () => { const a = window.__abArrive && window.__abArrive(); return a == null || a <= 0.03; });
    arm("#contact", "h2");
  };
  if (document.readyState === "complete") setTimeout(go, 0); else addEventListener("load", () => setTimeout(go, 0));
})();
