/* TIAMO — Enhance: Lenis smooth scroll + Hero Three.js + gallery tilt + creation field
   Independent of script.js / motion.js. Safe to remove if needed. */
(() => {
  "use strict";
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => innerWidth <= 900 || matchMedia("(pointer: coarse)").matches;

  /* =========================================================
     1 · LENIS — silky global scroll (nav anchors + sticky safe)
     ========================================================= */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => res();
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  let lenis = null;
  async function initLenis() {
    if (reduced()) return;
    try {
      if (!window.Lenis) {
        await loadScript("https://cdn.jsdelivr.net/npm/lenis@1.3.11/dist/lenis.min.js");
      }
      if (!window.Lenis) return;
      lenis = new window.Lenis({
        autoRaf: true,
        anchors: true,
        autoToggle: true,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.4,
        duration: 1.15,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        prevent: (node) =>
          !!(node && node.closest && node.closest(
            "[data-lenis-prevent], .media-lightbox, .ba-stage, .ba-thumbs, .lightbox-stage, input, textarea, select"
          )),
      });
      document.documentElement.classList.add("lenis", "lenis-smooth");

      /* keep hash nav working with sticky header offset */
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
          const id = a.getAttribute("href");
          if (!id || id === "#" || !lenis) return;
          const el = document.querySelector(id);
          if (!el) return;
          e.preventDefault();
          const header = document.querySelector(".site-header");
          const offset = -((header && header.offsetHeight) || 72) - 12;
          lenis.scrollTo(el, { offset, duration: 1.2 });
        });
      });

      /* pause when lightbox open */
      const mo = new MutationObserver(() => {
        if (!lenis) return;
        if (document.body.classList.contains("lightbox-open")) lenis.stop();
        else lenis.start();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    } catch (_) {}
  }

  /* =========================================================
     2 · HERO — lightweight Three.js orbits + particle cloud
        (CSS orbits hide when canvas is ready; TM music orb stays)
     ========================================================= */
  async function initHeroGL() {
    const host = document.querySelector(".hero-visual");
    if (!host || reduced()) return;

    try {
      if (!window.THREE) {
        await loadScript("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.min.js");
      }
      const THREE = window.THREE;
      if (!THREE) return;

      const canvas = document.createElement("canvas");
      canvas.className = "tm-hero-gl";
      canvas.setAttribute("aria-hidden", "true");
      host.insertBefore(canvas, host.firstChild);
      host.classList.add("has-webgl");

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile() ? 1.25 : 1.75));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.z = 6.2;

      const group = new THREE.Group();
      scene.add(group);

      /* particle sphere */
      const count = mobile() ? 420 : 900;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 2.15 + Math.random() * 0.55;
        pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i * 3 + 2] = r * Math.cos(phi);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({
        size: mobile() ? 0.028 : 0.022,
        color: 0xb794ff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(pGeo, pMat);
      group.add(points);

      /* cyan accent dust */
      const pos2 = new Float32Array(Math.floor(count * 0.35) * 3);
      for (let i = 0; i < pos2.length / 3; i++) {
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
        const r = 2.4 + Math.random() * 0.7;
        pos2[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos2[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos2[i * 3 + 2] = r * Math.cos(phi);
      }
      const pGeo2 = new THREE.BufferGeometry();
      pGeo2.setAttribute("position", new THREE.BufferAttribute(pos2, 3));
      const points2 = new THREE.Points(
        pGeo2,
        new THREE.PointsMaterial({
          size: 0.018,
          color: 0x16d8ff,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      group.add(points2);

      /* orbital rings (line loops) */
      function ring(radius, color, tiltX, tiltZ) {
        const segs = 128;
        const arr = [];
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          arr.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
        const m = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const line = new THREE.Line(g, m);
        line.rotation.x = tiltX;
        line.rotation.z = tiltZ;
        group.add(line);
        return line;
      }
      const r1 = ring(2.55, 0x8b35ff, 0.55, 0.15);
      const r2 = ring(2.9, 0x16d8ff, -0.35, -0.4);
      const r3 = ring(3.25, 0xc4b5fd, 1.05, 0.2);

      let w = 0, h = 0;
      const resize = () => {
        const rect = host.getBoundingClientRect();
        w = Math.max(1, rect.width);
        h = Math.max(1, rect.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      new ResizeObserver(resize).observe(host);

      let mx = 0, my = 0, tx = 0, ty = 0;
      const onMove = (e) => {
        const rect = host.getBoundingClientRect();
        tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      };
      host.addEventListener("pointermove", onMove, { passive: true });

      let visible = true;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (es) => { visible = es[0] && es[0].isIntersecting; },
          { threshold: 0.05 }
        ).observe(host);
      }

      let t0 = performance.now();
      const tick = (now) => {
        requestAnimationFrame(tick);
        if (!visible) return;
        const t = (now - t0) * 0.001;
        mx += (tx - mx) * 0.06;
        my += (ty - my) * 0.06;

        group.rotation.y = t * 0.12 + mx * 0.25;
        group.rotation.x = my * 0.18;
        points.rotation.y = t * 0.08;
        points2.rotation.y = -t * 0.11;
        r1.rotation.z = t * 0.2;
        r2.rotation.z = -t * 0.15;
        r3.rotation.y = t * 0.1;

        camera.position.x = mx * 0.35;
        camera.position.y = -my * 0.25;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };
      requestAnimationFrame(tick);
    } catch (_) {
      /* keep CSS orbits if WebGL fails */
      host.classList.remove("has-webgl");
    }
  }

  /* =========================================================
     3 · GALLERY — soft 3D tilt toward pointer
     ========================================================= */
  function initGalleryTilt() {
    if (reduced() || matchMedia("(hover: none)").matches) return;
    const cards = document.querySelectorAll(".gallery-card");
    cards.forEach((card) => {
      card.classList.add("tm-tilt");
      let raf = 0, lx = 0, ly = 0;
      const apply = () => {
        raf = 0;
        card.style.transform =
          `perspective(1100px) rotateY(${lx * 7}deg) rotateX(${-ly * 6}deg) translateY(-4px)`;
      };
      card.addEventListener(
        "pointermove",
        (e) => {
          const r = card.getBoundingClientRect();
          lx = (e.clientX - r.left) / r.width - 0.5;
          ly = (e.clientY - r.top) / r.height - 0.5;
          if (!raf) raf = requestAnimationFrame(apply);
        },
        { passive: true }
      );
      card.addEventListener(
        "pointerleave",
        () => {
          lx = 0;
          ly = 0;
          card.style.transform = "";
        },
        { passive: true }
      );
    });
  }

  /* =========================================================
     4 · AI CREATION — soft flowing energy field (2D canvas)
        lighter than a full shader, same visual idea
     ========================================================= */
  function initCreationField() {
    const sec = document.getElementById("creation");
    if (!sec || reduced()) return;
    const c = document.createElement("canvas");
    c.className = "tm-fx-canvas";
    c.setAttribute("aria-hidden", "true");
    sec.insertBefore(c, sec.firstChild);
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, visible = false;
    const resize = () => {
      const r = sec.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width));
      H = Math.max(1, Math.floor(r.height));
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      c.width = W * dpr;
      c.height = H * dpr;
      c.style.width = W + "px";
      c.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    new ResizeObserver(resize).observe(sec);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (es) => { visible = !!(es[0] && es[0].isIntersecting); },
        { threshold: 0.08 }
      ).observe(sec);
    } else visible = true;

    const blobs = [
      { x: 0.2, y: 0.3, r: 0.35, c: "139,53,255", s: 0.15 },
      { x: 0.75, y: 0.45, r: 0.4, c: "22,216,255", s: 0.12 },
      { x: 0.5, y: 0.7, r: 0.3, c: "180,120,255", s: 0.1 },
    ];
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!visible || !W) return;
      const t = now * 0.00025;
      ctx.clearRect(0, 0, W, H);
      blobs.forEach((b, i) => {
        const x = (b.x + Math.sin(t + i) * 0.08) * W;
        const y = (b.y + Math.cos(t * 0.9 + i) * 0.06) * H;
        const rad = b.r * Math.min(W, H);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${b.c},0.35)`);
        g.addColorStop(0.45, `rgba(${b.c},0.12)`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    requestAnimationFrame(tick);
  }

  /* =========================================================
     5 · ABOUT photo — light parallax depth (desktop only)
     ========================================================= */
  function initAboutParallax() {
    if (reduced() || mobile()) return;
    const photo = document.querySelector("#about .about-photo");
    const sec = document.getElementById("about");
    if (!photo || !sec) return;
    sec.addEventListener(
      "pointermove",
      (e) => {
        const r = sec.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        photo.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg) translateZ(0)`;
      },
      { passive: true }
    );
    sec.addEventListener(
      "pointerleave",
      () => { photo.style.transform = ""; },
      { passive: true }
    );
  }

  /* boot after DOM ready */
  const boot = () => {
    initLenis();
    initHeroGL();
    initGalleryTilt();
    initCreationField();
    initAboutParallax();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
