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
- To add more later, keep the naming pattern and add one more .ba-thumb button in index.html.

VISITOR ANALYTICS (optional, OFF by default):
- Create a free account at goatcounter.com, choose a site code, then set  const GOATCOUNTER_CODE = "yourcode";  near the end of script.js.
- Shows visits, countries, devices, referrers and clicks on WhatsApp / Facebook / Instagram / TikTok / Photoshop Mode links.
- Tip: share links with ?ref=facebook, ?ref=whatsapp, ?ref=instagram ... to see exactly where each visitor came from.
