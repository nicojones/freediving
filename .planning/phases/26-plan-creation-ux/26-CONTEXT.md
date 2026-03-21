# Phase 26: Plan Creation UX — Context

**Created:** 2025-03-20  
**Purpose:** Implementation decisions for plan creation UX: tab input modes, Preview, refine flow, confirm modal.
**Phase:** 26. Plan Creation UX

---

## Decisions (from user)

### 1. Tab Input Modes

- **Two tabs:** Switch between natural-language input and JSON (hardcode) input.
- **Labels:** "Describe" / "Paste" or "Raw" — both acceptable; could combine as "Paste / Raw" to convey both paste and raw-edit.

### 2. Natural-Language Path — No Raw JSON Display

- **After LLM returns valid plan:** Do NOT display raw JSON.
- **Instead:** Show a "Preview" using **existing components** (DayListSection, SessionBreakdown, SessionPreviewStats, etc.) to show what the plan will look like.
- **Background:** JSON is still stored; user can refine.

### 3. Button States and Flow

| State | Textbox                    | Primary action                                                                                      | Other actions                               |
| ----- | -------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **a** | Empty                      | "Describe your plan first" (disabled/hint)                                                          | —                                           |
| **b** | Has text                   | "Create draft" (or "Generate draft" — make clear it's not saving yet)                               | —                                           |
| **c** | Server returned valid plan | Textbox clears; "Preview" button appears; primary becomes "Refine"; "Confirm" / "Save plan" appears | Refine can be repeated; Confirm opens modal |

### 4. Refine Flow

- User can send new natural-language text to LLM to refine the generated plan.
- Can be repeated multiple times.
- After each valid response: textbox clears; Preview + Refine + Confirm remain available.

### 5. Confirm Modal

- **Trigger:** User clicks "Confirm" or "Save plan".
- **Content:** Prefilled name and description from plan; user can optionally edit.
- **Hint:** "You can edit the plan name and description below."
- **Action:** Dynamic button label — "Proceed with defaults" when name/description unchanged; "Save" when user edited.

### 6. Scope Guardrail

- **Phase 26:** Structural UX (tab, preview, refine, confirm). Implementation of these flows.
- **Phase 27:** General UI polish (visual improvements, interaction refinements) — deferred.

---

## Gray Areas — Resolved

### A. Tab Labels

- **Natural-language tab:** "Describe"
- **JSON tab:** "Paste" or "Raw" — both acceptable. Could combine as "Paste / Raw" to convey both paste and raw-edit.

---

### B. Generate Button Label (state b)

- **Decision:** "Create draft" / "Generate draft" — user prefers "Create draft". Alternative: "Generate draft" if you want a slightly different tone.

---

### C. Preview Behavior

- **Decision:** All days, expandable, reuse DayListSection — but **readonly** (no onSelectDay navigation; cards are display-only, no click-to-select-day).
- **Implementation note:** Pass `onSelectDay` as no-op or use a read-only variant of DayListSection/TrainingDayCard that disables clicks.

---

### D. Refine Flow — Textbox Content

- **Decision:** Stay empty.
- **Placeholder:** "Can you change ... ... ?" — conversational, invites refinement (e.g. "Can you change 2 min holds to 2:30?").

---

### E. Confirm Modal

- **Hint:** "You can edit the plan name and description below."
- **Button label:** "Proceed with defaults" when name/description unchanged; "Save" when user edited. Track dirty state.
- **Implementation:** Use Phase 25 Dialog primitive (Radix/Headless UI).

---

## Code Context

- **CreatePlanSection** (`src/components/settings/CreatePlanSection.tsx`): Single textarea; JSON or text; Create button; calls transcribe-from-text or POST /api/plans. No tabs, no preview, no refine flow.
- **DayListSection** (`src/components/day/DayListSection.tsx`): Takes `plan`, `completions`, `currentDayIndex`, `onSelectDay`, `planName`, `planDescription`. Renders plan name + description + list of TrainingDayCard.
- **SessionPreviewSection** / **SessionBreakdown** / **SessionPreviewStats**: Show single-day session structure (phases, hold/breathe intervals).
- **PlanWithMeta**: `{ id?, name, description?, days: PlanDay[] }`. Name/description used in confirm modal.
- **Phase 25 Component Library:** Provides Dialog and Tabs primitives; Phase 26 will use them for confirm-plan modal and input-mode tabs.

---

## Out of Scope for Phase 26

- General UI polish (Phase 27)
- Dedicated plan creation screen (deferred)
- Editing plan JSON in-place after generation (JSON tab is for paste/upload only in this phase)

---

## Traceability

| Decision        | Outcome                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| Tab labels      | Describe / Paste or Raw (or "Paste / Raw")                                              |
| Generate button | Create draft                                                                            |
| Preview         | All days, expandable, reuse DayListSection, readonly                                    |
| Refine textbox  | Stay empty; placeholder "Can you change ... ... ?"                                      |
| Confirm modal   | Hint: "You can edit..."; button: "Proceed with defaults" vs "Save"; use Phase 25 Dialog |

---

_Context captured from /gsd-discuss-phase 25 (now Phase 26)_
