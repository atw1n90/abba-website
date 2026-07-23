# ABBA Mailer

A small service that sends email through **Brevo SMTP** on behalf of the website.
The website itself (static files) cannot send email — this service does it.

It handles two things:

| Endpoint | What it does |
|----------|--------------|
| `POST /api/one-pager` | Emails the company one-pager (PDF, attached) to the requester **and** notifies your inbox of the lead. |
| `POST /api/contact` | Forwards a contact-form message to your inbox. |

The one-pager PDF lives inside this service (`assets/`), so it is **never** published on the public website — it only goes out as an email attachment.

---

## One-time setup

### 1. Get your Brevo SMTP key
In Brevo: **SMTP & API → SMTP**. Note your **SMTP login**, and click **Generate a new SMTP key** (this is a password — copy it now, you won't see it again).

### 2. Deploy on Coolify
1. New Resource → point it at this repository.
2. Set **Base Directory** to `/mailer`.
3. Build pack: **Dockerfile** (this folder has one).
4. Add the **Environment Variables** below (see `.env.example`):

   | Variable | Value |
   |----------|-------|
   | `BREVO_SMTP_HOST` | `smtp-relay.brevo.com` |
   | `BREVO_SMTP_PORT` | `587` |
   | `BREVO_SMTP_USER` | your Brevo SMTP login |
   | `BREVO_SMTP_KEY` | the SMTP key from step 1 |
   | `MAIL_FROM` | `ABBA Global Corp <info@abbaglobalcorp.com>` |
   | `MAIL_TO` | `info@abbaglobalcorp.com` |
   | `ALLOWED_ORIGINS` | `https://abbaglobalcorp.com,https://www.abbaglobalcorp.com` |

5. Give it a domain in Coolify, e.g. **`mail.abbaglobalcorp.com`**.
6. Deploy. Check the logs — you should see `Connected to Brevo SMTP.`
7. Test: open `https://mail.abbaglobalcorp.com/health` → it should show `{"ok":true}`.

> **Keep it separate from the website.** This runs as its own Coolify app. The one-pager PDF must stay out of the static site's published folder so it isn't publicly downloadable.

### 3. Wire up the website
Once the service is live and you have its URL (e.g. `https://mail.abbaglobalcorp.com`), tell me the URL and I'll swap the homepage **"Get Our One-Pager"** button from the temporary email link to a small inline form that posts to `POST /api/one-pager`. (Kept as a separate step because the website needs the real URL to point at.)

---

## Security notes
- All secrets come from environment variables — nothing is hardcoded.
- CORS is locked to your website origins only.
- Honeypot field + per-IP rate limiting (5 requests/hour) guard against bots and abuse.
- User input is length-capped and HTML-escaped before it goes into any email.
- The service only ever sends **your** one-pager to the address a visitor enters — it is not a general "send anything to anyone" relay.

## Cost
Brevo free plan: **300 emails/day**. Each one-pager request uses 2 emails (one to the requester, one to you).
