# ABBA Global Corp — Website

Static bilingual marketing site for a power-only carrier hauling frac sand out of Kermit/Odessa, TX.
Plain HTML/CSS/JS — no build step, no framework, no package.json at root.

---

## Hosting & deploys

- **Origin:** Coolify VPS (`138.197.211.212`). **In front of it:** Cloudflare (nameservers `marjory`/`thaddeus.ns.cloudflare.com`). Moved to Cloudflare 2026-08-17.
- **Deploys are triggered manually in Coolify, by choice.** A push to `main` is NOT shipping. Commit, push, then hand off — do not wait on or chase an automatic deploy, and never call an undeployed push a failure.
- **The origin IP no longer accepts direct traffic** — it's firewalled to Cloudflare. Pings and direct curls to `138.197.211.212` time out even though the server is healthy. Always test through the domain, or with `curl --resolve <host>:443:<cloudflare-ip>`.
- **The origin allowlist covers Cloudflare's IPv4 *and* IPv6 ranges,** and the Cloudflare-to-origin hop is encrypted — traffic is TLS the whole way, not just at the edge. The zone publishes AAAA records, so Cloudflare can reach the origin over v6; an allowlist that drifts to IPv4-only breaks the site in a way that looks like a dead server. Cloudflare rotates these ranges occasionally — they come from `cloudflare.com/ips`, and a stale list is a plausible cause of a sudden sitewide outage with a healthy container.
- Edge behavior confirmed 2026-08-18: `Server: cloudflare` on every response, plain HTTP `302`s to HTTPS. **No security headers are set** — no HSTS, CSP, `X-Content-Type-Options`, `X-Frame-Options`, or `Referrer-Policy`. Not a live problem for a static marketing site, but it's the obvious next hardening step and it's free in Cloudflare Rules.

### Two caches sit between a deploy and what you see

| Layer | Behavior |
|---|---|
| Cloudflare — HTML | `cf-cache-status: DYNAMIC`, never cached. Page/text changes appear immediately. |
| Cloudflare — CSS/JS/images | `max-age=14400`. **Up to 4 hours stale.** |

So after deploying a CSS, JS, or image change, **purge the Cloudflare cache** or it will look like the deploy did nothing. This is the single most common "my update isn't showing" cause. The browser cache is a second, separate layer on top.

### DNS gotcha — burned us twice

Alan's home router (`192.168.50.1`) serves badly stale DNS for this zone and kept returning the retired origin IP long after the migration. `Clear-DnsClientCache` does not help — Windows just re-asks the router.

Symptom: the site or the one-pager form hangs (~21s) with nothing useful in the DevTools Network tab, because the browser is stuck on a dead address rather than getting an error. **Firefox works while Chrome fails** — Firefox uses DNS-over-HTTPS by default and bypasses the router.

**Never diagnose DNS from the local resolver.** Check the authoritative nameserver (`nslookup -type=A <host> marjory.ns.cloudflare.com`) and a public resolver (`1.1.1.1`). Fastest field test to hand Alan: turn WiFi off on the phone, use cellular, retry.

---

## Analytics & conversions

- **GTM `GTM-K9DXJXDP` is the only Google Ads source.** Never add a hardcoded `AW-` gtag — it was deliberately removed.
- **Meta pixel `901952475703337`** is hardcoded sitewide (base + PageView).
- **`/thankyou.html` (EN) and `/gracias.html` (ES) are the conversion pages.** Forms redirect there on success so each lead has its own URL to count. Both carry GTM + the pixel, both fire `fbq('track','Lead')` directly, and both are `noindex` so search traffic can't inflate conversions.
- **Do not add a Meta Lead tag in GTM** — the pages already fire it. Doing both double-counts every lead and halves apparent cost-per-lead.

---

## Mailer

Separate Coolify app, Base Directory `/mailer`, reached at `mail.abbaglobalcorp.com`. Node/Express, sends via the **Brevo API** (not SMTP — the host blocks SMTP ports). Config is env-only; `mailer/.env.example` documents the shape. Verified working end-to-end 2026-08-17.

**Testing it without emailing a real person:**

| Probe | Expected |
|---|---|
| `GET /health` | `{"ok":true}` |
| `OPTIONS /api/one-pager` with `Origin: https://abbaglobalcorp.com` | 204 + `access-control-allow-origin` |
| `POST /api/one-pager` with an invalid email | 400, sends nothing |
| `POST` with the `website` honeypot filled | 200, sends nothing |

Only the final Brevo handoff needs a real send — that's Alan's call to make, not something to trigger unasked. On failure the app logs the true reason to Coolify as `[mailer] one-pager error: <message>`; read that before theorizing.

### The one-pager attachment

`mailer/assets/AGC_1Pgr_8.5.26.pdf` is attached to every one-pager request, renamed to `ABBA-Global-Corp-One-Pager.pdf` so no date shows in the recipient's inbox. **The Dockerfile does `COPY assets ./assets`, so the PDF is baked into the image at build time** — swapping the file and pushing changes nothing until the *mailer* app specifically is redeployed in Coolify. Deploying the website does not touch it.

**`mailer/assets/agc_1pgr_source.html` is the master.** Edit it, then export in Chrome: `Ctrl+P` → Save as PDF → Letter → Margins **None** → **Background graphics ON** → save over the existing PDF filename so no code change is needed. Not web-reachable; the mailer has no `express.static`.

Export it this way and nothing else. A PDF made by "Microsoft: Print To PDF" converts text to outlines, and an image-export-to-PDF makes the whole page one flat JPEG — both leave a broker unable to copy the USDOT or MC number. Verify a re-export by checking the file has `/FontFile2` objects and no `/Subtype /Image`. Don't reach for OCR to add a text layer: this page is mostly digits that matter, and a silently misread one is worse than no text.

The one-pager's gold is **`#896B2F`**, a deep bronze — *not* the site's `--gold: #F5A623`. Two different golds, unresolved.

---

## Structure & conventions

- **Bilingual:** full Spanish mirror in `/es/`. But the **prescreen forms, legal pages, and thank-you pages live at the repo root**, not under `/es/` — `prescreen_spanish.html`, `privacidad.html`, `terminos.html`, `gracias.html`. Any client-facing change needs a real Spanish equivalent, not a rough translation.
- **Design tokens live in `styles.css`** (`--navy: #0E1F47`, `--gold: #F5A623`, white-dominant; Barlow Condensed for display, Inter for body). The prescreen and thank-you pages carry their own inline copies of these tokens because they're standalone — keep them in sync with `styles.css` by hand.
- **The two prescreen forms share a byte-identical stylesheet.** When changing one, change both; there's a check for this (`diff` the `<style>` blocks).
- **Images: photos and illustrations belong in JPEG, not PNG.** Two files were shipped as multi-megabyte PNGs with no transparency, costing ~7-10x their size for nothing; converting at quality 85 cut 4.3 MB to 562 KB. **Exception: `abba-truck-interactive-map.png.png` must stay PNG** — the clickable homepage truck needs its transparent background.
- No image tooling is installed. Windows can encode JPEG natively via PowerShell + `System.Drawing` — no dependency needed.

---

## Standing constraints

- ABBA is **power-only** — owns tractors, not trailers. Trailers belong to customers/partners.
- Don't describe the fleet as "modern" (it's pre-2020), and don't reintroduce "dispatch" language.
