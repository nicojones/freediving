# Phase 22: Plans Tab + Settings Cleanup — Executable Plan

---

phase: 22-plans-tab-settings-cleanup
plans:

- id: "01"
  tasks: 5
  depends_on: [21-ui]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths: - "Bottom nav has three tabs: Training, Plans, Settings" - "Plan-related UI (change plan, add plan) lives in Plans tab, not Settings" - "plans table has created_by (user_id); user can permanently delete plans they created (only non-active)" - "Structure leaves room for future 'explore plans without switching' (do not implement)"

---

## Objective

Settings is becoming too polluted. Extract plan-related functionality into a dedicated Plans tab. Add ability to delete user-created plans (non-active only). Leave room for future "explore plans without switching" without implementing it.

**Principles:**

- Plans tab owns: change plan, add plan, delete plan (user-created, non-active)
- Settings keeps: reset progress, dev mode, profile, logout
- Foreshadow: explore plans without switching — leave room, do not develop

---

## Context

- `BottomNavBar` — currently two tabs: Training, Settings
- `SettingsView` — contains PlanSelectorSection, CreatePlanSection, ResetProgressSection, DevModeSection, UserProfileCard
- `plans` table — id, name, description, days_json, created_at (no created_by)
- `user_active_plan` — links user to active plan_id

---

## Plan 01: Plans Tab + Settings Cleanup

### Task 1: Add Plans Tab to Bottom Nav

**Files:** `src/components/layout/BottomNavBar.tsx`, routing

**Action:**

1. Add third tab "Plans" to BottomNavBar (activeTab: 'training' | 'plans' | 'settings')
2. Add route `/plans` and PlansView (or equivalent)
3. Wire Plans tab click to navigate to /plans

**Done:** Three tabs visible; Plans tab navigates to Plans page.

---

### Task 2: Create Plans View and Move Plan Sections

**Files:** New `src/views/PlansView.tsx` (or `app/plans/page.tsx`), `SettingsView.tsx`

**Action:**

1. Create PlansView with PlanSelectorSection and CreatePlanSection (moved from Settings)
2. Remove PlanSelectorSection and CreatePlanSection from SettingsView
3. PlansView fetches availablePlans, activePlanId; handles plan change and create

**Done:** Plan selector and create-plan live in Plans tab; Settings no longer shows them.

---

### Task 3: Add created_by to plans Table

**Files:** `server/schema.sql`, migration or truncate

**Action:**

1. Add `created_by INTEGER REFERENCES users(id)` to plans table
2. Truncate plans table (no useful data); new inserts must set created_by
3. Update plan creation API to store created_by from authenticated user

**Done:** plans.created_by exists; new user-created plans record creator.

---

### Task 4: Delete Plan (User-Created, Non-Active Only)

**Files:** API route, PlansView or plan list component

**Action:**

1. Add DELETE endpoint: only allows delete if plan.created_by === current user AND plan is NOT active for any user
2. Add delete UI in Plans tab for plans the user created; disabled/hidden for active plan
3. Permanent delete (no soft delete)

**Done:** User can permanently delete plans they created, only when plan is not active.

---

### Task 5: Leave Room for Future "Explore Plans Without Switching"

**Action:**

1. Document in plan or code comment: future enhancement — explore plans without switching active plan
2. Ensure Plans tab structure (e.g. plan list, selection) does not block adding "preview/explore" mode later
3. Do NOT implement explore/preview; only leave structural room

**Done:** PlansView JSDoc documents future enhancement; structure (plan list, selector, PlanDeleteSection) allows adding preview/explore mode without refactor.

---

## Verification

- [ ] Bottom nav shows Training, Plans, Settings
- [ ] Plans tab shows plan selector and create-plan; Settings does not
- [ ] plans table has created_by; new plans store creator
- [ ] User can delete own non-active plans; cannot delete active plan
- [ ] Structure allows future "explore without switching" without refactor
- [ ] `npm run build` and `npm run test:run` pass
