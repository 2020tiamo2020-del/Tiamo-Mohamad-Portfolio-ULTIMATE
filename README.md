# Tiamo Universe — Prototype 01

A separate, standalone 3D prototype for the Tiamo Universe concept. It does **not** modify the existing portfolio.

## What is included
- A Three.js 3D universe with five navigable dimensions.
- Cinematic camera travel, mouse/touch look controls, and scroll zoom.
- Five dimension archives populated from the asset filenames already referenced in the uploaded portfolio source:
  - AI Dimension: `images/project1.jpg` – `images/project15.jpg`
  - Visual Reality: `images/pm1.jpg` – `images/pm8.jpg`
  - Motion Core: `Cinematic/cinematic0` – `cinematic8` (`.jpg` poster + `.webm`)
  - VFX Realm: `VFX/rm0` – `rm5` (`.jpg` poster + `.webm`)
  - The Creator: `images/tiamo.jpg`
- Full-screen project presentation for images and videos.
- Responsive HUD, reduced-motion awareness, and optional user-triggered ambient tone.

## Asset source
The prototype points to the public GitHub Pages asset root:

`https://2020tiamo2020-del.github.io/Tiamo-Mohamad-Portfolio-ULTIMATE/`

The paths above are taken from the uploaded `index.html` source. The original portfolio and its asset files are not copied or changed.

## Inspect exact source image dimensions
Open `asset-audit.html` in a browser through the local server. It scans the public GitHub Pages image URLs and reports each file's actual natural width, height, ratio, and loading status. You can export the results to CSV. This is the measurement step; the prototype does not guess source dimensions.

## Run locally
Requires an internet connection for the Three.js CDN, fonts, and GitHub Pages assets.

From this folder in PowerShell:

```powershell
py -m http.server 8000
```

Then open:

`http://localhost:8000`

Or use VS Code Live Server.

## Controls
- Drag / swipe: look around
- Scroll: zoom
- Click a portal or dimension label: travel to a world
- Click an artwork card: open its presentation
- Esc: close the current layer / return

## Important prototype notes
- This is a first interactive vertical slice, not the final production build.
- Image/video natural dimensions and successful remote loads still need a browser-side audit against the live repository. The current UI uses `object-fit: cover` for archive thumbnails and `contain` for the focused presentation so source artwork is not stretched.
- Video cards use the existing `.webm` poster paths; the original Facebook reel links are not silently fabricated or changed.
- The existing portfolio navigation icon has intentionally **not** been inserted yet. Integration should happen only after approving this separate prototype and confirming the correct live portfolio branch.
