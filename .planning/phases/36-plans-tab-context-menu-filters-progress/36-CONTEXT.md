# Phase 36: Plans Tab Context Menu, Filters, Progress & How It Works — Context

**Created:** 2025-03-21  
**Purpose:** Implementation decisions for Plans tab UX improvements: context menu, filters, progress display, public-plan icon, and "How it works" section.  
**Phase:** 36. Plans Tab Context Menu, Filters, Progress & How It Works

---

## Decisions (from user)

### 1. Replace Trash with "..." Context Menu

**Current:** PlanSelectorSection shows a trash/delete button for user-created plans.

**Desired:** Replace with a "..." (more_vert or similar) context menu that offers:

- **Copy JSON** — copy plan as JSON to clipboard
- **Download plan** — download as `.json` file
- **Delete** — if allowed (same rules as today: user-created, non-active)
- **Edit** — if allowed (same rules as delete for permission; can edit active plan, cannot delete active plan)

**Permission rules:** Edit and delete share the same "allowed" check (user-created plan). Exception: you cannot delete the active plan; you can edit the active plan.

---

### 2. Filter Toggle: All / My / Public

**Desired:** Add a filter above the plan list:

- **All plans** — show all plans (current behavior)
- **My plans** — show only plans created by current user (`created_by === currentUserId`)
- **Public plans** — show only plans where `public === true`

---

### 3. Progress at Top-Right of Plan Boxes

**Current:** Progress (e.g. "0/12 days") is shown below the plan name in the left column.

**Desired:** Progress must be shown at the **top-right** of each plan box, similar to how TopAppBar shows "Day X of Y" in the top-right. Add padding to plan items if needed.

---

### 4. Public Plans: 🌐 Icon Instead of Menu

**Desired:** For public plans (that the user did not create), show a greyed-out 🌐 (planet/globe) icon instead of the dropdown menu. No context menu for public plans the user doesn't own.

---

### 5. "How it works" Expandable Section

**Desired:** Plans tab has an expandable section at the top: "How it works +". When clicked, it expands to explain:

- Plans are a way to create training programs for breathhold
- You can go to the [Create](/create) tab and create one by describing what you want
- Keep it short — a sentence or two more at most

---

### 6. "Create Plan" Button

**Desired:** Add a "Create Plan" button at the bottom of the plan list that links to the Create tab (`/create`). Provides a clear call-to-action for creating new plans.

---

## Gray Areas — Resolved

| Area                 | Decision                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Context menu items   | Copy JSON, Download (.json), Delete, Edit                                                                     |
| Edit vs delete rules | Same permission (user-created); can edit active, cannot delete active; Edit = name/description only (no flow) |
| Filter options       | All plans / My plans / Public plans                                                                           |
| Progress placement   | Top-right of plan box (like TopAppBar)                                                                        |
| Public plan icon     | 🌐 greyed out; no menu                                                                                        |
| How it works         | Expandable at top; short copy; link to Create tab                                                             |
| Create Plan button   | At bottom of list; links to /create                                                                           |

---

## Implementation Implications

### PlanSelectorSection

- Replace delete button with "..." menu (Headless UI Menu or similar)
- Menu items: Copy JSON, Download plan, Delete, Edit — each gated by permission
- Public plans (not user-created): show greyed 🌐 icon, no menu
- Move progress to top-right of each plan row; add padding as needed

### PlansView

- Add filter control above PlanSelectorSection: All / My / Public
- Add expandable "How it works +" section at top (above filter)
- Add "Create Plan" button at bottom of plan list; links to `/create`

### Edit Flow

- "Edit" allows changing **name and description only** — not the plan flow (days, intervals). Navigate to Create tab with plan pre-loaded, or open edit modal; user can update name/description and save. Flow structure is read-only.

### Copy JSON / Download

- Copy: `navigator.clipboard.writeText(JSON.stringify(planWithMeta))`
- Download: create blob, trigger download with plan name as filename

---

## Code Context

### Current

| File                      | Current                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `PlanSelectorSection.tsx` | Delete button for user-created plans; progress below plan name         |
| `PlansView.tsx`           | PlanSelectorSection; subheader "Choose your training plan..."          |
| `TopAppBar.tsx`           | Progress in top-right: `weekLabel` (e.g. "Day 3 of 17")                |
| `BUNDLED_PLAN_IDS`        | `['default']` — default plan is reserved, not user-deletable           |
| `isUserCreated`           | `!BUNDLED_PLAN_IDS.includes(p.id) && (p.created_by === currentUserId)` |

### PlanWithMeta

- Has `id`, `name`, `description`, `days`, `created_by`, `public`, `creator_name`
- Full plan object available for copy/download

### API

- `GET /api/plans` — returns all plans for user
- `DELETE /api/plans/[id]` — delete if user-created and not active
- No PATCH for plans yet; edit may use Create tab refine flow

---

## Out of Scope for Phase 36

- Editing plan flow (days, intervals) — Edit is name/description only
- Inline plan editing (modal or page) — use Create tab or dedicated edit UI for name/description
- "Explore plans without switching" — already deferred from Phase 22

---

## Traceability

| Decision           | Outcome                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| Context menu       | Copy JSON, Download, Delete, Edit — "..." replaces trash                                |
| Permission         | Edit/delete: user-created; delete blocked for active plan; Edit = name/description only |
| Filter             | All / My / Public                                                                       |
| Progress           | Top-right of plan box                                                                   |
| Public plans       | Greyed 🌐 icon, no menu                                                                 |
| How it works       | Expandable section at top; link to Create                                               |
| Create Plan button | At bottom of list; links to /create                                                     |

---

_Context captured from /gsd-discuss-phase 36 — 2025-03-21_
