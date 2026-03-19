# Phase 8: Session UX Enhancements — Executable Plan

---
phase: 08-session-ux
plans:
  - id: "01"
    tasks: 5
    files: 10
    depends_on: [05-session-runner]
type: execute
wave: 1
files_modified:
  - src/utils/completions.ts
  - src/contexts/TrainingContext.tsx
  - src/App.tsx
  - src/components/ActiveSessionView.tsx
  - src/services/timerEngine.ts
  - src/pages/Dashboard.tsx
  - src/components/StartSessionCTA.tsx
  - src/index.css
autonomous: false
requirements: [SESS-08-1, SESS-08-2, SESS-08-3, SESS-08-4]
user_setup:
  - "npm install date-fns"
must_haves:
  truths:
    - "User cannot start a new session if they already completed one today"
    - "After last step, user sees green glowing ring + 'Complete session' button (no auto-leave)"
    - "Test toggle allows 3s relaxation for faster testing"
    - "Recovery phase shows faint glowing ring with breathing animation"
  artifacts:
    - path: src/utils/completions.ts
      provides: "hasCompletedToday(completions)"
      contains: "hasCompletedToday|isSameDay"
    - path: src/contexts/TrainingContext.tsx
      provides: "awaitingCompletionConfirm, handleCompleteSession, testMode"
      contains: "awaitingCompletionConfirm|handleCompleteSession|testMode"
    - path: src/components/ActiveSessionView.tsx
      provides: "Completion UI (green ring + button), recovery ring animation"
      contains: "completion-glow|recovery-breathe|Complete session"
    - path: src/services/timerEngine.ts
      provides: "relaxationSecondsOverride in TimerStartOptions"
      contains: "relaxationSecondsOverride|relaxationSeconds"
  key_links:
    - from: src/pages/Dashboard.tsx
      to: src/utils/completions.ts
      via: "hasCompletedToday guard before Start Session"
      pattern: "hasCompletedToday"
    - from: src/contexts/TrainingContext.tsx
      to: src/services/timerEngine.ts
      via: "relaxationSecondsOverride when testMode"
      pattern: "relaxationSecondsOverride"
---

## Objective

Improve session flow UX: block duplicate sessions per day, make completion/save visible with green ring and explicit button, add test toggle for shorter relaxation, and enhance recovery phase with faint blue breathing ring.

**Purpose:** One session per day; visible completion flow; faster testing; calmer recovery visuals.

**Output:** hasCompletedToday guard; awaitingCompletionConfirm flow; test toggle; recovery + completion ring styles.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/8-CONTEXT.md
- @.planning/phases/08-session-ux/08-RESEARCH.md

**Existing:** Phases 1–5 complete. Session runs with audio; completion recorded on session_complete; immediate navigate to /session/complete. Recovery shows solid border; hold shows focus-glow. No test mode.

**Design decisions (from 8-CONTEXT):**
- One session/day: timezone-aware "today" via date-fns `isSameDay`; block start when any completion today
- Completion flow: session_complete → show green ring + "Complete session" button → user clicks → record + navigate
- Test toggle: 3s relaxation when on; placement in session preview (near Start Session)
- Recovery ring: faint blue base + opacity pulse; prefers-reduced-motion fallback

---

## Plan 01: Session UX Enhancements

### Task 1: hasCompletedToday and One-Session-Per-Day Guard

**Files:** `src/utils/completions.ts`, `src/contexts/TrainingContext.tsx`, `src/pages/Dashboard.tsx`, `src/components/StartSessionCTA.tsx`

**Action:**
1. Install date-fns: `npm install date-fns`
2. Update `src/utils/completions.ts`:
   - Import `isSameDay` from `date-fns`
   - Add `hasCompletedToday(completions: { completed_at: number }[]): boolean`
   - Compare each `completed_at` (Unix seconds) to `new Date()` via `isSameDay(new Date(c.completed_at * 1000), now)`
   - Return `completions.some(...)`
3. Update `src/contexts/TrainingContext.tsx`:
   - Add guard at start of `handleStartSession`: if `hasCompletedToday(completions)` return early (do not start)
   - Expose `hasCompletedToday(completions)` result — add `hasCompletedToday: boolean` to context value (computed from completions)
4. Update `src/pages/Dashboard.tsx`:
   - Get `hasCompletedToday` from `useTraining()`
   - When `hasCompletedToday` and `showSessionPreview` and `selectedDayIndex === currentDayIndex`: show "You've already trained today" message and disabled/hidden Start Session, OR pass `disabled` to StartSessionCTA
5. Update `src/components/StartSessionCTA.tsx`:
   - Add optional `disabled?: boolean` and `disabledMessage?: string` props
   - When disabled: render disabled button with `disabledMessage` or explanatory text ("You've already trained today")

**Verify:**
```bash
# 1. Complete a session for today
# 2. Return to session preview for same day
# 3. Start Session should be disabled; message "You've already trained today" visible
# 4. Next calendar day: Start Session enabled again
```

**Done:** hasCompletedToday in completions.ts; guard in handleStartSession; StartSessionCTA shows disabled state with message.

---

### Task 2: Visible Completion Flow (awaitingCompletionConfirm)

**Files:** `src/contexts/TrainingContext.tsx`, `src/App.tsx`, `src/components/ActiveSessionView.tsx`, `src/index.css`

**Action:**
1. Update `src/contexts/TrainingContext.tsx`:
   - Add `'awaitingCompletionConfirm'` to `SessionStatus` type
   - In `engine.on('session_complete', ...)`: do NOT navigate or record yet. Instead:
     - `engine.stop()`, `engineRef.current = null`
     - `setSessionStatus('awaitingCompletionConfirm')`
     - `setTimerState(null)` (or keep last state for display — per RESEARCH, show completion UI)
     - Do NOT call `recordCompletion` or `navigate` here
   - Add `handleCompleteSession: () => Promise<void>`:
     - Get `sessionDayIndexRef.current` and `plan`
     - Call `recordCompletion('default', dayId, dayToRecord)` (same logic as current session_complete handler)
     - On success: `setSessionStatus('complete')`, `setSessionDayIndex(null)`, `navigate('/session/complete')`, update completions/savedMessage
     - Expose `handleCompleteSession` in context value
2. Update `src/App.tsx`:
   - `SessionRouteGuard`: allow `sessionStatus === 'running'` OR `sessionStatus === 'awaitingCompletionConfirm'` for `/session` route
3. Update `src/components/ActiveSessionView.tsx`:
   - Get `sessionStatus`, `handleCompleteSession` from `useTraining()`
   - When `sessionStatus === 'awaitingCompletionConfirm'`:
     - Show completion UI: green glowing ring (class `completion-glow`) + "Complete session" button
     - Button calls `handleCompleteSession`
     - Hide Abort Session; show only Complete session button
   - Ring container: branch on `sessionStatus === 'awaitingCompletionConfirm'` → apply `completion-glow` class
4. Update `src/index.css`:
   - Add `.completion-glow { box-shadow: 0 0 80px rgba(82, 218, 211, 0.35); }` (green/teal celebratory glow)

**Verify:**
```bash
# 1. Run full session to last step
# 2. session_complete fires → user stays on /session
# 3. Green ring + "Complete session" button visible
# 4. Click "Complete session" → recordCompletion → navigate to /session/complete
```

**Done:** awaitingCompletionConfirm state; no auto-navigate; green ring + button; handleCompleteSession records and navigates.

---

### Task 3: Test Toggle (relaxationSecondsOverride)

**Files:** `src/contexts/TrainingContext.tsx`, `src/services/timerEngine.ts`, `src/pages/Dashboard.tsx`

**Action:**
1. Update `src/services/timerEngine.ts`:
   - Add `relaxationSecondsOverride?: number` to `TimerStartOptions`
   - Change `buildTimeline(phases: Phase[])` to `buildTimeline(phases: Phase[], options?: { relaxationSeconds?: number })`
   - Use `(options?.relaxationSeconds ?? RELAXATION_SECONDS) * 1000` for relaxationMs
   - In `start(phases, options)`: pass `{ relaxationSeconds: options?.relaxationSecondsOverride }` to buildTimeline
2. Update `src/contexts/TrainingContext.tsx`:
   - Add `testMode: boolean` state (default `false`)
   - Add `setTestMode: (v: boolean) => void` to context
   - In `handleStartSession`, when calling `engine.start(phases, ...)`: pass `relaxationSecondsOverride: testMode ? 3 : undefined`
3. Update `src/pages/Dashboard.tsx`:
   - In session preview section (near SpeedMultiplierSelector or StartSessionCTA):
   - Add test toggle: checkbox or switch labeled "Test mode" — "Shorten relaxation to 3s for faster testing"
   - Wire to `testMode` and `setTestMode` from `useTraining()`
   - Place clearly in session preview so testers see it; default off

**Verify:**
```bash
# 1. Enable Test mode in session preview
# 2. Start session
# 3. Relaxation phase should last ~3 seconds (not 60)
# 4. Hold/recovery durations unchanged
```

**Done:** relaxationSecondsOverride in timer; testMode in context; toggle in session preview.

---

### Task 4: Recovery Ring Animation

**Files:** `src/components/ActiveSessionView.tsx`, `src/index.css`

**Action:**
1. Update `src/components/ActiveSessionView.tsx`:
   - Ring container: when `timerState?.phase === 'recovery'` (and not hold, not awaitingCompletionConfirm):
     - Apply `recovery-breathe` class instead of `border-surface-container-high`
     - Base: faint blue ring — use `recovery-breathe` which includes the faint blue box-shadow
   - Logic: `phase === 'hold'` → `border-transparent focus-glow` + HoldProgressRing; `phase === 'recovery'` → `recovery-breathe`; `sessionStatus === 'awaitingCompletionConfirm'` → `completion-glow`
2. Update `src/index.css`:
   - Add `.recovery-breathe`:
     - `box-shadow: 0 0 60px rgba(82, 218, 211, 0.15);`
     - `animation: recovery-pulse 3s ease-in-out infinite;`
   - Add `@keyframes recovery-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }`
   - Add `@media (prefers-reduced-motion: reduce) { .recovery-breathe { animation: none; opacity: 0.8; } }`
   - Ensure recovery ring has faint blue base (border or box-shadow) — RESEARCH says "no ring = faint blue"; ring always faintly visible. Use border with rgba or box-shadow.

**Verify:**
```bash
# 1. Run session; during recovery phase
# 2. Ring shows faint blue with subtle pulse (opacity animation)
# 3. prefers-reduced-motion: reduce → animation disabled, static opacity
```

**Done:** Recovery phase shows faint blue breathing ring; prefers-reduced-motion respected.

---

### Task 5: Integration and Edge Cases

**Files:** `src/contexts/TrainingContext.tsx`, `src/components/ActiveSessionView.tsx`, `src/pages/Dashboard.tsx`

**Action:**
1. Ensure `handleCompleteSession` handles:
   - Offline: use same logic as current (recordCompletion may queue)
   - progressError: set and display
   - dayId missing: set progressError "Day not found"
2. Ensure `ActiveSessionView` when `sessionStatus === 'awaitingCompletionConfirm'`:
   - Does not show timer countdown (timerState is null)
   - Shows celebratory message e.g. "Session complete!" above the button
   - Ring is prominent (completion-glow)
3. Ensure test toggle does not persist across sessions in a confusing way: default off; consider resetting when leaving session preview (optional; RESEARCH says "default off" is sufficient)
4. Add `handleCompleteSession` to TrainingContextValue interface
5. Add `testMode`, `setTestMode`, `hasCompletedToday` to TrainingContextValue interface

**Verify:**
```bash
# Full flow: Start → Relaxation (or 3s if test) → Holds/Recoveries → session_complete
# → Green ring + "Complete session" → Click → /session/complete
# One-session-per-day: complete once → Start disabled for same day
```

**Done:** All four enhancements work together; edge cases handled.

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| One session per day | Complete session → Start disabled; "You've already trained today" |
| Visible completion flow | session_complete → green ring + button; no auto-navigate |
| Test toggle | Test mode on → 3s relaxation; off → 60s |
| Recovery ring | Recovery phase: faint blue + breathing pulse |

---

## Success Criteria

1. **User cannot start if completed today** — ✓ hasCompletedToday guard; disabled CTA with message
2. **Green ring + Complete session button** — ✓ awaitingCompletionConfirm; explicit save before navigate
3. **Test toggle** — ✓ 3s relaxation when on; in session preview
4. **Recovery breathing ring** — ✓ faint blue + opacity pulse; prefers-reduced-motion

---

## Output

After completion:
- `src/utils/completions.ts` — hasCompletedToday
- `src/contexts/TrainingContext.tsx` — awaitingCompletionConfirm, handleCompleteSession, testMode, hasCompletedToday guard
- `src/App.tsx` — SessionRouteGuard allows awaitingCompletionConfirm
- `src/components/ActiveSessionView.tsx` — completion UI, recovery ring
- `src/services/timerEngine.ts` — relaxationSecondsOverride
- `src/pages/Dashboard.tsx` — test toggle, hasCompletedToday → disabled Start
- `src/components/StartSessionCTA.tsx` — disabled + message props
- `src/index.css` — completion-glow, recovery-breathe, recovery-pulse
- `package.json` — date-fns dependency

---

## Dependency Graph

```
Task 1 (hasCompletedToday, one-session guard)
    │
    ├──> Task 2 (completion flow) — parallel
    │
    ├──> Task 3 (test toggle) — parallel
    │
    └──> Task 4 (recovery ring) — parallel
              │
              └──> Task 5 (integration)
```

**Wave 1:** Task 1, Task 2, Task 3, Task 4 (Task 1 blocks Task 2/3/4 only for hasCompletedToday; others independent)
**Wave 2:** Task 5 (integration)

---

## How to Test

1. **One session per day**
   - Log in, complete a session for today.
   - Return to session preview for the same day. "Start Session" should be disabled; "You've already trained today" visible.
   - (Optional) Change system date to tomorrow; Start Session should be enabled.

2. **Visible completion flow**
   - Start session, run to completion (or use test mode for speed).
   - After last step: green glowing ring + "Complete session" button. Do NOT auto-navigate.
   - Click "Complete session" → navigate to /session/complete; completion recorded.

3. **Test toggle**
   - In session preview, enable "Test mode".
   - Start session. Relaxation should last ~3 seconds.
   - Disable test mode; relaxation should be 60s.

4. **Recovery ring**
   - During recovery phase: faint blue ring with subtle breathing pulse.
   - System preference "Reduce motion" → static opacity, no animation.
