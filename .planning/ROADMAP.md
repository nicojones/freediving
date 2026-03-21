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
- [x] **Phase 15: Refactor Code (Cleanup)** - Remove all unused variables, functions, imports; no dead code
- [x] **Phase 16: Alias Imports, Component Folders & Extended Tests** - ~ alias for src/\*; subfolders in components; component tests; E2E for reset, plan change, abort, error paths
- [x] **Phase 17: Test Controls** - Settings toggle (dev mode) to show/hide test controls; all users can toggle; default OFF; unchecked = invisible
- [x] **Phase 18: Dynamic Version Display & Semantic Release** - Version from package.json on login; fix→patch, feat→minor, chore→no bump on push to main; major manual
- [x] **Phase 19: Create Plan in Settings** - JSON upload with schema validation; optional AI voice mode (dictate → Gemini → PlanWithMeta JSON)
- [x] **Phase 20: Preview Future Days** - Preview future days in a training plan; no way to execute them
- [x] **Phase 21: UI** - Remove hardcoded text; unify plan name/description in DayListSection; move app name to constants
- [x] **Phase 22: Plans Tab + Settings Cleanup** - Add Plans tab; move plan-related UI from Settings; created_by + delete non-active plans; leave room for explore-without-switching
- [x] **Phase 23: Prettier + Lefthook + CI** - Basic formatter (Prettier); format + lint via lefthook.yml; GitHub workflow aborts if format/lint would change files
- [x] **Phase 24: AI Plan Input Enhancements** - Dynamic prompt from plan types; text/description-to-plan via LLM; optional dedicated plan creation screen
- [x] **Phase 25: Component Library (Radix/Headless UI)** - Add Radix UI or Headless UI; replace custom modals/dialogs; establish primitives for tabs, buttons
- [x] **Phase 26: Plan Creation UX** - Tab (natural language vs JSON); Preview instead of raw JSON; refine flow; confirm modal (name/description)
- [x] **Phase 27: Refactor CreatePlanSection (Component Size)** - Reduce CreatePlanSection component size; prepare for eventual migration to its own page
- [x] **Phase 28: Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback** - Move CreatePlanSection to its own bottom tab (+); allow create and refine via voice and/or text (mix and match); improve Preview feedback so users know when preview was updated after refinement
- [x] **Phase 29: E2E Tests** - Add comprehensive E2E tests; fix flaky create-plan Describe test; add voice/audio create-plan E2E using fixture; add missing unit tests for coverage
- [x] **Phase 30: Dockerize MySQL + Change Database Type** - Migrate from SQLite to MySQL; Dockerize MySQL for dev/local; server has MySQL but lacks "freediving" DB and migrations; guide server setup
- [x] **Phase 31: UI Polish** - Bottom tabs: only active tab has label; top-right: no tab name; trainings tab: padding same as other tabs; developer zone: more inconspicuous; after create plan: "See plans here" link (navigate to Plans tab)
- [x] **Phase 32: Multi-Program Switching** - Switch between training programs with preserved status (no reset); Plans tab shows progress (e.g. 3/17 days); confirmation on switch (no Reset prompt)
- [x] **Phase 33: Sign Up** - Magic link (passwordless email); request-magic-link + verify-magic-link; rate limiting; unified login (email + legacy username)
- [x] **Phase 34: Login & Profile UX** - UserProfileCard: email + name (or email only); Login page: hide input after send, "Check inbox for {...}", try again link; Fishly in TopBar links to current training plan
- [ ] **Phase 35: Default Plan Migration + Creator Attribution** - Remove default-plan.json; seed default plan via DB migration; plans table: public flag, owner; PUBLIC: "Created by Fishly" (no owner) or "Created by {name}" (never email); PRIVATE: no creator text; creator attribution small and greyed out in Plans + Training tabs (not plan name)
- [ ] **Phase 36: Plans Tab Context Menu, Filters, Progress & How It Works** - Replace trash with "..." context menu (copy JSON, download, delete, edit); All/My/Public filter; progress at top-right of plan boxes; public plans show greyed 🌐 icon; expandable "How it works" section; "Create Plan" button at bottom

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

**Plans:** `.planning/phases/01-plan-service/1-PLAN.md` (5 tasks: scaffold → types → Plan Service → wire App → admin docs)

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

**Plans:** `.planning/phases/02-progress-profile/2-PLAN.md` (Plan 01: 3 tasks backend; Plan 02: 2 tasks frontend)

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

**Plans:** `.planning/phases/03-timer-engine/3-PLAN.md` (3 tasks: types → timer engine → demo)

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

**Plans:** `.planning/phases/04-audio/4-PLAN.md` (2 tasks: audioService → wire App)

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

**Plans:** `.planning/phases/05-session-runner/5-PLAN.md` (4 tasks: session utils → day selector → preview → session flow)

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

**Plans:** `.planning/phases/06-pwa-offline/6-PLAN.md` (4 tasks: vite-plugin-pwa + manifest + icons + audio precache → offline queue + progressService → InstallPrompt → responsive validation)

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

**Plans:** `.planning/phases/07-day-ids-routing/7-PLAN.md` (5 tasks: plan schema + default-plan → backend day_id → planService lookups → progressService/offlineQueue → routing + Dashboard URL sync)

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

**Plans:** `.planning/phases/08-session-ux/8-PLAN.md` (5 tasks: hasCompletedToday → completion flow → test toggle → recovery ring → integration)

---

### Phase 9: Refactor Code

**Goal:** Improve code quality through refactoring; reduce technical debt and improve maintainability.

**Depends on:** Phase 8 (Session UX Enhancements)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):

1. Refactoring scope and targets defined in plan
2. Code structure improved without changing user-facing behavior

**Plans:** `.planning/phases/09-refactor-code/9-PLAN.md` (4 tasks: getDayId → useSessionEngine → DayListSection/SessionPreviewSection → integration)

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

**Plans:** `.planning/phases/10-reset-plan-change/10-PLAN.md` (Plan 01: 3 tasks; Plan 02: 3 tasks)

---

### Phase 11: Refactor Code (Quality Pass)

**Goal:** Improve code quality through a second refactor pass: enforce clsx correctness, keep components logically small, and extract even small UI blocks into sub-components for clarity and testability.

**Depends on:** Phase 10 (Reset + Plan Change)

**Requirements:** (Enhancement — no new v1 requirement)

**Success Criteria** (what must be TRUE):

1. clsx used correctly for all conditional class names (no string concatenation or inline ternaries where clsx fits)
2. Components stay logically small; no component exceeds ~150 lines
3. Small UI blocks (e.g. status banners, inline messages) extracted to named sub-components for clarity and testability

**Plans:** `.planning/phases/11-refactor-code-quality-pass/11-PLAN.md` (6 tasks: rules of hooks + StatusBanner → constants → lodash/type-fest → clsx audit → SettingsView sections → size audit)

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

**Plans:** `.planning/phases/12-tests/12-PLAN.md` (8 tasks: scaffold → timerEngine → planService → utils → services → components → E2E login → E2E session)

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

**Plans:** `.planning/phases/13-deployment/13-PLAN.md` (6 tasks: server prod mode → start script → env example → GitHub workflow → systemd template → Vite base)

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

**Plans:** `.planning/phases/14-nextjs-migration/14-PLAN.md` (9 tasks)

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

**Plans:** `.planning/phases/15-refactor-cleanup/15-PLAN.md` (5 tasks: ESLint config → curly braces → remove unused code → verify → CI)

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

**Plans:** `.planning/phases/16-alias-imports-component-folders-tests/16-PLAN.md` (6 tasks: ~ alias → component subfolders → component tests → E2E reset → E2E plan change & abort → E2E error paths)

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

**Plans:** `.planning/phases/17-test-controls/17-PLAN.md` (4 tasks: dev mode preference → Settings toggle → gate test controls → tests)

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

**Plans:** `.planning/phases/18-dynamic-version-semantic-release/18-PLAN.md` (4 tasks: dynamic version → semantic-release config → GitHub Action → sync version)

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

**Plans:** `.planning/phases/19-create-plan-settings/19-PLAN.md` (Plan 01: JSON upload + validation + storage; Plan 02: AI voice mode — may split into sub-phases if complex)

---

### Phase 20: Preview Future Days

**Goal:** User can preview future days in a training plan (view structure, hold/breathe intervals) but cannot execute them. No start-session or similar action for future days.

**Depends on:** Phase 19 (Create Plan in Settings)

**Requirements:** (Enhancement — plan exploration)

**Success Criteria** (what must be TRUE):

1. User can view session structure (hold/breathe intervals) for future days in the plan
2. User cannot start or execute a session for a future day
3. Future days are clearly differentiated from current/available days (e.g. read-only preview, no start button)

**Plans:** `.planning/phases/20-preview-future-days/20-PLAN.md` (TBD — research and task breakdown)

---

### Phase 21: UI

**Goal:** Remove hardcoded text and unify the UI: DayListSection uses plan name/description; TopAppBar no longer shows plan name; app name "Fishly" moved to constants.

**Depends on:** Phase 20 (Preview Future Days)

**Requirements:** (Enhancement — UI consistency)

**Success Criteria** (what must be TRUE):

1. DayListSection displays plan name and description from plan metadata (not hardcoded "Training" / "Focus on rhythmic breathing...")
2. TopAppBar does not show plan name (redundant with DayListSection)
3. App name "Fishly" lives in `src/constants/app.ts`

**Plans:** `.planning/phases/21-ui/21-PLAN.md` (3 tasks: DayListSection plan metadata → remove TopAppBar plan name → app name to constants)

---

### Phase 22: Plans Tab + Settings Cleanup

**Goal:** Settings is too polluted. Add Plans tab; move plan-related UI (change plan, add plan) from Settings; add created_by to plans table; allow permanent delete of user-created non-active plans; leave room for future "explore plans without switching".

**Depends on:** Phase 21 (UI)

**Requirements:** (Enhancement — settings cleanup)

**Success Criteria** (what must be TRUE):

1. Bottom nav has three tabs: Training, Plans, Settings
2. Plan selector and create-plan live in Plans tab; Settings no longer shows them
3. plans table has created_by; new user-created plans record creator
4. User can permanently delete plans they created, only when plan is not active
5. Structure leaves room for future "explore plans without switching" (do not implement)

**Plans:** `.planning/phases/22-plans-tab-settings-cleanup/22-PLAN.md` (5 tasks: Plans tab → move sections → created_by → delete non-active → leave room for explore)

---

### Phase 23: Prettier + Lefthook + CI

**Goal:** Add basic formatter (Prettier). Code must be formatted and linted with lefthook.yml; GitHub workflow aborts if format/lint would change any files in the pipeline.

**Depends on:** Phase 22 (Plans Tab + Settings Cleanup)

**Requirements:** (Enhancement — code quality tooling)

**Success Criteria** (what must be TRUE):

1. Prettier installed and configured; codebase formatted consistently
2. lefthook.yml runs format + lint on pre-commit; blocks commit if checks fail
3. GitHub workflow runs format:check + lint; job aborts if any files would be changed (unformatted or lint-fixable)

**Plans:** `.planning/phases/23-prettier-lefthook-ci/23-PLAN.md` (5 tasks: Prettier → lefthook → GitHub workflow → document → verify)

---

### Phase 24: AI Plan Input Enhancements

**Goal:** (1) Build the transcribe/plan prompt dynamically from `src/types/plan.ts` so schema changes propagate automatically; (2) allow users to paste or type free-form text — if parseable as JSON, validate as now; otherwise send text to LLM with a text-specific prompt; (3) optionally move plan creation to its own screen if UX warrants it.

**Depends on:** Phase 23 (Prettier + Lefthook + CI)

**Requirements:** (Enhancement — plan creation UX)

**Success Criteria** (what must be TRUE):

1. Transcribe API prompt is derived from plan types (or a shared schema doc); format changes in `plan.ts` do not require manual prompt updates
2. Create-plan box accepts: JSON (paste/upload/type) — validated as now; or free-form text — sent to LLM, returns PlanWithMeta JSON
3. Text path uses a prompt variant: "Given the text..." instead of "Convert this audio..."
4. (Optional) Plan creation has its own screen if it improves UX

**Plans:** `.planning/phases/24-ai-plan-input-enhancements/24-PLAN.md` (TBD — research and task breakdown)

---

### Phase 25: Component Library (Radix/Headless UI)

**Goal:** Add Radix UI or Headless UI to reduce maintenance burden of custom components. Replace custom modals/dialogs with accessible primitives; establish patterns for tabs, buttons, and other UI primitives that downstream phases need.

**Depends on:** Phase 24 (AI Plan Input Enhancements)

**Requirements:** (Enhancement — component infrastructure)

**Success Criteria** (what must be TRUE):

1. Radix UI or Headless UI installed and configured; compatible with Tailwind and Fishly design tokens
2. ConfirmResetModal replaced with library Dialog primitive (styled with existing tokens)
3. Tabs primitive available for Phase 26 (Plan Creation UX) tab input modes
4. No behavior change for users; existing tests pass
5. Documented patterns for future modal/dialog/tab usage

**Plans:** `.planning/phases/25-component-library/25-PLAN.md` (TBD — research and task breakdown)

---

### Phase 26: Plan Creation UX

**Goal:** Make plan creation more intuitive: tab to switch between natural-language and JSON input; show Preview (using existing components) instead of raw JSON after LLM response; refine flow with contextual button labels; confirm modal for name/description before saving.

**Depends on:** Phase 25 (Component Library)

**Requirements:** (Enhancement — plan creation UX)

**Success Criteria** (what must be TRUE):

1. Tab to switch between "natural language" and "JSON" input modes (labels TBD)
2. Natural-language path: after LLM returns valid plan, show Preview (reuse DayListSection/SessionBreakdown/etc.) instead of raw JSON
3. Button states: empty → "Describe your plan first"; has text → "Generate" (or similar); after valid plan → "Preview" + "Refine" + "Confirm/Save plan"
4. Refine flow: user can send new text to LLM; repeat until satisfied
5. Confirm modal: prefilled name/description; optional edit; hint; Save button (use Phase 25 Dialog primitive)

**Plans:** `.planning/phases/26-plan-creation-ux/26-PLAN.md` (3 plans: Tabs + state machine → Preview + Refine + Confirm → Paste + E2E)

---

### Phase 27: Refactor CreatePlanSection (Component Size)

**Goal:** Reduce CreatePlanSection component size following Phase 11 refactoring rules. Prepare for eventual migration to its own page.

**Depends on:** Phase 26 (Plan Creation UX)

**Requirements:** (Enhancement — code quality)

**Success Criteria** (what must be TRUE):

1. clsx used correctly for all conditional class names (no string concatenation or template literals where clsx fits)
2. CreatePlanSection and all extracted sub-components stay under ~150 lines
3. Small UI blocks extracted to named sub-components for clarity and testability
4. ESLint passes; Prettier formatting applied
5. No user-facing behavior change; E2E tests pass

**Plans:** `.planning/phases/27-refactor-create-plan-section/27-PLAN.md` (4 tasks: clsx + constants → extract Describe tab → extract Paste tab + banners → size audit + lint)

---

### Phase 28: Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback

**Goal:** Move CreatePlanSection to its own bottom tab (+); allow create and refine via voice and/or text (mix and match); improve Preview feedback so users know when preview was updated after refinement.

**Depends on:** Phase 27 (Refactor CreatePlanSection)

**Requirements:** (Enhancement — plan creation cornerstone)

**Success Criteria** (what must be TRUE):

1. CreatePlanSection lives in its own bottom tab (+), not inside Plans tab
2. User can create via voice OR text; refine via voice OR text; mix and match (e.g. create by voice → preview → refine with text → refine with voice → save)
3. "Preview" button appears when user types/submits or audio is sent/re-sent
4. After refinement, user clearly sees that preview was updated (attention brought back to Preview — not just loading stop)

**Plans:** `.planning/phases/28-create-plan-tab-multi-modal-preview-feedback/28-PLAN.md` (7 tasks: Create tab + route + nav → multi-modal refine → Preview feedback + E2E)

---

### Phase 29: E2E Tests

**Goal:** Add comprehensive E2E tests; fix flaky create-plan Describe test; add voice/audio create-plan E2E using fixture; add missing unit tests for coverage.

**Depends on:** Phase 28 (Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback)

**Requirements:** (Enhancement — test coverage)

**Success Criteria** (what must be TRUE):

1. Flaky Describe tab E2E test is fixed (create-plan.spec.ts)
2. E2E test for voice/audio create-plan using `e2e/fixtures/1:30 to 2:00 14-day plan.m4a` (mock transcribe API)
3. Additional E2E tests for create-plan refine flow, error paths, and critical user journeys
4. Missing unit tests added for components/services without coverage; aim for reasonable coverage

**Plans:** `.planning/phases/29-e2e-tests/29-PLAN.md` (TBD — task breakdown)

---

### Phase 30: Dockerize MySQL + Change Database Type

**Goal:** Migrate from SQLite to MySQL; Dockerize MySQL for dev/local; production server already has MySQL but lacks the "freediving" database and migrations. Provide server setup guidance.

**Depends on:** Phase 29 (E2E Tests)

**Requirements:** (Enhancement — database infrastructure)

**Success Criteria** (what must be TRUE):

1. App uses MySQL instead of SQLite for backend persistence
2. MySQL runs in Docker for local/dev; `docker-compose` or similar for one-command dev DB
3. Migrations create and update schema (replace ad-hoc `runSchema` + inline migrations)
4. Production server: "freediving" database exists; migrations run on deploy or documented manual step
5. Server setup guide documents: create DB, run migrations, env vars (connection string)

**Plans:** `.planning/phases/30-dockerize-mysql/30-PLAN.md` (TBD — task breakdown)

---

### Phase 31: UI Polish

**Goal:** Refine UI details: bottom tabs show label only on active tab; top-right corner does not show tab name; trainings tab padding matches other tabs; developer zone in settings is more inconspicuous; after creating a plan, message says "See plans here" with link that navigates to Plans tab (not "see plans above").

**Depends on:** Phase 30 (Dockerize MySQL + Change Database Type)

**Requirements:** (Enhancement — UI polish)

**Success Criteria** (what must be TRUE):

1. Bottom tabs: only the active tab displays its label; inactive tabs show icon only
2. Top-right corner: no need to show the tab name (remove if redundant)
3. Trainings tab: padding matches the other three tabs (Training, Plans, Settings, Create)
4. Developer zone in Settings: more inconspicuous (e.g. collapsed, subtle styling)
5. After creating a plan: message says "See plans _here_" with link that navigates to Plans tab

**Plans:** `.planning/phases/31-ui-polish/31-PLAN.md` (TBD — task breakdown)

---

### Phase 32: Multi-Program Switching

**Goal:** Users can switch between training programs; progress is preserved per plan (not reset). Plans tab shows progress (e.g. 3/17 days). Switching asks for confirmation but does not open the Reset prompt. Supports users training different skills at once.

**Depends on:** Phase 31 (UI Polish)

**Requirements:** (Enhancement — multi-program support)

**Success Criteria** (what must be TRUE):

1. User can switch between training programs; status is preserved per plan (NOT reset)
2. Plans tab shows progress per plan (e.g. "3/17 days" or similar)
3. Switching plan asks for confirmation; does NOT open the Reset prompt
4. Users may train different skills at once by switching between plans

**Plans:** `.planning/phases/32-multi-program-switching/32-PLAN.md`

---

### Phase 33: Sign Up

**Goal:** Users can create their own account via magic link (passwordless email). User enters email → account created if new → magic link sent via SendGrid → user clicks → logged in. Legacy users (nico, athena) keep username+password.

**Depends on:** Phase 31 (UI Polish)

**Requirements:** (Enhancement — self-service registration)

**Success Criteria** (what must be TRUE):

1. User can request a magic link by entering email; if new, account is created; link sent via SendGrid
2. User clicks magic link → verified → session cookie set → redirect to app (logged in)
3. Rate limiting: 5 attempts per 15 min per IP on request-magic-link
4. Login page has unified entry: email + "Send me a link" for magic link; "Sign in with username" for legacy
5. No email enumeration; token/session indefinite per CONTEXT
6. Legacy login (username+password) unchanged for seeded users

**Plans:** `.planning/phases/33-sign-up/33-PLAN.md`

---

### Phase 34: Login & Profile UX

**Goal:** Improve login and profile UX: (1) UserProfileCard shows email + name (migration) or full email only; (2) Login page after magic-link sent: hide input, larger "Check the inbox for {...}", greyed-out "try again" link that resets form; (3) Fishly in TopAppBar links to current training plan.

**Depends on:** Phase 33 (Sign Up)

**Requirements:** (Enhancement — login and profile UX)

**Success Criteria** (what must be TRUE):

1. UserProfileCard displays email (greyed out, smaller) and name (editable with pencil) — or full email only if no migration
2. Login page: after email sent, input hidden; larger "Check the inbox for {email}"; greyed-out "if you didn't receive any email, wait some seconds and try again" with "try again" link that resets to form (email preserved)
3. Clicking "Fishly" in TopAppBar navigates to current training plan (Dashboard)

**Plans:** `.planning/phases/34-login-profile-ux/34-PLAN.md`

---

### Phase 35: Default Plan Migration + Creator Attribution

**Goal:** Remove `default-plan.json`; seed the default plan via DB migration. Plans table has `public` flag and `owner` (creator). Default plan: owner = null ("for everyone"). PUBLIC plans: "Created by Fishly" if no owner, "Created by {owner name}" if owner (never email). PRIVATE plans: no creator text. Creator attribution shown small and greyed out in Plans tab and Training tab.

**Depends on:** Phase 34 (Login & Profile UX)

**Requirements:** (Enhancement — plan storage and attribution)

**Success Criteria** (what must be TRUE):

1. `src/data/default-plan.json` removed; default plan seeded in DB via migration
2. Plans table has `public` flag and `owner` (creator); default plan has owner = null
3. PUBLIC plans: "Created by Fishly" (no owner) or "Created by {owner name}" (never email); server never returns email
4. PRIVATE plans: no "created by you" or similar text
5. Creator attribution displayed small and greyed out in Plans tab and Training tab

**Plans:** `.planning/phases/35-default-plan-migration-creator-attribution/35-PLAN.md`

---

### Phase 36: Plans Tab Context Menu, Filters, Progress & How It Works

**Goal:** Improve Plans tab UX: replace trash icon with "..." context menu (copy JSON, download, delete, edit); add All/My/Public filter; show progress at top-right of plan boxes (like TopAppBar); public plans show greyed 🌐 icon instead of menu; add expandable "How it works" section at top.

**Depends on:** Phase 35 (Default Plan Migration + Creator Attribution)

**Requirements:** (Enhancement — Plans tab UX)

**Success Criteria** (what must be TRUE):

1. Trash icon replaced by "..." context menu with: copy JSON, download plan (.json), delete (if allowed), edit (if allowed)
2. Edit and delete share same permission rules; cannot delete active plan; can edit active plan
3. Filter toggle: All plans / My plans / Public plans
4. Progress (e.g. "0/12 days") shown at top-right of each plan box, similar to TopAppBar
5. Public plans show greyed 🌐 icon instead of dropdown menu
6. Expandable "How it works +" section at top explaining plans and linking to Create tab
7. "Create Plan" button at bottom of plan list links to Create tab

**Plans:** `.planning/phases/36-plans-tab-context-menu-filters-progress/36-PLAN.md`

---

## Progress

| Phase                                                              | Plans Complete | Status   | Completed  |
| ------------------------------------------------------------------ | -------------- | -------- | ---------- |
| 1. Plan Service                                                    | 5/5            | Complete | 1-PLAN.md  |
| 2. Progress + Profile Services                                     | 2/2            | Complete | 2-PLAN.md  |
| 3. Timer Engine                                                    | 3/3            | Complete | 3-PLAN.md  |
| 4. Audio Service                                                   | 2/2            | Complete | 4-PLAN.md  |
| 5. Session Runner + Plan/Day Selector                              | 4/4            | Complete | 5-PLAN.md  |
| 6. PWA + Offline                                                   | 4/4            | Complete | 6-PLAN.md  |
| 7. Day IDs + Routing                                               | 5/5            | Complete | 7-PLAN.md  |
| 8. Session UX Enhancements                                         | 5/5            | Complete | 8-PLAN.md  |
| 9. Refactor Code                                                   | 4/4            | Complete | 9-PLAN.md  |
| 10. Reset + Plan Change                                            | 6/6            | Complete | 10-PLAN.md |
| 11. Refactor Code (Quality Pass)                                   | 6/6            | Complete | 11-PLAN.md |
| 12. Tests                                                          | 8/8            | Complete | 12-PLAN.md |
| 13. Deployment                                                     | 6/6            | Complete | 13-PLAN.md |
| 14. Next.js Migration                                              | 9/9            | Complete | 14-PLAN.md |
| 15. Refactor Code (Cleanup)                                        | 5/5            | Complete | 15-PLAN.md |
| 16. Alias Imports, Component Folders & Extended Tests              | 6/6            | Complete | 16-PLAN.md |
| 17. Test Controls                                                  | 4/4            | Complete | 17-PLAN.md |
| 18. Dynamic Version Display & Semantic Release                     | 4/4            | Complete | 18-PLAN.md |
| 19. Create Plan in Settings                                        | 9/9            | Complete | 19-PLAN.md |
| 20. Preview Future Days                                            | 1/1            | Complete | 20-PLAN.md |
| 21. UI                                                             | 3/3            | Complete | 21-PLAN.md |
| 22. Plans Tab + Settings Cleanup                                   | 5/5            | Complete | 22-PLAN.md |
| 23. Prettier + Lefthook + CI                                       | 5/5            | Complete | 23-PLAN.md |
| 24. AI Plan Input Enhancements                                     | 7/7            | Complete | 24-PLAN.md |
| 25. Component Library (Radix/Headless UI)                          | 7/7            | Complete | 25-PLAN.md |
| 26. Plan Creation UX                                               | 7/7            | Complete | 26-PLAN.md |
| 27. Refactor CreatePlanSection (Component Size)                    | 4/4            | Complete | 27-PLAN.md |
| 28. Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback | 7/7            | Complete | 28-PLAN.md |
| 29. E2E Tests                                                      | 4/4            | Complete | 29-PLAN.md |
| 30. Dockerize MySQL + Change Database Type                         | —              | Complete | 30-PLAN.md |
| 31. UI Polish                                                      | —              | Complete | 31-PLAN.md |
| 32. Multi-Program Switching                                        | —              | Complete | 32-PLAN.md |
| 33. Sign Up                                                        | 0/0            | Complete | 33-PLAN.md |
| 34. Login & Profile UX                                             | 6/6            | Complete | 34-PLAN.md |
| 35. Default Plan Migration + Creator Attribution                   | —              | Pending  | 35-PLAN.md |
| 36. Plans Tab Context Menu, Filters, Progress & How It Works       | —              | Pending  | 36-PLAN.md |

---

## Coverage

- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓
