# Phase 20: Preview Future Days — Research

**Researched:** 2025-03-20
**Phase:** 20. Preview Future Days
**Sources:** planService, TrainingContext, Dashboard, SessionPreviewSection, TrainingDayCard, LockedDayCard, routing

---

## Summary

Phase 20 should let users preview future days (structure, hold/breathe intervals) without being able to run them. Current behavior: future days use `LockedDayCard`, which is not clickable, so they cannot be selected. Direct URL navigation to `/day/:dayId` already works and shows the preview. The main work is making future days selectable, keeping execution blocked, and clarifying the UI.

---

## 1. Day Selection and "Current Day" Logic

### Current Day Computation

**File:** `src/services/planService.ts` (lines 155–217)

- `getCurrentDay(plan, completions): number | null` returns the next day index or `null` if all done.
- **On track** (trained yesterday or today): next day in sequence, including rest days.
- **Behind** (last completion 2+ days ago): skips rest days, returns first training day.
- Uses `CompletionForPlan` with `day_id` and `completed_at`.

### Day Selection Flow

**File:** `src/views/Dashboard.tsx` (lines 44–54, 73–84)

- `handleSelectDay(index)` → `router.push(\`/day/${id}\`)` and `setViewMode('session-preview')`.
- `useEffect` syncs `urlDayId` from `useParams()` to `selectedDayIndex` and `viewMode`.
- Invalid `dayId` → `router.replace('/')`.

### Day Card Types (TrainingDayCard)

**File:** `src/components/day/TrainingDayCard.tsx`

| Condition | Component |
|----------|-----------|
| `isCurrent && phases` | `CurrentDayTrainingCard` (clickable) |
| `isCurrent && !phases` | `CurrentDayRestCard` (clickable) |
| `isCompleted` | `CompletedDayCard` (clickable) |
| else (future) | `LockedDayCard` (not clickable) |

**File:** `src/components/day/DayListSection.tsx` (lines 31–41)

- `isCurrent={currentDayIndex === i}`
- `isCompleted={isDayCompleted(completions, getDayId(plan, i))}`
- `onSelectDay` passed to all cards, but `LockedDayCard` does not receive or use `onSelect`.

---

## 2. Session Preview and Hold/Breathe Intervals

### Where Session Preview Is Rendered

**File:** `src/views/Dashboard.tsx` (lines 94–98, 143–163)

- `showSessionPreview` when: `viewMode === 'session-preview'` and `selectedDayIndex !== null` and `selectedPhases !== null` and `!isRestDay`.
- Rest days use `RestDayCard` instead of `SessionPreviewSection`.

### Session Preview Components

**File:** `src/components/session/SessionPreviewSection.tsx`

- **SessionPreviewStats** (lines 71): total time, longest hold, recovery.
- **SessionBreakdown** (line 94): timeline of phases.

**File:** `src/components/session/SessionBreakdown.tsx`

- Uses `buildSessionTimeline(phases)` from `src/utils/buildSessionTimeline.ts`.
- Timeline: Relaxation (60s) + alternating hold/recovery phases.
- Each phase: duration, label (Static Apnea, Controlled Inhalation, Target Peak Effort).

---

## 3. "Start Session" Gating

### UI Gating

**File:** `src/components/session/SessionPreviewSection.tsx` (lines 49–51, 95–109)

```typescript
const isCurrentDay = selectedDayIndex === currentDayIndex
const showStartCTA = isCurrentDay && !isDayCompleted
// ...
{showStartCTA && <StartSessionCTA ... />}
```

- Start CTA only when `selectedDayIndex === currentDayIndex` and day is not completed.
- For future days, `showStartCTA` is false, so Start is not shown.

### Backend / Context Gating

**File:** `src/contexts/TrainingContext.tsx` (lines 148–159)

```typescript
const handleStartSession = useCallback(async () => {
  if (isNil(plan) || selectedDayIndex === null) return
  if (hasCompletedToday(completions)) return
  const phases = getPhasesForDay(plan!, selectedDayIndex)
  if (!phases) return
  // ... starts session
}, [...])
```

- No check that `selectedDayIndex === getCurrentDay(plan, completions)`.
- Execution is effectively blocked only by the UI not showing the Start button.

---

## 4. LockedDayCard and Day Differentiation

**File:** `src/components/day/LockedDayCard.tsx`

- Props: `dayIndex`, `dayId`, `summary`.
- No `onSelect` or `onClick`.
- Visuals: lock icon, `opacity-50`, `bg-surface-container-low/50`.
- Not interactive.

**File:** `src/components/day/TrainingDayCard.tsx` (lines 62–64)

- Future days render `LockedDayCard` with no `onSelect`.

---

## 5. Routing for `/day/:dayId`

**File:** `app/day/[dayId]/page.tsx`

- Both `/` and `/day/[dayId]` render `Dashboard`.
- `Dashboard` uses `useParams()` for `dayId`; `/` has no `dayId`, `/day/:dayId` has it.
- `getDayIndexById(plan, urlDayId)` maps `dayId` to index; invalid `dayId` → redirect to `/`.

---

## Implementation Recommendations

### Task 1: Make Future Days Selectable (Preview-Only)

1. **LockedDayCard**
   - Add optional `onSelect?: () => void`.
   - When `onSelect` is provided, make the card clickable (e.g. `role="button"`, `onClick`, keyboard handlers).
   - Keep lock icon and muted styling to indicate preview-only.

2. **TrainingDayCard**
   - Pass `onSelect` to `LockedDayCard` so future days are selectable.

3. **Dashboard**
   - No change needed; `handleSelectDay` already supports any valid day index.

### Task 2: Harden Execution Blocking

1. **TrainingContext.handleStartSession**
   - Add guard: `if (selectedDayIndex !== getCurrentDay(plan, completions)) return`.
   - Ensures future days cannot be started even if the UI is bypassed.

### Task 3: Future-Day Preview UX

1. **SessionPreviewSection**
   - When `!isCurrentDay` (future day), show a "Preview only" message instead of Start CTA.
   - Optionally hide or disable test controls for future days.
   - Keep SessionPreviewStats and SessionBreakdown visible.

### Task 4: Future Rest Days

- Rest days already use `RestDayCard` with "Rest day" content.
- If future rest days become selectable, they will show `RestDayCard` as today's rest days do.
- No extra logic needed beyond making `LockedDayCard` clickable.

### Task 5: Tests

1. **SessionPreviewSection.test.tsx**
   - Add: when `selectedDayIndex !== currentDayIndex`, Start button is not rendered.
   - Add: when future day, "Preview only" (or equivalent) message is shown.

2. **LockedDayCard.test.tsx**
   - Add: when `onSelect` is provided, click triggers `onSelect`.

3. **E2E**
   - Add: select future day → see preview → no Start button; back to dashboard works.

---

## File Reference Summary

| Concern | File Path |
|---------|-----------|
| Current day logic | `src/services/planService.ts` |
| Day selection, routing | `src/views/Dashboard.tsx` |
| Day list | `src/components/day/DayListSection.tsx` |
| Day card routing | `src/components/day/TrainingDayCard.tsx` |
| Locked (future) card | `src/components/day/LockedDayCard.tsx` |
| Session preview | `src/components/session/SessionPreviewSection.tsx` |
| Hold/breathe breakdown | `src/components/session/SessionBreakdown.tsx`, `PhaseBreakdownItem.tsx` |
| Timeline builder | `src/utils/buildSessionTimeline.ts` |
| Start session handler | `src/contexts/TrainingContext.tsx` |
| Start CTA | `src/components/session/StartSessionCTA.tsx` |
| Day route | `app/day/[dayId]/page.tsx` |

---

## Dependencies

- Phase 19 (Create Plan in Settings) is a dependency per ROADMAP.
- Uses existing plan schema, `day_id`, completions, and routing; no schema changes needed.
- Phase 20 can be implemented independently — preview works with bundled plans.
