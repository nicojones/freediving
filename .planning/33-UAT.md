# Phase 33: UAT — Sign Up (Magic Link)

**Phase:** 33  
**Date:** 2025-03-21  
**Status:** In progress

---

## Issues Found (UAT)

### 1. request-magic-link returns 500

**Symptom:** `POST /api/auth/request-magic-link` returns 500.

**Root cause:** SendGrid returns 403 Forbidden (likely unverified sender or API key restrictions). The error was not caught, so it propagated as 500.

**Fix applied:**

- Switched from SendGrid to **Brevo (Sendinblue)** for transactional email.
- Added `SKIP_BREVO_DEV=true` in `.env.local` — in development, when set, bypasses Brevo and logs the magic link URL to the console.
- Added try/catch in `request-magic-link` route — on `sendMagicLink` failure, returns 503 with user-friendly message instead of 500.
- Updated `authService.requestMagicLink` to handle 503.

**Files changed:** `lib/email/brevo.ts`, `lib/email/index.ts`, `app/api/auth/request-magic-link/route.ts`, `src/services/authService.ts`, `.env.local`

---

### 3. Brevo 401 "Key not found" when sending real email

**Symptom:** `POST /api/auth/request-magic-link` returns 503; server logs:

```
[request-magic-link] sendMagicLink failed: Status code: 401
Body: { "message": "Key not found", "code": "unauthorized" }
```

**Root cause:** `BREVO_API_KEY` is an **SMTP key** (`xsmtpsib-...`). The `@getbrevo/brevo` client uses the **REST API** (`sendTransacEmail`), which requires an **API key** (`xkeysib-...`), not an SMTP key. Brevo returns 401 when the wrong key type is used.

**Fix plan:**

1. In Brevo: **Settings → SMTP & API → API Keys & MCP** → Generate a new API key.
2. Copy the new key (it starts with `xkeysib-`; shown only once).
3. Replace `BREVO_API_KEY` in `.env.local` with this API key.
4. Ensure `SKIP_BREVO_DEV` is not set (or is `false`) so Brevo is used.
5. Restart dev server and request a magic link again.

**Verification:** Request magic link at `/login` → email received in inbox from `no-reply-fishly@kupfer.es`.

---

### 2. Remove "Sign in with username" UI (keep for e2e)

**Requirement:** Remove all visible UI for legacy username+password login. E2e must still be able to use it.

**Fix applied:**

- Toggle buttons moved to `sr-only` (visually hidden, screen-reader only).
- Added `?legacy=1` URL param — when present, shows legacy form by default.
- E2e updated to use `/login?legacy=1` instead of clicking the toggle.
- Login helper and specs now navigate to `/login?legacy=1` and fill username/password directly.

**Purpose of legacy login:** Seeded users (nico, athena) have no email; they use username+password. E2e tests rely on these accounts. Magic-link users are stored with `email` and `password_hash=NULL`.

**Files changed:** `src/views/LoginPage.tsx`, `e2e/helpers/login.ts`, `e2e/magic-link.spec.ts`, `e2e/error-paths.spec.ts`

---

## E2E Test Results (2025-03-21 — Phase 33 verify-work)

| Test             | Result | Notes                                          |
| ---------------- | ------ | ---------------------------------------------- |
| All 17 e2e tests | ✓      | Fixed via E2E_MAGIC_LINK_ENABLED on e2e routes |

**Root cause:** Next.js `next dev` overrides `NODE_ENV` to `development`, so `e2e-set-session` and `e2e-reset` returned 404 "Not available". `test-create-magic-link` already used `E2E_MAGIC_LINK_ENABLED` as fallback; applied same pattern to e2e-set-session and e2e-reset.

---

### E2E Failure Diagnosis (dashboard-day-list timeout)

**Symptom:** After `page.goto('/api/auth/e2e-set-session?username=nico')`, tests time out (20s) waiting for `getByTestId('dashboard-day-list')`.

**Flow:** e2e-set-session sets cookie, redirects to `/`. App loads → `getCurrentUser()` → if user, fetch plans → load plan → render Dashboard with DayListSection.

**Possible causes:**

1. **Cookie not sent** → LoginPage shown (no dashboard-day-list)
2. **Plan load fails** → "Loading plan…" or error view (no dashboard-day-list)
3. **Race / timing** → Page still loading when assert runs

**Evidence:** Magic link flow (test-create-magic-link + verify) passes and shows dashboard. Same app, same plan load path. Difference: magic link creates new user; e2e-set-session uses seeded nico/athena. Both should get bundled plans (default, minimal).

**Fix plan (dashboard):**

1. Add `page.waitForLoadState('networkidle')` after goto to ensure API calls complete.
2. Optionally wait for `plan-name` (in DayListSection) as alternative to `dashboard-day-list` if layout changed.
3. Add diagnostic: on timeout, check for `login-email` (LoginPage) or "Loading plan" to identify stuck state.

---

### E2E Failure Diagnosis (e2e-set-session baduser 404)

**Symptom:** `request.get('/api/auth/e2e-set-session?username=baduser')` returns 404; test expects 400.

**Route logic:** For `!ALLOWED.includes(username)` → returns 400. For `NODE_ENV !== 'test'` → returns 404. For user not in DB → returns 404.

**Fix applied:** Same as dashboard — enable route via `E2E_MAGIC_LINK_ENABLED`. Baduser now correctly returns 400.

---

## Fixes Applied (2025-03-21 — Phase 33 verify-work)

1. **app/api/auth/e2e-set-session/route.ts** — Allow route when `E2E_MAGIC_LINK_ENABLED` is set (Next.js overrides NODE_ENV to development).
2. **app/api/auth/e2e-reset/route.ts** — Same pattern for e2e-reset.
3. **e2e/helpers/login.ts** — Add `waitForLoadState('networkidle')` after goto for robustness.

---

## Unit Test Results

| Test                     | Result     |
| ------------------------ | ---------- |
| request-magic-link route | ✓ 2 passed |
| authService              | (if any)   |

---

## UAT Tests (conversational)

### Test 1: Request magic link (dev with bypass or Brevo)

| Step | Action                                                 | Expected                                      |
| ---- | ------------------------------------------------------ | --------------------------------------------- |
| 1.1  | Option A: `SKIP_BREVO_DEV=true` in .env.local (bypass) | —                                             |
|      | Option B: `BREVO_API_KEY` set (real send)              | —                                             |
| 1.2  | Go to /login, enter email, click "Send me a link"      | 200; "Check your email" message               |
| 1.3  | If bypass: check dev server console                    | Magic link URL logged                         |
|      | If Brevo: check inbox                                  | Email received from no-reply-fishly@kupfer.es |
| 1.4  | Open magic link in same browser                        | Redirect to app, logged in                    |

**Result:** _Pending user verification_

---

### Test 2: Legacy login hidden from UI

| Step | Action                   | Expected                                            |
| ---- | ------------------------ | --------------------------------------------------- |
| 2.1  | Go to /login (no params) | Only email form visible; no "Sign in with username" |
| 2.2  | Go to /login?legacy=1    | Username+password form visible (for e2e)            |

**Result:** _Pending user verification_

---

### Test 3: E2E suite

| Step | Action             | Expected       |
| ---- | ------------------ | -------------- |
| 3.1  | `npm run test:e2e` | All tests pass |

**Result:** _Pending_

---

## Summary

| Item             | Status                            |
| ---------------- | --------------------------------- |
| 500 diagnosis    | Complete                          |
| 500 fix          | Executed                          |
| Legacy UI hidden | Executed                          |
| E2e updated      | Executed                          |
| E2e route fix    | Executed (E2E_MAGIC_LINK_ENABLED) |
| Unit tests       | ✓ Pass                            |
| E2E tests        | ✓ 17 passed                       |
| Manual UAT       | Pending                           |

---

## Fixes Applied (2025-03-21)

1. **lib/email/brevo.ts** — Brevo (Sendinblue) transactional email sender.
2. **lib/email/index.ts** — Switched from SendGrid to Brevo; dev bypass: when `SKIP_BREVO_DEV=true`, skip Brevo and log magic link URL.
3. **app/api/auth/request-magic-link/route.ts** — Catch `sendMagicLink` errors; return 503 instead of 500.
4. **src/services/authService.ts** — Handle 503 response.
5. **.env.local** — `BREVO_API_KEY`, `BREVO_FROM_EMAIL=no-reply-fishly@kupfer.es`; optional `SKIP_BREVO_DEV=true`.
6. **src/views/LoginPage.tsx** — Hide legacy toggle with `sr-only`; support `?legacy=1` to show legacy form.
7. **e2e/helpers/login.ts** — Use `/login?legacy=1` instead of clicking toggle.
8. **e2e/magic-link.spec.ts**, **e2e/error-paths.spec.ts** — Use `/login?legacy=1`.
