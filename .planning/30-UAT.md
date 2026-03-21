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

**Result:** _Pending_

---

## Summary

| Test                     | Status  |
| ------------------------ | ------- |
| 1. Database connection   | Pending |
| 2. Login                 | Pending |
| 3. Plans and active plan | Pending |
| 4. Progress              | Pending |
| 5. Migrations on startup | Pending |
| 6. E2E with fresh DB     | Pending |

---

## Next steps

1. **Restart dev server** — env vars are loaded at startup.
2. Run Test 1–4 manually in the browser.
3. Update this file with pass/fail for each test.
4. If any test fails, diagnose and prepare fix plan for `/gsd-execute-phase`.
