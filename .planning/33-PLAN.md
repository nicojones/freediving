# Phase 33: Sign Up (Magic Link) — Plan

**Status:** Implemented  
**Depends on:** Phase 31 (UI Polish)

---

## Goal

Users can create their own account via magic link (passwordless email). User enters email → account created if new → magic link sent via SendGrid → user clicks → logged in. No password. Email as identifier. Legacy users (nico, athena) keep username+password via existing login.

---

## Success Criteria

1. User can request a magic link by entering email; if new, account is created; link sent via SendGrid
2. User clicks magic link → verified → session cookie set → redirect to app (logged in)
3. Rate limiting: 5 attempts per 15 min per IP on request-magic-link
4. Login page has unified entry: email input + "Send me a link" for magic link; "Sign in with username" for legacy
5. No email enumeration: same response for existing vs new email
6. Token/session: indefinite persistence (per 33-CONTEXT); same cookie config for login, register, magic-link verify
7. Legacy login (username+password) unchanged for seeded users (nico, athena)

---

## Tasks

### 1. Database migration (REQ-33-schema)

- [ ] **1.1** Create `migrations/002_magic_link.sql`: `magic_link_tokens` table (`id`, `token_hash` VARCHAR(64) UNIQUE, `user_id`, `expires_at`, `created_at`); `ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL UNIQUE`; `ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL`. Run migration on init or document manual step.

### 2. Rate limiting (REQ-33-3)

- [ ] **2.1** Create `lib/rateLimit.ts`: in-memory sliding window, keyed by IP. `checkLimit(ip: string): boolean` — returns false if over limit (5 attempts per 15 min). `recordAttempt(ip: string): void`. Export both. Use `Map<string, number[]>` for timestamps; prune old entries on check.

### 3. Email module (REQ-33-sendgrid)

- [ ] **3.1** Create `lib/email/sendgrid.ts`: `sgMail.setApiKey(process.env.SENDGRID_API_KEY)`; export `send(msg)` wrapper.
- [ ] **3.2** Create `lib/email/templates/magic-link.hbs`: Handlebars template with `{{magicLinkUrl}}`, `{{appName}}`. Include expiry note (15 min, one-time use).
- [ ] **3.3** Create `lib/email/index.ts`: `sendMagicLink(to: string, magicLinkUrl: string)`. Load template from `lib/email/templates/magic-link.hbs`, render with Handlebars, send via SendGrid with `html` (no `template_id`). Use `SENDGRID_FROM_EMAIL`, subject "Sign in to Fishly".

### 4. Request magic link API (REQ-33-1, REQ-33-2, REQ-33-6)

- [ ] **4.1** Create `app/api/auth/request-magic-link/route.ts`. POST handler. Call `initDb()`, get IP from `x-forwarded-for` or `x-real-ip` or `'unknown'`, call `checkLimit(ip)` — return 429 if over limit; else `recordAttempt(ip)`.
- [ ] **4.2** Parse body `{ email }`. Zod: `z.string().email().trim()`. On validation error → 400 with generic message.
- [ ] **4.3** Lookup user by email: `SELECT id, username FROM users WHERE email = ?`. If not found: insert new user `(email, username=email.split('@')[0] or derived, password_hash=NULL)`. Ensure username uniqueness (append suffix if collision).
- [ ] **4.4** Generate token: `crypto.randomBytes(32).toString('hex')`. Hash: `crypto.createHash('sha256').update(token).digest('hex')`. Insert into `magic_link_tokens` (token_hash, user_id, expires_at=now+15min, created_at).
- [ ] **4.5** Build URL: `${APP_URL}/api/auth/verify-magic-link?token=${rawToken}`. Call `sendMagicLink(email, url)`.
- [ ] **4.6** Return 200 `{ message: 'If an account exists with this email, you will receive a sign-in link shortly.' }` — no email enumeration. Never log token.

### 5. Verify magic link API (REQ-33-2)

- [ ] **5.1** Create `app/api/auth/verify-magic-link/route.ts`. GET handler. Read `token` from searchParams. If missing → redirect `/login?error=missing`.
- [ ] **5.2** Hash token, lookup in `magic_link_tokens`. If not found or expired → redirect `/login?error=expired`.
- [ ] **5.3** Delete row (one-time use). Fetch user by user_id. Create token via `createToken({ id, username })`. Set cookie (httpOnly, secure in prod, sameSite: 'lax', path: '/', maxAge: indefinite per 33-CONTEXT). Redirect to `/` or `/dashboard`.
- [ ] **5.4** Never log the token query param. Log only user_id after successful verify.

### 6. Token/cookie config (REQ-33-indefinite)

- [ ] **6.1** In `lib/auth.ts`, add option or env for indefinite expiry. Per 33-CONTEXT: `maxAge` effectively indefinite (e.g. 10 years or `Number.MAX_SAFE_INTEGER` seconds). Update `createToken` to support indefinite `expiresIn`. Apply same cookie config in login, verify-magic-link.
- [ ] **6.2** Update `app/api/auth/login/route.ts` cookie `maxAge` to match indefinite config (if CONTEXT applies to all auth).

### 7. Auth service (REQ-33-client)

- [ ] **7.1** In `src/services/authService.ts`, add `requestMagicLink(email: string): Promise<{ message?: string } | { error: string }>`. POST to `/api/auth/request-magic-link`, credentials: 'include'. On 200 → return `{ message }`. On 4xx → parse `{ error }`, return `{ error }`. On 429 → return `{ error: 'Too many attempts. Try again later.' }`.

### 8. Login/Register UX (REQ-33-4, REQ-33-5)

- [ ] **8.1** Refactor `LoginPage.tsx`: primary flow = email input + "Send me a link" button. Call `requestMagicLink(email)`. On success → show "Check your email" message. No redirect (user must click link).
- [ ] **8.2** Add "Sign in with username" link/section that toggles to legacy username+password form (existing LoginPage logic). For legacy: call `login(username, password)`, on success → `onLoginSuccess()`.
- [ ] **8.3** Mirror styling: abyssal gradient, FishIcon, "Fishly" / "Breathhold Protocol". Data-testids: `login-email`, `login-send-link`, `login-username-toggle`, `login-username`, `login-password`, `login-submit`, `login-error`.
- [ ] **8.4** Handle verify redirect: on LoginPage mount, if URL has `?error=expired` or `?error=missing`, display message ("Link expired or already used" / "Invalid link") and clear query after display.

### 9. E2E tests (REQ-33-5)

- [ ] **9.1** E2E: legacy login (nico/athena) still works — username+password → dashboard.
- [ ] **9.2** E2E: magic link flow — mock `sendMagicLink` to capture the magic link URL (or use test email service like Ethereal/Mailhog); request link → extract token from captured URL → call verify API with token (or navigate to URL) → expect redirect to app, user logged in.
- [ ] **9.3** E2E: rate limit — 6 requests in quick succession → 429.
- [ ] **9.4** E2E: invalid/expired token redirect → error message on login page.

### 10. Unit tests

- [ ] **10.1** Unit test `authService.requestMagicLink`: success returns message; 400 returns error; 429 returns rate limit message.
- [ ] **10.2** Unit test `lib/rateLimit`: checkLimit, recordAttempt, sliding window behavior.
- [ ] **10.3** Unit test request-magic-link route: validation, rate limit, no enumeration (same response for new vs existing).

---

## File changes summary

| Action        | File(s)                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| Create        | `migrations/002_magic_link.sql`                                           |
| Create        | `lib/rateLimit.ts`                                                        |
| Create        | `lib/email/sendgrid.ts`                                                   |
| Create        | `lib/email/templates/magic-link.hbs`                                      |
| Create        | `lib/email/index.ts`                                                      |
| Create        | `app/api/auth/request-magic-link/route.ts`                                |
| Create        | `app/api/auth/verify-magic-link/route.ts`                                 |
| Modify        | `lib/auth.ts` (indefinite token option)                                   |
| Modify        | `app/api/auth/login/route.ts` (cookie maxAge if indefinite)               |
| Modify        | `src/services/authService.ts`                                             |
| Modify        | `src/views/LoginPage.tsx`                                                 |
| Modify        | `src/components/layout/AppShell.tsx` (if needed for verify error routing) |
| Create/Modify | `e2e/magic-link.spec.ts` or extend auth E2E                               |
| Create/Modify | `src/services/authService.test.ts`                                        |
| Create        | `lib/rateLimit.test.ts`                                                   |

---

## Environment variables

| Variable              | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `SENDGRID_API_KEY`    | SendGrid API key for v3 mail send                        |
| `SENDGRID_FROM_EMAIL` | From address (verified in SendGrid)                      |
| `APP_URL`             | Base URL for magic link (e.g. `https://app.example.com`) |
| `SESSION_SECRET`      | (existing) JWT signing                                   |

---

## Context

- Research: `.planning/research/SIGN-UP.md`, `.planning/phases/33-sign-up/33-RESEARCH.md`
- User decisions: `.planning/33-CONTEXT.md` (magic link, indefinite token)
- Existing auth: `app/api/auth/login/route.ts`, `lib/auth.ts`, `lib/db.ts`
- Backward compatibility: seeded users (nico, athena) use username+password; no email column for them
