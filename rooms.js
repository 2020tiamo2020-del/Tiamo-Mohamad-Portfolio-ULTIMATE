/**
 * ROOMS – vertical “game-like” section navigation
 * Inspired by journey-style portfolios, using only this site’s colors.
 *
 * After the intro gate closes:
 *  - major sections become full-viewport rooms (scroll-snap)
 *  - wheel / touch moves between rooms
 *  - clicking “Enter” opens the room content (fullscreen + lock)
 *  - Esc or “Leave room” returns to the map of rooms
 */
(() => {
  "use strict";

  const ROOM_SELECTOR = "main > section.room, main > section[id]";
  const MAJOR_IDS = ["about", "services", "work", "cinema", "creation", "contact"];
  // home/hero is also a room but treated specially

  let rooms = [];
  let currentIndex = 0;
  let enteredRoom = null;
  let snapping = false;
  let enabled = false;
  let rail = null;
  let exitBtn = null;

  const reduceMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isArabic = () => document.documentElement.lang === "ar";

  function t(en, ar) {
    return isArabic() ? ar : en;
  }

  /* ---------- Build room list & portal UI ---------- */
  function collectRooms() {
    const main = document.getElementById("home") || document.querySelector("main");
    if (!main) return [];

    const list = [];
    // Hero is first room
    const hero = main.querySelector("section.hero");
    if (hero) {
      hero.classList.add("room", "room-home");
      list.push(hero);
    }

    MAJOR_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.tagName === "SECTION") {
        el.classList.add("room");
        list.push(el);
      }
    });

    // Also pick any other direct section children that look major
    Array.from(main.children).forEach((child) => {
      if (
        child.tagName === "SECTION" &&
        !list.includes(child) &&
        (child.id || child.classList.contains("section") || child.classList.contains("reveal"))
      ) {
        // skip tiny ones
        if (child.id === "beforeafter" || child.id === "process" || child.id === "brief") return;
        child.classList.add("room");
        list.push(child);
      }
    });

    return list;
  }

  function ensurePortal(room, index) {
    if (room.querySelector(".room-portal")) return;

    const kicker = room.querySelector(".section-kicker");
    const title = room.querySelector(".section-title, h1, h2");
    const isHome = room.classList.contains("room-home") || room.classList.contains("hero");

    const portal = document.createElement("div");
    portal.className = "room-portal";
    portal.setAttribute("data-room-index", String(index));

    const inner = document.createElement("div");
    inner.className = "room-portal-inner";

    // Move existing heading into portal for the locked view (clone visual)
    if (kicker) {
      const k = kicker.cloneNode(true);
      inner.appendChild(k);
    }
    if (title) {
      const tEl = title.cloneNode(true);
      // for home keep the big h1 feel
      inner.appendChild(tEl);
    } else if (isHome) {
      const h = document.createElement("h2");
      h.innerHTML = t("Turning ideas into <em>visual stories.</em>", "أحوّل الأفكار إلى <em>قصص بصرية.</em>");
      inner.appendChild(h);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-enter";
    btn.innerHTML = `<span data-en="Enter room" data-ar="ادخل الغرفة">${t("Enter room", "ادخل الغرفة")}</span><span class="re-arrow" aria-hidden="true">→</span>`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      enterRoom(room);
    });
    inner.appendChild(btn);

    // Scroll hint (only first rooms)
    if (index < 3) {
      const hint = document.createElement("div");
      hint.className = "room-hint";
      hint.innerHTML = `<i></i><span data-en="Scroll to next room" data-ar="مرّر للغرفة التالية">${t("Scroll to next room", "مرّر للغرفة التالية")}</span>`;
      portal.appendChild(hint);
    }

    portal.appendChild(inner);

    // Wrap original content in .room-body so we can collapse it
    const body = document.createElement("div");
    body.className = "room-body";

    // Move all current children into body, then put portal first
    while (room.firstChild) {
      body.appendChild(room.firstChild);
    }
    room.appendChild(portal);
    room.appendChild(body);

    // Home already has CTAs – keep them usable inside body
  }

  function buildRail() {
    if (rail) return;
    rail = document.createElement("div");
    rail.className = "room-rail";
    rail.setAttribute("role", "navigation");
    rail.setAttribute("aria-label", t("Rooms", "الغرف"));

    const label = document.createElement("span");
    label.className = "room-rail-label";
    label.textContent = "";
    rail.appendChild(label);

    rooms.forEach((room, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "room-rail-dot";
      dot.setAttribute("aria-label", roomName(room));
      dot.addEventListener("click", () => goToRoom(i));
      rail.appendChild(dot);
    });

    document.body.appendChild(rail);
  }

  function buildExitButton() {
    if (exitBtn) return;
    exitBtn = document.createElement("button");
    exitBtn.type = "button";
    exitBtn.className = "room-exit";
    exitBtn.innerHTML = `<span aria-hidden="true">←</span> <span data-en="Leave room" data-ar="غادر الغرفة">${t("Leave room", "غادر الغرفة")}</span>`;
    exitBtn.addEventListener("click", leaveRoom);
    document.body.appendChild(exitBtn);
  }

  function roomName(room) {
    if (room.classList.contains("hero") || room.classList.contains("room-home")) {
      return t("Home", "الرئيسية");
    }
    const id = room.id || "";
    const map = {
      about: t("About", "عنّي"),
      services: t("Services", "الخدمات"),
      work: t("Work", "الأعمال"),
      cinema: t("Cinema", "سينما"),
      creation: t("Creation", "إبداع"),
      contact: t("Contact", "تواصل"),
    };
    return map[id] || id || t("Room", "غرفة");
  }

  function updateRail() {
    if (!rail) return;
    const dots = rail.querySelectorAll(".room-rail-dot");
    dots.forEach((d, i) => d.classList.toggle("is-active", i === currentIndex));
    const label = rail.querySelector(".room-rail-label");
    if (label && rooms[currentIndex]) {
      label.textContent = roomName(rooms[currentIndex]);
    }
  }

  /* ---------- Navigation between rooms ---------- */
  function goToRoom(index, behavior = "smooth") {
    if (!enabled || enteredRoom) return;
    index = Math.max(0, Math.min(rooms.length - 1, index));
    if (index === currentIndex && !snapping) return;

    currentIndex = index;
    const room = rooms[index];
    if (!room) return;

    rooms.forEach((r, i) => r.classList.toggle("is-current", i === index));
    updateRail();

    snapping = true;
    room.scrollIntoView({ behavior: reduceMotion() ? "auto" : behavior, block: "start" });
    setTimeout(() => {
      snapping = false;
    }, behavior === "smooth" ? 700 : 50);
  }

  function nextRoom() {
    goToRoom(currentIndex + 1);
  }
  function prevRoom() {
    goToRoom(currentIndex - 1);
  }

  /* ---------- Enter / Leave a room ---------- */
  function enterRoom(room) {
    if (!room || enteredRoom) return;
    const idx = rooms.indexOf(room);
    if (idx < 0) return;

    enteredRoom = room;
    currentIndex = idx;
    document.documentElement.classList.add("room-entered");
    room.classList.add("is-entered");
    rooms.forEach((r) => r.classList.toggle("is-current", r === room));

    // Make sure content is visible
    const body = room.querySelector(".room-body");
    if (body) {
      // force reflow then open
      body.style.maxHeight = "none";
    }

    // Scroll room to top of its content
    room.scrollTop = 0;

    updateRail();
    // Accessibility
    room.setAttribute("aria-expanded", "true");
  }

  function leaveRoom() {
    if (!enteredRoom) return;
    const room = enteredRoom;

    room.classList.add("is-leaving");
    room.classList.remove("is-entered");

    const finish = () => {
      room.classList.remove("is-leaving");
      document.documentElement.classList.remove("room-entered");
      enteredRoom = null;
      room.removeAttribute("aria-expanded");

      // Return the room to its place in the flow and snap to it
      goToRoom(rooms.indexOf(room), "auto");
    };

    if (reduceMotion()) {
      finish();
    } else {
      setTimeout(finish, 420);
    }
  }

  /* ---------- Wheel / keyboard handling ---------- */
  function onWheel(e) {
    if (!enabled) return;
    if (enteredRoom) {
      // inside room → let native scroll happen
      return;
    }
    // between rooms
    if (snapping) {
      e.preventDefault();
      return;
    }
    if (Math.abs(e.deltaY) < 8) return;

    e.preventDefault();
    if (e.deltaY > 0) nextRoom();
    else prevRoom();
  }

  function onKey(e) {
    if (!enabled) return;

    if (e.key === "Escape" && enteredRoom) {
      e.preventDefault();
      leaveRoom();
      return;
    }

    if (enteredRoom) return; // let normal keys work inside

    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      nextRoom();
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      prevRoom();
    } else if (e.key === "Enter" || e.key === " ") {
      // enter current room
      const room = rooms[currentIndex];
      if (room && !enteredRoom) {
        e.preventDefault();
        enterRoom(room);
      }
    }
  }

  /* ---------- Observe which room is most visible (fallback) ---------- */
  function setupObserver() {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (enteredRoom || snapping) return;
        let best = null;
        let bestRatio = 0;
        entries.forEach((en) => {
          if (en.isIntersecting && en.intersectionRatio > bestRatio) {
            bestRatio = en.intersectionRatio;
            best = en.target;
          }
        });
        if (best) {
          const idx = rooms.indexOf(best);
          if (idx >= 0 && idx !== currentIndex) {
            currentIndex = idx;
            rooms.forEach((r, i) => r.classList.toggle("is-current", i === idx));
            updateRail();
          }
        }
      },
      { threshold: [0.35, 0.55, 0.75] }
    );
    rooms.forEach((r) => io.observe(r));
  }

  /* ---------- Activate after intro ---------- */
  function activate() {
    if (enabled) return;
    rooms = collectRooms();
    if (rooms.length < 2) return;

    rooms.forEach((r, i) => ensurePortal(r, i));
    buildRail();
    buildExitButton();

    document.documentElement.classList.add("rooms-active");
    // enable snap on the scrolling root
    document.documentElement.style.scrollSnapType = "y mandatory";

    enabled = true;
    currentIndex = 0;
    rooms[0].classList.add("is-current");
    updateRail();

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    setupObserver();

    // Language switch refreshes labels
    new MutationObserver(() => {
      if (exitBtn) {
        exitBtn.querySelector("span:last-child").textContent = t("Leave room", "غادر الغرفة");
      }
      rooms.forEach((room) => {
        const btn = room.querySelector(".room-enter span[data-en]");
        if (btn) btn.textContent = t("Enter room", "ادخل الغرفة");
        const hint = room.querySelector(".room-hint span");
        if (hint) hint.textContent = t("Scroll to next room", "مرّر للغرفة التالية");
      });
      updateRail();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  /* ---------- Wait for intro gate to finish ---------- */
  function waitForIntro() {
    const gate = document.getElementById("enterGate");
    if (!gate || !gate.isConnected) {
      // already gone or never present
      activate();
      return;
    }

    // When user clicks Enter on the gate
    const btn = document.getElementById("enterGateBtn");
    if (btn) {
      btn.addEventListener(
        "click",
        () => {
          // small delay so existing intro animation can finish
          setTimeout(activate, 900);
        },
        { once: true }
      );
    }

    // Fallback: if gate is removed from DOM
    const mo = new MutationObserver(() => {
      if (!document.getElementById("enterGate")) {
        mo.disconnect();
        setTimeout(activate, 400);
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety timeout
    setTimeout(() => {
      if (!enabled) activate();
    }, 12000);
  }

  // Public tiny API for nav links
  window.TMRooms = {
    goTo(idOrIndex) {
      if (typeof idOrIndex === "number") goToRoom(idOrIndex);
      else {
        const idx = rooms.findIndex((r) => r.id === idOrIndex);
        if (idx >= 0) {
          if (enteredRoom) leaveRoom();
          setTimeout(() => goToRoom(idx), enteredRoom ? 450 : 0);
        }
      }
    },
    leave: leaveRoom,
    enterCurrent: () => rooms[currentIndex] && enterRoom(rooms[currentIndex]),
  };

  // Hook existing nav links so they work with rooms
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || !enabled) return;
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const idx = rooms.findIndex((r) => r.id === id || (id === "home" && r.classList.contains("hero")));
      if (idx >= 0) {
        e.preventDefault();
        if (enteredRoom) {
          leaveRoom();
          setTimeout(() => goToRoom(idx), 460);
        } else {
          goToRoom(idx);
        }
      }
    },
    true
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForIntro);
  } else {
    waitForIntro();
  }
})();
