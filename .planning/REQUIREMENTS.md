# Requirements: Freediving Breathhold Trainer

**Defined:** 2025-03-19
**Core Value:** User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Profiles

- [ ] **PROF-01**: User can select from pre-defined profiles (no registration)
- [ ] **PROF-02**: App stores progress per profile

### Plan & Day Selection

- [ ] **PLAN-01**: App loads training plans from JSON
- [ ] **PLAN-02**: User can view session structure (hold/breathe intervals) before starting
- [ ] **PLAN-03**: User can select any day in the current plan
- [ ] **PLAN-04**: App defaults to "current" day: first non-completed day, or today's scheduled day if all previous are done

### Session Execution

- [ ] **SESS-01**: User can start a session and hear "Hold" at hold start
- [ ] **SESS-02**: User hears "Prepare for hold" 10 seconds before each hold
- [ ] **SESS-03**: User hears "30 seconds" when recovery ≥31s, at 30s remaining
- [ ] **SESS-04**: User hears "Breathe!" exactly when hold ends
- [ ] **SESS-05**: No audio plays during the breathhold itself
- [ ] **SESS-06**: Cue timing uses Date-based elapsed time (not setInterval)
- [ ] **SESS-07**: App records session completion per profile per day

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

| Feature | Reason |
|---------|--------|
| User registration | Pre-defined profiles only |
| Records / best times | Progress is "what's next", not performance metrics |
| In-app plan editor | Plans come from JSON |
| Audio generation | User provides audio files |
| Social features | Not core to training |
| Paywall on core timer | Free to use |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PLAN-01 | — | Pending |
| PLAN-02 | — | Pending |
| PLAN-03 | — | Pending |
| PLAN-04 | — | Pending |
| SESS-01 | — | Pending |
| SESS-02 | — | Pending |
| SESS-03 | — | Pending |
| SESS-04 | — | Pending |
| SESS-05 | — | Pending |
| SESS-06 | — | Pending |
| SESS-07 | — | Pending |
| PWA-01 | — | Pending |
| PWA-02 | — | Pending |
| PWA-03 | — | Pending |
| PWA-04 | — | Pending |
| ADMN-01 | — | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 0
- Unmapped: 17 ⚠️

---
*Requirements defined: 2025-03-19*
*Last updated: 2025-03-19 after initial definition*
