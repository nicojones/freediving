# Phase 36: Plans Tab Context Menu, Filters, Progress & How It Works — Plan

**Status:** Executed  
**Depends on:** Phase 35 (Default Plan Migration + Creator Attribution)  
**Implementation notes:** `36-IMPLEMENTATION.md`

---

## Goal

Improve Plans tab UX: replace trash icon with "..." context menu (copy JSON, download, delete, edit); add All/My/Public filter above the plan list; show progress at top-right of each plan box (like TopAppBar); public plans (not user-created) show greyed 🌐 icon instead of menu; add expandable "How it works" section at top; add "Create Plan" button at bottom linking to Create tab.

---

## Success Criteria

1. Trash icon replaced by "..." context menu with: Copy JSON, Download plan (.json), Delete (if allowed), Edit (if allowed)
2. Edit and delete share same permission rules (user-created); cannot delete active plan; can edit active plan; Edit = name/description only (flow read-only)
3. Filter toggle: All plans / My plans / Public plans above plan list
4. Progress (e.g. "0/12 days") shown at top-right of each plan box, similar to TopAppBar
5. Public plans (not user-created) show greyed 🌐 icon instead of dropdown menu
6. Expandable "How it works +" section at top explaining plans and linking to Create tab
7. "Create Plan" button at bottom of plan list links to Create tab

---

## Tasks

### 1. Context menu — replace trash with "..." menu (REQ-36-menu, REQ-36-permission)

- [ ] **1.1** In `PlanSelectorSection.tsx`: Replace delete button with Headless UI Menu (`Menu`, `MenuButton`, `MenuItems`, `MenuItem`). Use `anchor="bottom end"`. MenuButton: `more_vert` icon; use `e.stopPropagation()` on MenuButton click so row click does not open menu.
- [ ] **1.2** Menu items: Copy JSON, Download plan, Delete, Edit. Copy JSON: `navigator.clipboard.writeText(JSON.stringify(plan, null, 2))`. Download: `new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })`, `URL.createObjectURL`, programmatic `<a download>` click; sanitize filename: `plan.name.replace(/[^a-z0-9\-_]/gi, '_') + '.json'`. Delete: same flow as today (ConfirmResetModal, DELETE `/api/plans/[id]`). Edit: `router.push(\`/create?edit=${plan.id}\`)`.
- [ ] **1.3** Permission: Show menu only when `isUserCreated(p)`. Delete disabled when `isActive` (cannot delete active plan). Edit enabled for user-created plans even when active.
- [ ] **1.4** Add `data-testid="plan-menu-{id}"`, `plan-menu-copy`, `plan-menu-download`, `plan-menu-delete`, `plan-menu-edit` for tests.

### 2. Public plans — greyed 🌐 icon (REQ-36-public)

- [ ] **2.1** When `!isUserCreated(p) && p.public`: render greyed `public` or `language` Material Symbol (`material-symbols-outlined text-on-surface-variant/60`) instead of menu. `aria-label="Public plan"`.
- [ ] **2.2** When `!isUserCreated(p) && !p.public`: render nothing (or same as 2.1 if applicable). Per CONTEXT: "public plans the user did not create" → 🌐; user-created public plans get the menu.

### 3. Progress at top-right of plan box (REQ-36-progress)

- [ ] **3.1** In `PlanSelectorSection.tsx`: Restructure each plan row. Move progress from below plan name to a top-right block. Layout: `flex items-start justify-between`; left: plan name, creator, description; right: progress + menu/icon. Progress: `{completed}/{total} days` in `text-on-surface-variant text-sm`, same as TopAppBar style.
- [ ] **3.2** Ensure progress and menu/icon share the same right-side flex container; progress appears before menu/icon.

### 4. Filter toggle — All / My / Public (REQ-36-filter)

- [ ] **4.1** In `PlansView.tsx`: Add state `filter: 'all' | 'my' | 'public'`. Add RadioGroup (Headless UI) above `PlanSelectorSection`. Options: All, My, Public. Style like `SpeedMultiplierSelector`: `data-checked:bg-primary`, `data-[checked=false]:bg-surface-container-high`.
- [ ] **4.2** Filter logic: `all` → all plans; `my` → `created_by === currentUserId`; `public` → `public === true`. Pass filtered list to `PlanSelectorSection` as `availablePlans` (or add `filter` prop and filter inside section). Prefer filtering in PlansView and passing filtered list.
- [ ] **4.3** Add `data-testid="plan-filter"`, `plan-filter-all`, `plan-filter-my`, `plan-filter-public`.

### 5. "How it works" expandable section (REQ-36-how-it-works)

- [ ] **5.1** In `PlansView.tsx`: Add Headless UI Disclosure above the filter. DisclosureButton: "How it works" + `expand_more` icon; use `data-open:rotate-180` on icon for chevron rotation.
- [ ] **5.2** DisclosurePanel: Short copy: "Plans are a way to create training programs for breathhold. You can go to the Create tab and create one by describing what you want." Include `<Link href="/create">Create</Link>` (styled as `text-primary underline`).
- [ ] **5.3** Add `data-testid="plans-how-it-works"`.

### 6. "Create Plan" button (REQ-36-create-btn)

- [ ] **6.1** In `PlansView.tsx`: Add button at bottom of plan list (after `PlanSelectorSection`), linking to `/create`. Use `Link` or `router.push`. Label: "Create Plan". Style: primary button, consistent with app.
- [ ] **6.2** Add `data-testid="create-plan-button"`.

### 7. Edit flow — name/description only (REQ-36-menu)

- [ ] **7.1** In `CreatePlanView.tsx`: Use `useSearchParams()` to read `edit` query param. If present, get plan: first from `useTraining().availablePlans` by id; if not found, fetch `GET /api/plans` and find by id.
- [ ] **7.2** Pass `initialDraftPlan={plan}` to `CreatePlanSection` when edit plan is found.
- [ ] **7.3** In `CreatePlanSection.tsx` / `useCreatePlanHandlers`: Add prop `initialDraftPlan?: PlanWithMeta`. When provided, set `draftPlan` to it on mount; show plan in **read-only** state for flow (days, intervals). User can edit **name and description only**; confirm saves via POST to `/api/plans` with same id. No refine/flow editing.

### 8. Tests (REQ-36-tests)

- [ ] **8.1** Unit: `PlanSelectorSection` — context menu renders for user-created plans; Copy, Download, Delete, Edit present; Delete disabled when active; public non-user-created plans show 🌐 icon, no menu; progress at top-right.
- [ ] **8.2** Unit: `PlansView` — filter toggles All/My/Public; How it works expands; Create Plan button links to /create. Mock `useTraining`, `useRouter`.
- [ ] **8.3** E2E: Plans tab — filter changes list; Create Plan navigates to /create; context menu Copy/Download work (mock clipboard if needed); Edit navigates to /create?edit=... and plan is pre-loaded (name/description editable, flow read-only).

---

## File changes summary

| Action        | File(s)                                                        |
| ------------- | -------------------------------------------------------------- |
| Modify        | `src/components/settings/PlanSelectorSection.tsx`              |
| Modify        | `src/views/PlansView.tsx`                                      |
| Modify        | `src/views/CreatePlanView.tsx`                                 |
| Modify        | `src/components/settings/CreatePlanSection.tsx`                |
| Modify        | `src/components/settings/create-plan/useCreatePlanHandlers.ts` |
| Modify        | `src/components/settings/PlanSelectorSection.test.tsx`         |
| Create/Modify | `src/views/PlansView.test.tsx` (or extend existing)            |
| Modify        | `e2e/*.spec.ts` (plans tab flows)                              |

---

## Verification checklist (goal-backward)

- [ ] Trash icon gone; "..." menu appears for user-created plans
- [ ] Menu items: Copy JSON, Download plan, Delete, Edit
- [ ] Copy JSON copies plan as formatted JSON to clipboard
- [ ] Download plan saves `.json` file with sanitized filename
- [ ] Delete opens confirm modal; DELETE succeeds for non-active user-created plans
- [ ] Edit navigates to `/create?edit={id}`; Create tab shows plan pre-loaded; user can edit name/description only (flow read-only)
- [ ] Filter All/My/Public changes visible plans
- [ ] Progress at top-right of each plan box
- [ ] Public plans (not user-created) show greyed 🌐 icon, no menu
- [ ] "How it works" expands to show short copy and link to Create
- [ ] "Create Plan" button at bottom links to /create

---

## Implementation Notes

See `36-IMPLEMENTATION.md` for executed changes, including:

- PlanCard unified component (active + selectable variants)
- PlanContextMenu extracted component
- Active Plan section (uses PlanCard; readonly, links to Training; context menu for user-created)
- PlanSelectorSection uses PlanCard; excludes active plan; empty state "Nothing here"
- How it works styled as section (full width, + icon, justify-between)
- PATCH `/api/plans/[id]` for edit flow

---

## Context

- User decisions: `.planning/phases/36-plans-tab-context-menu-filters-progress/36-CONTEXT.md`
- Research: `.planning/phases/36-plans-tab-context-menu-filters-progress/36-RESEARCH.md`
- Patterns: Headless UI Menu (anchor="bottom end"), Disclosure, RadioGroup (SpeedMultiplierSelector)
- Copy: `navigator.clipboard.writeText`; Download: Blob + createObjectURL
- Filename sanitization: `plan.name.replace(/[^a-z0-9\-_]/gi, '_')`
