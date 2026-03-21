---
status: resolved
trigger: "Investigate issue: e2e-plan-change-progress-flaky — E2E test 'progress is preserved when switching plans' is flaky. Times out waiting for plan-selector-option with plan-progress showing '1/'."
created: 2025-03-21T00:00:00.000Z
updated: 2025-03-21T00:00:00.000Z
---

## Current Focus

hypothesis: refreshPlanProgress used stale availablePlans from closure when called after setActivePlan (before React re-render)
test: Pass fresh plans from fetchPlansFromApi to refreshPlanProgress in handleConfirmPlanChange
expecting: planProgress always includes plan A's completion after switch; test stable
next_action: Await human verification

## Symptoms

expected: Can click plan A (the one we completed) with "1/" progress in the plan selector after switching to plan B and back
actual: Timeout 15s — element(s) not found for locator: getByTestId('plan-selector-option').filter({ has: locator('[data-testid^="plan-progress-"]').filter({ hasText: /^1\// }) }).first()
errors: expect(locator).toBeVisible() failed, Timeout: 15000ms, Error: element(s) not found
reproduction: npm run test:e2e — flaky (1 flaky, 22 passed in last run)
started: Prior debug (e2e-flaky-plan-name-and-progress) fixed stale availablePlans + default progress; verification reported plan-change still failed once

## Eliminated

## Evidence

- timestamp: 2025-03-21
  checked: PlansView handleConfirmPlanChange flow
  found: refreshPlanProgress uses availablePlans from useCallback closure; when called after setActivePlan, PlansView has not re-rendered yet, so closure may have stale availablePlans
  implication: If closure has empty or outdated plans, fetch could skip plan A or return wrong data
- timestamp: 2025-03-21
  checked: Test run
  found: Test passed (flaky - 1 passed). Prior verification reported plan-change failed once.
  implication: Race is intermittent; fix should ensure fresh plans when refreshing progress after switch

## Resolution

root_cause: refreshPlanProgress closed over availablePlans; when called from handleConfirmPlanChange immediately after setActivePlan, PlansView had not re-rendered, so the closure could use stale/empty availablePlans and skip or mis-fetch plan A's completions
fix: Pass fresh plans from fetchPlansFromApi() to refreshPlanProgress(plansOverride) in handleConfirmPlanChange so progress is always fetched for the current plan list
verification: 5 consecutive runs of "progress is preserved" passed; full plan-change spec (2 tests) passed
files_changed: [src/views/PlansView.tsx]
