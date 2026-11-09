/* =====================================================================
   SERVICES SCENES — 12 tiny animated scenes, one per service card (markup only).
   Styles live in services-scenes.css; services-stage.js mounts them inside each card
   and runs / freezes the animations (only the card in the middle plays).
   p = loop length (ms), f = the frame a card shows while it is NOT in the middle.
   Pure HTML / CSS / SVG. No images required. (Scene 3 plays VFX/rm2.webm if it exists.)
   ===================================================================== */
(() => {
  "use strict";
  const bars = n => Array.from({ length: n }, (_, k) => `<i style="--k:${k}"></i>`).join("");
  const heart = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.5-9C.9 9 2.4 5.5 6 5.5c2 0 3.4 1 4 2.2.6-1.2 2-2.2 4-2.2 3.6 0 5.1 3.5 3.5 6.5C19 16.4 12 21 12 21z"/></svg>';
  const chat = '<svg viewBox="0 0 24 24"><path d="M4 4h16v12H9l-5 4z"/></svg>';
  const send = '<svg viewBox="0 0 24 24"><path d="M3.5 11.5 20.5 4l-5.8 16-3.2-6.6z"/></svg>';

  window.__svScenes = [

    /* 1 · AI Art & Visuals — a picture condenses out of noise while the prompt types itself */
    { p: 7000, f: 4300, html: `
      <div class="pic"><i class="sky"></i><i class="sun"></i><i class="mtn m1"></i><i class="mtn m2"></i><i class="sea"></i><i class="refl"></i></div>
      <i class="noise"></i><i class="scan"></i>
      <span class="step"></span>
      <i class="sp s1">✦</i><i class="sp s2">✦</i><i class="sp s3">✦</i>
      <div class="prompt"><b class="st">✦</b><span class="typed st">a neon coast at dusk, cinematic</span><u class="st"></u></div>` },

    /* 2 · Photoshop & Manipulation — before / after wipe, marching ants, layers panel */
    { p: 6500, f: 3600, html: `
      <div class="fr"><i class="img a"></i><i class="img b"></i><i class="dv"><b></b></i></div>
      <svg class="ants" viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse cx="50" cy="38" rx="44" ry="34" vector-effect="non-scaling-stroke"/></svg>
      <em class="tag l">BEFORE</em><em class="tag r">AFTER</em>
      <div class="lay"><u><i class="eye"></i><s></s></u><u><i class="eye e2"></i><s></s></u><u><i class="eye e3"></i><s></s></u></div>` },

    /* 3 · Reels & Ads — phone, story bars, floating hearts, view counter (plays a real reel when available) */
    { p: 8000, f: 2400, html: `
      <i class="blob b1"></i><i class="blob b2"></i>
      <div class="ph"><i class="fx"></i><video muted loop playsinline preload="none" data-src="VFX/rm2.webm"></video>
        <div class="pg"><i></i><i></i><i></i></div><em class="vw"></em>
        <div class="rail">${heart}${chat}${send}</div>
        <div class="cp"><i class="av"></i><i class="l1"></i><i class="l2"></i></div>
        <i class="h h1">♥</i><i class="h h2">♥</i><i class="h h3">♥</i>
      </div>` },

    /* 4 · Cinematic Video & VFX — letterbox, anamorphic flare, shockwave, colour grade swing, REC timecode */
    { p: 7500, f: 3600, html: `
      <div class="world"><i class="sky"></i><i class="moon"></i>
        <i class="bld b1"></i><i class="bld b2"></i><i class="bld b3"></i><i class="bld b4"></i><i class="bld b5"></i><i class="bld b6"></i>
        <i class="fog"></i><i class="rain"></i></div>
      <i class="gr t"></i><i class="gr o"></i><i class="flare"></i><i class="ring"></i><i class="flash"></i>
      <i class="bar t"></i><i class="bar b"></i><span class="act">ACTION</span>
      <div class="hud"><b class="dot st"></b><span class="tc st"></span><em class="st">24p · 2.39:1</em></div><i class="grain"></i>` },

    /* 5 · Graphic Design — a poster builds itself: shapes, type, guides, palette, cursor */
    { p: 7000, f: 4800, html: `
      <div class="cvs"><i class="circ"></i><i class="strip"></i><i class="tri"></i>
        <div class="big"><i class="st">B</i><i class="st">O</i><i class="st">L</i><i class="st">D</i></div>
        <i class="sub"></i><i class="sub s2"></i></div>
      <i class="g gh"></i><i class="g gv"></i><u class="hd h1"></u><u class="hd h2"></u>
      <div class="pal"><i class="st"></i><i class="st"></i><i class="st"></i><i class="st"></i></div>
      <svg class="cur" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.8L9.8 19z"/></svg>` },

    /* 6 · Modern CV Design — a CV writes itself: avatar, name, skill bars, polish sweep, approved tick */
    { p: 7500, f: 5200, html: `
      <div class="paper">
        <i class="head"></i><i class="avt"></i><i class="nm"></i><i class="rl"></i>
        <i class="hh h1"></i><div class="sk"><i style="--w:92%"></i><i style="--w:78%"></i><i style="--w:86%"></i><i style="--w:64%"></i></div>
        <i class="hh h2"></i><i class="ln a"></i><i class="ln b"></i><i class="ln c"></i><i class="ln d"></i>
        <i class="sweep"></i></div>
      <b class="ok">✓</b>` },

    /* 7 · Drawing & Artwork — line-art is drawn stroke by stroke, then colour blooms from inside */
    { p: 9000, f: 6500, html: `
      <i class="paperg"></i><i class="bloom"></i>
      <svg class="art" viewBox="0 0 100 100">
        <defs><radialGradient id="svPetal" cx="50%" cy="30%" r="80%"><stop offset="0" style="stop-color:#fff"/><stop offset=".45" style="stop-color:hsl(var(--h) 95% 70%)"/><stop offset="1" style="stop-color:hsl(calc(var(--h) + 50) 90% 45%)"/></radialGradient></defs>
        <g class="petals">
          <ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" style="--i:0"/><ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(45 50 50)" style="--i:1"/>
          <ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(90 50 50)" style="--i:2"/><ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(135 50 50)" style="--i:3"/>
          <ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(180 50 50)" style="--i:4"/><ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(225 50 50)" style="--i:5"/>
          <ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(270 50 50)" style="--i:6"/><ellipse pathLength="1" cx="50" cy="31" rx="8.5" ry="17" transform="rotate(315 50 50)" style="--i:7"/>
        </g>
        <circle class="ring" pathLength="1" cx="50" cy="50" r="40"/><circle class="ring r2" pathLength="1" cx="50" cy="50" r="46"/>
        <circle class="core" pathLength="1" cx="50" cy="50" r="6.5"/>
      </svg>
      <i class="pencil"></i>` },

    /* 8 · PDF & Documents — pages fan out, a line is highlighted, a page turns, the PDF stamp lands */
    { p: 7500, f: 5000, html: `
      <div class="pgs">
        <div class="pg p1"><i class="t"></i><i class="l"></i><i class="l"></i><i class="l s"></i></div>
        <div class="pg p2"><i class="t"></i><i class="l"></i><i class="l hl"></i><i class="l"></i><i class="l s"></i></div>
        <div class="pg p3"><i class="t"></i><i class="img"></i><i class="l"></i><i class="l s"></i></div>
      </div>
      <em class="chip">A4 · PRINT-READY</em><b class="stamp">PDF</b>` },

    /* 9 · Web Design & Digital Experiences — wireframe becomes the finished page, scroll, click, mobile */
    { p: 8000, f: 5400, html: `
      <div class="win">
        <div class="chrome"><i></i><i></i><i></i><u class="url st"><span class="st">tiamo.design</span></u></div>
        <div class="view">
          <div class="wire"><i class="w1"></i><i class="w2"></i><i class="w3"></i><i class="w4"></i><i class="w5"></i></div>
          <div class="design"><div class="inner"><i class="hero"></i><i class="ht"></i><i class="ht s"></i><i class="btn"></i><i class="c1"></i><i class="c2"></i><i class="c3"></i><i class="c4"></i></div></div>
        </div>
      </div>
      <div class="mob"><i></i><i></i><i></i></div>
      <svg class="cur" viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.8L9.8 19z"/></svg><i class="click"></i>` },

    /* 10 · Book Covers & Story Design — a 3D book turns, foil title glints */
    { p: 10000, f: 2000, html: `
      <i class="floor"></i>
      <div class="stage"><div class="book">
        <div class="face front"><i class="frame"></i><i class="emb"></i><b class="foil">NOVEL</b><em>A STORY OF LIGHT</em><u></u><i class="glare"></i></div>
        <div class="face back"></div><div class="face spine"><span>NOVEL</span></div><div class="face pages"></div>
      </div></div>
      <i class="dust d1"></i><i class="dust d2"></i><i class="dust d3"></i><i class="dust d4"></i>` },

    /* 11 · Logo & Branding — construction grid, mark is drawn then filled, mock-ups pop up */
    { p: 9000, f: 6200, html: `
      <svg class="logo" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="svLg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:hsl(var(--h) 95% 72%)"/><stop offset="1" style="stop-color:hsl(calc(var(--h) + 60) 90% 52%)"/></linearGradient>
          <g id="svMark"><path d="M50 14 77 30v32L50 78 23 62V30z"/><path d="M36 38h28M50 38v26"/></g>
        </defs>
        <g class="grid"><circle pathLength="1" cx="50" cy="46" r="34"/><circle pathLength="1" cx="50" cy="46" r="20"/><path pathLength="1" d="M10 46h80M50 6v80M20 16l60 60M80 16 20 76"/></g>
        <g class="mark"><path pathLength="1" d="M50 14 77 30v32L50 78 23 62V30z"/><path pathLength="1" d="M36 38h28M50 38v26"/></g>
        <g class="mkfill"><path d="M50 14 77 30v32L50 78 23 62V30z"/><path d="M36 38h28M50 38v26"/></g>
        <g class="mk m1"><rect x="6" y="76" width="30" height="18" rx="2.4"/><g transform="translate(14 78) scale(.17)" class="tiny"><use href="#svMark"/></g></g>
        <g class="mk m2"><rect x="40" y="75" width="19" height="19" rx="5.5"/><g transform="translate(43.5 78.5) scale(.12)" class="tiny"><use href="#svMark"/></g></g>
        <g class="mk m3"><path d="M64 76h26l-3 18H67z"/><g transform="translate(70 79) scale(.13)" class="tiny"><use href="#svMark"/></g></g>
      </svg>
      <div class="sw"><i></i><i></i><i></i><i></i></div>` },

    /* 12 · Video Editing & Montage — clips slide in, a cut sparks, playhead sweeps, waveform dances */
    { p: 7000, f: 3800, html: `
      <div class="mon"><i class="v"></i><i class="cutflash"></i><em class="tcm"></em></div>
      <div class="tl">
        <div class="trk v2"><i class="clip ct"></i></div>
        <div class="trk v1"><i class="clip c1"></i><i class="clip c2a"></i><i class="clip c2b"></i><i class="clip c3"></i></div>
        <div class="trk a1"><div class="wv">${bars(30)}</div></div>
        <i class="razor"></i><i class="ph"><b></b></i>
      </div>` }
  ];
})();
