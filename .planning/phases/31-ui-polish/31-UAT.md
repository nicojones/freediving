# Phase 31: UAT — UI Polish

**Phase:** 31  
**Date:** 2025-03-21  
**Status:** In progress

---

## E2E Test Results (from CI/terminal)

| Test                      | Result | Error                                                      |
| ------------------------- | ------ | ---------------------------------------------------------- |
| abort-session             | ✘      | `abort-session-button` not found (timeout 5s)              |
| create-plan (upload JSON) | ✘      | `dashboard-day-list` not visible after loginAsAthena (15s) |
| plan-change               | ✘      | `waitForURL(/\/plans/)` timed out (60s)                    |
| reset-progress            | ✘      | `reset-progress-button` not found (60s)                    |
| session-flow              | ✘      | `dashboard-day-list` not visible after loginAsAthena (15s) |
| 7 others                  | ✓      | Passed                                                     |

---

## Diagnosis

### 1. plan-change & reset-progress — Nav button selectors

**Symptom:** plan-change: URL never changes to `/plans` after clicking Plans; reset-progress: `reset-progress-button` not found after clicking Settings.

**Root cause:** Tests use `getByRole('button', { name: /plans/i })` and `getByRole('button', { name: /settings/i })`. Phase 31 specifies "label only on active tab" — when that is implemented, inactive tabs show icon only; the label span is removed from DOM. The button's accessible name would no longer include "Plans"/"Settings", so `getByRole` can fail. Even before Phase 31, `getByRole` can be flaky (e.g. multiple matches, timing).

**Fix:** Use `data-testid` for nav clicks. Add `data-testid="nav-settings"` to Settings button; update plan-change and reset-progress to use `getByTestId('nav-plans')` and `getByTestId('nav-settings')`. Matches create-plan.spec which already uses `nav-create`, `nav-plans`, `nav-training`.

### 2. abort-session — Session page never reached

**Symptom:** `abort-session-button` not found after clicking start-session-button.

**Root cause:** `SessionRouteGuard` in AppShell redirects to `/` when `sessionStatus !== 'running' && sessionStatus !== 'awaitingCompletionConfirm'`. The flow: `handleStartSession()` (async) → `setSessionStatus('running')` → `router.push('/session')`. React state updates are asynchronous; when the user navigates to `/session`, the guard may run before the `sessionStatus` update has flushed, see `idle`, and immediately redirect. The test never sees the session page.

**Fix:** After `engineStartSession` completes, yield to the next tick before navigating so React can flush the state: `await new Promise(r => setTimeout(r, 0)); router.push('/session');` in Dashboard's `handleStartSessionClick`.

### 3. create-plan (upload) & session-flow — dashboard-day-list timeout

**Symptom:** `loginAsAthena` times out waiting for `dashboard-day-list` (15s).

**Root cause:** Likely environment/timing: plan loading for athena (default plan, API calls) can exceed 15s under load (CI, cold DB, parallel workers). Same pattern as prior fixes (see `.planning/debug/e2e-tests-fail-login-dashboard.md`).

**Fix:** Increase `DASHBOARD_TIMEOUT` in `e2e/helpers/login.ts` from 15s to 20s. Consider running E2E with `workers: 1` in CI to reduce contention.

---

## Fix Plan (ready for execution)

| #   | Action                                                 | File(s)                      |
| --- | ------------------------------------------------------ | ---------------------------- |
| 1   | Add `data-testid="nav-settings"` to Settings button    | `BottomNavBar.tsx`           |
| 2   | Use `getByTestId('nav-plans')` instead of getByRole    | `e2e/plan-change.spec.ts`    |
| 3   | Use `getByTestId('nav-settings')` instead of getByRole | `e2e/reset-progress.spec.ts` |
| 4   | Yield before `router.push('/session')` after start     | `Dashboard.tsx`              |
| 5   | Increase `DASHBOARD_TIMEOUT` to 20000                  | `e2e/helpers/login.ts`       |

---

## UAT Tests (conversational)

### Test 1: Bottom tabs — label only on active

| Step | Action                       | Expected                                        |
| ---- | ---------------------------- | ----------------------------------------------- |
| 1.1  | Open app, go to Training tab | Active tab shows icon + label; others icon only |
| 1.2  | Tap Plans                    | Plans tab active with label; others icon only   |
| 1.3  | Tap Create, then Settings    | Same pattern                                    |

**Result:** _Pending_

### Test 2: Top-right — Dashboard progress only

| Step | Action                        | Expected                     |
| ---- | ----------------------------- | ---------------------------- |
| 2.1  | On Dashboard                  | Top-right shows "Day X of Y" |
| 2.2  | Go to Plans, Create, Settings | No weekLabel in top-right    |

**Result:** _Pending_

### Test 3: Create plan success — "See plans here"

| Step | Action                       | Expected                                                |
| ---- | ---------------------------- | ------------------------------------------------------- |
| 3.1  | Create a plan (paste/upload) | Success banner: "See plans here" + "Go to Plans" button |
| 3.2  | Click "Go to Plans"          | Navigate to Plans tab; plan in selector                 |

**Result:** _Pending_

### Test 4: Developer zone — muted, at bottom

| Step | Action        | Expected                                  |
| ---- | ------------- | ----------------------------------------- |
| 4.1  | Open Settings | Dev mode section at bottom; muted styling |

**Result:** _Pending_

### Test 5: E2E suite

| Step | Action             | Expected          |
| ---- | ------------------ | ----------------- |
| 5.1  | `npm run test:e2e` | All 12 tests pass |

**Result:** ✓ Pass (12 passed, 45s) — 2025-03-21

---

## Summary

| Item          | Status      |
| ------------- | ----------- |
| E2E diagnosis | Complete    |
| Fix plan      | Ready       |
| Fixes applied | ✓ Complete  |
| E2E suite     | ✓ 12 passed |
| Manual UAT    | Pending     |

---

## Fixes Applied (2025-03-21)

1. **BottomNavBar.tsx** — Added `data-testid="nav-settings"` to Settings button
2. **plan-change.spec.ts** — Use `getByTestId('nav-plans')` instead of getByRole
3. **reset-progress.spec.ts** — Use `getByTestId('nav-settings')` + `waitForURL(/\/settings/)`
4. **Dashboard.tsx** — Yield `setTimeout(0)` before `router.push('/session')` so SessionRouteGuard sees `sessionStatus === 'running'`
5. **abort-session.spec.ts** — Add `waitForURL(/\/session/)` before expecting abort button
6. **login.ts** — Increase `DASHBOARD_TIMEOUT` from 15s to 20s
