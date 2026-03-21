# Phase 32: Multi-Program Switching — Research

**Researched:** 2025-03-21  
**Domain:** Plan switching, progress preservation, Plans tab UX, confirmation flows  
**Confidence:** HIGH

## Summary

Phase 32 changes plan switching from a "reset on switch" flow to a "preserve progress per plan" flow. The database already stores progress per (user_id, plan_id, day_id); the change is purely in application logic and UI. Remove `apiResetProgress(planId)` from `TrainingContext.setActivePlan`; replace the plan-change confirmation (currently `ConfirmResetModal` with "Type reset") with a simple "Switch to X?" dialog; add progress display (e.g. "3/17 days") per plan in Plans tab. No new API endpoints required — `fetchCompletions(planId)` can be called in parallel for each plan to compute progress counts.

**Primary recommendation:** Implement in order: (1) Remove reset from setActivePlan; (2) Add simple switch confirmation modal; (3) Add progress display to PlanSelectorSection; (4) Update E2E and unit tests.

---

## Current Behavior (Phase 10)

| Area                     | Current                                                                                  | Phase 32 Target                                   |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| setActivePlan            | Calls `apiResetProgress(planId)` after `apiSetActivePlan` — clears new plan's progress   | Do NOT reset; only switch active plan             |
| Plan change confirmation | `ConfirmResetModal` — "Changing plan will reset your progress. Type 'reset' to confirm." | Simple "Switch to X?" — Cancel/Confirm; no typing |
| Plans tab                | Plan list with name/description; no progress                                             | Show "3/17 days" (or similar) per plan            |
| Progress storage         | Already per-plan in `progress_completions`                                               | No change — already correct                       |

---

## Architecture

### Database (no changes)

- `progress_completions (user_id, plan_id, day_id, completed_at)` — PRIMARY KEY includes plan_id
- `user_active_plan (user_id, plan_id)` — stores active plan per user
- Progress is already isolated per plan; switching does not require schema changes

### Key Files

| File                                                      | Change                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/contexts/TrainingContext.tsx`                        | Remove `apiResetProgress(planId)` from `setActivePlan`                    |
| `src/views/PlansView.tsx`                                 | Replace ConfirmResetModal for plan change with simple switch confirmation |
| `src/components/settings/PlanSelectorSection.tsx`         | Add progress display (completed/total days) per plan                      |
| New: `src/components/settings/ConfirmSwitchPlanModal.tsx` | Simple dialog: "Switch to {planName}?" — Cancel/Confirm                   |

### Progress Display

- **Source:** For each plan, call `fetchCompletions(planId)` and count completions; total days = `plan.days.length`
- **Format:** "3/17 days" or "3 of 17 days" — implementer choice
- **Placement:** In PlanSelectorSection, next to or below plan name
- **Performance:** Parallel `Promise.all(availablePlans.map(p => fetchCompletions(p.id)))` — acceptable for typical 2–10 plans

### Confirmation Flow

- **Plan change:** New `ConfirmSwitchPlanModal` — title "Switch training plan", message "Switch to {planName}? Your progress in both plans will be preserved.", Cancel + Confirm. No typing required.
- **Plan delete:** Keep existing `ConfirmResetModal` with `confirmWord="delete"` — unchanged.

---

## Out of Scope

- Batch API for fetching all plans' completions (parallel fetches sufficient)
- Offline queue changes (clearByPlanId only used by reset; switch does not reset)
- Plan discovery or plan versioning

---

## Traceability

| Success Criterion                                       | Implementation                                                    |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| Status preserved per plan (NOT reset)                   | Remove `apiResetProgress` from `setActivePlan`                    |
| Plans tab shows progress (e.g. 3/17 days)               | PlanSelectorSection: fetch completions per plan; display count    |
| Switching asks confirmation; does NOT open Reset prompt | New ConfirmSwitchPlanModal; PlansView uses it for plan change     |
| Users may train different skills at once                | Implicit — progress per plan already in DB; switch preserves both |
