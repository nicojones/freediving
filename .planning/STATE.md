# Project State: Freediving Breathhold Trainer

**Last updated:** 2025-03-20 — Phases 27–29 executed; phases 1–29 complete; Phase 30 next

---

## Project Reference

**Core value:** User can lie down, close their eyes, and complete a breathhold session guided entirely by audio — no need to look at the screen during the workout.

**Current focus:** Phase 30 — Dockerize MySQL + Change Database Type (next)

---

## Current Position

| Field    | Value                                      |
| -------- | ------------------------------------------ |
| Phase    | 30. Dockerize MySQL + Change Database Type |
| Plan     | 30-PLAN.md                                 |
| Status   | Pending                                    |
| Progress | 0/0 tasks (plan TBD)                       |

```
[            ] 0%
```

---

## Performance Metrics

| Metric              | Value |
| ------------------- | ----- |
| Phases complete     | 29    |
| Phases total        | 30    |
| Requirements mapped | 17/17 |
| Plans executed      | 29    |

---

## Accumulated Context

### Decisions

- PWA over native: single codebase, installable, runs well on phone and browser
- PWA + backend: fetch/store data server-side; progress syncs across devices
- Pre-defined users: username/password, no registration; admin configures credentials
- JSON for plans: admin uploads/modifies, no in-app editor
- SQLite on server: progress and auth; cross-device persistence (Phase 30: migrating to MySQL)
- Date-based elapsed time for timer: avoid setInterval drift

### Todos

- [x] Phase 1: Plan Service (context captured in 1-CONTEXT.md)
- [x] Phase 2: Progress + Profile Services (context captured in 2-CONTEXT.md)
- [x] Phase 3: Timer Engine
- [x] Phase 4: Audio Service
- [x] Phase 5: Session Runner + Plan/Day Selector
- [x] Phase 6: PWA + Offline
- [x] Phase 7: Day IDs + Routing
- [x] Phase 8: Session UX Enhancements (context in 8-CONTEXT.md)
- [x] Phase 9: Refactor Code
- [x] Phase 10: Reset + Plan Change (context in 10-CONTEXT.md)
- [x] Phase 11: Refactor Code (Quality Pass) (context in 11-CONTEXT.md)
- [x] Phase 12: Tests (12-PLAN.md)
- [x] Phase 13: Deployment (13-PLAN.md)
- [x] Phase 14: Next.js Migration (14-PLAN.md)
- [x] Phase 15: Refactor Code (Cleanup) (15-PLAN.md)
- [x] Phase 16: Alias Imports, Component Folders & Extended Tests (16-PLAN.md)
- [x] Phase 17: Test Controls (17-PLAN.md)
- [x] Phase 18: Dynamic Version Display & Semantic Release (18-PLAN.md)
- [x] Phase 19: Create Plan in Settings (19-PLAN.md)
- [x] Phase 20: Preview Future Days (20-PLAN.md)
- [x] Phase 21: UI (21-PLAN.md)
- [x] Phase 22: Plans Tab + Settings Cleanup (22-PLAN.md)
- [x] Phase 23: Prettier + Lefthook + CI (23-PLAN.md)
- [x] Phase 24: AI Plan Input Enhancements (24-PLAN.md)
- [x] Phase 25: Component Library (Radix/Headless UI) (25-PLAN.md)
- [x] Phase 26: Plan Creation UX (26-PLAN.md)
- [x] Phase 27: Refactor CreatePlanSection (27-PLAN.md)
- [x] Phase 28: Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback (28-PLAN.md)
- [x] Phase 29: E2E Tests (29-PLAN.md)
- [ ] Phase 30: Dockerize MySQL + Change Database Type (30-CONTEXT.md)

### Blockers

None.

---

## Session Continuity

Phase 11 (Refactor Code Quality Pass) executed. Phase 12 (Tests) executed — Vitest + Playwright, 99 unit tests, 2 E2E tests. Phase 13 (Deployment) executed — server production mode, start_freediving.sh, .env.production.example, .github/workflows/deploy.yml, systemd template. Phase 14 (Next.js Migration) executed — Express + React migrated to Next.js App Router, Route Handlers, @serwist/next PWA, standalone deployment. Phase 15 (Refactor Code Cleanup) executed — ESLint flat config, curly braces for all if, removed unused code, CI runs lint. Phase 16 executed — ~ path alias, component subfolders (ui, layout, day, session, settings, shared), component tests (DayListSection, LockedDayCard, SessionPreviewSection, ConfirmResetModal, ResetProgressSection), E2E (reset-progress, plan-change, abort-session, error-paths). Phase 17 executed — Settings dev mode toggle to show/hide test controls; all users can toggle; default OFF; unchecked = invisible. Phase 18 executed — Dynamic version from package.json on login; semantic-release for fix→patch, feat→minor, chore→no bump on push to main. Phase 19 executed — Create plan in Settings: JSON upload with PlanWithMeta schema validation; optional AI voice mode (dictate → Gemini → valid JSON → auto-fill → user confirms); DB storage preferred. Phase 20 executed — Preview future days in training plan (view structure); no way to execute future days. Phase 21 executed — UI: DayListSection uses plan name/description; remove plan name from TopAppBar; move "Fishly" to constants. Phase 22 executed — Plans Tab + Settings Cleanup: three tabs (Training, Plans, Settings); PlansView with plan selector, create plan, delete user-created non-active plans; created_by on plans table; Settings cleanup (reset, dev mode, profile, logout only). Phase 23 executed — Prettier + Lefthook + CI: Prettier installed and configured; lefthook pre-commit runs format + lint + unit tests + build + e2e (when source files staged), emoji-prefixed commands; GitHub workflow runs format:check before lint, emoji-prefixed step names, aborts if code is unformatted or has lint issues. Phase 24 executed — AI Plan Input Enhancements: Zod schemas in plan.ts with .describe(); dynamic responseJsonSchema for transcribe; transcribe-from-text endpoint; CreatePlanSection uses Zod validation to decide JSON vs AI path; unit tests for both endpoints and plan schema; E2E for text path. Phase 25 executed — Component Library (Headless UI): @headlessui/react installed; ConfirmResetModal → Dialog; Tabs primitive; PlanSelectorSection → Listbox; DevModeSection → Switch; SpeedMultiplierSelector → RadioGroup; COMPONENT-PATTERNS.md. Phase 26 executed — Plan Creation UX: CreatePlanSection two tabs (Describe, Paste/Raw); draft→preview→refine→confirm flow; PlanPreviewModal; ConfirmPlanModal; transcribe-from-text with contextPlan for refine; E2E create-plan. Phase 27 executed — Refactor CreatePlanSection: clsx + styles; CreatePlanDescribeTab, CreatePlanPasteTab, CreatePlanStatusBanner extracted; components under 150 lines. Phase 28 executed — Create Plan Tab: CreatePlanSection in own bottom tab (+); route /create; multi-modal create/refine (voice + text); Preview feedback. Phase 29 executed — E2E Tests: flaky Describe test fixed; voice create-plan E2E with fixture; unit tests for ConfirmPlanModal, PlanPreviewModal, CreatePlanStatusBanner. Phase 30 (Dockerize MySQL) next.
