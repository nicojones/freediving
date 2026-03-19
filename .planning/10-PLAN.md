# Phase 10: Reset + Plan Change — Executable Plan

---
phase: 10-reset-plan-change
plans:
  - id: "01"
    tasks: 3
    files: 6
    depends_on: [09-refactor-code]
  - id: "02"
    tasks: 3
    files: 8
    depends_on: ["01"]
type: execute
wave: 1
files_modified:
  - src/data/default-plan.json
  - src/data/minimal-plan.json
  - src/types/plan.ts
  - src/services/planService.ts
  - src/services/progressService.ts
  - src/services/offlineQueue.ts
  - src/contexts/TrainingContext.tsx
  - src/components/SettingsView.tsx
  - src/components/SessionCompleteView.tsx
  - src/components/TopAppBar.tsx
  - src/pages/Dashboard.tsx
  - server/schema.sql
  - server/routes/progress.js
  - server/routes/user.js
  - server/index.js
autonomous: false
requirements:
  - RESET-01
  - PLAN-10-01
  - PLAN-10-02
  - PLAN-10-03
  - PLAN-10-04
user_setup: []
must_haves:
  truths:
    - "User can reset progress from the settings page"
    - "Multiple plans exist in src/data; plan structure is {id, name, description, days}"
    - "Active training plan is stored per user in the DB"
    - "Settings page has a dropdown to select plan; changing plan shows warning that progress will be reset"
  artifacts:
    - path: src/services/planService.ts
      provides: "getAvailablePlans(), loadPlanById(planId)"
      contains: "getAvailablePlans"
    - path: src/services/offlineQueue.ts
      provides: "clearByPlanId(planId)"
      contains: "clearByPlanId"
    - path: src/components/SettingsView.tsx
      provides: "Plan dropdown, Reset progress button"
      contains: "Reset progress"
  key_links:
    - from: src/contexts/TrainingContext.tsx
      to: src/services/planService.ts
      via: "loadPlanById, getAvailablePlans"
      pattern: "loadPlanById"
    - from: src/contexts/TrainingContext.tsx
      to: src/services/progressService.ts
      via: "fetchActivePlan, setActivePlan, resetProgress"
      pattern: "fetchActivePlan"
---

## Objective

Add reset progress from settings, multiple training plans with `{id, name, description, days}` structure, active plan stored per user in DB, plan selector dropdown in Settings, and plan-change warning before switching.

**Purpose:** Allow users to reset progress and switch between training plans; ensure progress is scoped per plan and persisted correctly.

**Principles:**
- Plan structure migration first; then backend; then frontend wiring.
- Reset clears both DB and offline queue for the active plan.
- Plan change: confirmation modal → switch + clear new plan's completions.

**Output:** Migrated default-plan.json; planService multi-plan; backend active-plan + reset API; offlineQueue clearByPlanId; TrainingContext activePlanId/availablePlans/resetProgress/setActivePlan; Settings plan dropdown + reset button + confirmations.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/10-CONTEXT.md
- @.planning/phases/10-reset-plan-change/10-RESEARCH.md

**Existing:** Phases 1–9 complete. Single plan `default-plan.json` (array of days). TrainingContext loads plan and completions with hardcoded `plan_id: 'default'`. Settings has logout only.

**Design decisions (from 10-CONTEXT):**
- Reset: Settings button; confirmation; clears active plan's completions (DB + offline queue).
- Plan structure: `{ id, name, description?, days: PlanDay[] }`.
- Active plan: stored per user in DB; API GET/PUT `/api/user/active-plan`.
- Plan selector: dropdown in Settings; onChange → confirmation modal; Confirm = switch + reset new plan.

---

## Plan 01: Plan Structure + Backend API

### Task 1: Migrate Plan Structure and Types

**Files:** `src/types/plan.ts`, `src/data/default-plan.json`

**Action:**
1. Add to `src/types/plan.ts`:
   ```ts
   /** Plan with metadata; new structure for multi-plan support */
   export interface PlanWithMeta {
     id: string
     name: string
     description?: string
     days: PlanDay[]
   }
   ```
2. Migrate `src/data/default-plan.json` from array to object:
   ```json
   {
     "id": "default",
     "name": "CO2 Tolerance III",
     "description": "12-day breathhold training program",
     "days": [ { "id": "dfc8fb52", "day": 1, ... }, ... ]
   }
   ```
3. Create `src/data/minimal-plan.json` (second plan for dropdown; success criterion "multiple plans"):
   ```json
   {
     "id": "minimal",
     "name": "Minimal Test",
     "description": "Single-day test plan",
     "days": [{ "id": "a1b2c3d4", "day": 1, "phases": [{ "type": "hold", "duration": 5 }, { "type": "recovery", "duration": 10 }] }]
   }
   ```

**Verify:**
```bash
npm run build
# JSON is valid; types compile
```

**Done:** PlanWithMeta type; default-plan.json and minimal-plan.json have `{ id, name, description, days }`.

---

### Task 2: Plan Service Multi-Plan

**Files:** `src/services/planService.ts`

**Action:**
1. Add `import.meta.glob` for plan loading:
   ```ts
   const planModules = import.meta.glob<{ default: PlanWithMeta }>('../data/*-plan.json', {
     eager: true,
     import: 'default',
   })
   ```
2. Add `getAvailablePlans(): PlanWithMeta[]` — returns `Object.values(planModules).filter(Boolean)`.
3. Add `loadPlanById(planId: string): PlanWithMeta | { error: string }` — finds plan by id from getAvailablePlans; returns error if not found.
4. Update `loadPlan(planId?: string): Promise<PlanWithMeta | { error: string }>` — if planId provided, call loadPlanById; else load first plan from getAvailablePlans. Return `PlanWithMeta` (not raw Plan).
5. Update `getPhasesForDay`, `getDayId`, `getDayById`, `getDayIndexById`, `getCurrentDay`, `getDaySummary` to accept `Plan` (PlanDay[]) — callers will pass `plan.days` when they have PlanWithMeta. No signature change needed if we keep Plan = PlanDay[].
6. Add helper `getPlanDays(plan: Plan | PlanWithMeta): PlanDay[]` — returns `Array.isArray(plan) ? plan : plan.days` for backward compatibility during migration.

**Note:** All existing functions (getPhasesForDay, getDayId, etc.) take `Plan` = `PlanDay[]`. Callers with PlanWithMeta pass `plan.days`. No changes to those function signatures.

**Verify:**
```bash
npm run build
# getAvailablePlans returns at least default plan; loadPlanById('default') works
```

**Done:** planService has getAvailablePlans, loadPlanById; loadPlan(planId?) returns PlanWithMeta.

---

### Task 3: Backend Active Plan + Reset API

**Files:** `server/schema.sql`, `server/routes/user.js`, `server/routes/progress.js`, `server/index.js`

**Action:**
1. Add to `server/schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS user_active_plan (
     user_id INTEGER PRIMARY KEY,
     plan_id TEXT NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```
2. Create `server/routes/user.js`:
   - `GET /api/user/active-plan` — returns `{ plan_id: string }` for req.user.id; 404 if none (caller uses first plan).
   - `PUT /api/user/active-plan` — body `{ plan_id: string }`; upsert user_active_plan; return `{ ok: true }`.
3. Add to `server/routes/progress.js`:
   - `DELETE /api/progress?plan_id=...` — delete completions for user + plan_id; return `{ ok: true }`. Require plan_id query param.
4. Update backend `loadPlan(planId)` in progress.js for day_index fallback: read `src/data/${planId === 'default' ? 'default' : planId}-plan.json`; if structure has `days`, use `plan.days[day_index]`; else `plan[day_index]` (legacy).
5. Register user router in `server/index.js`: `app.use('/api/user', userRouter)`.

**Verify:**
```bash
# Run server, test:
# GET /api/user/active-plan (after login) — 404 or { plan_id }
# PUT /api/user/active-plan { plan_id: "default" } — 200
# DELETE /api/progress?plan_id=default — 200
```

**Done:** user_active_plan table; GET/PUT active-plan; DELETE progress by plan_id; backend loadPlan handles new structure.

**Plan 01 complete.** Proceed to Plan 02.

---

## Plan 02: Services + Context + Settings UI

### Task 4: Offline Queue clearByPlanId + Progress Service Reset

**Files:** `src/services/offlineQueue.ts`, `src/services/progressService.ts`

**Action:**
1. Add to `src/services/offlineQueue.ts`:
   ```ts
   export async function clearByPlanId(planId: string): Promise<number> {
     const db = await getDB()
     const items = (await db.getAll(STORE_NAME)) as PendingCompletion[]
     const toDelete = items.filter((i) => i.plan_id === planId)
     for (const item of toDelete) {
       if (item.id != null) await db.delete(STORE_NAME, item.id)
     }
     return toDelete.length
   }
   ```
2. Add to `src/services/progressService.ts`:
   - `fetchActivePlan(): Promise<string | null>` — GET /api/user/active-plan; return plan_id or null.
   - `setActivePlan(planId: string): Promise<{ ok: boolean } | { error: string }>` — PUT /api/user/active-plan.
   - `resetProgress(planId: string): Promise<{ ok: boolean } | { error: string }>` — call DELETE /api/progress?plan_id=...; then `clearByPlanId(planId)`; return ok or error.

**Verify:**
```bash
npm run build
# Manual: resetProgress clears DB and offline queue
```

**Done:** clearByPlanId; fetchActivePlan; setActivePlan; resetProgress.

---

### Task 5: TrainingContext Multi-Plan Wiring

**Depends on:** Plan 01 (plan structure, backend API)

**Files:** `src/contexts/TrainingContext.tsx`

**Action:**
1. Add state: `activePlanId`, `availablePlans`, `activePlanLoading`.
2. On user load: fetch `fetchActivePlan()`; if null/404, use first plan from `getAvailablePlans()` as default; call `setActivePlan(firstPlan.id)` to persist.
3. Load plan: `loadPlanById(activePlanId)` (or loadPlan(activePlanId)); store PlanWithMeta; expose `plan` as `planWithMeta?.days ?? null` for existing consumers that expect Plan (array), OR expose `planWithMeta` and update callers to use `plan.days`. Simpler: keep `plan` as `PlanDay[]` = `planWithMeta?.days ?? null`; add `planWithMeta` to context for name/description.
4. Fetch completions: `fetchCompletions(activePlanId)`.
5. Record completion: `recordCompletion(activePlanId, dayId, dayIndex)`.
6. Add `resetProgress: () => Promise<void>` — call progressService.resetProgress(activePlanId); refetch completions. (Confirmation is shown in Settings before calling.)
7. Add `setActivePlan: (planId: string) => Promise<void>` — confirmation handled in Settings; this just: call setActivePlan API; call resetProgress(planId) for new plan; loadPlanById(planId); fetchCompletions(planId); set activePlanId.
8. Expose: `activePlanId`, `availablePlans`, `planWithMeta` (or `planName`), `resetProgress`, `setActivePlan`.

**Verify:**
```bash
npm run build
# Manual: login → dashboard shows plan; completions load for active plan
```

**Done:** TrainingContext uses activePlanId; loadPlanById; fetchCompletions(activePlanId); resetProgress; setActivePlan.

---

### Task 6: Settings UI — Plan Dropdown + Reset Button + Confirmations

**Depends on:** Plan 01, Task 5

**Files:** `src/components/SettingsView.tsx`, `src/App.tsx` (or parent that renders SettingsView)

**Action:**
1. SettingsView receives from TrainingContext: `availablePlans`, `activePlanId`, `planWithMeta`, `resetProgress`, `setActivePlan`.
2. Add **Plan selector** section:
   - Dropdown (`<select>`) listing `availablePlans.map(p => ({ value: p.id, label: p.name }))`.
   - Value = `activePlanId`; controlled.
   - On change: if new value !== activePlanId, show confirmation: "Changing plan will reset your progress. Continue?" — `window.confirm` or minimal custom modal. If confirm: call `setActivePlan(newPlanId)`; if cancel: revert dropdown to activePlanId (do not update state).
3. Add **Reset progress** section:
   - Button "Reset progress".
   - On click: show confirmation "This will clear all progress for this plan. Continue?" — if confirm: call `resetProgress()`.
4. Ensure SettingsView is rendered within TrainingProvider so it has access to context. Pass `planName` from `planWithMeta?.name` to TopAppBar if used.
5. Update Dashboard, SessionCompleteView, TopAppBar: use `planWithMeta?.name ?? 'CO2 Tolerance III'` instead of hardcoded plan name. Add `SessionCompleteView.tsx` and `TopAppBar.tsx` to files_modified.

**Verify:**
```bash
npm run build
npm run dev
# Manual: Settings → change plan → confirm → plan switches, completions reset
# Manual: Settings → Reset progress → confirm → completions cleared
# Manual: Cancel on plan change → dropdown reverts
```

**Done:** Plan dropdown; Reset button; both with confirmation; dropdown reverts on Cancel.

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| User can reset progress from settings | Settings → Reset progress → confirm → completions cleared (DB + offline) |
| Multiple plans; structure {id, name, description, days} | default-plan.json migrated; getAvailablePlans returns PlanWithMeta |
| Active plan stored per user in DB | PUT active-plan; refresh; GET returns same plan_id |
| Plan selector + warning | Dropdown in Settings; change → confirm modal; Cancel reverts dropdown |

---

## Success Criteria

1. **User can reset progress from the settings page** — ✓ Reset button; confirmation; clears DB + offline queue.
2. **Multiple plans exist in src/data; plan structure is {id, name, description, days}** — ✓ default-plan.json migrated; planService getAvailablePlans.
3. **Active training plan is stored per user in the DB** — ✓ user_active_plan table; GET/PUT API.
4. **Settings page has a dropdown to select plan; changing plan shows warning that progress will be reset** — ✓ Dropdown; confirmation modal; Confirm = switch + reset.

---

## Output

After completion:
- `src/data/default-plan.json` — `{ id, name, description, days }`
- `src/types/plan.ts` — PlanWithMeta
- `src/services/planService.ts` — getAvailablePlans, loadPlanById, loadPlan(planId?)
- `src/services/offlineQueue.ts` — clearByPlanId
- `src/services/progressService.ts` — fetchActivePlan, setActivePlan, resetProgress
- `server/schema.sql` — user_active_plan
- `server/routes/user.js` — GET/PUT active-plan
- `server/routes/progress.js` — DELETE by plan_id
- `src/contexts/TrainingContext.tsx` — activePlanId, availablePlans, resetProgress, setActivePlan
- `src/components/SettingsView.tsx` — plan dropdown, reset button, confirmations

---

## Dependency Graph

```
Plan 01:
  Task 1 (plan structure, types)
      │
      ├──> Task 2 (planService multi-plan)
      │
      └──> Task 3 (backend active-plan + reset)

Plan 02 (depends_on Plan 01):
  Task 4 (offlineQueue clearByPlanId, progressService reset)
      │
      └──> Task 5 (TrainingContext wiring)
                │
                └──> Task 6 (Settings UI)
```

**Plan 01:** Tasks 1–3 (foundation)
**Plan 02:** Tasks 4–6 (services, context, UI)

---

## How to Test

1. **Reset progress**
   - Complete a session; go to Settings; click Reset progress; confirm.
   - Completions cleared; dashboard shows no completed days.
   - Offline: complete session offline; go to Settings; reset; go online — queued completion should not sync (cleared).

2. **Plan structure**
   - default-plan.json has `{ id, name, description, days }`.
   - getAvailablePlans returns at least one plan with correct shape.

3. **Active plan**
   - Login; change plan in Settings (if multiple plans); refresh — same plan selected.
   - Different user can have different active plan.

4. **Plan change warning**
   - Select different plan in dropdown; modal appears.
   - Confirm: plan switches; completions for new plan cleared.
   - Cancel: dropdown reverts to current plan; no change.
