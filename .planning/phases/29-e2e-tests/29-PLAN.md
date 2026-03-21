# Phase 29: E2E Tests — Executable Plan

---

phase: 29-e2e-tests
plans:

- id: "01"
  tasks: 4
  depends_on: [28-create-plan-tab-multimodal]
  type: execute
  wave: 1
  autonomous: false
  requirements: [E2E-01, E2E-02, E2E-03, UNIT-01]
  must_haves:
  truths:
  - "Flaky Describe tab E2E test fixed (create-plan.spec.ts)"
  - "E2E test for voice create-plan using fixture (mock transcribe API)"
  - "14-day plan fixture JSON created from audio description"
  - "Unit tests for ConfirmPlanModal, PlanPreviewModal, CreatePlanStatusBanner"

---

## Objective

Add comprehensive E2E tests; fix the flaky create-plan Describe test; add voice/audio create-plan E2E using the `1:30 to 2:00 14-day plan.m4a` fixture; add missing unit tests for coverage.

**Principles:**

- Fix flakiness with route timing and response-wait patterns
- Use audio fixture to derive expected plan structure (14 days, 1:30→2:00 holds)
- Stub MediaRecorder/getUserMedia for voice E2E in CI
- Add unit tests for create-plan components without coverage

---

## Context

- **Flaky test:** `e2e/create-plan.spec.ts` Describe tab test — race between API response and UI assertion
- **Audio fixture:** `e2e/fixtures/1:30 to 2:00 14-day plan.m4a` — describes 14-day plan with holds progressing 1:30 to 2:00
- **Fixture JSON:** `e2e/fixtures/1-30-to-2-00-14-day-plan.json` — derived from audio description
- **Voice E2E:** Requires stubbing `navigator.mediaDevices.getUserMedia` and `MediaRecorder` for CI (no real mic)

---

## Plan 01: Fix Flaky Test + Voice E2E + Unit Tests

### Task 1: Fix Flaky Describe Tab E2E Test

**File:** `e2e/create-plan.spec.ts`

**Action:**

1. Set route before any navigation (already done)
2. Add `waitForResponse` for transcribe-from-text before asserting create-plan-preview visible
3. Add explicit waits for textarea visible and create-draft-button enabled before fill/click
4. Increase confirm-plan-name timeout to 5000

**Done:** Describe tab test passes consistently.

---

### Task 2: Add Voice Create-Plan E2E Test

**Files:** `e2e/create-plan.spec.ts`, `e2e/fixtures/1-30-to-2-00-14-day-plan.json`

**Action:**

1. Create fixture JSON `1-30-to-2-00-14-day-plan.json` — 14 days, holds 90s→120s
2. Add `page.addInitScript` to stub `getUserMedia` (return fake AudioContext stream) and `MediaRecorder` (fake that produces blob on stop)
3. Mock `**/api/plans/transcribe` to return fixture plan
4. Test flow: login → Create tab → click Explain → click Stop → wait for transcribe response → preview → confirm → verify plan creation

**Done:** Voice create-plan E2E passes; uses fixture derived from audio.

---

### Task 3: Add Unit Tests for Create-Plan Components

**Files:** `src/components/settings/ConfirmPlanModal.test.tsx`, `PlanPreviewModal.test.tsx`, `create-plan/CreatePlanStatusBanner.test.tsx`

**Action:**

1. **ConfirmPlanModal:** Renders when open; name/description prefilled; onConfirm called with edited values; onClose called on submit
2. **PlanPreviewModal:** Renders when closed (nothing); when open shows plan name, description, days; rest day (rest: true) shows "Rest day"
3. **CreatePlanStatusBanner:** null when no error/success; error message when error; success message when success; error preferred over success

**Done:** Unit tests pass; coverage improved for create-plan flow.

---

### Task 4: Document Phase 29 in Roadmap

**Files:** `.planning/ROADMAP.md`, `.planning/STATE.md`, `29-PLAN.md`

**Action:**

1. Add Phase 29 entry to ROADMAP.md
2. Add Phase 29 details section
3. Update Progress table
4. Update STATE.md phases total

**Done:** Phase 29 tracked in roadmap.

---

## Success Criteria

1. **Flaky test** — ✓ Describe tab E2E passes consistently (waitForResponse + explicit waits)
2. **Voice E2E** — ✓ Voice create-plan test passes; uses 14-day fixture; mocks transcribe
3. **Unit tests** — ✓ ConfirmPlanModal, PlanPreviewModal, CreatePlanStatusBanner have tests
4. **Roadmap** — ✓ Phase 29 added and documented

---

## How to Test

1. **Unit:** `npm run test:run` — all pass (139+ tests)
2. **E2E:** `npm run test:e2e -- create-plan` — paste, upload, type, describe, voice all pass
3. **Flakiness:** Run create-plan E2E 5× — no failures

---

## Verification

- [x] Describe tab E2E: run 5×, no flakiness
- [x] Voice E2E: passes with mocked transcribe
- [x] ConfirmPlanModal.test.tsx: 4 tests pass
- [x] PlanPreviewModal.test.tsx: 3 tests pass
- [x] CreatePlanStatusBanner.test.tsx: 4 tests pass
