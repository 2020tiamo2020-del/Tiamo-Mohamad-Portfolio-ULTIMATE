INTRO RELIEF UPDATE - 4 files, same folders

  index.html               (replace)  version numbers bumped so the browser loads the new files + depth map preload
  intro3d.js               (replace)  new renderer
  intro3d.css              (replace)  Home watermark blending
  images/intro-depth.webp  (NEW)      depth map generated from your logo picture (height of T / M / ring)

Keep from before: images/intro-logo.webp + .jpg, fonts/RubikDirt.woff, audio/*, ui-sounds.js, script.js, enhance.js, story.js.

Tuning (top of intro3d.js -> CONFIG): depth (column height), lightH (lower = longer shadows), bump, trailSeconds, holdMs (keep 2350, the sound drop lands there).
If it stutters on some device: open the site with ?q=1 or ?q=0 to see the lighter versions (the page also lowers quality by itself when frames are slow).
