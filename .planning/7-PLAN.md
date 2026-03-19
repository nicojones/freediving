# Phase 7: Day IDs + Routing — Executable Plan

---
phase: 07-day-ids-routing
plans:
  - id: "01"
    tasks: 5
    files: 12
    depends_on: [06-pwa-offline]
type: execute
wave: 1
files_modified:
  - src/types/plan.ts
  - src/data/default-plan.json
  - src/services/planService.ts
  - server/schema.sql
  - server/routes/progress.js
  - src/services/progressService.ts
  - src/services/offlineQueue.ts
  - src/utils/completions.ts
  - src/contexts/TrainingContext.tsx
  - src/App.tsx
  - src/pages/Dashboard.tsx
autonomous: false
requirements: []
user_setup: []
must_haves:
  truths:
    - "Every day in the plan has a stable id (8 hex chars, UUID first block)"
    - "Each day has day (ordinal) and optional group for display"
    - "Completions use day_id instead of day_index"
    - "Viewing a day puts its id in the URL (/day/:dayId); refresh preserves view"
  artifacts:
    - path: src/data/default-plan.json
      provides: "Plan with id, day, group on each day"
      contains: '"id"|"day"|"group"'
    - path: src/types/plan.ts
      provides: "PlanDay with id, day, group?"
      contains: "id|day|group"
    - path: src/services/planService.ts
      provides: "getDayById, getDayIndexById"
      contains: "getDayById|getDayIndexById"
    - path: src/App.tsx
      provides: "Route /day/:dayId"
      contains: "/day/|dayId"
  key_links:
    - from: src/pages/Dashboard.tsx
      to: src/App.tsx
      via: "URL params for dayId"
      pattern: "useParams|navigate.*day"
    - from: src/services/progressService.ts
      to: server/routes/progress.js
      via: "POST /api/progress with day_id"
      pattern: "day_id"
---

## Objective

Add stable day IDs to the plan schema, use them for completions and routing, and enable URL-based day view so refresh and deep links work. Each day gets `id`, `day` (ordinal), and optional `group`; completions and backend use `day_id`.

**Purpose:** Stable identity for days; shareable/deep-linkable URLs; refresh preserves view.

**Output:** Plan schema with id/day/group; backend + frontend use day_id; route `/day/:dayId`; Dashboard syncs selection with URL.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/7-CONTEXT.md

**Existing:** Phases 1–6 complete. Plan is array of days; completions use `day_index`; no day in URL. Backend: `progress_completions` has `day_index INTEGER`.

**Design decisions (from 7-CONTEXT):**
- Day ID: 8 hex chars (UUID first block), lowercase in URLs
- Plan schema: `id`, `day` (ordinal 1..n), `group?` (e.g. warm-up, deep pool, endurance)
- Completions: `day_id` instead of `day_index`
- URL: `/day/:dayId`; invalid/missing → redirect to `/`
- Migration: New installs use `day_id`; existing data migration out of scope (document for admin)

---

## Plan 01: Day IDs + Routing

### Task 1: Plan Schema, Types, and default-plan.json

**Files:** `src/types/plan.ts`, `src/data/default-plan.json`

**Action:**
1. Update `src/types/plan.ts`:
   - Add to `TrainingDay`: `id: string`, `day: number`, `group?: string`
   - Add to `RestDay`: `id: string`, `day: number`, `group?: string`
   - Ensure `PlanDay` union includes these (TrainingDay | RestDay | null)
2. Update `src/data/default-plan.json`:
   - Add `id`, `day`, `group` to each day. Generate IDs with `uuidgen` (macOS) or `crypto.randomUUID().slice(0, 8)` (lowercase).
   - Example groups:
     - **warm-up:** days 1–4 (indices 0–3)
     - **deep pool:** days 5–8 (indices 4–7)
     - **endurance:** days 9–12 (indices 8–11)
   - Example structure for first day:
     ```json
     {
       "id": "a1b2c3d4",
       "day": 1,
       "group": "warm-up",
       "phases": [...],
       "type": "dry"
     }
     ```
   - Rest day example:
     ```json
     {
       "id": "b2c3d4e5",
       "day": 4,
       "group": "warm-up",
       "rest": true
     }
     ```

**Verify:**
```bash
# Generate IDs: uuidgen | tr '[:upper:]' '[:lower:]' | cut -d'-' -f1
# Or in Node: crypto.randomUUID().slice(0, 8).toLowerCase()
# JSON parses; types compile
```

**Done:** Plan types include id, day, group; default-plan.json has all three on every day with example groups.

---

### Task 2: Backend Migration (day_id)

**Files:** `server/schema.sql`, `server/routes/progress.js`

**Action:**
1. Create migration or new schema:
   - Option A: New table `progress_completions_v2` with `day_id TEXT`; migrate later.
   - Option B: Alter table (SQLite limited). Simpler: drop and recreate for Phase 7 (fresh install).
   - **Decision:** For Phase 7, document that existing DB must be reset or migrated. Provide new schema:
     ```sql
     -- progress_completions: day_id replaces day_index
     CREATE TABLE IF NOT EXISTS progress_completions (
       user_id INTEGER NOT NULL,
       plan_id TEXT NOT NULL,
       day_id TEXT NOT NULL,
       completed_at INTEGER NOT NULL,
       PRIMARY KEY (user_id, plan_id, day_id),
       FOREIGN KEY (user_id) REFERENCES users(id)
     );
     ```
   - Add `.planning/7-MIGRATION.md` with instructions: "To migrate from day_index: run script to map day_index → day_id via plan; or reset DB for fresh install."
2. Update `server/routes/progress.js`:
   - POST: accept `day_id` instead of `day_index`; validate `plan_id` and `day_id` present
   - GET: return `day_id` in completions
   - Use `day_id` in INSERT and SELECT

**Verify:**
```bash
curl -b cookies.txt -X POST http://localhost:3001/api/progress \
  -H "Content-Type: application/json" \
  -d '{"plan_id":"default","day_id":"a1b2c3d4"}'
curl -b cookies.txt "http://localhost:3001/api/progress?plan_id=default"
# Response includes day_id
```

**Done:** Backend uses day_id; schema updated; migration doc added.

---

### Task 3: planService — Lookups by ID

**Files:** `src/services/planService.ts`

**Action:**
1. Add `getDayById(plan: Plan, dayId: string): PlanDay | null` — find day where `day.id === dayId` (case-insensitive match for URLs).
2. Add `getDayIndexById(plan: Plan, dayId: string): number | null` — return index of day with given id, or null.
3. Update `getCurrentDay` to work with completions that have `day_id` — use `getDayIndexById` to resolve last completed day from `day_id`, then compute next index. Or: keep `getCurrentDay(plan, completions)` but change `CompletionForPlan` to `{ day_id: string; completed_at: number }`; sort by completed_at; find last completed's index via `getDayIndexById`; then next index logic unchanged.
4. Update `CompletionForPlan` type to `{ day_id: string; completed_at: number }` (or support both during transition; Phase 7 uses day_id only).

**Verify:**
```typescript
// getDayById(plan, 'a1b2c3d4') → day object or null
// getDayIndexById(plan, 'a1b2c3d4') → 0 or correct index
// getCurrentDay with completions [{ day_id: 'x', completed_at: 1 }] → next index
```

**Done:** planService exports getDayById, getDayIndexById; getCurrentDay works with day_id completions.

---

### Task 4: progressService, offlineQueue, completions Utils

**Files:** `src/services/progressService.ts`, `src/services/offlineQueue.ts`, `src/utils/completions.ts`, `src/contexts/TrainingContext.tsx`

**Action:**
1. `progressService.ts`:
   - `Completion`: change `day_index` to `day_id: string`
   - `recordCompletion(planId: string, dayId: string)` — POST body `{ plan_id, day_id }`
2. `offlineQueue.ts`:
   - Schema: `day_id` instead of `day_index`
   - `queueCompletion(planId: string, dayId: string)`
   - `flushQueue`: POST with `{ plan_id, day_id }`
3. `completions.ts`:
   - `CompletionForDay`: change to `{ day_id: string }` or keep `day_index` for internal use? Per 7-CONTEXT, completions use day_id. So `CompletionForDay` becomes `{ day_id: string }`.
   - `isDayCompleted(completions, dayId: string)`: check `completions.some(c => c.day_id === dayId)`
4. `TrainingContext.tsx`:
   - `recordCompletion('default', dayId)` — pass dayId (from plan day) instead of dayIndex
   - Optimistic completion: `{ plan_id: 'default', day_id: dayId, completed_at: ... }`
   - All callers: obtain dayId from selected day (plan[selectedDayIndex].id)

**Verify:**
- recordCompletion called with dayId; POST has day_id
- isDayCompleted(completions, dayId) works
- Offline queue stores and flushes day_id

**Done:** progressService, offlineQueue, completions use day_id; TrainingContext passes dayId.

---

### Task 5: Routing and Dashboard URL Sync

**Files:** `src/App.tsx`, `src/pages/Dashboard.tsx`

**Action:**
1. `App.tsx`:
   - Add `Route path="/day/:dayId" element={<Dashboard />}` — Dashboard handles both `/` and `/day/:dayId`. Or: Dashboard is the only component that needs dayId; both routes render it.
   - Ensure `/` and `/day/:dayId` both render Dashboard (or a wrapper). Dashboard reads `dayId` from URL when present.
2. `Dashboard.tsx`:
   - Use `useParams()` to get `dayId` from `/day/:dayId`
   - Use `useNavigate()` for navigation
   - When `dayId` is present: resolve to day index via `getDayIndexById(plan, dayId)`; set `selectedDayIndex` to that index; **set `viewMode` to `'session-preview'`** so refresh at `/day/:dayId` shows the day view (not the list). If invalid (null), redirect to `/` with `navigate('/', { replace: true })`
   - When user selects a day: `navigate(\`/day/${day.id}\`)` instead of only setting state. This updates the URL.
   - When navigating back to list (no day selected): `navigate('/')`
   - On load: if no dayId in URL, use current day as before (getCurrentDay). If dayId in URL, use that day.
   - Ensure "Start Session" and session flow use the selected day's id for recordCompletion.

**Verify:**
```bash
npm run dev
# 1. Open /. Select day 1. URL becomes /day/a1b2c3d4. Refresh → same day.
# 2. Open /day/invalid. Redirect to /.
# 3. Complete session. recordCompletion gets day_id. Completions show day_id.
```

**Done:** URL reflects selected day; refresh preserves view; invalid dayId redirects to /.

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| Day IDs in plan | default-plan.json has id, day, group on every day |
| Groups | warm-up, deep pool, endurance present |
| Completions use day_id | POST/GET /api/progress use day_id; completions show day_id |
| URL routing | /day/:dayId shows day; refresh keeps it |
| Invalid dayId | Redirect to / |

---

## Success Criteria

1. **Every day has stable id** — ✓ id (8 hex) on each day in plan
2. **Day and group for display** — ✓ day (ordinal), group (optional) on each day
3. **Completions use day_id** — ✓ Backend, progressService, offlineQueue use day_id
4. **URL reflects day** — ✓ /day/:dayId; refresh preserves view

---

## Output

After completion:
- `src/types/plan.ts` — id, day, group on PlanDay
- `src/data/default-plan.json` — id, day, group, example groups
- `src/services/planService.ts` — getDayById, getDayIndexById; getCurrentDay with day_id
- `server/schema.sql`, `server/routes/progress.js` — day_id
- `src/services/progressService.ts`, `offlineQueue.ts`, `completions.ts` — day_id
- `src/App.tsx` — Route /day/:dayId
- `src/pages/Dashboard.tsx` — URL sync, navigate on select
- `.planning/7-MIGRATION.md` — migration notes for existing data

---

## Dependency Graph

```
Task 1 (plan schema, types, default-plan)
    │
    ├──> Task 2 (backend day_id) — parallel
    │
    └──> Task 3 (planService lookups)
              │
              └──> Task 4 (progressService, offlineQueue, completions)
                        │
                        └──> Task 5 (routing, Dashboard URL sync)
```

**Wave 1:** Task 1, Task 2 (parallel)
**Wave 2:** Task 3 (after Task 1)
**Wave 3:** Task 4 (after Task 3)
**Wave 4:** Task 5 (after Task 4)
