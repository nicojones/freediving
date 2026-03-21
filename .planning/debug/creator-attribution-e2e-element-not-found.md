---
status: resolved
trigger: 'creator-attribution E2E fails: getByTestId("plan-creator") and getByText("Created by Fishly") element(s) not found'
created: 2025-03-21
updated: 2025-03-21
---

## Symptoms

- **Test 1:** `e2e/creator-attribution.spec.ts:12` › logged-in user sees default plan with creator attribution in Plans tab
  - **Error:** `getByTestId('plan-creator')` element(s) not found
  - **Expected:** "Created by Fishly"
- **Test 2:** `e2e/creator-attribution.spec.ts:23` › logged-in user sees creator attribution on Dashboard
  - **Error:** `getByText('Created by Fishly')` element(s) not found
- **Reproduction:** `npm run test:e2e` (with fresh DB)

## Root Cause (Found)

### 1. Wrong testid for Plans tab

When Athena logs in, she has no active plan. The API auto-sets her active plan to `DEFAULT_PLAN_ID` (default plan). So the default plan "4:00 Dry Breathhold" appears in **Active plan section**, not in "Other plans".

- **Active plan section** uses `creatorTestId="active-plan-creator"`
- **Plan selector (other plans)** uses `creatorTestId="plan-creator"`

The test looks for `plan-creator`, which only exists for plans in the "Other plans" list. When default is active, it's in Active plan section → only `active-plan-creator` exists.

### 2. CREATED_BY constant mismatch

In `src/constants/app.ts`:

```ts
export const CREATED_BY = 'By';
```

The rendered text is `{CREATED_BY} {plan.creator_name ?? APP_NAME}` = "By Fishly".

The test expects "Created by Fishly". The constant should be "Created by" per Phase 35 spec.

## Fix

1. **app.ts:** Change `CREATED_BY` from `'By'` to `'Created by'`
2. **creator-attribution.spec.ts (Plans tab):** Use `getByTestId('active-plan-creator')` since default is the active plan
3. **creator-attribution.spec.ts (Dashboard):** Keep `getByText('Created by Fishly')` — will pass once CREATED_BY is fixed
