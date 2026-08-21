# ABBA Academy — self-host + wire the EN/ES toggle

Goal: the site's EN·ES toggle should also switch the ABBA Academy sign trainer,
and the app should live on our own domain instead of an outside Netlify account.

Source files provided by Alan (Desktop):
- agbtrucksignsenglish.html  (2.0 MB)
- agbtrucksignsspanish.html  (2.0 MB) — Spanish text, English sign names on purpose

## Tasks

- [x] Confirm the 93 embedded sign images are identical in both files
- [x] Extract shared images to academy-signs-data.js (1.95 MB, loaded by both)
- [x] Build academy-signs.html (EN) — app only, ~68 KB
- [x] Build es/academy-signs.html (ES) — app only, ~68 KB, lang="es"
- [x] Add in-app EN·ES toggle to both, matching the site's toggle
- [x] Add "back to ABBA" links (top bar + footer) in both languages
- [x] Point EN pages at academy-signs.html (was the Netlify URL)
- [x] Point ES pages at academy-signs.html inside /es/ (was the Netlify URL)
- [x] Verify: no leftover Netlify links, both files load the shared data, sign counts match
- [ ] Hand off to Alan for Coolify deploy + Cloudflare cache purge

## Decisions

- Self-hosted, not Netlify: we own it, and the ES toggle can finally work.
- Images split into one shared .js file because Cloudflare never caches HTML on
  this site. As one 2 MB page, every driver re-downloads everything each visit.
  As a 68 KB page + cached data file, the images download once and are shared
  between both languages.
- Sign names stay English in the Spanish version. That is the teaching design:
  learn the English name, understand the meaning in Spanish.
- Netlify site is left alive and untouched. Nothing gets deleted.
- Progress carries over between languages for free — the app saves progress by
  sign name, and both versions use the same English names on the same domain.
