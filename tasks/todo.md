# ABBA Global Corp Website — Current State (updated 2026-07-23)

Multi-page static site. The homepage is an interactive truck; navigation is a fixed
bottom sticky-nav present on every page. Deployed on Coolify (auto-deploys on push to
GitHub `main`). A separate mailer service handles the one-pager + contact leads.

## Files
- `index.html` — homepage: full-viewport truck, 4 hotspots, two CTAs, one-pager modal
- `services.html` — What We Do
- `about.html` — Who We Are
- `apply.html` — Drive With Us (1099 drivers + owner-operators)
- `academy.html` — ABBA Academy
- `contact.html` — Contact (Email/Call card — no form)
- `styles.css` — shared theme (white-dominant, navy + gold accents)
- `script.js` — sticky-nav highlight, truck drive-in, scroll reveals, parallax, one-pager modal
- `mailer/` — standalone Node service (Brevo API) — see `mailer/README.md`

## Homepage
- Truck drives in and settles; 4 pulsing gold hotspots:
  - Hood → services.html (What We Do)
  - Cab → about.html (Who We Are)
  - Academy → academy.html
  - Door → apply.html (Drive With Us)
- Two CTAs under the truck:
  - **Run With ABBA →** (gold) → apply.html — drivers & owner-operators
  - **Get Our One-Pager →** (ghost) → opens modal → posts to the mailer, PDF auto-sends

## Contact
- Email/Call card (mailto + tel) plus phone/address/service area. Bilingual note.
- No web form on the page; the mailer's `/api/contact` endpoint exists for future use.

## Mailer service (mailer/)
- Sends via **Brevo HTTPS API** (SMTP ports are blocked on the DigitalOcean host).
- `/api/one-pager` → emails the PDF to the requester + notifies info@ (lead capture).
- Runs as its own Coolify app at `mail.abbaglobalcorp.com`; needs `BREVO_API_KEY` env var.
- Security: origin-locked CORS, honeypot, 5/hr per-IP rate limit, input validation, 15s timeout.

## Known notes
- `abba-truck-interactive-map.png.png` and `desert-road-background.jpg.jpg` have double
  extensions on disk — referenced as-is so they load. Leave as-is.
- Rate limiter is in-memory (resets on redeploy) — fine for current traffic.
- Cross-page `<head>`/footer/nav markup is duplicated across 6 files (no build step).

## Backlog / ideas
- Optional: shared header/footer via a small build step to end the 6-file duplication.
- Optional: persistent or daily-total rate cap on the mailer if abuse ever appears.

---

# Active task: Full Spanish (ES) website (started 2026-08-02)

Full Spanish mirror in a `/es/` folder + a subtle EN·ES toggle on every page.
Apply page stays a shared bilingual hub (all 4 cards kept); only its wrapper copy
is translated on the ES side.

- [x] Add subtle `.lang-toggle` styles to styles.css (fixed top-right pill, quiet)
- [x] Add EN·ES toggle to all 6 English pages (link each to its ES twin)
- [x] Build `/es/index.html`   (Home + one-pager modal, Brevo endpoint kept)
- [x] Build `/es/about.html`   (Quiénes Somos)
- [x] Build `/es/services.html`(Qué Hacemos)
- [x] Build `/es/academy.html` (Academia ABBA)
- [x] Build `/es/contact.html` (Contacto — same phone/email/mailer)
- [x] Build `/es/apply.html`   (Conduzca con Nosotros — 4 cards kept, wrapper in ES)
- [x] Add hreflang alternate tags (en / es / x-default) to every page
- [x] Add ES pages to sitemap.xml
- [x] Verify relative paths (../styles.css, ../images), links, toggle mapping — all 200s

Also: made the one-pager modal's status messages language-aware in script.js
(Spanish on html lang="es", English otherwise). DONE 2026-08-02 — not yet committed/deployed.

Spanish = natural professional Latin-American Spanish for Permian oilfield drivers.
All external links (Netlify apps, Facebook), phone, email, one-pager endpoint stay identical.
