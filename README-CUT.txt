CUT UPDATE - only the changed / new files. Upload them to the ROOT of your repo (index.html replaces the old one).

  index.html       (REPLACE)  only change: 2 <link> + 2 <script> lines added (about-cut, section-cut)
  about-cut.css    (NEW)      About: strip-cut background behind the portrait + silhouette shine
  about-cut.js     (NEW)      uses images/pm1..pm8.jpg + images/tiamo-about.png (missing files are skipped)
  section-cut.css  (NEW)      scroll transition between sections
  section-cut.js   (NEW)      starts after the first wheel/touch/key/menu click; never blocks scrolling

Tuning: top of each .js -> CONFIG (images, strips, speed, colours, on/off).
  section-cut.js: enabled:false turns the transition off, mobile:false = desktop only.
Undo: delete the 4 new files and put back your old index.html.
