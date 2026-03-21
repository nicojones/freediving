# Phase 31: UI Polish — Plan

**Status:** Complete  
**Depends on:** Phase 30 (Dockerize MySQL + Change Database Type)

---

## Goal

Refine UI details: bottom tabs show label only on active tab; top-right corner shows "Day X of Y" on Dashboard only; trainings tab padding matches other tabs; developer zone in settings is muted and moved to bottom; after creating a plan, message says "See plans here" with button that navigates to Plans tab; plan complete shows whole plan with green border.

---

## Success Criteria

1. Bottom tabs: only the active tab displays its label; inactive tabs show icon only
2. Top-right: Dashboard keeps weekLabel showing "Day X of Y"; Plans/Create/Settings remove weekLabel
3. Trainings tab: padding matches the other three tabs (Training, Plans, Settings, Create)
4. Developer zone in Settings: muted styling; moved to bottom of Settings
5. After creating a plan: message says "See plans here" with button that navigates to Plans tab; auto-dismissed
6. Plan complete: no day selected; whole plan (DayListSection) gets green border like completed days

---

## Tasks

### 1. Bottom tabs — label only on active (REQ-31-1)

- [x] **1.1** In `BottomNavBar.tsx`, wrap each tab's label span in a conditional: render only when `activeTab === 'X'`. Apply to all four tabs (Training, Plans, Create, Settings). Preserve `data-testid="nav-training"`, `data-testid="nav-plans"`, `data-testid="nav-create"`. Use pattern: `{activeTab === 'training' && (<span className="font-label ...">Training</span>)}`

### 2. Top-right — Dashboard progress; remove elsewhere (REQ-31-2)

- [x] **2.1** In `TopAppBar.tsx`, remove the default for `weekLabel` (change `weekLabel = 'Current Week'` to `weekLabel?: string` with no default). Change weekLabel render to only show when `weekLabel` is truthy: `{variant === 'dashboard' && weekLabel && (...)}` — so when weekLabel is not passed, nothing renders
- [x] **2.2** In `Dashboard.tsx`, compute `dayNum` and `totalDays`: `dayNum = currentDayIndex !== null ? currentDayIndex + 1 : p.length`; `totalDays = p.length`. Pass `weekLabel={\`Day ${dayNum} of ${totalDays}\`}` to TopAppBar (replace hardcoded "Current Week")
- [x] **2.3** In `PlansView.tsx`, remove `weekLabel="Plans"` from TopAppBar
- [x] **2.4** In `CreatePlanView.tsx`, remove `weekLabel="Create plan"` from TopAppBar
- [x] **2.5** In `SettingsView.tsx`, remove `weekLabel="Settings"` from TopAppBar

### 3. Trainings tab padding + plan complete green border (REQ-31-3, REQ-31-6)

- [x] **3.1** In `Dashboard.tsx` main element, change `px-2 sm:px-6` to `px-6` so padding matches Plans/Create/Settings
- [x] **3.2** In `Dashboard.tsx` main className, add `isPlanComplete` to the green ring condition: `(isSelectedDayCompleted || isPlanComplete) && 'ring-2 ring-emerald-500/60 shadow-[0_0_32px_rgba(5,150,105,0.15)]'`

### 4. Developer zone — muted, move to bottom (REQ-31-4)

- [x] **4.1** In `DevModeSection.tsx`, apply muted styling: `bg-surface-container-low/50`, `border-outline-variant/20`, `text-[9px]` for heading, `text-on-surface-variant/70` for heading. Keep `data-testid="dev-mode-section"` and `data-testid="dev-mode-toggle"`
- [x] **4.2** In `SettingsView.tsx`, move `DevModeSection` to bottom: render it after `UserProfileCard` and Sign out button, before the VersionFooter div (i.e. inside the `pt-12 pb-8` div, above VersionFooter)

### 5. Create plan success — "See plans here" + button (REQ-31-5)

- [x] **5.1** In `CreatePlanStatusBanner.tsx`, add `onNavigateToPlans?: () => void` to props. Replace success content: text "See plans here"; add button "Go to Plans" that calls `onNavigateToPlans` when clicked. Add `data-testid="create-plan-go-to-plans"` to button. Preserve `data-testid="create-plan-success"` on container. Use `flex flex-col gap-2` for layout
- [x] **5.2** In `CreatePlanSection.tsx`, add `onNavigateToPlans?: () => void` to interface; pass it to `CreatePlanStatusBanner`
- [x] **5.3** In `CreatePlanView.tsx`, pass `onNavigateToPlans={() => router.push('/plans')}` to `CreatePlanSection`. Ensure `useRouter` is used (already imported)

### 6. Update CreatePlanStatusBanner tests

- [x] **6.1** In `CreatePlanStatusBanner.test.tsx`, change success assertion from `'Plan created successfully'` to `'See plans here'` (or use `toHaveTextContent(/See plans here/)`)
- [x] **6.2** Add test: when `success` and `onNavigateToPlans` provided, button with `data-testid="create-plan-go-to-plans"` is visible and has text "Go to Plans"

---

## File changes summary

| Action | File(s)                                                               |
| ------ | --------------------------------------------------------------------- |
| Modify | `src/components/layout/BottomNavBar.tsx`                              |
| Modify | `src/components/layout/TopAppBar.tsx`                                 |
| Modify | `src/views/Dashboard.tsx`                                             |
| Modify | `src/views/PlansView.tsx`                                             |
| Modify | `src/views/CreatePlanView.tsx`                                        |
| Modify | `src/components/settings/SettingsView.tsx`                            |
| Modify | `src/components/settings/DevModeSection.tsx`                          |
| Modify | `src/components/settings/create-plan/CreatePlanStatusBanner.tsx`      |
| Modify | `src/components/settings/CreatePlanSection.tsx`                       |
| Modify | `src/components/settings/create-plan/CreatePlanStatusBanner.test.tsx` |

---

## Context

- **Bottom tabs:** `BottomNavBar.tsx` — conditional render: `{activeTab === 'X' && <span>Label</span>}`. Preserve `nav-training`, `nav-plans`, `nav-create`.
- **Top-right:** `TopAppBar` shows weekLabel only when `variant === 'dashboard' && weekLabel`. Dashboard computes "Day X of Y" via `getCurrentDay`, `plan.length`. Others: do not pass weekLabel.
- **Trainings padding:** Dashboard main currently `px-2 sm:px-6 pt-8`; change to `px-6 pt-8` to match Plans/Create/Settings.
- **Developer zone:** `DevModeSection` — muted classes per RESEARCH; `SettingsView` — move below UserProfileCard, above VersionFooter.
- **Create plan success:** `CreatePlanStatusBanner` — "See plans here" + button; `onNavigateToPlans` from `CreatePlanView` via `CreatePlanSection`. Auto-dismiss unchanged (useCreatePlanHandlers 3s timeout).
- **Plan complete:** `isPlanComplete` already true when `selectedDayIndex === null && p.length > 0`; add to main green ring condition.

See `31-CONTEXT.md` for implementation decisions. See `.planning/phases/31-ui-polish/31-RESEARCH.md` for patterns, pitfalls, and code examples.
