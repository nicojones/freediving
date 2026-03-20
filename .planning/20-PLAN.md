# Phase 20: Preview Future Days — Executable Plan

---
phase: 20-preview-future-days
plans:
  - id: "01"
    tasks: 5
    depends_on: [19-create-plan-settings]
type: execute
wave: 1
autonomous: false
requirements: []
must_haves:
  truths:
    - "User can view session structure (hold/breathe intervals) for future days in the plan"
    - "User cannot start or execute a session for a future day"
    - "Future days are clearly differentiated from current/available days (read-only preview, no start button)"
---

## Objective

Add the ability to preview future days in a training plan — view their structure (hold/breathe intervals) — while ensuring there is **no way** to execute them. Future days are read-only; only the current/available day can be started.

**Principles:**
- Preview = view session structure only (no execution)
- Future days: no start button, no session runner access
- Clear visual distinction between current vs future days

---

## Context

- Phase 5: Session Runner + Plan/Day Selector — day selection, session preview, current-day logic
- Phase 7: Day IDs + Routing — `/day/:dayId`, completions by day_id
- Phase 8: One session per day, completion flow

**Existing:** User selects day; session preview shows structure; only "current" day (first non-completed) is typically actionable. Future days use `LockedDayCard` (not clickable). Need to allow viewing future days while blocking execution.

**Research:** `.planning/phases/20-preview-future-days/20-RESEARCH.md`

---

## Plan 01: Preview Future Days

### Task 1: Make LockedDayCard Selectable (Preview-Only)

**Files:** `src/components/day/LockedDayCard.tsx`

**Action:**
1. Add optional prop `onSelect?: () => void`
2. When `onSelect` is provided, make the card clickable:
   - Add `role="button"`, `tabIndex={0}`, `onClick={onSelect}`, `onKeyDown` for Enter/Space
   - Add `cursor-pointer` and hover state (e.g. `hover:opacity-70`) to indicate interactivity
3. Keep lock icon and muted styling (`opacity-50`, `bg-surface-container-low/50`) to indicate preview-only
4. Add `aria-label` for accessibility (e.g. "Preview day N")

**Done:** Future days can be clicked to open preview.

---

### Task 2: Pass onSelect to LockedDayCard

**Files:** `src/components/day/TrainingDayCard.tsx`

**Action:**
1. Pass `onSelect` to `LockedDayCard` in the future-day branch (line 63–64)
2. `LockedDayCard` receives same `onSelect` as other cards; Dashboard's `handleSelectDay` already supports any valid day index

**Done:** Future days route to `/day/:dayId` and show session preview.

---

### Task 3: Harden Execution Blocking in TrainingContext

**Files:** `src/contexts/TrainingContext.tsx`

**Action:**
1. In `handleStartSession`, add guard before starting:
   - `const currentDay = getCurrentDay(plan, completions)`
   - `if (selectedDayIndex !== currentDay) return`
2. Ensures future days cannot be started even if UI is bypassed (e.g. direct API call or dev tools)

**Done:** Execution blocked at context level for non-current days.

---

### Task 4: Add "Preview Only" Message in SessionPreviewSection

**Files:** `src/components/session/SessionPreviewSection.tsx`

**Action:**
1. When `!isCurrentDay` (future day selected), show a "Preview only" banner/message
2. Place it where Start CTA would be (or above SessionBreakdown) — e.g. "This is a future day. You can preview the structure but cannot start a session yet."
3. Hide test controls (SpeedMultiplierSelector, test-mode toggle) when `!isCurrentDay` — future days are preview-only, no need for test controls
4. Keep SessionPreviewStats and SessionBreakdown visible for all days

**Done:** Future days show clear preview-only state; no Start button; no test controls.

---

### Task 5: Tests

**Files:**
- `src/components/day/LockedDayCard.test.tsx` (new or extend)
- `src/components/session/SessionPreviewSection.test.tsx`

**Action:**
1. **LockedDayCard:** When `onSelect` is provided, click triggers `onSelect`; when not provided, card is not interactive
2. **SessionPreviewSection:** When `selectedDayIndex !== currentDayIndex`, Start CTA is not rendered; "Preview only" message is shown
3. Run `npm run test:run` to verify

**Done:** Unit tests cover new behavior.

---

## Verification

- [x] User can click a future day (LockedDayCard) and see session preview
- [x] User cannot start a session for a future day (no Start button; context guard)
- [x] Future days show "Preview only" message; test controls hidden
- [x] Direct URL `/day/:futureDayId` works and shows preview
- [x] `npm run build` and `npm run test:run` pass
