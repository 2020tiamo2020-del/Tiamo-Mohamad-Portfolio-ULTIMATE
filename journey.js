/* TIAMO — Journey Mode
   A separate holographic world holding every section of the site.
   - Header button (#journeyBtn) opens it; the normal site and nav are untouched.
   - Map: scroll / swipe / arrows travel between section cards floating in depth.
   - Inside: click a card to see the section from inside (glass panel + content flying past).
   - Phones, touch and reduced-motion get a simple "lite" list (no canvas, no 3D). */
(function () {
  "use strict";

  var UI = {
    en: {
      brand: "TIAMO \u00b7 <b>JOURNEY</b>", exit: "EXIT \u2715",
      hintMap: "SCROLL TO TRAVEL \u00b7 CLICK TO ENTER", hintIn: "SCROLL TO FLY THROUGH \u00b7 ESC TO RETURN",
      ov: "OVERVIEW", inside: "INSIDE", go: "OPEN SECTION \u2197", back: "BACK TO MAP", enter: "ENTER",
      label: "Journey Mode \u2014 all sections", exitAria: "Exit Journey Mode", prev: "Previous section", next: "Next section"
    },
    ar: {
      brand: "\u062a\u064a\u0627\u0645\u0648 \u00b7 <b>\u0627\u0644\u0631\u062d\u0644\u0629</b>", exit: "\u062e\u0631\u0648\u062c \u2715",
      hintMap: "\u0645\u0631\u0651\u0631 \u0644\u0644\u062a\u0646\u0642\u0644 \u00b7 \u0627\u0636\u063a\u0637 \u0644\u0644\u062f\u062e\u0648\u0644",
      hintIn: "\u0645\u0631\u0651\u0631 \u0644\u0644\u0637\u064a\u0631\u0627\u0646 \u062f\u0627\u062e\u0644 \u0627\u0644\u0642\u0633\u0645 \u00b7 Esc \u0644\u0644\u0639\u0648\u062f\u0629",
      ov: "\u0646\u0638\u0631\u0629 \u0639\u0627\u0645\u0629", inside: "\u0628\u062f\u0627\u062e\u0644\u0647", go: "\u0627\u0641\u062a\u062d \u0627\u0644\u0642\u0633\u0645 \u2196",
      back: "\u0627\u0644\u0639\u0648\u062f\u0629 \u0644\u0644\u062e\u0631\u064a\u0637\u0629", enter: "\u062f\u062e\u0648\u0644",
      label: "\u0648\u0636\u0639 \u0627\u0644\u0631\u062d\u0644\u0629 \u2014 \u0643\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645",
      exitAria: "\u062e\u0631\u0648\u062c \u0645\u0646 \u0648\u0636\u0639 \u0627\u0644\u0631\u062d\u0644\u0629", prev: "\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u0633\u0627\u0628\u0642", next: "\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u062a\u0627\u0644\u064a"
    }
  };

  /* id = the real section id on the page; fr = items that fly past inside the section.
     i = image path (falls back to a text frame if the file is missing), t = text frame. */
  var SECTIONS = [
    { id: "about", hue: 265, cover: "images/tiamo.jpg",
      en: { t: "About", k: "The creator behind the work",
        o: "Independent visual creator combining AI, Photoshop, compositing, color work and motion to build visuals that feel cinematic, modern and memorable.",
        l: ["AI \u00b7 Photoshop \u00b7 Compositing", "Color work and motion", "From a single image to a full ad"] },
      ar: { t: "\u0639\u0646\u0651\u064a", k: "\u0635\u0627\u0646\u0639 \u0627\u0644\u0623\u0639\u0645\u0627\u0644",
        o: "\u0635\u0627\u0646\u0639 \u0645\u062d\u062a\u0648\u0649 \u0628\u0635\u0631\u064a \u0645\u0633\u062a\u0642\u0644\u060c \u064a\u062c\u0645\u0639 \u0628\u064a\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0627\u0644\u0641\u0648\u062a\u0648\u0634\u0648\u0628 \u0648\u0627\u0644\u062f\u0645\u062c \u0648\u062a\u0635\u062d\u064a\u062d \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u062d\u0631\u0643\u0629 \u0644\u0635\u0646\u0627\u0639\u0629 \u0623\u0639\u0645\u0627\u0644 \u0639\u0635\u0631\u064a\u0629 \u0628\u0637\u0627\u0628\u0639 \u0633\u064a\u0646\u0645\u0627\u0626\u064a.",
        l: ["\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u00b7 \u0641\u0648\u062a\u0648\u0634\u0648\u0628 \u00b7 \u062f\u0645\u062c", "\u062a\u0635\u062d\u064a\u062d \u0623\u0644\u0648\u0627\u0646 \u0648\u062d\u0631\u0643\u0629", "\u0645\u0646 \u0635\u0648\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0625\u0644\u0649 \u0625\u0639\u0644\u0627\u0646 \u0643\u0627\u0645\u0644"] },
      fr: [{ i: "images/tiamo.jpg" }, { t: "AI" }, { t: "PHOTOSHOP" }, { t: "COLOR" }, { t: "MOTION" }] },

    { id: "services", hue: 190,
      en: { t: "Services", k: "What I create",
        o: "AI visuals, Photoshop and manipulation, reels and ads, cinematic video and VFX, graphic design, CV design, drawing and documents.",
        l: ["AI Art & Visuals", "Photoshop & Manipulation", "Reels & Ads", "Cinematic Video & VFX"] },
      ar: { t: "\u0627\u0644\u062e\u062f\u0645\u0627\u062a", k: "\u0645\u0627 \u0623\u064f\u0628\u062f\u0639\u0647",
        o: "\u0645\u0631\u0626\u064a\u0627\u062a \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a\u060c \u0641\u0648\u062a\u0648\u0634\u0648\u0628 \u0648\u062f\u0645\u062c \u0627\u0644\u0635\u0648\u0631\u060c \u0631\u064a\u0644\u0632 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062a\u060c \u0641\u064a\u062f\u064a\u0648 \u0633\u064a\u0646\u0645\u0627\u0626\u064a \u0648VFX\u060c \u062a\u0635\u0645\u064a\u0645 \u062c\u0631\u0627\u0641\u064a\u0643\u064a \u0648CV\u060c \u0648\u0631\u0633\u0645 \u0648\u0645\u0633\u062a\u0646\u062f\u0627\u062a.",
        l: ["\u0641\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0627\u0644\u0645\u0631\u0626\u064a\u0627\u062a", "\u0641\u0648\u062a\u0648\u0634\u0648\u0628 \u0648\u062f\u0645\u062c \u0627\u0644\u0635\u0648\u0631", "\u0631\u064a\u0644\u0632 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062a", "\u0641\u064a\u062f\u064a\u0648 \u0633\u064a\u0646\u0645\u0627\u0626\u064a \u0648VFX"] },
      fr: [{ t: "AI ART" }, { t: "PHOTOSHOP" }, { t: "REELS" }, { t: "VFX" }, { t: "DESIGN" }, { t: "CV" }] },

    { id: "work", hue: 300, cover: "images/pm1.jpg",
      en: { t: "Work", k: "Built for impact",
        o: "A focused showcase of AI art, Photoshop, cinematic reels, VFX and visual design \u2014 presented with full-frame clarity and smooth motion.",
        l: ["AI art", "Photoshop", "Cinematic reels", "VFX and visual design"] },
      ar: { t: "\u0627\u0644\u0623\u0639\u0645\u0627\u0644", k: "\u0645\u0635\u0645\u0645\u0629 \u0644\u062a\u062a\u0631\u0643 \u0623\u062b\u0631\u064b\u0627",
        o: "\u0639\u0631\u0636 \u0645\u0631\u0643\u0651\u0632 \u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0648\u0627\u0644\u0641\u0648\u062a\u0648\u0634\u0648\u0628 \u0648\u0627\u0644\u0631\u064a\u0644\u0632 \u0627\u0644\u0633\u064a\u0646\u0645\u0627\u0626\u064a\u0629 \u0648VFX \u0648\u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0628\u0635\u0631\u064a \u2014 \u0628\u0648\u0636\u0648\u062d \u0643\u0627\u0645\u0644 \u0648\u062d\u0631\u0643\u0629 \u0633\u0644\u0633\u0629.",
        l: ["\u0641\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a", "\u0641\u0648\u062a\u0648\u0634\u0648\u0628", "\u0631\u064a\u0644\u0632 \u0633\u064a\u0646\u0645\u0627\u0626\u064a\u0629", "VFX \u0648\u062a\u0635\u0645\u064a\u0645 \u0628\u0635\u0631\u064a"] },
      fr: [{ i: "images/pm1.jpg" }, { i: "images/pm2.jpg" }, { i: "images/pm3.jpg" }, { i: "images/pm9.jpg" }, { t: "WORK" }] },

    { id: "cinema", hue: 210,
      en: { t: "Beyond", k: "Powers beyond your imagination",
        o: "The cinematic chapter of the portfolio \u2014 scenes built around powers and worlds beyond imagination.",
        l: ["Cinematic scenes", "Atmosphere and effects", "Motion and finishing"] },
      ar: { t: "\u0645\u0627 \u0648\u0631\u0627\u0621 \u0627\u0644\u062e\u064a\u0627\u0644", k: "\u0642\u062f\u0631\u0627\u062a \u0641\u0648\u0642 \u062e\u064a\u0627\u0644\u0643",
        o: "\u0627\u0644\u0641\u0635\u0644 \u0627\u0644\u0633\u064a\u0646\u0645\u0627\u0626\u064a \u0645\u0646 \u0627\u0644\u0645\u0648\u0642\u0639 \u2014 \u0645\u0634\u0627\u0647\u062f \u0645\u0628\u0646\u064a\u0629 \u0639\u0644\u0649 \u0642\u062f\u0631\u0627\u062a \u0648\u0639\u0648\u0627\u0644\u0645 \u062a\u062a\u062c\u0627\u0648\u0632 \u0627\u0644\u062e\u064a\u0627\u0644.",
        l: ["\u0645\u0634\u0627\u0647\u062f \u0633\u064a\u0646\u0645\u0627\u0626\u064a\u0629", "\u0623\u062c\u0648\u0627\u0621 \u0648\u0645\u0624\u062b\u0631\u0627\u062a", "\u062d\u0631\u0643\u0629 \u0648\u0644\u0645\u0633\u0629 \u0646\u0647\u0627\u0626\u064a\u0629"] },
      fr: [{ t: "BEYOND" }, { t: "POWER" }, { t: "CINEMA" }, { t: "VFX" }] },

    { id: "creation", hue: 320, cover: "images/l1.jpg",
      en: { t: "AI Creation", k: "Worlds beyond imagination",
        o: "A living wall of AI artwork \u2014 fantasy realms, supernatural beings and superhuman power, each frame built from a single idea and pushed until it feels real.",
        l: ["Fantasy realms", "Supernatural beings", "Superhuman power"] },
      ar: { t: "\u0625\u0628\u062f\u0627\u0639 \u0627\u0644\u0640 AI", k: "\u0639\u0648\u0627\u0644\u0645 \u062a\u062a\u062c\u0627\u0648\u0632 \u0627\u0644\u062e\u064a\u0627\u0644",
        o: "\u062c\u062f\u0627\u0631 \u062d\u064a\u0651 \u0645\u0646 \u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u2014 \u0639\u0648\u0627\u0644\u0645 \u0641\u0627\u0646\u062a\u0627\u0632\u064a\u0627 \u0648\u0643\u0627\u0626\u0646\u0627\u062a \u0645\u0627 \u0648\u0631\u0627\u0621 \u0627\u0644\u0637\u0628\u064a\u0639\u0629 \u0648\u0642\u0648\u0649 \u062e\u0627\u0631\u0642\u0629\u060c \u0643\u0644 \u0625\u0637\u0627\u0631 \u0648\u064f\u0644\u062f \u0645\u0646 \u0641\u0643\u0631\u0629 \u0648\u0627\u062d\u062f\u0629 \u0648\u0635\u064f\u0642\u0644 \u062d\u062a\u0649 \u064a\u0628\u062f\u0648 \u062d\u0642\u064a\u0642\u064a\u064b\u0627.",
        l: ["\u0639\u0648\u0627\u0644\u0645 \u0641\u0627\u0646\u062a\u0627\u0632\u064a\u0627", "\u0643\u0627\u0626\u0646\u0627\u062a \u0645\u0627 \u0648\u0631\u0627\u0621 \u0627\u0644\u0637\u0628\u064a\u0639\u0629", "\u0642\u0648\u0649 \u062e\u0627\u0631\u0642\u0629"] },
      fr: [{ i: "images/l1.jpg" }, { t: "FANTASY" }, { t: "SUPERNATURAL" }, { t: "POWER" }] },

    { id: "beforeafter", hue: 35,
      en: { t: "Before & After", k: "The Photoshop transformation",
        o: "Drag the handle to compare the original shot with the final retouched and color-graded result.",
        l: ["Skin", "Color", "Composite"] },
      ar: { t: "\u0642\u0628\u0644 \u0648\u0628\u0639\u062f", k: "\u062a\u062d\u0648\u0651\u0644 \u0627\u0644\u0641\u0648\u062a\u0648\u0634\u0648\u0628",
        o: "\u0627\u0633\u062d\u0628 \u0627\u0644\u0645\u0642\u0628\u0636 \u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629 \u0628\u0627\u0644\u0646\u062a\u064a\u062c\u0629 \u0627\u0644\u0646\u0647\u0627\u0626\u064a\u0629 \u0628\u0639\u062f \u0627\u0644\u062a\u0646\u0642\u064a\u062d \u0648\u062a\u0635\u062d\u064a\u062d \u0627\u0644\u0623\u0644\u0648\u0627\u0646.",
        l: ["\u0627\u0644\u0628\u0634\u0631\u0629", "\u0627\u0644\u0623\u0644\u0648\u0627\u0646", "\u0627\u0644\u062f\u0645\u062c"] },
      fr: [{ t: "BEFORE" }, { t: "AFTER" }, { t: "SKIN" }, { t: "COLOR" }, { t: "COMPOSITE" }] },

    { id: "process", hue: 160,
      en: { t: "Process", k: "From first idea to final frame",
        o: "Six steps from the brief to the final delivery. References, colors and mood are agreed before any heavy work starts.",
        l: ["Brief & Idea", "Direction & Mood", "The Creation"] },
      ar: { t: "\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0639\u0645\u0644", k: "\u0645\u0646 \u0627\u0644\u0641\u0643\u0631\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0625\u0644\u0649 \u0627\u0644\u0625\u0637\u0627\u0631 \u0627\u0644\u0623\u062e\u064a\u0631",
        o: "\u0633\u062a \u062e\u0637\u0648\u0627\u062a \u0645\u0646 \u0627\u0644\u0641\u0643\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u062a\u0633\u0644\u064a\u0645. \u0646\u062a\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u0645\u0631\u0627\u062c\u0639 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0623\u062c\u0648\u0627\u0621 \u0642\u0628\u0644 \u0628\u062f\u0621 \u0627\u0644\u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0641\u0639\u0644\u064a.",
        l: ["\u0627\u0644\u0641\u0643\u0631\u0629 \u0648\u0627\u0644\u0645\u062a\u0637\u0644\u0628\u0627\u062a", "\u0627\u0644\u0627\u062a\u062c\u0627\u0647 \u0648\u0627\u0644\u0623\u062c\u0648\u0627\u0621", "\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0625\u0628\u062f\u0627\u0639"] },
      fr: [{ t: "BRIEF" }, { t: "MOOD" }, { t: "CREATION" }, { t: "FINAL FRAME" }] },

    { id: "findme", hue: 230,
      en: { t: "Find Me", k: "More work. More motion.",
        o: "Instagram, TikTok, Facebook and the Photoshop Mode group \u2014 more work and more motion, where I post it.",
        l: ["Instagram", "TikTok", "Facebook", "Photoshop Mode group"] },
      ar: { t: "\u062a\u062c\u062f\u0646\u064a \u0647\u0646\u0627", k: "\u0627\u0644\u0645\u0632\u064a\u062f \u0645\u0646 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u062d\u0631\u0643\u0629",
        o: "\u0625\u0646\u0633\u062a\u062c\u0631\u0627\u0645 \u0648\u062a\u064a\u0643 \u062a\u0648\u0643 \u0648\u0641\u064a\u0633\u0628\u0648\u0643 \u0648\u0645\u062c\u0645\u0648\u0639\u0629 Photoshop Mode \u2014 \u0627\u0644\u0645\u0632\u064a\u062f \u0645\u0646 \u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0648\u0627\u0644\u062d\u0631\u0643\u0629 \u062d\u064a\u062b \u0623\u0646\u0634\u0631\u0647\u0627.",
        l: ["Instagram", "TikTok", "Facebook", "Photoshop Mode"] },
      fr: [{ i: "fm-instagram.jpg" }, { i: "fm-tiktok.jpg" }, { i: "fm-photoshop-p.jpg" }, { t: "FACEBOOK" }] },

    { id: "brief", hue: 280,
      en: { t: "Start a Project", k: "Tell me what you need",
        o: "Pick your services, add the idea, quantity and deadline \u2014 it opens WhatsApp with your message ready. Nothing is stored on this site.",
        l: ["Your brief", "Quantity and deadline", "Opens WhatsApp"] },
      ar: { t: "\u0627\u0628\u062f\u0623 \u0645\u0634\u0631\u0648\u0639\u0643", k: "\u0642\u0644 \u0644\u064a \u0645\u0627 \u062a\u062d\u062a\u0627\u062c\u0647",
        o: "\u0627\u062e\u062a\u0631 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u0623\u0636\u0641 \u0627\u0644\u0641\u0643\u0631\u0629 \u0648\u0627\u0644\u0643\u0645\u064a\u0629 \u0648\u0627\u0644\u0645\u0648\u0639\u062f \u2014 \u064a\u0641\u062a\u062d \u0648\u0627\u062a\u0633\u0627\u0628 \u0648\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u062c\u0627\u0647\u0632\u0629. \u0644\u0627 \u064a\u062a\u0645 \u062d\u0641\u0638 \u0623\u064a \u0628\u064a\u0627\u0646\u0627\u062a \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0642\u0639.",
        l: ["\u0637\u0644\u0628\u0643", "\u0627\u0644\u0643\u0645\u064a\u0629 \u0648\u0627\u0644\u0645\u0648\u0639\u062f", "\u064a\u0641\u062a\u062d \u0648\u0627\u062a\u0633\u0627\u0628"] },
      fr: [{ t: "BRIEF" }, { t: "IDEA" }, { t: "DEADLINE" }, { t: "SEND" }] },

    { id: "contact", hue: 190,
      en: { t: "Contact", k: "Let\u2019s make it visual",
        o: "For AI art, Photoshop work, reels, ads, cinematic videos, VFX, graphic design or a modern CV \u2014 message me directly.",
        l: ["AI art", "Photoshop", "Reels and ads", "VFX, graphic design and CV"] },
      ar: { t: "\u062a\u0648\u0627\u0635\u0644", k: "\u062f\u0639\u0646\u0627 \u0646\u062d\u0648\u0651\u0644\u0647\u0627 \u0625\u0644\u0649 \u0639\u0645\u0644 \u0628\u0635\u0631\u064a",
        o: "\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0623\u0648 \u0627\u0644\u0641\u0648\u062a\u0648\u0634\u0648\u0628 \u0623\u0648 \u0627\u0644\u0631\u064a\u0644\u0632 \u0623\u0648 \u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062a \u0623\u0648 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u0647\u0627\u062a \u0627\u0644\u0633\u064a\u0646\u0645\u0627\u0626\u064a\u0629 \u0623\u0648 VFX \u0623\u0648 \u0627\u0644\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u062c\u0631\u0627\u0641\u064a\u0643\u064a \u0623\u0648 \u0633\u064a\u0631\u0629 \u0630\u0627\u062a\u064a\u0629 (CV) \u0639\u0635\u0631\u064a\u0629 \u2014 \u0631\u0627\u0633\u0644\u0646\u064a \u0645\u0628\u0627\u0634\u0631\u0629.",
        l: ["\u0641\u0646 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a", "\u0641\u0648\u062a\u0648\u0634\u0648\u0628", "\u0631\u064a\u0644\u0632 \u0648\u0625\u0639\u0644\u0627\u0646\u0627\u062a", "VFX \u0648\u062a\u0635\u0645\u064a\u0645 \u062c\u0631\u0627\u0641\u064a\u0643\u064a \u0648CV"] },
      fr: [{ t: "HELLO" }, { t: "WHATSAPP" }, { t: "CONTACT" }] }
  ];

  var N = SECTIONS.length;
  var LANES = [-0.5, 0.42, -0.12, 0.55, -0.38, 0.2];
  var LIFTS = [-0.12, 0.1, 0.18, -0.2, 0.06, -0.05];

  var root, cv, ctx, stage, flight, panel, countEl, hintEl, brandEl, exitEl;
  var cards = [], dots = [], frames = [], parts = [];
  var built = false, isOpen = false, state = "map", lite = false;
  var cur = 0, pos = 0, target = 0, speed = 0, flightV = 0, flightP = 0, gridOff = 0;
  var W = 0, H = 0, dpr = 1, cw = 420, lastCount = -1, raf = 0, lastT = 0, idleTimer = 0;
  var drag = null, dragged = false, lastActive = null;

  function L() { return document.documentElement.lang === "ar" ? "ar" : "en"; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- build the world once ---------- */
  function build() {
    if (built) return;
    built = true;
    root = document.createElement("div");
    root.className = "jy";
    root.id = "journey";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("data-lenis-prevent", "");
    root.innerHTML =
      '<canvas class="jy-bg" aria-hidden="true"></canvas><div class="jy-vig"></div>' +
      '<div class="jy-stage"></div>' +
      '<div class="jy-detail"><div class="jy-flight"></div><aside class="jy-panel" tabindex="-1"></aside></div>' +
      '<div class="jy-hud"><div class="jy-top"><span class="jy-brand"></span><button class="jy-exit" type="button"></button></div>' +
      '<nav class="jy-rail"></nav><div class="jy-count"></div><div class="jy-hint"></div></div>';
    document.body.appendChild(root);

    cv = root.querySelector(".jy-bg");
    stage = root.querySelector(".jy-stage");
    flight = root.querySelector(".jy-flight");
    panel = root.querySelector(".jy-panel");
    countEl = root.querySelector(".jy-count");
    hintEl = root.querySelector(".jy-hint");
    brandEl = root.querySelector(".jy-brand");
    exitEl = root.querySelector(".jy-exit");
    var rail = root.querySelector(".jy-rail");

    SECTIONS.forEach(function (s, i) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "jy-card";
      c.setAttribute("data-i", i);
      c.style.setProperty("--h", s.hue);
      c.innerHTML =
        '<span class="jy-card-in"><span class="jy-art">' +
        (s.cover ? '<img alt="" decoding="async" loading="lazy" src="' + esc(s.cover) + '">' : "") +
        '<span class="jy-glyph">' + pad(i + 1) + "</span></span>" +
        '<span class="jy-meta"><span class="jy-n">' + pad(i + 1) + " / " + pad(N) + '</span><span class="jy-t"></span><span class="jy-k"></span></span>' +
        '<span class="jy-enter"></span><i class="jy-tick tl"></i><i class="jy-tick tr"></i><i class="jy-tick bl"></i><i class="jy-tick br"></i></span>';
      var im = c.querySelector("img");
      if (im) im.onerror = function () { im.remove(); };
      c.addEventListener("click", function () {
        if (dragged || state !== "map") return;
        if (lite || Math.round(pos) === i) enter(i); else target = i;
      });
      stage.appendChild(c);
      cards.push(c);

      var d = document.createElement("button");
      d.type = "button";
      d.className = "jy-dot";
      d.addEventListener("click", function () { if (state === "map") target = i; else { cur = i; step(0); } });
      rail.appendChild(d);
      dots.push(d);
    });

    exitEl.addEventListener("click", function () { close(); });
    panel.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b) return;
      if (b.classList.contains("jy-go")) goSection();
      else if (b.classList.contains("jy-back")) back();
      else if (b.classList.contains("jy-prev")) step(-1);
      else if (b.classList.contains("jy-next")) step(1);
    });
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
  }

  /* ---------- language ---------- */
  function applyLang() {
    if (!built) return;
    var lg = L(), u = UI[lg];
    root.setAttribute("lang", lg);
    root.setAttribute("aria-label", u.label);
    brandEl.innerHTML = u.brand;
    exitEl.textContent = u.exit;
    exitEl.setAttribute("aria-label", u.exitAria);
    SECTIONS.forEach(function (s, i) {
      var d = s[lg], c = cards[i];
      c.querySelector(".jy-t").textContent = d.t;
      c.querySelector(".jy-k").textContent = d.k;
      c.querySelector(".jy-enter").textContent = u.enter;
      c.setAttribute("aria-label", d.t);
      dots[i].setAttribute("aria-label", d.t);
      dots[i].title = d.t;
    });
    hintEl.textContent = state === "detail" ? u.hintIn : u.hintMap;
    if (state === "detail") fillPanel(cur);
  }

  /* ---------- sizes ---------- */
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (cv && !lite) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    cw = Math.round(Math.min(560, Math.max(300, W * 0.34)));
    root.style.setProperty("--cw", cw + "px");
  }
  function onResize() { resize(); }

  /* ---------- open / close ---------- */
  function open() {
    build();
    if (isOpen) return;
    isOpen = true;
    var mm = window.matchMedia ? window.matchMedia("(max-width: 820px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches : false;
    lite = mm;
    root.classList.toggle("jy-lite", lite);
    root.classList.remove("jy-in");
    var b = document.getElementById("journeyBtn");
    if (b) {
      var r = b.getBoundingClientRect();
      root.style.setProperty("--ox", Math.round(r.left + r.width / 2) + "px");
      root.style.setProperty("--oy", Math.round(r.top + r.height / 2) + "px");
    }
    state = "map"; cur = 0; speed = 0; flightV = 0; lastCount = -1; target = 0;
    pos = lite ? 0 : -1.7;
    ctx = (!lite && cv.getContext) ? cv.getContext("2d") : null;
    resize();
    initParts();
    applyLang();
    layout(0);
    updateCount();
    lastActive = document.activeElement;
    document.documentElement.classList.add("jy-open");
    root.setAttribute("aria-hidden", "false");
    void root.offsetWidth;
    root.classList.add("jy-on");
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey, true);
    lastT = performance.now();
    if (!lite) raf = requestAnimationFrame(frame);
    setTimeout(function () { if (isOpen) exitEl.focus({ preventScroll: true }); }, 450);
    try { window.dispatchEvent(new CustomEvent("tm:journey", { detail: { open: true } })); } catch (e) {}
  }

  function close(noFocus) {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove("jy-on");
    root.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("jy-open");
    window.removeEventListener("resize", onResize);
    document.removeEventListener("keydown", onKey, true);
    cancelAnimationFrame(raf);
    raf = 0;
    setTimeout(function () { if (!isOpen) { root.classList.remove("jy-in"); state = "map"; } }, 1000);
    if (!noFocus && lastActive && lastActive.focus) lastActive.focus({ preventScroll: true });
    try { window.dispatchEvent(new CustomEvent("tm:journey", { detail: { open: false } })); } catch (e) {}
  }

  /* ---------- map <-> inside ---------- */
  function enter(i) {
    cur = i; target = i;
    if (lite) pos = i;
    state = "detail";
    flightP = Math.random(); flightV = 0.35;
    fillPanel(i);
    if (!lite) buildFrames(i);
    root.classList.add("jy-in");
    hintEl.textContent = UI[L()].hintIn;
    updateCount();
    setTimeout(function () { var g = panel.querySelector(".jy-go"); if (g && state === "detail") g.focus({ preventScroll: true }); }, 550);
  }
  function back() {
    state = "map";
    root.classList.remove("jy-in");
    hintEl.textContent = UI[L()].hintMap;
    updateCount();
    var c = cards[cur];
    if (c) setTimeout(function () { if (state === "map" && isOpen) c.focus({ preventScroll: true }); }, 550);
  }
  function step(dir) {
    cur = (cur + dir + N) % N;
    target = cur; pos = cur;
    fillPanel(cur);
    if (!lite) buildFrames(cur);
    flightV = 0.5;
    updateCount();
  }
  function goSection() {
    var id = SECTIONS[cur].id;
    close(true);
    setTimeout(function () {
      var a = document.querySelector('#nav a[href="#' + id + '"]');
      if (a) a.click();
      else { var el = document.getElementById(id); if (el && el.scrollIntoView) el.scrollIntoView(); }
    }, 450);
  }

  function fillPanel(i) {
    var lg = L(), s = SECTIONS[i], d = s[lg], u = UI[lg];
    panel.setAttribute("dir", lg === "ar" ? "rtl" : "ltr");
    panel.setAttribute("lang", lg);
    panel.setAttribute("aria-label", d.t);
    panel.innerHTML =
      '<p class="jy-kick">' + pad(i + 1) + " / " + pad(N) + " \u2014 " + esc(SECTIONS[i].en.t.toUpperCase()) + "</p>" +
      "<h2>" + esc(d.t) + '</h2><p class="jy-sub">' + esc(d.k) + "</p>" +
      '<p class="jy-lab">' + u.ov + '</p><p class="jy-ov">' + esc(d.o) + "</p>" +
      '<p class="jy-lab">' + u.inside + '</p><ul class="jy-list">' +
      d.l.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" +
      '<div class="jy-btns"><button class="jy-go" type="button">' + u.go + '</button><button class="jy-back" type="button">' + u.back + "</button>" +
      '<button class="jy-nav jy-prev" type="button" aria-label="' + u.prev + '">\u2039</button><button class="jy-nav jy-next" type="button" aria-label="' + u.next + '">\u203a</button></div>';
  }

  function buildFrames(i) {
    flight.innerHTML = "";
    frames = [];
    var s = SECTIONS[i];
    s.fr.forEach(function (f, k) {
      var el = document.createElement("div");
      el.className = "jy-fr";
      el.style.setProperty("--h", (s.hue + k * 22) % 360);
      function label(txt) { var b = document.createElement("b"); b.textContent = txt; el.appendChild(b); }
      if (f.i) {
        var im = new Image();
        im.alt = ""; im.decoding = "async"; im.src = f.i;
        im.onerror = function () { im.remove(); label(s.en.t.toUpperCase()); };
        el.appendChild(im);
      } else label(f.t);
      flight.appendChild(el);
      frames.push({ el: el, lane: LANES[k % LANES.length], lift: LIFTS[k % LIFTS.length], ph: k / s.fr.length });
    });
  }

  /* ---------- input ---------- */
  function snap() { target = clamp(Math.round(target), 0, N - 1); }
  function onWheel(e) {
    e.stopPropagation();
    if (lite) return;
    e.preventDefault();
    var d = (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 33 : 1);
    if (state === "map") {
      target = clamp(target + d * 0.0022, 0, N - 1);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(snap, 170);
    } else {
      flightV = clamp(flightV + d * 0.0005, -0.7, 0.9);
    }
  }
  function onDown(e) {
    if (lite || state !== "map" || (e.target.closest && e.target.closest(".jy-hud button"))) return;
    drag = { x: e.clientX, y: e.clientY, t: target, moved: false };
  }
  function onMove(e) {
    if (!drag) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 8) return;
    drag.moved = true; dragged = true;
    var dd = Math.abs(dx) > Math.abs(dy) ? -dx / (cw * 0.82) : -dy / 240;
    target = clamp(drag.t + dd, 0, N - 1);
  }
  function endDrag() {
    if (!drag) return;
    var m = drag.moved;
    drag = null;
    if (m) { snap(); setTimeout(function () { dragged = false; }, 0); }
  }
  function focusables() {
    var all = root.querySelectorAll("button:not([disabled])"), out = [];
    for (var i = 0; i < all.length; i++) {
      var cs = window.getComputedStyle(all[i]);
      if (cs.visibility !== "hidden" && cs.display !== "none") out.push(all[i]);
    }
    return out;
  }
  function onKey(e) {
    if (!isOpen) return;
    var k = e.key;
    if (k === "Escape") { e.preventDefault(); e.stopPropagation(); if (state === "detail") back(); else close(); return; }
    if (k === "Tab") {
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (!root.contains(a)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (state === "map" && !lite) {
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown") { e.preventDefault(); target = clamp(Math.round(target) + 1, 0, N - 1); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); target = clamp(Math.round(target) - 1, 0, N - 1); }
      else if (k === "Home") { e.preventDefault(); target = 0; }
      else if (k === "End") { e.preventDefault(); target = N - 1; }
    } else if (state === "detail") {
      if (k === "ArrowRight") step(1); else if (k === "ArrowLeft") step(-1);
    }
  }

  /* ---------- render ---------- */
  function updateCount() {
    var idx = state === "detail" ? cur : clamp(Math.round(pos), 0, N - 1);
    if (idx === lastCount) return;
    lastCount = idx;
    countEl.innerHTML = "<b>" + pad(idx + 1) + "</b> <span>/ " + pad(N) + "</span>";
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle("on", i === idx);
  }

  function layout(time) {
    if (lite) {
      for (var j = 0; j < cards.length; j++) { cards[j].style.transform = ""; cards[j].style.opacity = ""; cards[j].style.filter = ""; }
      return;
    }
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], d = i - pos, a = Math.abs(d);
      if (a > 3.6) { c.style.visibility = "hidden"; continue; }
      c.style.visibility = "visible";
      var x = d * cw * 0.82, z = -a * 330, ry = -d * 16;
      var y = Math.sin(time * 0.9 + i) * 4 + a * 14;
      var sc = 1 + (a < 1 ? (1 - a) * 0.14 : 0);
      var op = Math.max(0, 1 - a * 0.27);
      var bl = a < 0.4 ? 0 : Math.min(7, (a - 0.4) * 3);
      c.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px) rotateY(" + ry.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      c.style.opacity = op.toFixed(3);
      c.style.filter = bl > 0.1 ? "blur(" + bl.toFixed(1) + "px)" : "none";
      c.style.zIndex = String(100 - Math.round(a * 10));
      c.style.pointerEvents = op > 0.15 ? "auto" : "none";
      c.classList.toggle("is-focus", a < 0.5);
    }
  }

  function flightStep(dt) {
    flightP += (0.055 + flightV) * dt;
    flightV *= Math.pow(0.35, dt);
    var fw = flight.clientWidth, fh = flight.clientHeight;
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i], t = flightP + f.ph;
      t = t - Math.floor(t);
      var z = -2300 + t * 2700, x = f.lane * fw * 0.55, y = f.lift * fh * 0.9, ry = -f.lane * 26;
      var op = Math.min(1, t / 0.14, (1 - t) / 0.14);
      f.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + z.toFixed(1) + "px) rotateY(" + ry.toFixed(1) + "deg)";
      f.el.style.opacity = (op < 0 ? 0 : op).toFixed(3);
    }
  }

  function initParts() {
    parts = [];
    if (lite) return;
    for (var i = 0; i < 240; i++) parts.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), c: Math.random() < 0.7 ? "22,216,255" : "170,110,255" });
  }

  function draw(dt) {
    if (!ctx) return;
    var w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    var inD = state === "detail";
    var fs = (inD ? 0.5 : 0.1) + speed * 0.45 + Math.abs(flightV) * 0.5;
    var hy = h * 0.6, cx = w / 2, i, z, y, a;
    gridOff = (gridOff + fs * dt * 1.4) % 1;
    ctx.lineWidth = Math.max(1, dpr * 0.9);
    /* floor: horizontals race toward the camera */
    for (i = 0; i < 16; i++) {
      z = (i + gridOff) / 16;
      y = hy + (h - hy) * Math.pow(z, 2.4);
      a = 0.04 + 0.3 * z;
      ctx.strokeStyle = "rgba(22,216,255," + a.toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(139,53,255,0.2)";
    ctx.beginPath();
    for (i = -14; i <= 14; i++) { ctx.moveTo(cx + i * w * 0.004, hy); ctx.lineTo(cx + i * w * 0.11, h); }
    ctx.stroke();
    var g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, "rgba(139,53,255,0)"); g.addColorStop(0.5, "rgba(22,216,255,0.6)"); g.addColorStop(1, "rgba(139,53,255,0)");
    ctx.strokeStyle = g; ctx.lineWidth = Math.max(1, dpr * 1.4);
    ctx.beginPath(); ctx.moveTo(0, hy); ctx.lineTo(w, hy); ctx.stroke();
    /* particles streaming past, streaks grow with speed */
    ctx.lineWidth = Math.max(1, dpr);
    var cy = h * 0.5;
    for (i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.z -= fs * dt * 0.9;
      if (p.z <= 0.04) { p.z = 1; p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; }
      var sx = cx + p.x / p.z * w * 0.18, sy = cy + p.y / p.z * h * 0.18;
      var z2 = p.z + Math.max(0.006, fs * 0.05);
      var px = cx + p.x / z2 * w * 0.18, py = cy + p.y / z2 * h * 0.18;
      var al = Math.min(1, (1 - p.z) * 1.3 + 0.1) * 0.8;
      ctx.strokeStyle = "rgba(" + p.c + "," + al.toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
    }
  }

  function frame(t) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, Math.max(0.001, (t - lastT) / 1000));
    lastT = t;
    var prev = pos;
    pos += (target - pos) * (1 - Math.pow(0.0006, dt));
    if (Math.abs(target - pos) < 0.0004) pos = target;
    var vel = Math.abs(pos - prev) / dt;
    speed += (vel - speed) * Math.min(1, dt * 7);
    if (state === "detail") flightStep(dt); else layout(t / 1000);
    draw(dt);
    updateCount();
  }

  /* ---------- init ---------- */
  function init() {
    var b = document.getElementById("journeyBtn");
    if (!b) return;
    b.addEventListener("click", function (e) { e.preventDefault(); open(); });
    if (window.MutationObserver) {
      new MutationObserver(function () { if (built) applyLang(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    }
    window.TMJourney = { open: open, close: close };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
