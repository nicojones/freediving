---
status: awaiting_human_verify
trigger: 'Investigate issue: e2e-flaky-plan-name-and-progress'
created: '2025-03-21T12:00:00.000Z'
updated: '2025-03-21T12:00:00.000Z'
symptoms_prefilled: true
---

## Current Focus

hypothesis: setActivePlan uses stale availablePlans so loadPlanById fails after create; PlanCard omits plan-progress until planProgress loads
test: patch TrainingContext + PlanCard, run e2e
expecting: both specs stable
next_action: verify with npm run test:e2e

## Symptoms

expected:

- create-plan: Training tab shows "E2E Type Plan" after switch
- plan-change: can click plan A with 1/ progress in selector

actual:

- create-plan: plan-name shows "4:00 Dry Breathhold"
- plan-change: timeout waiting for plan-selector-option with plan-progress 1/

errors:

- create-plan: plan-name Expected "E2E Type Plan" Received "4:00 Dry Breathhold"
- plan-change: timeout on plan-selector-option filter with plan-progress 1/

reproduction:

- npm run test:e2e — flaky on first run

## Eliminated

## Evidence

- TrainingContext setActivePlan: loadPlanById(planId, availablePlans) — newly created plan may be missing from React state until next render; loadPlanById returns error and setActivePlan returns without updating activePlanId while API already switched plan
- PlanCard: progress row only when `progress` truthy — no data-testid until PlansView async refreshPlanProgress completes

## Resolution

root_cause: (1) Stale availablePlans in setActivePlan; (2) Missing plan-progress DOM until planProgress state populated
fix: Fetch fresh plans in setActivePlan before loadPlanById; default progress 0/total in PlanCard when progress prop missing
verification: npm run test:e2e (full script): 7/8 passed; create-plan suite including type JSON passed; plan-change failed once on unrelated session/complete wait (webpack noise). Unit PlanSelectorSection tests pass.
files_changed:

- src/contexts/TrainingContext.tsx
- src/components/settings/PlanCard.tsx
- src/components/settings/PlanSelectorSection.test.tsx
