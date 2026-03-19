# Phase 4: Audio Service — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 4. Audio Service

---

## Decisions

### Audio File Source & Format

- **Location:** `public/audio/` — Cue files are bundled with the app, served at deploy.
- **Format:** m4a (e.g. `hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a`).
- **Source:** Admin/user adds files to repo; no in-app upload. PROJECT: "User will provide audio files."
- **Validation:** Per PITFALLS: validate availability before session start; show clear error if files missing.

### Cue Naming & Mapping

- **Convention:** One file per cue, fixed filenames in `public/audio/`:
  - `hold.m4a` → phase_start (hold)
  - `prepare.m4a` → prepare_hold
  - `30s.m4a` → countdown_30
  - `breathe.m4a` → hold_end
- **Mapping:** Application-level (not in plan JSON). Audio Service subscribes to timer events and plays the corresponding file.

### Playback Behavior

- **Overlap:** Cues are very short; they will never overlap. No interrupt/overlap handling needed.
- **Volume:** Use system/default. Volume control is v2 (SESS-08).
- **Error handling:** Validate before session start; show explicit error if files missing. Per PITFALLS: "Preload and test-play before session start."

### No Audio During Breathhold

- **Strict rule:** No audio plays during the breathhold itself. Timer emits no events during hold; Audio Service plays only on recovery-phase and transition events.
- **Relaxation:** 60s at start is silent (no events, no cues). Per 3-PLAN.
- **Session start cue:** None. First cue is "Prepare for hold" 10s before first hold.

### Session Complete

- **Phase 4 scope:** No session-complete audio cue. SESS-09 is v2.

---

## Event → Cue Mapping

| Timer Event | Cue File | Requirement |
|-------------|----------|-------------|
| phase_start (hold) | hold.m4a | SESS-01 |
| prepare_hold | prepare.m4a | SESS-02 |
| countdown_30 | 30s.m4a | SESS-03 |
| hold_end | breathe.m4a | SESS-04 |
| session_complete | — | (v2) |

---

## Out of Scope for Phase 4

- Session-complete audio cue — v2 (SESS-09)
- Volume control — v2 (SESS-08)
- Overlap/interrupt handling — cues are short, not needed
- Session start / relaxation cues — silent

---

## Traceability

| Requirement | Decision |
|-------------|----------|
| SESS-01 | Play hold.m4a on phase_start (hold) |
| SESS-02 | Play prepare.m4a on prepare_hold |
| SESS-03 | Play 30s.m4a on countdown_30 |
| SESS-04 | Play breathe.m4a on hold_end |
| SESS-05 | No events during hold → no audio during hold |

---

## Code Context

- **Timer Engine:** `src/services/timerEngine.ts` — `createTimerEngine()`, `on(eventType, callback)`: subscribe to phase_start, prepare_hold, countdown_30, hold_end, session_complete.
- **Timer types:** `src/types/timer.ts` — TimerEvent, Phase, TimerState.
- **App integration:** `src/App.tsx` — currently logs events; replaces with Audio Service playback.
- **Audio files:** `public/audio/hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a`.
- **Stack:** HTML5 Audio (STACK.md); PWA precaching for offline in Phase 6.

---

*Context captured from /gsd-discuss-phase 4*
