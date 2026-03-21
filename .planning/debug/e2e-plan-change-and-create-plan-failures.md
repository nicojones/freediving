---
status: awaiting_human_verify
trigger: 'Investigate issue: e2e-plan-change-and-create-plan-failures'
created: '2025-03-21T00:00:00.000Z'
updated: '2025-03-21T00:00:00.000Z'
symptoms_prefilled: true
---

## Current Focus

hypothesis: plan-change uses speed 10 but session takes ~3min at 10x; create-plan has race with refreshAvailablePlans
test: apply fixes and run E2E
expecting: both tests pass
next_action: fix plan-change speed, fix create-plan wait

## Symptoms

expected:

- plan-change: After starting session with speed 10, complete-session-button should become visible so user can complete the session
- create-plan: After creating plan "E2E Type Plan", the plan card with data-plan-name="E2E Type Plan" should appear in the plan selector so user can click it

actual:

- plan-change: complete-session-button never found (60s timeout, failed on both run and retry)
- create-plan: Plan element [data-plan-name="E2E Type Plan"] not found (60s timeout on first run; passed on retry #1 - flaky)

errors:

- plan-change: expect(locator).toBeVisible() failed - getByTestId('complete-session-button') - element(s) not found
- create-plan: locator.click: Test timeout of 60000ms exceeded - waiting for locator('[data-plan-name="E2E Type Plan"]')

reproduction:

- Run: npm run test:e2e (or pnpm test:e2e)
- plan-change.spec.ts:31 - "progress is preserved when switching plans"
- create-plan.spec.ts:126 - "Create plan › type JSON manually, create plan, switch to it, verify Training tab"

timeline:

- Not specified; create-plan is flaky (passed on retry), plan-change fails consistently

## Eliminated

## Evidence

- plan-change: session-flow.spec.ts uses speed 100 and completes in ~19s; plan-change uses speed 10 → ~3min. 60s timeout too short.
- create-plan: onPlanCreated (refreshAvailablePlans) is called but not awaited; test navigates before plans refresh.

## Resolution

root_cause: (1) plan-change uses speed 10, session takes ~3min, 60s timeout expires; (2) create-plan has race: nav to Plans before refreshAvailablePlans completes; (3) edit test reused PASTE_PLAN id, causing 409 when paste test ran first
fix: (1) use speed 100 in plan-change; (2) await onPlanCreated in create handlers; (3) use unique EDIT_PLAN for edit test
verification: All 22 E2E tests passed (1.3m). Also fixed edit test plan id conflict (PASTE_PLAN reused).
files_changed: [e2e/plan-change.spec.ts, e2e/create-plan.spec.ts, src/components/settings/create-plan/useCreatePlanHandlers.ts]
