/* TIAMO — Enhance: Lenis smooth scroll + Hero Three.js + gallery tilt + creation field
   Independent of script.js / motion.js. Safe to remove if needed. */
(() => {
  "use strict";
  const reduced = () => false; /* project policy (README + script.js): animations always run, whatever the OS reduce-motion setting is */
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
      /* Lando-style inertia: longer ease-out, responsive wheel */
      lenis = new window.Lenis({
        autoRaf: true,
        anchors: false,
        autoToggle: true,
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.35,
        wheelMultiplier: 1.05,
        duration: 1.35,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -11 * t)),
        prevent: (node) =>
          !!(node && node.closest && node.closest(
            "[data-lenis-prevent], .media-lightbox, .ba-stage, .ba-thumbs, .lightbox-stage, input, textarea, select"
          )),
      });
      window.__lenis = lenis;
      document.documentElement.classList.add("lenis", "lenis-smooth", "tm-scroll-live");

      /* Lenis moves the real scroll position, so the browser already fires genuine "scroll" events.
         (A synthetic dispatchEvent("scroll") here re-triggered Lenis itself → endless recursion → "Maximum call stack size exceeded".) */
      lenis.on("scroll", (e) => {
        try { window.__tmOnLenis && window.__tmOnLenis(e); } catch (_) {}
      });

      /* pause when lightbox open */
      const mo = new MutationObserver(() => {
        if (!lenis) return;
        if (document.body.classList.contains("lightbox-open")) lenis.stop();
        else lenis.start();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

      /* after language / direction change: recalc dimensions so Contact lands correctly */
      new MutationObserver(() => {
        try { lenis.resize(); } catch (_) {}
        setTimeout(() => { try { lenis.resize(); } catch (_) {} }, 200);
        setTimeout(() => { try { lenis.resize(); } catch (_) {} }, 600);
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
    } catch (_) {}
  }

  /* =========================================================
     2 · HERO — lightweight Three.js orbits + particle cloud
        (CSS orbits hide when canvas is ready; TM music orb stays)
     ========================================================= */
  async function initHeroGL() {
    /* Free asteroid field across the WHOLE hero (under the text too, no box).
       The original CSS orbits stay exactly as they were; the asteroids only appear while the music plays. */
    const hero = document.querySelector(".hero");
    const host = document.querySelector(".hero-visual");
    const orb = document.getElementById("tmOrb");
    if (!hero || !host || !orb || reduced()) return;

    try {
      const THREE = window.THREE || (await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js"));
      if (!THREE) return;

      const canvas = document.createElement("canvas");
      canvas.className = "tm-hero-space";
      canvas.setAttribute("aria-hidden", "true");
      /* the hero itself clips horizontally (overflow-x: clip), so the canvas lives in <main> right before it */
      const mainEl = hero.parentElement;
      mainEl.insertBefore(canvas, hero);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile() ? 1.5 : 2));
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1500, 1500);
      camera.position.z = 700;
      scene.add(new THREE.AmbientLight(0x9a86ff, 1.1));
      const sun = new THREE.DirectionalLight(0xffffff, 2.6);
      sun.position.set(-320, 420, 560);
      scene.add(sun);
      const rim = new THREE.PointLight(0x16d8ff, 3.2, 1400, 1.0);
      rim.position.set(0, 0, 260);
      scene.add(rim);

      const world = new THREE.Group();
      scene.add(world);

      /* three rock shapes, each a roughened icosahedron */
      const rnd = (a, b) => a + Math.random() * (b - a);
      const makeRock = () => {
        const g = new THREE.IcosahedronGeometry(1, 1);
        const pos = g.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const k = rnd(0.72, 1.2);
          pos.setXYZ(v, pos.getX(v) * k, pos.getY(v) * k * rnd(0.85, 1.1), pos.getZ(v) * k);
        }
        g.computeVertexNormals();
        return g;
      };
      const palette = [0xb794ff, 0x16d8ff, 0xe9dcff, 0x8b35ff, 0x7ef0ff, 0xffffff].map((c) => new THREE.Color(c));
      const N = mobile() ? 42 : 96;
      const variants = 3;
      const meshes = [];
      const rocks = [];
      for (let v = 0; v < variants; v++) {
        const count = Math.floor(N / variants);
        const mesh = new THREE.InstancedMesh(
          makeRock(),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0.15, flatShading: true }),
          count
        );
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        for (let n = 0; n < count; n++) {
          const big = Math.random() < 0.1;
          rocks.push({
            mesh, n,
            rx: rnd(110, 760),
            ratio: rnd(0.2, 0.55),
            tilt: rnd(-0.75, 0.75),
            sp: rnd(0.035, 0.13) * (Math.random() < 0.5 ? -1 : 1),
            ph: rnd(0, Math.PI * 2),
            size: big ? rnd(8, 14) : rnd(2.2, 6.5),
            za: rnd(60, 320),
            zp: rnd(0, Math.PI * 2),
            tx: rnd(-0.8, 0.8), ty: rnd(-0.8, 0.8),
            rot: rnd(0, 6), ap: Math.random(),
          });
          mesh.setColorAt(n, palette[(Math.random() * palette.length) | 0]);
        }
        mesh.instanceColor.needsUpdate = true;
        mesh.frustumCulled = false;
        world.add(mesh);
        meshes.push(mesh);
      }

      /* fine dust */
      const sprite = (() => {
        const c = document.createElement("canvas");
        c.width = c.height = 64;
        const x = c.getContext("2d");
        const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.35, "rgba(190,160,255,.55)");
        g.addColorStop(1, "rgba(120,80,255,0)");
        x.fillStyle = g;
        x.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      })();
      const DUST = mobile() ? 120 : 280;
      const dPos = new Float32Array(DUST * 3);
      const dVel = new Float32Array(DUST);
      const dPh = new Float32Array(DUST);
      const dust = new THREE.Points(
        new THREE.BufferGeometry(),
        new THREE.PointsMaterial({
          size: mobile() ? 7 : 6, map: sprite, transparent: true, opacity: 0, depthWrite: false,
          blending: THREE.AdditiveBlending, sizeAttenuation: false, color: 0xcdbbff,
        })
      );
      dust.geometry.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
      dust.frustumCulled = false;
      world.add(dust);

      let w = 1, h = 1, cx = 0, cy = 0;
      const seedDust = () => {
        for (let d = 0; d < DUST; d++) {
          dPos[d * 3] = rnd(-w / 2, w / 2);
          dPos[d * 3 + 1] = rnd(-h / 2, h / 2);
          dPos[d * 3 + 2] = rnd(-300, 300);
          dVel[d] = rnd(4, 16);
          dPh[d] = rnd(0, 6.28);
        }
        dust.geometry.attributes.position.needsUpdate = true;
      };
      /* where the canvas sits and where the orb is — re-read every frame while playing, because the orb moves
         when the language flips (RTL puts it on the left) and when the layout changes */
      const place = () => {
        const r = hero.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        const mr = mainEl.getBoundingClientRect();
        const L = -mr.left, T = r.top - mr.top;
        if (Math.abs((parseFloat(canvas.style.left) || 0) - L) > 0.5) canvas.style.left = L + "px";
        if (Math.abs((parseFloat(canvas.style.top) || 0) - T) > 0.5) canvas.style.top = T + "px";
        cx = hr.left + hr.width / 2 - w / 2;
        cy = h / 2 - (hr.top + hr.height / 2 - r.top);
      };
      const resize = () => {
        /* canvas spans the full browser width (no box edges) and the full hero height */
        const r = hero.getBoundingClientRect();
        w = Math.max(1, document.documentElement.clientWidth);
        h = Math.max(1, r.height);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        renderer.setSize(w, h, false);
        camera.left = -w / 2; camera.right = w / 2; camera.top = h / 2; camera.bottom = -h / 2;
        camera.updateProjectionMatrix();
        place();
        seedDust();
      };
      resize();
      setTimeout(resize, 400);
      setTimeout(resize, 1600);
      new ResizeObserver(resize).observe(hero);
      addEventListener("resize", resize, { passive: true });

      let tx = 0, ty = 0, mx = 0, my = 0;
      addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });

      const playing = () => orb.classList.contains("is-playing") || orb.getAttribute("aria-pressed") === "true";
      let show = playing() ? 1 : 0;
      let k = 0;
      let visible = true;
      let running = false;
      let last = performance.now();
      let tAcc = 0;
      const dummy = new THREE.Object3D();
      const ease = (t) => 1 - Math.pow(1 - t, 3);

      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        k += (show - k) * (show ? 0.035 : 0.05);
        if (k < 0.004 && !show) {
          running = false;
          canvas.style.display = "none";
          return;
        }
        requestAnimationFrame(frame);
        if (!visible) return;

        place();
        const beat = Math.max(0, Math.min(1, parseFloat(orb.style.getPropertyValue("--beat")) || 0));
        tAcc += dt * (1 + beat * 1.6);
        mx += (tx - mx) * 0.05;
        my += (ty - my) * 0.05;
        world.position.x = mx * 22;
        world.position.y = -my * 14;
        rim.intensity = 2.2 + beat * 5;

        for (let q = 0; q < rocks.length; q++) {
          const o = rocks[q];
          const ap = ease(Math.max(0, Math.min(1, (k - o.ap * 0.55) / 0.45)));
          const a = o.ph + tAcc * o.sp * 6;
          const spread = 1 + (1 - ap) * 0.9;
          const ex = Math.cos(a) * o.rx * spread;
          const ey = Math.sin(a) * o.rx * o.ratio * spread;
          const ct = Math.cos(o.tilt), st = Math.sin(o.tilt);
          dummy.position.set(cx + ex * ct - ey * st, cy + ex * st + ey * ct, Math.sin(a * 0.7 + o.zp) * o.za);
          dummy.rotation.set(o.rot + tAcc * o.tx, o.rot * 0.7 + tAcc * o.ty, 0);
          dummy.scale.setScalar(o.size * ap * (1 + beat * 0.35));
          dummy.updateMatrix();
          o.mesh.setMatrixAt(o.n, dummy.matrix);
        }
        meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));

        for (let d = 0; d < DUST; d++) {
          let y = dPos[d * 3 + 1] + dVel[d] * dt;
          if (y > h / 2) { y = -h / 2; dPos[d * 3] = rnd(-w / 2, w / 2); }
          dPos[d * 3 + 1] = y;
        }
        dust.geometry.attributes.position.needsUpdate = true;
        dust.material.opacity = 0.75 * k * (0.8 + beat * 0.4);
        renderer.render(scene, camera);
      };
      const wake = () => {
        show = playing() ? 1 : 0;
        if (show && !running) {
          running = true;
          canvas.style.display = "block";
          last = performance.now();
          requestAnimationFrame(frame);
        }
      };
      new MutationObserver(wake).observe(orb, { attributes: true, attributeFilter: ["class", "aria-pressed"] });
      new MutationObserver(() => { resize(); setTimeout(resize, 350); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir"] });
      new IntersectionObserver((es) => { visible = !!(es[0] && es[0].isIntersecting); }, { threshold: 0 }).observe(hero);
      canvas.style.display = "none";
      wake();
    } catch (_) {
      /* WebGL or CDN unavailable → the CSS orbits simply stay as they are */
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
    const card = document.querySelector("#about .about-photo");
    const sec = document.getElementById("about");
    if (!card || !sec) return;
    /* tilt the picture only: the glass caption (backdrop-filter) must never sit inside a 3D-rotated ancestor, or Chrome drops it */
    const photo = card.querySelector("picture") || card;
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


  /* =========================================================
     6 · SCROLL VITALITY (Lando-inspired)
        — section progress parallax
        — title drift + scale
        — card depth while scrolling
        — velocity wash on html
     ========================================================= */
  function initScrollVitality() {
    if (reduced()) return;

    const sections = [
      ...document.querySelectorAll(
        ".hero, #about, #services, #work, #creation, #beforeafter, section.social-strip, #contact"
      ),
    ];
    const titles = [
      ...document.querySelectorAll(
        ".section-kicker, .section-title h2, .ba-copy h2, .social-strip h2, .contact h2, .cr-head h2"
      ),
    ];
    const cards = [
      ...document.querySelectorAll(
        ".gallery-card, .ba-viewer, .contact-btn"
      ),
    ];

    sections.forEach((s) => s.classList.add("tm-scroll-section"));
    titles.forEach((t) => t.classList.add("tm-scroll-title"));
    cards.forEach((c) => c.classList.add("tm-scroll-card"));

    let vel = 0;
    let lastY = window.scrollY || 0;
    let lastT = performance.now();
    let raf = 0;
    let dirty = true;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const map = (v, a, b, c, d) => c + ((v - a) / (b - a || 1)) * (d - c);

    const paint = () => {
      raf = 0;
      dirty = false;
      const vh = innerHeight || 1;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const now = performance.now();
      const dt = Math.max(8, now - lastT);
      const rawV = (y - lastY) / dt;
      vel += (rawV - vel) * 0.18;
      lastY = y;
      lastT = now;

      /* velocity class for subtle global energy */
      const absV = Math.abs(vel);
      document.documentElement.style.setProperty("--tm-vel", clamp(absV * 12, 0, 1).toFixed(3));
      document.documentElement.style.setProperty("--tm-vel-dir", vel >= 0 ? "1" : "-1");
      document.documentElement.classList.toggle("tm-scrolling", absV > 0.02);

      sections.forEach((sec) => {
        const r = sec.getBoundingClientRect();
        /* 0 = just entering bottom, 0.5 = center, 1 = leaving top */
        const progress = clamp(1 - (r.top + r.height * 0.35) / (vh + r.height * 0.35), 0, 1);
        const mid = (r.top + r.height * 0.5 - vh * 0.5) / vh;
        const visible = r.bottom > 0 && r.top < vh;
        sec.style.setProperty("--tm-sp", progress.toFixed(3));
        sec.style.setProperty("--tm-sm", clamp(mid, -1, 1).toFixed(3));
        sec.classList.toggle("tm-in-view", visible);
      });

      titles.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        const mid = (r.top + r.height * 0.5 - vh * 0.5) / vh;
        /* gentle drift only — never push titles under the fixed header */
        const yShift = clamp(-mid * 14, -18, 18);
        const op = clamp(1 - Math.abs(mid) * 0.18, 0.82, 1);
        el.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
        el.style.opacity = op.toFixed(3);
      });

      /* depth on cards: slight lift as they cross the optical center */
      if (!matchMedia("(pointer: coarse)").matches) {
        cards.forEach((el) => {
          if (el.classList.contains("tm-tilt") && el.matches(":hover")) return;
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          const mid = (r.top + r.height * 0.5 - vh * 0.5) / vh;
          const lift = clamp(-Math.abs(mid) * 6 + 4, -2, 8);
          const scale = clamp(1 - Math.abs(mid) * 0.025, 0.97, 1.02);
          el.style.translate = `0 ${lift.toFixed(1)}px`;
          el.style.scale = scale.toFixed(3);
        });
      }
    };

    const requestPaint = () => {
      dirty = true;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.__tmOnLenis = () => requestPaint();
    addEventListener("scroll", requestPaint, { passive: true });
    addEventListener("resize", requestPaint, { passive: true });
    requestPaint();

    /* gentle continuous settle while inertia runs */
    const settle = () => {
      requestAnimationFrame(settle);
      if (dirty || Math.abs(vel) > 0.005) requestPaint();
    };
    requestAnimationFrame(settle);
  }


  /* =========================================================
     7 · AI CREATION portal — scroll-linked scale / fly-in
        (Before/After intentionally untouched)
     ========================================================= */
  function initAiPortal() {
    if (reduced()) return;
    const wall = document.querySelector("#creation .cr-wall");
    const sec = document.getElementById("creation");
    if (!wall || !sec) return;

    const dirs = ["from-left", "from-right", "from-top", "from-bot", "from-scale"];

    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) {
                  e.target.classList.add("tm-portal-in");
                  io.unobserve(e.target);
                }
              });
            },
            { root: null, rootMargin: "15% 0px", threshold: 0.05 }
          )
        : null;

    const decorate = (tile, i) => {
      if (!tile || tile.dataset.tmPortal) return;
      tile.dataset.tmPortal = "1";
      tile.classList.add("tm-portal-item", dirs[i % dirs.length]);
      tile.style.setProperty("--tm-pi", String(i % 10));
      /* already on screen → animate in after a tick so the transition is visible */
      const r = tile.getBoundingClientRect();
      const vh = innerHeight || 1;
      if (r.top < vh * 0.95 && r.bottom > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => tile.classList.add("tm-portal-in"));
        });
      } else if (io) {
        io.observe(tile);
      } else {
        tile.classList.add("tm-portal-in");
      }
    };

    const scan = () => {
      [...wall.querySelectorAll(".cr-tile")].forEach((t, i) => decorate(t, i));
    };
    scan();
    let moT = 0;
    new MutationObserver(() => {
      clearTimeout(moT);
      moT = setTimeout(scan, 100);
    }).observe(wall, { childList: true, subtree: true });

    /* section alive flag + single-element depth (cheap) */
    const secIo = new IntersectionObserver(
      (es) => {
        const on = es[0].isIntersecting;
        sec.classList.toggle("tm-alive", on);
        if (!on) return;
      },
      { threshold: 0.12 }
    );
    secIo.observe(sec);

    let raf = 0;
    const onScroll = () => {
      if (!sec.classList.contains("tm-alive")) return;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = sec.getBoundingClientRect();
        const vh = innerHeight || 1;
        const mid = (r.top + r.height * 0.35 - vh * 0.5) / vh;
        const depth = Math.max(-1, Math.min(1, mid));
        sec.style.setProperty("--tm-depth", depth.toFixed(3));
        /* mild scale on the wall only — one node, no per-tile work */
        const sc = 1 + Math.abs(depth) * 0.02;
        wall.style.setProperty("--tm-wall-sc", sc.toFixed(4));
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    if (window.__lenis) {
      window.__tmOnLenis = ((prev) => (e) => {
        try {
          prev && prev(e);
        } catch (_) {}
        onScroll();
      })(window.__tmOnLenis);
    }

    if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
      let mx = 0,
        my = 0,
        pr = 0;
      sec.addEventListener(
        "pointermove",
        (e) => {
          if (!sec.classList.contains("tm-alive")) return;
          const r = sec.getBoundingClientRect();
          mx = ((e.clientX - r.left) / r.width - 0.5) * 16;
          my = ((e.clientY - r.top) / r.height - 0.5) * 12;
          if (!pr) {
            pr = requestAnimationFrame(() => {
              pr = 0;
              sec.style.setProperty("--tm-mx", mx.toFixed(1) + "px");
              sec.style.setProperty("--tm-my", my.toFixed(1) + "px");
            });
          }
        },
        { passive: true }
      );
    }

    /* Lenis pause while AI viewer open */
    const view = document.querySelector(".cr-view");
    if (view) {
      const syncLenis = () => {
        const open = view.classList.contains("open");
        try {
          if (window.__lenis) {
            if (open) window.__lenis.stop();
            else window.__lenis.start();
          }
        } catch (_) {}
        document.body.classList.toggle("tm-cr-view-open", open);
      };
      new MutationObserver(syncLenis).observe(view, {
        attributes: true,
        attributeFilter: ["class", "aria-hidden"],
      });
    }

    setTimeout(scan, 400);
    setTimeout(scan, 1500);
    setTimeout(scan, 3000);
    onScroll();
  }

  /* =========================================================
     8 · WORDS — scroll-linked word lighting (Lando-style)
        About paragraph + AI Creation paragraph. Safe with the AR/EN
        switch (script.js rewrites innerHTML → we re-split).
     ========================================================= */
  function initWords() {
    if (reduced()) return;
    const sels = [];   /* About paragraph: about-fx.js · AI Creation paragraph: creation-fx.js */
    const items = [];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const split = (it) => {
      const el = it.el;
      it.busy = true;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((n) => {
        if (!n.nodeValue.trim()) return;
        const frag = document.createDocumentFragment();
        n.nodeValue.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          const sp = document.createElement("span");
          sp.className = "tm-lw";
          sp.textContent = tok;
          frag.appendChild(sp);
        });
        n.parentNode.replaceChild(frag, n);
      });
      it.words = [...el.querySelectorAll(".tm-lw")];
      it.lit = 0;
      el.classList.add("tm-words");
      it.busy = false;
    };

    const paint = (it) => {
      const vh = innerHeight || 1;
      const r = it.el.getBoundingClientRect();
      let p;
      if (r.bottom < 0) p = 1;
      else if (r.top > vh) p = 0;
      else p = clamp((vh * 0.97 - r.top) / (vh * 0.04 + r.height), 0, 1); /* fully lit as soon as the whole paragraph is on screen (no extra scrolling needed) */
      const n = it.words.length;
      const lit = Math.round(p * n);
      if (lit === it.lit) return;
      for (let i = Math.min(lit, it.lit); i < Math.max(lit, it.lit); i++) {
        it.words[i] && it.words[i].classList.toggle("on", i < lit);
      }
      it.lit = lit;
    };

    sels.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        const it = { el, words: [], lit: 0, busy: false };
        items.push(it);
        split(it);
        /* language switch replaces innerHTML → split again */
        new MutationObserver(() => {
          if (it.busy || el.querySelector(".tm-lw")) return;
          split(it);
          paint(it);
        }).observe(el, { childList: true });
      });
    });
    if (!items.length) return;

    let raf = 0;
    const run = () => { raf = 0; items.forEach(paint); };
    const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick, { passive: true });
    kick();
  }

  /* =========================================================
     9 · AI CREATION — the glass frame "opens" as you arrive
        (starts as a smaller rounded card, expands to full width while the
        wall inside pulls back from a closer camera). Desktop / fine pointer only.
     ========================================================= */
  function initAiOpen() {
    if (reduced()) return;
    if (!matchMedia("(hover:hover) and (pointer:fine)").matches || innerWidth <= 900) return;
    const sec = document.getElementById("creation");
    if (!sec) return;
    let glass = null;
    let raf = 0;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const run = () => {
      raf = 0;
      glass = glass || sec.querySelector(".cr-glass");
      if (!glass) return;
      const vh = innerHeight || 1;
      const top = glass.getBoundingClientRect().top;
      /* 0 when the frame's top edge is at the bottom of the screen, 1 once it reached ~38% of the screen */
      const p = ease(clamp((vh * 0.98 - top) / (vh * 0.6), 0, 1));
      glass.style.setProperty("--ao", p.toFixed(3));
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", kick, { passive: true });
    setTimeout(kick, 300);
    setTimeout(kick, 1500);
    kick();
  }

  /* =========================================================
     10 · AI CREATION — scroll-driven fly-through
        The section pins and the works fly past in 3D depth while you scroll
        (mouse tilts the camera, click opens the existing viewer). The
        drifting wall below stays as the full archive.
     ========================================================= */
  function initAiFlight() {
    if (reduced()) return;
    const sec = document.getElementById("creation");
    const head = sec && sec.querySelector(".cr-head");
    const wall = sec && sec.querySelector(".cr-wall");
    if (!sec || !head || !wall) return;
    /* pinning needs body not to be a scroll container (see enhance.css: body{overflow-x:clip}) */
    if (!(window.CSS && CSS.supports && CSS.supports("overflow-x", "clip"))) return;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const frac = (x) => x - Math.floor(x);
    const coarse = () => innerWidth <= 900 || matchMedia("(pointer: coarse)").matches;
    const isAr = () => document.documentElement.lang === "ar";
    const STEP = 0.26; /* viewport heights of scrolling per artwork */

    let fly = null, stick = null, world = null, introEl = null, numEl = null, totEl = null, barEl = null;
    let cards = [], list = [], key = "";
    let vw = 1, vh = 1, GAP = 640, camTotal = 1;
    let cur = 0, mx = 0, my = 0, tmx = 0, tmy = 0, near = false, looping = false, focus = -1, hudIdx = -1;
    let guard = false, syncT = 0;

    const collect = () => {
      const out = [], seen = new Set();
      wall.querySelectorAll(".cr-tile:not([aria-hidden])").forEach((t) => {
        const k = t.dataset.k;
        if (!k || seen.has(k)) return;
        seen.add(k);
        const im = t.querySelector(".cr-img");
        const pb = parseFloat(im && im.style.paddingBottom) || 133;
        const nn = t.querySelector(".cr-num");
        out.push({ k, u: t.dataset.u, r: clamp(pb / 100, 0.5, 2.0), n: nn ? nn.textContent : "" });
      });
      return out.slice(0, 36);
    };

    const loadImg = (c) => {
      if (c.loading) return;
      c.loading = true;
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { c.img.style.backgroundImage = "url('" + c.it.u + "')"; c.el.classList.add("ld"); };
      im.src = c.it.u;
    };

    const openTile = (k) => {
      const t = wall.querySelector('.cr-tile[data-k="' + (window.CSS && CSS.escape ? CSS.escape(k) : k) + '"]');
      if (t) t.click();
    };

    const layout = () => {
      if (!fly) return;
      fly.style.marginLeft = "0px";
      fly.style.marginRight = "0px";
      vw = Math.max(1, document.documentElement.clientWidth);
      const r0 = fly.getBoundingClientRect();
      fly.style.marginLeft = -r0.left + "px";
      fly.style.marginRight = -(vw - r0.right) + "px";
      vh = Math.max(1, stick.clientHeight);
      const n = list.length;
      const D = Math.max(3 * vh, n * STEP * vh);
      fly.style.height = vh + D + "px";
      GAP = coarse() ? 520 : 640;
      camTotal = (n - 1 + 1.2) * GAP + 760;
      list.forEach((it, i) => {
        const c = cards[i];
        let bw = coarse() ? vw * 0.6 : clamp(vw * 0.24, 190, 400);
        let bh = bw * it.r;
        const maxH = vh * 0.58;
        if (bh > maxH) { bh = maxH; bw = bh / it.r; }
        const f1 = frac(Math.sin((i + 1) * 12.9898) * 43758.5453);
        const f2 = frac(Math.sin((i + 1) * 78.233) * 12345.6789);
        const ang = i * 2.39996 + 0.7;
        const rx = vw * (coarse() ? 0.27 : 0.31) * (0.75 + 0.45 * f1);
        const ry = vh * (coarse() ? 0.25 : 0.26) * (0.7 + 0.5 * f2);
        c.x = Math.cos(ang) * rx;
        c.y = Math.sin(ang) * ry;
        c.rz = (f1 - 0.5) * 10;
        c.yaw = -Math.cos(ang) * 13;
        c.el.style.width = bw.toFixed(1) + "px";
        c.el.style.height = bh.toFixed(1) + "px";
        c.el.style.marginLeft = (-bw / 2).toFixed(1) + "px";
        c.el.style.marginTop = (-bh / 2).toFixed(1) + "px";
      });
      if (totEl) totEl.textContent = "/ " + String(n).padStart(2, "0");
    };

    const frame = () => {
      if (!fly) return;
      const r = fly.getBoundingClientRect();
      const span = Math.max(1, r.height - vh);
      const p = clamp(-r.top / span, 0, 1);
      cur += (p - cur) * 0.16;
      if (Math.abs(p - cur) < 0.0004) cur = p;
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;
      world.style.transform = "rotateY(" + (mx * 6).toFixed(2) + "deg) rotateX(" + (-my * 4).toFixed(2) + "deg)";
      const camZ = cur * camTotal;
      let best = -1, bd = 1e9;
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const z = -(i + 1.2) * GAP + camZ;
        if (z < -3700 || z > 800) {
          if (c.on) { c.el.style.visibility = "hidden"; c.on = false; }
          continue;
        }
        if (!c.on) { c.el.style.visibility = "visible"; c.on = true; }
        if (!c.loading && z > -3400) loadImg(c);
        const o = clamp((z + 3700) / 1600, 0, 1) * (1 - clamp((z - 220) / 480, 0, 1));
        c.el.style.opacity = o.toFixed(3);
        c.el.style.transform = "translate3d(" + c.x.toFixed(1) + "px," + c.y.toFixed(1) + "px," + z.toFixed(1) + "px) rotateZ(" + c.rz.toFixed(2) + "deg) rotateY(" + c.yaw.toFixed(2) + "deg)";
        const d = Math.abs(z + 420);
        if (d < bd) { bd = d; best = i; }
      }
      if (best !== focus) {
        if (focus >= 0 && cards[focus]) cards[focus].el.classList.remove("focus");
        if (best >= 0) cards[best].el.classList.add("focus");
        focus = best;
      }
      if (best >= 0 && best !== hudIdx && numEl) {
        hudIdx = best;
        numEl.textContent = String(best + 1).padStart(2, "0");
      }
      barEl.style.transform = "scaleX(" + cur.toFixed(4) + ")";
      introEl.style.opacity = (1 - clamp(cur / 0.06, 0, 1)).toFixed(3);
    };

    const loop = () => {
      if (!near || !fly) { looping = false; return; }
      frame();
      requestAnimationFrame(loop);
    };
    const wake = () => { if (near && !looping) { looping = true; requestAnimationFrame(loop); } };

    const build = () => {
      if (fly) { fly.remove(); fly = null; }
      cards = []; focus = -1; hudIdx = -1;
      if (list.length < 6) return; /* too few works: keep only the wall */
      fly = document.createElement("div");
      fly.className = "tm-fly";
      fly.setAttribute("aria-label", "AI artwork fly-through");
      const touch = matchMedia("(hover: none)").matches;
      const hintEN = touch ? "SWIPE TO FLY · TAP TO OPEN" : "SCROLL TO FLY · CLICK TO OPEN";
      const hintAR = touch ? "اسحب للتحليق · اضغط للفتح" : "مرّر للتحليق · اضغط للفتح";
      fly.innerHTML =
        '<div class="tm-fly-stick">' +
        '<div class="tm-fly-fx" aria-hidden="true"></div>' +
        '<div class="tm-fly-world"></div>' +
        '<div class="tm-fly-intro" aria-hidden="true"><b data-en="ENTER THE WORLD" data-ar="ادخل إلى العالم">' + (isAr() ? "ادخل إلى العالم" : "ENTER THE WORLD") + '</b>' +
        '<span data-en="' + (touch ? "SWIPE DOWN" : "SCROLL DOWN") + '" data-ar="' + (touch ? "اسحب للأسفل" : "مرّر للأسفل") + '">' + (isAr() ? (touch ? "اسحب للأسفل" : "مرّر للأسفل") : (touch ? "SWIPE DOWN" : "SCROLL DOWN")) + '</span></div>' +
        '<div class="tm-fly-hud"><div class="tm-fly-count"><b>01</b><span>/ 00</span></div>' +
        '<div class="tm-fly-bar"><i></i></div>' +
        '<div class="tm-fly-hint"><i></i><span data-en="' + hintEN + '" data-ar="' + hintAR + '">' + (isAr() ? hintAR : hintEN) + "</span></div></div>" +
        "</div>";
      head.after(fly);
      stick = fly.querySelector(".tm-fly-stick");
      world = fly.querySelector(".tm-fly-world");
      introEl = fly.querySelector(".tm-fly-intro");
      numEl = fly.querySelector(".tm-fly-count b");
      totEl = fly.querySelector(".tm-fly-count span");
      barEl = fly.querySelector(".tm-fly-bar i");
      list.forEach((it, i) => {
        const el = document.createElement("div");
        el.className = "tm-fc";
        el.setAttribute("role", "img");
        el.setAttribute("aria-label", "AI artwork " + it.n);
        el.innerHTML = '<div class="tm-fc-in"><div class="tm-fc-img"></div></div><span class="tm-fc-num">' + String(it.n).padStart(2, "0") + '</span><div class="tm-fc-guard"></div>';
        el.addEventListener("click", () => openTile(it.k));
        el.addEventListener("contextmenu", (e) => e.preventDefault());
        world.appendChild(el);
        cards.push({ el, img: el.querySelector(".tm-fc-img"), it, on: false, loading: false, x: 0, y: 0, rz: 0, yaw: 0 });
      });
      layout();
      cards.slice(0, 4).forEach(loadImg);
      if (!coarse()) {
        stick.addEventListener("pointermove", (e) => {
          const b = stick.getBoundingClientRect();
          tmx = ((e.clientX - b.left) / b.width - 0.5) * 2;
          tmy = ((e.clientY - b.top) / b.height - 0.5) * 2;
        }, { passive: true });
        stick.addEventListener("pointerleave", () => { tmx = 0; tmy = 0; }, { passive: true });
      }
      new IntersectionObserver((es) => { near = !!(es[0] && es[0].isIntersecting); wake(); }, { rootMargin: "30% 0px 30% 0px" }).observe(fly);
      /* page height changed → let the other scroll-aware code (contact snap, Lenis) re-measure */
      setTimeout(() => {
        try { window.__lenis && window.__lenis.resize(); } catch (_) {}
        guard = true;
        try { dispatchEvent(new Event("resize")); } catch (_) {}
        guard = false;
      }, 80);
    };

    const sync = () => {
      const next = collect();
      const k = next.map((x) => x.k).join("|");
      if (k === key) return;
      key = k;
      list = next;
      build();
    };
    const schedule = () => { clearTimeout(syncT); syncT = setTimeout(sync, 700); };
    new MutationObserver(schedule).observe(wall, { childList: true, subtree: true });
    schedule();
    setTimeout(sync, 2500);
    addEventListener("resize", () => { if (!guard) layout(); }, { passive: true });
  }

  /* boot after DOM ready */
  const boot = () => {
    initLenis();
    initScrollVitality();
    /* initHeroGL(); — the cartoon asteroid field is retired: the carved medallion lights up with the music instead (tm-intro.js) */
    initGalleryTilt();
    initCreationField();
    initAboutParallax();
    initAiPortal();
    initWords();
    initAiOpen();
    initAiFlight();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();


/* =====================================================================
   HOME ENTRANCE + ABOUT GLASS TITLE  (v6)
   - Home: music orb glides in from the right, the big title drops from under
     the top bar word by word, the copy + both buttons arrive from the left in
     sequence and meet in their natural place. Replays on scroll / nav return.
   - About: the headline is veiled by crystal-glass blocks (white / purple, each
     tinted like the text beneath) that retract line by line.
   Everything is transform/opacity only (no layout change). If this block ever
   fails, the original behaviour is untouched (CSS is gated by html.tm-hero-armed).
   ===================================================================== */
(() => {
  "use strict";
  const EXPO = "cubic-bezier(.16,1,.3,1)";
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const isRtl = () => (document.documentElement.getAttribute("dir") || document.body.getAttribute("dir") || "") === "rtl";
  const hasTranslate = !!(window.CSS && CSS.supports && CSS.supports("translate", "1px 1px"));
  const slideKF = (x) => hasTranslate
    ? [{ translate: x + " 0" }, { translate: "0 0" }]
    : [{ transform: "translateX(" + x + ")" }, { transform: "translateX(0)" }];

  /* ---------------------------- HOME ---------------------------- */
  function initHomeEntrance() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const h1 = hero.querySelector("h1");
    const gate = () => document.getElementById("enterGate");
    let anims = [], clipT = 0, lastPlay = 0, left = false, armed = false;

    const stop = () => { anims.forEach((a) => { try { a.cancel(); } catch (_) {} }); anims = []; clearTimeout(clipT); cancelAnimationFrame(clipRaf); if (h1) h1.classList.remove("tm-clip"); };

    let clipRaf = 0;
    const play = (fast) => {
      const now = performance.now();
      if (now - lastPlay < 500) return;
      const K = fast ? 0.42 : 1; /* replays are quicker: no waiting when you scroll back to Home */
      lastPlay = now;
      stop();
      hero.classList.remove("tm-hin");
      const sx = isRtl() ? -1 : 1;
      const header = document.querySelector(".site-header");
      const hb = header ? header.getBoundingClientRect().bottom : 0;

      /* measure the words at rest (before any offset exists) */
      const words = h1 ? [...h1.querySelectorAll(".word")] : [];
      const dys = words.map((w) => {
        const r = w.getBoundingClientRect();
        return Math.min(-40, hb - r.top - r.height * 0.95 - 60); /* each word starts hidden behind the bar */
      });
      if (h1) {
        const clip = Math.max(0, hb - h1.getBoundingClientRect().top);
        h1.style.setProperty("--tm-clip", clip.toFixed(1) + "px");
        h1.classList.add("tm-clip");
      }
      hero.classList.add("tm-hin");

      const add = (el, kf, opt) => { if (!el) return; try { anims.push(el.animate(kf, Object.assign({ fill: "backwards", easing: EXPO }, opt))); } catch (_) {} };

      /* 1 · music orb — from the right */
      const vis = hero.querySelector(".hero-visual");
      add(vis, [
        { transform: "translateX(" + (sx * 62) + "vw)", opacity: 0 },
        { opacity: 1, offset: 0.22 },
        { transform: "translateX(0)", opacity: 1 }
      ], { duration: 1750 * (fast ? 0.7 : 1), delay: 0 });

      /* 2 · big title — drops from under the top bar, word by word */
      let titleEnd = 0;
      words.forEach((w, i) => {
        const d = (420 + i * 105) * K, dur = 1300 * (fast ? 0.75 : 1);
        titleEnd = Math.max(titleEnd, d + dur);
        add(w, [
          { transform: "translateY(" + dys[i].toFixed(1) + "px)", opacity: 0, filter: "blur(10px)" },
          { opacity: 1, offset: 0.2 },
          { transform: "translateY(0)", opacity: 1, filter: "blur(0px)" }
        ], { duration: dur, delay: d });
      });
      /* the clip follows the top bar while the page keeps scrolling */
      const follow = () => {
        if (!h1 || !h1.classList.contains("tm-clip")) return;
        const hb2 = header ? header.getBoundingClientRect().bottom : 0;
        h1.style.setProperty("--tm-clip", Math.max(0, hb2 - h1.getBoundingClientRect().top).toFixed(1) + "px");
        clipRaf = requestAnimationFrame(follow);
      };
      clipRaf = requestAnimationFrame(follow);
      clipT = setTimeout(() => { cancelAnimationFrame(clipRaf); if (h1) h1.classList.remove("tm-clip"); }, titleEnd + 120);

      /* 3 · copy + buttons — from the left, in sequence */
      const x = (sx * -62) + "vw";
      const seq = [
        [".eyebrow", 700 * K],
        [".role", 1150 * K],
        [".lead", 1320 * K],
        [".hero-actions .btn.primary", 1560 * K],
        [".hero-actions .btn.ghost", 1720 * K]
      ];
      seq.forEach(([sel, d]) => {
        const el = hero.querySelector(sel);
        const kf = slideKF(x).map((f, i) => Object.assign(f, i ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(9px)" }));
        add(el, kf, { duration: 1500 * (fast ? 0.75 : 1), delay: d });
      });
    };

    const arm = () => { armed = true; };
    const startFirst = () => { arm(); play(); };

    /* hook: the enter gate calls this when it opens */
    const orig = window.__restaggerHero;
    window.__restaggerHero = function () {
      try { if (typeof orig === "function") orig.apply(this, arguments); } catch (_) {}
      startFirst();
    };
    /* backup: the gate element disappears */
    if (gate()) {
      const mo = new MutationObserver(() => { if (!gate()) { mo.disconnect(); setTimeout(() => { if (!armed || !hero.classList.contains("tm-hin")) startFirst(); }, 260); } });
      mo.observe(document.body, { childList: true });
    }

    document.documentElement.classList.add("tm-hero-armed");
    if (!gate()) startFirst();

    /* replay when you come back to Home (scroll up or the nav button) */
    /* replay: starts the moment Home is coming back into view (no waiting) */
    new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!armed) return;
        if (e.intersectionRatio < 0.05) {
          if (!left) { left = true; stop(); hero.classList.remove("tm-hin"); }
        } else if (e.intersectionRatio >= 0.25 && left) {
          left = false; play(true);
        }
      });
    }, { threshold: [0, 0.05, 0.25] }).observe(hero);
  }

  /* ---------------------------- ABOUT ---------------------------- */
  function initAboutGlass() {
    return;   /* replaced by about-fx.js (one line-sweep system for the whole About block) */
    const host = document.querySelector("#about .section-title");
    const h2 = host && host.querySelector("h2");
    if (!h2) return;
    let wrap = null, lines = [], anims = [], played = false, timer = 0, rebuildT = 0;

    const cancel = () => { anims.forEach((a) => { try { a.cancel(); } catch (_) {} }); anims = []; clearTimeout(timer); };

    let build = () => {
      cancel();
      if (wrap) wrap.remove();
      wrap = document.createElement("span");
      wrap.className = "tm-gl-wrap";
      wrap.setAttribute("aria-hidden", "true");
      host.appendChild(wrap);
      lines = [];
      const hr = host.getBoundingClientRect();
      const rtl = getComputedStyle(h2).direction === "rtl";
      const words = [];
      const walker = document.createTreeWalker(h2, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (!n.nodeValue.trim()) continue;
        const pu = !!(n.parentElement && n.parentElement.closest("em"));
        const re = /\S+/g; let m;
        while ((m = re.exec(n.nodeValue))) {
          const rg = document.createRange();
          rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          for (const r of rg.getClientRects()) {
            if (r.width > 0.5 && r.height > 0.5) words.push({ l: r.left - hr.left, r: r.right - hr.left, t: r.top - hr.top, b: r.bottom - hr.top, pu });
          }
        }
      }
      if (!words.length) return;
      words.sort((a, b) => a.t - b.t);
      const rows = [];
      words.forEach((w) => {
        const row = rows[rows.length - 1];
        if (row && Math.abs(w.t - row.t) < (w.b - w.t) * 0.5) { row.w.push(w); row.b = Math.max(row.b, w.b); row.t = Math.min(row.t, w.t); }
        else rows.push({ t: w.t, b: w.b, w: [w] });
      });
      /* stacked, touching rows (no overlap) */
      for (let i = 0; i < rows.length - 1; i++) {
        if (rows[i].b > rows[i + 1].t) { const mid = (rows[i].b + rows[i + 1].t) / 2; rows[i].b = mid; rows[i + 1].t = mid; }
      }
      const PAD = 7;
      rows.forEach((row) => {
        row.w.sort((a, b) => a.l - b.l);
        const segs = [];
        row.w.forEach((w) => {
          const s = segs[segs.length - 1];
          if (s && s.pu === w.pu) s.r = w.r; else segs.push({ l: w.l, r: w.r, pu: w.pu });
        });
        segs[0].l -= PAD; segs[segs.length - 1].r += PAD;
        for (let i = 0; i < segs.length - 1; i++) { const mid = (segs[i].r + segs[i + 1].l) / 2; segs[i].r = mid; segs[i + 1].l = mid; }
        const els = segs.map((s) => {
          const seg = document.createElement("span");
          seg.className = "tm-gl-seg";
          seg.style.cssText = "left:" + s.l.toFixed(1) + "px;top:" + (row.t - 2).toFixed(1) + "px;width:" + (s.r - s.l).toFixed(1) + "px;height:" + (row.b - row.t + 4).toFixed(1) + "px";
          const gl = document.createElement("i");
          gl.className = "tm-gl " + (s.pu ? "pu" : "wh");
          seg.appendChild(gl); wrap.appendChild(seg);
          return gl;
        });
        lines.push({ els: rtl ? els.reverse() : els, rtl });
      });
      if (played) wrap.classList.add("done");
    };

    const play = () => {
      played = true;
      cancel();
      if (!wrap) build();
      wrap.classList.remove("done");
      let end = 0;
      lines.forEach((ln, li) => {
        ln.els.forEach((gl, si) => {
          const d = 160 + li * 230 + si * 120, dur = 1000;
          end = Math.max(end, d + dur);
          try {
            anims.push(gl.animate(
              [{ transform: "translateX(0)" }, { transform: "translateX(" + (ln.rtl ? "-" : "") + "104%)" }],
              { duration: dur, delay: d, easing: "cubic-bezier(.72,0,.16,1)", fill: "both" }
            ));
          } catch (_) { gl.style.visibility = "hidden"; }
        });
      });
      timer = setTimeout(() => { if (wrap) wrap.classList.add("done"); }, end + 80);
    };

    const reset = () => {
      played = false;
      cancel();
      if (wrap) wrap.classList.remove("done");
    };

    build();
    /* the glass must be SEEN: while the headline is still entering from the bottom it stays veiled and
       the reveal starts once it is in the upper part of the screen (or when the reader stops scrolling) */
    let seenT = 0, ratio = 0, rafC = 0;
    const check = () => {
      rafC = 0;
      if (played || ratio === 0) return;
      const r = h2.getBoundingClientRect();
      if (r.top <= innerHeight * 0.62 && r.bottom > 0) { clearTimeout(seenT); play(); }
    };
    const kick = () => {
      if (played) return;
      if (!rafC) rafC = requestAnimationFrame(check);
      clearTimeout(seenT);
      seenT = setTimeout(() => { if (ratio > 0 && !played) play(); }, 600);
    };
    addEventListener("scroll", kick, { passive: true });
    new IntersectionObserver((es) => {
      es.forEach((e) => {
        ratio = e.intersectionRatio;
        if (ratio === 0) { clearTimeout(seenT); if (played) reset(); }
        else kick();
      });
    }, { threshold: [0, 0.05, 0.3, 0.6, 1] }).observe(h2);

    /* rebuild only when the headline's geometry really changed (a stray resize event must never cut the animation) */
    const signature = () => {
      const cs = getComputedStyle(h2);
      return [h2.offsetWidth, h2.offsetHeight, cs.fontSize, cs.direction, h2.textContent].join("|");
    };
    let sig = signature();
    const baseBuild = build;
    build = function () { sig = signature(); baseBuild(); };
    const rebuild = () => {
      clearTimeout(rebuildT);
      rebuildT = setTimeout(function again() {
        if (signature() === sig) return;
        if (anims.some((a) => a.playState === "running")) { rebuildT = setTimeout(again, 300); return; } /* never cut a running reveal */
        build();
      }, 140);
    };
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(h2);
    new MutationObserver(rebuild).observe(h2, { childList: true, characterData: true, subtree: true });
    addEventListener("resize", rebuild, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  }

  const boot2 = () => {
    try { initHomeEntrance(); } catch (e) { document.documentElement.classList.remove("tm-hero-armed"); }
    try { initAboutGlass(); } catch (e) {}
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot2, { once: true });
  else boot2();
})();
