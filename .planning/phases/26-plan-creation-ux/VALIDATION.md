# Phase 26: Plan Creation UX — Validation

**Phase:** 26. Plan Creation UX  
**Plan:** 26-PLAN.md  
**Purpose:** Automated and manual verification of Phase 26 success criteria.

---

## Success Criteria

1. CreatePlanSection has two tabs: Describe and Paste / Raw
2. Describe tab state machine: empty → disabled; has text → Create draft → transcribe-from-text
3. Preview section reuses DayListSection readonly; all days visible
4. Refine flow: empty textbox, placeholder; user can repeat until satisfied; API accepts optional contextPlan
5. Confirm modal: prefilled name/description; hint; Proceed with defaults vs Save based on dirty state
6. Paste tab: JSON only; no LLM fallback; E2E tests pass

---

## Verification Commands

### Automated

```bash
# Unit tests
npm run test:run
# Expect: All unit tests pass

# Build
npm run build
# Expect: Build succeeds

# E2E — Create plan flows
npm run test:e2e -- create-plan
# Expect: All 4 create-plan tests pass (paste, upload, type, describe→AI→confirm)

# Full suite
npm run test:run && npm run test:e2e
# Expect: All tests pass
```

### Phase Requirements → Test Map

| Req ID  | Behavior                                            | Test Type    | Command                           |
| ------- | --------------------------------------------------- | ------------ | --------------------------------- |
| PCUX-01 | Two tabs visible; switch between Describe and Paste | E2E          | `npm run test:e2e -- create-plan` |
| PCUX-02 | Describe: empty → disabled; has text → Create draft | E2E          | same                              |
| PCUX-03 | Preview (DayListSection) after Create draft         | E2E          | same                              |
| PCUX-04 | Refine flow repeatable; clears after success        | E2E / manual | optional for MVP                  |
| PCUX-05 | Confirm modal: name/description; Proceed vs Save    | E2E          | same                              |
| PCUX-06 | Paste tab JSON-only; E2E pass                       | E2E          | same                              |

---

## Manual Verification

### PCUX-01: Two Tabs

1. Plans tab → Create plan section.
2. Two tabs visible: "Describe" and "Paste / Raw".
3. Click Describe → textarea for natural language.
4. Click Paste / Raw → JSON textarea + upload/paste/clear.
5. Switch tabs → state preserved (Describe text and Paste JSON do not mix).

### PCUX-02: Describe State Machine

1. Describe tab, empty textarea → button disabled or shows "Describe your plan first".
2. Type "3 days, 2 min holds" → button enabled, label "Create draft".
3. Click Create draft → loading → Preview appears; textarea clears.

### PCUX-03: Preview

1. After Create draft success → Preview section visible.
2. Uses DayListSection (plan structure, days, phases).
3. No raw JSON displayed.
4. Cards are readonly (no navigation on click).

### PCUX-04: Refine Flow

1. With draftPlan set → Refine textarea visible; placeholder "Can you change ... ... ?".
2. Type "make it 2:30" → click Refine → loading → draftPlan updates; Refine textbox clears.
3. Repeat Refine multiple times → each success clears textbox.

### PCUX-05: Confirm Modal

1. Click Confirm → modal opens with prefilled name and description.
2. Hint: "You can edit the plan name and description below."
3. Unchanged → button "Proceed with defaults".
4. Edit name → button "Save".
5. Click submit → plan saved; modal closes; plan appears in selector.

### PCUX-06: Paste Tab

1. Paste tab → paste invalid text (not JSON) → Create plan → validation error only; no AI fallback.
2. Paste valid JSON → Create plan → success.
3. E2E paste, upload, type tests pass.

---

## Traceability

| Requirement | Verification                                                                               |
| ----------- | ------------------------------------------------------------------------------------------ |
| PCUX-01     | E2E create-plan; tabs visible; data-testid create-plan-tab-describe, create-plan-tab-paste |
| PCUX-02     | E2E Describe flow; create-plan-describe-textarea, create-plan-create-draft-button          |
| PCUX-03     | E2E wait for create-plan-preview; DayListSection with readonly props                       |
| PCUX-04     | Refine sends contextPlan; API route handles optional contextPlan; manual repeat test       |
| PCUX-05     | ConfirmPlanModal with dirty tracking; onClose before onConfirm; confirm-plan-submit        |
| PCUX-06     | Paste tab JSON-only; E2E switch to Paste tab before create-plan-json-textarea              |

---

## Sampling Rate

- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`
