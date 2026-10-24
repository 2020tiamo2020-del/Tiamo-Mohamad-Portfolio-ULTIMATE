3 NEW SOUNDS - only the changed / new files (keep the same folders)

  index.html            (replace)  adds ui-sounds.js, prefetches the new intro sound instead of welcome.mp3
  script.js             (replace)  welcome.mp3 is skipped while the 3D intro is present (the intro plays its own sound)
  intro3d.js            (replace)  plays audio/intro-enter.mp3, dive length 2.35 s, camera punch on the boom, calm settle on Home
  ui-sounds.js          (NEW)      side menu + Start a Project sounds
  audio/intro-enter.mp3 (NEW)      your intro sound, trimmed + edited (6.1 s)
  audio/ui-rail.wav     (NEW)      = your tick-click.wav      -> left side menu click
  audio/ui-fill.wav     (NEW)      = your tick-hover.wav      -> Start a Project controls

INTRO SOUND TIMELINE (matches the visuals)
  0.00 s  boom ........ ENTER pressed: ring ignites + small camera punch
  0.2-2.3 riser ....... the camera dives into the logo (zoom + blur accelerate)
  2.34 s  drop ........ flash peak, Home appears (hero text + toast start here)
  2.4-6.1 settle ...... light on Home calms down while the tail fades out
  Edit made to your file: removed 0.5 s of leading silence, shortened the first drone by 0.7 s (cross-faded),
  cut the near-silent tail after 7.5 s and the small blip at 9.8 s, faded the end.

TUNING
  ui-sounds.js  -> CFG at the top (rail / hover / fill / slider volumes, typing:true for keystroke ticks)
  intro3d.js    -> CONFIG.soundGain, CONFIG.holdMs (keep 2350 so the drop still lands on the flash)
  Mute all UI ticks:  window.__uiSoundsOff = true
