/**
 * JOURNEY MODE – toggle alternative browsing experience
 * Additive only. Does not move or wrap section content.
 * Uses site colors only.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "tm-journey-mode";
  const SECTION_SEL = "main > section";

  let on = false;
  let sections = [];
  let rail = null;
  let statusEl = null;
  let rays = null;
  let toggleBtn = null;
  let currentIdx = 0;
  let io = null;

  const isAr = () => document.documentElement.lang === "ar";
  const t = (en, ar) => (isAr() ? ar : en);

  function sectionLabel(sec) {
    if (!sec) return "";
    if (sec.classList.contains("hero")) return t("Home", "الرئيسية");
    const id = sec.id || "";
    const map = {
      about: t("About", "عنّي"),
      services: t("Services", "الخدمات"),
      work: t("Work", "الأعمال"),
      cinema: t("Beyond", "ما وراء"),
      creation: t("AI Creation", "إبداع AI"),
      beforeafter: t("Before & After", "قبل وبعد"),
      process: t("Process", "طريقة العمل"),
      brief: t("Start Project", "ابدأ مشروع"),
      contact: t("Contact", "تواصل"),
      findme: t("Find Me", "تجدني"),
    };
    if (map[id]) return map[id];
    const k = sec.querySelector(".section-kicker, .eyebrow");
    if (k) return (k.textContent || "").replace(/\s+/g, " ").trim().slice(0, 24);
    return id || t("Section", "قسم");
  }

  /* ---------- UI pieces ---------- */
  function injectToggle() {
    const actions = document.querySelector(".header-actions");
    if (!actions || document.getElementById("journeyToggle")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "journeyToggle";
    btn.className = "journey-toggle";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute(
      "aria-label",
      t("Journey mode – alternative navigation", "وضع الرحلة – تصفح مختلف")
    );
    btn.dataset.tip = t("Journey mode", "وضع الرحلة");

    // Portal / nodes icon (simple, techy)
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle class="jt-core" cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="12" cy="4.2" r="1.4" fill="currentColor" opacity=".9"/>
        <circle cx="12" cy="19.8" r="1.4" fill="currentColor" opacity=".9"/>
        <circle cx="4.2" cy="12" r="1.4" fill="currentColor" opacity=".75"/>
        <circle cx="19.8" cy="12" r="1.4" fill="currentColor" opacity=".75"/>
        <path d="M12 7.4V5.6M12 18.4v-1.8M7.4 12H5.6M18.4 12h-1.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>
        <path d="M9.2 9.2l-1.3-1.3M15.1 15.1l1.3 1.3M15.1 9.2l1.3-1.3M9.2 15.1l-1.3 1.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>
      </svg>
    `;

    btn.addEventListener("click", () => setMode(!on));

    // Insert between lang and WhatsApp
    const lang = document.getElementById("langBtn");
    const wa = actions.querySelector(".mini-wa");
    if (lang && lang.nextSibling) {
      actions.insertBefore(btn, lang.nextSibling);
    } else if (wa) {
      actions.insertBefore(btn, wa);
    } else {
      actions.appendChild(btn);
    }

    toggleBtn = btn;
  }

  function injectRays() {
    if (document.querySelector(".journey-rays")) return;
    rays = document.createElement("div");
    rays.className = "journey-rays";
    rays.setAttribute("aria-hidden", "true");
    document.body.appendChild(rays);
  }

  function injectRail() {
    if (rail) return;
    rail = document.createElement("div");
    rail.className = "journey-rail";
    rail.setAttribute("aria-hidden", "true");

    const track = document.createElement("div");
    track.className = "journey-rail-track";
    const fill = document.createElement("div");
    fill.className = "journey-rail-fill";
    track.appendChild(fill);
    rail.appendChild(track);

    const dots = document.createElement("div");
    dots.className = "journey-rail-dots";
    sections.forEach((sec, i) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "journey-rail-dot";
      d.title = sectionLabel(sec);
      d.setAttribute("aria-label", sectionLabel(sec));
      d.addEventListener("click", () => {
        sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dots.appendChild(d);
    });
    rail.appendChild(dots);
    document.body.appendChild(rail);
  }

  function injectStatus() {
    if (statusEl) return;
    statusEl = document.createElement("div");
    statusEl.className = "journey-status";
    statusEl.setAttribute("aria-live", "polite");
    document.body.appendChild(statusEl);
  }

  function updateRailAndStatus() {
    if (!rail) return;
    const dots = rail.querySelectorAll(".journey-rail-dot");
    dots.forEach((d, i) => d.classList.toggle("is-active", i === currentIdx));
    const fill = rail.querySelector(".journey-rail-fill");
    if (fill && sections.length > 1) {
      const pct = (currentIdx / (sections.length - 1)) * 100;
      fill.style.height = pct + "%";
    }
    if (statusEl) {
      const label = sectionLabel(sections[currentIdx]);
      statusEl.innerHTML = `${t("JOURNEY", "رحلة")} · <b>${label}</b>`;
    }
  }

  /* ---------- Focus observer ---------- */
  function setupObserver() {
    if (io) io.disconnect();
    if (!("IntersectionObserver" in window)) return;

    io = new IntersectionObserver(
      (entries) => {
        if (!on) return;
        let best = null;
        let bestRatio = 0;
        entries.forEach((en) => {
          if (en.isIntersecting && en.intersectionRatio > bestRatio) {
            bestRatio = en.intersectionRatio;
            best = en.target;
          }
        });
        if (best) {
          const idx = sections.indexOf(best);
          if (idx >= 0) {
            currentIdx = idx;
            sections.forEach((s) => s.classList.toggle("journey-focus", s === best));
            updateRailAndStatus();
          }
        }
      },
      { threshold: [0.25, 0.45, 0.6], rootMargin: "-10% 0px -25% 0px" }
    );

    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Mode on/off ---------- */
  function setMode(next) {
    on = !!next;
    document.documentElement.classList.toggle("journey-mode", on);

    if (toggleBtn) {
      toggleBtn.classList.toggle("is-on", on);
      toggleBtn.setAttribute("aria-pressed", on ? "true" : "false");
      toggleBtn.dataset.tip = on
        ? t("Exit journey mode", "إغلاق وضع الرحلة")
        : t("Journey mode", "وضع الرحلة");
    }

    if (on) {
      sections = Array.from(document.querySelectorAll(SECTION_SEL));
      injectRays();
      injectRail();
      injectStatus();
      setupObserver();
      // focus first visible
      if (sections.length) {
        sections[0].classList.add("journey-focus");
        currentIdx = 0;
        updateRailAndStatus();
      }
    } else {
      if (io) io.disconnect();
      document.querySelectorAll(".journey-focus").forEach((el) => el.classList.remove("journey-focus"));
      if (rail) {
        rail.remove();
        rail = null;
      }
      if (statusEl) {
        statusEl.remove();
        statusEl = null;
      }
      // keep rays element but hidden via CSS when mode off
    }

    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch (_) {}
  }

  /* ---------- Init ---------- */
  function init() {
    injectToggle();

    // language change → refresh tips/labels
    new MutationObserver(() => {
      if (toggleBtn) {
        toggleBtn.dataset.tip = on
          ? t("Exit journey mode", "إغلاق وضع الرحلة")
          : t("Journey mode", "وضع الرحلة");
        toggleBtn.setAttribute(
          "aria-label",
          t("Journey mode – alternative navigation", "وضع الرحلة – تصفح مختلف")
        );
      }
      if (on) updateRailAndStatus();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    // restore preference (optional – only if user left it on)
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (_) {}
    if (saved === "1") {
      // delay until after intro so it doesn’t fight the gate
      const gate = document.getElementById("enterGate");
      if (gate && gate.isConnected) {
        const btn = document.getElementById("enterGateBtn");
        if (btn) {
          btn.addEventListener("click", () => setTimeout(() => setMode(true), 1000), { once: true });
        }
      } else {
        setTimeout(() => setMode(true), 400);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
