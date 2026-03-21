# Phase 8: Session UX Enhancements — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 8. Session UX Enhancements

---

## Decisions

### 1. One Session Per Day

- **Rule:** User cannot start a new session if they already completed one today.
- **Definition of "today":** User's local date (timezone-aware). Compare `completed_at` timestamps to today's date range.
- **Definition of "completed":** Any completion recorded (via `recordCompletion`). Aborted sessions do not count.
- **UI:** Disable or hide "Start session" when blocked; show explanatory message (e.g. "You've already trained today").
- **Scope:** Per user; completions are already per-profile.

### 2. Visible Completion / Save Flow

- **Problem:** Current "Saved" label is too invisible; user leaves session immediately after last step.
- **Solution:** After the last step, do not auto-navigate. Instead:
  - Keep user on session view (or transition to completion-in-place state)
  - Show **green glowing ring** (similar to hold's `focus-glow` but green)
  - Show **"Complete session"** button
  - User clicks → record completion → navigate to `/session/complete`
- **Ring:** Green glow (e.g. `rgba(82, 218, 211, …)` or green variant); prominent, celebratory.
- **Flow:** `session_complete` event → show completion UI (green ring + button) → user clicks → save + navigate.

### 3. Test Toggle

- **Purpose:** Override step 1 (relaxation phase) for faster testing.
- **Step 1:** Relaxation phase (currently 60s via `RELAXATION_SECONDS`).
- **Override:** When test toggle is on, shorten or skip relaxation (e.g. 3 seconds instead of 60).
- **Visibility:** Toggle should be clearly for testing only (e.g. in settings or session preview, labeled "Test mode").
- **Scope:** Only affects relaxation; does not change hold/recovery durations.

### 4. Recovery Ring Animation

- **Current:** Recovery shows solid `border-surface-container-high` ring; hold shows `border-transparent` + `HoldProgressRing` with primary stroke.
- **Desired:** Recovery = faint glowing ring with "breathing" animation.
- **Visual:**
  - Base state: no ring = **faint blue** (instead of transparent). Ring is always faintly visible.
  - Animation: "breathing" — subtle pulse (opacity or scale) to suggest calm recovery.
- **Implementation:** Faint blue base (e.g. `rgba(82, 218, 211, 0.15)` or similar) + CSS animation for breathing effect.

---

## Out of Scope for Phase 8

- Volume control during session (SESS-08)
- Session-complete audio cue (SESS-09)
- Changing hold or recovery durations beyond test override
- Migration or backend schema changes

---

## Traceability

| Decision            | Outcome                                               |
| ------------------- | ----------------------------------------------------- |
| One session per day | Block start if any completion today; show message     |
| Completion flow     | Green ring + "Complete session" button; no auto-leave |
| Test toggle         | Override relaxation (step 1) for testing              |
| Recovery ring       | Faint blue base + breathing animation                 |

---

## Code Context

- **Completions:** `src/services/progressService.ts` — `Completion.completed_at` (Unix timestamp). Use to check if any completion falls within today.
- **Start session:** `handleStartSession` in `TrainingContext.tsx`; `StartSessionCTA` in Dashboard. Add guard before `handleStartSession`.
- **Helper:** Add `hasCompletedToday(completions: Completion[]): boolean` (compare `completed_at` to local date).
- **Session complete flow:** `TrainingContext.tsx` — `engine.on('session_complete', …)` currently navigates immediately. Change to: set state (e.g. `awaitingCompletionConfirm`), show completion UI in `ActiveSessionView`, then on button click → recordCompletion → navigate.
- **ActiveSessionView:** Ring container at lines 53–70. Hold = `border-transparent focus-glow` + `HoldProgressRing`. Recovery = `border-surface-container-high`. Add completion state: green ring + "Complete session" button. Add recovery ring: faint blue + breathing animation.
- **Test toggle:** Add to `TrainingContext` or session preview. Pass to `createTimerEngine` or `engine.start()` — e.g. `skipRelaxation: true` or `relaxationSecondsOverride: 3`. Timer engine `buildTimeline` uses `RELAXATION_SECONDS`; allow override.
- **Timer engine:** `src/services/timerEngine.ts` — `buildTimeline` uses `RELAXATION_SECONDS`. Add option to override relaxation duration.
- **CSS:** `src/index.css` — `.focus-glow` exists. Add `.recovery-breathe` or similar for breathing animation; add green glow variant for completion.

---

_Context captured from /gsd-discuss-phase 8_
