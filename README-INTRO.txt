INTRO 3D UPDATE - only the changed / new files. Upload them over your repo keeping the same folders:

  index.html          (replace)  new gate markup + 2 links (intro3d.css, intro3d.js). Based on your latest zip.
  script.js           (replace)  3 tiny edits: hero text + toast wait for the dive-in (window.__introHold)
  enhance.js          (replace)  1 tiny edit: same wait for the home entrance
  story.js            (replace)  1 tiny edit: same wait for the role-words scramble
  intro3d.js          (NEW)
  intro3d.css         (NEW)
  images/intro-logo.webp + images/intro-logo.jpg   (NEW, your logo picture, optimized)
  fonts/RubikDirt.woff                              (NEW, your font, caps+digits only, 139 KB)

Tuning: top of intro3d.js -> CONFIG (loading time, dive length, how deep the zoom goes, logo size behind Home, trail length, relief strength).
Undo: put back your old index.html / script.js / enhance.js / story.js and delete the new files.
