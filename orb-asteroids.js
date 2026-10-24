/* ==========================================================================
   ORB ASTEROIDS — small rotating "asteroid" dots that wrap around the music orb
   --------------------------------------------------------------------------
   • ~900 violet + ~315 cyan dots on two spherical shells around #tmOrb, turning in
     opposite directions (same geometry / speeds as the original Three.js scene).
   • Real wrap-around: dots that are BEHIND the orb draw under it, dots in FRONT of it
     draw over it (two stacked canvases), so they truly circle the sphere.
   • Mouse / touch reaction: the whole shell leans toward the pointer (parallax) and the
     dots near the pointer are gently pushed away, then spring back.
   • Music reaction (optional): when #tmOrb sets --beat, the shell swells and glows.
   • No Three.js, no CDN, no other file needed. The CSS is injected by this file.

   INSTALL
     1) Put this file next to index.html and add before </body>:
          <script src="orb-asteroids.js" defer></script>
     2) Needs:  .hero-visual (the orb's wrapper)  and  #tmOrb  (already in your index.html).
     3) If your old enhance.js still runs initHeroGL() (rings + point sphere), remove that call,
        otherwise you will see two clouds on top of each other.
   REMOVE: delete the <script> tag (nothing else was touched).
   ========================================================================== */
(() => {
"use strict";

/* ------------------------------ settings ------------------------------ */
const CFG = {
  COUNT_VIOLET: 900,          /* desktop */
  COUNT_CYAN: 315,
  MOBILE_FACTOR: 0.47,        /* touch / narrow screens draw this share of the dots */
  SHELL_VIOLET: [1.55, 2.15], /* shell radius range, measured in orb radii (orb = 1) */
  SHELL_CYAN: [1.80, 2.60],
  DOT_VIOLET: 0.032,          /* dot size (in orb radii) */
  DOT_CYAN: 0.026,
  COLOR_VIOLET: [183, 148, 255],
  COLOR_CYAN: [22, 216, 255],
  SPEED: 1,                   /* 1 = original; 2 = twice as fast */
  TILT_Y: 0.25,               /* how far the shell leans sideways toward the pointer */
  TILT_X: 0.18,
  REPEL_RADIUS: 120,          /* px around the pointer that pushes dots away */
  REPEL_FORCE: 7,             /* push strength (0 = off) */
  BEAT_SWELL: 0.07,           /* shell grows by this much on a beat (0 = off) */
  ONLY_WHEN_PLAYING: false,   /* true = dots only appear while the music plays */
  MAX_DPR: 2,
};

const host = document.querySelector(".hero-visual");
const orb = document.getElementById("tmOrb");
if (!host || !orb || !document.createElement("canvas").getContext) return;

/* ------------------------------ DOM + CSS ------------------------------ */
const css = document.createElement("style");
css.textContent =
  ".hero-visual{position:relative;isolation:isolate;overflow:visible}" +
  ".tm-oa{position:absolute;left:50%;top:50%;width:150%;height:150%;transform:translate(-50%,-50%);" +
  "pointer-events:none;display:block}" +
  ".tm-oa.back{z-index:0}.tm-oa.front{z-index:4}";
document.head.appendChild(css);

const mk = cls => {
  const c = document.createElement("canvas");
  c.className = "tm-oa " + cls;
  c.setAttribute("aria-hidden", "true");
  return c;
};
const back = mk("back"), front = mk("front");
host.insertBefore(back, host.firstChild);
host.appendChild(front);
const bx = back.getContext("2d"), fx = front.getContext("2d");

/* ------------------------------ dots ------------------------------ */
const coarse = innerWidth <= 900 || matchMedia("(pointer: coarse)").matches;
const factor = coarse ? CFG.MOBILE_FACTOR : 1;
const rnd = (a, b) => a + Math.random() * (b - a);

const makeSet = (n, shell, size, color, dir, spin) => {
  const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n);
  const tw = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const th = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
    const r = rnd(shell[0], shell[1]);
    x[i] = r * Math.sin(phi) * Math.cos(th);
    y[i] = r * Math.sin(phi) * Math.sin(th);
    z[i] = r * Math.cos(phi);
    tw[i] = rnd(0.6, 1.4);            /* per-dot size variation */
    ph[i] = rnd(0, Math.PI * 2);      /* twinkle phase */
  }
  return {
    n, x, y, z, tw, ph, size, color, dir, spin,
    ox: new Float32Array(n), oy: new Float32Array(n),   /* pointer push offset (px) */
    vx: new Float32Array(n), vy: new Float32Array(n),
  };
};
const sets = [
  makeSet(Math.round(CFG.COUNT_VIOLET * factor), CFG.SHELL_VIOLET, CFG.DOT_VIOLET, CFG.COLOR_VIOLET, 1, 0.08),
  makeSet(Math.round(CFG.COUNT_CYAN * factor), CFG.SHELL_CYAN, CFG.DOT_CYAN, CFG.COLOR_CYAN, -1, 0.11),
];

/* soft round sprite per colour (pre-rendered once) */
const sprite = ([r, g, b]) => {
  const c = document.createElement("canvas"); c.width = c.height = 48;
  const x = c.getContext("2d"), gr = x.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.35, `rgba(${r},${g},${b},.75)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 48, 48);
  return c;
};
sets.forEach(s => { s.sprite = sprite(s.color); });

/* ------------------------------ sizing ------------------------------ */
const CAM_Z = 6.2;
let W = 1, H = 1, dpr = 1, F = 1;
const resize = () => {
  const r = back.getBoundingClientRect();
  W = Math.max(1, r.width); H = Math.max(1, r.height);
  dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : CFG.MAX_DPR);
  [back, front].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
  const orbR = Math.max(40, (orb.offsetWidth || 190) / 2);   /* the shell is sized from the real orb, so it hugs it at any screen size */
  F = orbR * CAM_Z;                                /* 1 orb radius = orbR px at the orb's depth */
};
resize();
"ResizeObserver" in window ? new ResizeObserver(resize).observe(host) : addEventListener("resize", resize);

/* ------------------------------ pointer ------------------------------ */
let tx = 0, ty = 0, mx = 0, my = 0;      /* normalised pointer (-1..1) and its smoothed value */
let px = null, py = null;                /* pointer in canvas px, null = away */
addEventListener("pointermove", e => {
  const hr = host.getBoundingClientRect();
  tx = Math.max(-1.2, Math.min(1.2, ((e.clientX - hr.left) / hr.width - 0.5) * 2));
  ty = Math.max(-1.2, Math.min(1.2, ((e.clientY - hr.top) / hr.height - 0.5) * 2));
  const cr = back.getBoundingClientRect();
  px = e.clientX - cr.left; py = e.clientY - cr.top;
}, { passive: true });
const away = () => { px = py = null; };
addEventListener("pointerup", e => { if (e.pointerType !== "mouse") away(); }, { passive: true });
document.addEventListener("pointerleave", away);
addEventListener("blur", away);

/* ------------------------------ loop ------------------------------ */
const playing = () => orb.classList.contains("is-playing") || orb.getAttribute("aria-pressed") === "true";
let visible = true, running = false, last = 0, t = 0, vis = CFG.ONLY_WHEN_PLAYING ? 0 : 1;

const frame = now => {
  if (!running) return;
  requestAnimationFrame(frame);
  if (!visible || document.hidden) { last = now; return; }
  const dt = Math.min(0.05, Math.max(0.001, (now - (last || now)) / 1000)); last = now;

  const beat = Math.max(0, Math.min(1, parseFloat(orb.style.getPropertyValue("--beat")) || 0));
  const on = playing();
  const goal = CFG.ONLY_WHEN_PLAYING ? (on ? 1 : 0) : 1;
  vis += (goal - vis) * 0.05;
  t += dt * CFG.SPEED * (1 + (on ? beat * 0.8 : 0));
  mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;

  bx.setTransform(dpr, 0, 0, dpr, 0, 0); fx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bx.clearRect(0, 0, W, H); fx.clearRect(0, 0, W, H);
  if (vis < 0.01) return;
  bx.globalCompositeOperation = fx.globalCompositeOperation = "lighter";

  const gy = t * 0.12 + mx * CFG.TILT_Y, gx = my * CFG.TILT_X;       /* group rotation */
  const camX = mx * 0.2, camY = -my * 0.14;                           /* camera parallax */
  const swell = 1 + beat * CFG.BEAT_SWELL;
  const glow = (0.82 + (on ? 0.12 : 0) + beat * 0.3) * vis;
  const cx = W / 2, cy = H / 2;
  const R = CFG.REPEL_RADIUS, R2 = R * R, hasPtr = px !== null && CFG.REPEL_FORCE > 0;

  for (let si = 0; si < sets.length; si++) {
    const s = sets[si];
    const ay = gy + s.dir * t * s.spin;                               /* inner + group turn about Y */
    const cY = Math.cos(ay), sY = Math.sin(ay), cX = Math.cos(gx), sX = Math.sin(gx);
    const sp = s.sprite, baseA = si === 0 ? 0.85 : 0.7;
    for (let i = 0; i < s.n; i++) {
      /* rotate about Y, then about X */
      const x0 = s.x[i] * cY + s.z[i] * sY, z0 = -s.x[i] * sY + s.z[i] * cY, y0 = s.y[i];
      const y1 = y0 * cX - z0 * sX, z1 = y0 * sX + z0 * cX;
      const X = x0 * swell - camX, Y = y1 * swell - camY, Z = z1 * swell;
      const depth = CAM_Z - Z; if (depth < 0.5) continue;
      const k = F / depth;
      let sx = cx + X * k, sy = cy - Y * k;

      /* pointer push (screen space, springy) */
      if (hasPtr) {
        const dx = sx + s.ox[i] - px, dy = sy + s.oy[i] - py, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2), f = (1 - d / R); const push = f * f * CFG.REPEL_FORCE;
          s.vx[i] += dx / d * push; s.vy[i] += dy / d * push;
        }
      }
      s.vx[i] += -s.ox[i] * 0.06; s.vy[i] += -s.oy[i] * 0.06;
      s.vx[i] *= 0.88; s.vy[i] *= 0.88;
      s.ox[i] += s.vx[i]; s.oy[i] += s.vy[i];
      sx += s.ox[i]; sy += s.oy[i];

      const tw = 0.75 + 0.25 * Math.sin(t * 1.6 * s.tw[i] + s.ph[i]);   /* gentle twinkle */
      const dia = s.size * k * s.tw[i] * 2.2;                            /* dot + soft halo */
      const depthFade = 0.55 + 0.45 * ((Z + 2.7) / 5.4);                 /* far side dimmer */
      const ctx2 = Z > 0 ? fx : bx;
      ctx2.globalAlpha = Math.min(1, baseA * tw * depthFade * glow);
      ctx2.drawImage(sp, sx - dia / 2, sy - dia / 2, dia, dia);
    }
  }
  bx.globalAlpha = fx.globalAlpha = 1;
};

const start = () => { if (running) return; running = true; last = 0; requestAnimationFrame(frame); };
if ("IntersectionObserver" in window) {
  new IntersectionObserver(es => { visible = !!(es[0] && es[0].isIntersecting); }, { threshold: 0 }).observe(host);
}
document.addEventListener("visibilitychange", () => { last = 0; });
start();
})();
