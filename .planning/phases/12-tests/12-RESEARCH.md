# Phase 12: Tests — Research

**Researched:** 2025-03-19
**Domain:** Unit testing (Vitest, React Testing Library), E2E testing (Playwright), test DB isolation
**Confidence:** HIGH

## Summary

Phase 12 adds unit tests and E2E tests with isolated test database. The stack is locked: Vitest + @testing-library/react for units, Playwright for E2E, `FREEDIVING_DB_PATH=:memory:` for E2E DB isolation. Vitest integrates with Vite 8 out of the box; no separate config needed beyond extending `vite.config.ts`. Playwright's `webServer` supports multiple servers—start Express (with env) first, then Vite dev. For timerEngine tests, use `vi.useFakeTimers()` with `vi.advanceTimersByTime()`. For planService, `import.meta.glob` works in Vitest because Vite transforms it; no mocking required if `src/data/*-plan.json` exists. For offlineQueue (IndexedDB), use `fake-indexeddb` in a setup file.

**Primary recommendation:** Add Vitest + jsdom + @testing-library/react to vite.config.ts; add Playwright with dual webServer (backend on 3001 with `:memory:`, frontend on 5173); use fake-indexeddb for offlineQueue; use vi.useFakeTimers for timerEngine.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Unit framework: Vitest + @testing-library/react
- E2E framework: Playwright
- E2E DB: FREEDIVING_DB_PATH=:memory: when starting server
- Unit scope: Pure logic (timerEngine, planService, utils), services (mocked), key components
- E2E scope: Simple flows — login, select day, session (test mode), complete
- File layout: Co-located unit tests; e2e/ for E2E

### Claude's Discretion
- Co-located (`src/**/*.test.ts`) vs `tests/unit/` mirroring src — co-located preferred for small modules
- Port for E2E backend: fixed (e.g. 3099) or PORT=0 — use fixed test port to avoid clashes

### Test Selectors (User Requirement)
- **Never** use class names to target elements
- Use `data-testid="foo"` for element identification
- Use `data-testid-value="..."` for values (e.g. displayed/computed values)
- Use `data-testid-*` for any test-related attribute

### Deferred Ideas (OUT OF SCOPE)
- 100% coverage mandate
- Visual regression tests
- Performance/load tests
- Backend-only unit tests (Node) — focus on frontend + shared logic first
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UNIT-01 | Unit tests for pure logic (timerEngine, planService, utils) | Vitest + vi.useFakeTimers for timer; import.meta.glob works in Vitest |
| UNIT-02 | Unit tests for services (progressService, authService, offlineQueue) with mocked fetch/API | vi.mock('fetch') or global fetch mock; fake-indexeddb for offlineQueue |
| UNIT-03 | Unit tests for key components (StatusBanner, SpeedMultiplierSelector, PrimaryButton, HoldProgressRing) | @testing-library/react, jsdom |
| E2E-01 | E2E tests: login, select day, session (test mode), complete | Playwright webServer; dual servers (backend + frontend) |
| E2E-02 | E2E DB isolation: never touch user data | FREEDIVING_DB_PATH=:memory:; server started with env in webServer |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.0 | Unit test runner | Vite-native, ESM/TS out of box, fast |
| @testing-library/react | 16.3.2 | React component testing | User-centric queries, recommended by React team |
| @playwright/test | 1.58.2 | E2E testing | Modern, fast, good Vite support |
| jsdom | 29.0.0 | DOM environment for unit tests | Standard for React unit tests in Node |
| fake-indexeddb | 6.x | IndexedDB mock for offlineQueue | Pure JS, works in Node; idb uses it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| happy-dom | 20.8.4 | Alternative DOM env | Lighter than jsdom; use if jsdom is slow |
| @vitest/coverage-v8 | (optional) | Coverage | When coverage reports needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsdom | happy-dom | happy-dom faster, jsdom more complete |
| Playwright | Cypress | Playwright faster, better multi-browser; Cypress more established |

**Installation:**
```bash
npm install -D vitest @testing-library/react jsdom @playwright/test fake-indexeddb
npx playwright install
```

**Version verification:** Verified 2025-03-19 via `npm view`:
- vitest: 4.1.0
- @testing-library/react: 16.3.2
- @playwright/test: 1.58.2
- jsdom: 29.0.0
- fake-indexeddb: 6.2.5 (latest)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   ├── timerEngine.ts
│   └── timerEngine.test.ts      # co-located for small modules
├── utils/
│   ├── completions.ts
│   └── completions.test.ts
├── components/
│   ├── StatusBanner.tsx
│   └── StatusBanner.test.tsx
e2e/
├── login.spec.ts
├── session-flow.spec.ts
└── playwright.config.ts
```

### Pattern 1: Vitest in Vite Config
**What:** Add `test` block and `/// <reference types="vitest/config" />` to existing vite.config.ts.
**When to use:** Single config for dev, build, and test.
**Example:**
```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

### Pattern 2: Playwright Dual webServer
**What:** Start backend first (with FREEDIVING_DB_PATH=:memory:), then frontend. Frontend proxies /api to backend.
**When to use:** E2E against full stack; backend and frontend are separate processes.
**Example:**
```typescript
// playwright.config.ts
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

### Pattern 3: Fake Timers for timerEngine
**What:** Use vi.useFakeTimers() so setInterval and Date.now are controllable.
**When to use:** Testing timer-based logic (phase transitions, event emission).
**Example:**
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimerEngine } from './timerEngine'

describe('timerEngine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('emits prepare_hold 10s before hold', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('prepare_hold', cb)
    engine.start([{ type: 'hold', duration: 30 }], { relaxationSecondsOverride: 1 })
    vi.advanceTimersByTime(1000)   // relaxation done
    vi.advanceTimersByTime(9000)   // 9s into "recovery" before hold
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)   // 10s before hold
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
```

### Anti-Patterns to Avoid
- **Mocking import.meta.glob:** Don't. Vite transforms it; it works in Vitest if data files exist. Mock the planService module only if you need to isolate from real data.
- **Running E2E against user DB:** Never. Always use FREEDIVING_DB_PATH=:memory:.
- **Testing timerEngine with real time:** Use fake timers. Real time makes tests flaky and slow.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| DOM for React tests | Custom JSDOM setup | jsdom (Vitest environment) | Battle-tested, handles events |
| IndexedDB in Node | Custom in-memory store | fake-indexeddb | idb works with it; no custom sync logic |
| Time control for timer | sleep() or real waits | vi.useFakeTimers | Deterministic, fast |
| Fetch mocking | Manual XMLHttpRequest | vi.stubGlobal('fetch', vi.fn()) or vi.mock | Simpler, consistent |
| E2E server startup | Custom scripts | Playwright webServer | Built-in, env support, reuseExistingServer |
| Element targeting in tests | class names, text selectors | data-testid, data-testid-value | Stable, decoupled from styles |

**Key insight:** IndexedDB, timers, and fetch are deceptively complex. Use established mocks. Never target by class name.

## Common Pitfalls

### Pitfall 1: setInterval Not Firing with Fake Timers
**What goes wrong:** vi.advanceTimersByTime() doesn't trigger setInterval callbacks.
**Why it happens:** Some environments or timer implementations don't integrate with @sinonjs/fake-timers.
**How to avoid:** Use vi.advanceTimersToNextTimer() or vi.runAllTimers(). Ensure vi.useFakeTimers() is called before the code that schedules timers.
**Warning signs:** Test passes with real timers but fails with fake timers.

### Pitfall 2: E2E Backend Port Collision
**What goes wrong:** E2E starts backend on 3001 while user's dev server is also on 3001.
**Why it happens:** Same default port.
**How to avoid:** Use reuseExistingServer: !process.env.CI so locally it reuses if running. In CI, start fresh. Or use a dedicated E2E port (e.g. 3099) and configure Vite proxy for tests.
**Warning signs:** "Address already in use" or tests hitting wrong DB.

### Pitfall 3: planService Tests Fail Due to Missing Data
**What goes wrong:** getAvailablePlans() returns [] or loadPlanById fails.
**Why it happens:** import.meta.glob resolves at build/transform time; path or pattern wrong.
**How to avoid:** Ensure src/data/*-plan.json exists (default-plan.json, minimal-plan.json). Vitest uses Vite transform, so glob works. If testing in isolation, vi.mock the planService module.
**Warning signs:** getAvailablePlans() returns []; loadPlanById('default') returns { error: '...' }.

### Pitfall 4: offlineQueue Tests Fail in Node
**What goes wrong:** "indexedDB is not defined" or similar.
**Why it happens:** Node has no IndexedDB.
**How to avoid:** Add setup file that does `import indexeddb from 'fake-indexeddb'; globalThis.indexedDB = indexeddb` and set test.setupFiles in config.
**Warning signs:** openDB from idb throws.

### Pitfall 5: React Component Tests Need Wrappers
**What goes wrong:** "useTraining must be used within TrainingProvider" or router errors.
**Why it happens:** Components use context or react-router.
**How to avoid:** Wrap with providers in test: `<MemoryRouter><TrainingProvider>{children}</TrainingProvider></MemoryRouter>`. Or test leaf components (StatusBanner, PrimaryButton) that don't need context.
**Warning signs:** "Invalid hook call" or "useX must be used within Y".

### Pitfall 6: Targeting by Class Name
**What goes wrong:** Tests break when styles change; coupling to implementation.
**Why it happens:** Using `className` or `class` selectors in tests.
**How to avoid:** Use `data-testid`, `data-testid-value`, `data-testid-*` only. Add these attributes to components; tests use `getByTestId`, `page.getByTestId`, or `page.locator('[data-testid="foo"]')`.
**Warning signs:** Tests fail after CSS refactor; selectors like `.btn-primary` or `[class*="error"]`.

## Test Selectors: data-testid (Don't Hand-Roll)

| Problem | Don't Use | Use Instead | Why |
|---------|-----------|-------------|-----|
| Element identification | class names, text content | `data-testid="foo"` | Stable, semantic, decoupled from styles |
| Value assertion | text content (brittle) | `data-testid-value="..."` | Explicit contract for displayed values |
| Compound selectors | `[class*="..."]` | `data-testid-*` attributes | Clear intent, no implementation coupling |

**Rule:** Never target elements by class name in tests. Add `data-testid` (and `data-testid-value` where needed) to components; tests use these exclusively.

## Code Examples

Verified patterns from official sources:

### React Component Test (data-testid)
```typescript
// src/components/StatusBanner.test.tsx
// StatusBanner must have data-testid on elements; data-testid-value for dynamic values
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBanner } from './StatusBanner'

describe('StatusBanner', () => {
  it('renders error when progressError provided', () => {
    render(<StatusBanner progressError="Network error" />)
    const el = screen.getByTestId('status-banner-error')
    expect(el).toHaveAttribute('data-testid-value', 'Network error')
  })
  it('renders Saved when savedMessage true', () => {
    render(<StatusBanner savedMessage />)
    expect(screen.getByTestId('status-banner-saved')).toBeInTheDocument()
  })
  it('renders nothing when neither', () => {
    const { container } = render(<StatusBanner />)
    expect(screen.queryByTestId('status-banner')).toBeNull()
  })
})
```

### Mock Fetch for progressService
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recordCompletion } from './progressService'

describe('progressService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns ok when fetch succeeds', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
    const result = await recordCompletion('default', 'day-1')
    expect(result).toEqual({ ok: true })
  })
})
```

### Playwright E2E Login Flow (data-testid)
```typescript
// e2e/login.spec.ts
// LoginPage must have data-testid="login-username", "login-password", "login-submit"
// Dashboard must have data-testid="dashboard-day-list" or similar
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })
})
```

### fake-indexeddb Setup
```typescript
// src/test/setup.ts
import indexeddb from 'fake-indexeddb'
globalThis.indexedDB = indexeddb
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest + CRA | Vitest + Vite | 2022+ | No Jest config; Vite native |
| Enzyme | @testing-library/react | 2019+ | User-centric, less brittle |
| Cypress only | Playwright | 2020+ | Faster, multi-browser, webServer |
| Manual server scripts | Playwright webServer | Built-in | Env vars, reuseExistingServer |

**Deprecated/outdated:**
- Enzyme: React Testing Library is the recommended approach.
- Jest for Vite projects: Vitest is the standard; no transform config needed.

## Open Questions

1. **planService getAvailablePlans with import.meta.glob**
   - What we know: Vite transforms import.meta.glob; Vitest uses Vite; src/data/*-plan.json exists.
   - What's unclear: Whether eager glob in test env resolves all plan files.
   - Recommendation: Test first without mocking. If it fails, vi.mock the planService and test getPhasesForDay, getDayId, getCurrentDay with inline plan fixtures.

2. **E2E Test Mode Toggle**
   - What we know: Test mode shortens relaxation to 3s; SpeedMultiplierSelector allows 1,2,5,10,25.
   - What's unclear: Exact E2E flow for "session (test mode)" — enable toggle, set speed, run to completion.
   - Recommendation: Enable test mode and speed 10× in E2E; assert completion recorded within ~30s.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Vitest 4.1.0 |
| Unit config | vite.config.ts (test block) |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run` |
| E2E framework | Playwright 1.58.2 |
| E2E config | playwright.config.ts (or e2e/playwright.config.ts) |
| E2E run command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UNIT-01 | timerEngine events, computeState | unit | `vitest run src/services/timerEngine.test.ts` | ❌ Wave 0 |
| UNIT-01 | planService getPhasesForDay, getDayId, getCurrentDay | unit | `vitest run src/services/planService.test.ts` | ❌ Wave 0 |
| UNIT-01 | utils (completions, holdProgress, formatMmSs, etc.) | unit | `vitest run src/utils/*.test.ts` | ❌ Wave 0 |
| UNIT-02 | progressService, authService (mocked fetch) | unit | `vitest run src/services/progressService.test.ts` | ❌ Wave 0 |
| UNIT-02 | offlineQueue (fake-indexeddb) | unit | `vitest run src/services/offlineQueue.test.ts` | ❌ Wave 0 |
| UNIT-03 | StatusBanner, PrimaryButton, SpeedMultiplierSelector | unit | `vitest run src/components/*.test.tsx` | ❌ Wave 0 |
| E2E-01 | Login flow | e2e | `npx playwright test e2e/login.spec.ts` | ❌ Wave 0 |
| E2E-01 | Session flow (test mode) | e2e | `npx playwright test e2e/session-flow.spec.ts` | ❌ Wave 0 |
| E2E-02 | DB isolation | e2e | Verified by FREEDIVING_DB_PATH=:memory: in webServer | N/A |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test -- --run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/test/setup.ts` — fake-indexeddb + any global mocks
- [ ] `vite.config.ts` — add test block, setupFiles
- [ ] `playwright.config.ts` — dual webServer, baseURL
- [ ] `src/services/timerEngine.test.ts` — timerEngine unit tests
- [ ] `src/services/planService.test.ts` — planService unit tests
- [ ] `src/utils/*.test.ts` — utils unit tests
- [ ] `src/services/progressService.test.ts` — progressService (mocked fetch)
- [ ] `src/services/offlineQueue.test.ts` — offlineQueue (fake-indexeddb)
- [ ] `src/components/StatusBanner.test.tsx` — StatusBanner
- [ ] `src/components/PrimaryButton.test.tsx` — PrimaryButton
- [ ] `src/components/SpeedMultiplierSelector.test.tsx` — SpeedMultiplierSelector
- [ ] `e2e/login.spec.ts` — login E2E
- [ ] `e2e/session-flow.spec.ts` — session E2E
- [ ] Framework install: `npm install -D vitest @testing-library/react jsdom @playwright/test fake-indexeddb && npx playwright install`

## Sources

### Primary (HIGH confidence)
- Vitest guide: https://vitest.dev/guide/ — config, mocking, timers
- Playwright webServer: https://playwright.dev/docs/test-webserver — dual servers, env
- Vitest timers: https://main.vitest.dev/guide/mocking/timers — vi.useFakeTimers, advanceTimersByTime

### Secondary (MEDIUM confidence)
- WebSearch: Vitest mock import.meta.glob — mock modules, not glob
- WebSearch: fake-indexeddb Vitest — setup file, globalThis.indexedDB
- npm view (2025-03-19): vitest 4.1.0, @testing-library/react 16.3.2, @playwright/test 1.58.2

### Tertiary (LOW confidence)
- WebSearch: setInterval fake timers issue — known edge cases; use advanceTimersToNextTimer if needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified, official docs
- Architecture: HIGH — Playwright webServer, Vitest config patterns from docs
- Pitfalls: MEDIUM — some from WebSearch; fake timers edge cases noted

**Research date:** 2025-03-19
**Valid until:** 30 days (stable stack)
