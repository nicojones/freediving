# Phase 33: Sign Up (Magic Link) — Research

**Researched:** 2025-03-21  
**Domain:** Magic link auth, email sending, template rendering, token security  
**Confidence:** HIGH  
**Context:** `33-CONTEXT.md`, `.planning/research/SIGN-UP.md`

## Summary

Add magic link (passwordless) sign-up and login. User enters email → account created if new → magic link sent via SendGrid → user clicks → logged in. No password. Email as identifier. Templates in codebase (`lib/email/templates/`), rendered with variables, sent via SendGrid API with inline content (no `template_id`). Backward compatibility: seeded users (nico, athena) keep username+password via existing `POST /api/auth/login`.

---

## Standard Stack

Plans use these libraries. Do not substitute without justification.

| Library                  | Version    | Purpose                                                                                                                                       |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sendgrid/mail`         | ^8.x       | Send emails via SendGrid v3 API; use `sgMail.send(msg)` with `html` property                                                                  |
| `handlebars`             | ^4.x       | Compile and render email templates from filesystem; `Handlebars.compile(source)(data)`                                                        |
| `crypto` (Node built-in) | —          | Generate secure tokens: `crypto.randomBytes(32).toString('hex')`; hash for storage: `crypto.createHash('sha256').update(token).digest('hex')` |
| `jsonwebtoken`           | (existing) | Session token after verification; reuse `createToken()` from `lib/auth.ts`                                                                    |
| `zod`                    | (existing) | Request validation (email format, etc.)                                                                                                       |

**SendGrid:** User has SendGrid; keep using it. Send via POST to SendGrid v3 API with inline content — `content` array with `type: "text/html"` and `value: "<html>...</html>"` — **never** use `template_id`. The `@sendgrid/mail` client accepts `html` directly on the message object.

---

## Architecture Patterns

Task structure follows these patterns.

### 1. Email Module (`lib/email/`)

```
lib/email/
├── index.ts          # sendMagicLink(to, magicLinkUrl) — loads template, renders, POSTs to SendGrid
├── sendgrid.ts       # sgMail.setApiKey(); send(msg) wrapper
└── templates/
    └── magic-link.hbs
```

- **Load template:** `fs.readFileSync(path.join(process.cwd(), 'lib/email/templates/magic-link.hbs'), 'utf-8')` or `fs.promises.readFile`
- **Render:** `Handlebars.compile(source)({ magicLinkUrl, appName: 'Fishly' })`
- **Send:** `sgMail.send({ to, from, subject, html: rendered })` — no `template_id`, no `dynamic_template_data`

### 2. Magic Link Token Flow

| Step                | Action                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Request          | `POST /api/auth/request-magic-link` with `{ email }`                                                                                         |
| 2. Create/find user | If new: insert user (email, username from email local part, password_hash NULL). If existing: lookup by email.                               |
| 3. Generate token   | `crypto.randomBytes(32).toString('hex')` — 64-char hex string                                                                                |
| 4. Store hash       | Insert into `magic_link_tokens` table: `token_hash` (SHA-256 of token), `user_id`, `expires_at` (now + 15 min). Store hash, never raw token. |
| 5. Build URL        | `${APP_URL}/api/auth/verify-magic-link?token=${rawToken}`                                                                                    |
| 6. Send email       | Call `sendMagicLink(email, url)`                                                                                                             |
| 7. Response         | Always 200 `{ message: 'If an account exists, a link was sent.' }` — no email enumeration                                                    |
| 8. Verify           | `GET /api/auth/verify-magic-link?token=...` — hash token, lookup, check expiry, delete row (one-time), set session cookie, redirect to app   |

### 3. Database Schema

**Migration:** Add `magic_link_tokens` table and alter `users`:

```sql
-- magic_link_tokens: one-time use, short expiry
CREATE TABLE magic_link_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- users: add email, make password_hash nullable
ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL UNIQUE;
ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL;
```

- `token_hash`: SHA-256 hex of the raw token (64 chars)
- `expires_at`: Unix timestamp; 15 min from creation
- On verify: `DELETE FROM magic_link_tokens WHERE token_hash = ?` — ensures one-time use

### 4. Backward Compatibility

| User type             | Auth method         | Route                                                                   | Notes                                               |
| --------------------- | ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Seeded (nico, athena) | Username + password | `POST /api/auth/login`                                                  | Keep as-is. No email column; password_hash present. |
| New (magic link)      | Email → magic link  | `POST /api/auth/request-magic-link` + `GET /api/auth/verify-magic-link` | email required; password_hash NULL                  |

- **Login page:** Two paths — "Sign in with username" (legacy) and "Sign in with email" (magic link). Or single email field with "Send me a link" for magic link; keep username+password as secondary/toggle for legacy.
- **Planner decision:** Researcher recommends **unified entry**: one form with email input + "Send me a link" button. Legacy users (nico, athena) do not have email — they need a separate "Sign in with username" link/section that shows username+password form. E2E and seeded users use that path.
- **Seed users:** `seedUsers()` unchanged — inserts nico, athena with username+password_hash. No email. They never use magic link.

---

## Don't Hand-Roll

Tasks NEVER build custom solutions for these. Use the prescribed approach.

| Problem              | Use                                                       | Do not                                                             |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| Token generation     | `crypto.randomBytes(32).toString('hex')`                  | Custom PRNG, short tokens, predictable values                      |
| Token hashing        | `crypto.createHash('sha256').update(token).digest('hex')` | Store raw token in DB                                              |
| One-time use         | Delete row on successful verify                           | Rely on JWT expiry only; stateless magic link                      |
| Email sending        | `@sendgrid/mail` with `html`                              | Nodemailer, Resend, custom SMTP (user wants SendGrid)              |
| Templates            | Handlebars + files in `lib/email/templates/`              | SendGrid UI templates, `template_id`, inline HTML strings in route |
| Session after verify | Existing `createToken()` + `cookies().set()`              | Custom session store, different cookie config                      |

---

## Common Pitfalls

Verification steps check for these.

| Pitfall                           | Prevention                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Email enumeration**             | Same response for existing vs new email: "If an account exists, a link was sent." Never reveal whether email is registered.                             |
| **Token in URL logged**           | Never log the `token` query param. Log only `user_id` after successful verify.                                                                          |
| **Raw token in DB**               | Store only `token_hash`. Compare `hash(incoming) === stored_hash`.                                                                                      |
| **Reuse of token**                | Delete row immediately after successful verify. Second click → 401 "Link expired or already used."                                                      |
| **SendGrid template_id**          | Use `html` in message object. Do not pass `template_id` or `dynamic_template_data`.                                                                     |
| **Templates in SendGrid UI**      | Store `.hbs` files in `lib/email/templates/`. Load from filesystem, render, send inline.                                                                |
| **Rate limit bypass**             | Rate limit `request-magic-link` by IP: 5 per 15 min (reuse `lib/rateLimit.ts` pattern from prior research).                                             |
| **Legacy login broken**           | Keep `POST /api/auth/login` for username+password. Do not require email for that route.                                                                 |
| **Cookie mismatch**               | Verify route must use same cookie options as login: `httpOnly`, `secure` in prod, `sameSite: 'lax'`, `path: '/'`, `maxAge` per 33-CONTEXT (indefinite). |
| **Username for magic-link users** | Derive from email: `email.split('@')[0]` or use email as username. Ensure uniqueness (append suffix if collision).                                      |

---

## Code Examples

Task actions reference these patterns.

### SendGrid: Inline HTML (no template_id)

```ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const msg = {
  to: email,
  from: process.env.SENDGRID_FROM_EMAIL!,
  subject: `Sign in to ${APP_NAME}`,
  html: '<p>Click <a href="{{magicLinkUrl}}">here</a> to sign in.</p>', // or rendered Handlebars output
};
await sgMail.send(msg);
```

### Template in Codebase (Handlebars)

```ts
// lib/email/index.ts
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

const templatePath = path.join(process.cwd(), 'lib/email/templates/magic-link.hbs');
const source = fs.readFileSync(templatePath, 'utf-8');
const template = Handlebars.compile(source);
const html = template({ magicLinkUrl, appName: 'Fishly' });
```

```html
<!-- lib/email/templates/magic-link.hbs -->
<!DOCTYPE html>
<html>
  <body>
    <p>Click the link below to sign in to {{appName}}:</p>
    <p><a href="{{magicLinkUrl}}">Sign in</a></p>
    <p>This link expires in 15 minutes and can only be used once.</p>
  </body>
</html>
```

### Magic Link Token: Generate, Store, Verify

```ts
// Generate
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min

// Store
await connection.execute(
  'INSERT INTO magic_link_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
  [tokenHash, userId, expiresAt, Date.now()]
);

// Verify (in GET handler)
const token = searchParams.get('token');
if (!token) return redirect('/login?error=missing');
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const [rows] = await connection.execute(
  'SELECT user_id, expires_at FROM magic_link_tokens WHERE token_hash = ?',
  [tokenHash]
);
const row = (Array.isArray(rows) ? rows[0] : undefined) as
  | { user_id: number; expires_at: number }
  | undefined;
if (!row || row.expires_at < Date.now()) {
  return redirect('/login?error=expired');
}
await connection.execute('DELETE FROM magic_link_tokens WHERE token_hash = ?', [tokenHash]);
// Create session, set cookie, redirect to app
```

### Response to Prevent Enumeration

```ts
// POST /api/auth/request-magic-link
// Always return 200 with same body, regardless of whether user exists
return Response.json({
  message: 'If an account exists with this email, you will receive a sign-in link shortly.',
});
```

---

## API Design

```
POST /api/auth/request-magic-link
Body: { email: string }
Success 200: { message: "If an account exists..." }
Errors: 400 (invalid email), 429 (rate limit)
Side effect: If valid email, create user if new, store token, send email.

GET /api/auth/verify-magic-link?token=<hex>
Success: Set session cookie, redirect to / (or /dashboard)
Errors: Redirect to /login?error=expired|invalid|missing
Side effect: Delete token (one-time use).
```

---

## Environment Variables

| Variable              | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `SENDGRID_API_KEY`    | SendGrid API key for v3 mail send                        |
| `SENDGRID_FROM_EMAIL` | From address (must be verified in SendGrid)              |
| `APP_URL`             | Base URL for magic link (e.g. `https://app.example.com`) |
| `SESSION_SECRET`      | (existing) For JWT signing                               |

---

## Implementation Order (High Level)

1. Migration: `magic_link_tokens` table, `users` add `email`, `password_hash` nullable
2. `lib/email/` — template, Handlebars render, SendGrid send
3. `lib/rateLimit.ts` — in-memory sliding window (if not exists)
4. `POST /api/auth/request-magic-link` — validate email, create/find user, token, store, send
5. `GET /api/auth/verify-magic-link` — verify, delete, set cookie, redirect
6. Login/Register UX — email input, "Send me a link"; legacy username+password section for nico/athena
7. E2E: magic link flow (mock or real email); legacy login unchanged

---

## Traceability

| Requirement            | Approach                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| SendGrid               | @sendgrid/mail, inline `html`, no template_id                         |
| Templates in codebase  | lib/email/templates/\*.hbs, Handlebars.compile                        |
| Magic link token       | crypto.randomBytes, SHA-256 hash in DB, 15 min expiry                 |
| One-time use           | DELETE on verify                                                      |
| Backward compatibility | Keep POST /api/auth/login for username+password; seed users unchanged |

---

_Sources: SendGrid v3 API docs, SuperTokens magic link guide, Diego Castillo Next.js magic link, OWASP token storage, project lib/auth.ts, lib/db.ts_
