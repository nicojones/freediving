# Phase 12: Tests — Executable Plan

---
phase: 12-tests
plans:
  - id: "01"
    tasks: 8
    files: 25
    depends_on: [11-refactor-quality]
type: execute
wave: 1
files_modified:
  - vite.config.ts
  - package.json
  - src/test/setup.ts
  - playwright.config.ts
  - src/pages/LoginPage.tsx
  - src/pages/Dashboard.tsx
  - src/components/SessionPreviewSection.tsx
  - src/components/ActiveSessionView.tsx
  - src/components/StatusBanner.tsx
  - src/components/PrimaryButton.tsx
  - src/components/SpeedMultiplierSelector.tsx
  - src/components/HoldProgressRing.tsx
  - src/services/timerEngine.test.ts
  - src/services/planService.test.ts
  - src/utils/completions.test.ts
  - src/utils/holdProgress.test.ts
  - src/utils/sessionStats.test.ts
  - src/utils/buildSessionTimeline.test.ts
  - src/utils/formatMmSs.test.ts
  - src/utils/formatDuration.test.ts
  - src/utils/phaseLabels.test.ts
  - src/services/progressService.test.ts
  - src/services/authService.test.ts
  - src/services/offlineQueue.test.ts
  - src/components/StatusBanner.test.tsx
  - src/components/PrimaryButton.test.tsx
  - src/components/SpeedMultiplierSelector.test.tsx
  - src/components/HoldProgressRing.test.tsx
  - e2e/login.spec.ts
  - e2e/session-flow.spec.ts
autonomous: false
requirements: []
user_setup: []
must_haves:
  truths:
    - "Vitest + @testing-library/react installed and configured"
    - "Pure logic (timerEngine, planService, utils) covered by unit tests"
    - "Services (progressService, authService, offlineQueue) have unit tests with mocked fetch/IndexedDB"
    - "Key components (StatusBanner, PrimaryButton, SpeedMultiplierSelector, HoldProgressRing) have unit tests"
    - "E2E tests run against FREEDIVING_DB_PATH=:memory: (never touch user data)"
    - "E2E flows: login, select day, session (test mode), complete"
  artifacts:
    - path: src/test/setup.ts
      provides: "fake-indexeddb for offlineQueue tests"
      contains: "globalThis.indexedDB"
    - path: playwright.config.ts
      provides: "dual webServer with FREEDIVING_DB_PATH=:memory:"
      contains: "FREEDIVING_DB_PATH"
  key_links:
    - from: vite.config.ts
      to: src/test/setup.ts
      via: "test.setupFiles"
      pattern: "setupFiles"
---

## Objective

Add unit tests across the application; add simple E2E tests that use an isolated test database (never touch user data).

**Purpose:** Quality assurance, regression prevention, confidence for refactoring.

**Principles:**
- Unit tests for pure logic first (timer, plan, utils)
- Services tested with mocked fetch / fake-indexeddb
- E2E uses FREEDIVING_DB_PATH=:memory: — never touch user data
- Co-located unit tests; e2e/ for E2E
- **Test selectors:** Use `data-testid`, `data-testid-value`, `data-testid-*` — never class names

**Output:** Vitest + Playwright configured; unit tests for logic, services, components; E2E for login and session flow.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/12-CONTEXT.md
- @.planning/phases/12-tests/12-RESEARCH.md

**Existing:** Phases 1–11 complete. No test framework installed. Server uses FREEDIVING_DB_PATH; Vite proxies /api to backend.

**Decisions (from 12-CONTEXT):**
- Vitest + @testing-library/react for units
- Playwright for E2E
- E2E DB: FREEDIVING_DB_PATH=:memory:
- Co-located unit tests; e2e/ for E2E
- Test selectors: data-testid, data-testid-value, data-testid-* — never class names

---

## Plan 01: Tests

### Task 1: Install Dependencies and Scaffold Test Config

**Files:** `package.json`, `vite.config.ts`, `src/test/setup.ts`, `playwright.config.ts`

**Action:**
1. Install dev dependencies:
   ```bash
   npm install -D vitest @testing-library/react jsdom @playwright/test fake-indexeddb
   npx playwright install
   ```
2. Add npm scripts to `package.json`:
   ```json
   "test": "vitest",
   "test:run": "vitest run",
   "test:e2e": "playwright test"
   ```
3. Add Vitest config to `vite.config.ts`:
   - Add `/// <reference types="vitest/config" />` at top
   - Add `test` block:
     ```ts
     test: {
       environment: 'jsdom',
       setupFiles: ['./src/test/setup.ts'],
       globals: true,
     },
     ```
4. Create `src/test/setup.ts`:
   ```ts
   import indexeddb from 'fake-indexeddb'
   globalThis.indexedDB = indexeddb
   ```
5. Create `playwright.config.ts` at project root:
   ```ts
   import { defineConfig } from '@playwright/test'

   export default defineConfig({
     webServer: [
       {
         command: 'npm run server',
         url: 'http://localhost:3001/api/auth/me',
         env: { FREEDIVING_DB_PATH: ':memory:', PORT: '3001', NODE_ENV: 'test' },
         reuseExistingServer: !process.env.CI,
         timeout: 15000,
       },
       {
         command: 'npm run dev',
         url: 'http://localhost:5173',
         reuseExistingServer: !process.env.CI,
         timeout: 60000,
       },
     ],
     use: { baseURL: 'http://localhost:5173' },
   })
   ```

**Verification:** `npm run test:run` runs (no tests yet); `npx playwright test` starts servers and exits (no tests yet).

---

### Task 2: timerEngine Unit Tests

**Files:** `src/services/timerEngine.test.ts`

**Action:**
1. Create `src/services/timerEngine.test.ts`.
2. Use `vi.useFakeTimers()` in beforeEach, `vi.useRealTimers()` in afterEach.
3. Test `createTimerEngine()`:
   - Emits `phase_start` when session starts
   - Emits `prepare_hold` 10s before each hold
   - Emits `countdown_30` only when recovery ≥31s, at 30s remaining
   - Emits `hold_end` when hold ends
   - Emits `session_complete` when session ends
   - `relaxationSecondsOverride` shortens relaxation
   - `getState()` returns correct phase and remainingMs
4. Use `vi.advanceTimersByTime()` (or `vi.advanceTimersToNextTimer()` if needed) for deterministic timing.
5. Reference: 12-RESEARCH.md Pattern 3 (Fake Timers).

**Verification:** `npm run test:run src/services/timerEngine.test.ts` passes.

---

### Task 3: planService Unit Tests

**Files:** `src/services/planService.test.ts`

**Action:**
1. Create `src/services/planService.test.ts`.
2. Test `getAvailablePlans()` — returns array (relies on src/data/*-plan.json; if empty, skip or mock).
3. Test `loadPlanById('default')` — returns plan or error.
4. Test `getPhasesForDay(plan, dayIndex)` — returns phases for training day, null for rest/out-of-range.
5. Test `getDayId(plan, dayIndex)` — returns id or null.
6. Test `getDayById(plan, dayId)` — case-insensitive lookup.
7. Test `getDayIndexById(plan, dayId)` — returns index or null.
8. Test `getCurrentDay(plan, completions)` — on-track returns next day; behind skips rest days.
9. Test `computeSessionDurationSeconds(phases)` — relaxation + phases.
10. Test `getDaySummary(plan, dayIndex)` — "Rest" or "N cycle(s)".
11. Use inline plan fixtures (e.g. `[{ id: 'd1', phases: [...] }]`) for getPhasesForDay, getDayId, getCurrentDay.
12. Do NOT mock import.meta.glob for getAvailablePlans/loadPlanById if data exists; if tests fail, vi.mock planService and test pure functions with fixtures.

**Verification:** `npm run test:run src/services/planService.test.ts` passes.

---

### Task 4: Utils Unit Tests

**Files:** `src/utils/completions.test.ts`, `holdProgress.test.ts`, `sessionStats.test.ts`, `buildSessionTimeline.test.ts`, `formatMmSs.test.ts`, `formatDuration.test.ts`, `phaseLabels.test.ts`

**Action:**
1. **completions.test.ts:** Test `hasCompletedToday(completions)` — true when any completion is today (use date-fns isSameDay). Test `isDayCompleted(completions, dayId)` — case-insensitive.
2. **holdProgress.test.ts:** Test progress calculation for hold phase (elapsed, total, percentage).
3. **sessionStats.test.ts:** Test stats derivation from phases (hold count, total duration, etc.).
4. **buildSessionTimeline.test.ts:** Test timeline building from phases.
5. **formatMmSs.test.ts:** Test mm:ss formatting.
6. **formatDuration.test.ts:** Test duration formatting.
7. **phaseLabels.test.ts:** Test label mapping for phase types.

**Verification:** `npm run test:run src/utils/` passes.

---

### Task 5: Services Unit Tests (progressService, authService, offlineQueue)

**Files:** `src/services/progressService.test.ts`, `authService.test.ts`, `offlineQueue.test.ts`

**Action:**
1. **progressService.test.ts:**
   - Mock fetch with `vi.stubGlobal('fetch', vi.fn())` in beforeEach; `vi.unstubAllGlobals()` in afterEach.
   - Test `recordCompletion` — success (ok: true), network error, 401 (session expired).
   - Test `fetchCompletions` — returns array on success.
   - Test `resetProgress` — success.
2. **authService.test.ts:**
   - Mock fetch.
   - Test `login` — success returns user, 401 returns error.
   - Test `getCurrentUser` — returns user or null.
3. **offlineQueue.test.ts:**
   - Uses fake-indexeddb from setup. Test `queueCompletion`, `flushQueue`, `clearByPlanId` — verify IndexedDB operations (openDB, add, get, delete).

**Verification:** `npm run test:run src/services/progressService.test.ts src/services/authService.test.ts src/services/offlineQueue.test.ts` passes.

---

### Task 6: Component Unit Tests

**Files:** `src/components/StatusBanner.test.tsx`, `PrimaryButton.test.tsx`, `SpeedMultiplierSelector.test.tsx`, `HoldProgressRing.test.tsx`

**Action:**
1. **StatusBanner.test.tsx:** Renders error when progressError; renders "Saved" when savedMessage; renders null when neither. Use `getByTestId` — components must have `data-testid` (e.g. `status-banner`, `status-banner-error`, `status-banner-saved`).
2. **PrimaryButton.test.tsx:** Renders label; onClick fires; disabled when disabled prop. Use `getByTestId("primary-button")` or similar.
3. **SpeedMultiplierSelector.test.tsx:** Renders speed options; onChange fires on selection. Use `data-testid="speed-selector"`, `data-testid-value` for selected speed if needed.
4. **HoldProgressRing.test.tsx:** Renders with progress props; displays correct progress. Use `data-testid="hold-progress-ring"`, `data-testid-value` for progress if asserting value.
5. Use `render`, `screen` from @testing-library/react. Target elements via `getByTestId` — **never** by class name.
6. Add `data-testid` (and `data-testid-value` where needed) to components as part of this task.

**Verification:** `npm run test:run src/components/` passes.

---

### Task 7: E2E Login Flow

**Files:** `e2e/login.spec.ts`

**Action:**
1. Add `data-testid` to LoginPage: `login-username`, `login-password`, `login-submit`, `login-error` (if present).
2. Add `data-testid` to Dashboard/day list as needed: e.g. `dashboard-day-list`, `day-card-{dayId}`.
3. Create `e2e/login.spec.ts`.
4. Test: User can log in.
   - Navigate to `/`
   - Fill via `page.getByTestId('login-username')`, `page.getByTestId('login-password')`
   - Click via `page.getByTestId('login-submit')`
   - Assert dashboard visible via `page.getByTestId('dashboard-day-list')` or similar (timeout 5000)
5. **Never** use class names to target elements. Use `data-testid`, `data-testid-value`, `data-testid-*` only.
6. Playwright webServer starts backend with FREEDIVING_DB_PATH=:memory: — DB is isolated.

**Verification:** `npx playwright test e2e/login.spec.ts` passes.

---

### Task 8: E2E Session Flow

**Files:** `e2e/session-flow.spec.ts`

**Action:**
1. Add `data-testid` to SessionPreviewSection / ActiveSessionView: `test-mode-toggle`, `speed-selector`, `start-session-button`, `complete-session-button`, etc.
2. Create `e2e/session-flow.spec.ts`.
3. Test: User can complete a session (with test mode).
   - Log in first (reuse login flow or helper)
   - Navigate to day view via `getByTestId('day-card-...')` or route
   - Enable test mode via `page.getByTestId('test-mode-toggle')`
   - Set speed via `page.getByTestId('speed-selector')` (or `data-testid-value` for option)
   - Click via `page.getByTestId('start-session-button')`
   - Wait for session to complete (~30s with test mode + 10× speed)
   - Assert completion via `page.getByTestId('complete-session-button')` or `session-complete`
4. **Never** use class names. Use `data-testid`, `data-testid-value`, `data-testid-*` only.
5. Timeout: session may take ~30–60s; set `test.setTimeout(90000)` if needed.

**Verification:** `npx playwright test e2e/session-flow.spec.ts` passes.

---

## Task Dependencies

```
Task 1 (scaffold) ──┬──> Task 2 (timerEngine)
                   ├──> Task 3 (planService)
                   ├──> Task 4 (utils)
                   ├──> Task 5 (services)
                   ├──> Task 6 (components)
                   ├──> Task 7 (E2E login)
                   └──> Task 8 (E2E session) [depends on 7]
```

---

## Success Criteria Checklist

| Criterion | Task | Verification |
|-----------|------|---------------|
| Vitest + RTL installed | 1 | npm run test:run |
| Pure logic unit tests | 2, 3, 4 | vitest run src/services/timerEngine.test.ts, planService.test.ts, src/utils/*.test.ts |
| Services unit tests (mocked) | 5 | vitest run src/services/progressService.test.ts, authService.test.ts, offlineQueue.test.ts |
| Component unit tests | 6 | vitest run src/components/*.test.tsx |
| E2E DB isolation | 1 (playwright config) | FREEDIVING_DB_PATH=:memory: in webServer env |
| E2E login flow | 7 | npx playwright test e2e/login.spec.ts |
| E2E session flow | 8 | npx playwright test e2e/session-flow.spec.ts |

---

## How to Test

1. **Unit tests:** `npm run test:run`
2. **Unit tests (watch):** `npm run test`
3. **E2E tests:** `npx playwright test`
4. **E2E (headed):** `npx playwright test --headed`
5. **Full suite:** `npm run test:run && npx playwright test`

**E2E note:** Backend and frontend start automatically via Playwright webServer. Backend uses in-memory DB; user data is never touched.

---

## Files Summary

| Category | Files |
|----------|-------|
| Config | vite.config.ts, package.json, playwright.config.ts, src/test/setup.ts |
| Unit | timerEngine.test.ts, planService.test.ts, utils/*.test.ts, progressService.test.ts, authService.test.ts, offlineQueue.test.ts |
| Components | StatusBanner.test.tsx, PrimaryButton.test.tsx, SpeedMultiplierSelector.test.tsx, HoldProgressRing.test.tsx |
| E2E | e2e/login.spec.ts, e2e/session-flow.spec.ts |
