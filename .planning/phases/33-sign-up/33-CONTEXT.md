# Phase 33: Sign Up — Context

**Created:** 2025-03-21  
**Purpose:** Implementation decisions for sign-up and auth flow.  
**Phase:** 33. Sign Up

---

## Decisions (from user)

### 1. Registration / Login Method — Magic Link (Passwordless Email)

- **Choice:** Magic link — user enters email, receives link, clicks to log in. No password.
- **Sign up:** User enters email → account created (if new) → magic link sent → user clicks → logged in.
- **Login:** Same flow — enter email → magic link sent → click → logged in.
- **No password reset:** Not needed; there is no password.
- **Identifier:** Email only for now (no username as primary identifier for new users).

### 2. Token Persistence — Indefinite

- **Choice:** Session tokens persist indefinitely (until explicit sign out).
- **Shared devices:** Possible use case; leave Sign out as-is for users to log out when needed.
- **Scope:** Apply to both login and register — same cookie/session config for all auth flows.

### 3. OAuth (Apple / Google) — Out of Scope

- **Choice:** Keep OAuth out of scope for Phase 33. Email-based magic link only.
- **Deferred:** Apple ID / Google sign-in can be a future phase if desired.

---

## Gray Areas — Resolved

### A. Auth Method

- **Decision:** Magic link (passwordless email). No password. Email as identifier. No reset flow.

### B. Token Lifetime

- **Decision:** Indefinite. Same for login and register. Sign out clears session.

### C. OAuth

- **Decision:** Out of scope. Email-only auth for Phase 33.

---

## Implementation Implications

### Schema

- Current `users` table: `username`, `password_hash` (both required).
- For email-only magic link: need `email` column (unique); `password_hash` nullable or placeholder for magic-link users.
- Username: may derive from email (e.g. local part) or use email as display; researcher/planner to decide.

### Email Infrastructure

- Requires email sending (Resend, SendGrid, Nodemailer, etc.).
- Magic link: signed token in URL, short expiry (e.g. 15 min), one-time use.
- Endpoints: e.g. `POST /api/auth/request-magic-link` (email in body), `GET /api/auth/verify-magic-link?token=...` (exchanges for session cookie).

### Backward Compatibility

- Seeded users (nico, athena) use username + password. Decision needed: keep legacy login for them, or migrate to email. Researcher/planner to propose approach.

### Cookie / JWT Config

- `maxAge`: effectively indefinite (e.g. 10 years or `Number.MAX_SAFE_INTEGER` seconds).
- JWT `expiresIn`: match cookie maxAge.
- Same config for login, register, and magic-link verification.

---

## Code Context

### Current Auth

| File                          | Current                                     |
| ----------------------------- | ------------------------------------------- |
| `app/api/auth/login/route.ts` | Username + password; cookie maxAge 7 days   |
| `lib/auth.ts`                 | `createToken` with `expiresIn: '7d'`        |
| `migrations/001_initial.sql`  | `users(username, password_hash)` — no email |

### Changes Required

- Migration: add `email`; adjust `username`/`password_hash` as needed.
- New routes: request-magic-link, verify-magic-link.
- Email service: send magic link.
- Update login/register UX: email input → "Send me a link" → wait for email → click link.
- Cookie/JWT: indefinite expiry.

---

## Out of Scope for Phase 33

- OAuth (Apple, Google)
- Username as primary identifier (email only for new flow)
- Password-based auth for new users (legacy may remain for seeded users)

---

## Traceability

| Decision          | Outcome                                              |
| ----------------- | ---------------------------------------------------- |
| Auth method       | Magic link (passwordless email); email as identifier |
| Token persistence | Indefinite; apply to login and register              |
| OAuth             | Out of scope; defer to future phase                  |

---

_Context captured from /gsd-discuss-phase 33 — 2025-03-21_
