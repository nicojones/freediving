# Phase 25: Component Library (Radix/Headless UI) — Executable Plan

---

phase: 25-component-library
plans:

- id: "01"
  tasks: 7
  depends_on: [24-ai-plan-input-enhancements]
  type: execute
  wave: 1
  autonomous: true
  requirements: [COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08]
  must_haves:
  truths: - "Headless UI installed; compatible with Tailwind v4 and Fishly design tokens" - "ConfirmResetModal uses Headless Dialog; same props, data-testid, type-to-confirm UX" - "Tabs primitive (TabGroup/TabList/Tab/TabPanels/TabPanel) available for Phase 26" - "PlanSelectorSection uses Headless Listbox; Fishly styling; data-testid plan-selector" - "DevModeSection uses Headless Switch; data-testid dev-mode-toggle" - "SpeedMultiplierSelector uses Headless RadioGroup; data-testid speed-selector, speed-option" - "No behavior change for users; all existing tests pass" - "Documented patterns for modal/dialog/tab/listbox/switch/radio usage"

---

## Objective

Add Headless UI to reduce maintenance burden of custom components. Replace ConfirmResetModal with Dialog; add Tabs for Phase 26; migrate PlanSelectorSection to Listbox, DevModeSection to Switch, SpeedMultiplierSelector to RadioGroup; document patterns. No visual or behavioral change for users.

**Principles:**

- Use Headless UI (@headlessui/react 2.2.9) — Tailwind-native, React 19 compatible
- Preserve ConfirmResetModal props (isOpen, onClose, onConfirm, title, message, confirmWord), data-testid (confirm-reset-input, confirm-reset-confirm), type-to-confirm UX, Fishly tokens
- Keep PrimaryButton custom; no button migration
- Tabs styled with Fishly tokens via data-selected: for Phase 26 input modes
- Listbox, Switch, RadioGroup styled with Fishly tokens; preserve data-testids for E2E

---

## Context

- **ConfirmResetModal:** `src/components/settings/ConfirmResetModal.tsx` — used in SettingsView, PlansView, PlanDeleteSection (confirmWord="delete" for delete)
- **Tests:** ConfirmResetModal.test.tsx — renders nothing when closed; input/buttons when open; disabled until confirmWord typed; onConfirm called
- **Stack:** Next.js 15, React 19, Tailwind v4, clsx 2.1.1
- **Research:** 25-RESEARCH.md recommends Headless UI; Dialog + DialogBackdrop + DialogPanel + DialogTitle; TabGroup/TabList/Tab/TabPanels/TabPanel
- **PlanSelectorSection:** `src/components/settings/PlanSelectorSection.tsx` — native `<select>`; used in PlansView; E2E uses plan-selector, selectOption
- **DevModeSection:** `src/components/settings/DevModeSection.tsx` — native checkbox; data-testid dev-mode-toggle; DevModeSection.test.tsx
- **SpeedMultiplierSelector:** `src/components/session/SpeedMultiplierSelector.tsx` — button group; data-testid speed-selector, speed-option, data-testid-value; SpeedMultiplierSelector.test.tsx

---

## Plan 01: Headless UI Install + Migrations + Documentation

### Task 1: Install Headless UI and Verify Compatibility

**Files:** `package.json`

**Action:**

1. Run `npm install @headlessui/react@2.2.9` (or latest 2.x compatible with React 19).
2. Run `npm run build` to verify no conflicts with Tailwind v4 or Next.js.
3. Run `npm run test:run` to ensure existing tests still pass (ConfirmResetModal unchanged at this point).

**Done:** @headlessui/react in package.json; build and tests pass.

---

### Task 2: Replace ConfirmResetModal with Headless Dialog

**Files:** `src/components/settings/ConfirmResetModal.tsx`

**Action:**

1. Import `Dialog`, `DialogBackdrop`, `DialogPanel`, `DialogTitle` from `@headlessui/react`.
2. Replace custom div-based modal with: `<Dialog open={isOpen} onClose={onClose} className="relative z-50">` — do NOT conditionally render; pass `open={isOpen}` so Dialog handles visibility and unmount.
3. Use `DialogBackdrop` for `fixed inset-0 bg-black/60`; sibling div for centering; `DialogPanel` inside with existing Fishly classes (bg-surface-container-low, rounded-3xl, p-6, max-w-sm, border, shadow-xl).
4. Use `DialogTitle` for the h2 with id="confirm-reset-title"; preserve aria-labelledby.
5. Preserve: props (isOpen, onClose, onConfirm, title, message, confirmWord), data-testid="confirm-reset-input" and "confirm-reset-confirm", type-to-confirm logic (confirmInput.toLowerCase() === confirmWord.toLowerCase()), case-insensitive comparison.
6. Preserve handleConfirm: call `onClose()` first, then `await onConfirm()` (avoids state update on unmounted component).
7. Preserve Cancel/Confirm button styling (Fishly tokens: border-outline-variant, bg-error/10 for confirm, disabled state).
8. Reset confirmInput in useEffect when isOpen becomes true.

**Done:** ConfirmResetModal uses Headless Dialog; same API and UX; `npm run test:run -- src/components/settings/ConfirmResetModal` passes; `npm run test:e2e` passes (reset-progress, plan-change flows).

---

### Task 3: Create Tabs Primitive for Phase 26

**Files:** `src/components/ui/Tabs.tsx`

**Action:**

1. Create new file `src/components/ui/Tabs.tsx`.
2. Re-export `TabGroup`, `TabList`, `Tab`, `TabPanels`, `TabPanel` from `@headlessui/react`.
3. Add a minimal example or wrapper that applies Fishly styling: `data-selected:bg-surface-container-low data-selected:text-on-surface data-[selected=false]:text-on-surface-variant` for Tab items.
4. Export a `TabsExample` or document the pattern in JSDoc so Phase 26 can copy the styling. Alternatively: export a styled `Tabs` component that accepts `tabs: { label: string; content: ReactNode }[]` and renders TabGroup/TabList/Tab/TabPanels/TabPanel with Fishly tokens.
5. Use Tailwind v4 syntax: `data-selected:` for presence-based selectors.

**Done:** Tabs primitive available; Phase 26 can import from `~/components/ui/Tabs` and use TabGroup/TabList/Tab/TabPanels/TabPanel with Fishly styling.

---

### Task 4: Document Component Patterns

**Files:** `.planning/phases/25-component-library/COMPONENT-PATTERNS.md`

**Action:**

1. Create COMPONENT-PATTERNS.md in the phase directory.
2. Document Dialog pattern: when to use, example (ConfirmResetModal), props (open/onClose), Fishly token usage, data-testid preservation.
3. Document Tabs pattern: when to use (Phase 26 input modes), example with TabGroup/TabList/Tab/TabPanels/TabPanel, data-selected styling, Fishly tokens.
4. Document Listbox pattern: when to use (custom select), example (PlanSelectorSection), value/onChange, Fishly styling.
5. Document Switch pattern: when to use (toggles), example (DevModeSection), checked/onChange, data-checked styling.
6. Document RadioGroup pattern: when to use (single-select from options), example (SpeedMultiplierSelector), value/onChange, data-selected styling.
7. Include code snippets from 25-RESEARCH.md (Pattern 1 and Pattern 2).
8. Note: Do not wrap Dialog in conditional render; use `open` prop. Call onClose before await onConfirm.

**Done:** COMPONENT-PATTERNS.md exists; future phases can reference for modal/dialog/tab/listbox/switch/radio usage.

---

### Task 5: Replace PlanSelectorSection with Headless Listbox

**Files:** `src/components/settings/PlanSelectorSection.tsx`, `src/views/PlansView.tsx`, `e2e/plan-change.spec.ts`, `e2e/create-plan.spec.ts`

**Action:**

1. Import `Listbox`, `ListboxButton`, `ListboxOptions`, `ListboxOption` from `@headlessui/react`.
2. Replace native `<select>` with Listbox. Use `value={activePlanId ?? ''}` and `onChange={(planId) => onPlanChange(planId)}`.
3. Change prop: `onPlanChange: (planId: string) => void` (was `(e: React.ChangeEvent<HTMLSelectElement>)`).
4. Style ListboxButton with Fishly tokens: `w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface focus:border-primary focus:outline-none`.
5. Style ListboxOptions as dropdown: `absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-outline-variant/60 bg-surface-container-low shadow-xl`.
6. Style ListboxOption with `data-active:` and `data-selected:` for hover/selected states.
7. Preserve `data-testid="plan-selector"` on Listbox or ListboxButton; add `data-testid="plan-selector-option"` (or `data-testid-value`) on each option for E2E.
8. Update PlansView: `handlePlanChange` receives `(planId: string)`; adapt to call `setConfirmPlanChange({ pendingPlanId: planId })` when `planId !== activePlanId`.
9. Update E2E: Listbox has no native `selectOption`. Replace with: click plan-selector button to open, then click option (e.g. `page.getByRole('option', { name: planName }).click()` or `page.getByTestId('plan-selector-option').nth(1).click()`).

**Done:** PlanSelectorSection uses Listbox; PlansView and E2E updated; `npm run test:e2e` passes (plan-change, create-plan).

---

### Task 6: Replace DevModeSection Checkbox with Headless Switch

**Files:** `src/components/settings/DevModeSection.tsx`

**Action:**

1. Import `Switch` from `@headlessui/react`.
2. Replace `<input type="checkbox">` with `<Switch checked={devModeEnabled} onChange={setDevModeEnabled}>`.
3. Style Switch with Fishly tokens: use `data-checked:` for checked state (e.g. `data-checked:bg-primary data-checked:border-primary` vs unchecked).
4. Preserve `data-testid="dev-mode-toggle"` on the Switch.
5. Keep label structure; Switch can be the trigger, label text as sibling.
6. Use `as="button"` or default if needed; style as toggle (rounded pill or similar).

**Done:** DevModeSection uses Switch; `npm run test:run -- src/components/settings/DevModeSection` passes.

---

### Task 7: Replace SpeedMultiplierSelector with Headless RadioGroup

**Files:** `src/components/session/SpeedMultiplierSelector.tsx`

**Action:**

1. Import `RadioGroup`, `RadioGroupLabel`, `RadioGroupOption` from `@headlessui/react`.
2. Replace button group with `<RadioGroup value={value} onChange={onChange}>`.
3. Use `RadioGroupLabel` for the label (or keep existing span with `data-testid="speed-selector"` on section).
4. Map SPEEDS to `RadioGroupOption`: `value={speed}` for each; style with `data-selected:` and `data-active:`.
5. Preserve `data-testid="speed-selector"` on the section; `data-testid="speed-option"` and `data-testid-value={String(speed)}` on each option.
6. Keep same props: `value: number`, `onChange: (speed: number) => void`, `label?: string`.
7. Use Fishly tokens: selected `bg-primary text-on-primary`, unselected `bg-surface-container-high text-on-surface-variant`.

**Done:** SpeedMultiplierSelector uses RadioGroup; `npm run test:run -- src/components/session/SpeedMultiplierSelector` passes; SessionPreviewSection tests pass.

---

## Success Criteria

1. **Headless UI installed** — ✓ @headlessui/react in package.json; build passes
2. **ConfirmResetModal replaced** — ✓ Uses Dialog + DialogBackdrop + DialogPanel + DialogTitle; same props, data-testid, type-to-confirm
3. **Tabs primitive available** — ✓ TabGroup/TabList/Tab/TabPanels/TabPanel exported from ui/Tabs.tsx with Fishly styling
4. **PlanSelectorSection replaced** — ✓ Uses Listbox; PlansView and E2E updated; plan-selector data-testid preserved
5. **DevModeSection replaced** — ✓ Uses Switch; dev-mode-toggle data-testid preserved
6. **SpeedMultiplierSelector replaced** — ✓ Uses RadioGroup; speed-selector, speed-option data-testids preserved
7. **No behavior change** — ✓ All unit and E2E tests pass
8. **Documented patterns** — ✓ COMPONENT-PATTERNS.md with Dialog, Tabs, Listbox, Switch, RadioGroup examples

---

## How to Test

1. **Unit tests:** `npm run test:run -- src/components/settings/ConfirmResetModal` — all 4 tests pass
2. **Unit tests:** `npm run test:run -- src/components/settings/DevModeSection` — passes
3. **Unit tests:** `npm run test:run -- src/components/session/SpeedMultiplierSelector` — passes
4. **Unit tests:** `npm run test:run -- src/components/session/SessionPreviewSection` — passes
5. **Build:** `npm run build` — succeeds
6. **E2E:** `npm run test:e2e` — reset-progress, plan-change, create-plan flows pass
7. **Manual:** Settings → Reset progress; Plans → change plan, delete plan; Settings → dev mode toggle; Session preview → speed selector; verify same UX as before

---

## Verification

- [x] @headlessui/react installed; no new lint/type errors
- [x] ConfirmResetModal.test.tsx: renders nothing when closed; input/buttons when open; disabled until confirmWord; onConfirm called
- [x] Tabs.tsx exports TabGroup, TabList, Tab, TabPanels, TabPanel; Fishly styling documented
- [x] PlanSelectorSection uses Listbox; PlansView onPlanChange receives planId; E2E plan-change, create-plan pass
- [x] DevModeSection uses Switch; DevModeSection.test.tsx passes
- [x] SpeedMultiplierSelector uses RadioGroup; SpeedMultiplierSelector.test.tsx, SessionPreviewSection.test.tsx pass
- [x] COMPONENT-PATTERNS.md exists with Dialog, Tabs, Listbox, Switch, RadioGroup patterns
