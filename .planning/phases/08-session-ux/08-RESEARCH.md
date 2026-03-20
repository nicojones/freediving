# Phase 8: Session UX Enhancements — Research

**Researched:** 2025-03-19  
**Domain:** Session UX (timezone logic, completion flow, timer override, CSS animation)  
**Confidence:** HIGH

## Summary

Phase 8 adds four UX enhancements to the Freediving Breathhold Trainer: (1) one session per day with timezone-aware "today" check, (2) visible completion flow with green ring and explicit "Complete session" button before navigation, (3) test toggle to shorten relaxation from 60s to 3s, and (4) recovery ring breathing animation. All decisions are locked in CONTEXT.md. Use date-fns for "today" comparison (user's local timezone); extend `TimerStartOptions` with `relaxationSecondsOverride`; add `awaitingCompletionConfirm` session state; use opacity-based CSS pulse for recovery ring with `prefers-reduced-motion` fallback.

**Primary recommendation:** Implement in order: timezone helper → completion flow state → timer override → recovery animation. Add date-fns if not present.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **One Session Per Day:** User cannot start a new session if they already completed one today. "Today" = user's local date (timezone-aware). Compare `completed_at` timestamps to today's date range. UI: disable/hide "Start session" when blocked; show "You've already trained today".

2. **Visible Completion / Save Flow:** After last step, do NOT auto-navigate. Show green glowing ring (similar to hold's `focus-glow` but green) + "Complete session" button. User clicks → record completion → navigate to `/session/complete`. Flow: `session_complete` event → completion UI (green ring + button) → user clicks → save + navigate.

3. **Test Toggle:** Override step 1 (relaxation) for faster testing. When on: 3 seconds instead of 60. Clearly labeled "Test mode" (settings or session preview). Only affects relaxation.

4. **Recovery Ring Animation:** Faint glowing ring with "breathing" animation. Base: faint blue `rgba(82, 218, 211, 0.15)`. Animation: subtle pulse (opacity or scale) for calm recovery.

### Claude's Discretion

- Exact placement of test toggle (settings vs session preview)
- Green glow intensity (celebratory but not overwhelming)

### Deferred Ideas (OUT OF SCOPE)

- Volume control during session (SESS-08)
- Session-complete audio cue (SESS-09)
- Changing hold or recovery durations beyond test override
- Migration or backend schema changes

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID        | Description                                                    | Research Support                                                                             |
| --------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| SESS-08-1 | One session per day: block start if completed today            | `hasCompletedToday` + date-fns `isSameDay`; guard in `handleStartSession`                    |
| SESS-08-2 | Visible completion flow: green ring + button, no auto-navigate | `awaitingCompletionConfirm` state; SessionRouteGuard update; ActiveSessionView completion UI |
| SESS-08-3 | Test toggle: 3s relaxation when on                             | `relaxationSecondsOverride` in TimerStartOptions; buildTimeline override                     |
| SESS-08-4 | Recovery ring: faint blue + breathing animation                | `.recovery-breathe` CSS; opacity keyframes; prefers-reduced-motion                           |

</phase_requirements>

---

## Standard Stack

### Core

| Library      | Version | Purpose                      | Why Standard                                                                              |
| ------------ | ------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| date-fns     | ^4.1    | Timezone-aware "today" check | STACK.md recommends; lightweight; `isSameDay` uses local time by default for Date objects |
| React        | 19.x    | UI                           | Existing                                                                                  |
| Tailwind CSS | 4.x     | Styling                      | Existing                                                                                  |

### Supporting

| Library      | Version | Purpose           | When to Use                                                                  |
| ------------ | ------- | ----------------- | ---------------------------------------------------------------------------- |
| @date-fns/tz | ^1.4    | Explicit timezone | Only if comparing in non-local timezone; NOT needed for "user's local today" |

**Installation:**

```bash
npm install date-fns
```

**Version verification:** date-fns 4.1.0 (npm registry, 2025). Project does not currently have date-fns in package.json; add per STACK.md.

---

## Architecture Patterns

### Recommended Changes

| Area                       | Change                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/utils/completions.ts` | Add `hasCompletedToday(completions: Completion[]): boolean`                                           |
| `TrainingContext`          | Add `SessionStatus: 'awaitingCompletionConfirm'`; guard `handleStartSession` with `hasCompletedToday` |
| `SessionRouteGuard`        | Allow `sessionStatus === 'awaitingCompletionConfirm'` on `/session`                                   |
| `ActiveSessionView`        | Branch on `sessionStatus === 'awaitingCompletionConfirm'` → green ring + "Complete session" button    |
| `timerEngine`              | Add `relaxationSecondsOverride?: number` to `TimerStartOptions`                                       |
| `index.css`                | Add `.recovery-breathe`, `.completion-glow`                                                           |

### Pattern 1: Timezone-Aware "Today" Check

**What:** Compare Unix `completed_at` (seconds) to user's local "today".  
**When:** Before allowing session start.  
**Key:** `new Date(unixSeconds * 1000)` and `new Date()` both use browser's local timezone. date-fns `isSameDay` compares in local time by default.

```typescript
// Source: date-fns docs, STACK.md
import { isSameDay } from 'date-fns';

export function hasCompletedToday(completions: { completed_at: number }[]): boolean {
  const now = new Date();
  return completions.some((c) => isSameDay(new Date(c.completed_at * 1000), now));
}
```

### Pattern 2: Completion Flow State Machine

**What:** `session_complete` → set state, show UI, wait for user click → save + navigate.  
**When:** Replace immediate navigate in `engine.on('session_complete', …)`.

```
running → session_complete → awaitingCompletionConfirm (stay on /session)
awaitingCompletionConfirm → user clicks "Complete session" → recordCompletion → complete → navigate
```

### Pattern 3: Timer Engine Override

**What:** Pass `relaxationSecondsOverride` into `engine.start(phases, options)`.  
**When:** Test mode enabled.  
**Implementation:** `buildTimeline` reads override; falls back to `RELAXATION_SECONDS`.

```typescript
// timerEngine.ts
interface TimerStartOptions {
  speedMultiplier?: number;
  relaxationSecondsOverride?: number;
}

function buildTimeline(phases: Phase[], relaxationSeconds?: number) {
  const relaxationMs = (relaxationSeconds ?? RELAXATION_SECONDS) * 1000;
  // ...
}
```

### Anti-Patterns to Avoid

- **Don't use UTC for "today":** User's local date is required; UTC would misclassify near-midnight completions.
- **Don't auto-navigate on session_complete:** User must explicitly confirm; avoids accidental loss and invisible "Saved" state.
- **Don't animate box-shadow for breathing:** Use opacity or transform for performance; box-shadow causes repaints.

---

## Don't Hand-Roll

| Problem                              | Don't Build                | Use Instead                | Why                                      |
| ------------------------------------ | -------------------------- | -------------------------- | ---------------------------------------- |
| "Same calendar day" check            | Manual date math           | date-fns `isSameDay`       | DST, leap years, edge cases              |
| Timezone handling for "user's local" | Server TZ or manual offset | `new Date()` + `isSameDay` | Browser provides local TZ; no extra deps |
| Breathing animation                  | JS requestAnimationFrame   | CSS `@keyframes` + opacity | GPU-friendly, no JS overhead             |

---

## Common Pitfalls

### Pitfall 1: Unix Timestamp Unit Mismatch

**What goes wrong:** `completed_at` is seconds; `new Date(ts)` expects milliseconds.  
**Why it happens:** API returns Unix seconds; JS Date uses ms.  
**How to avoid:** Always multiply by 1000: `new Date(completed_at * 1000)`.  
**Warning signs:** Completions from "yesterday" showing as today, or vice versa near midnight.

### Pitfall 2: SessionRouteGuard Blocks Completion UI

**What goes wrong:** After `session_complete`, status changes; guard redirects to `/` before user sees completion UI.  
**Why it happens:** Guard only allows `sessionStatus === 'running'`.  
**How to avoid:** Allow `sessionStatus === 'awaitingCompletionConfirm'` for `/session` route.  
**Warning signs:** User never sees green ring or "Complete session" button.

### Pitfall 3: Box-Shadow Animation Jank

**What goes wrong:** Animating `box-shadow` for breathing effect causes layout thrash on mobile.  
**Why it happens:** box-shadow triggers repaint, not just composite.  
**How to avoid:** Use `opacity` or `transform: scale()` for pulse; keep box-shadow static.  
**Warning signs:** Stutter during recovery phase on low-end devices.

### Pitfall 4: Test Toggle Persists Across Sessions

**What goes wrong:** User leaves test mode on, runs real session with 3s relaxation.  
**Why it happens:** Toggle stored in context/localStorage without clear reset.  
**How to avoid:** Default off; consider session-scoped state (reset when leaving session preview).  
**Warning signs:** Short relaxation when user expected full 60s.

---

## Code Examples

### hasCompletedToday (completions.ts)

```typescript
import { isSameDay } from 'date-fns';

export function hasCompletedToday(completions: { completed_at: number }[]): boolean {
  const now = new Date();
  return completions.some((c) => isSameDay(new Date(c.completed_at * 1000), now));
}
```

### Completion Flow in TrainingContext

```typescript
engine.on('session_complete', () => {
  engine.stop();
  engineRef.current = null;
  setSessionStatus('awaitingCompletionConfirm'); // Do NOT navigate yet
  setTimerState(null);
  // recordCompletion happens on button click
});
```

### Handle Complete Session (user clicks button)

```typescript
const handleCompleteSession = useCallback(async () => {
  const dayToRecord = sessionDayIndexRef.current;
  if (dayToRecord !== null && plan) {
    const day = plan[dayToRecord];
    const dayId = day?.id;
    if (dayId) {
      const result = await recordCompletion('default', dayId, dayToRecord);
      if ('ok' in result) {
        setSessionStatus('complete');
        setSessionDayIndex(null);
        navigate('/session/complete');
        // ... update completions, savedMessage, etc.
      }
    }
  }
}, [plan, navigate]);
```

### Timer Engine Override

```typescript
// timerEngine.ts - buildTimeline
function buildTimeline(phases: Phase[], options?: { relaxationSeconds?: number }) {
  const relaxationMs = (options?.relaxationSeconds ?? RELAXATION_SECONDS) * 1000;
  // ...
}

// start()
function start(phasesInput: Phase[], options?: TimerStartOptions) {
  timeline = buildTimeline(phasesInput, {
    relaxationSeconds: options?.relaxationSecondsOverride,
  });
  // ...
}
```

### Recovery Breathing Animation (index.css)

```css
.recovery-breathe {
  box-shadow: 0 0 60px rgba(82, 218, 211, 0.15);
  animation: recovery-pulse 3s ease-in-out infinite;
}

@keyframes recovery-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .recovery-breathe {
    animation: none;
    opacity: 0.8;
  }
}
```

### Completion Glow (green variant)

```css
.completion-glow {
  box-shadow: 0 0 80px rgba(82, 218, 211, 0.35);
}
```

---

## State of the Art

| Old Approach                           | Current Approach                   | When Changed | Impact                                     |
| -------------------------------------- | ---------------------------------- | ------------ | ------------------------------------------ |
| Immediate navigate on session_complete | Explicit confirm + save + navigate | Phase 8      | User sees completion, no invisible "Saved" |
| Solid border for recovery              | Faint blue + breathing animation   | Phase 8      | Calmer recovery UX                         |
| Fixed RELAXATION_SECONDS               | Override via TimerStartOptions     | Phase 8      | Test mode without code changes             |

---

## Open Questions

1. **Test toggle placement**
   - What we know: CONTEXT says "settings or session preview", clearly labeled "Test mode".
   - What's unclear: Which is better for discoverability vs. accidental activation.
   - Recommendation: Session preview (near Start Session) — testers are there; settings users may forget to turn off.

2. **Green glow intensity**
   - What we know: CONTEXT suggests `rgba(82, 218, 211, …)` (primary teal), celebratory.
   - What's unclear: Exact opacity for "glowing" vs. "subtle".
   - Recommendation: Start with `0.35` (stronger than hold's `0.15`); adjust in implementation.

---

## Validation Architecture

### Test Framework

| Property           | Value         |
| ------------------ | ------------- |
| Framework          | None detected |
| Config file        | —             |
| Quick run command  | —             |
| Full suite command | —             |

### Phase Requirements → Test Map

| Req                | Behavior                               | Test Type | Automated Command | File Exists? |
| ------------------ | -------------------------------------- | --------- | ----------------- | ------------ |
| One session/day    | Block start when completed today       | unit      | —                 | ❌ Wave 0    |
| hasCompletedToday  | Correct for local midnight edge cases  | unit      | —                 | ❌ Wave 0    |
| Completion flow    | No auto-navigate; button triggers save | manual    | —                 | —            |
| Test toggle        | Relaxation 3s when on                  | manual    | —                 | —            |
| Recovery animation | Faint blue + pulse                     | manual    | —                 | —            |

### Sampling Rate

- **Per task commit:** N/A (no tests)
- **Per wave merge:** N/A
- **Phase gate:** Manual verification of flows

### Wave 0 Gaps

- [ ] No test framework installed
- [ ] `hasCompletedToday` unit tests recommended for timezone edge cases
- [ ] Consider Vitest for future phases: `npm install -D vitest @testing-library/react`

---

## Sources

### Primary (HIGH confidence)

- date-fns 4.1.0 — isSameDay, local timezone behavior
- STACK.md — date-fns for "current day" logic
- 8-CONTEXT.md — locked decisions, code context
- MDN prefers-reduced-motion — accessibility for animations

### Secondary (MEDIUM confidence)

- WebSearch: JavaScript Unix timestamp to local today comparison
- WebSearch: CSS pulse animation performance (opacity vs box-shadow)

### Tertiary (LOW confidence)

- WebSearch: date-fns isSameDay timezone edge cases (resolved: local default is correct for "user's today")

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — date-fns is STACK recommendation; timer/context patterns match existing codebase
- Architecture: HIGH — flow derived from CONTEXT and TrainingContext/ActiveSessionView structure
- Pitfalls: HIGH — Unix ms vs s, box-shadow performance, route guard behavior are well-documented

**Research date:** 2025-03-19  
**Valid until:** 30 days (stable domain)
