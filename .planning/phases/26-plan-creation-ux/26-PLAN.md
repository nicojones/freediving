# Phase 26: Plan Creation UX — Executable Plan

---

phase: 26-plan-creation-ux
plans:

- id: "01"
  tasks: 2
  depends_on: [25-component-library]
  type: execute
  wave: 1
  autonomous: true
  requirements: [PCUX-01, PCUX-02]
  must_haves:
  truths: - "CreatePlanSection has two tabs: Describe (natural language) and Paste/Raw (JSON)" - "Describe tab state machine: empty → disabled; has text → Create draft → transcribe-from-text"

- id: "02"
  tasks: 3
  depends_on: [01]
  type: execute
  wave: 2
  autonomous: true
  requirements: [PCUX-03, PCUX-04, PCUX-05]
  must_haves:
  truths: - "Preview section (not button) reuses DayListSection readonly; all days visible" - "Refine flow: empty textbox, placeholder; user can repeat until satisfied" - "Confirm modal: prefilled name/description; hint; Proceed with defaults vs Save based on dirty state"

- id: "03"
  tasks: 2
  depends_on: [02]
  type: execute
  wave: 3
  autonomous: true
  requirements: [PCUX-06]
  must_haves:
  truths: - "Paste tab: JSON only; validate → POST; no LLM fallback" - "Existing E2E tests pass; Describe → Preview → Confirm flow covered"

---

## Objective

Make plan creation more intuitive: tab to switch between natural-language and JSON input; show Preview (using existing components) instead of raw JSON after LLM response; refine flow with contextual button labels; confirm modal for name/description before saving.

**Principles:**

- Use Phase 25 Tabs primitive for input-mode switching
- Use Phase 25 Dialog primitive for confirm modal
- Reuse DayListSection, SessionBreakdown, SessionPreviewStats — readonly (no navigation)
- Tab labels: "Describe" / "Paste" or "Raw" (or "Paste / Raw")
- Generate button: "Create draft"
- Confirm modal: "Proceed with defaults" when unchanged, "Save" when edited

**Post-execution refinements (2025-03-20):**

- **Tab visibility:** Inactive tabs use `bg-outline-variant/10 text-on-surface-variant/80` so active tab stands out
- **Voice button label:** "Explain" (not "AI voice"); aria-label "Explain with voice"
- **Describe tab layout:** [textarea] → [Create draft button] → "or" divider → [Explain button]
- **When draft exists:** Hide input (textarea, Create draft, Explain); show only Preview button + Refine + Confirm in Describe tab
- **Preview:** "Preview plan" button opens modal; modal shows all days with SessionBreakdown (or "Rest day") — all days visible, scrollable
- **Refine section:** No space between refine textarea and Refine/Confirm buttons

---

## Context

- **UI library:** Phase 25 uses `@headlessui/react` 2.2.9. Phase 26 uses Tabs and Dialog from that library via Phase 25 primitives.
- **CreatePlanSection:** `src/components/settings/CreatePlanSection.tsx` — single textarea; JSON or text; Create button; calls transcribe-from-text or POST /api/plans. No tabs, no preview, no refine flow.
- **DayListSection:** `src/components/day/DayListSection.tsx` — takes `plan`, `completions`, `currentDayIndex`, `onSelectDay`, `planName`, `planDescription`. For readonly preview: pass `onSelectDay={() => {}}`, `completions=[]`, `currentDayIndex=null`.
- **Tabs:** `src/components/ui/Tabs.tsx` — re-exports TabGroup, TabList, Tab, TabPanels, TabPanel from `@headlessui/react`.
- **Dialog:** ConfirmResetModal uses Dialog, DialogPanel, DialogTitle from `@headlessui/react`; ConfirmPlanModal should follow the same pattern.
- **PlanWithMeta:** `{ id?, name, description?, days: PlanDay[] }`. Name/description used in confirm modal.
- **26-CONTEXT.md:** Full UX decisions (tab labels, button states, refine flow, confirm modal).

---

## Plan 01: Tabs + Describe State Machine

### Task 1: Add Tab Input Modes to CreatePlanSection

**Files:** `src/components/settings/CreatePlanSection.tsx`

**Action:**

1. Import `Tab`, `TabGroup`, `TabList`, `TabPanel`, `TabPanels` from `~/components/ui/Tabs`.
2. Wrap content in TabGroup. TabList with two tabs: "Describe" and "Paste / Raw" (or "Paste" or "Raw" per context).
3. **Tab state isolation:** Use separate state per tab — `describeText` for Describe tab, `jsonText` for Paste tab. Parent state persists across tab switches; never clear on tab change. (Research: Pitfall 1)
4. **Describe tab (TabPanel):** Layout: [textarea] → [Create draft button] → "or" divider → [Explain button]. Textarea placeholder: e.g. "Describe your plan (e.g. 3 days of holds, 2 min each, 2 min recovery)". AIVoicePlanInput (label "Explain") stays in Describe tab; when voice returns PlanWithMeta JSON, parse and `setDraftPlan(parsed)` directly — skips Create draft step, same post-draft flow (Preview, Refine, Confirm).
5. **Paste / Raw tab (TabPanel):** JSON textarea bound to `jsonText` + file upload + paste + clear buttons. Same behavior as today for JSON path.
6. Add `data-testid="create-plan-tab-describe"` and `data-testid="create-plan-tab-paste"` to Tab elements for E2E tab switching. Preserve `data-testid="create-plan-json-textarea"` for Paste tab; add `data-testid="create-plan-describe-textarea"` for Describe tab.

**Done:** Two tabs visible; inactive tabs muted (`bg-outline-variant/10`); Describe shows textarea → Create draft → or → Explain; Paste shows JSON textarea + upload/paste/clear; tab state isolated.

---

### Task 2: Implement Describe-Tab State Machine and Create Draft (Plan 01)

**Files:** `src/components/settings/CreatePlanSection.tsx`

**Action:**

1. Add state: `draftPlan: PlanWithMeta | null`, `describeText: string` (for Describe tab), `isCreatingDraft: boolean`.
2. **State a (empty):** Primary button disabled; label "Describe your plan first" (or similar hint).
3. **State b (has text):** Primary button enabled; label "Create draft"; onClick calls POST /api/plans/transcribe-from-text with describeText.
4. On success: set `draftPlan` to response; clear `describeText`; do NOT display raw JSON.
5. **State c (draftPlan set):** Transition to post-draft state; Plan 02 will render Preview, Refine, and Confirm.
6. On transcribe error: set error state; do not clear text.
7. Ensure Describe tab never parses input as JSON; always sends to transcribe-from-text.
8. Add `data-testid="create-plan-create-draft-button"` for the Describe-tab Create draft button (E2E).

**Done:** Describe tab: empty → disabled; has text → Create draft; success → draftPlan set, text cleared, Preview/Refine/Confirm appear.

---

## Plan 02: Preview + Refine + Confirm

### Task 3: Add Preview Section (Readonly DayListSection)

**Files:** `src/components/settings/CreatePlanSection.tsx`, `src/components/day/DayListSection.tsx` (optional)

**Action:**

1. When `draftPlan` is set, render Preview section below the input area.
2. Use DayListSection with: `plan={draftPlan.days}`, `completions={[]}`, `currentDayIndex={null}`, `onSelectDay={() => {}}`, `planName={draftPlan.name}`, `planDescription={draftPlan.description}`.
3. Pass `onSelectDay` as no-op so cards do not navigate (LockedDayCard with onSelect still renders as button but click does nothing; acceptable).
4. All days visible; no expand/collapse required for MVP (DayListSection renders flat list of TrainingDayCard).
5. Add `data-testid="create-plan-preview"` to Preview container.
6. Preview appears only when draftPlan is set (state c).

**Done:** After Create draft success, Preview section (not a button) shows plan using DayListSection; readonly; no navigation.

---

### Task 4: Implement Refine Flow

**Files:** `src/components/settings/CreatePlanSection.tsx`, `app/api/plans/transcribe-from-text/route.ts`

**Action:**

1. When draftPlan is set, show a second textarea (Refine textbox) with placeholder: "Can you change ... ... ?" (conversational, invites refinement).
2. Refine textbox starts empty; user types refinement request.
3. "Refine" button: sends `{ text: refineText, contextPlan: draftPlan }` to POST /api/plans/transcribe-from-text. On success, replaces draftPlan, clears Refine textbox.
4. **API extension:** Extend transcribe-from-text to accept optional `contextPlan?: PlanWithMeta`. When present, use refine-specific prompt: "Current plan (JSON): [contextPlan]. User request: [text]. Return the modified plan as valid PlanWithMeta JSON. Apply only the requested changes." (Research: Pitfall 4 — Refine without context produces wrong plan.)
5. Can repeat Refine multiple times.
6. "Confirm" / "Save plan" button: opens Confirm modal (Task 5).
7. Add `data-testid="create-plan-refine-textarea"`, `data-testid="create-plan-refine-button"`, `data-testid="create-plan-confirm-button"`.

**Done:** User can refine draft repeatedly; Refine sends contextPlan for accurate modifications; Refine textbox clears after each success; Confirm opens modal.

---

### Task 5: Add Confirm Modal for Name/Description (Plan 02)

**Files:** `src/components/settings/CreatePlanSection.tsx`, optionally `src/components/settings/ConfirmPlanModal.tsx` (new)

**Action:**

1. Create ConfirmPlanModal (or inline) using Headless UI Dialog (same pattern as ConfirmResetModal).
2. Props: `isOpen`, `onClose`, `plan: PlanWithMeta`, `onConfirm: (name: string, description: string) => void | Promise<void>`.
3. Content: two inputs (name, description) prefilled from plan.name, plan.description.
4. Hint text: "You can edit the plan name and description below."
5. Track dirty state: compare current input values to initial. Button label: "Proceed with defaults" when unchanged, "Save" when edited.
6. On confirm: call `onConfirm(name, description)`; parent POSTs to /api/plans with updated name/description; closes modal; calls onPlanCreated.
7. Add `data-testid="confirm-plan-name"`, `data-testid="confirm-plan-description"`, `data-testid="confirm-plan-submit"`.
8. Call `onClose()` before `await onConfirm()` to avoid unmounted state updates (per COMPONENT-PATTERNS.md).

**Done:** Confirm modal opens; user can edit name/description; dynamic button label; Save creates plan and closes.

---

## Plan 03: Paste Simplification + E2E

### Task 6: Simplify Paste Tab to JSON-Only

**Files:** `src/components/settings/CreatePlanSection.tsx`

**Action:**

1. In Paste tab: when user clicks Create, only validate as JSON. If valid, POST to /api/plans directly.
2. Remove "invalid JSON → treat as AI prompt" fallback from Paste tab. Invalid JSON shows validation error only.
3. Paste tab flow: paste/upload JSON → validate → Create plan → success (same as current for valid JSON).
4. Keep file upload, paste, clear buttons in Paste tab.
5. Ensure Describe and Paste tabs are independent: switching tabs does not mix state (each tab has its own input).

**Done:** Paste tab is JSON-only; no LLM fallback; valid JSON → POST → success.

---

### Task 7: Update E2E Tests (Plan 03)

**Files:** `e2e/create-plan.spec.ts`

**Action:**

1. **Paste tab tests:** TabPanel unmounts inactive content — Paste tab content is not in DOM when Describe is selected. E2E must click "Paste / Raw" tab first (`page.getByTestId('create-plan-tab-paste')` or `getByRole('tab', { name: /paste/i })`) before accessing create-plan-json-textarea. Update goToPlansAndCreatePlanSection to switch to Paste tab after navigation. Ensure paste, upload, type JSON tests pass.
2. **Describe tab test:** Update "paste free-form text, convert via AI, create plan" to use Describe tab. Fill create-plan-describe-textarea; click create-plan-create-draft-button; mock transcribe-from-text; wait for create-plan-preview; click create-plan-confirm-button; fill confirm-plan-name/description if needed; click confirm-plan-submit; verify success. Note: Describe flow no longer shows raw JSON in textarea — Preview appears instead.
3. Add data-testids where missing for new elements.
4. Ensure all four existing tests pass; add or adjust for Describe → Preview → Confirm flow.

**Done:** All E2E tests pass; Describe flow covered; Paste tab tests switch tabs before interacting.

---

## Success Criteria

1. **Tabs** — ✓ Describe and Paste / Raw tabs; switch between input modes
2. **Describe flow** — ✓ Create draft → Preview (no raw JSON) → Refine → Confirm
3. **Button states** — ✓ Empty → disabled; has text → Create draft; after plan → Refine + Confirm
4. **Preview** — ✓ DayListSection readonly; all days visible
5. **Refine** — ✓ Repeatable; empty placeholder; clears after each success
6. **Confirm modal** — ✓ Prefilled name/description; hint; Proceed with defaults vs Save
7. **Paste tab** — ✓ JSON only; no LLM fallback
8. **E2E** — ✓ All tests pass; Describe flow covered

---

## How to Test

1. **Unit tests:** `npm run test:run` — existing tests pass
2. **Build:** `npm run build` — succeeds
3. **E2E:** `npm run test:e2e` — create-plan, plan-change, reset-progress pass
4. **Manual Describe flow:** Plans → Describe tab → type "3 days, 2 min holds, 2 min recovery" → Create draft → Preview appears → Refine with "make it 2:30" → Confirm → edit name → Save → plan appears
5. **Manual Paste flow:** Plans → Paste tab → paste JSON → Create plan → success

---

## Verification

- [ ] Tabs visible; Describe and Paste / Raw
- [ ] Describe: empty → disabled; has text → Create draft
- [ ] After Create draft: Preview (DayListSection) visible; no raw JSON
- [ ] Refine flow: placeholder; repeatable; clears after success
- [ ] Confirm modal: name/description editable; Proceed with defaults vs Save
- [ ] Paste tab: JSON only; invalid JSON shows error
- [ ] E2E: create-plan.spec.ts all pass
