# Phase 21: UI — Executable Plan

---

phase: 21-ui
plans:

- id: "01"
  tasks: 3
  depends_on: [20-preview-future-days]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths: - "DayListSection uses plan name and description (not hardcoded 'Training' / 'Focus on rhythmic breathing...')" - "TopAppBar no longer shows plan name (redundant with DayListSection)" - "App name 'Fishly' lives in src/constants/app.ts"

---

## Objective

Remove hardcoded text and unify the UI: plan name/description in DayListSection, remove redundant plan name from TopAppBar, and centralize app name in constants.

**Principles:**

- Single source of truth for plan display (DayListSection)
- App branding in constants

---

## Context

- `src/components/day/DayListSection.tsx` — currently hardcodes "Training" and "Focus on rhythmic breathing and peripheral relaxation during the peak CO2 phases."
- `src/components/layout/TopAppBar.tsx` — shows plan name in dashboard and session-preview variants; hardcodes "Fishly"
- `src/views/Dashboard.tsx` — passes planName to TopAppBar; has planWithMeta (name, description)
- `src/constants/app.ts` — already has DEFAULT_PLAN_NAME, DEFAULT_PLAN_ID, etc.

---

## Plan 01: UI Unification

### Task 1: DayListSection Uses Plan Name/Description

**Files:** `src/components/day/DayListSection.tsx`, `src/views/Dashboard.tsx`

**Action:**

1. Add `planName` and `planDescription` (optional) to DayListSectionProps
2. Replace hardcoded "Training" with `planName`
3. Replace hardcoded description with `planDescription` or sensible fallback when absent
4. Dashboard passes `planName={planWithMeta?.name ?? DEFAULT_PLAN_NAME}` and `planDescription={planWithMeta?.description}` to DayListSection

**Done:** DayListSection displays plan metadata dynamically.

---

### Task 2: Remove Plan Name from TopAppBar

**Files:** `src/components/layout/TopAppBar.tsx`, `src/views/Dashboard.tsx`

**Action:**

1. Remove `showPlanName` and `planName` props from TopAppBar (or stop rendering plan name)
2. Remove the plan name spans in both dashboard and session-preview variants (lines ~48–52 and ~57–61)
3. Remove `planName` and `showPlanName` from Dashboard's TopAppBar usage

**Done:** TopAppBar no longer shows plan name; DayListSection is the single place for plan display.

---

### Task 3: Move App Name to Constants

**Files:** `src/constants/app.ts`, `src/components/layout/TopAppBar.tsx`

**Action:**

1. Add `APP_NAME = 'Fishly'` to `src/constants/app.ts`
2. Import APP_NAME in TopAppBar and replace hardcoded "Fishly" with it

**Done:** App name centralized in constants.

---

## Verification

- [x] DayListSection shows plan name and description from plan metadata
- [x] TopAppBar does not display plan name
- [x] TopAppBar displays app name from constants
- [x] `npm run build` and `npm run test:run` pass
