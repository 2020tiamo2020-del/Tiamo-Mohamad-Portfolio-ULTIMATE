ARABIC FONT: Hacen Qatar  (Arabic text only; English fonts and spacing untouched)

New:      arabic-font.css          fonts/Hacen_Qatar.woff2   fonts/Hacen_Qatar.ttf
Changed:  index.html   cine.css (v=11)   cine.js (v=12)   tm-intro.css (v=16)

Upload keeping the same folders (the fonts/ folder already exists in your repo), then hard refresh (Ctrl+F5).
If your live index.html differs, do not overwrite it. Instead:
  1) add in <head>, right after style.css:   <link rel="stylesheet" href="arabic-font.css?v=1">
  2) cine.css?v=10 -> ?v=11 , cine.js?v=11 -> ?v=12 , tm-intro.css?v=15 -> ?v=16

To switch the font off: remove the arabic-font.css line.
