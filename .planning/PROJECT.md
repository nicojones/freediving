# Freediving Breathhold Trainer

## What This Is

A PWA for training freediving breathholds. Users select a pre-defined profile, pick a day from their training plan, read what the session contains, then lie down with eyes closed and follow audio cues through hold/breathe intervals. Progress is stored locally (SQLite) so the app can surface "what should I focus on today?" based on the last completed session. Training plans are defined in JSON and managed by the admin (no in-app plan editor).

## Core Value

User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can select from pre-defined profiles (no registration)
- [ ] User can view and select any day in the current training plan
- [ ] App defaults to "current" day: first non-completed day, or today's scheduled day if all previous are done
- [ ] User can read the session structure (hold/breathe intervals) before starting
- [ ] User can start a session and follow audio cues: "Hold", "Prepare for hold" (10s before hold), "30 seconds" (only when recovery ≥ 31s, at 30s remaining), "Breathe!" (when hold ends)
- [ ] No audio during the breathhold itself
- [ ] App records session completion per user per day
- [ ] Admin can add/modify training plans via JSON (monthly plans, day sequences)
- [ ] Responsive layout (mobile-first)
- [ ] PWA installable, works offline

### Out of Scope

- User registration or sign-up — profiles are pre-defined
- Records or best times — progress is "what's next", not performance metrics
- In-app plan editor — plans come from JSON
- Audio generation — user provides audio files

## Context

- Freediving breathhold training uses alternating hold and breathe (recovery) intervals
- Sessions are done daily; users need to know which day to do next
- Typical use: read plan → lie down → eyes closed → follow audio
- User will provide audio files for cues

## Constraints

- **Platform**: PWA (web app acceptable)
- **Storage**: SQLite for progress
- **Users**: Few, pre-defined (no registration)
- **Plans**: JSON format, admin-managed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA over native | Single codebase, installable, offline | — Pending |
| Pre-defined users | Small user set, no auth complexity | — Pending |
| JSON for plans | Admin uploads/modifies, no in-app editor | — Pending |
| SQLite | Local storage, no backend required | — Pending |

---
*Last updated: 2025-03-19 after initialization*
