/* ==========================================================================
   UI SOUNDS  (2 of the 3 new sounds)
   ─ Left side menu (.st-rail)  →  audio/ui-rail.wav   (tick-click)
   ─ Start a Project (#brief)   →  audio/ui-fill.wav   (card-filling tick)
        hover on any button / chip / dot ........ soft tick
        pick or un-pick a service / usage chip ... higher tick = filled, lower tick = removed
        quantity + deadline sliders .............. a tick per step that rises with the value
        Copy / Send / Skip ....................... small two-tick or single tick
        Send while the brief is incomplete ....... a short dull "not yet" tick
   The third sound (3D intro) lives in intro3d.js.
   Everything uses Web Audio (instant, no lag), falls back to <audio> if it is unavailable,
   and never plays while the tab is hidden. To mute all of it:  window.__uiSoundsOff = true
   ========================================================================== */
(() => {
"use strict";
if (window.__uiSounds) return;

const BASE = "audio/";
const FILES = { fill: "ui-fill.wav", rail: "ui-rail.wav" };
const CFG = {
  master: 1,
  rail: 0.9,          // side menu click
  hover: 0.55,        // hover on Start a Project controls
  fill: 1.0,          // picking a chip / pressing a button
  slider: 0.6,        // quantity + deadline sliders
  typing: false,      // true = also a very quiet tick while typing the idea / name
};
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const BRIEF = '#brief button, #brief .sc-chip, #brief [role="checkbox"], #brief [role="radio"]';

let ctx = null, out = null, started = false;
const buf = {}, tags = {}, last = {};

/* ---------- engine ---------- */
const start = () => {
  if (started) return;
  started = true;
  Object.keys(FILES).forEach(k => {                     // plain <audio> as a safety net
    try { const a = new Audio(BASE + FILES[k]); a.preload = "auto"; tags[k] = a; } catch (_) {}
  });
  if (location.protocol === "file:") return;           // decoding is blocked when opened from disk
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    lim.connect(ctx.destination); out = lim;
    Object.keys(FILES).forEach(k => {
      fetch(BASE + FILES[k])
        .then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then(ab => new Promise((res, rej) => { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.catch) p.catch(rej); }))
        .then(b => { buf[k] = b; })
        .catch(() => {});
    });
  } catch (_) { ctx = null; }
};
["pointerdown", "keydown", "touchstart"].forEach(ev => addEventListener(ev, start, { capture: true, once: true, passive: true }));

const play = (name, { gain = 1, rate = 1, gap = 0, k = name } = {}) => {   // k = throttle key, so a hover never swallows a click
  if (document.hidden || window.__uiSoundsOff) return;
  const t = performance.now();
  if (t - (last[k] || 0) < gap) return;
  last[k] = t;
  if (!started) start();
  if (ctx && buf[name]) {
    try {
      if (ctx.state === "suspended") ctx.resume();
      const s = ctx.createBufferSource(); s.buffer = buf[name]; s.playbackRate.value = rate;
      const g = ctx.createGain(); g.gain.value = gain * CFG.master;
      s.connect(g); g.connect(out); s.start();
      return;
    } catch (_) {}
  }
  const a = tags[name];
  if (a) { try { const c = a.cloneNode(); c.volume = Math.min(1, gain * CFG.master); c.playbackRate = rate; const p = c.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {} }
};
window.__uiSounds = { play, CFG };

const later = (fn, ms) => setTimeout(fn, ms);
const isOn = el => el.getAttribute("aria-checked") === "true";

/* ---------- left side menu ---------- */
addEventListener("click", e => {
  const t = e.target;
  if (!t || !t.closest) return;

  if (t.closest(".st-rail a")) { play("rail", { gain: CFG.rail, gap: 60, k: "rail" }); return; }

  const b = t.closest(BRIEF);
  if (!b) return;

  /* capture phase: the page has not toggled the chip yet, so "now off" means "about to turn on" */
  if (b.classList.contains("sc-chip")) {
    const turningOn = !isOn(b);
    play("fill", { gain: CFG.fill, rate: turningOn ? 1.32 : 0.78, gap: 30, k: "chip" });
    return;
  }
  if (b.id === "bbSend") {
    if (b.getAttribute("aria-disabled") === "true") { play("fill", { gain: 0.7, rate: 0.6, gap: 120, k: "deny" }); return; }
    play("fill", { gain: CFG.fill, rate: 0.7, k: "send1" }); later(() => play("fill", { gain: CFG.fill, rate: 1.3, k: "send2" }), 85); return;
  }
  if (b.id === "bbCopy") {
    play("fill", { gain: CFG.fill * 0.95, rate: 1.15, k: "copy1" }); later(() => play("fill", { gain: CFG.fill * 0.8, rate: 1.5, k: "copy2" }), 70); return;
  }
  play("fill", { gain: CFG.fill * 0.9, rate: 1.05, gap: 30, k: "btn" });          // Skip, step dots, anything else
}, true);

/* ---------- Start a Project: hover ---------- */
addEventListener("mouseover", e => {
  if (!canHover) return;
  const t = e.target;
  if (!t || !t.closest) return;
  const b = t.closest(BRIEF);
  if (!b || b.disabled) return;
  if (e.relatedTarget && b.contains(e.relatedTarget)) return;            // moving inside the same button
  play("fill", { gain: CFG.hover, rate: 0.92 + Math.random() * 0.16, gap: 40, k: "hover" });
}, true);

/* ---------- Start a Project: sliders (+ optional typing) ---------- */
addEventListener("input", e => {
  const r = e.target;
  if (!r || !r.matches) return;
  if (r.matches('#brief input[type="range"]')) {
    const mn = +r.min || 0, mx = +r.max || 100, v = (+r.value - mn) / Math.max(1, mx - mn);
    play("fill", { gain: CFG.slider, rate: 0.8 + v * 0.7, gap: 28, k: "slider" });
  } else if (CFG.typing && r.matches('#brief textarea, #brief input[type="text"]')) {
    play("fill", { gain: 0.22, rate: 1.05 + Math.random() * 0.2, gap: 55, k: "type" });
  }
}, true);
})();
