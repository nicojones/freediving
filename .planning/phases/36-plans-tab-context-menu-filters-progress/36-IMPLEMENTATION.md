# Phase 36: Implementation Notes

**Executed:** 2025-03-21  
**Status:** Complete

---

## Summary of Changes

Phase 36 delivered the planned features plus several refinements from user feedback.

---

## Planned Features (Implemented)

### 1. Context Menu — Replace Trash with "..."

- **PlanContextMenu** (`src/components/settings/PlanContextMenu.tsx`) — Extracted as its own component.
- Menu items: Copy JSON, Download plan, Edit, Delete.
- Copy JSON: `planToJson(plan)` outputs `{ id, name, description, days }` only (no server metadata like `created_by`, `creator_name`).
- Download: Blob + `URL.createObjectURL`; filename sanitized via `plan.name.replace(/[^a-z0-9\-_]/gi, '_') + '.json'`.
- Edit: Opens in-place `ConfirmPlanModal` (name/description); no navigation. Calls `onRequestEdit(plan)`; parent renders modal and handles PATCH.
- Delete: Same flow as before (ConfirmResetModal, DELETE `/api/plans/[id]`).
- Permission: Menu only for `isUserCreated(p)`. Delete disabled when plan is active; Edit enabled even when active.
- data-testid: `plan-menu-{id}`, `plan-menu-copy`, `plan-menu-download`, `plan-menu-edit`, `plan-menu-delete`.

### 2. Public Plans — Greyed 🌐 Icon

- When `!isUserCreated(p) && p.public`: render `material-symbols-outlined` "public" icon, greyed (`text-on-surface-variant/60`).
- No menu for public plans the user didn't create.

### 3. Progress at Top-Right

- Layout: Top row = creator (left) + progress (right) in `flex-row-reverse`.
- Below: plan name, description.
- Progress: `{completed}/{total} days` in `subtle` class.

### 4. Filter Toggle — All / My / Public

- RadioGroup (Headless UI) above PlanSelectorSection.
- Filter logic in PlansView: `all` → all plans; `my` → `created_by === currentUserId`; `public` → `public === true`.
- data-testid: `plan-filter`, `plan-filter-all`, `plan-filter-my`, `plan-filter-public`.

### 5. "How it works" Expandable Section

- Styled as full-width section (same as PlanSelectorSection): `bg-surface-container-low rounded-3xl p-6 mb-6 border`.
- DisclosureButton: `justify-between` with h2 "How it works" on left, `add` icon on right (rotates 45° when open).
- DisclosurePanel: Short copy + `<Link href="/create">Create</Link>`.
- data-testid: `plans-how-it-works`.

### 6. "Create Plan" Button

- Link at bottom of plan list to `/create`.
- data-testid: `create-plan-button`.

### 7. Edit Flow — Name/Description Only (In-Place Modal)

- **Plans tab:** Edit opens `ConfirmPlanModal` in-place (no navigation to Create tab).
- **PlanContextMenu**: `onRequestEdit` prop; Edit calls it instead of `router.push`.
- **PlanCard**: Passes `onRequestEdit` to PlanContextMenu.
- **PlanSelectorSection** / **ActivePlanSection**: `editingPlan` state; render `ConfirmPlanModal`; `handleConfirmEdit` PATCHes and calls `onPlanEdited` (refresh).
- **TrainingContext**: `refreshAvailablePlans` updates `planWithMeta` when active plan is in refreshed list (changes visible without page reload).
- **ConfirmPlanModal**: `data-testid="confirm-plan-modal"` for E2E; "Save" vs "Create" button when `isEditMode`.
- **Create tab edit** (legacy): `CreatePlanView` still supports `?edit=` param for Create-tab edit flow.
- **PATCH `/api/plans/[id]`**: Updates `name` and `description` only; requires user to be creator; blocks built-in plans.

---

## Additional Changes (User Feedback)

### Active Plan Section

- **ActivePlanSection** (`src/components/settings/ActivePlanSection.tsx`) — New section between "How it works" and the filter.
- Readonly box showing current plan (name, description, progress, creator).
- Click navigates to Training page (`/`).
- data-testid: `active-plan-section`, `active-plan-box`, `active-plan-progress`, `active-plan-creator`.

### PlanSelectorSection Excludes Active Plan

- `otherPlans = availablePlans.filter((p) => p.id !== activePlanId)`.
- Active plan is shown in Active Plan section; no duplicate in selector.

### Empty State

- When `otherPlans.length === 0`: show "Nothing here" centered in plan selector.
- data-testid: `plan-selector-empty`.

### Layout Refinement

- Plan row layout: top row = creator + progress (flex-row-reverse); below = name + description.
- Matches original design (days and creator at top, name + description in column).

---

## PlanCard Unification (2025-03-21)

**Refactor:** ActivePlanSection and PlanSelectorSection shared duplicate plan card UI (progress, creator, name, description). Unified into a single `PlanCard` component.

### PlanCard Component

- **Location:** `src/components/settings/PlanCard.tsx`
- **Purpose:** Single reusable component for displaying a plan in either "active" or "selectable" context.
- **Variants:**
  - `active` — Button that navigates to `/`; shows chevron when no menu; used in ActivePlanSection.
  - `selectable` — Div with `role="button"` for keyboard support; used in PlanSelectorSection list.
- **Shared UI:** Progress (completed/total days), creator attribution, plan name, description.
- **Context menu:** When `showMenu` is true, renders PlanContextMenu (Edit, Copy JSON, Download, Delete).
- **Public icon:** When `showPublicIcon` is true, renders greyed `public` Material Symbol instead of menu.
- **Props:** `plan`, `progress`, `variant`, `onClick`, `showMenu`, `showPublicIcon`, `deleteDisabled`, `onRequestDelete`, `onRequestEdit`, `onCopyError`, `dataTestId`, `progressTestId`, `creatorTestId`.

### ActivePlanSection Changes

- Uses `PlanCard` with `variant="active"`.
- Added `currentUserId` prop to compute `showMenu` / `showPublicIcon` (user-created plans get menu; bundled public plans get icon).
- Context menu (Edit, Copy, Download) now available on active plan when user-created; Delete disabled for active plan.
- Chevron shown when neither menu nor public icon applies.

### PlanSelectorSection Changes

- Uses `PlanCard` with `variant="selectable"` for each plan in the list.
- Removed inline plan card markup; delegates to PlanCard.
- Preserves all data-testids: `plan-selector-option`, `plan-progress-{id}`, `plan-creator`.

### PlansView Changes

- Passes `currentUserId={user?.id}` to ActivePlanSection for menu/icon visibility.

### Data-testids Preserved

- Active: `active-plan-box`, `active-plan-progress`, `active-plan-creator`
- Selectable: `plan-selector-option`, `plan-progress-{id}`, `plan-creator`

---

## Edit Flow — In-Place Modal (2025-03-21)

**User feedback:** Edit should open modal on Plans tab, not navigate to Create tab. Changes must appear without page refresh.

### Changes

| File                    | Change                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| PlanContextMenu.tsx     | Added `onRequestEdit` prop; Edit calls it instead of `router.push`; removed `useRouter`                        |
| PlanCard.tsx            | Added `onRequestEdit` prop; passes to PlanContextMenu                                                          |
| PlanSelectorSection.tsx | `editingPlan` state; `ConfirmPlanModal`; `handleRequestEdit`; `handleConfirmEdit` (PATCH); `onPlanEdited` prop |
| ActivePlanSection.tsx   | Same edit modal flow; `onPlanEdited` prop; `editError` state for API errors                                    |
| PlansView.tsx           | Passes `onPlanEdited={refreshAvailablePlans}` to both sections                                                 |
| TrainingContext.tsx     | `refreshAvailablePlans` updates `planWithMeta` when active plan in refreshed list                              |
| ConfirmPlanModal.tsx    | `data-testid="confirm-plan-modal"` for E2E                                                                     |
| e2e/create-plan.spec.ts | Test: "edit plan name via context menu modal, changes visible without refresh"                                 |

---

## File Changes

| Action | File                                                             |
| ------ | ---------------------------------------------------------------- |
| Create | `src/components/settings/PlanContextMenu.tsx`                    |
| Create | `src/components/settings/ActivePlanSection.tsx`                  |
| Create | `src/components/settings/PlanCard.tsx`                           |
| Modify | `src/components/settings/PlanSelectorSection.tsx`                |
| Modify | `src/views/PlansView.tsx`                                        |
| Modify | `src/contexts/TrainingContext.tsx`                               |
| Modify | `src/views/CreatePlanView.tsx`                                   |
| Modify | `src/components/settings/CreatePlanSection.tsx`                  |
| Modify | `src/components/settings/create-plan/useCreatePlanHandlers.ts`   |
| Modify | `src/components/settings/create-plan/CreatePlanDescribeTab.tsx`  |
| Modify | `src/components/settings/create-plan/CreatePlanDraftPreview.tsx` |
| Modify | `src/components/settings/ConfirmPlanModal.tsx`                   |
| Modify | `app/api/plans/[id]/route.ts` (PATCH handler)                    |
| Modify | `src/components/settings/PlanSelectorSection.test.tsx`           |
| Modify | `e2e/create-plan.spec.ts`                                        |

---

## Verification Checklist

- [x] Trash icon gone; "..." menu for user-created plans
- [x] Menu items: Copy JSON, Download plan, Delete, Edit
- [x] Copy JSON copies plan (id, name, description, days) to clipboard
- [x] Download plan saves `.json` with sanitized filename
- [x] Delete opens confirm modal; DELETE for non-active user-created plans
- [x] Edit opens in-place modal; name/description editable; Save PATCHes; changes visible without refresh
- [x] Filter All/My/Public changes visible plans
- [x] Progress at top-right of each plan box
- [x] Public plans show greyed 🌐 icon, no menu
- [x] "How it works" section expands; + icon rotates; link to Create
- [x] "Create Plan" button at bottom links to /create
- [x] Active Plan section shows current plan; click goes to Training
- [x] PlanSelectorSection excludes active plan
- [x] Empty state "Nothing here" when no other plans
