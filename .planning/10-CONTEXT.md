# Phase 10: Reset + Plan Change — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for reset progress, multiple plans, and plan-change warning.  
**Phase:** 10. Reset + Plan Change

---

## Decisions

### 1. Reset Progress

- **Location:** Settings page.
- **Action:** User can explicitly reset their progress (e.g. "Reset progress" button).
- **Scope:** Resets progress for the **active plan only** — clears completions for that plan in the DB (and offline queue).
- **Confirmation:** Show confirmation dialog before reset (e.g. "This will clear all progress for this plan. Continue?").

### 2. Plan Structure

- **Current:** Plan is an array of days: `PlanDay[]`.
- **New:** Plan is an object: `{ id: string, name: string, description?: string, days: PlanDay[] }`.
- **Migration:** Each plan JSON in `src/data` becomes `{ id, name, description, days: [...] }`. `default-plan.json` becomes one plan; additional plans follow same structure.
- **Plan ID:** Used as `plan_id` in completions and for active-plan storage. Must be stable (e.g. `"default"`, `"co2-tolerance-iii"`).

### 3. Multiple Plans + Active Plan in DB

- **Source:** Multiple plan JSON files in `src/data` (e.g. `default-plan.json`, `plan-b.json`). Plans are bundled at build time.
- **Active plan:** Stored per user in the DB. New table or column: `user_id` → `plan_id` (e.g. `user_active_plan` or `user_preferences`).
- **Default:** If no active plan stored, use first available plan (e.g. `"default"`).
- **API:** Backend needs `GET/PUT /api/user/active-plan` or similar to read/write active plan per user.

### 4. Plan Selector in Settings

- **UI:** Dropdown in Settings page listing available plans (name from `plan.name`).
- **Behavior:** User selects a different plan → show warning: "Changing plan will reset your progress for this plan. Continue?" → If confirm: switch active plan, clear completions for the new plan (or both old and new as needed), reload plan and completions.

### 5. Plan-Change Warning

- **Trigger:** When user selects a different plan in the dropdown (and there is existing progress for the current plan, or always for clarity).
- **Message:** "Changing plan will reset your progress. Continue?" (or similar).
- **Flow:** User selects new plan → confirmation modal → Confirm = switch plan + reset progress for that plan; Cancel = revert dropdown to current plan.

---

## Out of Scope for Phase 10

- In-app plan editor
- Plan versioning or migration of old completions
- Plan discovery from API (plans remain in `src/data`)

---

## Traceability

| Decision            | Outcome                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Reset progress      | Button in Settings; confirmation; clears active plan's completions |
| Plan structure      | `{ id, name, description, days }`; migrate JSON files              |
| Multiple plans      | Several JSON files in src/data; active plan in DB per user         |
| Plan selector       | Dropdown in Settings; lists plan names                             |
| Plan-change warning | Confirmation modal before switching; reset on confirm              |

---

## Code Context

- **planService:** Currently `loadPlan()` returns `Plan` (array). Change to `loadPlan(planId?: string)` returning `PlanWithMeta` or load all plans; add `getAvailablePlans()`, `loadPlanById(id)`.
- **Plan type:** Add `PlanWithMeta { id, name, description?, days: PlanDay[] }`. `Plan` can remain as alias for `PlanDay[]` for day-level logic, or become `days` property.
- **TrainingContext:** Load active plan from API; pass `planId` to `loadPlan`, `fetchCompletions`, `recordCompletion`. Add `activePlanId`, `setActivePlanId`, `resetProgress`, `availablePlans`.
- **SettingsView:** Add plan dropdown (from `availablePlans`); add "Reset progress" button. Both need handlers from TrainingContext. Plan change → confirmation modal → call API to switch + reset.
- **Backend:** New table `user_active_plan (user_id, plan_id)` or `user_preferences (user_id, key, value)`. New routes: `GET /api/user/active-plan`, `PUT /api/user/active-plan`, `DELETE /api/progress?plan_id=...` (or `POST /api/progress/reset`) for reset.
- **progressService:** Add `resetProgress(planId: string)`; backend deletes completions for user+plan_id.
- **offlineQueue:** Reset must also clear queued completions for that plan from IndexedDB.
- **default-plan.json:** Migrate to `{ id: "default", name: "CO2 Tolerance III", description: "...", days: [ ... ] }` (or similar).

---

_Context captured from /gsd-discuss-phase 10_
