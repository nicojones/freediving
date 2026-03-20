# Phase 4: Audio Service — Executable Plan

---

phase: 04-audio
plans:

- id: "01"
  tasks: 2
  files: 3
  depends_on: [03-timer-engine]
  type: execute
  wave: 1
  files_modified:
- src/services/audioService.ts
- src/App.tsx
  autonomous: true
  requirements: [SESS-01, SESS-02, SESS-03, SESS-04, SESS-05]
  user_setup: []
  must_haves:
  truths: - "User hears 'Hold' at hold start" - "User hears 'Prepare for hold' 10 seconds before each hold" - "User hears '30 seconds' when recovery ≥31s, at 30s remaining" - "User hears 'Breathe!' exactly when hold ends" - "No audio plays during the breathhold itself"
  artifacts: - path: src/services/audioService.ts
  provides: "Audio Service with preload, play, wireToTimer"
  contains: "preload|play|hold.m4a|prepare.m4a|30s.m4a|breathe.m4a" - path: src/App.tsx
  provides: "Session demo with audio cues"
  contains: "audioService|preload|wireToTimer"
  key_links: - from: src/services/audioService.ts
  to: src/services/timerEngine.ts
  via: "Subscribe to timer events for cue playback"
  pattern: "on\\(|phase_start|prepare_hold|countdown_30|hold_end" - from: src/App.tsx
  to: src/services/audioService.ts
  via: "Preload before start; wire to timer"
  pattern: "audioService|createAudioService"

---

## Objective

Implement an Audio Service that plays cue files at the correct moments in response to timer events. No audio during breathhold. Validate before session start.

**Purpose:** Core value — user follows session guided entirely by audio.

**Output:** `src/services/audioService.ts`, App wired to play cues on timer events.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/4-CONTEXT.md
- @.planning/phases/04-audio/04-RESEARCH.md

**Existing:** Phase 3 complete. Timer Engine emits phase_start, prepare_hold, countdown_30, hold_end, session_complete. App.tsx logs events.

**Design decisions (from 4-CONTEXT):**

- Cue files: `public/audio/hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a`
- Event mapping: phase_start(hold) → hold, prepare_hold → prepare, countdown_30 → 30s, hold_end → breathe
- No session-complete cue (v2)
- Preload/validate before session; show explicit error if files missing
- Cues are short; no overlap handling

---

## Plan 01: Audio Service

### Task 1: Audio Service

**Files:** `src/services/audioService.ts`

**Action:**

1. Create `src/services/audioService.ts`:
   - **Cue URLs:** Base `/audio/` (Vite serves from `public/`). Files: `hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a`.
   - **API:**
     - `createAudioService()` returns `{ preload(), play(cue), wireToTimer(engine) }`
     - `preload()`: Returns `Promise<void>`. Create `new Audio(url)` for each cue. For each, set `crossorigin = 'anonymous'`. Await `canplaythrough` or use `loadeddata` + `error` to detect success/failure. If any fail, reject with clear message: "Audio file X failed to load. Ensure hold.m4a, prepare.m4a, 30s.m4a, breathe.m4a exist in public/audio/."
     - `play(cue)`: `cue` is `'hold' | 'prepare' | '30s' | 'breathe'`. Create `new Audio(url)` (or reuse preloaded instances), call `.play()`. Cues are short; no overlap handling.
     - `wireToTimer(engine)`: Subscribe via `engine.on()`:
       - `phase_start` (when `phase === 'hold'`) → `play('hold')`
       - `prepare_hold` → `play('prepare')`
       - `countdown_30` → `play('30s')`
       - `hold_end` → `play('breathe')`
       - `session_complete` → no cue
   - Store preloaded `Audio` instances for reuse (optional; can create fresh each play since cues are short). Preload must validate all 4 files load successfully.

2. **Preload implementation:** Use `Promise.all` over 4 cues. Each cue: `new Audio(url)`, `audio.crossOrigin = 'anonymous'`, return promise that resolves on `canplaythrough` or `loadeddata`, rejects on `error`. Collect first failure message for user.

**Verify:**

```typescript
const audio = createAudioService();
await audio.preload(); // Should resolve if files exist
audio.play('hold'); // Should hear hold cue
```

**Done:** Audio Service created; preload validates; play works for each cue.

---

### Task 2: Wire App to Audio Service

**Files:** `src/App.tsx`

**Action:**

1. In `handleStartSession`:
   - Before creating timer engine: call `createAudioService()`, then `await audioService.preload()`. If preload rejects, set `sessionMessage` to the error message and return (do not start session).
   - Create timer engine as before.
   - Call `audioService.wireToTimer(engine)` instead of (or in addition to) console.log. Remove or keep console.log for debugging—audio playback is primary.
   - Keep session_complete handler: stop engine, set status to complete.
2. Ensure "Start session" is disabled during preload (optional: show "Loading audio..." briefly). If preload fails, re-enable button and show error.

**Verify:**

```bash
npm run dev
# Login, click "Start session (day 0)"
# Expect: hear "Prepare for hold" at 140s, "30 seconds" at 120s, "Hold" at 150s, "Breathe!" at 210s
# No audio during 150–210s (hold phase)
# Repeat for second interval: prepare at 290s, 30s at 270s, hold at 300s, breathe at 360s
# Session complete at 360s (no audio cue)
```

**Negative test:** Rename or remove one audio file (e.g. `hold.m4a`). Click Start. Expect error message about missing file; session does not start.

**Done:** App plays cues at correct times; no audio during hold; preload blocks start on failure.

---

## Verification

| Success Criterion                        | How to Verify                                                 |
| ---------------------------------------- | ------------------------------------------------------------- |
| SESS-01: "Hold" at hold start            | Hear hold.m4a when phase_start(hold) fires                    |
| SESS-02: "Prepare for hold" 10s before   | Hear prepare.m4a when prepare_hold fires                      |
| SESS-03: "30 seconds" when recovery ≥31s | Hear 30s.m4a when countdown_30 fires (day 0 has 90s recovery) |
| SESS-04: "Breathe!" at hold end          | Hear breathe.m4a when hold_end fires                          |
| SESS-05: No audio during hold            | Silence between phase_start(hold) and hold_end                |
| Preload validation                       | Remove a file → error shown, session does not start           |

---

## Success Criteria

1. **User hears "Hold" at hold start** — ✓ phase_start → hold.m4a
2. **User hears "Prepare for hold" 10s before** — ✓ prepare_hold → prepare.m4a
3. **User hears "30 seconds" when recovery ≥31s** — ✓ countdown_30 → 30s.m4a
4. **User hears "Breathe!" at hold end** — ✓ hold_end → breathe.m4a
5. **No audio during breathhold** — ✓ Timer emits no events during hold; no cues

---

## Output

After completion:

- `src/services/audioService.ts` — createAudioService, preload, play, wireToTimer
- `src/App.tsx` — Preload before start; wire Audio Service to timer; play cues

---

## Dependency Graph

```
Task 1 (audioService) ──> Task 2 (wire App)
```

**Sequential:** 1 → 2.
