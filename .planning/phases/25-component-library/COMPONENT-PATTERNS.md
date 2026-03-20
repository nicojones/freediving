# Component Patterns (Phase 25)

Documented patterns for Headless UI usage with Fishly design tokens. Reference for future phases.

## Dialog

**When to use:** Confirmation modals, alerts.

**Example:** `ConfirmResetModal` — type-to-confirm with Cancel/Confirm buttons.

**Props:** `open`, `onClose` (required). Do not conditionally render; pass `open={isOpen}` so Dialog handles visibility and unmount.

**Key points:**

- Use `Dialog`, `DialogPanel`, `DialogTitle` from `@headlessui/react`
- Backdrop: sibling div with `fixed inset-0 bg-black/60`; centering div; `DialogPanel` inside
- Preserve `data-testid="confirm-reset-input"` and `data-testid="confirm-reset-confirm"` for E2E
- **Async onConfirm:** Call `onClose()` first, then `await onConfirm()` to avoid state update on unmounted component

```tsx
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

<Dialog open={isOpen} onClose={onClose} className="relative z-50">
  <div
    className="fixed inset-0 flex items-center justify-center p-4 bg-black/60"
    aria-hidden="true"
  />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <DialogPanel className="bg-surface-container-low rounded-3xl p-6 max-w-sm w-full border border-outline-variant/30 shadow-xl">
      <DialogTitle
        id="confirm-reset-title"
        className="font-headline text-xl font-bold text-on-surface mb-2"
      >
        {title}
      </DialogTitle>
      {/* content */}
    </DialogPanel>
  </div>
</Dialog>;
```

---

## Tabs

**When to use:** Phase 26 input modes (Describe vs Paste/Raw in CreatePlanSection).

**Example:** Import from `~/components/ui/Tabs` — re-exports TabGroup, TabList, Tab, TabPanels, TabPanel.

**Styling:** Use `data-selected:` for presence-based selectors (Tailwind v4). Use `data-[selected=false]:` for inverse.

```tsx
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '~/components/ui/Tabs';

<TabGroup>
  <TabList className="flex gap-2 border-b border-outline-variant/30">
    <Tab className="px-4 py-2 rounded-t-lg data-selected:bg-surface-container-low data-selected:text-on-surface data-[selected=false]:text-on-surface-variant">
      Describe
    </Tab>
    <Tab className="px-4 py-2 rounded-t-lg data-selected:bg-surface-container-low data-selected:text-on-surface data-[selected=false]:text-on-surface-variant">
      Paste / Raw
    </Tab>
  </TabList>
  <TabPanels>
    <TabPanel>Describe mode content</TabPanel>
    <TabPanel>Paste/Raw mode content</TabPanel>
  </TabPanels>
</TabGroup>;
```

---

## Listbox

**When to use:** Custom select (e.g. PlanSelectorSection).

**Example:** Replace native `<select>` with Listbox for custom styling.

**Props:** `value`, `onChange`. Use `value={activePlanId ?? ''}` and `onChange={(planId) => onPlanChange(planId)}`.

**Styling:** `data-active:` and `data-selected:` on ListboxOption for hover/selected states.

**E2E:** Preserve `data-testid="plan-selector"` on ListboxButton; add `data-testid="plan-selector-option"` or `data-testid-value` on options. E2E must click button to open, then click option (no native `selectOption`).

```tsx
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

<Listbox value={activePlanId ?? ''} onChange={onPlanChange}>
  <ListboxButton
    data-testid="plan-selector"
    className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface focus:border-primary focus:outline-none"
  >
    {selectedPlan?.name ?? 'Select plan'}
  </ListboxButton>
  <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-outline-variant/60 bg-surface-container-low shadow-xl">
    {plans.map((p) => (
      <ListboxOption
        key={p.id}
        value={p.id}
        data-testid="plan-selector-option"
        data-testid-value={p.id}
      >
        {p.name}
      </ListboxOption>
    ))}
  </ListboxOptions>
</Listbox>;
```

---

## Switch

**When to use:** Toggles (e.g. DevModeSection).

**Example:** Replace `<input type="checkbox">` with Switch.

**Props:** `checked`, `onChange`. Use `data-checked:` for checked state styling.

**Preserve:** `data-testid="dev-mode-toggle"` on Switch.

```tsx
import { Switch } from '@headlessui/react';

<Switch
  checked={devModeEnabled}
  onChange={setDevModeEnabled}
  data-testid="dev-mode-toggle"
  className="group inline-flex h-6 w-11 items-center rounded-full bg-surface-container-high transition data-checked:bg-primary data-checked:border-primary"
>
  <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
</Switch>;
```

---

## RadioGroup

**When to use:** Single-select from options (e.g. SpeedMultiplierSelector).

**Example:** Replace button group with RadioGroup.

**Props:** `value`, `onChange`. Use `data-checked:` on Radio for selected state (Headless UI uses `data-checked`, not `data-selected`).

**Preserve:** `data-testid="speed-selector"` on section; `data-testid="speed-option"` and `data-testid-value={String(speed)}` on each option.

```tsx
import { Radio, RadioGroup } from '@headlessui/react';

<RadioGroup value={value} onChange={onChange} className="flex gap-2">
  <span data-testid="speed-selector" className="...">
    {label}
  </span>
  {SPEEDS.map((speed) => (
    <Radio
      key={speed}
      value={speed}
      data-testid="speed-option"
      data-testid-value={String(speed)}
      className="px-4 py-2 rounded-xl font-label font-semibold data-checked:bg-primary data-checked:text-on-primary data-[checked=false]:bg-surface-container-high data-[checked=false]:text-on-surface-variant"
    >
      {speed}×
    </Radio>
  ))}
</RadioGroup>;
```

---

## Anti-Patterns

- **Wrapping Dialog in conditional render:** Do not `{isOpen && <Dialog>}` — pass `open={isOpen}` to Dialog.
- **Forgetting data-testid:** ConfirmResetModal, PlanSelectorSection, DevModeSection, SpeedMultiplierSelector rely on data-testids for E2E.
- **Async onConfirm order:** Call `onClose()` first, then `await onConfirm()`.
