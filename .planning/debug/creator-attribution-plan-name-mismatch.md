---
status: resolved
trigger: 'creator-attribution E2E fails in GitHub pipeline: expected "4:00 Dry Breathhold", got "1:30 to 2:00 14-Day Plan"'
created: 2025-03-21
updated: 2025-03-21
---

## Symptoms

- **Test:** `e2e/creator-attribution.spec.ts` › logged-in user sees creator attribution on Dashboard
- **Expected:** plan-name = "4:00 Dry Breathhold"
- **Actual:** plan-name = "1:30 to 2:00 14-Day Plan"
- **Reproduction:** `npm run test:e2e` (GitHub Actions or local with fresh DB)

## Root Cause

**TrainingContext** (lines 92–99) uses `available[0].id` when the user has no active plan:

```ts
let planId = await fetchActivePlan();
if (planId === null) {
  planId = available[0].id;  // BUG: first in list, not default
  const res = await apiSetActivePlan(planId);
  ...
}
```

**GET /api/plans** returns plans ordered by `ORDER BY p.created_at DESC`. In a shared E2E DB:

1. Migration 003 seeds the default plan ("4:00 Dry Breathhold", id=`default`) at app init.
2. `create-plan.spec.ts` runs before `creator-attribution.spec.ts` and creates "1:30 to 2:00 14-Day Plan" via the fixture.
3. That user-created plan has a more recent `created_at`, so it appears first.
4. Athena (no active plan) gets `available[0]` → the create-plan fixture, not the default.

## Fix

Use `DEFAULT_PLAN_ID` when the user has no active plan, and only fall back to `available[0]` if the default plan is not in the list:

```ts
let planId = await fetchActivePlan();
if (planId === null) {
  const defaultInList = available.find((p) => p.id === DEFAULT_PLAN_ID);
  planId = defaultInList ? DEFAULT_PLAN_ID : available[0].id;
  const res = await apiSetActivePlan(planId);
  ...
}
```

This ensures Athena (and any user with no active plan) sees the seeded default plan "4:00 Dry Breathhold" as intended by the creator-attribution tests.
