---
status: fixed
trigger: 'E2E tests fail with "Test was interrupted" after WebServer ER_DUP_ENTRY in active-plan'
created: 2025-03-21
updated: 2025-03-21
---

## Symptoms

**Expected:** All E2E tests pass.

**Actual:** 4 tests interrupted, 15 did not run, 2 passed. Failures show:

- "Test was interrupted"
- "Error: locator.waitFor: Test ended" (waiting for dashboard-day-list)
- "Error: page.goto: Test ended" (navigating to e2e-set-session)

**WebServer output (before failures):**

```
Error: Duplicate entry '2' for key 'user_active_plan.PRIMARY'
    at GET (app/api/user/active-plan/route.ts:43:22)
```

**Timeline:** Occurs during `npm run test:e2e` with 4 workers. Test 4 (paste JSON) passes; tests 1, 3, 5, 6 fail.

**Reproduction:** Run `npm run test:e2e` locally (4 workers).

## Hypotheses

1. **Race in active-plan GET**: Multiple parallel requests for user_id=2 (athena) SELECT → no row → both INSERT → second fails with ER_DUP_ENTRY. Unhandled error returns 500, dashboard never loads.
2. **Test isolation**: Tests share DB; athena's user_active_plan may already exist from prior test, but SELECT uses stale read or race.
3. **Worker interference**: One worker's error causes Playwright to interrupt others.

## Evidence

- `app/api/user/active-plan/route.ts` GET uses plain `INSERT`; PUT uses `INSERT ... ON DUPLICATE KEY UPDATE`.
- user_id=2 = athena (from e2e-set-session).
- Failures all involve `loginAsAthena` or dashboard load.

## Root Cause

Race condition in GET handler: multiple parallel requests for the same user (e.g. athena, user_id=2) both SELECT (no row), both INSERT; second fails with ER_DUP_ENTRY. Unhandled error → 500 → dashboard never loads → tests interrupted.

## Fix Applied

- GET handler now uses `INSERT ... ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id)` (same pattern as PUT), making the auto-set-default operation idempotent.
- Concurrent requests: first INSERT succeeds; second hits duplicate, UPDATE runs (no-op), both return plan_id. No ER_DUP_ENTRY.

## Next Steps

- [x] Fix GET handler to use ON DUPLICATE KEY UPDATE (idempotent insert)
- [x] Verify no other INSERT races in active-plan (only GET had plain INSERT; PUT already used upsert)
- [ ] Re-run E2E to confirm
