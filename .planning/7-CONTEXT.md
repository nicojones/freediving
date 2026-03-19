# Phase 7: Day IDs + Routing — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 7. Day IDs + Routing

---

## Decisions

### Day Identity (ID)

- **Format:** 8 hex characters (first block of UUID v4). Example: `a1b2c3d4`.
- **Generation:** Use `uuidgen` when authoring plan JSON; `crypto.randomUUID()` in code if generating at runtime.
- **URL-safe:** Lowercase in URLs (e.g. `/day/a1b2c3d4`).
- **Use cases:** Last trained day, due today, deep linking, refresh persistence.

### Plan Day Schema (day + group)

- **`day`:** Ordinal number within the plan (1, 2, 3, …). Used for display ("Day 1") and ordering. Replaces implicit index+1.
- **`group`:** Optional string for grouping days. Examples: `"warm-up"` (first week), `"deep pool"` (second week), `"endurance"` (third week). Used for UI grouping and labels.
- **`id`:** Required. Stable identifier (UUID first block) for each day.
- **Ordering:** Array order + explicit `day` property. Index remains for internal iteration; `day` is the canonical display ordinal. `getCurrentDay` and "next day" logic use array order (index), not `day` value.

### Example Groups (default-plan.json)

- **warm-up:** Days 1–4 (indices 0–3) — foundation, first week
- **deep pool:** Days 5–8 (indices 4–7) — progression, second week
- **endurance:** Days 9–12 (indices 8–11) — peak, third week

### URL Routing

- **Day view:** `/day/:dayId` — when viewing a day's session preview, URL contains the day ID.
- **Refresh:** Navigating to `/day/a1b2c3d4` and refreshing returns to the same day.
- **Deep link:** Shareable link to a specific day.
- **Fallback:** Invalid or missing `dayId` → redirect to `/` (dashboard) with current day selected.

### Backend / Completions

- **Primary key:** Completions use `day_id` (string) instead of `day_index` (number). Stable across plan edits.
- **Migration:** Backend API accepts `day_id` in POST body; returns `day_id` in completions. Offline queue stores `day_id`.
- **Backward compatibility:** Phase 7 is additive. If existing completions use `day_index`, migration strategy: on first load with new schema, map old completions to `day_id` via plan (index → id lookup), or run one-time migration. Decision: new deployments start fresh with `day_id`; existing data migration is out of scope for Phase 7 (document for admin).

---

## Out of Scope for Phase 7

- Multi-plan support — single plan only
- Migration of existing `day_index` completions to `day_id` — document for admin; new installs use `day_id` only
- Group-based filtering or navigation — groups are metadata for display; no filtering by group in v1

---

## Traceability

| Decision | Outcome |
|----------|---------|
| Day ID format | 8 hex chars (UUID first block), lowercase in URLs |
| Plan schema | `id`, `day` (ordinal), `group` (optional) on each day |
| Example groups | warm-up, deep pool, endurance |
| URL | `/day/:dayId` for day view; refresh preserves view |
| Completions | `day_id` instead of `day_index` |

---

## Code Context

- **Plan:** `src/data/default-plan.json` — array of days; currently no `id`, `day`, or `group`.
- **Types:** `src/types/plan.ts` — `PlanDay`, `TrainingDay`, `RestDay`; add `id`, `day`, `group?`.
- **planService:** `src/services/planService.ts` — `getPhasesForDay(plan, dayIndex)`, `getCurrentDay`, `getDaySummary`. Add `getDayById(plan, dayId)`, `getDayIndexById(plan, dayId)`.
- **progressService:** `src/services/progressService.ts` — `recordCompletion(planId, dayIndex)`, `Completion.day_index`. Change to `day_id`.
- **offlineQueue:** `src/services/offlineQueue.ts` — stores `day_index`; change to `day_id`.
- **Routing:** `src/App.tsx` — `Route path="/"`, `/session`, `/settings`. Add `Route path="/day/:dayId"`.
- **Dashboard:** `src/pages/Dashboard.tsx` — `selectedDayIndex`; sync with URL via `useParams` / `useNavigate`.
- **Backend:** `/api/progress` — POST body `{ plan_id, day_index }`; change to `{ plan_id, day_id }`.

---

*Context captured from /gsd-discuss-phase 7*
