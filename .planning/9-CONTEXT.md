# Phase 9: Refactor Code — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for refactoring.  
**Phase:** 9. Refactor Code

---

## Refactoring Principles

1. **Component size** — Keep components under ~150 lines. Split into smaller components or extract logic when exceeding.
2. **Extract to utils or hooks** — Pure logic (no React state/effects) → `src/utils`. React state, effects, callbacks → custom hooks in `src/hooks`.
3. **No duplication** — Shared logic lives in utils or hooks; components compose, not copy-paste.
4. **Reusable helpers → `src/utils`** — Highly reusable, pure functions go to utils. Domain-specific helpers (e.g. plan lookups) stay in services.

---

## Decisions

### 1. Plan Day ID Helper

- **Problem:** `(plan[i] as { id?: string })?.id` repeated in Dashboard, TrainingContext, and isDayCompleted calls.
- **Solution:** Add `getDayId(plan: Plan, dayIndex: number): string | null` to planService.
- **Behavior:** Returns `day.id` when day exists and has `id`; null otherwise. Case-insensitive not needed (internal use).
- **Migration:** Replace all inline casts with `getDayId(plan, index)`.

### 2. TrainingContext — Extract useSessionEngine

- **Problem:** handleStartSession, engine wiring, session_complete handler are ~50 lines; TrainingProvider is dense.
- **Solution:** Extract `useSessionEngine()` custom hook that returns `{ startSession, abortSession, timerState, sessionStatus }` and manages engineRef, timer tick, session_complete.
- **Scope:** Hook encapsulates engine creation, audio wiring, session_complete → awaitingCompletionConfirm. TrainingContext keeps plan/completions/auth; calls hook for session behavior.
- **Boundary:** handleCompleteSession stays in TrainingContext (needs recordCompletion, navigate, plan).

### 3. Dashboard — Extract Section Components

- **Problem:** Dashboard has nested conditionals and ~200 lines; hard to scan.
- **Solution:** Extract:
  - `DayListSection` — Training header + map of TrainingDayCard
  - `SessionPreviewSection` — Back button, day title, SessionPreviewStats, SpeedMultiplierSelector, test toggle, SessionBreakdown, StartSessionCTA
- **Props:** Pass plan, completions, currentDayIndex, selectedDayIndex, handlers from Dashboard.
- **Keep in Dashboard:** Top-level layout, URL sync, viewMode, InstallPrompt, BottomNavBar, progressError/savedMessage.

### 4. Plan Name

- **Decision:** Leave "CO2 Tolerance III" hardcoded for now. Plan JSON has no metadata; adding it would require schema change. Low ROI for refactor phase.

---

## Out of Scope for Phase 9

- Splitting TrainingContext into AuthContext, PlanContext, etc.
- Adding plan metadata (name, version) to JSON
- Test coverage
- Performance optimization

---

## Traceability

| Decision | Outcome |
|----------|---------|
| Plan day ID | getDayId(plan, index) in planService; replace casts |
| Session engine | useSessionEngine hook; TrainingContext delegates |
| Dashboard sections | DayListSection, SessionPreviewSection components |
| Plan name | No change |

---

## Code Context

- **planService vs utils vs hooks:** Plan-domain helpers → planService. Pure reusable helpers → `src/utils`. React state/effects → `src/hooks`.
- **planService:** Add `getDayId`. Used by Dashboard (handleSelectDay, isDayCompleted), TrainingContext (handleCompleteSession), completions (isDayCompleted receives dayId).
- **TrainingContext:** Import useSessionEngine; replace handleStartSession/handleAbortSession/timerState/sessionStatus with hook. handleCompleteSession stays.
- **Dashboard:** Create `DayListSection`, `SessionPreviewSection`; pass props. Keep URL sync, InstallPrompt, BottomNavBar in Dashboard.
