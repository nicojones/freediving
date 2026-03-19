# Phase 2: Progress + Profile Services — Context

**Created:** 2025-03-19  
**Refined:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 2. Progress + Profile Services

---

## Terminology

| Term | Meaning |
|------|---------|
| **User** | Person logged in via username/password. Pre-defined, no registration. Owns progress. |
| **Plan** | Training plan (days, intervals). Admin-added. User selects one and stays on it. |
| **Profile** | Same as user (PROF-01, PROF-02 use "profile"). |

---

## Architecture

- **Simple website** — Runs well on phone and browser. PWA = installable, responsive, can work offline (Phase 6).
- **PWA frontend** — Client app (React, Vite). Fetches and stores data via backend API.
- **Backend** — Server for persistence. Progress and session data stored server-side (SQLite).
- **Cross-device** — Data persists across devices; user logs in from any device and sees their progress.

---

## Decisions

### User (Profile) Definition

- **Login = username + password** — Simple login page. No profile picker.
- **Pre-defined users** — Fixed set, no self-registration. Admin configures credentials.
- **Initial users:** nico, athena (credentials configured server-side).
- **No guest access** — Must log in with valid credentials. App is friends-only.

### Day Identity for Progress

- **Day = plan day index** — 0-based index in plan.
- **Skipped days = complete** — Skipped days count as done; "current day" = first incomplete.
- **Completion semantics** — Store: which day, when completed.
- **Linear progression** — "Current day" = first day index with no completion record for that user+plan.

### Progress Schema

- **Storage:** SQLite on server (not browser IndexedDB).
- **Completion record:** `user_id`, `plan_id`, `day_index`, `completed_at` (timestamp).
- **Plan ID:** Always store `plan_id` in completion records — even if single plan for now.
- **Uniqueness:** One row per (user_id, plan_id, day_index). Re-completing overwrites `completed_at`.

### Plan Enrollment

- **Each user picks one plan and sticks to it** — Can change plan later (future).
- **For Phase 2:** Implementation can assume single plan per user or simple enrollment table. Exact UX deferred to Phase 5.

### Session Persistence

- **Server-side** — Session and progress stored on backend.
- **Persist who is logged in** — Session survives browser restart and device switch.
- **Cross-device** — User logs in from phone, tablet, or desktop; progress syncs.

### User List / Auth

- **Mechanism:** Username + password. Credentials verified server-side.
- **Storage:** User credentials and hashed passwords on server (secure storage).
- **Initial users:** nico, athena — credentials configured at deploy/setup.
- **No registration flow** — Admin adds users; no in-app sign-up.

---

## Out of Scope for Phase 2

- User customization (avatar, name) — v2
- Plan enrollment UX (which plan user is on) — Phase 5
- "Current day" UI logic — Phase 5 (Phase 2 provides the data layer)
- OAuth / social login — simple username/password only

---

## Traceability

| Requirement | Decision |
|-------------|----------|
| PROF-01 | Pre-defined users; username/password login; no registration |
| PROF-02 | Progress stored per user in server SQLite; survives restart; cross-device |
| SESS-07 | Session completion recorded as (user_id, plan_id, day_index, completed_at) |

---

## Code Context

- **Plan Service:** `src/services/planService.ts` — `loadPlan()`, `getPhasesForDay()`
- **Plan types:** `src/types/plan.ts` — `Plan`, `PlanDay`, `Phase`
- **Plans location:** `src/data/` (e.g. `default-plan.json`)
- **Architecture:** Backend (API + SQLite) + PWA frontend. Auth service, User service, Progress service.
- **Research:** Backend stack (Node/Express + better-sqlite3 or similar), auth approach (sessions, JWT, or simple token).

---

*Context captured from /gsd-discuss-phase 2, refined 2025-03-19*
