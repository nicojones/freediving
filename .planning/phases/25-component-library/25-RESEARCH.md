# Phase 25: Component Library (Radix/Headless UI) — Research

**Researched:** 2025-03-20
**Domain:** Headless component libraries (Dialog, Tabs), Next.js 15, React 19, Tailwind v4
**Confidence:** HIGH

## Summary

Phase 25 adopts a headless component library to replace custom ConfirmResetModal and add Tabs for Phase 26. **Headless UI** is recommended over Radix UI: Tailwind-native (same team as Tailwind), single package with Dialog and Tabs, React 19 compatible, and no global CSS conflicts with Tailwind v4. Both libraries provide accessible primitives; Headless UI's `open`/`onClose` API maps directly to the existing `isOpen`/`onClose` pattern. Migration preserves ConfirmResetModal props (title, message, confirmWord, type-to-confirm), data-testids, and Fishly design tokens. PrimaryButton stays custom.

**Primary recommendation:** Use Headless UI (`@headlessui/react`). Replace ConfirmResetModal with Dialog + DialogBackdrop + DialogPanel + DialogTitle; add TabGroup/TabList/Tab/TabPanels/TabPanel for Phase 26. Style with Fishly tokens via className; use `data-selected:` for tab states (Tailwind v4 supports bare `data-*` selectors).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Library choice:** Radix UI or Headless UI — user open to either; research/plan will recommend
- **Scope:** Replace ConfirmResetModal with library Dialog; add Tabs primitive for Phase 26; keep custom PrimaryButton
- **Design:** Fishly tokens (bg-surface-container-low, text-on-surface, border-outline-variant, primary, error, etc.); no visual change for users
- **Dependencies:** Phase 25 depends on Phase 24; Phase 26 depends on Phase 25

### Claude's Discretion

- Radix vs Headless UI — recommend based on bundle size, React 19 compatibility, Tailwind integration
- ConfirmResetModal migration — preserve props and UX; tests must pass
- Button migration — keep custom; defer to Phase 27 if needed

### Deferred Ideas (OUT OF SCOPE)

- Replacing all buttons with library primitives
- Adding dropdowns, tooltips, or other primitives not needed by Phase 26
- Changing visual design or introducing new design tokens

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                | Research Support                                      |
| ------- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| COMP-01 | Radix or Headless UI installed; compatible with Tailwind and Fishly tokens | Headless UI recommended; className + Fishly tokens    |
| COMP-02 | ConfirmResetModal replaced with library Dialog                             | Dialog + DialogBackdrop + DialogPanel; preserve props |
| COMP-03 | Tabs primitive available for Phase 26                                      | TabGroup, TabList, Tab, TabPanels, TabPanel           |
| COMP-04 | No behavior change; existing tests pass                                    | Preserve data-testid; same UX (type-to-confirm)       |
| COMP-05 | Documented patterns for future modal/dialog/tab usage                      | Code examples in RESEARCH.md                          |

</phase_requirements>

## Standard Stack

### Core

| Library           | Version | Purpose                 | Why Standard                                                                                       |
| ----------------- | ------- | ----------------------- | -------------------------------------------------------------------------------------------------- |
| @headlessui/react | 2.2.9   | Dialog, Tabs primitives | Tailwind Labs product; single package; React 19 compatible; no global CSS; className-based styling |

### Supporting

| Library | Version | Purpose                | When to Use                           |
| ------- | ------- | ---------------------- | ------------------------------------- |
| clsx    | 2.1.1   | Conditional classNames | Already in project; tab state styling |

### Alternatives Considered

| Instead of  | Could Use                                     | Tradeoff                                                                                                             |
| ----------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Headless UI | @radix-ui/react-dialog + @radix-ui/react-tabs | Radix: modular (two packages), more primitives; Headless UI: single package, Tailwind-native, simpler for this scope |

**Installation:**

```bash
npm install @headlessui/react
```

**Version verification:** `@headlessui/react` 2.2.9 (verified 2025-03-20). Radix: @radix-ui/react-dialog 1.1.15, @radix-ui/react-tabs 1.1.13.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── ui/           # PrimaryButton (keep), Loader, etc.
│   └── settings/
│       ├── ConfirmResetModal.tsx   # Uses Headless Dialog
│       └── ...
└── ...
```

### Pattern 1: Controlled Dialog (ConfirmResetModal replacement)

**What:** Dialog with `open`/`onClose`; custom content (type-to-confirm input, Cancel/Confirm buttons) inside DialogPanel.

**When to use:** Confirmation modals, alerts.

**Example:**

```tsx
// Source: headlessui.com/react/dialog
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

function ConfirmResetModal({ isOpen, onClose, onConfirm, title, message, confirmWord = 'reset' }) {
  const [confirmInput, setConfirmInput] = useState('');
  useEffect(() => {
    if (isOpen) setConfirmInput('');
  }, [isOpen]);
  const canConfirm = confirmInput.toLowerCase() === confirmWord.toLowerCase();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/60" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-surface-container-low rounded-3xl p-6 max-w-sm w-full border border-outline-variant/30 shadow-xl">
          <DialogTitle className="font-headline text-xl font-bold text-on-surface mb-2">
            {title}
          </DialogTitle>
          <p className="text-on-surface-variant font-body text-sm mb-4">{message}</p>
          <input
            type="text"
            data-testid="confirm-reset-input"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={`Type '${confirmWord}' to confirm`}
            className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface focus:border-primary focus:outline-none mb-4"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="...">
              Cancel
            </button>
            <button
              type="button"
              data-testid="confirm-reset-confirm"
              onClick={async () => {
                onClose();
                await onConfirm();
              }}
              disabled={!canConfirm}
              className="..."
            >
              Confirm
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
```

### Pattern 2: Tabs (Phase 26 input modes)

**What:** TabGroup with TabList (triggers) and TabPanels (content). Use `data-selected:` for styling active tab.

**When to use:** Switching between "Describe" vs "Paste/Raw" input modes in CreatePlanSection.

**Example:**

```tsx
// Source: headlessui.com/react/tabs
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';

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

### Anti-Patterns to Avoid

- **Wrapping Dialog in conditional render:** Headless UI Dialog handles unmount via `unmount` prop; use `open` to control visibility. Do not `{isOpen && <Dialog>}` — pass `open={isOpen}` to Dialog.
- **Forgetting data-testid:** ConfirmResetModal tests rely on `confirm-reset-input` and `confirm-reset-confirm`; preserve these.
- **Using Radix Themes:** @radix-ui/themes ships global CSS that conflicts with Tailwind v4. Use Radix Primitives only if switching; Primitives are unstyled.

## Don't Hand-Roll

| Problem             | Don't Build               | Use Instead             | Why                                                 |
| ------------------- | ------------------------- | ----------------------- | --------------------------------------------------- |
| Focus trap in modal | Custom tab-index logic    | Headless Dialog         | Handles focus trap, inert, keyboard nav             |
| Portal for overlay  | document.body.appendChild | Headless Dialog         | Renders in portal by default                        |
| Escape key to close | onKeyDown handler         | Headless Dialog onClose | Built-in Esc handling                               |
| ARIA for dialog     | role="dialog", aria-modal | Headless DialogTitle    | Proper aria-labelledby, screen reader announcements |
| Tab keyboard nav    | Arrow keys, Home/End      | Headless TabGroup       | WAI-ARIA tabs pattern                               |

**Key insight:** Accessibility (focus trap, inert, keyboard, ARIA) is complex and error-prone. Headless UI handles it; custom implementations often miss edge cases.

## Common Pitfalls

### Pitfall 1: Dialog unmount and async onConfirm

**What goes wrong:** Calling `onClose()` before `await onConfirm()` can unmount the dialog while async work runs, causing "Can't perform a React state update on an unmounted component" or lost state.

**Why it happens:** Parent sets `isOpen=false` via onClose; dialog unmounts; onConfirm continues.

**How to avoid:** Call `onClose()` first (to update parent state), then `await onConfirm()`. The parent's handler should not depend on dialog being mounted. Current ConfirmResetModal does this correctly.

**Warning signs:** Console warnings about state updates on unmounted components.

### Pitfall 2: Tailwind v4 data attribute syntax

**What goes wrong:** Using `data-[selected=true]:` when Tailwind v4 expects `data-selected:` for presence-based selectors.

**Why it happens:** Tailwind v4 simplified data attribute modifiers; bare `data-selected:` matches when attribute exists.

**How to avoid:** Use `data-selected:bg-*` for Headless Tab; use `data-[selected=false]:` when you need the inverse (Tailwind v4 supports both; check docs for value syntax).

**Warning signs:** Tab styles not applying on selection.

### Pitfall 3: DialogBackdrop vs overlay div

**What goes wrong:** Putting overlay styles on Dialog itself instead of DialogBackdrop; backdrop and panel not siblings, causing scroll/click issues.

**Why it happens:** Headless UI recommends DialogBackdrop as sibling to panel container for independent transitions and correct stacking.

**How to avoid:** Use DialogBackdrop for `fixed inset-0 bg-black/60`; use a sibling div for centering; DialogPanel inside.

**Warning signs:** Backdrop doesn't cover viewport; scroll doesn't work on long dialogs.

### Pitfall 4: confirmWord case sensitivity

**What goes wrong:** User types "Reset" but confirmWord is "reset" — ConfirmResetModal uses `.toLowerCase()`; ensure migration preserves this.

**How to avoid:** Keep `confirmInput.toLowerCase() === confirmWord.toLowerCase()` in migration.

## Code Examples

Verified patterns from official sources:

### Dialog with Backdrop (Headless UI)

```tsx
// Source: headlessui.com/react/dialog
<Dialog open={isOpen} onClose={onClose} className="relative z-50">
  <DialogBackdrop className="fixed inset-0 bg-black/30" />
  <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
    <DialogPanel className="max-w-lg bg-white p-12">
      <DialogTitle>Title</DialogTitle>
      {/* content */}
    </DialogPanel>
  </div>
</Dialog>
```

### Tabs with data-selected styling (Headless UI + Tailwind v4)

```tsx
// Source: headlessui.com/react/tabs
<Tab className="data-selected:bg-blue-500 data-selected:text-white data-[selected=false]:text-gray-500">
  Tab 1
</Tab>
```

### Controlled Dialog state (existing pattern)

```tsx
// Current ConfirmResetModal usage in SettingsView, PlansView, PlanDeleteSection
<ConfirmResetModal
  isOpen={confirmReset}
  onClose={handleCloseConfirm}
  onConfirm={handleConfirmReset}
  title="Reset progress"
  message={
    <>
      Type <strong>reset</strong> to confirm.
    </>
  }
  confirmWord="reset" // optional; "delete" for PlanDeleteSection
/>
```

## State of the Art

| Old Approach                  | Current Approach       | When Changed | Impact                           |
| ----------------------------- | ---------------------- | ------------ | -------------------------------- |
| Custom div + role="dialog"    | Headless Dialog        | Phase 25     | Focus trap, portal, ARIA handled |
| No Tabs primitive             | Headless TabGroup      | Phase 25     | Phase 26 can use for input modes |
| Tailwind v3 data-[attr=value] | Tailwind v4 data-attr: | Tailwind v4  | Simpler syntax for presence      |

**Deprecated/outdated:**

- Radix Themes (@radix-ui/themes): Global CSS conflicts with Tailwind v4; use Primitives only if choosing Radix.

## Open Questions

1. **Headless UI Dialog unmount behavior**
   - What we know: `unmount={true}` (default) unmounts when closed; `unmount={false}` hides.
   - What's unclear: Whether ConfirmResetModal tests need Dialog to unmount (they check `queryByTestId` when closed).
   - Recommendation: Keep default unmount; when `isOpen=false`, Dialog unmounts and tests pass (nothing in document).

2. **PlanDeleteSection confirmWord**
   - What we know: PlanDeleteSection uses `confirmWord="delete"`; SettingsView/PlansView use default "reset".
   - Recommendation: Preserve confirmWord prop; pass through to migration.

## Validation Architecture

### Test Framework

| Property           | Value                                        |
| ------------------ | -------------------------------------------- |
| Framework          | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file        | vitest.config.ts                             |
| Quick run command  | `npm run test:run`                           |
| Full suite command | `npm run test:run && npm run test:e2e`       |

### Phase Requirements → Test Map

| Req ID  | Behavior                                            | Test Type | Automated Command                                               | File Exists? |
| ------- | --------------------------------------------------- | --------- | --------------------------------------------------------------- | ------------ |
| COMP-02 | ConfirmResetModal renders nothing when closed       | unit      | `npm run test:run -- src/components/settings/ConfirmResetModal` | ✅           |
| COMP-02 | ConfirmResetModal renders input/buttons when open   | unit      | same                                                            | ✅           |
| COMP-02 | Confirm disabled until user types confirmWord       | unit      | same                                                            | ✅           |
| COMP-02 | onConfirm called when user types and clicks confirm | unit      | same                                                            | ✅           |
| COMP-04 | E2E reset/plan-change flows use ConfirmResetModal   | e2e       | `npm run test:e2e`                                              | ✅           |

### Sampling Rate

- **Per task commit:** `npm run test:run -- src/components/settings/ConfirmResetModal`
- **Per wave merge:** `npm run test:run && npm run build`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- None — existing ConfirmResetModal.test.tsx covers migration; preserve data-testid and behavior. Add Tabs tests in Phase 26 when Tabs are used.

## Sources

### Primary (HIGH confidence)

- headlessui.com/react/dialog — Dialog, DialogBackdrop, DialogPanel, DialogTitle API
- headlessui.com/react/tabs — TabGroup, TabList, Tab, TabPanels, TabPanel API
- radix-ui.com/primitives/docs/components/dialog — Radix Dialog anatomy (alternative)
- radix-ui.com/primitives/docs/guides/styling — Radix unstyled, data-state

### Secondary (MEDIUM confidence)

- WebSearch: Radix UI React 19 compatibility — resolved 2024–2025
- WebSearch: Headless UI React 19 compatibility — useId migration, peer deps
- WebSearch: Tailwind v4 data-selected — bare data-\* syntax

### Tertiary (LOW confidence)

- WebSearch: Radix vs Headless bundle size — Headless ~10KB; Radix tree-shakeable; no 2025 benchmarks

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — Headless UI official docs, npm versions verified
- Architecture: HIGH — Dialog/Tabs patterns from official docs
- Pitfalls: MEDIUM — async onConfirm, data attributes from docs + WebSearch

**Research date:** 2025-03-20
**Valid until:** 30 days (stable ecosystem)
