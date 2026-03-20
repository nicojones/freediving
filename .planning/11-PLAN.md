# Phase 11: Refactor Code (Quality Pass) — Executable Plan

---
phase: 11-refactor-quality
plans:
  - id: "01"
    tasks: 6
    files: 12
    depends_on: [10-reset-plan-change]
type: execute
wave: 1
files_modified:
  - src/constants/app.ts
  - src/constants/test.ts
  - src/components/StatusBanner.tsx
  - src/components/PlanSelectorSection.tsx
  - src/components/ResetProgressSection.tsx
  - src/components/UserProfileCard.tsx
  - src/pages/Dashboard.tsx
  - src/components/SettingsView.tsx
  - src/components/SessionCompleteView.tsx
  - src/components/TopAppBar.tsx
  - src/components/SpeedMultiplierSelector.tsx
  - src/contexts/TrainingContext.tsx
  - src/components/ActiveSessionView.tsx
autonomous: false
requirements: []
user_setup: []
must_haves:
  truths:
    - "clsx used correctly for all conditional class names"
    - "Components stay under ~150 lines"
    - "Small UI blocks extracted to named sub-components (e.g. StatusBanner)"
    - "No early returns before hooks; rules of hooks respected"
    - "Magic words and constants in src/constants/*"
    - "lodash utilities (isEmpty, isNil, isNull) and type-fest used where helpful"
  artifacts:
    - path: src/components/StatusBanner.tsx
      provides: "Status banner for progress error / saved message"
      contains: "StatusBanner"
  key_links:
    - from: src/pages/Dashboard.tsx
      to: src/components/StatusBanner.tsx
      via: "renders StatusBanner"
      pattern: "StatusBanner"
---

## Objective

Improve code quality through a second refactor pass: enforce clsx correctness, keep components logically small, and extract even small UI blocks into sub-components for clarity and testability.

**Purpose:** Reduce technical debt, improve maintainability, enable unit testing of UI blocks.

**Principles:**
- clsx for all conditional classNames; no string concatenation or inline ternaries.
- Components under ~150 lines; split when larger.
- Extract small UI blocks (status banners, inline messages) to named sub-components.

**Output:** StatusBanner component; clsx audit complete; component size compliance.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/11-CONTEXT.md

**Existing:** Phases 1–10 complete. Dashboard 169 lines; ActiveSessionView 158 lines; progressError/savedMessage inline in Dashboard (lines 107–117).

**Design decisions (from 11-CONTEXT):**
- clsx for all conditional classNames
- Extract StatusBanner for progressError/savedMessage
- Components <150 lines; extract sub-components for clarity and testability

---

## Plan 01: Refactor Quality Pass

### Task 1: Fix Rules of Hooks in Dashboard + Extract StatusBanner

**Files:** `src/pages/Dashboard.tsx`, `src/components/StatusBanner.tsx`

**Action (Rules of hooks first):**
1. In `src/pages/Dashboard.tsx`: Move `useEffect` (lines 66–76) **before** the `if (!plan) return null` (line 64).
2. Guard the effect body: add `if (!plan) return` at the start of the effect callback so URL sync is skipped when plan is null.
3. The early return `if (!plan) return null` stays, but now comes **after** all hooks.

**Action (StatusBanner):**
1. Create `src/components/StatusBanner.tsx`:
   ```tsx
   interface StatusBannerProps {
     progressError?: string | null
     savedMessage?: boolean
   }
   export function StatusBanner({ progressError, savedMessage }: StatusBannerProps) {
     if (progressError) {
       return (
         <p className="px-6 py-3 w-full text-center text-error bg-error/20 rounded-lg text-sm font-body mb-4">
           {progressError}
         </p>
       )
     }
     if (savedMessage) {
       return (
         <p className="px-6 py-3 w-full text-center text-primary bg-primary/20 rounded-lg text-sm font-body mb-4">
           Saved
         </p>
       )
     }
     return null
   }
   ```
2. In `src/pages/Dashboard.tsx`:
   - Import StatusBanner
   - Replace the inline blocks (lines 106–116) with:
     ```tsx
     <StatusBanner progressError={progressError} savedMessage={savedMessage} />
     ```

**Verify:**
```bash
npm run build
# Manual: trigger progressError (e.g. offline sync fail) and savedMessage — both display correctly
```

**Done:** Rules of hooks fixed; StatusBanner extracted; Dashboard simplified.

---

### Task 2: Extract Constants to src/constants/

**Files:** `src/constants/app.ts`, `src/constants/test.ts`, `src/pages/Dashboard.tsx`, `src/components/SettingsView.tsx`, `src/components/SessionCompleteView.tsx`, `src/components/TopAppBar.tsx`, `src/components/SpeedMultiplierSelector.tsx`, `src/contexts/TrainingContext.tsx`, `src/App.tsx`

**Action:**
1. Create `src/constants/app.ts`:
   ```ts
   /** Fallback plan name when plan metadata is missing */
   export const DEFAULT_PLAN_NAME = 'CO2 Tolerance III'
   /** Fallback plan ID when no active plan stored */
   export const DEFAULT_PLAN_ID = 'default'
   /** Fallback username when user object missing */
   export const DEFAULT_USERNAME = 'Unknown'
   ```
2. Create `src/constants/test.ts`:
   ```ts
   /** Speed multiplier options for test mode */
   export const SPEEDS = [1, 2, 5, 10, 25] as const
   ```
3. Replace inline usages:
   - Dashboard, SettingsView, SessionCompleteView, TopAppBar: `?? 'CO2 Tolerance III'` → `?? DEFAULT_PLAN_NAME` (import from `../constants/app`)
   - TrainingContext: `?? 'default'` → `?? DEFAULT_PLAN_ID`
   - App.tsx: `?? 'Unknown'` → `?? DEFAULT_USERNAME`
   - SpeedMultiplierSelector: remove local `const SPEEDS`; import from `../constants/test`

**Verify:**
```bash
npm run build
# Manual: plan name, plan selector, speed selector, username — all display correctly
```

**Done:** Magic words and constants moved to src/constants/*.

---

### Task 3: lodash + type-fest Usage

**Files:** Components and services with null/undefined/empty checks (Dashboard, TrainingContext, planService, timerEngine, ActiveSessionView, App, etc.)

**Action:**
1. Add lodash individual imports where helpful: `import {isNil} from 'lodash'`...
2. Replace patterns:
   - `!plan` / `plan == null` (when checking null or undefined) → `isNil(plan)`
   - `x === null` (strict null only) → `isNull(x)`
   - `array.length === 0` / `Object.keys(obj).length === 0` → `isEmpty(x)` where it improves clarity
3. Use type-fest when it improves type safety (e.g. `Optional<T>`, `RequiredKeys`, etc.). Add only where it adds value.
4. **Scope:** Focus on high-traffic or error-prone areas first. Don't over-apply; keep code readable. Prefer lodash where it reduces boilerplate (`isNil(x)` vs `x == null`).

**Verify:**
```bash
npm run build
# Manual: null/undefined/empty guards still work correctly
```

**Done:** lodash and type-fest used where they improve clarity and type safety.

---

### Task 4: clsx Audit

**Files:** All components with conditional `className`

**Action:**
1. Scan all `src/**/*.tsx` for `className=` that use:
   - String concatenation: `'base ' + (x ? 'a' : 'b')`
   - Inline ternaries: `className={x ? 'a' : 'b'}` (when multiple classes or complex)
   - Template literals with conditionals: `` className={`base ${x ? 'a' : ''}`} ``
2. Replace with clsx pattern: `clsx('base', { 'conditional': condition })`
3. Ensure `import clsx from 'clsx'` is present where needed
4. **Known clsx users (already correct):** Dashboard, ActiveSessionView, PrimaryButton, PhaseBreakdownItem, BottomNavBar, SpeedMultiplierSelector
5. **Check:** App.tsx, LoginPage, SessionCompleteView, SettingsView, other components for any conditional classNames

**Verify:**
```bash
npm run build
rg "className=\{" src --type tsx
# No className with ternary/concatenation that should use clsx
```

5. **Rules of hooks audit:** Scan all components for `return` before `useEffect`/`useState`/`useCallback`/etc. Fix any early returns that come before hooks (move hooks up, guard inside effect/callback).

**Done:** All conditional classNames use clsx; rules of hooks respected.

---

### Task 5: Extract SettingsView Section Components

**Files:** `src/components/SettingsView.tsx`, `src/components/PlanSelectorSection.tsx`, `src/components/ResetProgressSection.tsx`, `src/components/UserProfileCard.tsx`

**Action:**
1. Create `src/components/PlanSelectorSection.tsx`:
   - Props: `availablePlans`, `activePlanId`, `onPlanChange`
   - Renders: section with "Training plan" heading, select dropdown
2. Create `src/components/ResetProgressSection.tsx`:
   - Props: `onResetProgress`
   - Renders: section with "Reset progress" heading, description, Reset button
3. Create `src/components/UserProfileCard.tsx`:
   - Props: `username`
   - Renders: card with person icon, "Logged in as", username
4. Update `src/components/SettingsView.tsx`:
   - Import and use PlanSelectorSection, ResetProgressSection, UserProfileCard
   - Keep: TopAppBar, BottomNavBar, Sign out button, layout
   - Pass handlers and data as props

**Verify:**
```bash
npm run build
# Manual: Settings page — plan dropdown, reset, user card, sign out — all work as before
```

**Done:** SettingsView sections extracted; component under 150 lines.

---

### Task 6: Component Size Audit and ActiveSessionView Split

**Files:** `src/components/ActiveSessionView.tsx`, `src/components/*`

**Action:**
1. Run line count: `wc -l src/components/*.tsx src/pages/*.tsx`
2. **Target:** All components <150 lines
3. **ActiveSessionView (158 lines):** Extract one or more sub-components:
   - Option A: `SessionProgressHeader` — progress bar + step label (lines ~38–52)
   - Option B: `SessionPhaseDisplay` — hold/recovery phase content (lines ~61–117)
   - Option C: `SessionActionButtons` — Complete / Abort buttons (lines ~117–150)
   - Extract at least one to bring ActiveSessionView under 150 lines
4. **Dashboard (169 → ~158 after Task 1):** If still >150, extract `PlanCompleteMessage` (isPlanComplete block) to a small component
5. Document any component that remains slightly over 150 with justification (e.g. "single cohesive view, further split would harm readability")

**Verify:**
```bash
npm run build
wc -l src/components/ActiveSessionView.tsx src/pages/Dashboard.tsx
# Both under 150 or justified
```

**Done:** Component size compliance; ActiveSessionView split.

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| clsx correctness | No conditional classNames without clsx; audit complete |
| Constants extracted | src/constants/app.ts, src/constants/test.ts; no inline magic words |
| lodash + type-fest | isNil, isNull, isEmpty used; type-fest where helpful |
| Components small | Dashboard, ActiveSessionView, SettingsView <150 lines |
| Sub-components extracted | StatusBanner, PlanSelectorSection, ResetProgressSection, UserProfileCard; ActiveSessionView sub-component(s) |
| No user-facing behavior change | Manual E2E: dashboard status messages, settings, session flow — all unchanged |

---

## Success Criteria

1. **clsx used correctly** — ✓ Audit; all conditional classNames use clsx
2. **Components stay logically small** — ✓ All under ~150 lines
3. **Small UI blocks extracted** — ✓ StatusBanner; SettingsView sections; ActiveSessionView sub-component(s)
4. **Constants in src/constants/** — ✓ DEFAULT_PLAN_NAME, DEFAULT_PLAN_ID, DEFAULT_USERNAME, SPEEDS
5. **lodash + type-fest** — ✓ isNil, isNull, isEmpty used; type-fest where helpful

---

## Output

After completion:
- `src/constants/app.ts` — DEFAULT_PLAN_NAME, DEFAULT_PLAN_ID, DEFAULT_USERNAME
- `src/constants/test.ts` — SPEEDS
- `src/components/StatusBanner.tsx` — progress error / saved message
- `src/components/PlanSelectorSection.tsx` — plan dropdown section
- `src/components/ResetProgressSection.tsx` — reset progress section
- `src/components/UserProfileCard.tsx` — logged-in user card
- `src/components/ActiveSessionView.tsx` — split; sub-component(s) extracted
- `src/pages/Dashboard.tsx` — uses StatusBanner; simplified
- `src/components/SettingsView.tsx` — uses section components; simplified
- clsx audit — all conditional classNames use clsx

---

## Dependency Graph

```
Task 1 (rules of hooks + StatusBanner)
    │
    ├──> Task 2 (constants) — independent
    │
    ├──> Task 3 (lodash + type-fest) — independent
    │
    ├──> Task 4 (clsx audit) — independent
    │
    ├──> Task 5 (SettingsView sections) — independent
    │
    └──> Task 6 (size audit, ActiveSessionView split)
```

**Wave 1:** Task 1, Task 2, Task 3, Task 4, Task 5 (parallel after Task 1)
**Wave 2:** Task 6 (size audit)

---

## How to Test

1. **StatusBanner**
   - Dashboard: trigger progressError (e.g. go offline, complete session, sync fails) — error banner shows
   - Dashboard: complete session, save — "Saved" banner shows
   - Both never show at once; correct styling

2. **clsx**
   - No visual regressions; conditional styling (e.g. active nav tab, selected speed) still works

3. **Settings sections**
   - Plan dropdown: change plan, confirm — works
   - Reset progress: click, confirm — works
   - User card: shows username
   - Sign out: works

4. **ActiveSessionView**
   - Start session; progress bar, phase display, buttons — all work as before
   - Complete / Abort — unchanged behavior
