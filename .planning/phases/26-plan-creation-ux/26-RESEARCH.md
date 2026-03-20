# Phase 26: Plan Creation UX — Research

**Researched:** 2025-03-20
**Domain:** Multi-tab form flows, draft→refine→confirm UX, Headless UI Tabs/Dialog
**Confidence:** HIGH

## Summary

Phase 26 restructures CreatePlanSection into a two-tab flow (Describe vs Paste/Raw) with a draft→preview→refine→confirm sequence for the natural-language path. Tab state isolation is achieved by separate state variables (`describeText`, `jsonText`) — Headless UI TabGroup manages selection; parent component state persists across tab switches. The state machine (empty → has text → draftPlan set) is simple enough for `useState`; no reducer or XState needed. ConfirmPlanModal follows the ConfirmResetModal pattern: `onClose()` before `await onConfirm()` to avoid unmounted state updates. The transcribe-from-text API currently accepts only `{ text }`; for Refine to work well, the API should accept optional `contextPlan` so the LLM can modify the existing plan rather than generate from scratch.

**Primary recommendation:** Use separate state per tab (`describeText`, `jsonText`); use `useState` for the state machine; use Phase 25 Tabs and Dialog; extend transcribe-from-text with optional `contextPlan` for Refine flow.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Two tabs:** Switch between natural-language input and JSON (hardcode) input. Labels: "Describe" / "Paste" or "Raw" (or "Paste / Raw").
- **No raw JSON display:** After LLM returns valid plan, show Preview (DayListSection, etc.) instead of raw JSON.
- **Button states:** a) Empty → "Describe your plan first" (disabled); b) Has text → "Create draft"; c) Draft set → Preview + Refine + Confirm.
- **Refine flow:** User can send new text to LLM; repeat until satisfied; textbox clears after each success.
- **Confirm modal:** Prefilled name/description; hint "You can edit the plan name and description below."; button "Proceed with defaults" when unchanged, "Save" when edited.
- **Scope:** Phase 26 = structural UX (tab, preview, refine, confirm). Phase 27 = general UI polish — deferred.

### Claude's Discretion

- Tab label wording: "Paste" vs "Raw" vs "Paste / Raw" — all acceptable.
- Generate button: "Create draft" preferred; "Generate draft" acceptable.
- Preview: All days visible; reuse DayListSection readonly (onSelectDay no-op).
- Refine placeholder: "Can you change ... ... ?" — conversational.
- Confirm modal: Use Phase 25 Dialog primitive.

### Deferred Ideas (OUT OF SCOPE)

- General UI polish (Phase 27)
- Dedicated plan creation screen
- Editing plan JSON in-place after generation (Paste tab is paste/upload only)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                   | Research Support                                                                                        |
| ------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| PCUX-01 | CreatePlanSection has two tabs: Describe and Paste/Raw                                        | TabGroup, TabList, Tab, TabPanels, TabPanel from Phase 25; separate state per tab                       |
| PCUX-02 | Describe tab state machine: empty → disabled; has text → Create draft → transcribe-from-text  | useState for describeText, draftPlan, isCreatingDraft; no reducer needed                                |
| PCUX-03 | Preview section reuses DayListSection readonly; all days visible                              | DayListSection with plan={draftPlan.days}, onSelectDay={() => {}}, completions=[], currentDayIndex=null |
| PCUX-04 | Refine flow: empty textbox, placeholder; user can repeat until satisfied                      | Refine textarea + Refine button; POST transcribe-from-text; optional contextPlan for API                |
| PCUX-05 | Confirm modal: prefilled name/description; Proceed with defaults vs Save based on dirty state | ConfirmPlanModal with Dialog; track dirty; onClose() before await onConfirm()                           |
| PCUX-06 | Paste tab JSON-only; no LLM fallback; E2E tests pass                                          | Remove JSON→AI fallback from Paste path; update E2E to switch tabs                                      |

</phase_requirements>

## Standard Stack

### Core

| Library           | Version | Purpose      | Why Standard                                 |
| ----------------- | ------- | ------------ | -------------------------------------------- |
| @headlessui/react | 2.2.9   | Tabs, Dialog | Phase 25; Tailwind-native; already installed |

### Supporting

| Library | Version | Purpose                | When to Use                     |
| ------- | ------- | ---------------------- | ------------------------------- |
| clsx    | 2.1.1   | Conditional classNames | Already in project; tab styling |

### Alternatives Considered

| Instead of                 | Could Use                         | Tradeoff                                                                                      |
| -------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| useState for state machine | useReducer / XState               | State machine has 3 states; useState is sufficient; reducer adds complexity without benefit   |
| TabGroup default           | TabGroup selectedIndex + onChange | Default uncontrolled mode is fine; controlled only if we need to reset tab on draftPlan clear |

**Installation:** No new packages. Phase 25 provides Headless UI.

**Version verification:** `@headlessui/react` 2.2.9 (verified 2025-03-20).

## Architecture Patterns

### Recommended Project Structure

```
src/components/settings/
├── CreatePlanSection.tsx   # TabGroup wraps Describe + Paste; state machine; Preview; Refine; Confirm
├── ConfirmPlanModal.tsx   # New: name/description inputs; dirty tracking; Dialog
└── ConfirmResetModal.tsx  # Existing; pattern reference
```

### Pattern 1: Tab State Isolation

**What:** Each tab has its own input and state. Switching tabs does not mix values.

**When to use:** Describe tab has `describeText`; Paste tab has `jsonText`. Both live in parent CreatePlanSection state.

**Implementation:**

- Use separate `useState` for each tab: `describeText`, `jsonText`.
- TabPanel content is in different panels; Headless UI unmounts inactive panels by default (`unmount={true}`). Parent state persists.
- Do NOT use a single shared textarea or shared state — that would mix Describe and Paste content.

```tsx
// CreatePlanSection state
const [describeText, setDescribeText] = useState('');
const [jsonText, setJsonText] = useState('');
const [draftPlan, setDraftPlan] = useState<PlanWithMeta | null>(null);

<TabGroup>
  <TabList>...</TabList>
  <TabPanels>
    <TabPanel>
      <textarea
        value={describeText}
        onChange={(e) => setDescribeText(e.target.value)}
        data-testid="create-plan-describe-textarea"
      />
    </TabPanel>
    <TabPanel>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        data-testid="create-plan-json-textarea"
      />
    </TabPanel>
  </TabPanels>
</TabGroup>;
```

### Pattern 2: State Machine (useState)

**What:** Three states for Describe path: (a) empty, (b) has text, (c) draftPlan set.

**When to use:** Simple linear flow; no branching or complex transitions.

**Implementation:** Use `useState` for `describeText`, `draftPlan`, `isCreatingDraft`. Derive UI from state:

```tsx
// State a: describeText empty → button disabled, label "Describe your plan first"
// State b: describeText non-empty → button enabled, label "Create draft"
// State c: draftPlan set → show Preview, Refine textarea, Refine button, Confirm button

const primaryDisabled = !describeText.trim();
const primaryLabel = primaryDisabled ? 'Describe your plan first' : 'Create draft';
```

### Pattern 3: Confirm Modal — onClose Before onConfirm

**What:** Call `onClose()` before `await onConfirm()` to avoid state updates on unmounted component.

**When to use:** Any async confirm handler (ConfirmResetModal, ConfirmPlanModal).

**Source:** COMPONENT-PATTERNS.md

```tsx
const handleConfirm = async () => {
  onClose();
  await onConfirm(name, description);
};
```

### Pattern 4: Dirty State for Dynamic Button Label

**What:** Compare current input values to initial; show "Proceed with defaults" when unchanged, "Save" when edited.

**Implementation:**

```tsx
const [name, setName] = useState(plan.name);
const [description, setDescription] = useState(plan.description ?? '');
const isDirty = name !== plan.name || description !== (plan.description ?? '');
const submitLabel = isDirty ? 'Save' : 'Proceed with defaults';
```

### Anti-Patterns to Avoid

- **Single shared textarea for both tabs:** Mixes Describe and Paste content; use separate state.
- **Conditional Dialog render:** Do not `{isOpen && <Dialog>}` — pass `open={isOpen}` to Dialog.
- **Await onConfirm before onClose:** Causes "Can't perform a React state update on an unmounted component" if parent updates state after modal closes.

## Don't Hand-Roll

| Problem       | Don't Build                     | Use Instead                                             | Why                                           |
| ------------- | ------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Tabs          | Custom tab buttons + visibility | Headless UI TabGroup, TabList, Tab, TabPanels, TabPanel | Accessibility, focus management, keyboard nav |
| Modal         | Custom overlay + focus trap     | Headless UI Dialog                                      | A11y, escape key, focus management            |
| State machine | XState, complex reducer         | useState                                                | 3 states, linear flow; overkill               |
| Tab styling   | Custom selected state           | data-selected: (Tailwind)                               | Headless UI exposes data-selected             |

**Key insight:** Phase 25 already provides Tabs and Dialog. Reuse them; do not reimplement.

## Common Pitfalls

### Pitfall 1: Tab Switch Loses State

**What goes wrong:** User types in Describe tab, switches to Paste, switches back — Describe text is gone.

**Why it happens:** Using a single shared state or clearing state on tab change.

**How to avoid:** Keep `describeText` and `jsonText` as separate state; never clear on tab switch. TabPanel unmount does not clear parent state.

**Warning signs:** `onChange` on TabGroup that resets state.

### Pitfall 2: Async onConfirm Without onClose First

**What goes wrong:** "Warning: Can't perform a React state update on an unmounted component."

**Why it happens:** Parent calls `setState` after modal closes; modal's async `onConfirm` completes after `onClose` unmounts the dialog.

**How to avoid:** Call `onClose()` immediately, then `await onConfirm()`. Parent should not depend on modal being mounted during async work.

**Source:** COMPONENT-PATTERNS.md

### Pitfall 3: E2E Selectors Break After Tab Restructure

**What goes wrong:** `create-plan-json-textarea` not found — it's now inside Paste tab and may be hidden when Describe tab is selected.

**Why it happens:** TabPanel unmounts inactive content; Paste tab content is not in DOM when Describe is selected.

**How to avoid:** E2E must click the Paste tab first before interacting with `create-plan-json-textarea`. Use `page.getByRole('tab', { name: /paste/i })` or similar to switch tabs.

**How to fix:** Add `data-testid="create-plan-tab-describe"` and `data-testid="create-plan-tab-paste"` to Tab elements so E2E can click to switch before interacting with tab-specific elements.

**Warning signs:** Tests that assume textarea is always visible.

### Pitfall 4: Refine Without Context Produces Wrong Plan

**What goes wrong:** User types "make it 2:30" in Refine; LLM generates a brand-new plan with 2:30 holds but loses 3-day structure, recovery times, etc.

**Why it happens:** transcribe-from-text only receives `{ text }`; LLM has no current plan context.

**How to avoid:** Extend API with optional `contextPlan`; when present, use prompt: "Current plan: [JSON]. User wants: [text]. Return modified plan." See Open Questions.

## Code Examples

### CreatePlanSection Structure (High-Level)

```tsx
// CreatePlanSection.tsx — structure only
export function CreatePlanSection({ onPlanCreated }: CreatePlanSectionProps) {
  const [describeText, setDescribeText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [draftPlan, setDraftPlan] = useState<PlanWithMeta | null>(null);
  const [refineText, setRefineText] = useState('');
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <TabGroup>
        <TabList>
          <Tab>Describe</Tab>
          <Tab>Paste / Raw</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* Describe: textarea, Create draft button */}
            {/* When draftPlan: Preview (DayListSection), Refine textarea, Refine button, Confirm button */}
          </TabPanel>
          <TabPanel>
            {/* Paste: jsonText textarea, upload/paste/clear, Create plan button */}
          </TabPanel>
        </TabPanels>
      </TabGroup>
      <ConfirmPlanModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} plan={draftPlan!} onConfirm={...} />
    </div>
  );
}
```

### DayListSection Readonly Preview

```tsx
// When draftPlan is set
<DayListSection
  plan={draftPlan.days}
  completions={[]}
  currentDayIndex={null}
  onSelectDay={() => {}}
  planName={draftPlan.name}
  planDescription={draftPlan.description}
/>
```

### ConfirmPlanModal Pattern (from ConfirmResetModal)

```tsx
// ConfirmPlanModal.tsx
<Dialog open={isOpen} onClose={onClose} className="relative z-50">
  <div className="fixed inset-0 ... bg-black/60" aria-hidden="true" />
  <div className="fixed inset-0 flex items-center justify-center p-4">
    <DialogPanel>
      <DialogTitle>Save plan</DialogTitle>
      <input data-testid="confirm-plan-name" ... />
      <input data-testid="confirm-plan-description" ... />
      <button data-testid="confirm-plan-submit" onClick={handleConfirm}>{submitLabel}</button>
    </DialogPanel>
  </div>
</Dialog>

const handleConfirm = async () => {
  onClose();
  await onConfirm(name, description);
};
```

## Refine Flow — API Consideration

**Current API:** `POST /api/plans/transcribe-from-text` accepts `{ text: string }` only.

**Problem:** Refine sends "Can you change 2 min holds to 2:30?" — LLM has no context about the current plan. It may produce a new plan from scratch, losing structure.

**Recommendation:** Extend request body with optional `contextPlan?: PlanWithMeta`. When present, use a refine-specific prompt:

```
Current plan (JSON): [contextPlan]
User request: [text]
Return the modified plan as valid PlanWithMeta JSON. Apply only the requested changes.
```

**Implementation:** Add to `app/api/plans/transcribe-from-text/route.ts`; validate contextPlan if provided; switch prompt based on presence. Client sends `{ text, contextPlan?: draftPlan }` when refining.

**Confidence:** MEDIUM — improves Refine UX significantly; small API change.

## State of the Art

| Old Approach                          | Current Approach                                           | Impact                               |
| ------------------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| Single textarea, JSON-or-AI heuristic | Separate tabs: Describe (always AI) vs Paste (always JSON) | Clear separation; no ambiguity       |
| Show raw JSON after LLM               | Show Preview (DayListSection)                              | User sees plan structure, not syntax |
| One-shot create                       | Draft → Preview → Refine (repeat) → Confirm                | Iterative refinement                 |

## Open Questions

1. **Refine API — contextPlan**
   - What we know: transcribe-from-text accepts `{ text }` only; Refine sends refine text as-is.
   - What's unclear: Whether Refine works well without context (user must type full context: "I have 3 days, 2 min holds... change to 2:30").
   - Recommendation: Add optional `contextPlan` to API for Phase 26; use refine prompt when present.

2. **AIVoicePlanInput placement**
   - What we know: AIVoicePlanInput calls `onResult(JSON.stringify(plan))` — returns JSON string. Plan says it can stay in Describe tab.
   - Recommendation: Keep in Describe tab. When voice transcribe returns PlanWithMeta, parse in CreatePlanSection and `setDraftPlan(parsed)` directly — skips "Create draft" text step. Same post-draft flow (Preview, Refine, Confirm) applies.

## Validation Architecture

### Test Framework

| Property           | Value                                  |
| ------------------ | -------------------------------------- |
| Framework          | Vitest 4 + Playwright 1.58             |
| Config file        | vitest.config.ts, playwright.config.ts |
| Quick run command  | `npm run test:run`                     |
| Full suite command | `npm run test:e2e`                     |

### Phase Requirements → Test Map

| Req ID  | Behavior                                            | Test Type    | Automated Command                 | File Exists?               |
| ------- | --------------------------------------------------- | ------------ | --------------------------------- | -------------------------- |
| PCUX-01 | Two tabs visible; switch between Describe and Paste | E2E          | `npm run test:e2e -- create-plan` | ✅ e2e/create-plan.spec.ts |
| PCUX-02 | Describe: empty → disabled; has text → Create draft | E2E          | same                              | ✅                         |
| PCUX-03 | Preview (DayListSection) after Create draft         | E2E          | same                              | ✅ (update for new flow)   |
| PCUX-04 | Refine flow repeatable; clears after success        | E2E / manual | —                                 | ❌ Wave 0                  |
| PCUX-05 | Confirm modal: name/description; Proceed vs Save    | E2E          | same                              | ✅ (update)                |
| PCUX-06 | Paste tab JSON-only; E2E pass                       | E2E          | same                              | ✅                         |

### Sampling Rate

- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] E2E: Update "paste free-form text" test to use Describe tab, create-plan-describe-textarea, create-plan-preview, create-plan-confirm-button, confirm-plan-submit
- [ ] E2E: Update Paste tab tests to click "Paste / Raw" tab before accessing create-plan-json-textarea
- [ ] E2E: Add Refine flow test (optional; can be manual for MVP)

## Sources

### Primary (HIGH confidence)

- COMPONENT-PATTERNS.md — Dialog, Tabs, async onConfirm
- Headless UI Tabs docs (headlessui.com/react/tabs) — TabGroup, selectedIndex, onChange, data-selected
- CreatePlanSection.tsx — current implementation
- transcribe-from-text/route.ts — API contract

### Secondary (MEDIUM confidence)

- WebSearch: multi-tab form state isolation — controlled tabs with selectedIndex
- WebSearch: draft-refine-confirm UX — human-in-the-loop, iterative refinement

### Tertiary (LOW confidence)

- Refine API contextPlan — recommendation based on UX analysis; not verified in similar apps

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — Phase 25 provides everything; no new deps
- Architecture: HIGH — patterns from COMPONENT-PATTERNS and Headless UI docs
- Pitfalls: HIGH — async onConfirm, E2E selectors documented; Refine API MEDIUM

**Research date:** 2025-03-20
**Valid until:** 30 days (stable domain)
