Arabic font fix (v2): index.html only.  Cairo was removed from the Google Fonts link (it conflicted with Hacen Qatar).
Files needed on the site, same folder level as style.css:
  arabic-font.css   fonts/Hacen_Qatar.woff2   fonts/Hacen_Qatar.ttf   (+ cine.css, cine.js, tm-intro.css, index.html from this zip)
If your live index.html differs: delete "&family=Cairo:wght@400;500;600;700;800" from the Google Fonts URL (2 places)
and make sure <link rel="stylesheet" href="arabic-font.css?v=2"> is in <head>. Then Ctrl+F5.
