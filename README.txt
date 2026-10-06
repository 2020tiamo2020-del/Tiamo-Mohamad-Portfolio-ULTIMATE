TIAMO MOHAMAD — ULTIMATE PORTFOLIO

1) Upload index.html, style.css and script.js to the root of your GitHub Pages repository.
2) Keep your existing image folders/files and put them under /images/ using the filenames referenced in index.html.
3) Logo: put your logo at the ROOT of the repo as main-logo.png (it is also the favicon). If the file is missing, the header automatically shows a "TM" mark instead of a broken image.

Configured links:
- WhatsApp: +20 12 7853 6645
- Photoshop Mode: https://www.facebook.com/groups/3740640722906464
- Personal Facebook: https://www.facebook.com/tiamo.mohamad/
- Instagram: https://www.instagram.com/120tiamo120/
- TikTok: https://www.tiktok.com/@tiamo.mohamad
- Example Facebook Reel: https://www.facebook.com/reel/1876850873302115

Gallery behavior:
- Separate gallery for each work category.
- Portrait and landscape media preserve natural proportions.
- Smooth auto-slide.
- Arrow controls appear and glow on mouse hover.
- Hover pauses autoplay.
- Touch swipe works on mobile.
- Video cards open the original Facebook Reel in a new tab.
- Missing images are intentionally allowed; a "Coming soon" placeholder is shown until the real assets are added.

No prices are displayed on the portfolio.


New 2026-10-04 polish:
- About portrait: images/tiamo-about.png (transparent PNG) with images/tiamo.jpg as the fallback.
- Services and Selected Work headings use isolated, direction-aware scroll motion; card hover transforms remain independent.
- Mobile navigation has a touch-friendly animated dropdown controlled by the existing ☰ button.
- Added service cards 09 Web Design & Digital Experiences and 10 Book Covers & Story Design.
- SEO title updated to: Tiamo Mohamad | AI Artist, Photoshop Designer & Video Creator.
- Added robots.txt, sitemap.xml and JSON-LD Person/WebSite structured data.
- Before/After component is safely dormant until a real BEFORE asset is supplied at images/pm1-before.jpg; the normal Photoshop gallery remains untouched when it is absent.
- Visitor counter/analytics is intentionally not hard-coded without a real analytics property/site ID; this avoids shipping a broken or fake visitor count.


BEFORE & AFTER (section 04, portrait 4:5):
- Sits between Selected Work and Find Me. Find Me is now 05 and Contact is 06.
- Works now with elegant placeholders. To go live, add pairs with IDENTICAL size and crop (e.g. 1200x1500, JPG/WebP):
    images/ba1-before.jpg + images/ba1-after.jpg
    images/ba2-before.jpg + images/ba2-after.jpg   (optional)
    images/ba3-before.jpg + images/ba3-after.jpg   (optional)
- 1 valid pair = single slider. 2+ valid pairs = thumbnail switcher appears automatically.
- A pair with a missing file is skipped automatically (no broken images).
- The old dormant before/after module inside the Photoshop gallery (images/pm1-before.jpg) was removed.
- Animations always run, ignoring the OS "reduce motion" setting (by design).
- Before & After is scroll-linked: while the frame travels up the screen the line glides from BEFORE to AFTER and settles at 50% (reversible with scrolling). The first touch/drag/key press switches it to manual control for good.
- Services grid = 12 cards (11 Logo & Branding, 12 Video Editing & Montage).

BEFORE & AFTER IMAGES (final set, 1200x1500 / 4:5, identical crop per pair):
- images/ba1-before.jpg + ba1-after.jpg  (veiled portrait: dark -> vibrant)
- images/ba2-before.jpg + ba2-after.jpg  (couple: dark night shot -> bright, clean)
- images/ba3-before.jpg + ba3-after.jpg  (old photo restoration: man)
- images/ba4-before.jpg + ba4-after.jpg  (old photo restoration: woman)
- Up to 4 pairs are supported; the thumbnail switcher appears automatically.
- To add more later: just upload images/ba5-before.jpg + images/ba5-after.jpg (see AUTO BEFORE & AFTER PAIRS below) - no change to index.html is needed.

VISITOR ANALYTICS (GoatCounter - ON, site code "tiamo"):
- Dashboard: https://tiamo.goatcounter.com  (log in with the account you created).
- Shows visits, countries, devices, referrers and clicks on WhatsApp / Facebook / Instagram / TikTok / Photoshop Mode links.
- Counting starts as soon as the site is live on GitHub Pages. localhost and files opened from your disk are ignored.
- To stop counting YOUR OWN visits: open your site once with  #toggle-goatcounter  at the end of the address (on each browser/device you use), e.g.
    https://2020tiamo2020-del.github.io/Tiamo-Mohamad-Portfolio-ULTIMATE/#toggle-goatcounter
- Tip: share links with ?ref=facebook, ?ref=whatsapp, ?ref=instagram ... to see exactly where each visitor came from.
- If the dashboard stays empty: disable your ad-blocker for your own site, wait ~10 seconds, refresh the dashboard.

WORK GALLERY COUNTER (2026-10-05):
- The "01 / 08" counter is now a glass capsule with a segmented rail: the active segment stretches and glows (same look in all four galleries, Arabic and English).

MUSIC ORB: index.html must contain the orb markup (id="tmOrb", id="tmMini") and audio/theme.mp3 must exist.


AUTO GALLERY SLOTS (up to 30 files per gallery, hidden until the file exists) - 2026-10-05:
- Upload the picture into /images/ with the gallery NAME + NUMBER and it shows up by itself (counter, dots and 3D carousel update):
    Photo Manipulation       pm1.jpg ... pm30.jpg
    Cinematic Reels          cinematic2.gif ... cinematic30.gif   (cinematic.gif and cinematic1.gif already exist)
    Advertising & Design     project1.jpg ... project30.jpg
    VFX & Creative Motion    rm1.jpg ... rm30.jpg
- Formats: jpg, png, webp (gif for Cinematic Reels). Numbers that do not exist show nothing to the visitor.
- Keep numbers roughly consecutive: the page looks 4 numbers ahead of the last file it finds (e.g. pm9, pm10, pm12 all work; pm20 alone would not).
- Slides are placed in numeric order, so adding project7.jpg later puts it between project6 and project8.
- REELS (Cinematic Reels, VFX & Creative Motion): the picture is only the preview. To make it open the right reel, add one line to REEL_LINKS
  at the top of the "Gallery auto-slots" block in script.js, for example:
      "rm6": "https://www.facebook.com/reel/1234567890",
  Without a line, the slide opens your Facebook profile.
- The probing is lazy (starts shortly before the Work section appears) so it does not slow the first load. Missing numbers show as harmless
  404 lines in the browser console - that is normal.

SERVICES WHEEL (desktop >= 901px):
- The 12 service cards sit on a vertical 3D wheel: click a card, use the arrows / side ticks, drag with the mouse, or use the keyboard arrows.
- It turns by itself every ~5 seconds (the thin line under the centre card is the timer); it pauses on hover, keyboard focus, when the section is
  off-screen and in hidden tabs. Phones and small tablets keep the normal grid.
- To add a service: add one more <article> to the service grid in index.html - the wheel, ticks and timer adapt automatically.


AUTO BEFORE & AFTER PAIRS (up to 30, hidden until both files exist) - 2026-10-06:
- Upload BOTH files of a pair with the same number: images/ba5-before.jpg + images/ba5-after.jpg ... up to ba30. The thumbnail appears by itself.
- Formats: jpg, png or webp (the two files of a pair may differ). A pair with only one file is ignored.
- Keep numbers roughly consecutive: the page looks 4 numbers ahead of the last pair it finds (ba7 works after ba5, ba20 alone would not).
- Thumbnails stay in numeric order, wrap onto a second row when needed and get a little smaller after 10 pairs.
- Best result: the two images of a pair must have the same size/crop. The frame is 4:5; a 3:4 photo is cropped slightly at top and bottom.

BEFORE & AFTER - film strip of thumbnails (2026-10-06):
- The thumbnails sit in ONE row under the frame. With a few pairs they are simply centred; with many (up to 30) the row becomes a strip that scrolls
  (mouse drag, swipe, or the pager) and always keeps the active pair centred. Soft fades on both ends show that there is more.
- The active thumbnail is lifted, glowing and has a small light under it. A glass pager  "<  05 / 20  >"  sits under the strip (previous / next).
- SPEED TIP: thumbnails use the "after" photo by default. For faster loading add an optional tiny file per pair, e.g. images/ba5-thumb.jpg (about 120x150 px, < 15 KB);
  if it exists it is used automatically. Also compress the big photos to roughly 150-250 KB (1200x1500, JPG/WebP quality ~80).
- Pairs are detected with lightweight HEAD requests, so detecting 20+ pairs does not download all the photos.


06 / AI CREATION (2026-10-06) - files: creation.css + creation.js (nothing in style.css / script.js was changed; Contact is now 07)
- Upload AI images to images/ as l1.jpg, l2.jpg, l3.jpg ... (jpg, jpeg, png or webp, any size/ratio). They appear by themselves in a masonry wall, in numeric order.
- Loads 18 at a time while scrolling. Up to 300. Keep numbers consecutive (the page stops after 8 missing numbers in a row).
- Tip: compress each image to about 200-400 KB (long side ~1600 px) so the wall stays fast.
- Images are drawn as CSS backgrounds behind a transparent guard layer: no right-click menu, no drag, no long-press "save image" on phones. No watermark is added.
  Note: no website can fully stop screenshots or a developer who inspects the network tab.
- Search engines: robots.txt + sitemap.xml + canonical + OG + JSON-LD exist. Verify the site in Google Search Console, Bing Webmaster Tools, Yandex Webmaster, Baidu Webmaster, Naver
  and paste each verification code into the commented meta tags in index.html <head>, then submit sitemap.xml in each tool.
