/* LIGHTBOX WHEEL — while the image viewer is open the mouse wheel / trackpad changes the picture
   and never scrolls (or freezes) the page behind it. Uses the viewer's own prev/next buttons. */
(() => {
  const lb = document.getElementById("mediaLightbox");
  if (!lb) return;
  const isOpen = () => lb.classList.contains("open");
  let last = 0, lastNav = 0, acc = 0;
  const onWheel = e => {
    if (!isOpen()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const now = performance.now();
    let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 32;
    if (now - last > 180) acc = 0;
    last = now;
    if (Math.abs(d) < 4) return;                 /* tail of trackpad inertia */
    acc += d;
    if (Math.abs(acc) >= 40 && now - lastNav > 450) {
      lastNav = now;
      const btn = lb.querySelector(acc > 0 ? ".lightbox-next" : ".lightbox-prev");
      acc = 0; btn && btn.click();
    }
  };
  addEventListener("wheel", onWheel, { passive: false, capture: true });
  lb.style.overscrollBehavior = "contain";
})();
