# Phase 16: Alias Imports, Component Folders & Extended Tests — Executable Plan

---

phase: 16-alias-imports-component-folders-tests
plans:

- id: "01"
  tasks: 6
  depends_on: [15-refactor-cleanup]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths: - "~ alias maps to src/ for imports" - "src/components organized into subfolders" - "Component tests added for components in subfolders" - "E2E tests cover non-happy path, reset progress, plan change, abort session"

---

## Objective

Add `~` path alias for `src/*`, reorganize `src/components` into subfolders, add component tests for reorganized components, and extend E2E coverage with non-happy-path flows.

**Purpose:** Cleaner imports, better component organization, stronger test coverage.

**Principles:**

- Use `~` (tilde) as alias for `src/` — e.g. `import X from '~/components/...'`
- Group components by domain (ui, session, day, layout, settings, etc.)
- Add unit tests for components that lack them
- E2E tests for reset progress, plan change, abort breathhold session, and error paths

---

## Context

- @.planning/PROJECT.md
- @.planning/phases/12-tests/12-RESEARCH.md

**Existing:** Phase 15 (Refactor Cleanup) complete. Current path alias: `@/*` → `./*`. Components are flat in `src/components/`. E2E: login + session-flow (happy path only). Some components have unit tests (PrimaryButton, StatusBanner, HoldProgressRing, SpeedMultiplierSelector).

---

## Plan 01: Alias, Folders & Tests

### Task 1: Add ~ Path Alias

**Files:** `tsconfig.json`, `next.config.ts` (or equivalent)

**Action:**

1. Add `"~/*": ["./src/*"]` to `tsconfig.json` `compilerOptions.paths`
2. Ensure Next.js resolves `~` — may need `next.config` `experimental.turbo.resolveAlias` or standard path resolution
3. Update one or two imports as proof-of-concept (e.g. in `app/` or a component)
4. Run `npm run build` — verify build succeeds

**Done:** `~` resolves to `src/`; imports like `import X from '~/components/...'` work.

---

### Task 2: Sub-divide src/components into Subfolders

**Files:** `src/components/**`, all files that import from components

**Action:**

1. Define subfolder structure (suggested: `ui/`, `session/`, `day/`, `layout/`, `settings/`, or similar)
2. Move components into appropriate subfolders (e.g. `PrimaryButton.tsx` → `ui/PrimaryButton.tsx`)
3. Add `index.ts` per subfolder to re-export (optional, for cleaner imports)
4. Update all imports across the codebase
5. Run `npm run build` and `npm run test:run` — verify no regressions

**Done:** Components organized; all imports updated; build and tests pass.

---

### Task 3: Add Component Unit Tests

**Files:** `src/components/**/*.test.tsx`

**Action:**

1. Identify components without tests (e.g. AppShell, DayListSection, SessionPreviewSection, LockedDayCard, etc.)
2. Add unit tests for at least 3–5 key components using Vitest + @testing-library/react
3. Use `data-testid` for element targeting (per Phase 12)
4. Run `npm run test:run` — all pass

**Done:** Additional component tests added; suite passes.

---

### Task 4: E2E — Reset Progress

**Files:** `e2e/reset-progress.spec.ts` (or extend existing)

**Action:**

1. Create E2E test: login → go to settings → reset progress → confirm → verify progress cleared (e.g. day list shows no completions)
2. Use `data-testid` selectors
3. Run `npm run test:e2e` — passes

**Done:** E2E covers reset progress flow.

---

### Task 5: E2E — Plan Change & Abort Session

**Files:** `e2e/plan-change.spec.ts`, `e2e/abort-session.spec.ts` (or combined)

**Action:**

1. **Plan change:** Login → settings → change plan (dropdown) → accept warning → verify new plan shown
2. **Abort session:** Login → start session (test mode) → abort/back before completion → verify user returns to day view without completion
3. Use `data-testid` selectors
4. Run `npm run test:e2e` — passes

**Done:** E2E covers plan change and abort session.

---

### Task 6: E2E — Non-Happy Path

**Files:** `e2e/error-paths.spec.ts` (or similar)

**Action:**

1. Add tests for: invalid login, invalid day ID redirect, session already completed (blocked), etc.
2. Use `data-testid` selectors
3. Run `npm run test:e2e` — passes

**Done:** E2E covers key error/edge paths.

---

## Success Criteria

1. **~ alias** — ✓ `import X from '~/components/...'` works
2. **Component folders** — ✓ `src/components/` has subfolders; imports updated
3. **Component tests** — ✓ Additional unit tests for components; `npm run test:run` passes
4. **E2E extended** — ✓ Reset progress, plan change, abort session, non-happy path covered

---

## How to Test

1. `npm run build` — succeeds with `~` imports
2. `npm run test:run` — all unit tests pass
3. `npm run test:e2e` — all E2E tests pass (login, session-flow, reset-progress, plan-change, abort-session, error-paths)
