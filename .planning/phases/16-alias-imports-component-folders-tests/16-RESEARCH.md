# Phase 16: Alias Imports, Component Folders & Extended Tests — Research

**Researched:** 2025-03-20
**Domain:** Path aliases (Next.js/TypeScript), component folder organization, component unit tests, E2E extension
**Confidence:** HIGH

## Summary

Phase 16 adds a `~` path alias for `src/*`, reorganizes 37 flat components into domain subfolders, extends component unit tests, and adds E2E coverage for reset progress, plan change, abort session, and non-happy-path flows. Next.js reads `tsconfig.json` paths natively; Vitest requires `vite-tsconfig-paths` to resolve `~` and `@`. Component folder structure follows domain-based grouping (ui/, session/, day/, layout/, settings/). E2E flows need additional `data-testid` attributes on ConfirmResetModal, ResetProgressSection, PlanSelectorSection, and SessionActionButtons (abort button). Phase 12 research applies for test patterns (data-testid only, no class selectors; fake-indexeddb; vi.useFakeTimers).

**Primary recommendation:** Add `~/*` to tsconfig paths; add `vite-tsconfig-paths` to Vitest config for alias resolution; organize components by domain; add missing data-testids before writing E2E; extend component tests with provider wrappers for context-dependent components.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ALIAS-01 | ~ path alias maps to src/ | tsconfig paths; Next.js reads natively; Vitest needs vite-tsconfig-paths |
| FOLDER-01 | Components in subfolders (ui, session, day, layout, settings) | Domain-based structure; barrel exports optional |
| UNIT-01 | Component tests for AppShell, DayListSection, SessionPreviewSection, LockedDayCard, etc. | Vitest + @testing-library/react; mock next/navigation; wrap with TrainingProvider |
| E2E-01 | Reset progress flow | data-testid on reset button, ConfirmResetModal input/confirm; type "reset" to confirm |
| E2E-02 | Plan change flow | data-testid on plan selector; ConfirmResetModal same pattern |
| E2E-03 | Abort session flow | data-testid="abort-session-button" on SessionActionButtons |
| E2E-04 | Non-happy path (invalid login, invalid day, session already completed) | login-error exists; invalid day redirects to /; StartSessionCTA disabled state |
</phase_requirements>

## Standard Stack

### Core (extends Phase 12)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.0 | Unit test runner | Vite-native, ESM/TS, fast |
| @testing-library/react | 16.3.2 | React component testing | User-centric, React-recommended |
| @playwright/test | 1.58.2 | E2E testing | Modern, fast, webServer |
| jsdom | 29.0.x | DOM for unit tests | Standard for React tests |
| vite-tsconfig-paths | 6.1.1 | Path alias resolution in Vitest | Required for ~ and @ in tests |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fake-indexeddb | 6.x | IndexedDB mock | Services using idb (offlineQueue) |

**Path alias stack:**
- **Next.js:** Reads `tsconfig.json` `compilerOptions.paths` natively — no extra config.
- **Vitest:** Requires `vite-tsconfig-paths` plugin so `~` and `@` resolve when running tests.

**Installation (if adding vite-tsconfig-paths):**
```bash
npm install -D vite-tsconfig-paths
```

## Architecture Patterns

### Path Alias Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "~/*": ["./src/*"]
    }
  }
}
```

**Import style after ~ alias:**
- `import X from '~/components/ui/PrimaryButton'` — maps to `./src/components/ui/PrimaryButton`
- `import X from '~/views/LoginPage'` — maps to `./src/views/LoginPage`

**Vitest (vite.config.ts):** Add `vite-tsconfig-paths` so Vitest resolves tsconfig paths:
```typescript
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react(), tailwindcss(), /* ... */],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: true },
})
```

### Recommended Component Folder Structure

```
src/components/
├── ui/                    # Primitives, reusable
│   ├── PrimaryButton.tsx
│   ├── TextInput.tsx
│   ├── Loader.tsx
│   ├── BackButton.tsx
│   └── FishIcon.tsx
├── layout/                # Shell, nav, app structure
│   ├── AppShell.tsx
│   ├── TopAppBar.tsx
│   ├── BottomNavBar.tsx
│   └── InstallPrompt.tsx
├── day/                   # Day cards, day list
│   ├── DayListSection.tsx
│   ├── TrainingDayCard.tsx
│   ├── CompletedDayCard.tsx
│   ├── CurrentDayTrainingCard.tsx
│   ├── CurrentDayRestCard.tsx
│   ├── LockedDayCard.tsx
│   ├── RestDayCard.tsx
│   └── PlanCompleteMessage.tsx
├── session/               # Session preview, active session, completion
│   ├── SessionPreviewSection.tsx
│   ├── SessionPreviewStats.tsx
│   ├── SessionBreakdown.tsx
│   ├── SessionActionButtons.tsx
│   ├── PhaseBreakdownItem.tsx
│   ├── StartSessionCTA.tsx
│   ├── ActiveSessionView.tsx
│   ├── SessionCompleteView.tsx
│   ├── HoldProgressRing.tsx
│   └── SpeedMultiplierSelector.tsx
├── settings/              # Settings-specific
│   ├── SettingsView.tsx
│   ├── PlanSelectorSection.tsx
│   ├── ResetProgressSection.tsx
│   ├── UserProfileCard.tsx
│   └── ConfirmResetModal.tsx
└── shared/                # Status, modals (or merge into ui)
    ├── StatusBanner.tsx
    └── (ConfirmResetModal if not in settings)
```

**Barrel exports (optional):** Add `index.ts` per subfolder to re-export for cleaner imports:
```typescript
// src/components/ui/index.ts
export { PrimaryButton } from './PrimaryButton'
export { TextInput } from './TextInput'
// ...
```

### Pattern: Component Tests with Context/Providers

**What:** Wrap context-dependent components (AppShell, DayListSection) with providers in tests.
**When to use:** Components that use `useTraining()`, `useRouter()`, or `usePathname()`.

**Example (AppShell needs TrainingProvider + next/navigation mock):**
```typescript
// src/components/layout/AppShell.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
}))

describe('AppShell', () => {
  it('renders login when user is null', () => {
    render(
      <AppShell>
        <div>children</div>
      </AppShell>
    )
    // AppShell wraps in TrainingProvider; when user is null, shows LoginPage
    expect(screen.getByTestId('login-username')).toBeInTheDocument()
  })
})
```

**Example (DayListSection — pass props, no context):**
```typescript
// src/components/day/DayListSection.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DayListSection } from './DayListSection'

const mockPlan = [{ phases: [] }, { phases: [{ type: 'hold', duration: 30 }] }]

describe('DayListSection', () => {
  it('renders day list with data-testid', () => {
    render(
      <DayListSection
        plan={mockPlan}
        completions={[]}
        currentDayIndex={0}
        onSelectDay={() => {}}
      />
    )
    expect(screen.getByTestId('dashboard-day-list')).toBeInTheDocument()
  })
})
```

### Anti-Patterns to Avoid

- **Adding ~ without Vitest support:** Tests will fail with "Cannot find module '~/...'". Add `vite-tsconfig-paths` when adding ~.
- **Moving components without updating imports:** Use find-and-replace or IDE refactor; verify build and tests after each subfolder.
- **E2E before data-testids:** ConfirmResetModal, ResetProgressSection, PlanSelectorSection, abort button lack data-testids. Add them before writing E2E.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Path alias resolution in Vitest | Manual resolve.alias for each path | vite-tsconfig-paths | Reads tsconfig; single source of truth |
| next/navigation in tests | Custom router context | vi.mock('next/navigation') | Standard, matches Next.js behavior |
| E2E element targeting | class names, fragile text | data-testid | Phase 12 requirement; stable |
| Component folder migration | Manual file moves | Systematic move + update imports | Avoids broken imports |

**Key insight:** Path aliases and test selectors are configuration concerns. Use established tooling (tsconfig paths, vite-tsconfig-paths, data-testid) rather than custom solutions.

## Common Pitfalls

### Pitfall 1: Vitest Fails to Resolve ~ After Adding to tsconfig
**What goes wrong:** `Cannot find module '~/components/...'` when running tests.
**Why it happens:** Vite/esbuild does not read tsconfig paths by default.
**How to avoid:** Add `vite-tsconfig-paths` to vite.config plugins. Place it before `react()` so path resolution runs first.
**Warning signs:** Build succeeds, `npm run test:run` fails on imports.

### Pitfall 2: Circular Imports After Folder Reorganization
**What goes wrong:** Runtime or build errors from circular dependencies (e.g. layout imports day, day imports layout).
**Why it happens:** Moving components can create new dependency cycles.
**How to avoid:** Keep shared primitives in `ui/`; avoid cross-folder cycles (session ↔ day). If needed, extract shared types/utils to `src/types` or `src/utils`.
**Warning signs:** "Maximum update depth exceeded" or build hangs.

### Pitfall 3: E2E Reset/Plan-Change Fails — No data-testid
**What goes wrong:** Playwright cannot reliably target ConfirmResetModal input, reset button, or plan selector.
**Why it happens:** These components lack data-testid attributes.
**How to avoid:** Add data-testids before writing E2E: `reset-progress-button`, `confirm-reset-input`, `confirm-reset-confirm`, `plan-selector`, `abort-session-button`.
**Warning signs:** Tests use `getByRole` or `getByPlaceholder` and break when copy changes.

### Pitfall 4: AppShell Test Fails — useTraining/useRouter
**What goes wrong:** "useTraining must be used within TrainingProvider" or "useRouter must be used within Next.js".
**Why it happens:** AppShell uses TrainingProvider internally; tests render AppShell which provides its own context. But if testing a child that uses useTraining, or if AppShell's initial render depends on router, mocks are needed.
**How to avoid:** Mock `next/navigation` in setup or per test file. AppShell already wraps in TrainingProvider — ensure test doesn't need a pre-seeded user/plan unless testing that path.
**Warning signs:** "Invalid hook call" or "useX must be used within Y".

### Pitfall 5: Invalid Day ID — Redirect Timing
**What goes wrong:** E2E asserts on redirect to `/` but assertion runs before useEffect completes.
**Why it happens:** Dashboard's `useEffect` runs after paint; redirect is async.
**How to avoid:** Use `expect(page).toHaveURL('/')` or `waitFor` with timeout. Or `await expect(page).toHaveURL(/\/$/)` after navigating to `/day/invalid-day`.
**Warning signs:** Flaky test; passes locally, fails in CI.

## Code Examples

### tsconfig.json — Add ~ Alias
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "~/*": ["./src/*"]
    }
  }
}
```

### E2E — Reset Progress Flow
```typescript
// e2e/reset-progress.spec.ts
// Requires: data-testid="reset-progress-button" on ResetProgressSection
//           data-testid="confirm-reset-input", "confirm-reset-confirm" on ConfirmResetModal
import { test, expect } from '@playwright/test'

test('user can reset progress', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })

  await page.getByRole('button', { name: /settings/i }).click()
  await page.getByTestId('reset-progress-button').click()
  await page.getByTestId('confirm-reset-input').fill('reset')
  await page.getByTestId('confirm-reset-confirm').click()

  await expect(page.getByTestId('confirm-reset-input')).not.toBeVisible()
  // Verify progress cleared: day list shows no completed state (depends on plan)
})
```

### E2E — Abort Session Flow
```typescript
// Requires: data-testid="abort-session-button" on SessionActionButtons
test('user can abort session', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })

  const firstDay = page.locator('[data-testid^="day-card-"]').first()
  await firstDay.click()
  await page.getByTestId('test-mode-toggle').click()
  await page.getByTestId('start-session-button').click()

  await expect(page.getByTestId('abort-session-button')).toBeVisible({ timeout: 5000 })
  await page.getByTestId('abort-session-button').click()

  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })
})
```

### E2E — Non-Happy Path: Invalid Login
```typescript
test('invalid login shows error', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('baduser')
  await page.getByTestId('login-password').fill('badpass')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('login-error')).toBeVisible()
  await expect(page.getByTestId('login-error')).toBeVisible()
  // Optionally: expect(page.getByTestId('login-error')).toHaveTextContent(/invalid|incorrect|failed/i)
})
```
(LoginPage has `data-testid="login-error"`; verify it uses `data-testid-value` for the message if needed.)

### E2E — Invalid Day ID Redirect
```typescript
test('invalid day ID redirects to home', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('login-username').fill('nico')
  await page.getByTestId('login-password').fill('password')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('dashboard-day-list')).toBeVisible({ timeout: 5000 })

  await page.goto('/day/invalid-day-999')
  await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 5000 })
})
```

### E2E — Session Already Completed (Blocked)
```typescript
// Start session, complete it, then try to start again same day
// StartSessionCTA is disabled with "You've already trained today"
// Need data-testid on disabled CTA or message; or assert start button is disabled
test('cannot start session when already completed today', async ({ page }) => {
  // ... login, complete session (from session-flow.spec.ts) ...
  // Navigate back to day, try to start again
  await page.goto('/')
  const completedDay = page.locator('[data-testid^="day-card-"]').first()
  await completedDay.click()
  // StartSessionCTA is disabled; button has disabled attribute or message visible
  const startBtn = page.getByTestId('start-session-button')
  await expect(startBtn).toBeDisabled()
})
```

## Data-Testid Additions Required

| Component | Element | data-testid | Purpose |
|-----------|---------|-------------|---------|
| ResetProgressSection | Reset button | `reset-progress-button` | E2E reset flow |
| ConfirmResetModal | Input | `confirm-reset-input` | Type "reset" |
| ConfirmResetModal | Confirm button | `confirm-reset-confirm` | Submit |
| ConfirmResetModal | Cancel button | `confirm-reset-cancel` | Optional |
| PlanSelectorSection | Select | `plan-selector` | E2E plan change |
| SessionActionButtons | Abort button | `abort-session-button` | E2E abort flow |
| SettingsView | Logout button | `settings-logout` | Optional |
| BottomNavBar | Settings link | Needs role/label or data-testid | Navigate to settings |

**Note:** BottomNavBar uses buttons with "Training" and "Settings" labels — use `getByRole('button', { name: /settings/i })` for E2E. Optional: add `data-testid="nav-settings"` for stability.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Relative imports only | Path aliases (@, ~) | Common 2020+ | Cleaner imports |
| Flat components/ | Domain subfolders | Medium+ apps | Easier navigation |
| Jest + CRA | Vitest + Vite | 2022+ | No Jest config |
| Cypress | Playwright | 2020+ | Faster, webServer |

**Deprecated/outdated:**
- Manual `resolve.alias` for each path in Vite: use `vite-tsconfig-paths` instead.
- Class-based test selectors: Phase 12 locks data-testid only.

## Open Questions

1. **Barrel exports (index.ts) per subfolder**
   - What we know: Optional; can simplify imports to `~/components/ui` instead of `~/components/ui/PrimaryButton`.
   - What's unclear: Whether to adopt project-wide or only for high-traffic folders.
   - Recommendation: Start without barrels; add later if imports feel verbose.

2. **ConfirmResetModal — single vs multiple instances**
   - What we know: SettingsView renders two ConfirmResetModal instances (reset, planChange) with different isOpen.
   - What's unclear: E2E may need to target the visible one; data-testid on the modal container is sufficient since only one is open at a time.
   - Recommendation: Use `confirm-reset-input` and `confirm-reset-confirm` — when modal is open, they're unique.

3. **Plan change E2E — multiple plans**
   - What we know: PlanSelectorSection uses a `<select>`. Need second plan in test data.
   - What's unclear: Does default setup have multiple plans? Check `src/data/*-plan.json`.
   - Recommendation: Ensure at least two plans exist for E2E (e.g. default-plan, minimal-plan); or seed via API if needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Vitest 4.1.0 |
| Unit config | vite.config.ts (test block) |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test -- --run` |
| E2E framework | Playwright 1.58.2 |
| E2E config | playwright.config.ts |
| E2E run command | `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ALIAS-01 | ~ resolves in build | build | `npm run build` | N/A |
| FOLDER-01 | Components in subfolders | build | `npm run build` | N/A |
| UNIT-01 | AppShell, DayListSection, etc. | unit | `vitest run src/components/**/*.test.tsx` | Partial |
| E2E-01 | Reset progress | e2e | `npx playwright test e2e/reset-progress.spec.ts` | ❌ Wave 0 |
| E2E-02 | Plan change | e2e | `npx playwright test e2e/plan-change.spec.ts` | ❌ Wave 0 |
| E2E-03 | Abort session | e2e | `npx playwright test e2e/abort-session.spec.ts` | ❌ Wave 0 |
| E2E-04 | Error paths | e2e | `npx playwright test e2e/error-paths.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test -- --run && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vite.config.ts` — add vite-tsconfig-paths plugin for ~ alias in tests
- [ ] `ConfirmResetModal.tsx` — add data-testid="confirm-reset-input", "confirm-reset-confirm"
- [ ] `ResetProgressSection.tsx` — add data-testid="reset-progress-button"
- [ ] `PlanSelectorSection.tsx` — add data-testid="plan-selector"
- [ ] `SessionActionButtons.tsx` — add data-testid="abort-session-button"
- [ ] `e2e/reset-progress.spec.ts` — reset flow
- [ ] `e2e/plan-change.spec.ts` — plan change flow
- [ ] `e2e/abort-session.spec.ts` — abort session flow
- [ ] `e2e/error-paths.spec.ts` — invalid login, invalid day, session completed
- [ ] Component tests: AppShell, DayListSection, SessionPreviewSection, LockedDayCard (and others as planned)

## Sources

### Primary (HIGH confidence)
- Next.js Absolute Imports: https://nextjs.org/docs/app/building-your-application/configuring/absolute-imports-and-module-aliases
- Next.js Vitest: https://nextjs.org/docs-wip/app/building-your-application/testing/vitest
- Phase 12 Research: .planning/phases/12-tests/12-RESEARCH.md

### Secondary (MEDIUM confidence)
- WebSearch: Next.js 15 path alias tilde — tsconfig paths work; no special ~ handling
- WebSearch: React component folder structure 2024 — domain-based subfolders recommended

### Tertiary (LOW confidence)
- WebSearch: vite-tsconfig-paths — standard for Vitest + tsconfig paths; npm 6.1.1

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js docs, Phase 12 extends cleanly
- Architecture: HIGH — folder structure matches codebase; E2E flows match existing UI
- Pitfalls: MEDIUM — Vitest path resolution verified; E2E data-testid gaps identified from codebase

**Research date:** 2025-03-20
**Valid until:** 30 days (stable stack)
