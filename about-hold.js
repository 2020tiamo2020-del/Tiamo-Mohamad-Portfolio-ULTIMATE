/* =====================================================================================================
   ABOUT · short scroll hold ("soft pin")
   Scrolling DOWN from Home into About: the page glides so the whole About block is framed, stays put while the
   line-sweep text, the certificate card (from the left) and the portrait (from the right) finish their entrance,
   and while the visitor reads. Then scrolling is released and the page continues to Services as usual.
   - once per visit (re-arms when About has left the screen, or when you scroll back up to Home)
   - scrolling UP into About, clicking a menu link, touch/phone and reduced-motion: no hold
   - the hold is short and never traps: a strong wheel push / any of Space, PageDown, End, Esc releases it early
   - the mouse still works during the hold (portrait cyber effect)
   Tuning: HOLD_MS (total pause after the page has settled), SETTLE_MS (glide time), SKIP_PX (wheel push that skips).
   To undo: remove the about-hold.js tag from index.html.
   ===================================================================================================== */
(() => {
  "use strict";
  const sec = document.getElementById("about");
  if (!sec) return;
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;

  const HOLD_MS = 3400;      /* pause after the glide ends: text sweep + cards (~2s) + reading time */
  const SETTLE_MS = 850;     /* glide duration into the framed position */
  const SKIP_PX = 1400;      /* accumulated wheel push (px) that ends the hold early */
  const wide = () => matchMedia("(min-width:901px) and (hover:hover) and (pointer:fine)").matches;
  const header = () => document.querySelector(".site-header, header");

  let armed = true, holding = false, lastY = scrollY, navUntil = 0, acc = 0, timer = 0, settleT = 0;

  const vh = () => innerHeight || document.documentElement.clientHeight;
  const hb = () => { const h = header(); return h ? Math.max(0, h.getBoundingClientRect().bottom) : 80; };

  /* where the About block should sit: centred if it fits under the header, else top-aligned below it */
  const targetY = () => {
    const r = sec.getBoundingClientRect(), top = r.top + scrollY, H = r.height, V = vh(), h = hb();
    const free = V - h;
    const y = H < free ? top - h - (free - H) / 2 : top - h - 8;
    return Math.max(0, Math.round(y));
  };

  const block = e => { if (e.cancelable) e.preventDefault(); };
  const onWheel = e => {
    block(e);
    acc += Math.abs(e.deltaY);
    if (e.deltaY > 0 && acc > SKIP_PX) release();
  };
  const onKey = e => {
    if ([" ", "PageDown", "End", "Escape", "ArrowDown", "ArrowUp", "PageUp", "Home"].includes(e.key)) {
      block(e);
      if (["PageDown", "End", "Escape", " "].includes(e.key)) release();
    }
  };

  function lock() {
    holding = true; acc = 0;
    addEventListener("wheel", onWheel, { passive: false, capture: true });
    addEventListener("touchmove", block, { passive: false, capture: true });
    addEventListener("keydown", onKey, { capture: true });
    try { window.__lenis && window.__lenis.stop(); } catch (_) {}
  }
  function release() {
    if (!holding) return;
    holding = false; clearTimeout(timer); clearTimeout(settleT);
    removeEventListener("wheel", onWheel, { capture: true });
    removeEventListener("touchmove", block, { capture: true });
    removeEventListener("keydown", onKey, { capture: true });
    try { window.__lenis && window.__lenis.start(); } catch (_) {}
    lastY = scrollY;
  }

  function engage() {
    armed = false;
    const y = targetY(), L = window.__lenis;
    if (L && typeof L.scrollTo === "function") L.scrollTo(y, { duration: SETTLE_MS / 1000, force: true, lock: false });
    else scrollTo({ top: y, behavior: "smooth" });
    clearTimeout(settleT);
    settleT = setTimeout(() => {
      /* glide done: freeze the page, let the animation play, then let go */
      if (Math.abs(scrollY - y) > 4) { try { L && L.scrollTo ? L.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); } catch (_) {} }
      lock();
      timer = setTimeout(release, HOLD_MS);
    }, SETTLE_MS + 60);
  }

  const check = () => {
    if (holding) return;
    const y = scrollY, down = y > lastY + 0.5; lastY = y;
    const r = sec.getBoundingClientRect(), V = vh();
    /* re-arm once About is clearly out of view (above or below) */
    if (r.top > V * 0.98 || r.bottom < hb() * 0.5) { armed = true; return; }
    if (!armed || !down || !wide()) return;
    if (performance.now() < navUntil) { armed = false; return; }       /* arrived by a menu click: no hold */
    /* the top of About has come up into the upper 60% of the screen while scrolling down */
    if (r.top < V * 0.6 && r.top > hb() - r.height * 0.25) engage();
  };

  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) navUntil = performance.now() + 2200;
  }, true);
  addEventListener("scroll", () => requestAnimationFrame(check), { passive: true });
  addEventListener("resize", () => { if (holding && !wide()) release(); }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) release(); });
  addEventListener("pagehide", release);
})();
