/* =========================================================
   ABBA GLOBAL CORP — MAILER SERVICE
   A small server that sits behind the website and sends email
   through Brevo SMTP. It does two jobs:
     1) /api/one-pager  -> emails the company one-pager (PDF) to
        the requester, and notifies the ABBA inbox of the lead.
     2) /api/contact    -> forwards a contact message to the ABBA inbox.

   All secrets come from environment variables — never hardcoded.
   ========================================================= */

'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const nodemailer = require('nodemailer');

/* ---------- Config (all from environment) ---------- */
const {
  PORT = '3000',
  BREVO_SMTP_HOST = 'smtp-relay.brevo.com',
  BREVO_SMTP_PORT = '587',
  BREVO_SMTP_USER,
  BREVO_SMTP_KEY,
  MAIL_FROM,                 // e.g. "ABBA Global Corp <info@abbaglobalcorp.com>"
  MAIL_TO,                   // where lead notifications land, e.g. info@abbaglobalcorp.com
  ALLOWED_ORIGINS = '',      // comma-separated, e.g. "https://abbaglobalcorp.com,https://www.abbaglobalcorp.com"
  ONE_PAGER_PATH = path.join(__dirname, 'assets', 'AGC_1Pgr_7.23.26.pdf'),
  ONE_PAGER_FILENAME = 'ABBA-Global-Corp-One-Pager.pdf',
} = process.env;

const requiredEnv = { BREVO_SMTP_USER, BREVO_SMTP_KEY, MAIL_FROM, MAIL_TO };
const missing = Object.entries(requiredEnv).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error('[mailer] Missing required environment variables: ' + missing.join(', '));
  process.exit(1);
}

const allowedOrigins = ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean);

/* ---------- Mail transport ---------- */
const transporter = nodemailer.createTransport({
  host: BREVO_SMTP_HOST,
  port: Number(BREVO_SMTP_PORT),
  secure: false,            // Brevo uses STARTTLS on 587
  auth: { user: BREVO_SMTP_USER, pass: BREVO_SMTP_KEY },
});

transporter.verify()
  .then(() => console.log('[mailer] Connected to Brevo SMTP.'))
  .catch(err => console.error('[mailer] SMTP verify failed:', err.message));

/* ---------- Helpers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(v) {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);
}

// Trim + cap length, and neutralize HTML so nothing can be injected into the email body.
function clean(v, max = 500) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ---------- Simple in-memory rate limiter (per IP) ---------- */
const WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const MAX_PER_WINDOW = 5;           // 5 requests/hour/IP
const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_PER_WINDOW;
}
// Periodically clear expired entries so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of hits) if (now > rec.resetAt) hits.delete(ip);
}, WINDOW_MS).unref();

/* ---------- App ---------- */
const app = express();
app.set('trust proxy', 1); // behind Coolify's reverse proxy, so req.ip is the real client
app.use(express.json({ limit: '16kb' }));

// CORS — only allow the site's own origin(s) to call this service.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => res.json({ ok: true }));

/* ---------- One-pager request ---------- */
app.post('/api/one-pager', async (req, res) => {
  try {
    if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

    const { email, company, whatMoving, website } = req.body || {};
    if (website) return res.json({ ok: true });          // honeypot: silently accept bots, send nothing
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

    if (!fs.existsSync(ONE_PAGER_PATH)) {
      console.error('[mailer] One-pager file not found at ' + ONE_PAGER_PATH);
      return res.status(500).json({ error: 'Sorry, something went wrong. Please email us directly.' });
    }

    const co = clean(company, 120);
    const moving = clean(whatMoving, 300);
    const attachments = [{ filename: ONE_PAGER_FILENAME, path: ONE_PAGER_PATH, contentType: 'application/pdf' }];

    // 1) Send the one-pager to the requester.
    await transporter.sendMail({
      from: MAIL_FROM,
      to: email,
      replyTo: MAIL_TO,
      subject: 'Your ABBA Global Corp One-Pager',
      text: 'Thanks for your interest in ABBA Global Corp.\n\nOur company one-pager is attached. Questions or ready to move freight? Just reply to this email or call 551-218-8322.\n\n— ABBA Global Corp | Precision Freight, Human Touch',
      html: '<p>Thanks for your interest in <strong>ABBA Global Corp</strong>.</p><p>Our company one-pager is attached. Questions or ready to move freight? Just reply to this email or call <a href="tel:5512188322">551-218-8322</a>.</p><p>— ABBA Global Corp · Precision Freight, Human Touch</p>',
      attachments,
    });

    // 2) Notify the ABBA inbox so the lead is captured.
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: email,
      subject: 'One-pager request — ' + (co || email),
      html: '<h3>New one-pager request</h3>'
        + '<p><strong>Email:</strong> ' + clean(email, 254) + '</p>'
        + '<p><strong>Company:</strong> ' + (co || '—') + '</p>'
        + '<p><strong>What they\'re moving:</strong> ' + (moving || '—') + '</p>',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[mailer] one-pager error:', err.message);
    return res.status(500).json({ error: 'Sorry, something went wrong. Please email us directly.' });
  }
});

/* ---------- General contact message ---------- */
app.post('/api/contact', async (req, res) => {
  try {
    if (rateLimited(req.ip)) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

    const { name, email, company, phone, message, website } = req.body || {};
    if (website) return res.json({ ok: true });          // honeypot
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    const nm = clean(name, 120);
    const msg = clean(message, 2000);
    if (!nm || !msg) return res.status(400).json({ error: 'Please include your name and a message.' });

    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: email,
      subject: 'Website contact — ' + nm,
      html: '<h3>New contact message</h3>'
        + '<p><strong>Name:</strong> ' + nm + '</p>'
        + '<p><strong>Email:</strong> ' + clean(email, 254) + '</p>'
        + '<p><strong>Company:</strong> ' + (clean(company, 120) || '—') + '</p>'
        + '<p><strong>Phone:</strong> ' + (clean(phone, 40) || '—') + '</p>'
        + '<p><strong>Message:</strong><br>' + msg.replace(/\n/g, '<br>') + '</p>',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[mailer] contact error:', err.message);
    return res.status(500).json({ error: 'Sorry, something went wrong. Please email us directly.' });
  }
});

app.listen(Number(PORT), () => console.log('[mailer] Listening on port ' + PORT));
