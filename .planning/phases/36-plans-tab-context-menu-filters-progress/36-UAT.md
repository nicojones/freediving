---
status: fixes-applied
phase: 36-plans-tab-context-menu-filters-progress
source: 36-PLAN.md, 36-CONTEXT.md
started: 2025-03-21T00:00:00Z
updated: 2025-03-21T19:35:00Z
---

## Current Test

Edit plan flow changed from navigation to in-place modal. Reset progress moved from Settings to Plans tab context menu. Fix applied 2025-03-21. Ready for user verification.

## Fixes Applied

### Fix 1: Edit Flow (2025-03-21)

**User request:** When clicking "Edit" in the plan context menu (PlanCard), do NOT navigate to the Create tab. Instead, open the normal modal with edit name/description.

**Previous behavior:** `PlanContextMenu` called `router.push(\`/create?edit=${plan.id}\`)` — navigated to Create tab.

**New behavior:** `PlanContextMenu` calls `onRequestEdit(plan)` — opens `ConfirmPlanModal` in-place on the Plans tab. User edits name/description and saves via PATCH. No navigation.

### Fix 2: Reset Progress Location (2025-03-21)

**User request:** Reset progress should be in the plan context menu on the Plans tab instead of a separate section in Settings.

**Previous behavior:** Settings tab had `ResetProgressSection` with a red "Reset progress" button; clicking opened ConfirmResetModal.

**New behavior:** Plans tab → click "..." on a plan → "Reset progress" (red, restart_alt icon) in dropdown → same ConfirmResetModal (type "reset" to confirm). Available for active plan and other user-created plans. Settings no longer has reset section.

### Changes

| File                    | Change                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| PlanContextMenu.tsx     | Added `onRequestEdit` prop; removed `useRouter`; Edit calls `onRequestEdit` instead of `router.push`                                |
| PlanCard.tsx            | Added `onRequestEdit` prop; passes to PlanContextMenu                                                                               |
| PlanSelectorSection.tsx | Added `editingPlan` state, `ConfirmPlanModal`, `handleRequestEdit`, `handleConfirmEdit` (PATCH); passes `onRequestEdit` to PlanCard |
| ActivePlanSection.tsx   | Same: `editingPlan`, `ConfirmPlanModal`, `handleRequestEdit`, `handleConfirmEdit`; added `onPlanEdited` prop                        |
| PlansView.tsx           | Passes `onPlanEdited={refreshAvailablePlans}` to both ActivePlanSection and PlanSelectorSection                                     |

## Tests

### 0. Reset Progress from Plans Tab

expected: In Plans tab, click "..." on the active plan (or any user-created plan). Click "Reset progress" (red, restart_alt icon). Modal opens. Type "reset", click Confirm. Progress cleared; modal closes.
result: pending

### 1. Edit from Other Plans List

expected: In Plans tab, click "..." on a user-created plan in "Other Training plans". Click "Edit". Modal opens with plan name and description editable. Change name, click Save. Plan list refreshes; no navigation to Create tab.
result: pending

### 2. Edit from Active Plan

expected: In Plans tab, click "..." on the active plan (if user-created). Click "Edit". Modal opens. Edit name/description, Save. Plan list refreshes; no navigation.
result: pending

### 3. Edit Modal Cancel

expected: Open Edit modal, click Cancel or click outside. Modal closes; no changes saved.
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
