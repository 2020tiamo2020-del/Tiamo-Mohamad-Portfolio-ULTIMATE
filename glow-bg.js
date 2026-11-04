/* Glow backgrounds: pointer light, parallax, idle drift and click ripples
   for the .gb layers in #about (blue) and #contact (purple). */
(() => {
  "use strict";
  const layers = [...document.querySelectorAll(".gb")];
  if (!layers.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const S = layers.map((el, i) => ({
    el, host: el.parentElement, vis: false, hover: false, last: -1e9,
    tx: 0, ty: 0, x: 0, y: 0, mx: 0, my: 0, hi: .55, ph: i * 2.1, init: false
  }));
  let raf = 0;

  const io = new IntersectionObserver(es => {
    es.forEach(e => { const s = S.find(o => o.host === e.target); if (s) s.vis = e.isIntersecting; });
    if (S.some(s => s.vis) && !raf) raf = requestAnimationFrame(tick);
  }, { rootMargin: "80px" });
  S.forEach(s => io.observe(s.host));

  const inside = (r, x, y) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

  addEventListener("pointermove", e => {
    const now = performance.now();
    S.forEach(s => {
      if (!s.vis) return;
      const r = s.el.getBoundingClientRect();
      if (inside(r, e.clientX, e.clientY)) {
        s.hover = true; s.last = now; s.tx = e.clientX - r.left; s.ty = e.clientY - r.top;
      } else s.hover = false;
    });
  }, { passive: true });

  addEventListener("pointerdown", e => {
    S.forEach(s => {
      if (!s.vis) return;
      const r = s.el.getBoundingClientRect();
      if (!inside(r, e.clientX, e.clientY)) return;
      const d = document.createElement("div");
      d.className = "gb-rip";
      d.style.left = (e.clientX - r.left) + "px";
      d.style.top = (e.clientY - r.top) + "px";
      s.el.appendChild(d);
      d.addEventListener("animationend", () => d.remove(), { once: true });
      s.last = performance.now(); s.hover = true; s.tx = e.clientX - r.left; s.ty = e.clientY - r.top;
    });
  }, { passive: true });

  function tick(now) {
    raf = 0;
    let any = false;
    S.forEach(s => {
      if (!s.vis) return;
      any = true;
      const w = s.el.clientWidth, h = s.el.clientHeight;
      const active = s.hover && now - s.last < 2500;
      if (!active) {                       // idle: the light slowly circles the sphere rim
        const t = now / 1000 + s.ph;
        s.tx = w * (.76 + .12 * Math.cos(t * .45));
        s.ty = h * (.70 + .14 * Math.sin(t * .35));
      }
      if (!s.init) { s.x = s.tx; s.y = s.ty; s.init = true; }
      s.x += (s.tx - s.x) * (active ? .16 : .035);
      s.y += (s.ty - s.y) * (active ? .16 : .035);
      const nx = (s.x / w - .5) * 2, ny = (s.y / h - .5) * 2;
      s.mx += (nx - s.mx) * .06; s.my += (ny - s.my) * .06;
      s.hi += ((active ? 1 : .55) - s.hi) * .06;
      const st = s.el.style;
      st.setProperty("--px", s.x.toFixed(1) + "px");
      st.setProperty("--py", s.y.toFixed(1) + "px");
      st.setProperty("--mx", s.mx.toFixed(3));
      st.setProperty("--my", s.my.toFixed(3));
      st.setProperty("--hi", s.hi.toFixed(3));
    });
    if (any) raf = requestAnimationFrame(tick);
  }
})();
