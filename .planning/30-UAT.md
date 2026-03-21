# Phase 30: UAT — Dockerize MySQL + Change Database Type

**Phase:** 30  
**Date:** 2025-03-21  
**Status:** In progress

---

## Blocking issue (resolved)

**Symptom:** `Access denied for user ''@'192.168.65.1' (using password: YES)` on `/api/user/active-plan`.

**Root cause:** `.env.local` lacked MySQL connection variables. `DB_USER` (and others) were empty.

**Fix applied:** Added to `.env.local`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=freediving
DB_PASS=freediving
DB_NAME=freediving
USER_PASSWORD_NICO=password
USER_PASSWORD_ATHENA=password
```

**Action required:** Restart `npm run dev` so Next.js picks up the new env vars.

---

## UAT tests

### Test 1: Database connection

| Step | Action                                        | Expected                       |
| ---- | --------------------------------------------- | ------------------------------ |
| 1.1  | Ensure `docker compose up -d` (MySQL running) | Container healthy              |
| 1.2  | Restart dev server (`npm run dev`)            | No "Access denied" errors      |
| 1.3  | Open app in browser                           | App loads; no 500 on API calls |

**Result:** _Pending_

---

### Test 2: Login

| Step | Action                                   | Expected                          |
| ---- | ---------------------------------------- | --------------------------------- |
| 2.1  | Go to login page                         | Login form visible                |
| 2.2  | Log in as `nico` / `password`            | Redirect to app; session persists |
| 2.3  | Log out; log in as `athena` / `password` | Same behavior                     |

**Result:** _Pending_

---

### Test 3: Plans and active plan

| Step | Action                         | Expected                                                     |
| ---- | ------------------------------ | ------------------------------------------------------------ |
| 3.1  | Create a new plan (name, days) | Plan saved; appears in list                                  |
| 3.2  | Set plan as active             | Active plan shown; no 500 on GET/PUT `/api/user/active-plan` |
| 3.3  | Refresh page                   | Active plan persists                                         |

**Result:** _Pending_

---

### Test 4: Progress

| Step | Action                          | Expected             |
| ---- | ------------------------------- | -------------------- |
| 4.1  | Complete a session (breathhold) | Progress recorded    |
| 4.2  | View progress/history           | Data shown correctly |
| 4.3  | Refresh                         | Progress persists    |

**Result:** _Pending_

---

### Test 5: Migrations on startup

| Step | Action                                                                      | Expected                                                                          |
| ---- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 5.1  | Check dev server logs on startup                                            | "Database ready" message                                                          |
| 5.2  | Inspect DB: `mysql -u freediving -pfreediving freediving -e "SHOW TABLES;"` | `users`, `plans`, `progress_completions`, `user_active_plan`, `schema_migrations` |

**Result:** _Pending_

---

### Test 6: E2E with fresh DB (optional)

| Step | Action             | Expected                             |
| ---- | ------------------ | ------------------------------------ |
| 6.1  | `npm run db:up`    | MySQL running                        |
| 6.2  | `npm run test:e2e` | E2E passes; fresh DB created per run |

**Result:** _12 passed_ (after migration fix + voice test race fix, 2025-03-21)

---

## Summary

| Test                     | Status  |
| ------------------------ | ------- |
| 1. Database connection   | Pending |
| 2. Login                 | Pending |
| 3. Plans and active plan | Pending |
| 4. Progress              | Pending |
| 5. Migrations on startup | Pending |
| 6. E2E with fresh DB     | Pass    |

---

## E2E diagnosis (2025-03-21)

### Issue 1: Migration race — `Duplicate entry '001_initial.sql' for key 'schema_migrations.PRIMARY'`

**Symptom:** Multiple `initDb()` calls (from concurrent API requests) run migrations in parallel. Both pass the `SELECT` check, both run DDL, both `INSERT` into `schema_migrations` — second insert throws `ER_DUP_ENTRY`.

**Root cause:** No locking around migration runner; Next.js server workers share DB but not in-memory `initialized` flag.

**Fix applied:** `INSERT IGNORE` for `schema_migrations` in `lib/migrate.ts`. Duplicate inserts are silently ignored; migrations remain idempotent (CREATE TABLE IF NOT EXISTS, etc.).

### Issue 2: E2E failures (2 tests) — resolved

| Test                  | Error                                                              |
| --------------------- | ------------------------------------------------------------------ |
| `abort-session`       | Timeout 15s waiting for `dashboard-day-list` after login as athena |
| `create-plan` (voice) | Timeout 15s waiting for `/api/plans/transcribe` response           |

**Root cause (abort-session):** Migration race caused 500s on some API requests; login/plan requests failed intermittently. After migration fix, test passes.

**Root cause (voice):** `waitForResponse` was called _after_ clicking "Stop recording". The mocked transcribe response can arrive in the same tick; by the time `waitForResponse` started listening, the response had already been received, so the test timed out.

**Fix applied (voice):** Start `waitForResponse` _before_ the click, then await it after. Ensures we're listening when the mocked response arrives.

### Issue 3: Webpack cache warning (non-blocking)

`Caching failed for pack: ENOENT: rename ... 10.pack.gz_ -> 10.pack.gz` — known Next.js dev cache race; does not affect test outcomes.

---

## Next steps

1. **Restart dev server** — env vars are loaded at startup.
2. Run Test 1–4 manually in the browser.
3. Re-run `npm run test:e2e` to verify migration fix resolves duplicate-entry errors.
4. ~~If abort-session or voice tests still fail, investigate timing/mocking.~~ Voice test fixed (waitForResponse before click).
5. Update this file with pass/fail for each test.
6. If any test fails, diagnose and prepare fix plan for `/gsd-execute-phase`.
