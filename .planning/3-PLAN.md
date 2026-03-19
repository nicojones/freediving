# Phase 3: Timer Engine — Executable Plan

---
phase: 03-timer-engine
plans:
  - id: "01"
    tasks: 3
    files: 4
    depends_on: []
type: execute
wave: 1
files_modified:
  - src/types/timer.ts
  - src/services/timerEngine.ts
  - src/App.tsx
autonomous: true
requirements: [SESS-06]
user_setup: []
must_haves:
  truths:
    - "Timer uses Date-based elapsed time (not setInterval accumulation) for cue accuracy"
    - "Engine emits events: phase_start, prepare_hold, countdown_30, hold_end, session_complete"
    - "No events fire during the breathhold itself"
    - "countdown_30 fires only when recovery ≥31s, at 30s remaining"
    - "Engine is pure logic (no audio or persistence side effects)"
  artifacts:
    - path: src/types/timer.ts
      provides: "TimerEvent, Phase, TimerState types"
      contains: "phase_start|prepare_hold|countdown_30|hold_end|session_complete"
    - path: src/services/timerEngine.ts
      provides: "Timer engine with start, on, getState, stop"
      contains: "Date.now|elapsedMs|RELAXATION_SECONDS"
  key_links:
    - from: src/services/timerEngine.ts
      to: src/types/plan.ts
      via: "Phase type for session structure"
      pattern: "Phase"
    - from: src/App.tsx
      to: src/services/timerEngine.ts
      via: "demo: start session, log events"
      pattern: "timerEngine|createTimerEngine"
---

## Objective

Implement a pure Timer Engine that emits events at correct moments using Date-based elapsed time. No drift, no cues during hold. Phase 4 (Audio) will subscribe to events; Phase 5 (Session Runner) will orchestrate.

**Purpose:** Foundation for audio-guided sessions. Cue accuracy depends on this engine.

**Output:** `src/types/timer.ts`, `src/services/timerEngine.ts`, demo in App to verify events.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/research/ARCHITECTURE.md

**Existing:** Phase 1 complete. `getPhasesForDay(plan, dayIndex)` returns `Phase[]`. Phase 2 complete (auth, progress).

**Design decisions (from Phase 3 discussion):**
- **Relaxation:** 60s fixed at start, silent (no events). Not in plan. Future: customizable.
- **First phase:** Always relaxation → then plan phases (hold, recovery, hold, recovery, hold…).
- **Pause/resume:** Out of scope for Phase 3.
- **Tick:** `setInterval(100)` to poll; progression driven by `Date.now()` elapsed.
- **Hold start:** `phase_start` with `phase: 'hold'` triggers "Hold" cue (Phase 4).

**Session timeline:**
```
[60s relaxation, silent] → [phase 0: hold] → [phase 1: recovery] → [phase 2: hold] → … → session_complete
```

**Events:**
- `phase_start` — `{ phase: 'hold'; index: number }` (only when entering hold; recovery has no cue)
- `prepare_hold` — 10s before hold
- `countdown_30` — 30s remaining in recovery, only if recovery ≥31s
- `hold_end` — hold finished
- `session_complete` — all intervals done

---

## Plan 01: Timer Engine

### Task 1: Timer types

**Files:** `src/types/timer.ts`

**Action:**
1. Create `src/types/timer.ts`:
   - `RELAXATION_SECONDS = 60` (constant)
   - `type Phase = 'relaxation' | 'recovery' | 'hold' | 'complete'`
   - `type TimerEvent`:
     - `{ type: 'phase_start'; phase: 'hold'; index: number }`
     - `{ type: 'prepare_hold' }`
     - `{ type: 'countdown_30' }`
     - `{ type: 'hold_end' }`
     - `{ type: 'session_complete' }`
   - `interface TimerState`: `{ phase, intervalIndex, elapsedMs, remainingMs }` (for UI/debugging)

**Verify:** File compiles; types export correctly.

**Done:** Timer types and constant defined.

---

### Task 2: Timer engine service

**Files:** `src/services/timerEngine.ts`

**Action:**
1. Create `src/services/timerEngine.ts`:
   - Import `Phase` from `../types/plan`, types from `../types/timer`.
   - **Core logic:** Given `phases: Phase[]`, `elapsedMs: number`, compute:
     - Current phase (relaxation | recovery | hold | complete)
     - Hold index (0-based; -1 during relaxation)
     - Remaining ms in current phase
     - Events that should have fired since last tick (compare previous elapsed to current; emit any newly crossed thresholds)
   - **Timeline construction:**
     - 0 to `RELAXATION_SECONDS * 1000`: relaxation
     - Then for each phase: sum phase durations in order (hold, recovery, hold…; no recovery after last hold)
     - Total duration = relaxation + sum(phase.duration) for all phases
   - **Event thresholds (per hold):**
     - `prepare_hold`: 10s before hold start
     - `countdown_30`: 30s remaining in recovery, only if preceding recovery phase `duration >= 31`
     - `phase_start(hold)`: at hold start
     - `hold_end`: at hold end
     - `session_complete`: when last hold ends
   - **API:**
     - `createTimerEngine()` returns `{ start(phases), on(event, callback), getState(), stop() }`
     - `start(phases)`: store `startTime = Date.now()`, phases; begin tick loop
     - Tick loop: `setInterval(100)`, each tick: `elapsedMs = Date.now() - startTime`; compute state and events; emit newly crossed events; if phase === 'complete', stop loop
     - `on(eventType, callback)`: subscribe; callbacks receive event payload
     - `getState()`: return current `TimerState` from last tick
     - `stop()`: clear interval, reset
   - Track "last emitted" state to avoid duplicate events (e.g. prepare_hold fired, countdown_30 fired per interval).

**Verify:**
```typescript
// Manual test in console or simple test file
const engine = createTimerEngine()
engine.on('phase_start', (e) => console.log('phase_start', e))
engine.on('prepare_hold', () => console.log('prepare_hold'))
engine.on('countdown_30', () => console.log('countdown_30'))
engine.on('hold_end', () => console.log('hold_end'))
engine.on('session_complete', () => console.log('session_complete'))
engine.start([{ type: 'hold', duration: 60 }, { type: 'recovery', duration: 90 }])
// Timeline: 0–60s relaxation, 60–120s hold, 120–210s recovery
// Expect: prepare_hold at 50s (10s before hold), phase_start(hold,0) at 60s, hold_end at 120s, countdown_30 at 180s (30s remaining in recovery), session_complete at 210s
// Negative: engine.start([{ type: 'hold', duration: 60 }, { type: 'recovery', duration: 30 }]) → countdown_30 must NOT fire (recovery < 31s)
```

**Done:** Timer engine runs; events fire at correct elapsed times; no events during hold.

---

### Task 3: Demo integration in App

**Files:** `src/App.tsx`

**Action:**
1. Add "Start session (day 0)" button below existing content.
2. On click: get phases for day 0 via `getPhasesForDay(plan, 0)`. If null, show message. Else create timer engine, subscribe to all events with `console.log`, call `start(phases)`.
3. Optionally display current state (phase, remaining) in UI during session — e.g. a small status line that updates every 100ms via `getState()`, or a ref that stores latest state. Keep it minimal.
4. When `session_complete` fires, call `engine.stop()` and show "Session complete" message.

**Verify:**
```bash
npm run dev
# Login, click "Start session (day 0)"
# Open devtools console; verify events log at correct times.
# Day 0: hold 60, rec 90, hold 60, rec 90, hold 60. Timeline:
# 0–60s relaxation | 60–120s hold0 | 120–210s rec0 | 210–270s hold1 | 270–360s rec1 | 360–420s hold2
# - prepare_hold at 50s (10s before hold at 60s)
# - phase_start(hold, 0) at 60s
# - hold_end at 120s
# - countdown_30 at 180s (30s remaining in rec0; recovery 90 >= 31)
# - prepare_hold at 200s (10s before hold at 210s)
# - phase_start(hold, 1) at 210s
# - hold_end at 270s
# - countdown_30 at 330s (30s remaining in rec1)
# - prepare_hold at 350s (10s before hold at 360s)
# - phase_start(hold, 2) at 360s
# - hold_end at 420s
# - session_complete at 420s
```

**Done:** Demo proves timer works; events fire correctly; no events during hold.

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| Date-based elapsed time | Tick uses `Date.now() - startTime`; no accumulation from setInterval |
| Events emitted | phase_start, prepare_hold, countdown_30, hold_end, session_complete |
| No events during hold | Console shows no events between phase_start(hold) and hold_end |
| countdown_30 only when recovery ≥31s | Day 0 (90s recovery phase) → fires at 30s remaining; **negative:** `[{ type: 'hold', duration: 60 }, { type: 'recovery', duration: 30 }]` → countdown_30 must NOT fire |
| Pure logic | No audio, no fetch, no localStorage in timerEngine |

---

## Success Criteria

1. **Timer uses Date-based elapsed time** — ✓ `elapsedMs = Date.now() - startTime`; tick is poll-only.
2. **Engine emits events** — ✓ phase_start, prepare_hold, countdown_30, hold_end, session_complete.
3. **No events during hold** — ✓ HOLD phase produces no emissions.
4. **countdown_30 only when recovery ≥31s** — ✓ Guard in logic; test with 30s recovery.
5. **Pure logic** — ✓ No side effects; subscribers handle audio/persistence in Phase 4/5.

---

## Output

After completion:
- `src/types/timer.ts` — TimerEvent, Phase, TimerState, RELAXATION_SECONDS
- `src/services/timerEngine.ts` — createTimerEngine, start, on, getState, stop
- `src/App.tsx` — "Start session (day 0)" demo button, event logging

---

## Dependency Graph

```
Task 1 (types) ──> Task 2 (timer engine)
                        │
                        └──> Task 3 (demo in App)
```

**Sequential:** 1 → 2 → 3.
