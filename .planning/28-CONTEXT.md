# Phase 28: Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback — Context

**Created:** 2025-03-20  
**Purpose:** Implementation decisions for moving CreatePlanSection to its own tab, enabling voice+text mix for create/refine, and improving Preview feedback.  
**Phase:** 28. Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback

---

## Decisions (from user)

### 1. Create Plan as Cornerstone — Own Bottom Tab (+)

- **Rationale:** CreatePlanSection is a cornerstone of the application; it deserves prominence.
- **Change:** Move CreatePlanSection from Plans tab to its own bottom tab.
- **UI:** Add a fourth bottom nav item — "+" or similar — for plan creation.
- **Result:** Bottom nav: Training | Plans | **+** (Create Plan) | Settings (or similar order).

### 2. Multi-Modal Create and Refine (Voice + Text)

- **Keep:** Current "Refine" setting/flow.
- **Extend:** Allow both **create** and **refine** via voice **and/or** text.
- **Mix and match:** User can create by voice → preview → refine with text → refine with voice → save.
- **Examples:**
  - Create by voice, refine with text
  - Create by text, refine with voice
  - Create by voice, refine with voice
  - Create by text, refine with text (current behavior)

### 3. Preview Button Visibility

- **Trigger:** When user types and submits, or when audio is sent or re-sent, a "Preview" button appears.
- **Current behavior:** Preview button exists in CreatePlanDraftPreview; appears when `draftPlan` is set.
- **Clarification:** Ensure Preview is visible/available after any create or refine action (text or voice).

### 4. Preview Feedback — "Updated" Cue (Critical)

- **Problem:** After a refinement, it is **unclear** that the preview was updated. The button stays the same; the only visual cue is that the button stopped loading.
- **Requirement:** Find a way to **bring attention back to the Preview** after refinement.
- **Options to consider (implementation):**
  - Brief highlight/pulse on Preview button when draft updates
  - "Preview updated" toast or inline message
  - Button label change (e.g. "Preview updated" for a few seconds)
  - Auto-open Preview modal after refinement
  - Subtle animation or badge on Preview button
  - Scroll/focus to Preview button
- **User intent:** User must clearly understand that the plan changed and they should look at the preview again.

---

## Gray Areas — Resolved

### A. Bottom Tab Order and Icon

- **Decision:** Fourth tab for Create Plan; icon "+" or "add" (TBD in implementation).
- **Placement:** Between Plans and Settings, or at a prominent position (e.g. center as primary action).

### B. Refine Flow — Voice Input

- **Decision:** Refine textarea/input can be supplemented or replaced by voice. Same LLM flow; input source (text vs voice) is interchangeable.
- **Implementation:** Add voice input to CreatePlanDraftPreview (refine step), reusing AIVoicePlanInput or similar.

### C. Preview Feedback Mechanism

- **Decision:** Must bring attention to Preview after refinement. Specific mechanism TBD in research/plan (e.g. pulse, toast, auto-open, label change).

---

## Code Context

- **CreatePlanSection** (`src/components/settings/CreatePlanSection.tsx`): Used in PlansView; has Describe + Paste tabs; CreatePlanDescribeTab shows CreatePlanDescribeInput (create) or CreatePlanDraftPreview (refine).
- **CreatePlanDescribeInput:** Text textarea + AIVoicePlanInput for create. No voice in refine.
- **CreatePlanDraftPreview:** Refine textarea + Refine button + Preview button + Confirm button. No voice input.
- **useCreatePlanHandlers:** handleCreateDraft (text), handleRefine (text), handleVoiceResult (voice → draftPlan). No voice-for-refine.
- **BottomNavBar:** Three tabs — Training, Plans, Settings. Needs fourth for Create Plan.
- **PlansView:** Contains PlanSelectorSection, CreatePlanSection, PlanDeleteSection. CreatePlanSection will move out.
- **Routing:** `/` (Dashboard), `/plans`, `/settings`. New route for create plan (e.g. `/create` or `/plans/create`).

---

## Out of Scope for Phase 28

- Changing the LLM/API behavior (same endpoints)
- Editing plan JSON in-place
- General UI polish beyond Preview feedback

---

## Traceability

| Decision           | Outcome                                                              |
| ------------------ | -------------------------------------------------------------------- |
| Create Plan tab    | Own bottom tab (+); move out of Plans                                |
| Create/Refine mode | Both voice and text for create and refine; mix and match             |
| Preview visibility | Preview button appears when create/refine (text or voice) completes  |
| Preview feedback   | After refinement, bring attention to Preview (mechanism TBD in plan) |

---

_Context captured from /gsd-add-phase 28 + /gsd-discuss-phase_
