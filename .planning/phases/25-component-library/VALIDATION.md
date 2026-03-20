# Phase 25: Component Library (Radix/Headless UI) — Validation

**Phase:** 25. Component Library  
**Plan:** 25-PLAN.md  
**Purpose:** Automated and manual verification of Phase 25 success criteria.

---

## Success Criteria

1. Radix UI or Headless UI installed and configured; compatible with Tailwind and Fishly design tokens
2. ConfirmResetModal replaced with library Dialog primitive (styled with existing tokens)
3. Tabs primitive available for Phase 26 (Plan Creation UX) tab input modes
4. PlanSelectorSection replaced with Headless Listbox
5. DevModeSection replaced with Headless Switch
6. SpeedMultiplierSelector replaced with Headless RadioGroup
7. No behavior change for users; existing tests pass
8. Documented patterns for future modal/dialog/tab/listbox/switch/radio usage

---

## Verification Commands

### Automated

```bash
# Unit tests — ConfirmResetModal
npm run test:run -- src/components/settings/ConfirmResetModal
# Expect: All 4 tests pass

# Unit tests — DevModeSection
npm run test:run -- src/components/settings/DevModeSection
# Expect: Passes

# Unit tests — SpeedMultiplierSelector
npm run test:run -- src/components/session/SpeedMultiplierSelector
# Expect: Passes

# Unit tests — SessionPreviewSection (uses SpeedMultiplierSelector)
npm run test:run -- src/components/session/SessionPreviewSection
# Expect: Passes

# Build
npm run build
# Expect: Build succeeds; no Headless UI conflicts with Tailwind v4 or Next.js

# Full test suite (unit + E2E)
npm run test:run && npm run test:e2e
# Expect: All tests pass; E2E reset-progress, plan-change, create-plan flows pass
```

### Phase Requirements → Test Map

| Req ID  | Behavior                                | Test Type  | Command                                                                          |
| ------- | --------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| COMP-01 | Headless UI installed; compatible       | build      | `npm run build`                                                                  |
| COMP-02 | ConfirmResetModal uses Dialog           | unit       | `npm run test:run -- src/components/settings/ConfirmResetModal`                  |
| COMP-03 | Tabs primitive available                | manual     | `src/components/ui/Tabs.tsx` exports TabGroup, TabList, Tab, TabPanels, TabPanel |
| COMP-04 | No behavior change                      | unit + e2e | `npm run test:run && npm run test:e2e`                                           |
| COMP-05 | Documented patterns                     | manual     | COMPONENT-PATTERNS.md with Dialog, Tabs, Listbox, Switch, RadioGroup             |
| COMP-06 | PlanSelectorSection uses Listbox        | e2e        | `npm run test:e2e` (plan-change, create-plan)                                    |
| COMP-07 | DevModeSection uses Switch              | unit       | `npm run test:run -- src/components/settings/DevModeSection`                     |
| COMP-08 | SpeedMultiplierSelector uses RadioGroup | unit       | `npm run test:run -- src/components/session/SpeedMultiplierSelector`             |

---

## Manual Verification

### COMP-02: ConfirmResetModal (Dialog)

1. Open Settings → Reset progress.
2. Modal appears with title, message, input, Cancel, Confirm.
3. Confirm disabled until user types "reset".
4. Type "reset" → Confirm enabled → click Confirm → modal closes; progress resets.
5. Plans tab → delete non-active plan → modal with confirmWord "delete".
6. Type "delete" → Confirm → plan deleted.
7. Verify same UX as before migration (no visual change).

### COMP-03: Tabs Primitive

1. `src/components/ui/Tabs.tsx` exists.
2. Exports: TabGroup, TabList, Tab, TabPanels, TabPanel.
3. JSDoc or COMPONENT-PATTERNS.md documents Fishly styling (`data-selected:`, `data-[selected=false]:`).

### COMP-06: PlanSelectorSection (Listbox)

1. Plans tab → Training plan dropdown.
2. Click to open; options listed with Fishly styling.
3. Select different plan → confirm modal appears.
4. Verify E2E plan-change and create-plan pass.

### COMP-07: DevModeSection (Switch)

1. Settings → Developer section.
2. Toggle shows custom Switch styling (not native checkbox).
3. data-testid="dev-mode-toggle" present.

### COMP-08: SpeedMultiplierSelector (RadioGroup)

1. Session preview (with dev mode ON) → Speed (test) selector.
2. Options 1×, 2×, 5×, 10×, 25× with Fishly styling.
3. Selected state visually distinct.

### COMP-05: Documented Patterns

1. `.planning/phases/25-component-library/COMPONENT-PATTERNS.md` exists.
2. Contains: Dialog, Tabs, Listbox, Switch, RadioGroup patterns with Fishly tokens.
3. Notes: Do not wrap Dialog in conditional render; use `open` prop; call onClose before await onConfirm.

---

## Traceability

| Requirement | Verification                                                                     |
| ----------- | -------------------------------------------------------------------------------- |
| COMP-01     | @headlessui/react in package.json; build passes                                  |
| COMP-02     | ConfirmResetModal.test.tsx passes; manual reset/delete flows                     |
| COMP-03     | Tabs.tsx exports primitives; Fishly styling documented                           |
| COMP-04     | test:run + test:e2e green                                                        |
| COMP-05     | COMPONENT-PATTERNS.md with Dialog, Tabs, Listbox, Switch, RadioGroup             |
| COMP-06     | PlanSelectorSection uses Listbox; E2E plan-change, create-plan pass              |
| COMP-07     | DevModeSection uses Switch; DevModeSection.test.tsx passes                       |
| COMP-08     | SpeedMultiplierSelector uses RadioGroup; SpeedMultiplierSelector.test.tsx passes |
