# Phase 25: Component Library (Radix/Headless UI) — Context

**Created:** 2025-03-20  
**Purpose:** Implementation decisions for adopting Radix UI or Headless UI to reduce custom component maintenance burden.  
**Phase:** 25. Component Library

---

## Decisions (from user)

### 1. Library Choice

- **Options:** Radix UI or Headless UI (Tailwind Labs).
- **Rationale:** Both provide accessible primitives (Dialog, Tabs, etc.) without imposing design. Ant Design is too heavy and would clash with Fishly design tokens.
- **Preference:** Radix UI or Headless UI — user open to either; research/plan will recommend.

### 2. Scope

- **Modals/Dialogs:** Replace `ConfirmResetModal` and similar custom modals with library Dialog primitive.
- **Tabs:** Add Tabs primitive for Phase 26 (Plan Creation UX) — "Describe" vs "Paste/Raw" input modes.
- **Buttons:** Keep custom `PrimaryButton` and styling; library primitives for structure (Dialog, Tabs), not for every button. User concerned about "buttons, and so on" — address modals first; buttons can stay custom unless library offers clear benefit.

### 3. Design Consistency

- **Fishly tokens:** All library components must be styled with existing Tailwind tokens (`bg-surface-container-low`, `text-on-surface`, `border-outline-variant`, `primary`, `error`, etc.).
- **No visual change:** Users should not notice a difference; behavior and appearance preserved.

### 4. Dependencies

- **Phase 25** depends on Phase 24 (AI Plan Input Enhancements).
- **Phase 26** (Plan Creation UX) depends on Phase 25 — will use Dialog for confirm modal and Tabs for input-mode switching.

---

## Gray Areas — Resolved

### A. Radix vs Headless UI

- **Decision:** TBD by research — both are viable. Radix has more primitives; Headless UI is Tailwind-native. Plan will recommend based on bundle size, React 19 compatibility, and Tailwind integration.

### B. ConfirmResetModal Migration

- **Decision:** Replace with library Dialog; preserve props (`isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmWord`); keep same UX (type-to-confirm, Cancel/Confirm buttons).
- **Tests:** `ConfirmResetModal.test.tsx` must pass after migration.

### C. Button Migration

- **Decision:** Keep `PrimaryButton`, `BackButton` custom for now. Phase 25 focuses on Dialog and Tabs. Buttons can be revisited in Phase 27 (UI Polish) if needed.

---

## Code Context

- **ConfirmResetModal** (`src/components/settings/ConfirmResetModal.tsx`): Custom modal with `fixed inset-0`, `role="dialog"`, `aria-modal`; type-to-confirm input; Cancel/Confirm buttons. Used in PlansView for reset and plan-delete confirmations.
- **PrimaryButton** (`src/components/ui/PrimaryButton.tsx`): Custom CTA with gradient, loading state, sizes. Keep as-is.
- **Tailwind:** v4 with PostCSS; design tokens in `tailwind.config` or CSS variables.
- **Next.js:** 15; React 19.

---

## Success Criteria (from ROADMAP)

1. Radix UI or Headless UI installed and configured; compatible with Tailwind and Fishly design tokens
2. ConfirmResetModal replaced with library Dialog primitive (styled with existing tokens)
3. Tabs primitive available for Phase 26 (Plan Creation UX) tab input modes
4. No behavior change for users; existing tests pass
5. Documented patterns for future modal/dialog/tab usage

---

## In Scope for Phase 25 (expanded)

- **Dialog:** ConfirmResetModal
- **Tabs:** Primitive for Phase 26
- **Listbox:** PlanSelectorSection (native select → Headless Listbox)
- **Switch:** DevModeSection (native checkbox → Headless Switch)
- **RadioGroup:** SpeedMultiplierSelector (button group → Headless RadioGroup)

## Out of Scope for Phase 25

- Replacing all buttons with library primitives (PrimaryButton, BackButton stay custom)
- BottomNavBar (navigation, not tabbed content — Headless Tabs not applicable)
- Adding tooltips or other primitives not needed
- Changing visual design or introducing new design tokens

---

## Traceability

| Decision   | Outcome                                      |
| ---------- | -------------------------------------------- |
| Library    | Headless UI (from research)                  |
| Modals     | Replace ConfirmResetModal with Dialog        |
| Tabs       | Add Tabs primitive for Phase 26              |
| Listbox    | Replace PlanSelectorSection native select    |
| Switch     | Replace DevModeSection checkbox              |
| RadioGroup | Replace SpeedMultiplierSelector button group |
| Buttons    | Keep custom; defer to Phase 27 if needed     |

---

_Context captured from /gsd-insert-phase + /gsd-discuss-phase_
