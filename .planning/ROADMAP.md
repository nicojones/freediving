# Roadmap: Freediving Breathhold Trainer

**Created:** 2025-03-19
**Granularity:** Standard
**Core Value:** User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

---

## Phases

- [x] **Phase 1: Plan Service** - Load training plans from JSON, admin can add/modify plans
- [x] **Phase 2: Progress + Profile Services** - Username/password login, backend + SQLite, session completion, cross-device progress
- [x] **Phase 3: Timer Engine** - Pure state machine with Date-based elapsed time, event emission
- [x] **Phase 4: Audio Service** - Cue playback on timer events, no audio during hold
- [x] **Phase 5: Session Runner + Plan/Day Selector** - Day selection, session preview, full session orchestration
- [x] **Phase 6: PWA + Offline** - Installable, offline, precached audio, responsive mobile-first layout
- [x] **Phase 7: Day IDs + Routing** - Stable day IDs, day/group in plan, URL-based day view, completions by day_id
- [x] **Phase 8: Session UX Enhancements** - One session per day, visible completion flow, test toggle, recovery ring animation
- [x] **Phase 9: Refactor Code** - Code quality improvements and refactoring
- [x] **Phase 10: Reset + Plan Change** - Reset progress from settings; multiple plans; active plan in DB; plan-change warning
- [x] **Phase 11: Refactor Code (Quality Pass)** - clsx correctness; small components; extract sub-components for clarity and testability
- [x] **Phase 12: Tests** - Unit tests across the app; simple E2E tests with isolated test DB
- [x] **Phase 13: Deployment** - GitHub Actions deploy to DigitalOcean on push to main
- [x] **Phase 14: Next.js Migration** - Migrate all the code (express + react) to Next.js
- [ ] **Phase 15: Refactor Code (Cleanup)** - Remove all unused variables, functions, imports; no dead code
- [ ] **Phase 16: Alias Imports, Component Folders & Extended Tests** - ~ alias for src/*; subfolders in components; component tests; E2E for reset, plan change, abort, error paths
- [ ] **Phase 17: Test Controls** - Settings toggle (dev mode) to show/hide test controls; all users can toggle; default OFF; unchecked = invisible
- [x] **Phase 18: Dynamic Version Display & Semantic Release** - Version from package.json on login; fix→patch, feat→minor, chore→no bump on push to main; major manual
- [ ] **Phase 19: Create Plan in Settings** - JSON upload with schema validation; optional AI voice mode (dictate → Gemini → PlanWithMeta JSON)
- [x] **Phase 20: Preview Future Days** - Preview future days in a training plan; no way to execute them

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

**Plans:** `.planning/1-PLAN.md` (5 tasks: scaffold → types → Plan Service → wire App → admin docs)

---

### Phase 2: Progress + Profile Services

**Goal:** User can log in; app stores and retrieves progress per user per day via backend.

**Depends on:** Phase 1 (needs plan structure for "current day" logic)

**Requirements:** PROF-01, PROF-02, SESS-07

**Success Criteria** (what must be TRUE):
1. User can log in with username/password (pre-defined users, no registration)
2. Backend persists progress in SQLite; PWA fetches/stores via API
3. App records session completion per user per day
4. Progress survives browser restart and syncs across devices

**Plans:** `.planning/2-PLAN.md` (Plan 01: 3 tasks backend; Plan 02: 2 tasks frontend)

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

**Plans:** `.planning/3-PLAN.md` (3 tasks: types → timer engine → demo)

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

**Plans:** `.planning/4-PLAN.md` (2 tasks: audioService → wire App)

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

**Plans:** `.planning/5-PLAN.md` (4 tasks: session utils → day selector → preview → session flow)

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

**Plans:** `.planning/6-PLAN.md` (4 tasks: vite-plugin-pwa + manifest + icons + audio precache → offline queue + progressService → InstallPrompt → responsive validation)

---

### Phase 7: Day IDs + Routing

**Goal:** Add stable day IDs to the plan; use them for completions and URL routing. Each day has `id`, `day` (ordinal), and optional `group`; viewing a day puts its id in the URL.

**Depends on:** Phase 6 (PWA + Offline)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):
1. Every day in the plan has `id` (8 hex), `day` (ordinal), and optional `group`
2. Example groups in default-plan: warm-up, deep pool, endurance
3. Completions use `day_id` instead of `day_index` (backend + frontend)
4. Route `/day/:dayId` shows day view; refresh preserves view
5. Invalid dayId redirects to `/`

**Plans:** `.planning/7-PLAN.md` (5 tasks: plan schema + default-plan → backend day_id → planService lookups → progressService/offlineQueue → routing + Dashboard URL sync)

---

### Phase 8: Session UX Enhancements

**Goal:** Improve session flow UX: block duplicate sessions per day, make completion/save more visible, add test toggle, and enhance recovery phase visuals.

**Depends on:** Phase 5 (Session Runner)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):
1. User cannot start a new session if they already completed one today
2. After last step, user sees green glowing ring + "Complete session" button (no auto-leave)
3. Test toggle allows overriding step 1 (relaxation) for faster testing
4. Recovery phase shows faint glowing ring with breathing animation (no ring = faint blue)

**Plans:** `.planning/8-PLAN.md` (5 tasks: hasCompletedToday → completion flow → test toggle → recovery ring → integration)

---

### Phase 9: Refactor Code

**Goal:** Improve code quality through refactoring; reduce technical debt and improve maintainability.

**Depends on:** Phase 8 (Session UX Enhancements)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):
1. Refactoring scope and targets defined in plan
2. Code structure improved without changing user-facing behavior

**Plans:** `.planning/9-PLAN.md` (4 tasks: getDayId → useSessionEngine → DayListSection/SessionPreviewSection → integration)

---

### Phase 10: Reset + Plan Change

**Goal:** Allow resetting progress from settings; support multiple training plans with active plan stored in DB; plan structure becomes `{id, name, description, days}`; changing plan triggers warning that progress will be reset.

**Depends on:** Phase 9 (Refactor Code)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):
1. User can reset progress from the settings page
2. Multiple plans exist in `src/data`; plan structure is `{id, name, description, days: [...]}` (not array)
3. Active training plan is stored per user in the DB
4. Settings page has a dropdown to select plan; changing plan shows warning that progress will be reset

**Plans:** `.planning/10-PLAN.md` (Plan 01: 3 tasks; Plan 02: 3 tasks)

---

### Phase 11: Refactor Code (Quality Pass)

**Goal:** Improve code quality through a second refactor pass: enforce clsx correctness, keep components logically small, and extract even small UI blocks into sub-components for clarity and testability.

**Depends on:** Phase 10 (Reset + Plan Change)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):
1. clsx used correctly for all conditional class names (no string concatenation or inline ternaries where clsx fits)
2. Components stay logically small; no component exceeds ~150 lines
3. Small UI blocks (e.g. status banners, inline messages) extracted to named sub-components for clarity and testability

**Plans:** `.planning/11-PLAN.md` (6 tasks: rules of hooks + StatusBanner → constants → lodash/type-fest → clsx audit → SettingsView sections → size audit)

---

### Phase 12: Tests

**Goal:** Add unit tests across the application; add simple E2E tests that use an isolated test database (never touch user data).

**Depends on:** Phase 11 (Refactor Code Quality Pass)

**Requirements:** (Enhancement — quality assurance)

**Success Criteria** (what must be TRUE):
1. Unit test framework installed and configured (e.g. Vitest)
2. Pure logic (timer engine, plan service, utils) covered by unit tests
3. Critical services and components have unit tests
4. E2E tests run against a separate test DB (in-memory or temp file)
5. E2E tests never modify user's production data

**Plans:** `.planning/12-PLAN.md` (8 tasks: scaffold → timerEngine → planService → utils → services → components → E2E login → E2E session)

---

### Phase 13: Deployment

**Goal:** Deploy the app to DigitalOcean via GitHub Actions. Push to `main` triggers build, zip, SCP to server, and systemctl restart.

**Depends on:** Phase 12 (Tests)

**Requirements:** (Enhancement — production deployment)

**Success Criteria** (what must be TRUE):
1. Server serves Vite dist/ and API in production; CORS configurable via CORS_ORIGIN
2. GitHub Actions deploys on push to main (zip build, conditional node_modules)
3. Post-deploy: unzip, systemctl restart freediving.service
4. Production start script and systemd service template provided

**Plans:** `.planning/13-PLAN.md` (6 tasks: server prod mode → start script → env example → GitHub workflow → systemd template → Vite base)

---

### Phase 14: Next.js Migration

**Goal:** Migrate all the code (Express + React) to Next.js. Single framework for frontend and API.

**Depends on:** Phase 13 (Deployment)

**Requirements:** (Enhancement — framework migration)

**Success Criteria** (what must be TRUE):
1. Express API routes migrated to Next.js API routes or Route Handlers
2. React pages/components migrated to Next.js App Router or Pages Router
3. PWA, offline support, and audio precache preserved
4. Deployment updated for Next.js build output (.next/)
5. All existing functionality works as before

**Plans:** `.planning/14-PLAN.md` (9 tasks)

---

### Phase 15: Refactor Code (Cleanup)

**Goal:** Remove all unused code — variables, functions, imports, exports. No dead code.

**Depends on:** Phase 14 (Next.js Migration)

**Requirements:** (Enhancement — code quality)

**Success Criteria** (what must be TRUE):
1. ESLint configured (flat config) and passing
2. All `if` statements use curly braces
3. No unused variables, functions, imports, or exports in codebase
4. No behavior change; tests pass

**Plans:** `.planning/15-PLAN.md` (5 tasks: ESLint config → curly braces → remove unused code → verify → CI)

---

### Phase 16: Alias Imports, Component Folders & Extended Tests

**Goal:** Add `~` path alias for `src/*`, reorganize `src/components` into subfolders, add component unit tests, and extend E2E coverage with reset progress, plan change, abort session, and non-happy-path flows.

**Depends on:** Phase 15 (Refactor Code Cleanup)

**Requirements:** (Enhancement — code structure and test coverage)

**Success Criteria** (what must be TRUE):
1. `~` alias maps to `src/`; imports like `import X from '~/components/...'` work
2. `src/components` organized into subfolders (e.g. ui, session, day, layout, settings)
3. Component unit tests added for components that lacked them
4. E2E tests cover: reset progress, plan change, abort breathhold session, non-happy-path (invalid login, invalid day, etc.)

**Plans:** `.planning/16-PLAN.md` (6 tasks: ~ alias → component subfolders → component tests → E2E reset → E2E plan change & abort → E2E error paths)

---

### Phase 17: Test Controls

**Goal:** Add Settings toggle (dev mode) to show/hide test controls. All users can toggle; default OFF. When unchecked, test controls are invisible on all pages.

**Depends on:** Phase 16 (Alias Imports, Component Folders & Extended Tests)

**Requirements:** (Enhancement — developer experience)

**Success Criteria** (what must be TRUE):
1. Settings page has a toggle to show/hide test controls (dev mode)
2. All users can see and toggle dev mode; default is OFF
3. When dev mode is unchecked, test controls are invisible on all pages (session preview, etc.)
4. When dev mode is checked, test controls appear as before

**Plans:** `.planning/17-PLAN.md` (4 tasks: dev mode preference → Settings toggle → gate test controls → tests)

---

### Phase 18: Dynamic Version Display & Semantic Release

**Goal:** Display app version dynamically from package.json; automate version bumping on push to main using conventional commits (fix→patch, feat→minor, chore→no bump, major→manual).

**Depends on:** Phase 17 (Test Controls)

**Requirements:** (Enhancement — release automation)

**Success Criteria** (what must be TRUE):
1. Login page shows version from package.json
2. Push to main with fix: bumps patch version
3. Push to main with feat: bumps minor version
4. Push to main with chore: no version bump
5. Major versions updated manually (BREAKING CHANGE or feat!:)

**Plans:** `.planning/18-PLAN.md` (4 tasks: dynamic version → semantic-release config → GitHub Action → sync version)

---

### Phase 19: Create Plan in Settings

**Goal:** Add a feature in Settings to create new training plans. Two paths: (1) JSON file upload with schema validation; (2) optional "PRO" AI voice mode — dictate plan, audio + schema sent to Google Gemini, get valid PlanWithMeta JSON back, auto-fill form, user confirms.

**Depends on:** Phase 18 (Dynamic Version Display & Semantic Release)

**Requirements:** (Enhancement — plan creation)

**Success Criteria** (what must be TRUE):
1. User can upload a JSON file in Settings; file is validated against PlanWithMeta schema
2. Valid plans are stored (DB preferred; public/static considered — pros/cons documented)
3. Invalid JSON shows clear validation errors
4. (Optional) AI mode: microphone icon, dictate → server sends audio + schema to Gemini → returns valid JSON → auto-fills form → user clicks OK to save

**Plans:** `.planning/19-PLAN.md` (Plan 01: JSON upload + validation + storage; Plan 02: AI voice mode — may split into sub-phases if complex)

---

### Phase 20: Preview Future Days

**Goal:** User can preview future days in a training plan (view structure, hold/breathe intervals) but cannot execute them. No start-session or similar action for future days.

**Depends on:** Phase 19 (Create Plan in Settings)

**Requirements:** (Enhancement — plan exploration)

**Success Criteria** (what must be TRUE):
1. User can view session structure (hold/breathe intervals) for future days in the plan
2. User cannot start or execute a session for a future day
3. Future days are clearly differentiated from current/available days (e.g. read-only preview, no start button)

**Plans:** `.planning/20-PLAN.md` (TBD — research and task breakdown)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Plan Service | 5/5 | Complete | 1-PLAN.md |
| 2. Progress + Profile Services | 2/2 | Complete | 2-PLAN.md |
| 3. Timer Engine | 3/3 | Complete | 3-PLAN.md |
| 4. Audio Service | 2/2 | Complete | 4-PLAN.md |
| 5. Session Runner + Plan/Day Selector | 4/4 | Complete | 5-PLAN.md |
| 6. PWA + Offline | 4/4 | Complete | 6-PLAN.md |
| 7. Day IDs + Routing | 5/5 | Complete | 7-PLAN.md |
| 8. Session UX Enhancements | 5/5 | Complete | 8-PLAN.md |
| 9. Refactor Code | 4/4 | Complete | 9-PLAN.md |
| 10. Reset + Plan Change | 6/6 | Complete | 10-PLAN.md |
| 11. Refactor Code (Quality Pass) | 6/6 | Complete | 11-PLAN.md |
| 12. Tests | 8/8 | Complete | 12-PLAN.md |
| 13. Deployment | 6/6 | Complete | 13-PLAN.md |
| 14. Next.js Migration | 9/9 | Complete | 14-PLAN.md |
| 15. Refactor Code (Cleanup) | 0/5 | Pending | 15-PLAN.md |
| 16. Alias Imports, Component Folders & Extended Tests | 0/6 | Pending | 16-PLAN.md |
| 17. Test Controls | 0/4 | Pending | 17-PLAN.md |
| 18. Dynamic Version Display & Semantic Release | 4/4 | Complete | 18-PLAN.md |
| 19. Create Plan in Settings | 0/9 | Pending | 19-PLAN.md |
| 20. Preview Future Days | 5/5 | Complete | 20-PLAN.md |

---

## Coverage

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓
