# Phase 31: UI Polish — Context

**Created:** 2025-03-21  
**Purpose:** Implementation decisions for bottom tabs, top-right, padding, developer zone, and create-plan success message.  
**Phase:** 31. UI Polish

---

## Decisions (from user)

### 1. Bottom Tabs — Label Only on Active

- **Change:** Only the active tab displays its label; inactive tabs show icon only.
- **Accessibility:** No screenreaders in scope — no need for `sr-only` on inactive labels.
- **Implementation:** Remove label span from DOM for inactive tabs (or hide via CSS); active tab keeps icon + label.

### 2. Top-Right Corner — Dashboard Progress; Remove Elsewhere

- **Dashboard (Training tab):** Keep `weekLabel` in TopAppBar top-right. Content: "Day 3 of 21" (or equivalent) — progress format, not "Current Week".
- **Others (Plans, Create, Settings):** Remove `weekLabel` from TopAppBar; nothing shown in top-right.

### 3. Developer Zone — Muted, Move to Bottom

- **Styling:** Muted (smaller text, lighter border, lower contrast).
- **Placement:** Move to bottom of Settings (below UserProfileCard, above Sign out, or at very bottom before VersionFooter — implementer chooses).

### 4. Create Plan Success — Button + Auto-Dismiss

- **Message:** Replace "Plan created successfully. It should appear in the plan selector above." with "See plans here" and a separate button that navigates to Plans tab.
- **Button:** Separate button (not inline link) to go to Plans tab where the created plan appears.
- **Notification:** Auto-dismissed (existing 3s timeout remains).

### 5. Plan Complete — No Day Selected; Whole Plan Green Border

- **No day selected:** When plan is complete, no day is selected (already the case: `selectedDayIndex === null`).
- **Whole plan green border:** The Dashboard main container (DayListSection view) gets the same green border styling as completed days — `ring-2 ring-emerald-500/60 shadow-[0_0_32px_rgba(5,150,105,0.15)]` — when `isPlanComplete`.

---

## Gray Areas — Resolved

### A. Bottom Tabs Label Visibility

- **Decision:** Inactive tabs: icon only. Active tab: icon + label. No `sr-only` (no screenreaders).

### B. Top-Right Content

- **Decision:** Dashboard: keep `weekLabel` in TopAppBar, show "Day X of Y" progress. Others: remove `weekLabel`; nothing shown.

### C. Developer Zone

- **Decision:** Muted styling; move to bottom of Settings.

### D. Create Plan Success

- **Decision:** Separate button to Plans tab; notification auto-dismissed.

---

## Code Context

### Bottom Tabs

| File                                     | Current                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| `src/components/layout/BottomNavBar.tsx` | All 4 tabs show icon + label; `activeTab` prop drives styling |

### Top-Right / TopAppBar

| File                                       | Current                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `src/components/layout/TopAppBar.tsx`      | `weekLabel` prop shown in top-right when `variant === 'dashboard'` |
| `src/views/Dashboard.tsx`                  | `weekLabel="Current Week"`                                         |
| `src/views/PlansView.tsx`                  | `weekLabel="Plans"`                                                |
| `src/views/CreatePlanView.tsx`             | `weekLabel="Create plan"`                                          |
| `src/components/settings/SettingsView.tsx` | `weekLabel="Settings"`                                             |

### Training Tab Padding

| File                                                          | Current                     |
| ------------------------------------------------------------- | --------------------------- |
| `src/views/Dashboard.tsx`                                     | `main`: `px-2 sm:px-6 pt-8` |
| Plans/Create/Settings                                         | `main`: `px-6 pt-8`         |
| **Fix:** Align Dashboard to `px-6 pt-8` (or match other tabs) |

### Developer Zone

| File                                         | Current                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/components/settings/DevModeSection.tsx` | Same card style as ResetProgressSection; between ResetProgressSection and UserProfileCard              |
| `src/components/settings/SettingsView.tsx`   | Renders: InstallPrompt, ResetProgressSection, DevModeSection, UserProfileCard, Sign out, VersionFooter |

### Create Plan Success

| File                                                                                                                                                                   | Current                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/components/settings/create-plan/CreatePlanStatusBanner.tsx`                                                                                                       | "Plan created successfully. It should appear in the plan selector above." |
| `src/components/settings/create-plan/useCreatePlanHandlers.ts`                                                                                                         | `setTimeout(() => setSuccess(false), 3000)` — auto-dismiss                |
| **Note:** CreatePlanSection is in CreatePlanView (`/create`); Plans tab is `/plans`. Need `onNavigateToPlans` or router in CreatePlanStatusBanner / CreatePlanSection. |

---

## Out of Scope for Phase 31

- Screenreader support
- Changing TopAppBar left side (logo, brand)
- Changing bottom tab order or icons
- New features beyond the five success criteria

---

## Traceability

| Decision            | Outcome                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Bottom tabs         | Active: icon + label. Inactive: icon only. No sr-only.                  |
| Top-right           | Dashboard: keep weekLabel, show "Day X of Y". Others: remove weekLabel. |
| Plan complete       | No day selected; whole plan gets green border (same as completed days). |
| Training padding    | Match Plans/Create/Settings (`px-6 pt-8`)                               |
| Developer zone      | Muted styling; move to bottom of Settings                               |
| Create plan success | "See plans here" + separate button → Plans tab; auto-dismiss            |

---

_Context captured from /gsd-discuss-phase 31 — 2025-03-21_
