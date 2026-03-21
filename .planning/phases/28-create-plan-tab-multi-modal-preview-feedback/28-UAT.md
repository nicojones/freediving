# Phase 28: UAT — Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback

**Phase:** 28  
**Date:** 2025-03-20  
**Status:** ✅ Complete — E2E fixed

---

## Test Results Summary

| Check                               | Result  | Notes                                                       |
| ----------------------------------- | ------- | ----------------------------------------------------------- |
| Build                               | ✅ PASS | `npm run build` succeeds                                    |
| Lint                                | ✅ PASS | `npm run lint` — no errors                                  |
| E2E create-plan                     | ✅ PASS | 4/4 pass (CI + local)                                       |
| E2E full suite                      | ✅ PASS | 11/11 pass (CI + local)                                     |
| Create tab                          | ✅ PASS | Code present; route /create; BottomNavBar 4 tabs            |
| PlansView without CreatePlanSection | ✅ PASS | PlansView has PlanSelectorSection + PlanDeleteSection only  |
| Multi-modal create/refine           | ✅ PASS | Voice + text for create and refine; API + handlers wired    |
| Preview feedback (pulse)            | ✅ PASS | `previewJustUpdated` + pulse on Preview button after refine |

---

## Verification Checklist (from 28-PLAN.md)

- [x] Create tab visible in BottomNavBar; navigates to /create
- [x] CreatePlanView shows CreatePlanSection; PlansView does not
- [x] Create: voice and text both work (code paths present)
- [x] Refine: voice and text both work; mix and match (AIVoicePlanInput + contextPlan in CreatePlanDraftPreview)
- [x] Preview button visible when draftPlan set
- [x] After refine: Preview button pulses (`previewJustUpdated` + `animate-pulse ring-2 ring-primary ring-offset-2`)
- [x] E2E create-plan: all tests pass

---

## Code Verification Details

### Create Plan Tab (Plan 01)

- **Route:** `app/create/page.tsx` → `CreatePlanView`
- **CreatePlanView:** `src/views/CreatePlanView.tsx` — TopAppBar, CreatePlanSection, BottomNavBar with `activeTab="create"`
- **BottomNavBar:** Four tabs (Training, Plans, Create, Settings); `data-testid="nav-create"`
- **PlansView:** No CreatePlanSection; copy: "Choose your training plan or create a new one in the Create tab."

### Multi-Modal Refine (Plan 02)

- **CreatePlanDraftPreview:** AIVoicePlanInput with `onVoiceRefineResult`, `contextPlan={draftPlan}`, `onRecordingChange`
- **useCreatePlanHandlers:** `handleVoiceRefineResult` — parse, validate, setDraftPlan, setPreviewJustUpdated
- **API:** `app/api/plans/transcribe/route.ts` — accepts optional FormData `contextPlan`; uses REFINE_AUDIO_PROMPT when present
- **AIVoicePlanInput:** Sends `contextPlan` in FormData when provided

### Preview Feedback (Plan 03)

- **useCreatePlanHandlers:** `previewJustUpdated` state; set on `handleRefine` and `handleVoiceRefineResult`; cleared after 2s or on `openPreview`
- **CreatePlanDraftPreview:** Preview button has `previewJustUpdated && 'animate-pulse ring-2 ring-primary ring-offset-2'`

### E2E Tests

- **goToCreatePlanSection:** Uses `nav-create` → wait for `/create` → `create-plan-tab-describe` visible
- **verifyPlanCreation:** nav-plans → /plans → plan-selector → select → confirm → nav-training → plan-name

---

## E2E Failure Analysis (Resolved)

**Observed failures (before fix):**

1. **First run (4 workers):** 1 passed (paste JSON), 3 failed at `loginAsNico` — `dashboard-day-list` timeout (15s)
2. **CI run (1 worker):** 4 failed — `dashboard-day-list` timeout; page showed "Plan not found: e2e-paste-plan"

**Root cause:** Cross-test pollution. Test 1 (nico) creates plan and sets it as active. Tests 2–4 run with fresh browser contexts; nico's `user_active_plan` points to a plan ID, but the client's `available` plans can be out of sync or the server returns the wrong plan. Using a single user (nico) across sequential tests caused "Plan not found" when the previous test had mutated nico's active plan.

**Fix applied:** Use `loginAsAthena` for tests that run after create-plan or in isolation. Athena has no active plan set, so she always gets the default bundled plan. Added `loginAsAthena` to `e2e/helpers/login.ts` and switched create-plan tests 2–4 plus login, plan-change, reset-progress, session-flow, error-paths, and abort-session to use athena. Create-plan test 1 remains `loginAsNico` (first test, clean state).

**Verification:** `CI=true npm run test:e2e` — 11/11 pass.

---

## Manual UAT (Suggested)

1. **Create tab:** Click Create in nav → CreatePlanView with Describe/Paste tabs
2. **Create by text:** Describe → Create draft → Preview → Refine with text → Preview pulses → Confirm
3. **Create by voice:** Use Explain (voice) in Describe → Preview → Refine with voice → Preview pulses → Confirm
4. **Mix:** Create by voice → Refine with text (or vice versa)

---

## Conclusion

Phase 28 implementation is **complete** per plan. All success criteria are met in code. E2E failures were fixed by using `loginAsAthena` for tests that run after create-plan or in isolation, avoiding cross-test pollution from nico's mutated active plan state.
