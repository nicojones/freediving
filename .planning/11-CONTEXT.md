# Phase 11: Refactor Code (Quality Pass) — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for second refactor pass — clsx correctness, small components, extract sub-components.  
**Phase:** 11. Refactor Code (Quality Pass)

---

## Refactoring Principles

1. **clsx correctness** — Use clsx for all conditional class names. No string concatenation (`'base ' + (x ? 'a' : 'b')`) or inline ternaries where clsx fits. Pattern: `clsx('base', { 'conditional': condition })`.
2. **Component size** — Keep components logically small (~150 lines max). Split when exceeding.
3. **Extract sub-components** — Even small UI blocks (status banners, inline messages, repeated patterns) must be extracted to named sub-components for clarity and testability.
4. **Rules of hooks** — No early returns before hooks. All hooks must be called unconditionally; guard inside effects/callbacks or return null only after all hooks have run.
5. **Constants in src/constants/** — Magic words and shared constants moved out of components. No inline fallbacks like `?? 'CO2 Tolerance III'` or `const SPEEDS = [1, 2, 5, 10, 25]` in component files.
6. **lodash + type-fest** — Use lodash utilities (`isEmpty`, `isNil`, `isNull`, etc.) instead of inline null/undefined/empty checks. Use type-fest for type utilities when helpful.

---

## Decisions

### 1. clsx Usage

- **Rule:** All conditional `className` logic uses `clsx` (or `cn` if project uses that alias). No `className={condition ? 'a' : 'b'}` or `className={'base ' + (x ? 'extra' : '')}`.
- **Pattern:** `clsx('base-classes', { 'conditional-class': condition }, optionalClass)`.
- **Audit:** Scan all components for `className=`; replace non-clsx conditionals with clsx.
- **Example (correct):** `clsx('px-6 pt-8', { 'pb-40': showDayDetail })`.

### 2. Component Size

- **Rule:** Components stay under ~150 lines. Logic and layout complexity should be split into smaller components or hooks.
- **Same as Phase 9:** Components >150 lines → extract sections, extract logic to utils/hooks.

### 3. Extract Small UI Blocks to Sub-components

- **Rule:** Even small inline blocks (e.g. 5–15 lines) should be extracted when they represent a distinct UI concept. Improves clarity and enables unit testing.
- **Example (from Dashboard.tsx 107–117):** The progress error and saved message blocks:
  ```tsx
  {progressError && (
    <p className="px-6 py-3 ...">{progressError}</p>
  )}
  {savedMessage && (
    <p className="px-6 py-3 ...">Saved</p>
  )}
  ```
  → Extract to `StatusBanner` (or `DashboardStatusBanner`) component with props `{ progressError?: string, savedMessage?: boolean }`. Renders one or the other; returns null if neither.
- **Other candidates:** Scan Dashboard, SettingsView, ActiveSessionView, SessionCompleteView for similar inline blocks (confirmation dialogs, plan selector section, etc.).

### 4. Rules of Hooks

- **Rule:** Never place an early return (`if (!x) return null`) before any hook calls. Hooks must run in the same order every render.
- **Anti-pattern (Dashboard.tsx 64–66):** `if (!plan) return null` followed by `useEffect` — when plan is null, useEffect is never called, violating rules of hooks.
- **Fix:** Move all hooks before any conditional return. Guard effect logic inside the effect: `useEffect(() => { if (!plan) return; ... }, [plan, ...])`. Only then `if (!plan) return null` before the JSX return.

### 5. Constants in src/constants/

- **Rule:** Magic words, fallback strings, and shared constants live in `src/constants/*`. Components import from constants, not inline.
- **Examples:**
  - Plan name fallback: `planWithMeta?.name ?? 'CO2 Tolerance III'` → `DEFAULT_PLAN_NAME` in `src/constants/app.ts` (or `plans.ts`)
  - Speed multipliers: `const SPEEDS = [1, 2, 5, 10, 25] as const` in SpeedMultiplierSelector → `src/constants/test.ts` (or `session.ts`)
  - Plan ID fallback: `activePlanId ?? 'default'` → `DEFAULT_PLAN_ID` in constants
- **File structure:** Group by domain: `app.ts` (app-wide strings), `test.ts` (test-mode/session constants), etc.

### 6. lodash and type-fest

- **Rule:** Prefer lodash utilities over inline checks for clarity and consistency.
- **Patterns to replace:**
  - `x == null` / `x === null` / `!x` (when checking null/undefined) → `isNil(x)` or `isNull(x)` as appropriate
  - `Array.isArray(x) && x.length === 0` / `Object.keys(obj).length === 0` → `isEmpty(x)`
  - `x == null` (null or undefined) → `isNil(x)`
- **Import:** Use `import {isNil} from 'lodash'` (and similarly for isNull, isEmpty) to allow for treeshake (preferred)
- **type-fest:** Use when type utilities help (e.g. `Optional` for optional props, `ReadonlyDeep`, etc.). Add only when it improves type safety or clarity.

### 7. Naming and Placement

- **Sub-components:** Place in `src/components/` with descriptive names (e.g. `StatusBanner`, `PlanSelectorSection`).
- **Co-location:** If a sub-component is used only by one parent, it may live in a `components/` subfolder next to the parent (e.g. `Dashboard/StatusBanner.tsx`) — project convention applies. Default: `src/components/` for reuse potential.

---

## Out of Scope for Phase 11

- Adding new features or user-facing behavior changes
- Splitting TrainingContext into multiple contexts
- Test coverage (extraction enables it; writing tests is separate)
- Performance optimization

---

## Traceability

| Decision | Outcome |
|----------|---------|
| clsx correctness | All conditional classNames use clsx; audit and fix |
| Component size | Components <150 lines; split when larger |
| Extract sub-components | StatusBanner (progressError/savedMessage); other small blocks as identified |
| Rules of hooks | No early return before hooks; fix Dashboard and audit others |
| Constants | Magic words/constants in src/constants/*; audit and extract |
| lodash + type-fest | Use lodash (isEmpty, isNil, isNull) and type-fest where helpful |
| Naming | Sub-components in src/components/ with descriptive names |

---

## Code Context

- **Dashboard.tsx:** (1) Fix rules of hooks: move `useEffect` before `if (!plan) return null`; guard effect body with `if (!plan) return`. (2) Extract `StatusBanner` for progressError/savedMessage (lines 107–117). Keep TopAppBar, InstallPrompt, DayListSection, SessionPreviewSection, RestDayCard, isPlanComplete message, BottomNavBar.
- **clsx audit:** Components using clsx: Dashboard, ActiveSessionView, PrimaryButton, PhaseBreakdownItem, BottomNavBar, SpeedMultiplierSelector. Others may need clsx for conditional classes (e.g. SettingsView plan selector, SessionCompleteView).
- **Phase 9 artifacts:** getDayId, useSessionEngine, DayListSection, SessionPreviewSection remain; Phase 11 builds on them.
- **Constants to extract:** DEFAULT_PLAN_NAME (Dashboard, SettingsView, SessionCompleteView, TopAppBar); SPEEDS (SpeedMultiplierSelector); DEFAULT_PLAN_ID (TrainingContext); optionally DEFAULT_USERNAME (App.tsx).
- **lodash + type-fest:** lodash and type-fest already in package.json. Replace `!plan`, `x === null`, `x.length === 0` with `isNil`, `isNull`, `isEmpty` where appropriate. Use lodash-es for tree-shaking (or lodash with individual imports).

---

*Context captured from /gsd-discuss-phase 11 — user specified: clsx correctness, small components, extract sub-components (e.g. Dashboard 107–117), no early returns before hooks (e.g. Dashboard 64–66), magic words/constants in src/constants/* (e.g. plan name fallback, SPEEDS), lodash (isEmpty, isNil, isNull) + type-fest*
