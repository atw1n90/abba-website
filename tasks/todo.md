# ABBA Global Corp Website — Multi-Page Rebuild (2026-05-17)

## Final architecture
Multi-page static site. Truck animation is the homepage and the primary navigation.

### Files
- `index.html` — homepage: full-viewport truck only, no scroll, no footer
- `services.html` — Services
- `about.html` — Who We Are
- `haul.html` — What We Haul
- `apply.html` — Drive With Us (1099)
- `contact.html` — Contact
- `styles.css` — shared theme (white-dominant, navy + gold accents)
- `script.js` — header behavior, mobile nav, truck animation trigger, scroll reveals, parallax

## Navigation (consistent on every page)
- Home | Services | Who We Are | What We Haul | Drive With Us ▾ | Contact
- "Drive With Us" dropdown — all open in new tab:
  - Driver Application (EN/ES)
  - Owner Operator (EN/ES)
  - ABBA Academy
- "Careers" wording removed everywhere — this is 1099 contractor work
- Active page indicated by gold underline (driven by `body.page-X` class)

## Homepage behavior
- `body.page-home` sets `overflow: hidden` on html + body — zero scrollbar
- Translucent dark header overlay (gold + white nav text)
- Dark navy gradient + desert-road overlay 25% + edge vignette
- Truck drives in from a far-distance point, brakes/settles, logo pops onto driver door
- 4 clickable hotspots (pulsing gold dots + hover tooltips):
  - Hood → services.html
  - Cab → about.html
  - Driver door → apply.html ("Drive With Us — 1099 Opportunities" tooltip)
  - Back wheels → haul.html
- Fades in "↑ Click any part of the truck to explore" after truck settles

## Inner-page common pattern
- Shared header (white, navy text)
- `.page-hero` banner (dark navy gradient, gold accent line, large display title)
- Section padding 72px desktop / 56px mobile
- Alternating white / `#f8f8f8` between content sections
- `slide-up` / `slide-left` / `slide-right` reveal on scroll with auto-stagger
- Subtle parallax on key images
- CTA band before footer
- Shared white footer

## Form & contact
- Phone, email, address, Facebook link
- Form dropdown: Freight & transportation services / Owner operator opportunity / Other
- Netlify form attributes preserved (`data-netlify`, honeypot)

## What to watch
- Truck hotspot positions over the truck image are still best-guess (4 zones now). Tweak `.hotspot-hood / .hotspot-cab / .hotspot-door / .hotspot-wheels` in `styles.css` after you see them rendered.
- File `abba-truck-interactive-map.png.png` has a double `.png.png` extension on disk — referenced as-is so it loads.
- File `desert-road-background.jpg.jpg` likewise has double extension — referenced as-is.
- Netlify form submission only works once deployed.
- Bilingual EN/ES toggle from prior versions is removed in this rebuild — applications themselves already split into EN/ES variants.

## Review section
### Verified
- 6 HTML files + styles.css + script.js all exist
- No "Careers" text in any page
- No DOT/MC/quote text
- All cross-page links point to correct .html files
- All 5 external application URLs open in new tab from nav, footer, and apply page

### Next step
- Open `index.html` in browser, click each truck zone to confirm navigation works
- Walk all 5 inner pages, check images load, scroll reveals fire, mobile menu opens
- Once happy with hotspot alignment over the truck, tell me which dots to nudge
