# Phase 35: Default Plan Migration + Creator Attribution — Plan

**Status:** Complete  
**Depends on:** Phase 33 (Sign Up), Phase 34 (Login & Profile UX)

---

## Goal

Remove `default-plan.json`; seed default plan via DB migration; add `public` flag and creator attribution for public plans. All plans come from DB. Creator text: "Created by Fishly" (no owner) or "Created by {name}" (never email); private plans show no creator text.

---

## Success Criteria

1. Default plan is seeded in DB via migration; `src/data/default-plan.json` removed
2. `lib/plan.ts` loads only from DB; no file fallback
3. Plans API returns `public`, `creator_name`; never returns email
4. PlanSelectorSection, DayListSection, SessionPreviewSection show creator attribution for public plans only (small, greyed out)
5. Private plans show no creator text
6. Offline: "No plans available" (accepted trade-off per CONTEXT)

---

## Tasks

### 1. Migration — schema + seed (REQ-35-migration)

- [x] **1.1** Create `migrations/003_default_plan_and_public.sql` with four statements (migrate.ts runs each `;`-separated statement):
  - `ALTER TABLE plans ADD COLUMN public BOOLEAN DEFAULT false;`
  - `ALTER TABLE plans ADD COLUMN published_on DATE NULL;`
  - `ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL;` (users table has no `name` yet; add for creator attribution)
  - Seed default plan: `INSERT IGNORE INTO plans (id, name, description, days_json, created_at, created_by, public, published_on) VALUES ('default', '4:00 Dry Breathhold', 'A structured 21-day dry training plan focusing on CO2 tolerance and O2 efficiency to achieve a 4-minute static apnea breath hold.', '<DAYS_JSON>', UNIX_TIMESTAMP() * 1000, NULL, TRUE, CURDATE());`
- [x] **1.2** Generate `<DAYS_JSON>`: Run `node -e "const d=require('./src/data/default-plan.json'); console.log(JSON.stringify(d.days).replace(/'/g, \"''\"))"` and paste the output into the migration (replace `<DAYS_JSON>`). Ensures proper SQL escaping.
- [x] **1.3** Verify migration: run migrations; default plan appears in `plans` with `created_by=NULL`, `public=TRUE`, `published_on` set.

### 2. Backend — lib/plan.ts (REQ-35-no-fallback)

- [x] **2.1** In `lib/plan.ts`: Remove `existsSync`, `readFileSync` fallback to `default-plan.json`. Load only from DB. If plan not found, throw (no fallback).
- [x] **2.2** Remove the file-path logic for `baseName-plan.json`; keep only DB query. Simplify `loadPlan(planId)` to query `plans` table only.

### 3. Backend — Plans API (REQ-35-creator)

- [x] **3.1** In `app/api/plans/route.ts` GET: `LEFT JOIN users u ON p.created_by = u.id`. Select `CASE WHEN p.created_by IS NULL THEN 'Fishly' ELSE COALESCE(u.name, u.username) END AS creator_name`. Add `p.public`, `p.published_on` to SELECT. Return `{ id, name, description, days, created_by, public, published_on, creator_name }`. Never select or return `email`.
- [x] **3.2** In `app/api/plans/route.ts` POST: Include `public` (default `false`), `published_on` (NULL for user-created private plans) in INSERT. Ensure `created_by = user.id`.

### 4. Schemas and types (REQ-35-types)

- [x] **4.1** In `src/types/plan.ts`: Extend `planWithMetaSchema` with `public?: boolean`, `published_on?: string | null` (ISO date string from API), and `creator_name?: string`. Update `PlanWithMeta` type.
- [x] **4.2** In `src/schemas/planSchema.ts`: Ensure validation allows `public`, `published_on`, and `creator_name` for API responses (optional fields).

### 5. planService — remove bundled plans (REQ-35-service)

- [x] **5.1** In `src/services/planService.ts`: Remove `import defaultPlanData from '../data/default-plan.json'`. Remove `planModules`, `getBundledPlans()`.
- [x] **5.2** Change `getAvailablePlans(plans?)`: when `plans` provided, return them; otherwise return `[]` (no bundled fallback).
- [x] **5.3** Update `loadPlanById` and `loadPlan` to work with plans from context only; no fallback to bundled.

### 6. TrainingContext — API-only plans (REQ-35-context)

- [x] **6.1** In `src/contexts/TrainingContext.tsx`: Remove `getBundledPlans` import and usage. `refreshAvailablePlans` and the `useEffect` that loads plans: use `fetchPlansFromApi()` only. `const available = dbPlans` (no merge with bundled).
- [x] **6.2** When `available` is empty: set `setError('No plans available')` (offline or no plans). Document that offline users see "No plans available" per CONTEXT.

### 7. Constants (REQ-35-constants)

- [x] **7.1** In `src/constants/app.ts`: `BUNDLED_PLAN_IDS` remains `['default']` for delete guard and reserved IDs. Optional: add comment that "default" is now in DB but reserved. No rename to `RESERVED_PLAN_IDS` required for Phase 35.

### 8. PlanSelectorSection — creator attribution (REQ-35-creator-ui)

- [x] **8.1** In `PlanSelectorSection.tsx`: For each plan, when `plan.public === true`, render creator attribution below plan name (or after progress): `<span className="text-on-surface-variant text-sm font-normal">Created by {plan.creator_name ?? 'Fishly'}</span>`. Do not render for private plans.
- [x] **8.2** Ensure creator text is visually distinct from plan name (small, greyed).

### 9. DayListSection — creator attribution (REQ-35-creator-ui)

- [x] **9.1** In `DayListSection.tsx`: Add props `creatorName?: string`, `isPublic?: boolean`. When `isPublic`, render below plan description: `<span className="text-on-surface-variant text-sm font-normal">Created by {creatorName ?? 'Fishly'}</span>`.
- [x] **9.2** In `Dashboard.tsx`: Pass `creatorName={planWithMeta?.creator_name}`, `isPublic={planWithMeta?.public}` to `DayListSection`.

### 10. SessionPreviewSection — creator attribution (REQ-35-creator-ui)

- [x] **10.1** In `SessionPreviewSection.tsx`: Add props `creatorName?: string`, `isPublic?: boolean`. When `isPublic`, render creator attribution (e.g. below planName): `<span className="text-on-surface-variant text-sm font-normal">Created by {creatorName ?? 'Fishly'}</span>`.
- [x] **10.2** In `Dashboard.tsx`: Pass `creatorName={planWithMeta?.creator_name}`, `isPublic={planWithMeta?.public}` to `SessionPreviewSection`.

### 11. Remove default-plan.json (REQ-35-cleanup)

- [x] **11.1** Delete `src/data/default-plan.json` after migration and planService changes are complete. Ensure no remaining imports reference it.

### 12. Tests (REQ-35-tests)

- [x] **12.1** Unit: `planService.getAvailablePlans()` returns `[]` when no plans passed; `loadPlanById` returns error when plan not in list.
- [x] **12.2** Unit: Plans API returns `public`, `creator_name`; no `email` in response. Mock DB rows.
- [x] **12.3** E2E: Logged-in user sees default plan "4:00 Dry Breathhold" with "Created by Fishly" in Plans tab and Dashboard. Use existing e2e-set-session flow.
- [x] **12.4** E2E: Offline (or unauthenticated) user sees "No plans available" when appropriate (if app shows plans only when logged in, verify logged-in + offline shows error).

---

## File changes summary

| Action | File(s)                                                       |
| ------ | ------------------------------------------------------------- |
| Create | `migrations/003_default_plan_and_public.sql`                  |
| Modify | `lib/plan.ts`                                                 |
| Modify | `app/api/plans/route.ts`                                      |
| Modify | `src/types/plan.ts`                                           |
| Modify | `src/schemas/planSchema.ts`                                   |
| Modify | `src/services/planService.ts`                                 |
| Modify | `src/contexts/TrainingContext.tsx`                            |
| Modify | `src/components/settings/PlanSelectorSection.tsx`             |
| Modify | `src/components/day/DayListSection.tsx`                       |
| Modify | `src/components/session/SessionPreviewSection.tsx`            |
| Modify | `src/views/Dashboard.tsx`                                     |
| Delete | `src/data/default-plan.json`                                  |
| Modify | `src/services/planService.test.ts` (or add tests)             |
| Modify | `e2e/*.spec.ts` (creator attribution + offline if applicable) |

---

## Verification checklist (goal-backward)

- [x] Default plan exists in DB after migration; `created_by=NULL`, `public=TRUE`, `published_on` set
- [x] No file `src/data/default-plan.json`
- [x] `lib/plan.ts` has no `readFileSync` or `default-plan.json` reference
- [x] Plans API GET returns `creator_name`, `public`, `published_on`; never `email`
- [x] PlanSelectorSection shows "Created by Fishly" for default plan
- [x] DayListSection and SessionPreviewSection show creator attribution for public plans
- [x] Private plans (user-created) show no creator text
- [x] `BUNDLED_PLAN_IDS` still guards against deleting default plan

---

## Context

- User decisions: `.planning/phases/35-default-plan-migration-creator-attribution/35-CONTEXT.md`
- Research: `.planning/phases/35-default-plan-migration-creator-attribution/35-RESEARCH.md`
- Users table: `email` from Phase 33; `name` added in 003 for creator attribution
- APP_NAME = "Fishly" from `src/constants/app.ts`
