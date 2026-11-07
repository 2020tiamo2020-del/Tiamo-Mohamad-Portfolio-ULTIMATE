/* 09 / CONTACT — the WhatsApp number: each digit drops in (from the left or the right) when the section is reached, and again on every return to it. */
(() => {
  const btn = document.querySelector("#contact .contact-btn");
  const num = btn && btn.querySelector("b");
  if (!num || num.dataset.cxd) return;
  const txt = num.textContent;
  num.dataset.cxd = "1"; num.setAttribute("aria-label", txt);
  num.textContent = "";
  [...txt].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "d"; s.textContent = ch; s.setAttribute("aria-hidden", "true");
    const side = i % 2 ? 1 : -1, k = (i * 37 % 5) / 5;                        // alternates left / right, a little different each time
    s.style.setProperty("--i", i);
    s.style.setProperty("--dx", side * (46 + k * 70) + "px");
    s.style.setProperty("--dy", -(90 + ((i * 53) % 7) * 16) + "px");
    s.style.setProperty("--r", side * (14 + k * 22) + "deg");
    num.appendChild(s);
  });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  btn.classList.add("cxd-ready");
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && e.intersectionRatio >= 0.6) btn.classList.add("is-in");
    else if (!e.isIntersecting) btn.classList.remove("is-in");
  }), { threshold: [0, 0.6] }).observe(btn);
})();
