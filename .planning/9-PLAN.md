# Phase 9: Refactor Code — Executable Plan

---

phase: 09-refactor-code
plans:

- id: "01"
  tasks: 4
  files: 8
  depends_on: [08-session-ux]
  type: execute
  wave: 1
  files_modified:
- src/services/planService.ts
- src/contexts/TrainingContext.tsx
- src/hooks/useSessionEngine.ts
- src/pages/Dashboard.tsx
- src/components/DayListSection.tsx
- src/components/SessionPreviewSection.tsx
  autonomous: false
  requirements: []
  user_setup: []
  must_haves:
  truths: - "Refactoring scope and targets defined in plan" - "Code structure improved without changing user-facing behavior" - "Components under ~150 lines; logic extracted to utils or hooks" - "No duplication; reusable helpers in src/utils"
  artifacts: - path: src/services/planService.ts
  provides: "getDayId(plan, dayIndex)"
  contains: "getDayId" - path: src/hooks/useSessionEngine.ts
  provides: "useSessionEngine hook"
  contains: "useSessionEngine" - path: src/components/DayListSection.tsx
  provides: "Day list UI section"
  contains: "DayListSection" - path: src/components/SessionPreviewSection.tsx
  provides: "Session preview UI section"
  contains: "SessionPreviewSection"
  key_links: - from: src/pages/Dashboard.tsx
  to: src/components/DayListSection.tsx
  via: "renders DayListSection"
  pattern: "DayListSection" - from: src/pages/Dashboard.tsx
  to: src/components/SessionPreviewSection.tsx
  via: "renders SessionPreviewSection"
  pattern: "SessionPreviewSection" - from: src/contexts/TrainingContext.tsx
  to: src/hooks/useSessionEngine.ts
  via: "uses useSessionEngine for session logic"
  pattern: "useSessionEngine"

---

## Objective

Improve code quality through refactoring: add plan day ID helper, extract session engine hook, and split Dashboard into section components. No user-facing behavior changes.

**Purpose:** Reduce technical debt, improve maintainability, eliminate repeated casts.

**Principles:**

- Components stay under ~150 lines; split when larger.
- Pure logic → `src/utils`; React state/effects → `src/hooks`.
- No duplication; reusable helpers in utils.

**Output:** getDayId in planService; useSessionEngine hook; DayListSection, SessionPreviewSection components.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/9-CONTEXT.md
- @.planning/phases/09-refactor-code/09-RESEARCH.md

**Existing:** Phases 1–8 complete. TrainingContext ~302 lines; Dashboard ~222 lines; repeated `(plan[i] as { id?: string })?.id` in 4+ places.

**Design decisions (from 9-CONTEXT):**

- getDayId(plan, dayIndex) centralizes day ID access
- useSessionEngine encapsulates timer + audio wiring
- DayListSection and SessionPreviewSection simplify Dashboard layout

---

## Plan 01: Refactor Code

### Task 1: Add getDayId to planService

**Files:** `src/services/planService.ts`, `src/pages/Dashboard.tsx`, `src/contexts/TrainingContext.tsx`

**Action:**

1. Add to `src/services/planService.ts`:
   ```ts
   /** Returns the day id at the given index, or null if missing/invalid. */
   export function getDayId(plan: Plan, dayIndex: number): string | null {
     if (!Array.isArray(plan) || dayIndex < 0 || dayIndex >= plan.length) return null;
     const day = plan[dayIndex];
     if (day == null || typeof day !== 'object' || !('id' in day)) return null;
     return (day as { id: string }).id;
   }
   ```
2. In `src/pages/Dashboard.tsx`:
   - Import `getDayId` from planService
   - Replace `day != null && 'id' in day ? (day as { id: string }).id : null` in handleSelectDay with `getDayId(plan, index)`
   - Replace `(plan[selectedDayIndex!] as { id?: string })?.id` with `getDayId(plan, selectedDayIndex!)`
   - Replace `(plan[i] as { id?: string })?.id` with `getDayId(plan, i)`
3. In `src/contexts/TrainingContext.tsx`:
   - Import `getDayId` from planService
   - In handleCompleteSession: replace day id extraction with `getDayId(p, dayToRecord)`

**Verify:**

```bash
npm run build
# Manual: day selection, session completion, URL routing — all work as before
```

**Done:** getDayId in planService; all day ID casts replaced.

---

### Task 2: Extract useSessionEngine hook

**Files:** `src/hooks/useSessionEngine.ts`, `src/contexts/TrainingContext.tsx`

**Action:**

1. Create `src/hooks/useSessionEngine.ts`:
   - Accept: `{ plan, selectedDayIndex, speedMultiplier, testMode, completions, onSessionComplete }`
   - Return: `{ startSession, abortSession, timerState, sessionStatus, setSpeedMultiplier, audioLoading }`
   - Encapsulate: engineRef, createTimerEngine, createAudioService, preload, wireToTimer, session_complete handler, timer tick interval
   - startSession: guard hasCompletedToday, getPhasesForDay; create engine, preload audio, wire, start; set sessionStatus 'running'
   - session_complete: stop engine, set 'awaitingCompletionConfirm', setTimerState(null)
   - abortSession: stop engine, set 'idle'
   - setSpeedMultiplier: update state + engineRef.current?.setSpeedMultiplier
2. Update `src/contexts/TrainingContext.tsx`:
   - Import useSessionEngine
   - Call useSessionEngine with plan, selectedDayIndex, speedMultiplier, testMode, completions, onSessionComplete (no-op; completion flow handled by handleCompleteSession)
   - Replace handleStartSession, handleAbortSession, timerState, sessionStatus, setSpeedMultiplier, audioLoading with hook values
   - Keep handleCompleteSession, sessionDayIndex, sessionDayIndexRef in TrainingContext (handleCompleteSession needs plan, navigate, recordCompletion)
   - Ensure sessionDayIndexRef is set before startSession; pass it to hook or have hook accept setSessionDayIndex callback
   - Hook needs to set sessionDayIndex when starting — pass `setSessionDayIndex` as dependency or have TrainingContext set it in a wrapper that calls startSession

**Hook design:**

- `useSessionEngine()` returns: `{ startSession(phases, options), abortSession, timerState, sessionStatus, setSpeedMultiplier, audioLoading }`
- `startSession(phases, { speedMultiplier?, relaxationSecondsOverride? })` is async: preloads audio, creates engine, wires to timer, starts. On session_complete: stop engine, set sessionStatus 'awaitingCompletionConfirm'.
- TrainingContext keeps sessionDayIndex, sessionDayIndexRef. handleStartSession: guard, getPhasesForDay, setSessionDayIndexRef + setSessionDayIndex, then call hook.startSession(phases, options). handleCompleteSession unchanged (uses sessionDayIndexRef, plan, recordCompletion).

**Verify:**

```bash
npm run build
# Manual: start session, run to completion, abort — all work as before
```

**Done:** useSessionEngine encapsulates engine logic; TrainingContext delegates.

---

### Task 3: Extract DayListSection and SessionPreviewSection

**Files:** `src/components/DayListSection.tsx`, `src/components/SessionPreviewSection.tsx`, `src/pages/Dashboard.tsx`

**Action:**

1. Create `src/components/DayListSection.tsx`:
   - Props: `plan`, `completions`, `currentDayIndex`, `onSelectDay`, `getDayId` (or use from planService internally)
   - Renders: section "Training", description, map of TrainingDayCard
   - Import getDayId, isDayCompleted, TrainingDayCard
2. Create `src/components/SessionPreviewSection.tsx`:
   - Props: `plan`, `selectedDayIndex`, `selectedPhases`, `currentDayIndex`, `completions`, `speedMultiplier`, `testMode`, `audioLoading`, `hasCompletedToday`, `onBack`, `onSpeedMultiplierChange`, `onTestModeChange`, `onStartSession`
   - Renders: BackButton, day title, SessionPreviewStats, SpeedMultiplierSelector, test toggle, SessionBreakdown, StartSessionCTA (when selectedDayIndex === currentDayIndex)
   - Import BackButton, SessionBreakdown, SessionPreviewStats, SpeedMultiplierSelector, StartSessionCTA
3. Update `src/pages/Dashboard.tsx`:
   - Replace inline DayListSection content with `<DayListSection plan={plan} completions={completions} currentDayIndex={currentDayIndex} onSelectDay={handleSelectDay} />`
   - Replace inline SessionPreviewSection content with `<SessionPreviewSection ... />`
   - Keep: TopAppBar, progressError, savedMessage, InstallPrompt, BottomNavBar, isPlanComplete message, URL sync, viewMode logic

**Verify:**

```bash
npm run build
# Manual: dashboard, day list, session preview, start session — layout and behavior unchanged
```

**Done:** Dashboard simplified; sections extracted.

---

### Task 4: Integration, Audit, and Cleanup

**Files:** `src/contexts/TrainingContext.tsx`, `src/pages/Dashboard.tsx`, `src/components/DayListSection.tsx`, `src/components/SessionPreviewSection.tsx`, `src/utils/*`

**Action:**

1. Ensure all imports are correct; remove unused imports
2. Ensure TrainingContextValue still exposes all required fields (sessionStatus, timerState, handleStartSession, handleAbortSession, handleCompleteSession, etc.)
3. Run `npm run build` and fix any type/lint errors
4. **Audit for principles:**
   - **Component size:** Any component >150 lines? Split or extract logic to utils/hooks.
   - **Duplication:** Repeated logic across components? Extract to `src/utils` (pure) or `src/hooks` (React).
   - **Utils extraction:** Inline logic that is pure and reusable? Move to `src/utils`.
5. Verify no duplicate or dead code introduced

**Verify:**

```bash
npm run build
npm run dev
# Full flow: login → dashboard → select day → session preview → start → complete/abort
# One-session-per-day, test toggle, recovery ring — all unchanged
```

**Done:** Refactor complete; no behavior change.

---

## Verification

| Success Criterion                     | How to Verify                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Refactoring scope defined             | 9-RESEARCH.md, 9-CONTEXT.md, this plan                                                         |
| Code structure improved               | getDayId removes casts; useSessionEngine reduces TrainingContext; Dashboard sections extracted |
| Component size, utils, no duplication | Task 4 audit; components <150 lines; shared logic in utils/hooks                               |
| No user-facing behavior change        | Manual E2E: login, day select, session run, complete, abort, one-session-per-day               |

---

## Success Criteria

1. **Refactoring scope and targets defined in plan** — ✓ RESEARCH, CONTEXT, PLAN
2. **Code structure improved without changing user-facing behavior** — ✓ getDayId, useSessionEngine, section components

---

## Output

After completion:

- `src/services/planService.ts` — getDayId
- `src/hooks/useSessionEngine.ts` — new hook
- `src/contexts/TrainingContext.tsx` — uses useSessionEngine, getDayId
- `src/components/DayListSection.tsx` — new component
- `src/components/SessionPreviewSection.tsx` — new component
- `src/pages/Dashboard.tsx` — simplified, uses sections

---

## Dependency Graph

```
Task 1 (getDayId)
    │
    ├──> Task 2 (useSessionEngine) — independent
    │
    └──> Task 3 (DayListSection, SessionPreviewSection) — uses getDayId from Task 1
              │
              └──> Task 4 (integration)
```

**Wave 1:** Task 1, Task 2, Task 3 (Task 1 and 2 parallel; Task 3 can use getDayId)
**Wave 2:** Task 4 (integration)

---

## How to Test

1. **Plan day ID**
   - Select days from list; URL updates to `/day/:dayId`
   - Session completion records correct day_id
   - Completed days show checkmark

2. **Session engine**
   - Start session; timer runs; audio cues play
   - Complete session; green ring + Complete session button
   - Abort session; return to dashboard

3. **Dashboard sections**
   - Dashboard shows day list or session preview as before
   - Session preview: stats, speed, test toggle, Start Session
   - No visual or behavioral changes
