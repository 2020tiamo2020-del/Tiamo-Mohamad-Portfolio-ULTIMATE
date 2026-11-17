/**
 * TIAMO MOHAMAD — 3D JOURNEY MODE (وضع الرحلة)
 * Inspired by sztanki.com & futuristic sci-fi navigation.
 * High-performance 3D engine with Three.js (and Canvas2D 3D projected fallback).
 * Optical light lines (الخطوط الضوئية), interactive 3D nodes, HUD, detail modals,
 * synthesized Web Audio SFX, and seamless Arabic/English bilingual support.
 */

(function () {
  "use strict";

  /* ==========================================================================
     1. SECTOR DATA DEFINITIONS (English & Arabic)
     ========================================================================== */
  const SECTORS = [
    {
      id: "home",
      anchor: "#home",
      kickerEn: "00 / CORE STATION",
      kickerAr: "00 / المحطة الرئيسية",
      titleEn: "Turning ideas into visual stories.",
      titleAr: "أحوّل الأفكار إلى قصص بصرية.",
      descEn: "AI Artist • Photoshop Designer • Video Creator • VFX. Welcome to the interactive 3D universe.",
      descAr: "فنان ذكاء اصطناعي • مصمم فوتوشوب • صانع فيديو • مؤثرات بصرية VFX. أهلاً بك في فضاء التجربة ثلاثية الأبعاد.",
      tabEn: "HOME",
      tabAr: "الرئيسية",
      pos: { x: 0, y: 0, z: 0 },
      camPos: { x: 0, y: 0, z: 420 },
      chips: ["3D UNIVERSE", "NEON MATRIX", "TIAMO MOHAMAD", "INTERACTIVE"],
      cards: [
        { titleEn: "AI Visuals", titleAr: "مرئيات الـ AI", descEn: "Cinematic concept art & creative imagery.", descAr: "مفاهيم سينمائية وصور إبداعية متقدمة." },
        { titleEn: "Photo Manipulation", titleAr: "دمج وتعديل الصور", descEn: "High-end compositing & color grading.", descAr: "دمج احترافي وتصحيح ألوان استثنائي." },
        { titleEn: "VFX & Motion", titleAr: "مؤثرات وحركة", descEn: "Cinematic atmosphere, rhythm & sound sync.", descAr: "أجواء سينمائية وتناغم بصري وصوتي مبهر." }
      ]
    },
    {
      id: "about",
      anchor: "#about",
      kickerEn: "01 / ABOUT ME",
      kickerAr: "01 / عنّي",
      titleEn: "A creative signature, built across image & motion.",
      titleAr: "بصمة إبداعية تجمع بين الصورة والحركة.",
      descEn: "Independent visual creator combining AI, Photoshop, compositing, color work and motion to build visuals that feel cinematic, modern and memorable. Holder of the Certificate of Excellence in visual creation.",
      descAr: "صانع محتوى بصري مستقل، أجمع بين الذكاء الاصطناعي والفوتوشوب والدمج وتصحيح الألوان والحركة لصناعة أعمال عصرية بطابع سينمائي وبصمة واضحة، حاصل على شهادة التميز في الصناعة البصرية.",
      tabEn: "ABOUT",
      tabAr: "عنّي",
      pos: { x: 280, y: 80, z: -400 },
      camPos: { x: 280, y: 80, z: 20 },
      chips: ["CERTIFIED", "AI ARTIST", "PHOTOSHOP MASTER", "VFX SPECIALIST"],
      cards: [
        { titleEn: "Creative Direction", titleAr: "الإدارة الإبداعية", descEn: "Translating bold visions into stunning visual reality.", descAr: "تحويل الأفكار الجريئة إلى واقع بصري ساحر." },
        { titleEn: "Certificate of Excellence", titleAr: "شهادة التميز", descEn: "Professional standard in AI art, Photoshop and VFX (2026-2027).", descAr: "مستوى احترافي معتمد في فنون الذكاء الاصطناعي والفوتوشوب والمؤثرات." },
        { titleEn: "Global Reach", titleAr: "أعمال عالمية", descEn: "Collaborating with brands, creators and studios worldwide.", descAr: "التعاون مع علامات تجارية واستوديوهات وصنّاع محتوى حول العالم." }
      ]
    },
    {
      id: "services",
      anchor: "#services",
      kickerEn: "02 / SERVICES MATRIX",
      kickerAr: "02 / مصفوفة الخدمات",
      titleEn: "What I create.",
      titleAr: "ما أُبدعه.",
      descEn: "Comprehensive visual production across 12 distinct creative disciplines — tailored for maximum engagement, clarity and aesthetic perfection.",
      descAr: "إنتاج بصري متكامل عبر 12 تخصصاً إبداعياً مختلفاً — مصمم لأعلى درجات الجاذبية والوضوح والكمال الجمالي.",
      tabEn: "SERVICES",
      tabAr: "الخدمات",
      pos: { x: -280, y: 140, z: -900 },
      camPos: { x: -280, y: 140, z: -480 },
      chips: ["12 SERVICES", "RETOUCHING", "SHORT-FORM", "VFX & REELS", "BRANDING", "WEB DESIGN"],
      cards: [
        { titleEn: "01 · AI Art & Visuals", titleAr: "٠١ · فن الذكاء الاصطناعي", descEn: "Concept art, characters and fantasy realms.", descAr: "فن المفاهيم ومشاهد سينمائية وشخصيات ومرئيات إبداعية." },
        { titleEn: "02 · Photoshop & Retouching", titleAr: "٠٢ · فوتوشوب ودمج الصور", descEn: "Skin retouching, compositing and color grading.", descAr: "تنقيح الصور ودمجها ومعالجتها مع تصحيح الألوان." },
        { titleEn: "03 · Reels & Advertising", titleAr: "٠٣ · ريلز وإعلانات", descEn: "High-retention short-form video edits.", descAr: "مقاطع قصيرة مصممة لجذب الانتباه والترويج الفعّال." },
        { titleEn: "04 · Cinematic VFX & Web Design", titleAr: "٠٤ · سينما ومواقع", descEn: "Modern interactive web experiences and cinematic motion.", descAr: "تجارب رقمية وتصميم مواقع عصرية وحركة سينمائية." }
      ]
    },
    {
      id: "work",
      anchor: "#work",
      kickerEn: "03 / SELECTED WORK",
      kickerAr: "03 / أعمال مختارة",
      titleEn: "Visual work, built for impact.",
      titleAr: "أعمال بصرية، مصممة لتترك أثرًا.",
      descEn: "Explore featured full-frame galleries spanning photo manipulation, viral cinematic reels, commercial advertising, and VFX sequences.",
      descAr: "استكشف معارض الأعمال بإطار كامل من دمج الصور والريلز السينمائية الفيروسية وتصميم الإعلانات ومقاطع الـ VFX.",
      tabEn: "WORK",
      tabAr: "الأعمال",
      pos: { x: 320, y: -90, z: -1450 },
      camPos: { x: 320, y: -90, z: -1030 },
      chips: ["FULL FRAME", "VIRAL REELS", "HIGH-RES", "COMMERCIAL ART"],
      cards: [
        { titleEn: "Portrait Photo Manipulation", titleAr: "دمج وتعديل الصور الطولية", descEn: "Deep atmospheric manipulation with intense lighting.", descAr: "دمج ومعالجة صور بأجواء وإضاءات سينمائية فريدة." },
        { titleEn: "Cinematic Reels Showcase", titleAr: "معرض الريلز السينمائية", descEn: "Dynamic vertical video productions with viral pacing.", descAr: "فيديوهات طولية مصممة للانتشار وجذب الأنظار." },
        { titleEn: "Advertising & Commercial Art", titleAr: "إعلانات وتصميم تجاري", descEn: "High-impact visual campaigns for top brands.", descAr: "حملات بصرية وإعلانات ذات تأثير تسويقي قوي." },
        { titleEn: "VFX & Creative Motion", titleAr: "المؤثرات والحركة الإبداعية", descEn: "Supernatural effects, transitions and sound sync.", descAr: "مؤثرات بصرية سينمائية متقدمة مع مزامنة الصوت." }
      ]
    },
    {
      id: "creation",
      anchor: "#creation",
      kickerEn: "04 / AI CREATION & BEYOND",
      kickerAr: "04 / عوالم الذكاء الاصطناعي",
      titleEn: "Worlds beyond imagination.",
      titleAr: "عوالم تتجاوز الخيال.",
      descEn: "A living cosmos of AI creations — fantasy realms, supernatural beings, fashion styles and superhuman aesthetics pushed to photorealistic limits.",
      descAr: "جدار حي وعوالم مبهرة من أعمال الذكاء الاصطناعي — فانتازيا، كائنات أسطورية، وقوى خارقة نُفذت بدقة فائقة.",
      tabEn: "BEYOND",
      tabAr: "ما وراء الخيال",
      pos: { x: -300, y: -60, z: -2000 },
      camPos: { x: -300, y: -60, z: -1580 },
      chips: ["FANTASY", "SUPERNATURAL", "SUPER POWER", "FASHION STYLE"],
      cards: [
        { titleEn: "Fantasy & Mythical", titleAr: "فانتازيا وأساطير", descEn: "Immersive fictional landscapes and ethereal lighting.", descAr: "عوالم خيالية مذهلة مع إضاءات وتفاصيل سحرية." },
        { titleEn: "Superhuman Powers", titleAr: "قوى خارقة وما وراء الطبيعة", descEn: "Dynamic supernatural energy and visual intensity.", descAr: "طاقات خارقة وتأثيرات بصرية مليئة بالقوة والحيوية." },
        { titleEn: "Haute Couture & Style", titleAr: "أزياء وستايل عصري", descEn: "Avant-garde character design and fashion aesthetics.", descAr: "تصميم شخصيات وأزياء عصرية بطابع مستقبلي." }
      ]
    },
    {
      id: "beforeafter",
      anchor: "#beforeafter",
      kickerEn: "05 / BEFORE & AFTER",
      kickerAr: "05 / قبل وبعد",
      titleEn: "The Photoshop transformation.",
      titleAr: "تحوّل الفوتوشوب.",
      descEn: "Witness raw studio shots transform into pristine retouched magazine-grade masterpieces through meticulous skin clean-up, frequency separation, composite lighting and custom LUT grading.",
      descAr: "شاهد التحول المذهل من الصورة الخام إلى النتيجة النهائية فائقة الجودة عبر تنقية البشرة وتوزيع الإضاءة وتصحيح الألوان الدقيق.",
      tabEn: "BEFORE/AFTER",
      tabAr: "قبل وبعد",
      pos: { x: 260, y: 110, z: -2550 },
      camPos: { x: 260, y: 110, z: -2130 },
      chips: ["SKIN RETOUCH", "COLOR GRADE", "FREQUENCY SEPARATION", "COMPOSITE"],
      cards: [
        { titleEn: "Skin & Texture", titleAr: "معالجة البشرة والملمس", descEn: "Natural pore preservation with flawless finish.", descAr: "الحفاظ على الملمس الطبيعي للبشرة مع نقاء تام." },
        { titleEn: "Color Grading & LUTs", titleAr: "تصحيح وتلوين سينمائي", descEn: "Hollywood-grade color harmonies and tones.", descAr: "تناغم ألوان احترافي مستوحى من كبرى الأفلام." },
        { titleEn: "Light & Atmosphere", titleAr: "إضاءة وأجواء محيطة", descEn: "Adding depth, volumetric flares and realism.", descAr: "إضافة أبعاد وعمق وإضاءات حجمية تجعل المشهد حياً." }
      ]
    },
    {
      id: "process",
      anchor: "#process",
      kickerEn: "06 / 6-STEP PROCESS",
      kickerAr: "06 / مراحل العمل الست",
      titleEn: "From first idea to final frame.",
      titleAr: "من الفكرة الأولى إلى الإطار الأخير.",
      descEn: "A proven, transparent and collaborative workflow: 01 Brief ➔ 02 Mood ➔ 03 Creation ➔ 04 Color & Details ➔ 05 Review ➔ 06 Delivery.",
      descAr: "منهجية عمل واضحة وسلسة: ٠١ الفكرة والمتطلبات ➔ ٠٢ الاتجاه والأجواء ➔ ٠٣ مرحلة الإبداع ➔ ٠٤ الألوان والتفاصيل ➔ ٠٥ المراجعة ➔ ٠٦ التسليم النهائي.",
      tabEn: "PROCESS",
      tabAr: "طريقة العمل",
      pos: { x: -240, y: 70, z: -3100 },
      camPos: { x: -240, y: 70, z: -2680 },
      chips: ["STRUCTURED WORKFLOW", "ON-TIME DELIVERY", "CLIENT COLLABORATION"],
      cards: [
        { titleEn: "01-02 · Conception & Mood", titleAr: "٠١-٠٢ · الفكرة ولوحة الإلهام", descEn: "Aligning on goals, target audience and visual direction.", descAr: "تحديد الأهداف والجمهور المستهدف والألوان المطلوبة." },
        { titleEn: "03-04 · Creation & Polish", titleAr: "٠٣-٠٤ · التنفيذ واللمسات", descEn: "High-precision compositing, effects and fine tuning.", descAr: "تنفيذ متقن للدمج والتأثيرات وتنسيق كل تفصيلة." },
        { titleEn: "05-06 · Feedback & Delivery", titleAr: "٠٥-٠٦ · الملاحظات والتسليم", descEn: "Iterative revisions until perfect, then full-res delivery.", descAr: "تعديل حتى الرضا الكامل، ثم تسليم الملفات بأعلى دقة." }
      ]
    },
    {
      id: "contact",
      anchor: "#contact",
      kickerEn: "07 / CONTACT TERMINAL",
      kickerAr: "07 / محطة التواصل",
      titleEn: "Have an idea? Let’s make it visual.",
      titleAr: "لديك فكرة؟ دعنا نحوّلها إلى إبداع بصري.",
      descEn: "Ready to launch your creative project? Connect directly via WhatsApp or social channels for AI art, Photoshop, cinematic reels, video editing, branding or modern CV design.",
      descAr: "جاهز لبدء مشروعك الإبداعي؟ تواصل معي مباشرة عبر واتساب أو شبكات التواصل لطلب أعمال الذكاء الاصطناعي، الفوتوشوب، الريلز، الفيديو، أو السيرة الذاتية.",
      tabEn: "CONTACT",
      tabAr: "تواصل",
      pos: { x: 0, y: 0, z: -3700 },
      camPos: { x: 0, y: 0, z: -3280 },
      chips: ["INSTANT CHAT", "WHATSAPP READY", "CLIENT SATISFACTION", "24/7 CONNECT"],
      cards: [
        { titleEn: "Direct WhatsApp", titleAr: "مراسلة مباشرة عبر واتساب", descEn: "+20 12 7853 6645 — instant creative consultation.", descAr: "+20 12 7853 6645 — استشارة سريعة لبدء التنفيذ فوراً." },
        { titleEn: "Social Channels", titleAr: "قنوات التواصل الاجتماعي", descEn: "Instagram (@120tiamo120), Facebook, TikTok, Photoshop Mode.", descAr: "إنستغرام، فيسبوك، تيك توك، ومجتمع Photoshop Mode." },
        { titleEn: "5-Star Client Reviews", titleAr: "تقييمات 5 نجوم على Google", descEn: "Read verified feedback from delighted clients worldwide.", descAr: "اطّلع على آراء وتقييمات العملاء المعتمدة على خرائط جوجل." }
      ]
    }
  ];

  /* ==========================================================================
     2. SYNTHESIZED WEB AUDIO SFX (Zero External Audio Dependencies)
     ========================================================================== */
  class SciFiAudio {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem("tm-journey-muted") === "true";
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      localStorage.setItem("tm-journey-muted", String(this.muted));
      return this.muted;
    }

    playChirp(type = "click") {
      if (this.muted) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (type === "enter") {
          // Futuristic warp intro chord
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = "sine";
          osc1.frequency.setValueAtTime(320, now);
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.45);

          osc2.type = "triangle";
          osc2.frequency.setValueAtTime(160, now);
          osc2.frequency.exponentialRampToValueAtTime(440, now + 0.45);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.75);
          osc2.stop(now + 0.75);
        } else if (type === "warp") {
          // Hyperspace whoosh
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();

          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(280, now + 0.25);
          osc.frequency.exponentialRampToValueAtTime(90, now + 0.55);

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(300, now);
          filter.frequency.linearRampToValueAtTime(2400, now + 0.25);
          filter.frequency.linearRampToValueAtTime(200, now + 0.55);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.6);
        } else if (type === "modal") {
          // Hologram open tone
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(640, now);
          osc.frequency.exponentialRampToValueAtTime(1280, now + 0.18);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.26);
        } else {
          // Crisp sci-fi click
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(700, now + 0.04);

          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 0.06);
        }
      } catch (e) {
        // Audio error silent fallback
      }
    }
  }

  const sfx = new SciFiAudio();

  /* ==========================================================================
     3. JOURNEY MODE CONTROLLER & 3D ENGINE
     ========================================================================== */
  class JourneyApp {
    constructor() {
      this.active = false;
      this.currentIdx = 0;
      this.targetIdx = 0;
      this.modalOpen = false;

      // Mouse & Camera state
      this.camPos = { x: 0, y: 0, z: 420 };
      this.camTarget = { x: 0, y: 0, z: 420 };
      this.camLookAt = { x: 0, y: 0, z: 0 };
      this.mouse = { x: 0, y: 0, px: 0, py: 0, down: false };
      this.mouseOrbit = { x: 0, y: 0 };
      this.warpIntensity = 0;

      // DOM Elements
      this.btn = document.getElementById("journeyBtn");
      this.overlay = null;
      this.canvas = null;
      this.ctx2d = null;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Three.js instances (if loaded)
      this.threeReady = false;
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.raycaster = null;
      this.mouseVec = null;
      this.threeNodes = [];
      this.laserLine = null;
      this.pulseMesh = null;
      this.pulseT = 0;

      // Particles & Stars
      this.stars = [];
      this.initStars();

      this.initDOM();
      this.bindEvents();
    }

    isArabic() {
      return (
        document.documentElement.lang === "ar" ||
        document.documentElement.getAttribute("dir") === "rtl" ||
        localStorage.getItem("tiamo-lang") === "ar"
      );
    }

    initStars() {
      const count = 1800;
      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: (Math.random() - 0.5) * 3600,
          y: (Math.random() - 0.5) * 2400,
          z: Math.random() * -4500 + 400,
          size: Math.random() * 1.8 + 0.6,
          color: Math.random() > 0.4 ? "#ffffff" : Math.random() > 0.5 ? "#16d8ff" : "#b794ff",
          twinkle: Math.random() * Math.PI * 2
        });
      }
    }

    /* ---------- Build HTML Structure ---------- */
    initDOM() {
      // Build Fullscreen Overlay
      const overlay = document.createElement("div");
      overlay.id = "journeyOverlay";
      overlay.className = "journey-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-label", "3D Journey Mode");
      overlay.setAttribute("aria-hidden", "true");

      overlay.innerHTML = `
        <canvas id="journeyCanvas"></canvas>
        <div class="journey-vignette" aria-hidden="true"></div>
        <div class="journey-scanlines" aria-hidden="true"></div>
        <div class="journey-crosshairs" aria-hidden="true"></div>

        <!-- Top HUD Header (sztanki.com Style) -->
        <header class="journey-hud-top">
          <div class="journey-hud-brand">
            <span class="j-brand-mark">TM // 3D</span>
            <span class="j-brand-status" id="jStatusLabel">ONLINE</span>
          </div>

          <nav class="journey-hud-nav" id="jHudNav" aria-label="Journey Waypoints">
            ${SECTORS.map(
              (s, i) => `
              <button type="button" class="j-nav-tab ${i === 0 ? "is-active" : ""}" data-idx="${i}">
                <span class="j-tab-txt">${this.isArabic() ? s.tabAr : s.tabEn}</span>
              </button>
            `
            ).join("")}
          </nav>

          <div class="journey-hud-actions">
            <button type="button" class="j-hud-btn" id="jSoundBtn" title="Toggle SFX">
              <span id="jSoundIcon">${sfx.muted ? "🔇" : "🔊"}</span>
              <span id="jSoundTxt">${this.isArabic() ? "الصوت" : "SFX"}</span>
            </button>
            <button type="button" class="j-hud-btn is-exit" id="jExitBtn" title="Exit 3D Mode">
              <span>✕</span>
              <span id="jExitTxt">${this.isArabic() ? "خروج" : "EXIT"}</span>
            </button>
          </div>
        </header>

        <!-- Bottom Left Telemetry HUD -->
        <div class="journey-hud-coords" aria-hidden="true">
          <div><b id="jSectorCode">SEC: 00 // HOME</b></div>
          <div>TRAJ: <span id="jCoordStr">X: +0.0  Y: +0.0  Z: +420.0</span></div>
          <div>HINT: <span id="jHintTxt">${this.isArabic() ? "اسحب للاستكشاف • اضغط على القسم للتفاصيل" : "Drag to look around • Click node to inspect"}</span></div>
        </div>

        <!-- Bottom Navigation Controls -->
        <div class="journey-hud-bottom">
          <button type="button" class="j-step-arrow" id="jPrevBtn" aria-label="Previous Sector">‹</button>
          <div class="j-step-dots" id="jStepDots">
            ${SECTORS.map((_, i) => `<button type="button" class="j-step-dot ${i === 0 ? "is-active" : ""}" data-idx="${i}" aria-label="Go to sector ${i}"></button>`).join("")}
          </div>
          <button type="button" class="j-step-arrow" id="jNextBtn" aria-label="Next Sector">›</button>
          <button type="button" class="j-explore-btn" id="jExploreBtn">
            <span>✦</span>
            <span id="jExploreTxt">${this.isArabic() ? "استكشف القسم" : "Explore Sector"}</span>
          </button>
        </div>

        <!-- Holographic Detail Modal (Video 2 Style) -->
        <div class="journey-modal-backdrop" id="jModalBackdrop" role="dialog" aria-modal="true" aria-hidden="true">
          <div class="journey-modal" id="jModal">
            <button type="button" class="j-modal-close" id="jModalClose" aria-label="Close details">×</button>
            <div class="j-modal-kicker" id="jModalKicker">00 / SECTOR</div>
            <h3 class="j-modal-title" id="jModalTitle">Sector Title</h3>
            <p class="j-modal-desc" id="jModalDesc">Sector description copy...</p>
            <div class="j-modal-chips" id="jModalChips"></div>
            <div class="j-modal-grid" id="jModalGrid"></div>
            <div class="j-modal-actions">
              <button type="button" class="j-btn-primary" id="jModalJump">
                <span>✦</span>
                <span id="jModalJumpTxt">${this.isArabic() ? "فتح في الصفحة العادية" : "Jump to section in page"}</span>
              </button>
              <a class="j-btn-ghost" id="jModalWa" href="https://wa.me/201278536645?text=Hello%20Tiamo%20%F0%9F%91%8B%20I'm%20viewing%20your%20portfolio%20in%203D%20Journey%20Mode!" target="_blank" rel="noopener">
                <span>💬</span>
                <span id="jModalWaTxt">${this.isArabic() ? "تواصل على واتساب" : "Discuss on WhatsApp"}</span>
              </a>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      this.overlay = overlay;
      this.canvas = document.getElementById("journeyCanvas");
      this.ctx2d = this.canvas.getContext("2d");

      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());

      // Attempt loading Three.js for ultra-high-fidelity 3D
      this.setupThreeJS();
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = w * this.dpr;
      this.canvas.height = h * this.dpr;
      this.canvas.style.width = w + "px";
      this.canvas.style.height = h + "px";

      if (this.renderer && this.camera) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(this.dpr);
      }
    }

    /* ---------- Setup Three.js (With Automatic Graceful Fallback) ---------- */
    async setupThreeJS() {
      try {
        const THREE =
          window.THREE ||
          (await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js")).default ||
          window.THREE;

        if (!THREE) return;
        window.THREE = THREE;

        const w = window.innerWidth;
        const h = window.innerHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(55, w / h, 1, 6000);
        this.camera.position.set(0, 0, 420);

        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          alpha: true,
          antialias: true,
          powerPreference: "high-performance"
        });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(this.dpr);

        // Lighting
        const amb = new THREE.AmbientLight(0x8b35ff, 1.2);
        const dir = new THREE.DirectionalLight(0x16d8ff, 2.5);
        dir.position.set(300, 400, 500);
        this.scene.add(amb);
        this.scene.add(dir);

        // Volumetric 3D Stars in Three.js
        const starGeo = new THREE.BufferGeometry();
        const starPos = [];
        const starColors = [];
        const colorPalette = [new THREE.Color(0xffffff), new THREE.Color(0x16d8ff), new THREE.Color(0x9d66ff), new THREE.Color(0xc9a8ff)];

        this.stars.forEach((s) => {
          starPos.push(s.x, s.y, s.z);
          const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
          starColors.push(col.r, col.g, col.b);
        });

        starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
        starGeo.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
          size: 2.2,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending
        });

        const starPoints = new THREE.Points(starGeo, starMat);
        this.scene.add(starPoints);

        // 3D Optical Light Lines (الخطوط الضوئية) connecting all sectors
        const curvePoints = SECTORS.map((s) => new THREE.Vector3(s.pos.x, s.pos.y, s.pos.z));
        const curve = new THREE.CatmullRomCurve3(curvePoints, false, "catmullrom", 0.4);
        const curveGeo = new THREE.TubeGeometry(curve, 200, 1.8, 8, false);
        const curveMat = new THREE.MeshBasicMaterial({
          color: 0x8b35ff,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending
        });
        this.laserLine = new THREE.Mesh(curveGeo, curveMat);
        this.scene.add(this.laserLine);

        // Traveling Light Photon Packet on the Curve
        const pulseGeo = new THREE.SphereGeometry(6, 16, 16);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: 0x16d8ff,
          blending: THREE.AdditiveBlending
        });
        this.pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
        this.curve = curve;
        this.scene.add(this.pulseMesh);

        // 3D Sector Nodes & Holographic Geometries
        SECTORS.forEach((sec, idx) => {
          const group = new THREE.Group();
          group.position.set(sec.pos.x, sec.pos.y, sec.pos.z);
          group.userData = { sectorIdx: idx, sector: sec };

          // Outer glowing holographic ring
          const ringGeo = new THREE.TorusGeometry(32, 1.2, 16, 64);
          const ringMat = new THREE.MeshStandardMaterial({
            color: idx === 0 ? 0x16d8ff : 0x8b35ff,
            emissive: idx === 0 ? 0x16d8ff : 0x8b35ff,
            emissiveIntensity: 0.8,
            metalness: 0.8,
            roughness: 0.2
          });
          const ring1 = new THREE.Mesh(ringGeo, ringMat);
          group.add(ring1);

          // Counter-rotating inner ring
          const ring2 = new THREE.Mesh(new THREE.TorusGeometry(24, 0.8, 16, 48), ringMat);
          ring2.rotation.x = Math.PI / 2;
          group.add(ring2);

          // Central core geometry
          let coreMesh;
          if (idx === 0) {
            // Home: Holographic Sphere
            coreMesh = new THREE.Mesh(
              new THREE.IcosahedronGeometry(14, 2),
              new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, emissive: 0x16d8ff })
            );
          } else if (idx === 1) {
            // About: Holographic Cylinder Carousel
            coreMesh = new THREE.Mesh(
              new THREE.CylinderGeometry(14, 14, 20, 8, 1, true),
              new THREE.MeshStandardMaterial({ color: 0xc9a8ff, wireframe: true, emissive: 0x8b35ff })
            );
          } else if (idx === 2) {
            // Services: 12-sided matrix node
            coreMesh = new THREE.Mesh(
              new THREE.DodecahedronGeometry(15),
              new THREE.MeshStandardMaterial({ color: 0x16d8ff, wireframe: true, emissive: 0x16d8ff })
            );
          } else if (idx === 3) {
            // Work: 3D Coordinate Target Box
            coreMesh = new THREE.Mesh(
              new THREE.BoxGeometry(26, 18, 18),
              new THREE.MeshStandardMaterial({ color: 0x9d66ff, wireframe: true, emissive: 0x9d66ff })
            );
          } else if (idx === 4) {
            // Beyond: Floating Diamond Octahedron
            coreMesh = new THREE.Mesh(
              new THREE.OctahedronGeometry(16),
              new THREE.MeshStandardMaterial({ color: 0x16d8ff, wireframe: true, emissive: 0x8b35ff })
            );
          } else if (idx === 5) {
            // Before/After: Dual prism
            coreMesh = new THREE.Mesh(
              new THREE.TetrahedronGeometry(16),
              new THREE.MeshStandardMaterial({ color: 0xff375f, wireframe: true, emissive: 0xff375f })
            );
          } else if (idx === 6) {
            // Process: Milestone Ring
            coreMesh = new THREE.Mesh(
              new THREE.TorusGeometry(16, 2.5, 8, 24),
              new THREE.MeshStandardMaterial({ color: 0x16d8ff, wireframe: true, emissive: 0x16d8ff })
            );
          } else {
            // Contact: Vertical light funnel base
            coreMesh = new THREE.Mesh(
              new THREE.ConeGeometry(18, 30, 16, 1, true),
              new THREE.MeshStandardMaterial({ color: 0x16d8ff, wireframe: true, emissive: 0x8b35ff })
            );
            coreMesh.rotation.x = Math.PI;
          }
          group.add(coreMesh);

          // Sector Label in 3D (Floating Billboard Sprite)
          const canvasText = document.createElement("canvas");
          canvasText.width = 380;
          canvasText.height = 100;
          const ctxText = canvasText.getContext("2d");
          ctxText.fillStyle = "rgba(10, 7, 18, 0.85)";
          ctxText.roundRect(10, 10, 360, 80, 14);
          ctxText.fill();
          ctxText.lineWidth = 2;
          ctxText.strokeStyle = idx === 0 ? "#16d8ff" : "#8b35ff";
          ctxText.stroke();

          ctxText.fillStyle = "#16d8ff";
          ctxText.font = "bold 18px Inter, sans-serif";
          ctxText.textAlign = "center";
          ctxText.fillText(`SECTOR 0${idx}`, 190, 42);

          ctxText.fillStyle = "#ffffff";
          ctxText.font = "bold 20px Inter, Cairo, sans-serif";
          ctxText.fillText(this.isArabic() ? sec.tabAr : sec.tabEn, 190, 70);

          const spriteTex = new THREE.CanvasTexture(canvasText);
          const spriteMat = new THREE.SpriteMaterial({ map: spriteTex, transparent: true });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.position.set(0, 48, 0);
          sprite.scale.set(65, 17, 1);
          group.add(sprite);

          this.scene.add(group);
          this.threeNodes.push({ group, ring1, ring2, coreMesh, sprite, data: sec, idx });
        });

        this.raycaster = new THREE.Raycaster();
        this.mouseVec = new THREE.Vector2();
        this.threeReady = true;
      } catch (err) {
        console.warn("[Journey Mode] Three.js WebGL setup note:", err);
        this.threeReady = false;
      }
    }

    /* ---------- Event Listeners ---------- */
    bindEvents() {
      // Header Button Click
      if (this.btn) {
        this.btn.addEventListener("click", () => this.enter());
      }

      // Exit Button
      document.getElementById("jExitBtn")?.addEventListener("click", () => this.exit());

      // Prev & Next
      document.getElementById("jPrevBtn")?.addEventListener("click", () => {
        const next = (this.currentIdx - 1 + SECTORS.length) % SECTORS.length;
        this.goToSector(next);
      });

      document.getElementById("jNextBtn")?.addEventListener("click", () => {
        const next = (this.currentIdx + 1) % SECTORS.length;
        this.goToSector(next);
      });

      // Sound Toggle
      document.getElementById("jSoundBtn")?.addEventListener("click", () => {
        const isMuted = sfx.toggleMute();
        const icon = document.getElementById("jSoundIcon");
        if (icon) icon.textContent = isMuted ? "🔇" : "🔊";
      });

      // Explore Sector
      document.getElementById("jExploreBtn")?.addEventListener("click", () => {
        this.openModal(this.currentIdx);
      });

      // Modal Close & Jump
      document.getElementById("jModalClose")?.addEventListener("click", () => this.closeModal());
      document.getElementById("jModalBackdrop")?.addEventListener("click", (e) => {
        if (e.target.id === "jModalBackdrop") this.closeModal();
      });

      document.getElementById("jModalJump")?.addEventListener("click", () => {
        const sec = SECTORS[this.currentIdx];
        this.exit();
        setTimeout(() => {
          const target = document.querySelector(sec.anchor);
          if (target) {
            target.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      });

      // Nav Tabs
      document.querySelectorAll(".j-nav-tab").forEach((tab) => {
        tab.addEventListener("click", (e) => {
          const idx = parseInt(tab.getAttribute("data-idx") || "0", 10);
          this.goToSector(idx);
        });
      });

      // Step Dots
      document.querySelectorAll(".j-step-dot").forEach((dot) => {
        dot.addEventListener("click", () => {
          const idx = parseInt(dot.getAttribute("data-idx") || "0", 10);
          this.goToSector(idx);
        });
      });

      // Keyboard Controls
      window.addEventListener("keydown", (e) => {
        if (!this.active) return;
        if (e.key === "Escape") {
          if (this.modalOpen) {
            this.closeModal();
          } else {
            this.exit();
          }
        } else if (e.key === "ArrowRight") {
          const next = this.isArabic() ? (this.currentIdx - 1 + SECTORS.length) % SECTORS.length : (this.currentIdx + 1) % SECTORS.length;
          this.goToSector(next);
        } else if (e.key === "ArrowLeft") {
          const next = this.isArabic() ? (this.currentIdx + 1) % SECTORS.length : (this.currentIdx - 1 + SECTORS.length) % SECTORS.length;
          this.goToSector(next);
        }
      });

      // Mouse Drag & Tilt Interaction
      const handlePointerMove = (e) => {
        if (!this.active) return;
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (this.mouseVec) {
          this.mouseVec.x = x;
          this.mouseVec.y = y;
        }

        if (this.mouse.down) {
          const dx = e.clientX - this.mouse.px;
          const dy = e.clientY - this.mouse.py;
          this.mouseOrbit.x += dx * 0.4;
          this.mouseOrbit.y += dy * 0.4;
          this.mouseOrbit.y = Math.max(-160, Math.min(160, this.mouseOrbit.y));
        }

        this.mouse.px = e.clientX;
        this.mouse.py = e.clientY;
      };

      const handlePointerDown = (e) => {
        if (!this.active) return;
        this.mouse.down = true;
        this.mouse.px = e.clientX;
        this.mouse.py = e.clientY;
      };

      const handlePointerUp = (e) => {
        if (!this.active) return;
        this.mouse.down = false;

        // Check 3D raycast click on nodes if not dragged
        if (this.threeReady && this.raycaster && this.camera) {
          this.raycaster.setFromCamera(this.mouseVec, this.camera);
          const intersects = this.raycaster.intersectObjects(
            this.threeNodes.map((n) => n.group),
            true
          );
          if (intersects.length > 0) {
            let hit = intersects[0].object;
            while (hit && hit.parent && !hit.userData.sectorIdx && hit.userData.sectorIdx !== 0) {
              hit = hit.parent;
            }
            if (hit && (hit.userData.sectorIdx || hit.userData.sectorIdx === 0)) {
              const clickedIdx = hit.userData.sectorIdx;
              if (clickedIdx === this.currentIdx) {
                this.openModal(clickedIdx);
              } else {
                this.goToSector(clickedIdx);
              }
            }
          }
        }
      };

      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("mouseup", handlePointerUp);

      // Touch events
      window.addEventListener(
        "touchmove",
        (e) => {
          if (!this.active || !e.touches[0]) return;
          handlePointerMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        },
        { passive: true }
      );
      window.addEventListener(
        "touchstart",
        (e) => {
          if (!this.active || !e.touches[0]) return;
          handlePointerDown({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
        },
        { passive: true }
      );
      window.addEventListener("touchend", handlePointerUp, { passive: true });

      // Language Switcher Sync
      const langBtn = document.getElementById("langBtn");
      if (langBtn) {
        langBtn.addEventListener("click", () => {
          setTimeout(() => this.updateLanguageTexts(), 50);
        });
      }
    }

    /* ---------- Navigation & Mode Control ---------- */
    enter() {
      this.active = true;
      this.overlay.classList.add("is-active");
      this.overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      sfx.playChirp("enter");
      this.resizeCanvas();
      this.updateLanguageTexts();
      this.goToSector(0, true);

      requestAnimationFrame(() => this.loop());
    }

    exit() {
      this.active = false;
      this.overlay.classList.remove("is-active");
      this.overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";

      sfx.playChirp("click");
    }

    goToSector(idx, instant = false) {
      if (idx < 0 || idx >= SECTORS.length) return;
      this.currentIdx = idx;
      const target = SECTORS[idx];

      // Update HUD active tabs & dots
      document.querySelectorAll(".j-nav-tab").forEach((tab, i) => {
        tab.classList.toggle("is-active", i === idx);
      });
      document.querySelectorAll(".j-step-dot").forEach((dot, i) => {
        dot.classList.toggle("is-active", i === idx);
      });

      // Target camera position
      this.camTarget = {
        x: target.camPos.x,
        y: target.camPos.y,
        z: target.camPos.z
      };
      this.camLookAt = {
        x: target.pos.x,
        y: target.pos.y,
        z: target.pos.z
      };

      if (instant) {
        this.camPos = { ...this.camTarget };
        this.mouseOrbit = { x: 0, y: 0 };
      } else {
        this.warpIntensity = 1.0;
        sfx.playChirp("warp");
      }

      // Update telemetry
      const code = document.getElementById("jSectorCode");
      if (code) {
        code.textContent = `SEC: 0${idx} // ${target.id.toUpperCase()}`;
      }
    }

    openModal(idx) {
      this.modalOpen = true;
      const sec = SECTORS[idx];
      const isAr = this.isArabic();

      const kicker = document.getElementById("jModalKicker");
      const title = document.getElementById("jModalTitle");
      const desc = document.getElementById("jModalDesc");
      const chips = document.getElementById("jModalChips");
      const grid = document.getElementById("jModalGrid");

      if (kicker) kicker.textContent = isAr ? sec.kickerAr : sec.kickerEn;
      if (title) title.textContent = isAr ? sec.titleAr : sec.titleEn;
      if (desc) desc.textContent = isAr ? sec.descAr : sec.descEn;

      if (chips) {
        chips.innerHTML = sec.chips.map((c) => `<span class="j-chip">${c}</span>`).join("");
      }

      if (grid) {
        grid.innerHTML = sec.cards
          .map(
            (c) => `
          <div class="j-modal-card">
            <h4>✦ ${isAr ? c.titleAr : c.titleEn}</h4>
            <p>${isAr ? c.descAr : c.descEn}</p>
          </div>
        `
          )
          .join("");
      }

      sfx.playChirp("modal");
      document.getElementById("jModalBackdrop")?.classList.add("is-open");
    }

    closeModal() {
      this.modalOpen = false;
      document.getElementById("jModalBackdrop")?.classList.remove("is-open");
      sfx.playChirp("click");
    }

    updateLanguageTexts() {
      const isAr = this.isArabic();

      // Nav Tabs
      document.querySelectorAll(".j-nav-tab").forEach((tab, i) => {
        const txt = tab.querySelector(".j-tab-txt");
        if (txt && SECTORS[i]) {
          txt.textContent = isAr ? SECTORS[i].tabAr : SECTORS[i].tabEn;
        }
      });

      // HUD Buttons
      const soundTxt = document.getElementById("jSoundTxt");
      if (soundTxt) soundTxt.textContent = isAr ? "الصوت" : "SFX";

      const exitTxt = document.getElementById("jExitTxt");
      if (exitTxt) exitTxt.textContent = isAr ? "خروج" : "EXIT";

      const exploreTxt = document.getElementById("jExploreTxt");
      if (exploreTxt) exploreTxt.textContent = isAr ? "استكشف القسم" : "Explore Sector";

      const hintTxt = document.getElementById("jHintTxt");
      if (hintTxt) hintTxt.textContent = isAr ? "اسحب للاستكشاف • اضغط على القسم للتفاصيل" : "Drag to look around • Click node to inspect";

      const jumpTxt = document.getElementById("jModalJumpTxt");
      if (jumpTxt) jumpTxt.textContent = isAr ? "فتح في الصفحة العادية" : "Jump to section in page";

      const waTxt = document.getElementById("jModalWaTxt");
      if (waTxt) waTxt.textContent = isAr ? "تواصل على واتساب" : "Discuss on WhatsApp";

      // If modal is open, refresh modal text
      if (this.modalOpen) {
        this.openModal(this.currentIdx);
      }
    }

    /* ---------- Render Loop ---------- */
    loop() {
      if (!this.active) return;

      // Smooth camera interpolation
      const ease = 0.065;
      this.camPos.x += (this.camTarget.x + this.mouseOrbit.x * 0.6 - this.camPos.x) * ease;
      this.camPos.y += (this.camTarget.y - this.mouseOrbit.y * 0.4 - this.camPos.y) * ease;
      this.camPos.z += (this.camTarget.z - this.camPos.z) * ease;

      this.warpIntensity *= 0.94;

      // Update telemetry display
      const coordStr = document.getElementById("jCoordStr");
      if (coordStr) {
        coordStr.textContent = `X: ${this.camPos.x >= 0 ? "+" : ""}${this.camPos.x.toFixed(1)}  Y: ${this.camPos.y >= 0 ? "+" : ""}${this.camPos.y.toFixed(1)}  Z: ${this.camPos.z.toFixed(1)}`;
      }

      if (this.threeReady && this.renderer && this.scene && this.camera) {
        this.renderThree();
      } else {
        this.renderCanvasFallback();
      }

      requestAnimationFrame(() => this.loop());
    }

    /* ---------- Three.js WebGL Rendering ---------- */
    renderThree() {
      this.camera.position.set(this.camPos.x, this.camPos.y, this.camPos.z);
      this.camera.lookAt(this.camLookAt.x, this.camLookAt.y, this.camLookAt.z);

      // Animate node rotations & optical pulses
      const time = performance.now() * 0.0015;

      this.threeNodes.forEach((n, i) => {
        n.ring1.rotation.z += 0.012 * (i % 2 === 0 ? 1 : -1);
        n.ring2.rotation.y += 0.015;
        n.coreMesh.rotation.y += 0.02;
        n.coreMesh.rotation.x += 0.008;

        // Active node breathing scale
        if (i === this.currentIdx) {
          const s = 1.0 + Math.sin(time * 3) * 0.08;
          n.group.scale.set(s, s, s);
        } else {
          n.group.scale.set(1, 1, 1);
        }
      });

      // Advance photon packet on optical light curve
      if (this.pulseMesh && this.curve) {
        this.pulseT = (this.pulseT + 0.0035) % 1;
        const pt = this.curve.getPoint(this.pulseT);
        if (pt) {
          this.pulseMesh.position.copy(pt);
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    /* ---------- High-Performance Canvas2D 3D Fallback ---------- */
    renderCanvasFallback() {
      const ctx = this.ctx2d;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const fov = 450;

      ctx.clearRect(0, 0, w, h);

      // Deep space radial background
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy));
      grad.addColorStop(0, "rgba(13, 8, 31, 0.95)");
      grad.addColorStop(0.65, "rgba(5, 4, 10, 0.98)");
      grad.addColorStop(1, "#020106");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 1. Draw 3D Stars
      this.stars.forEach((s) => {
        const rx = s.x - this.camPos.x;
        const ry = s.y - this.camPos.y;
        const rz = s.z - this.camPos.z;

        if (rz < -50) {
          const scale = fov / -rz;
          const sx = cx + rx * scale;
          const sy = cy - ry * scale;

          if (sx >= 0 && sx <= w && sy >= 0 && sy <= h) {
            const alpha = Math.min(1, Math.max(0.1, 1 - -rz / 3500));
            ctx.fillStyle = s.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.8, s.size * scale * (1 + this.warpIntensity * 2)), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // 2. Draw Optical Light Lines (الخطوط الضوئية) connecting sectors
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(139, 53, 255, 0.65)";
      ctx.shadowColor = "#16d8ff";
      ctx.shadowBlur = 12;
      ctx.beginPath();

      let started = false;
      SECTORS.forEach((sec) => {
        const rx = sec.pos.x - this.camPos.x;
        const ry = sec.pos.y - this.camPos.y;
        const rz = sec.pos.z - this.camPos.z;

        if (rz < -30) {
          const scale = fov / -rz;
          const sx = cx + rx * scale;
          const sy = cy - ry * scale;

          if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
          } else {
            ctx.lineTo(sx, sy);
          }
        }
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 3. Draw 3D Sector Nodes & Hologram rings
      const time = performance.now() * 0.002;

      SECTORS.forEach((sec, i) => {
        const rx = sec.pos.x - this.camPos.x;
        const ry = sec.pos.y - this.camPos.y;
        const rz = sec.pos.z - this.camPos.z;

        if (rz < -30) {
          const scale = fov / -rz;
          const sx = cx + rx * scale;
          const sy = cy - ry * scale;
          const radius = Math.max(10, 36 * scale);

          const isCurrent = i === this.currentIdx;

          // Hologram Outer Glow
          ctx.beginPath();
          ctx.arc(sx, sy, radius * (isCurrent ? 1.4 : 1.1), 0, Math.PI * 2);
          ctx.strokeStyle = isCurrent ? "rgba(22, 216, 255, 0.9)" : "rgba(139, 53, 255, 0.5)";
          ctx.lineWidth = isCurrent ? 3 : 1.5;
          ctx.stroke();

          // Rotating orbit ring
          ctx.beginPath();
          ctx.ellipse(sx, sy, radius * 1.2, radius * 0.45, time * (i % 2 === 0 ? 1 : -1), 0, Math.PI * 2);
          ctx.strokeStyle = isCurrent ? "#ffffff" : "rgba(22, 216, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();

          // Core
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = isCurrent ? "#16d8ff" : "#8b35ff";
          ctx.globalAlpha = 0.85;
          ctx.fill();

          // 3D Tag Label
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${Math.max(10, Math.round(14 * scale))}px Inter, Cairo, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(`0${i} · ${this.isArabic() ? sec.tabAr : sec.tabEn}`, sx, sy + radius + 18 * scale);
        }
      });

      ctx.globalAlpha = 1;
    }
  }

  /* ==========================================================================
     4. BOOTSTRAP WHEN DOM READY
     ========================================================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new JourneyApp());
  } else {
    new JourneyApp();
  }
})();
