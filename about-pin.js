/* =====================================================================
   ABOUT PIN
   - #about is wrapped in a taller box and made sticky, so it stays on screen for
     P px of scrolling while the portrait card (from the right) and the certificate (from the left)
     glide in and meet in their natural layout (about-link.js reads __abArrive()).
   - "About" in the top bar / side rail lands exactly where they have met (__frameAbout).
   - Desktop only; with "reduce motion" the page keeps its normal flow.
   ===================================================================== */
(() => {
  "use strict";
  const sec = document.getElementById("about");
  const photo = sec && sec.querySelector(".about-photo");
  if (!sec || !photo || !sec.parentNode) return;
  const mq = matchMedia("(min-width:901px)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const wrap = document.createElement("div");
  wrap.className = "ab-pin-wrap";
  const spacer = document.createElement("div");
  spacer.className = "ab-pin-spacer"; spacer.setAttribute("aria-hidden", "true");
  sec.parentNode.insertBefore(wrap, sec);
  wrap.appendChild(sec); wrap.appendChild(spacer);

  let on = false, P = 0, ARR = 0, top = 0;
  const layout = () => {
    on = mq.matches && !reduce;
    wrap.classList.toggle("on", on);
    if (!on) { spacer.style.height = "0px"; sec.style.removeProperty("--ab-top"); P = ARR = 0; return; }
    const vh = innerHeight || 1;
    const hd = document.querySelector(".site-header"), kick = sec.querySelector(".section-kicker"), cert = document.getElementById("certBlock");
    const hb = hd ? hd.getBoundingClientRect().bottom : 90;               // bottom edge of the fixed header
    const sr = sec.getBoundingClientRect();
    const ko = kick ? kick.getBoundingClientRect().top - sr.top : 0;       // kicker offset inside the section
    const cb = Math.max(photo.getBoundingClientRect().bottom, cert ? cert.getBoundingClientRect().bottom : 0) - sr.top;   // where the content really ends
    /* pin with the kicker just under the header; if the content would not fit, slide up a little (never above header + 4px) */
    top = Math.round(Math.max(hb + 4 - ko, Math.min(hb + 14 - ko, vh - cb - 16)));
    ARR = Math.round(vh * 0.95 * 0.64);                                // the cards have met after this much (unchanged)
    P = Math.round(vh * 0.95 + vh * 0.24);                             // total pinned scroll: the same hold as before + a short extra beat before the card moves off
    sec.style.setProperty("--ab-top", top + "px");
    spacer.style.height = P + "px";
    setTimeout(() => dispatchEvent(new Event("scroll")), 0);          // let about-link.js re-read the new geometry
  };

  /* 0 = cards met, 1 = cards apart (same scale about-link.js uses) — or null when the pin is off */
  window.__abArrive = () => {
    if (!on) return null;
    const wt = wrap.getBoundingClientRect().top;
    return 1 - clamp((top - wt) / Math.max(1, ARR), 0, 1);
  };
  /* "About" from the top bar / side rail: scroll to where the cards have just met (pinned) */
  window.__frameAbout = () => {
    if (!on) return false;
    const y = wrap.getBoundingClientRect().top + scrollY - top + ARR + 2;
    if (Math.abs(y - scrollY) > innerHeight * 0.9) window.__tmJumpUntil = performance.now() + 1700;
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo && !lenis.isStopped) lenis.scrollTo(y, { duration: 1.4 });
    else scrollTo({ top: y, behavior: "smooth" });
    setTimeout(() => { try { window.__updateActiveNav && window.__updateActiveNav(); } catch (_) {} }, 500);
    return true;
  };
  window.__abPin = { get on() { return on; }, get top() { return top; } };

  let t = 0; const relayout = () => { clearTimeout(t); t = setTimeout(layout, 80); };
  addEventListener("resize", relayout);
  (mq.addEventListener ? mq.addEventListener("change", layout) : mq.addListener(layout));
  new MutationObserver(relayout).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener("load", layout);
  layout();

  /* nav / side-rail links to #about: land on the "cards have met" position even if script.js is an older copy */
  document.addEventListener("click", e => {
    const l = e.target.closest && e.target.closest('a[href="#about"],[data-target="about"],[data-go="about"]');
    if (!l || !on) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.__frameAbout();
  }, true);
  if (!document.querySelector('link[href*="about-pin.css"]')) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "about-pin.css?v=1"; document.head.appendChild(l);
  }

  /* the glide-in pair controller (about-link.js/css) is what moves the two cards: make sure it is on the page */
  if (!document.querySelector('script[src*="about-link"]')) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "about-link.css?v=1"; document.head.appendChild(l);
    const sc = document.createElement("script"); sc.src = "about-link.js?v=1"; document.body.appendChild(sc);
  }
})();
