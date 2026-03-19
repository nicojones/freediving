# Roadmap: Freediving Breathhold Trainer

**Created:** 2025-03-19
**Granularity:** Standard
**Core Value:** User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

---

## Phases

- [ ] **Phase 1: Plan Service** - Load training plans from JSON, admin can add/modify plans
- [ ] **Phase 2: Progress + Profile Services** - Profile selection, SQLite progress storage, session completion recording
- [ ] **Phase 3: Timer Engine** - Pure state machine with Date-based elapsed time, event emission
- [ ] **Phase 4: Audio Service** - Cue playback on timer events, no audio during hold
- [ ] **Phase 5: Session Runner + Plan/Day Selector** - Day selection, session preview, full session orchestration
- [ ] **Phase 6: PWA + Offline** - Installable, offline, precached audio, responsive mobile-first layout

---

## Phase Details

### Phase 1: Plan Service

**Goal:** App can load and parse training plans from JSON; admin can add or modify plans.

**Depends on:** Nothing (first phase)

**Requirements:** PLAN-01, ADMN-01

**Success Criteria** (what must be TRUE):
1. App loads training plans from JSON files (monthly plans, day sequences)
2. Parsed plans expose hold/breathe intervals per day
3. Admin can add or modify plans by updating JSON (no in-app editor)

**Plans:** TBD

---

### Phase 2: Progress + Profile Services

**Goal:** User can select a profile; app stores and retrieves progress per profile per day.

**Depends on:** Phase 1 (needs plan structure for "current day" logic)

**Requirements:** PROF-01, PROF-02, SESS-07

**Success Criteria** (what must be TRUE):
1. User can select from pre-defined profiles (no registration)
2. App persists progress in SQLite (IndexedDB-backed)
3. App records session completion per profile per day
4. Progress survives browser restart

**Plans:** TBD

---

### Phase 3: Timer Engine

**Goal:** Accurate timing engine that emits events at correct moments; no drift, no cues during hold.

**Depends on:** Phase 1 (needs session structure for intervals)

**Requirements:** SESS-06

**Success Criteria** (what must be TRUE):
1. Timer uses Date-based elapsed time (not setInterval) for cue accuracy
2. Engine emits events: phase_start, prepare_hold, countdown_30, hold_end, session_complete
3. No events or cues fire during the breathhold itself
4. "30 seconds" event fires only when recovery ≥31s, at 30s remaining
5. Engine is pure logic (no audio or persistence side effects)

**Plans:** TBD

---

### Phase 4: Audio Service

**Goal:** Audio cues play at the correct moments in response to timer events.

**Depends on:** Phase 3 (subscribes to timer events)

**Requirements:** SESS-01, SESS-02, SESS-03, SESS-04, SESS-05

**Success Criteria** (what must be TRUE):
1. User hears "Hold" at hold start
2. User hears "Prepare for hold" 10 seconds before each hold
3. User hears "30 seconds" when recovery ≥31s, at 30s remaining
4. User hears "Breathe!" exactly when hold ends
5. No audio plays during the breathhold itself

**Plans:** TBD

---

### Phase 5: Session Runner + Plan/Day Selector

**Goal:** User can select day, view session structure, and run a full session with audio guidance.

**Depends on:** Phase 1, 2, 3, 4

**Requirements:** PLAN-02, PLAN-03, PLAN-04

**Success Criteria** (what must be TRUE):
1. User can view session structure (hold/breathe intervals) before starting
2. User can select any day in the current plan
3. App defaults to "current" day: first non-completed day, or today's scheduled day if all previous are done
4. User can start a session and complete it with all audio cues
5. Session completion is recorded for the selected profile and day

**Plans:** TBD

---

### Phase 6: PWA + Offline

**Goal:** App is installable, works offline, and audio plays without network.

**Depends on:** Phase 5 (asset list stable after core features)

**Requirements:** PWA-01, PWA-02, PWA-03, PWA-04

**Success Criteria** (what must be TRUE):
1. User can install the app as a PWA (Add to Home Screen)
2. App loads and functions when offline
3. Audio cue files play when offline (precached)
4. Layout is responsive and mobile-first

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plan Service | 0/0 | Not started | - |
| 2. Progress + Profile Services | 0/0 | Not started | - |
| 3. Timer Engine | 0/0 | Not started | - |
| 4. Audio Service | 0/0 | Not started | - |
| 5. Session Runner + Plan/Day Selector | 0/0 | Not started | - |
| 6. PWA + Offline | 0/0 | Not started | - |

---

## Coverage

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓
