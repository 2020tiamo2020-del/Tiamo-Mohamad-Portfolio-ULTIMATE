/* =====================================================================
   ABOUT → SERVICES MERGE  (scroll-scrubbed shared-element transition)

   - Nothing about the portrait card is changed while the page is at rest.
   - u (0..1) = scroll progress from "card still in its place" to "services
     scene is pinned". It is a pure function of the scroll position, so
     scrolling back up simply plays everything in reverse.
   - Between u=0 and u=1 a live copy of the card flies from where it is now to
     the exact slot / size of the centre card of the services carousel, tilting
     slightly on the way, then dissolves into that card (service #01), while the
     carousel behind it rises, fans in and the giant headline slides in
     (all done by services-stage.js, untouched).
   - transform + opacity only, one rAF per scroll tick.
   ===================================================================== */
(() => {
  "use strict";
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const $ = (s, r = document) => r.querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // gentle start, gentle landing
  const rtl = () => getComputedStyle(document.documentElement).direction === "rtl";

  const START_AT = 0.47;       // card centre height (share of viewport) at which the flight begins
  const MIN_SPAN = 260;        // never shorter than this many px of scrolling
  const END_SCALE = 1.06;      // centre card scale used by services-stage.js (1 + 0.06)

  let photo, flt, sv, pin, scene, card0;
  let ghost = null, box = null, active = false, raf = 0, A = 0, tries = 0;

  function find() {
    photo = $("#about .about-photo");
    flt = photo && ($(".about-float", photo) || photo);
    sv = $("#sv");
    pin = sv && $(".sv-pin", sv);
    scene = sv && $(".sv-scene", sv);
    card0 = sv && $(".sv-card", sv);
    return !!(photo && flt && sv && pin && scene && card0);
  }

  function build() {
    const pr = photo.getBoundingClientRect(), fr = flt.getBoundingClientRect();
    if (pr.width < 40 || pr.height < 40 || fr.width < 40) return false;
    const clone = photo.cloneNode(true);
    clone.classList.remove("am-x");
    clone.style.removeProperty("--am-o");
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach(n => n.removeAttribute("id"));
    clone.querySelectorAll("img").forEach(i => { i.loading = "eager"; i.decoding = "sync"; });
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");
    clone.querySelectorAll("a,button,[tabindex]").forEach(n => n.setAttribute("tabindex", "-1"));
    if (!ghost) { ghost = document.createElement("div"); ghost.className = "am-ghost"; ghost.setAttribute("aria-hidden", "true"); document.body.appendChild(ghost); }
    ghost.textContent = "";
    ghost.appendChild(clone);
    ghost.style.width = pr.width + "px";
    ghost.style.height = pr.height + "px";
    box = { fw: fr.width, fh: fr.height, ox: fr.left + fr.width / 2 - pr.left, oy: fr.top + fr.height / 2 - pr.top, w: pr.width, h: pr.height };
    ghost.style.transformOrigin = box.ox + "px " + box.oy + "px";
    return true;
  }

  function release() {
    if (!active) return;
    active = false;
    if (ghost) { ghost.classList.remove("am-on"); ghost.style.opacity = "0"; }
    photo.classList.remove("am-x");
    photo.style.removeProperty("--am-o");
  }

  function update() {
    raf = 0;
    if (!find()) return;
    const H = innerHeight;
    const B = sv.getBoundingClientRect().top + scrollY;             // scroll position at which the services scene gets pinned
    if (!active) {                                                  // while at rest, always re-measure from the untouched original
      const fr = flt.getBoundingClientRect();
      A = fr.top + fr.height / 2 + scrollY - START_AT * H;
    }
    const a = Math.min(A, B - MIN_SPAN);
    const u = clamp((scrollY - a) / (B - a), 0, 1);

    if (u <= 0 || innerWidth < 2) { release(); return; }

    if (!box || !ghost || !ghost.firstChild || Math.abs(box.w - photo.offsetWidth) > 40 && !active) { if (!build()) return; }
    if (!active) { active = true; }

    // ---- target = exact slot and size of the centre card of the services carousel
    const sr = scene.getBoundingClientRect(), pr = pin.getBoundingClientRect();
    const tcx = sr.left + sr.width / 2;
    const tcy = sr.top - pr.top + sr.height / 2;
    const cw = card0.offsetWidth || 240, ch = card0.offsetHeight || 340;
    const sEnd = (ch * END_SCALE) / box.fh;
    const fix = (cw / ch) / (box.fw / box.fh);                      // the card is a touch wider than the portrait frame

    // ---- where the card would be if nothing happened (follows the page)
    const nr = flt.getBoundingClientRect();
    const ncx = nr.left + nr.width / 2, ncy = nr.top + nr.height / 2;

    const e = ease(u);
    const cx = ncx + (tcx - ncx) * e, cy = ncy + (tcy - ncy) * e;
    const s = 1 + (sEnd - 1) * e;
    const sx = s * (1 + (fix - 1) * sstep(0.55, 1, u));
    const arc = Math.sin(Math.PI * e);                              // 0 → 1 → 0 : tilt only while travelling
    const d = rtl() ? -1 : 1;

    ghost.style.transform =
      "translate3d(" + (cx - box.ox).toFixed(2) + "px," + (cy - box.oy).toFixed(2) + "px,0) " +
      "perspective(1500px) rotateX(" + (arc * 3).toFixed(2) + "deg) rotateY(" + (arc * -8 * d).toFixed(2) + "deg) " +
      "scale(" + sx.toFixed(4) + "," + s.toFixed(4) + ")";

    const inA = sstep(0, 0.04, u);                                  // copy appears exactly on top of the original
    const outA = 1 - sstep(0.8, 0.99, u);                           // …and dissolves into service card #01
    ghost.style.opacity = (inA * outA).toFixed(3);
    ghost.classList.toggle("am-on", u < 0.995);

    photo.classList.add("am-x");
    photo.style.setProperty("--am-o", u < 0.04 ? "1" : "0");
  }

  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  function init() {
    if (!find()) { if (++tries < 40) setTimeout(init, 250); return; }
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", () => { release(); box = null; schedule(); });
    addEventListener("load", () => { box = null; schedule(); setTimeout(schedule, 1200); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { box = null; schedule(); });
    // a language switch changes the caption text: rebuild the copy next time it is needed
    new MutationObserver(() => { box = null; }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    schedule();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
