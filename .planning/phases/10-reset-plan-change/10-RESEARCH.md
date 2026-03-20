# Phase 10: Reset + Plan Change — Research

**Researched:** 2025-03-19  
**Domain:** Multi-plan architecture, progress reset, confirmation UX, offline sync  
**Confidence:** HIGH

## Summary

Phase 10 adds: (1) Reset progress from settings with confirmation; (2) Multiple training plans in `src/data` with structure `{id, name, description, days}`; (3) Active plan stored per user in DB; (4) Plan selector dropdown in Settings; (5) Plan-change warning modal before switching (progress reset on confirm). All decisions are locked in CONTEXT.md. Use `import.meta.glob` for plan loading; extend backend with `user_active_plan` table and reset API; add `clearByPlanId` to offlineQueue; use `window.confirm` or minimal custom modal for confirmations.

**Primary recommendation:** Implement in order: plan structure migration → planService multi-plan → backend active-plan + reset → offlineQueue clearByPlanId → TrainingContext wiring → Settings UI (dropdown + reset button + confirmations).

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Reset Progress:** Settings page. Button "Reset progress". Scope: active plan only — clears completions in DB and offline queue. Confirmation dialog before reset.

2. **Plan Structure:** New shape `{ id: string, name: string, description?: string, days: PlanDay[] }`. Each plan JSON in `src/data` follows this. `default-plan.json` becomes one plan. Plan ID used in completions and active-plan storage; must be stable (e.g. `"default"`, `"co2-tolerance-iii"`).

3. **Multiple Plans + Active Plan in DB:** Multiple plan JSON files in `src/data`. Plans bundled at build time. Active plan stored per user: `user_id` → `plan_id` (new table `user_active_plan` or `user_preferences`). Default: first available plan if none stored. API: `GET/PUT /api/user/active-plan`.

4. **Plan Selector in Settings:** Dropdown listing available plans (name from `plan.name`). User selects different plan → warning modal → if confirm: switch plan, clear completions for new plan, reload.

5. **Plan-Change Warning:** Trigger when user selects different plan. Message: "Changing plan will reset your progress. Continue?" Confirm = switch + reset; Cancel = revert dropdown to current plan.

### Claude's Discretion

- Modal implementation: `window.confirm` vs custom modal (recommend custom for consistency)
- Exact wording of confirmation messages

### Deferred Ideas (OUT OF SCOPE)

- In-app plan editor
- Plan versioning or migration of old completions
- Plan discovery from API (plans remain in `src/data`)

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID         | Description                                                         | Research Support                                                       |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| RESET-01   | User can reset progress from settings                               | Reset button; confirmation; backend DELETE; offlineQueue clearByPlanId |
| PLAN-10-01 | Multiple plans in src/data; structure {id, name, description, days} | Migrate default-plan.json; import.meta.glob for loading                |
| PLAN-10-02 | Active plan stored per user in DB                                   | user_active_plan table; GET/PUT /api/user/active-plan                  |
| PLAN-10-03 | Plan selector dropdown in Settings                                  | Dropdown from availablePlans; onChange → confirmation flow             |
| PLAN-10-04 | Plan-change warning before switching                                | Confirmation modal; Confirm = switch + reset; Cancel = revert          |

</phase_requirements>

---

## Standard Stack

### Core

| Library        | Version | Purpose                     | Why Standard                |
| -------------- | ------- | --------------------------- | --------------------------- |
| React          | 19.x    | UI                          | Existing                    |
| idb            | ^8.0    | IndexedDB for offline queue | Existing; add clearByPlanId |
| Express        | ^4.21   | Backend API                 | Existing                    |
| better-sqlite3 | ^11.6   | SQLite                      | Existing                    |

### Supporting

| Library               | Version | Purpose                                | When to Use                   |
| --------------------- | ------- | -------------------------------------- | ----------------------------- |
| Vite import.meta.glob | Vite 8  | Load multiple plan JSONs at build time | planService getAvailablePlans |

**No new packages required.** Use existing stack.

**Version verification:** idb 8.0.3, React 19.2.4 (npm registry, 2025-03).

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── data/
│   ├── default-plan.json      # Migrated to { id, name, description, days }
│   └── plan-*.json            # Optional additional plans
├── services/
│   ├── planService.ts         # loadPlan, getAvailablePlans, loadPlanById
│   ├── progressService.ts     # add resetProgress, fetchActivePlan, setActivePlan
│   └── offlineQueue.ts        # add clearByPlanId
├── components/
│   ├── SettingsView.tsx       # Plan dropdown, Reset button, ConfirmModal
│   └── ConfirmModal.tsx       # Reusable confirmation (optional)
└── contexts/
    └── TrainingContext.tsx    # activePlanId, availablePlans, resetProgress, setActivePlan
```

### Pattern 1: Multi-Plan Loading

**What:** Load all plan JSON files at build time via `import.meta.glob`.  
**When:** planService initialization; no runtime fetch.  
**Example:**

```typescript
// Source: Vite docs, 10-CONTEXT.md
const planModules = import.meta.glob<{ default: PlanWithMeta }>('../data/*-plan.json', {
  eager: true,
  import: 'default',
});

export function getAvailablePlans(): PlanWithMeta[] {
  return Object.values(planModules).filter(Boolean) as PlanWithMeta[];
}

export function loadPlanById(planId: string): PlanWithMeta | { error: string } {
  const plans = getAvailablePlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return { error: `Plan not found: ${planId}` };
  return plan;
}
```

**Convention:** Plan files named `*-plan.json` (e.g. `default-plan.json`, `co2-tolerance-iii-plan.json`).

### Pattern 2: Active Plan API

**What:** Backend stores `user_id` → `plan_id`. Default to first plan if missing.  
**When:** On app load; on plan change.  
**Example:**

```typescript
// GET /api/user/active-plan → { plan_id: string }
// PUT /api/user/active-plan { plan_id: string } → { ok: true }
```

### Pattern 3: Reset Progress

**What:** Delete completions for user+plan_id in DB; clear queued completions for that plan in IndexedDB.  
**When:** User confirms reset; or after plan change (new plan).  
**Example:**

```typescript
// Backend: DELETE /api/progress?plan_id=default
// SQL: DELETE FROM progress_completions WHERE user_id = ? AND plan_id = ?
```

### Pattern 4: Offline Queue Clear by Plan

**What:** No index on plan_id in idb; use getAll + filter + delete by id.  
**When:** Before or after reset; ensures queued completions for the plan are not synced later.  
**Example:**

```typescript
// Source: idb API, MDN IDBObjectStore
export async function clearByPlanId(planId: string): Promise<number> {
  const db = await getDB();
  const items = (await db.getAll(STORE_NAME)) as PendingCompletion[];
  const toDelete = items.filter((i) => i.plan_id === planId);
  for (const item of toDelete) {
    if (item.id != null) await db.delete(STORE_NAME, item.id);
  }
  return toDelete.length;
}
```

### Pattern 5: Confirmation Modal

**What:** Simple confirmation before destructive actions.  
**When:** Reset progress; plan change.  
**Options:**

- `window.confirm` — zero code, works immediately; blocks UI; not customizable.
- Custom modal — matches app style; requires `ConfirmModal` component.

**Recommendation:** Use `window.confirm` for MVP; add custom `ConfirmModal` if UX polish is desired.

### Anti-Patterns to Avoid

- **Loading plan by ID at runtime from fetch:** Plans are bundled; use `import.meta.glob` at build time.
- **Forgetting offline queue on reset:** Reset must call `clearByPlanId` in addition to backend DELETE.
- **Reverting dropdown without Cancel:** User must be able to cancel; dropdown must revert to `activePlanId` on Cancel.

---

## Don't Hand-Roll

| Problem                     | Don't Build        | Use Instead                              | Why                                               |
| --------------------------- | ------------------ | ---------------------------------------- | ------------------------------------------------- |
| IndexedDB delete by plan_id | Raw cursor loop    | getAll + filter + delete by id           | idb already used; no index needed for small queue |
| Confirmation dialogs        | Full modal library | window.confirm or minimal ~30-line modal | No Radix/Headless UI in project; keep simple      |
| Plan loading from API       | fetch from server  | import.meta.glob                         | Plans are static; CONTEXT says plans in src/data  |

**Key insight:** Plans are bundled at build time. Backend does not serve plan files; it only stores active plan and progress.

---

## Common Pitfalls

### Pitfall 1: Backend loadPlan still uses single file

**What goes wrong:** `server/routes/progress.js` has `loadPlan()` that reads `default-plan.json` for day_index → day_id. With multiple plans, backend may need plan_id to resolve.  
**Why it happens:** Progress POST uses day_id; backend may not need plan for day resolution if day_id is always sent.  
**How to avoid:** Check progress route: it uses day_id when present. Only day_index fallback needs plan; keep plan loading for that edge case; add plan_id to loadPlan(planId) when needed.  
**Warning signs:** 400 "day_id required" when plan_id is new plan and day_index is used.

### Pitfall 2: Active plan race on load

**What goes wrong:** TrainingContext fetches completions before active plan is known; uses wrong plan_id.  
**Why it happens:** useEffect order: user → load plan → load completions. If active plan comes from API, it's async.  
**How to avoid:** Fetch active plan first (or in parallel with plan list); use active plan for completions. Default to first plan if API returns 404/empty.  
**Warning signs:** Completions empty or wrong plan's completions shown.

### Pitfall 3: Plan change without clearing offline queue

**What goes wrong:** User switches plan; offline queue has completions for old plan; when online, queue flushes and writes old plan's completions to new plan.  
**Why it happens:** flushQueue sends all pending items; backend accepts by plan_id. Actually: each item has plan_id; flushing writes old plan completions to DB. They're not "wrong" — they're for the old plan. But CONTEXT says "clear completions for the new plan" on switch. So we need to clear offline queue for the NEW plan (user is starting fresh on new plan). If user had queued completions for OLD plan, those stay in queue until they switch back? No — CONTEXT: "clear completions for the new plan (or both old and new as needed)". Clear new plan's completions. For offline queue: we should clear queued items for the plan we're switching TO, since we're resetting that plan. If there are queued items for the OLD plan, those would sync when we flush — they'd go to old plan in DB. That's fine. So: on plan change, we reset (clear) completions for the NEW plan in DB + offline queue. Clear offline queue items where plan_id === newPlanId.  
**How to avoid:** Call `clearByPlanId(newPlanId)` when switching plan.  
**Warning signs:** After switching, old queued completions appear for wrong plan.

### Pitfall 4: Dropdown not reverting on Cancel

**What goes wrong:** User selects new plan, modal opens, user clicks Cancel — dropdown still shows new plan.  
**Why it happens:** Controlled component not updated on Cancel.  
**How to avoid:** Store "pending" selection; only commit to activePlanId on Confirm. On Cancel, dropdown value stays activePlanId.  
**Warning signs:** Dropdown shows wrong plan after Cancel.

---

## Code Examples

### Plan Structure Migration

```json
// src/data/default-plan.json (before)
[ { "id": "dfc8fb52", "day": 1, ... }, ... ]

// src/data/default-plan.json (after)
{
  "id": "default",
  "name": "CO2 Tolerance III",
  "description": "12-day breathhold training program",
  "days": [ { "id": "dfc8fb52", "day": 1, ... }, ... ]
}
```

### Backend user_active_plan Table

```sql
-- Add to server/schema.sql
CREATE TABLE IF NOT EXISTS user_active_plan (
  user_id INTEGER PRIMARY KEY,
  plan_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Backend Progress Reset

```javascript
// DELETE /api/progress?plan_id=default
progressRouter.delete('/', async (req, res) => {
  const planId = req.query.plan_id;
  if (!planId) return res.status(400).json({ error: 'plan_id required' });
  const userId = req.user.id;
  db.prepare('DELETE FROM progress_completions WHERE user_id = ? AND plan_id = ?').run(
    userId,
    planId
  );
  res.json({ ok: true });
});
```

### PlanService getAvailablePlans

```typescript
const planModules = import.meta.glob<{ default: PlanWithMeta }>('../data/*-plan.json', {
  eager: true,
  import: 'default',
});

export function getAvailablePlans(): PlanWithMeta[] {
  return Object.values(planModules).filter(Boolean) as PlanWithMeta[];
}
```

---

## State of the Art

| Old Approach                | Current Approach           | When Changed | Impact                         |
| --------------------------- | -------------------------- | ------------ | ------------------------------ |
| Single plan file            | Plan manifest + glob       | Phase 10     | Multiple plans in src/data     |
| Plan ID in completions only | plan_id + user_active_plan | Phase 7 → 10 | Active plan persisted per user |

**Deprecated/outdated:**

- None for this phase.

---

## Open Questions

1. **Plan-change: clear old plan completions?**
   - What we know: CONTEXT says "clear completions for the new plan (or both old and new as needed)".
   - What's unclear: Whether to preserve old plan's completions for history.
   - Recommendation: Clear new plan only. Old plan's completions stay in DB (user can switch back and see history).

2. **Backend plan resolution for day_index fallback**
   - What we know: Progress POST can send day_index when day_id missing; backend loads plan to resolve. Frontend sends day_id in normal flow.
   - What's unclear: Whether backend needs multi-plan support for day_index fallback.
   - Recommendation: Frontend always sends day_id (Phase 7). If backend keeps day_index fallback for legacy, update `loadPlan(planId)` to read `src/data/${planId}-plan.json` (convention: planId "default" → default-plan.json).

---

## Validation Architecture

### Test Framework

| Property           | Value          |
| ------------------ | -------------- |
| Framework          | None installed |
| Config file        | N/A            |
| Quick run command  | N/A            |
| Full suite command | N/A            |

### Phase Requirements → Test Map

| Req ID     | Behavior                          | Test Type | Automated Command | File Exists? |
| ---------- | --------------------------------- | --------- | ----------------- | ------------ |
| RESET-01   | Reset clears DB + queue           | manual    | N/A               | —            |
| PLAN-10-01 | Plans load with correct structure | manual    | N/A               | —            |
| PLAN-10-02 | Active plan stored/retrieved      | manual    | N/A               | —            |
| PLAN-10-03 | Dropdown shows plans              | manual    | N/A               | —            |
| PLAN-10-04 | Plan change shows warning         | manual    | N/A               | —            |

### Sampling Rate

- **Per task commit:** N/A (no tests)
- **Per wave merge:** N/A
- **Phase gate:** Manual verification: reset flow, plan change flow, offline queue clear

### Wave 0 Gaps

- [ ] No test framework installed (Vitest recommended in Phase 8 research)
- [ ] Manual verification: reset flow, plan change with confirmation, offline queue clear after reset

---

## Sources

### Primary (HIGH confidence)

- 10-CONTEXT.md — decisions, code context
- Vite docs — import.meta.glob syntax
- idb GitHub — existing usage in offlineQueue.ts
- server/schema.sql, progress.js — current backend

### Secondary (MEDIUM confidence)

- WebSearch: Vite import.meta.glob eager JSON
- WebSearch: React confirmation modal
- WebSearch: IndexedDB delete by index

### Tertiary (LOW confidence)

- None

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new packages; existing stack sufficient
- Architecture: HIGH — patterns from CONTEXT and codebase
- Pitfalls: HIGH — from codebase analysis and CONTEXT

**Research date:** 2025-03-19  
**Valid until:** 30 days (stable domain)
