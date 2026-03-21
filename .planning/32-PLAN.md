# Phase 32: Multi-Program Switching — Plan

**Status:** Pending  
**Depends on:** Phase 31 (UI Polish)

---

## Goal

Users can switch between training programs; progress is preserved per plan (not reset). Plans tab shows progress (e.g. 3/17 days). Switching asks for confirmation but does not open the Reset prompt. Supports users training different skills at once.

---

## Success Criteria

1. User can switch between training programs; status is preserved per plan (NOT reset)
2. Plans tab shows progress per plan (e.g. "3/17 days" or similar)
3. Switching plan asks for confirmation; does NOT open the Reset prompt
4. Users may train different skills at once by switching between plans

---

## Tasks

### 1. Remove reset from setActivePlan (SC-1, SC-4)

- [ ] **1.1** In `TrainingContext.tsx`, remove the call to `apiResetProgress(planId)` from `setActivePlan`. The flow becomes: `apiSetActivePlan(planId)` → load plan → `fetchCompletions(planId)` → update state. Do NOT clear the new plan's progress.

### 2. Simple switch confirmation modal (SC-3)

- [ ] **2.1** Create `src/components/settings/ConfirmSwitchPlanModal.tsx`: a simple confirmation dialog with props `isOpen`, `onClose`, `onConfirm`, `planName`. Title: "Switch training plan". Message: "Switch to {planName}? Your progress in both plans will be preserved." Two buttons: Cancel (calls onClose), Confirm (calls onConfirm then onClose). Use Headless UI Dialog (same pattern as ConfirmResetModal). Add `data-testid="confirm-switch-plan-modal"` and `data-testid="confirm-switch-plan-confirm"` on Confirm button.
- [ ] **2.2** In `PlansView.tsx`, replace the plan-change `ConfirmResetModal` with `ConfirmSwitchPlanModal`. Pass `planName` from the pending plan (look up by `confirmPlanChange.pendingPlanId` in `availablePlans`). Remove the "Type reset" flow for plan change.

### 3. Plans tab progress display (SC-2)

- [ ] **3.1** In `PlanSelectorSection.tsx`, add prop `planProgress?: Record<string, { completed: number; total: number }>` (planId → { completed, total }). For each plan in the list, if `planProgress[p.id]` exists, render a progress line below the plan name: e.g. "3/17 days" or "3 of 17 days". Use `text-on-surface-variant text-sm`. Add `data-testid="plan-progress-{planId}"` for E2E.
- [ ] **3.2** In `PlansView.tsx`, add state `planProgress: Record<string, { completed: number; total: number }>`. On mount and when `availablePlans` or `user` changes, fetch completions for each plan in parallel: `Promise.all(availablePlans.map(async p => { const c = await fetchCompletions(p.id); return { id: p.id, completed: c.length, total: p.days.length }; }))`. Build the record and pass to `PlanSelectorSection` as `planProgress`. Use `useEffect` with `availablePlans` dependency; call `fetchCompletions` from progressService.
- [ ] **3.3** When user switches plan (after `handleConfirmPlanChange`), refresh `planProgress` so the newly active plan's count updates if they had just completed a day elsewhere. Either re-fetch all, or optimistically update the switched-from plan if needed. Simplest: re-run the same `Promise.all` fetch after `setActivePlan` completes (e.g. in `handleConfirmPlanChange` after `await setActivePlan(...)`).

### 4. Tests

- [ ] **4.1** Add unit test for `ConfirmSwitchPlanModal`: renders when open; Cancel calls onClose; Confirm calls onConfirm; planName appears in message.
- [ ] **4.2** In `e2e/plan-change.spec.ts`, update the plan-change flow: after clicking a plan option, use `confirm-switch-plan-confirm` instead of `confirm-reset-input` + `confirm-reset-confirm` (no typing). Add assertion that progress for switched-to plan is preserved: complete a day in plan A, switch to plan B, switch back to plan A — completed day still shown.
- [ ] **4.3** Add unit test or E2E for Plans tab: progress display shows correct counts (e.g. 0/17 for fresh plan, 3/17 after completing 3 days). Consider mocking fetchCompletions in PlanSelectorSection test if it receives planProgress as prop.

---

## File changes summary

| Action | File(s)                                                              |
| ------ | -------------------------------------------------------------------- |
| Create | `src/components/settings/ConfirmSwitchPlanModal.tsx`                 |
| Modify | `src/contexts/TrainingContext.tsx`                                   |
| Modify | `src/views/PlansView.tsx`                                            |
| Modify | `src/components/settings/PlanSelectorSection.tsx`                    |
| Create | `src/components/settings/ConfirmSwitchPlanModal.test.tsx` (optional) |
| Modify | `e2e/plan-change.spec.ts`                                            |

---

## Context

- **Current behavior:** `setActivePlan` calls `apiResetProgress(planId)` — clears new plan's completions before switch. Phase 32: do NOT reset; progress is already per-plan in DB.
- **Confirmation:** PlansView uses `ConfirmResetModal` with "Type reset" for plan change. Replace with `ConfirmSwitchPlanModal` — simple "Switch to X? Progress preserved." No typing.
- **Progress display:** `fetchCompletions(planId)` returns completions for one plan. Call in parallel for all plans; `completed = completions.length`, `total = plan.days.length`.
- **Plan delete:** Keep `ConfirmResetModal` with `confirmWord="delete"` in PlanSelectorSection — unchanged.

See `.planning/phases/32-multi-program-switching/32-RESEARCH.md` for architecture, patterns, and traceability.
