# Phase 12: Tests — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for unit tests and E2E tests with isolated test DB.  
**Phase:** 12. Tests

---

## User Requirements (Locked)

1. **Unit tests** — Cover the whole application (pure logic, services, components).
2. **E2E tests** — Simple E2E tests are welcome.
3. **E2E DB isolation** — E2E tests MUST use their own database. Never touch user data.

---

## E2E DB Isolation: Yes, Possible

The server uses `FREEDIVING_DB_PATH` (default: `server/data.db`). For E2E:

- **Option A (recommended):** `FREEDIVING_DB_PATH=:memory:` — In-memory SQLite. Fast, fully isolated, no files left behind.
- **Option B:** `FREEDIVING_DB_PATH=./server/test-data.db` — Temp file. Isolated; can be gitignored and cleaned after runs.

**Implementation:** E2E runner starts the server with the env var set before any test runs. The server runs `runSchema()` and `seedUsers()` on startup, so the test DB is fresh and seeded. User's `data.db` is never used.

---

## Decisions

### 1. Unit Test Framework

- **Framework:** Vitest
- **Rationale:** Vite-native, fast, recommended in Phase 8 research. No extra config for ESM/TS.
- **React components:** @testing-library/react + jsdom (or happy-dom)

### 2. Unit Test Scope

- **Pure logic (high priority):** `timerEngine`, `planService`, `utils/*` (completions, holdProgress, sessionStats, buildSessionTimeline, formatMmSs, formatDuration, phaseLabels)
- **Services (medium priority):** `progressService`, `authService`, `offlineQueue` — with mocked fetch/API
- **Components (as feasible):** Key components (e.g. StatusBanner, SpeedMultiplierSelector, PrimaryButton) — extract sub-components from Phase 11 improves testability
- **Coverage target:** No strict %. Aim for critical paths and pure logic first; expand over time.

### 3. E2E Test Framework

- **Framework:** Playwright
- **Rationale:** Modern, fast, good Vite support. Can run against dev server or preview build.
- **Scope:** Simple flows — login, select day, start session (with test mode), complete session. No need for exhaustive coverage.

### 4. E2E Server and DB

- **DB path:** `FREEDIVING_DB_PATH=:memory:` when starting server for E2E
- **Server startup:** E2E config starts Express server as a subprocess (or `globalSetup`) with env vars; tests run against `http://localhost:PORT`
- **Port:** Use `PORT=0` or a fixed test port (e.g. 3099) to avoid clashes with dev server

### 5. Test File Layout

- **Unit:** `src/**/*.test.ts` or `src/**/*.spec.ts` (co-located) — or `tests/unit/` mirroring `src/`
- **E2E:** `e2e/*.spec.ts` (or `tests/e2e/`)
- **Convention:** Co-located unit tests preferred for small modules; `tests/` for E2E

### 6. Test Selectors — data-testid (No Class Names)

- **Rule:** Do NOT use class names to target elements in tests.
- **Use instead:** `data-testid="foo"` for element identification; `data-testid-value="..."` for values; `data-testid-*` for any test-related attribute.
- **Tests:** Use `getByTestId`, `page.getByTestId`, or `page.locator('[data-testid="foo"]')`.
- **Components:** Add `data-testid` (and `data-testid-value` where needed) to elements that tests will target. Prefer semantic IDs (e.g. `login-username`, `session-start-button`).

---

## Out of Scope for Phase 12

- 100% coverage mandate
- Visual regression tests
- Performance/load tests
- Backend-only unit tests (Node) — can be added later; focus on frontend + shared logic first

---

## Traceability

| Decision       | Outcome                                                            |
| -------------- | ------------------------------------------------------------------ |
| Unit framework | Vitest + @testing-library/react                                    |
| Unit scope     | Pure logic, services (mocked), key components                      |
| E2E framework  | Playwright                                                         |
| E2E DB         | FREEDIVING_DB_PATH=:memory:; server started with env               |
| E2E scope      | Simple flows: login, day select, session (test mode)               |
| File layout    | Co-located unit tests; e2e/ for E2E                                |
| Test selectors | data-testid, data-testid-value, data-testid-\* — never class names |

---

## Code Context

### Testable Pure Logic

| File                                       | What to Test                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `timerEngine.ts`                           | buildTimeline, computeState, event emission (phase_start, prepare_hold, countdown_30, hold_end, session_complete); recovery ≥31s for countdown_30 |
| `planService.ts`                           | getAvailablePlans, loadPlanById, getPhasesForDay, getDayId, getDayById, getCurrentDayIndex (if present)                                           |
| `utils/completions.ts`                     | hasCompletedToday, isDayCompleted                                                                                                                 |
| `utils/holdProgress.ts`                    | Progress calculation for hold phase                                                                                                               |
| `utils/sessionStats.ts`                    | Stats derivation from phases                                                                                                                      |
| `utils/buildSessionTimeline.ts`            | Timeline building                                                                                                                                 |
| `utils/formatMmSs.ts`, `formatDuration.ts` | Formatting                                                                                                                                        |
| `utils/phaseLabels.ts`                     | Label mapping                                                                                                                                     |

### Services (Mock API)

- `progressService`: mock fetch; test recordCompletion, fetchCompletions, resetProgress
- `authService`: mock fetch; test login flow
- `offlineQueue`: mock IndexedDB or use fake-indexeddb

### Components

- Phase 11 extracts StatusBanner, PlanSelectorSection, etc. — these are good unit test targets
- SpeedMultiplierSelector, PrimaryButton, HoldProgressRing — small, testable

### E2E Flow

1. Start server with `FREEDIVING_DB_PATH=:memory:` (and optionally `PORT=3099`)
2. Start Vite dev server (or preview) on different port
3. Playwright navigates to app, performs: login → select day → start session (test mode) → complete
4. Assert: completion recorded, UI shows expected state

### DB Setup

- `server/db.js`: Uses `FREEDIVING_DB_PATH`; `runSchema()` and `seedUsers()` run on import
- For `:memory:`, each server process gets a fresh DB — perfect for E2E isolation

---

_Context captured from /gsd-discuss-phase 12 — user specified: unit test whole app, simple E2E, E2E must use own DB (never touch user data). E2E DB isolation confirmed via FREEDIVING_DB_PATH._
