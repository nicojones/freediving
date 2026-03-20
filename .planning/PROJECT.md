# Freediving Breathhold Trainer

## What This Is

A PWA for training freediving breathholds — a simple website that runs well on phone and browser, installable as an app. Users log in (username/password, pre-defined, no registration), pick a day from their training plan, read what the session contains, then lie down with eyes closed and follow audio cues through hold/breathe intervals. Progress is stored on the backend (SQLite) so it syncs across devices. Training plans are defined in JSON and managed by the admin (no in-app plan editor).

## Core Value

User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [x] User can log in with username/password (pre-defined users, no registration)
- [x] User can view and select any day in the current training plan
- [x] App defaults to "current" day: first non-completed day, or today's scheduled day if all previous are done
- [x] User can read the session structure (hold/breathe intervals) before starting
- [x] User can start a session and follow audio cues: "Hold", "Prepare for hold" (10s before hold), "30 seconds" (only when recovery ≥ 31s, at 30s remaining), "Breathe!" (when hold ends)
- [x] No audio during the breathhold itself
- [x] App records session completion per user per day
- [x] Admin can add/modify training plans via JSON (monthly plans, day sequences)
- [ ] Responsive layout (mobile-first)
- [ ] PWA installable, works offline

### Out of Scope

- User registration or sign-up — users are pre-defined, admin configures credentials
- Records or best times — progress is "what's next", not performance metrics
- In-app plan editor — plans come from JSON
- Audio generation — user provides audio files

## Context

- Freediving breathhold training uses alternating hold and breathe (recovery) intervals
- Sessions are done daily; users need to know which day to do next
- Typical use: read plan → lie down → eyes closed → follow audio
- User will provide audio files for cues

## Constraints

- **Platform**: PWA (web app; runs well on phone and browser; installable)
- **Backend**: API + SQLite for progress and auth
- **Storage**: SQLite on server; progress syncs across devices
- **Users**: Few, pre-defined (username/password, no registration)
- **Plans**: JSON format, admin-managed

## Key Decisions

| Decision          | Rationale                                                 | Outcome   |
| ----------------- | --------------------------------------------------------- | --------- |
| PWA over native   | Single codebase, installable, works on phone + browser    | — Pending |
| PWA + backend     | Fetch/store data server-side; cross-device progress       | — Pending |
| Pre-defined users | Small user set; username/password, no sign-up flow        | — Pending |
| JSON for plans    | Admin uploads/modifies, no in-app editor                  | — Pending |
| SQLite on server  | Progress and auth; survives restart, syncs across devices | — Pending |

---

_Last updated: 2025-03-19 after initialization_
