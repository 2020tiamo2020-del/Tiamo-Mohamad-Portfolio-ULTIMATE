/* ==========================================================================
   PROCESS + BRIEF BUILDER (2026-10-24) - process-brief.js
   Process: the line fills and the steps light up as you scroll.
   Brief Builder: live summary + "Send on WhatsApp" (message built in the page language).
   The WhatsApp button is a <button> on purpose: script.js rewrites every <a href*="wa.me/"> on language switch.
   Nothing is stored or sent anywhere except the WhatsApp link the visitor opens.
   ========================================================================== */
(() => {
  "use strict";
  if (window.__pbFx) return;
  window.__pbFx = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAr = () => document.documentElement.lang === "ar";
  const run = (n, fn) => { try { fn(); } catch (e) { console.warn("[pb:" + n + "]", e); } };
  const onReady = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn, { once: true }) : fn();
  const onLang = fn => new MutationObserver(fn).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  const WA_NUMBER = "201278536645";

  /* ======================  PROCESS  ====================== */
  onReady(() => run("process", () => {
    const sec = $("#process"), track = sec && $(".pr-track", sec);
    if (!track) return;
    const steps = $$(".pr-step", track), nodes = steps.map(s => $(".pr-node", s));
    if (steps.length < 2) return;
    sec.classList.add("pr-js");

    const measure = () => {
      const tr = track.getBoundingClientRect();
      const a = nodes[0].getBoundingClientRect(), z = nodes[nodes.length - 1].getBoundingClientRect();
      const top = a.top + a.height / 2 - tr.top;
      const h = (z.top + z.height / 2) - (a.top + a.height / 2);
      track.style.setProperty("--pr-top", top.toFixed(1) + "px");
      track.style.setProperty("--pr-h", Math.max(0, h).toFixed(1) + "px");
      update();
    };
    let ticking = false;
    const update = () => {
      ticking = false;
      if (reduce) { steps.forEach(s => s.classList.add("on")); track.style.setProperty("--pp", 1); return; }
      const probe = innerHeight * 0.62;
      const first = nodes[0].getBoundingClientRect(), last = nodes[nodes.length - 1].getBoundingClientRect();
      const y0 = first.top + first.height / 2, y1 = last.top + last.height / 2;
      track.style.setProperty("--pp", clamp((probe - y0) / Math.max(1, y1 - y0), 0, 1).toFixed(4));
      steps.forEach((s, i) => {
        const r = nodes[i].getBoundingClientRect();
        s.classList.toggle("on", r.top + r.height / 2 <= probe);
      });
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener("scroll", req, { passive: true });
    let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(measure, 120); }, { passive: true });
    addEventListener("load", measure, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if ("ResizeObserver" in window) new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(measure, 80); }).observe(track);
    onLang(() => setTimeout(measure, 150));
    measure();
  }));

  /* ======================  BRIEF BUILDER  ====================== */
  onReady(() => run("brief", () => {
    const sec = $("#brief");
    if (!sec) return;
    const svc = $$("#bbService .bb-chip", sec), use = $$("#bbUsage .bb-chip", sec);
    const qty = $("#bbQty", sec), day = $("#bbDays", sec), idea = $("#bbIdea", sec), nm = $("#bbName", sec);
    const outQ = $("#bbQtyOut", sec), outD = $("#bbDaysOut", sec), cnt = $("#bbCount", sec);
    const sSvc = $("#bsSvc", sec), sUse = $("#bsUse", sec), sQty = $("#bsQty", sec), sDay = $("#bsDay", sec), sIdea = $("#bsIdea", sec), sNm = $("#bsName", sec);
    const meter = $(".bb-meter", sec), hint = $("#bbHint", sec), send = $("#bbSend", sec), copy = $("#bbCopy", sec);

    const T = {
      en: {
        none: "Not chosen yet", day1: "within 1 day", dayN: n => "within " + n + " days",
        tag: d => d <= 2 ? "Rush" : d <= 7 ? "Quick" : d <= 14 ? "Standard" : "Flexible",
        noIdea: "Not added yet", count: n => n + " / 400",
        hSvc: "Choose at least one service to continue.",
        hIdea: "Add a short idea or a reference link for a faster start.",
        hUse: "Tell me where the work will be used.",
        hOk: "Your brief is ready to send.",
        copied: "Copied ✓", hello: "Hello Tiamo 👋", intro: "I found your portfolio and I'd like to start a project.",
        l: { svc: "Service", use: "Use", qty: "Quantity", dl: "Deadline", idea: "Idea / notes", nm: "Name" },
        outro: "Sent from the Brief Builder on your portfolio.",
        ph: { idea: "Describe your idea, style, or paste a reference link…", nm: "Your name (optional)" }
      },
      ar: {
        none: "لم يُحدَّد بعد", day1: "خلال يوم واحد", dayN: n => (n === 2 ? "خلال يومين" : n <= 10 ? "خلال " + n + " أيام" : "خلال " + n + " يومًا"),
        tag: d => d <= 2 ? "عاجل" : d <= 7 ? "سريع" : d <= 14 ? "عادي" : "مرن",
        noIdea: "لم تُضَف بعد", count: n => n + " / 400",
        hSvc: "اختر خدمة واحدة على الأقل للمتابعة.",
        hIdea: "أضف فكرة مختصرة أو رابط مرجع لتبدأ بشكل أسرع.",
        hUse: "أخبرني أين سيُستخدم العمل.",
        hOk: "الملخص جاهز للإرسال.",
        copied: "تم النسخ ✓", hello: "مرحبًا تيامو 👋", intro: "شاهدت معرض أعمالك وأرغب في بدء مشروع.",
        l: { svc: "الخدمة", use: "الاستخدام", qty: "الكمية", dl: "الموعد", idea: "الفكرة / ملاحظات", nm: "الاسم" },
        outro: "أُرسلت من منشئ الطلب في معرض أعمالك.",
        ph: { idea: "صف فكرتك أو أسلوبك المطلوب، أو الصق رابط مرجع…", nm: "اسمك (اختياري)" }
      }
    };
    const t = () => T[isAr() ? "ar" : "en"];
    const lab = b => b.getAttribute(isAr() ? "data-ar" : "data-en") || b.textContent;
    const chosenSvc = () => svc.filter(b => b.getAttribute("aria-checked") === "true");
    const chosenUse = () => use.find(b => b.getAttribute("aria-checked") === "true");
    const fill = r => r.style.setProperty("--v", ((r.value - r.min) / (r.max - r.min) * 100).toFixed(1) + "%");
    const setDD = (el, text, empty) => { el.textContent = text; el.classList.toggle("empty", !!empty); };
    const trim = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
    const days = () => +day.value;
    const qtyText = () => {
      const n = +qty.value;
      if (!isAr()) return n + (n === 1 ? " piece" : " pieces");
      return n === 1 ? "عمل واحد" : n === 2 ? "عملان" : n <= 10 ? n + " أعمال" : n + " عملًا";
    };
    const dayText = () => (days() === 1 ? t().day1 : t().dayN(days()));

    const render = () => {
      const L = t(), s = chosenSvc(), u = chosenUse(), text = idea.value.trim(), name = nm.value.trim();
      fill(qty); fill(day);
      outQ.textContent = qtyText();
      outD.innerHTML = dayText() + "<em>" + L.tag(days()) + "</em>";
      cnt.textContent = L.count(idea.value.length);
      idea.placeholder = L.ph.idea; nm.placeholder = L.ph.nm;
      const sepS = isAr() ? "، " : ", ";
      setDD(sSvc, s.length ? s.map(lab).join(sepS) : L.none, !s.length);
      setDD(sUse, u ? lab(u) : L.none, !u);
      setDD(sQty, qtyText(), false);
      setDD(sDay, dayText(), false);
      setDD(sIdea, text ? trim(text, 110) : L.noIdea, !text);
      setDD(sNm, name || "—", !name);
      const score = (s.length ? 35 : 0) + (u ? 20 : 0) + (text.length >= 20 ? 30 : text ? 15 : 0) + (name ? 15 : 0);
      meter.style.setProperty("--m", score + "%");
      hint.textContent = !s.length ? L.hSvc : !u ? L.hUse : text.length < 20 ? L.hIdea : L.hOk;
      send.setAttribute("aria-disabled", s.length ? "false" : "true");
    };

    const message = () => {
      const L = t(), s = chosenSvc(), u = chosenUse(), text = idea.value.trim(), name = nm.value.trim();
      const sep = isAr() ? "، " : ", ";
      const lines = [L.hello, L.intro, "",
        "• " + L.l.svc + ": " + s.map(lab).join(sep),
        u ? "• " + L.l.use + ": " + lab(u) : "",
        "• " + L.l.qty + ": " + qtyText(),
        "• " + L.l.dl + ": " + dayText(),
        text ? "• " + L.l.idea + ": " + text : "",
        name ? "• " + L.l.nm + ": " + name : "",
        "", L.outro];
      return lines.filter((x, i) => x !== "" || (i > 0 && lines[i - 1] !== "")).join("\n");
    };

    svc.forEach(b => b.addEventListener("click", () => {
      b.setAttribute("aria-checked", b.getAttribute("aria-checked") === "true" ? "false" : "true"); render();
    }));
    use.forEach(b => b.addEventListener("click", () => {
      const was = b.getAttribute("aria-checked") === "true";
      use.forEach(x => x.setAttribute("aria-checked", "false"));
      b.setAttribute("aria-checked", was ? "false" : "true"); render();
    }));
    [qty, day, idea, nm].forEach(el => el.addEventListener("input", render));

    send.addEventListener("click", () => {
      if (!chosenSvc().length) {
        const g = $("#bbService", sec);
        g.classList.remove("bb-shake"); void g.offsetWidth; g.classList.add("bb-shake");
        g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        return;
      }
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message()), "_blank", "noopener");
    });
    copy.addEventListener("click", async () => {
      const msg = message();
      try { await navigator.clipboard.writeText(msg); }
      catch (_) {
        const ta = document.createElement("textarea"); ta.value = msg; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove();
      }
      copy.textContent = t().copied;
      setTimeout(() => { copy.innerHTML = copy.getAttribute(isAr() ? "data-ar" : "data-en"); }, 1600);
    });

    onLang(() => setTimeout(render, 30));
    render();
  }));
})();
