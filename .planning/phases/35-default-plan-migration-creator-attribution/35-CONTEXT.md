# Phase 35: Default Plan Migration + Creator Attribution — Context

**Created:** 2025-03-21  
**Purpose:** Implementation decisions for removing default-plan.json, DB migration, and creator attribution display.  
**Phase:** 35. Default Plan Migration + Creator Attribution

---

## Decisions (from user)

### 1. Remove default-plan.json; Seed via Migration

**Current:** `src/data/default-plan.json` is bundled; `planService.ts` imports it; `lib/plan.ts` falls back to it when plan not in DB.

**Desired:** Remove the file completely. Default plan is seeded into the DB via a migration. All plans come from DB (or API when logged in).

---

### 2. Plans Table: Public Flag + Owner

**Current:** `plans` table has `id`, `name`, `description`, `days_json`, `created_at`, `created_by`.

**Desired:**

- Add `public` flag (BOOLEAN)
- Add `published_on` (DATE) — when the plan was published
- `owner` = `created_by` (user id); null means "for everyone"
- Default plan: `owner = null`, `public = true`, `published_on` set — associated with nobody, "for everyone"

---

### 3. Creator Attribution — PUBLIC Plans

**Rules:**

- **No owner (null):** Display "Created by ${APP_NAME}"
- **Has owner:** Display "Created by {owner name}" — **never show email**
- **Server must NOT return email** — creator attribution must use name only; email must never be exposed to the client

---

### 4. Creator Attribution — PRIVATE Plans

**Rule:** Do not say "created by you" or similar. No creator text for private plans.

---

### 5. Plan Creator Display

**Where:** Plans tab (PlanSelectorSection) and Training tab (DayListSection, SessionPreviewSection).

**Style:** The creator attribution ("Created by Fishly" / "Created by {name}") is small and greyed out — not the plan name.

---

## Gray Areas — Resolved

| Area                        | Decision                                                       |
| --------------------------- | -------------------------------------------------------------- |
| Default plan source         | DB only; migration seeds it                                    |
| Owner null                  | "For everyone"; "Created by Fishly"                            |
| Creator name                | Use `name` from users table; never email                       |
| API response                | Never include email in plan/creator payloads                   |
| Private plans               | No creator text                                                |
| Creator attribution styling | Small, greyed out in Plans + Training tabs (not the plan name) |

---

## Implementation Implications

### Migration

- New migration (e.g. `003_default_plan_and_public.sql`):
  - Add `public BOOLEAN DEFAULT false` and `published_on DATE NULL` to plans
  - Seed default plan: id=`default`, name=`4:00 Dry Breathhold`, description, days_json (from current default-plan.json), `created_at`, `created_by=null`, `public=true`, `published_on=CURDATE()`
- Remove `src/data/default-plan.json` after migration is in place

### Backend

- `lib/plan.ts`: Remove fallback to default-plan.json; load only from DB
- `app/api/plans/route.ts`: Return `public`, `published_on`, `created_by`; for creator name, JOIN users and return `creator_name` (never `email`)
- Ensure no API ever returns user email for plan attribution

### Frontend

- `planService.ts`: Remove `defaultPlanData` import and `planModules`; plans come from API only (or context)
- `PlanSelectorSection`: Add creator attribution for public plans; style creator text small + greyed out
- `DayListSection`: Add creator attribution; style creator text small + greyed out
- `SessionPreviewSection`: Add creator attribution if shown; style creator text small + greyed out

### Constants

- `BUNDLED_PLAN_IDS`: May need adjustment — default plan is now in DB, not "bundled". Consider renaming or repurposing (e.g. reserved IDs that can't be user-created/deleted).

---

## Code Context

### Current

| File                          | Current                                              |
| ----------------------------- | ---------------------------------------------------- |
| `src/data/default-plan.json`  | Bundled plan; to be removed                          |
| `src/services/planService.ts` | Imports defaultPlanData; planModules                 |
| `lib/plan.ts`                 | loadPlan reads DB or falls back to default-plan.json |
| `app/api/plans/route.ts`      | Returns id, name, description, days, created_by      |
| `PlanSelectorSection.tsx`     | Shows plan name (normal), description, progress      |
| `DayListSection.tsx`          | Plan name as h1, 2.5rem                              |
| `BUNDLED_PLAN_IDS`            | `['default']` — used for delete guard                |

### Users Table

- Phase 33/34: users have `email`, `name` (optional). Use `name` for creator attribution; never expose `email`.

---

## Out of Scope for Phase 35

- Toggle for user-created plans to be public/private (assume user-created = private for now)
- "Explore plans without switching"
- Changing default plan content (keep same structure as current default-plan.json)

---

## Traceability

| Decision            | Outcome                                               |
| ------------------- | ----------------------------------------------------- |
| Default plan source | DB migration; remove default-plan.json                |
| Plans table         | Add `public`, `published_on`; `created_by` = owner    |
| PUBLIC + no owner   | "Created by Fishly"                                   |
| PUBLIC + owner      | "Created by {name}" — never email                     |
| PRIVATE             | No creator text                                       |
| Creator attribution | Small, greyed out in Plans + Training (not plan name) |

---

_Context captured from /gsd-discuss-phase 35 — 2025-03-21_
