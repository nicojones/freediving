# Requirements: Freediving Breathhold Trainer

**Defined:** 2025-03-19
**Core Value:** User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Profiles

- [x] **PROF-01**: User can log in with username/password (pre-defined users, no registration)
- [x] **PROF-02**: App stores progress per profile (server-side; syncs across devices)

### Plan & Day Selection

- [x] **PLAN-01**: App loads training plans from JSON
- [x] **PLAN-02**: User can view session structure (hold/breathe intervals) before starting
- [x] **PLAN-03**: User can select any day in the current plan
- [x] **PLAN-04**: App defaults to "current" day: first non-completed day, or today's scheduled day if all previous are done

### Session Execution

- [x] **SESS-01**: User can start a session and hear "Hold" at hold start
- [x] **SESS-02**: User hears "Prepare for hold" 10 seconds before each hold
- [x] **SESS-03**: User hears "30 seconds" when recovery ≥31s, at 30s remaining
- [x] **SESS-04**: User hears "Breathe!" exactly when hold ends
- [x] **SESS-05**: No audio plays during the breathhold itself
- [x] **SESS-06**: Cue timing uses Date-based elapsed time (not setInterval)
- [x] **SESS-07**: App records session completion per profile per day

### PWA & Offline

- [ ] **PWA-01**: App is installable as PWA
- [ ] **PWA-02**: App works offline
- [ ] **PWA-03**: Audio files are precached for offline playback
- [ ] **PWA-04**: Responsive, mobile-first layout

### Plan Admin

- [ ] **ADMN-01**: Admin can add/modify training plans via JSON (monthly plans, day sequences)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Session UX

- **SESS-08**: Volume control during session
- **SESS-09**: Session-complete audio cue

### Profiles

- **PROF-03**: Profile customization (avatar, name)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature               | Reason                                               |
| --------------------- | ---------------------------------------------------- |
| User registration     | Pre-defined users only; admin configures credentials |
| Records / best times  | Progress is "what's next", not performance metrics   |
| In-app plan editor    | Plans come from JSON                                 |
| Audio generation      | User provides audio files                            |
| Social features       | Not core to training                                 |
| Paywall on core timer | Free to use                                          |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| PROF-01     | Phase 2 | Complete |
| PROF-02     | Phase 2 | Complete |
| PLAN-01     | Phase 1 | Complete |
| PLAN-02     | Phase 5 | Complete |
| PLAN-03     | Phase 5 | Complete |
| PLAN-04     | Phase 5 | Complete |
| SESS-01     | Phase 4 | Complete |
| SESS-02     | Phase 4 | Complete |
| SESS-03     | Phase 4 | Complete |
| SESS-04     | Phase 4 | Complete |
| SESS-05     | Phase 4 | Complete |
| SESS-06     | Phase 3 | Complete |
| SESS-07     | Phase 2 | Complete |
| PWA-01      | Phase 6 | Pending  |
| PWA-02      | Phase 6 | Pending  |
| PWA-03      | Phase 6 | Pending  |
| PWA-04      | Phase 6 | Pending  |
| ADMN-01     | Phase 1 | Complete |

**Coverage:**

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---

_Requirements defined: 2025-03-19_
_Last updated: 2025-03-19 — PWA + backend, username/password auth_
