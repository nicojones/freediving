# Sign-Up / User Registration Research

**Project:** Freediving Breathhold Trainer  
**Milestone:** Sign up (user registration)  
**Researched:** 2025-03-21  
**Stack:** Next.js 15 App Router, MySQL, bcrypt, JWT in httpOnly cookie

## Overview

The app currently supports **login only** with pre-defined users (nico, athena) seeded via env vars. User registration was explicitly out of scope. This research covers adding a minimal viable sign-up flow that fits the existing auth architecture:

- **Auth flow:** `POST /api/auth/login` → JWT in httpOnly cookie (`sameSite: lax`, `secure` in prod)
- **Schema:** `users(id, username, password_hash)` — no email column
- **Hashing:** bcrypt, 10 rounds (matches existing `lib/auth.ts` and `lib/db.ts`)
- **Validation:** Zod used elsewhere (plan schema); no auth validation yet

The goal is a registration flow that mirrors login: username + password → create user → set session cookie → redirect to app. No email, no verification, no password reset (deferred).

---

## Recommended Approach

### MVP: Username + Password Only

**Recommendation:** Start with **username + password only**. No email, no verification.

| Option                       | Pros                                                           | Cons                                                                               |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Username + password only** | Minimal scope; no schema change; matches login; no email infra | No password reset; no account recovery                                             |
| **Email optional**           | Future-proof; allows recovery later                            | Adds nullable `email` column; more validation; still no recovery until implemented |
| **Email required**           | Account recovery; industry standard                            | Requires email verification; more UX friction; schema + flow complexity            |

**Rationale:** The app targets a small user set (club, family). Pre-defined users remain; registration adds self-service for new users. Email adds complexity (verification, deliverability, privacy) without immediate value. Add email-optional later via migration when recovery is needed.

### Flow Summary

1. User visits login page → sees "Create account" link
2. User navigates to sign-up page (separate route)
3. User submits username + password + confirm password
4. API validates → checks uniqueness → hashes → inserts → sets session cookie
5. User is logged in; redirect to dashboard (same as login success)

---

## API Design

### Endpoint

```
POST /api/auth/register
Content-Type: application/json
```

**Request body:**

```json
{
  "username": "string",
  "password": "string",
  "passwordConfirm": "string"
}
```

**Success (201):**

```json
{
  "user": { "id": 3, "username": "diver1" }
}
```

- Set `token` cookie (same as login) so user is immediately logged in.

**Error responses:**

| Status | Body                                                                                  | When                       |
| ------ | ------------------------------------------------------------------------------------- | -------------------------- |
| 400    | `{ "error": "Username and password required" }`                                       | Missing fields             |
| 400    | `{ "error": "Passwords do not match" }`                                               | password ≠ passwordConfirm |
| 400    | `{ "error": "Username already taken" }`                                               | Duplicate username         |
| 400    | `{ "error": "Username must be 3–20 characters, letters, numbers, underscores only" }` | Validation failure         |
| 400    | `{ "error": "Password must be at least 8 characters" }`                               | Password too short         |
| 429    | `{ "error": "Too many attempts. Try again later." }`                                  | Rate limited               |

**Implementation pattern:** Mirror `app/api/auth/login/route.ts` — `initDb()`, `getDbConnection()`, `connection.execute()`, `createToken()`, `cookies().set()`. Add Zod schema for request validation.

---

## Validation Rules

### Username

| Rule          | Value                                        | Rationale                                         |
| ------------- | -------------------------------------------- | ------------------------------------------------- |
| Min length    | 3                                            | Avoid trivial names; `^[a-zA-Z0-9_]{3,20}$`       |
| Max length    | 20                                           | DB `VARCHAR(255)`; 20 is plenty                   |
| Allowed chars | `a-z`, `A-Z`, `0-9`, `_`                     | Simple, URL-safe, no confusion with special chars |
| Reserved      | `admin`, `root`, `support`, `nico`, `athena` | Prevent impersonation; include seeded users       |
| Uniqueness    | DB UNIQUE constraint                         | Check before insert; return friendly error        |

**Regex:** `^[a-zA-Z0-9_]{3,20}$`  
**Trim:** Trim leading/trailing whitespace before validation.  
**Case:** Store as-is; login is case-sensitive (matches current behavior).

### Password

| Rule       | Value                        | Rationale                                                      |
| ---------- | ---------------------------- | -------------------------------------------------------------- |
| Min length | 8                            | NIST minimum; OWASP baseline                                   |
| Max length | 64                           | NIST allows; prevents DoS via huge inputs                      |
| Complexity | None required                | NIST 2024: no forced special/upper/number; length > complexity |
| Match      | password === passwordConfirm | Client + server check                                          |

**NIST 2024:** No mandatory special chars; 8 min, 15+ recommended; screen against breached DBs if feasible (deferred for MVP).

### Password Confirm

- Must match `password` exactly.
- Validate on server; don't trust client.

---

## Security Considerations

### Rate Limiting

**Risk:** Registration endpoint can be abused (account creation spam, username enumeration).

**Options:**

| Approach                       | Pros                                | Cons                                         |
| ------------------------------ | ----------------------------------- | -------------------------------------------- |
| **In-memory Map (IP → count)** | No deps; works for single-instance  | Lost on restart; doesn't work across workers |
| **@upstash/ratelimit + Redis** | Sliding window; serverless-friendly | Adds Redis/KV; overkill for small app        |
| **Simple in-route counter**    | Trivial                             | Per-process; resets on deploy                |

**Recommendation:** For standalone Node deployment (current setup), use a **simple in-memory sliding window** keyed by IP. Example: 5 attempts per 15 minutes per IP. Document that it resets on restart; acceptable for small user base. Add Upstash/Redis later if needed.

**Implementation:** Create `lib/rateLimit.ts` with `checkLimit(ip: string): boolean`; call at start of register route; return 429 if over limit.

### CSRF

**Current:** Login uses `fetch` with `credentials: 'include'`; cookie has `sameSite: 'lax'`. SameSite=Lax blocks cross-site POST from other origins in most cases, but a 2-minute window exists in some browsers for top-level POSTs.

**Recommendation:** For MVP, **rely on SameSite=Lax** (already set). Registration is a public endpoint; impact of CSRF is account creation under victim's session — low for this app. Add CSRF tokens (e.g. double-submit cookie) if you later add sensitive post-login actions from cross-site forms.

### User Enumeration

**Risk:** Different error messages for "username taken" vs "invalid format" reveal whether a username exists.

**Mitigation:** Use generic message for duplicate: `"Username already taken"` (doesn't reveal format vs existence). For validation errors, be specific (`"Username must be 3–20 characters..."`). Avoid `"User exists"` vs `"Invalid username"` distinction that leaks existence.

### Timing Attacks

**Risk:** `SELECT` for uniqueness may take longer when user exists (index hit) vs not.

**Mitigation:** Use constant-time comparison for sensitive branches if paranoid. For registration, the main leak is enumeration; rate limiting + generic errors are higher impact. Not critical for MVP.

### Password Hashing

- Use **bcrypt, 10 rounds** (match existing `lib/db.ts`).
- Never log or store plaintext password.
- Use `bcrypt.hash(password, 10)` before insert.

---

## Migration / DB Changes

### MVP (Username + Password Only)

**No schema change.** Existing `users` table already has:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
);
```

Registration inserts `(username, password_hash)`. `INSERT IGNORE` in `seedUsers` means nico/athena are created first; registration uses normal `INSERT` and will fail on duplicate username (UNIQUE constraint). Handle `ER_DUP_ENTRY` → return "Username already taken".

### Future: Email Optional

When adding email (optional, for recovery):

```sql
-- migrations/002_add_email_optional.sql
ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL UNIQUE;
```

- `NULL` for existing and new users who skip email.
- `UNIQUE` to support "forgot password" lookup later.
- Add email format validation (RFC 5322 simplified or `/.+@.+/`).

### Seed Users

`seedUsers()` uses `INSERT IGNORE` — nico/athena are seeded once. New registrations use `INSERT`; duplicates (including nico/athena) hit UNIQUE and return friendly error. No change to seed logic.

---

## UX Flow

### Entry Point

**Recommendation:** Link from login page: "Don't have an account? Create one"

- Place below the login form or in footer.
- Navigate to `/register` or `/signup` (pick one; `/register` is common).

### Page Layout

**Recommendation:** **Separate sign-up page**, not inline tabs on login.

| Option             | Pros                                            | Cons                             |
| ------------------ | ----------------------------------------------- | -------------------------------- | --------------------------------------- |
| Separate page      | Clear mental model; matches login; easy to test | One extra navigation             |
| Inline tabs (Login | Sign up)                                        | Single screen                    | More complex state; harder to deep-link |
| Modal              | Keeps context                                   | Overkill; accessibility concerns |

Reuse login page styling (abyssal gradient, FishIcon, TextInput, PrimaryButton) for consistency.

### Form Fields

1. **Username** — text input, `autoComplete="username"`
2. **Password** — password input, `autoComplete="new-password"`
3. **Confirm password** — password input, `autoComplete="new-password"`

Optional: Show password requirements (e.g. "At least 8 characters") below password field.

### Success Behavior

On success, API sets `token` cookie (same as login). Client receives `{ user }` → call `onLoginSuccess()` or equivalent → user is logged in, no extra step. Same pattern as login.

### Error Handling

- Display API `error` in red below form (like login).
- Keep form values on validation error; clear password fields on "Username already taken" (security).

---

## Pitfalls

### 1. Seed User Collision

**What goes wrong:** User registers "nico" or "athena" — already in DB from seed.

**Prevention:** UNIQUE constraint rejects; return "Username already taken". Consider adding nico/athena to reserved list so you can reject before DB hit (optional).

### 2. No Password Reset

**What goes wrong:** User forgets password; no way to recover.

**Prevention:** Document as known limitation. Add email + "Forgot password" in a future phase.

### 3. Rate Limit Reset on Restart

**What goes wrong:** In-memory rate limit clears on deploy; attacker gets fresh quota.

**Prevention:** Accept for MVP. Add Redis/Upstash if abuse appears.

### 4. Username Enumeration via Timing

**What goes wrong:** Response time differs for "exists" vs "doesn't exist".

**Prevention:** Low priority for small app. Rate limiting + generic errors are higher impact.

### 5. Client-Only Validation

**What goes wrong:** Bypass client validation; send invalid data to API.

**Prevention:** **Always validate on server.** Use Zod in route handler. Client validation is UX only.

### 6. Logging Sensitive Data

**What goes wrong:** Log `{ username, password }` in error handler.

**Prevention:** Never log password. Log `username` only if needed for debugging (avoid in prod).

### 7. Inconsistent Auth Cookie

**What goes wrong:** Register sets cookie with different options than login (path, sameSite, maxAge).

**Prevention:** Reuse exact cookie config from login: `httpOnly`, `secure` in prod, `sameSite: 'lax'`, `path: '/'`, `maxAge: 7d`.

---

## Implementation Checklist

- [ ] Create `app/api/auth/register/route.ts` — POST handler
- [ ] Add Zod schema for `{ username, password, passwordConfirm }`
- [ ] Validate username format, reserved names, uniqueness
- [ ] Validate password length, password match
- [ ] Hash with bcrypt (10 rounds), insert user
- [ ] Set token cookie (same as login)
- [ ] Add rate limiting (in-memory or Upstash)
- [ ] Create `RegisterPage` component (mirror LoginPage)
- [ ] Add "Create account" link on LoginPage → `/register`
- [ ] Wire AppShell: unauthenticated + `/register` → RegisterPage
- [ ] Add `register()` to `authService.ts`
- [ ] E2E test: register → logged in → dashboard

---

## Sources

| Source                                                                                                                                            | Confidence | Notes                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------- |
| [Jason Watmore: Next.js 13 + MySQL Registration](https://jasonwatmore.com/next-js-13-mysql-user-registration-and-login-tutorial-with-example-app) | HIGH       | Registration flow, bcrypt, uniqueness check |
| [NIST Password Guidelines 2024](https://cynomi.com/nist/nist-password-guidelines-2024/)                                                           | HIGH       | 8 char min; no forced complexity            |
| [OWASP Testing Guide - Weak Password Policy](https://owasp.org/www-project-web-security-testing-guide/)                                           | HIGH       | Validation checklist                        |
| [Stack Overflow: Username regex 3-20 alphanumeric underscore](https://stackoverflow.com/questions/54391861/)                                      | MEDIUM     | `^[a-zA-Z0-9_]{3,20}$`                      |
| [SameSite=Lax CSRF](https://security.stackexchange.com/questions/234386/do-i-still-need-csrf-protection-when-samesite-is-set-to-lax)              | HIGH       | Partial protection; 2-min window            |
| [Next.js Rate Limiting 2024](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)                                | MEDIUM     | Upstash, in-memory options                  |
| Project: `lib/auth.ts`, `app/api/auth/login/route.ts`, `migrations/001_initial.sql`                                                               | HIGH       | Current auth and schema                     |
