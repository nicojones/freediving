# Phase 32: UAT — Multi-Program Switching

**Phase:** 32  
**Date:** 2025-03-21  
**Status:** In progress

---

## E2E Test Results (from CI/terminal)

| Test                                      | Result | Error                                                                    |
| ----------------------------------------- | ------ | ------------------------------------------------------------------------ |
| create-plan › Describe tab (free-form AI) | ✘      | `page.waitForResponse`: Timeout 10000ms waiting for transcribe-from-text |
| 12 others                                 | ✓      | Passed                                                                   |

**Note:** Tests pass locally; failure observed in CI (GitHub Actions).

---

## Diagnosis

### Flaky: Describe tab — waitForResponse race

**Symptom:** `page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"` — waiting for `transcribe-from-text` API response with status 200.

**Root cause:** `waitForResponse` was called _after_ the button click. The mocked route fulfills synchronously, so the response can arrive in the same tick. By the time `waitForResponse` starts listening, the response has already been received. The test then waits for a second response that never comes.

**Fix applied:** Start `waitForResponse` _before_ the click, then await it after. Same pattern as the voice test (which already does this correctly). Also increased timeout from 10s to 15s for CI environments.

---

## Fix Plan (executed)

| #   | Action                                                                 | File(s)                   |
| --- | ---------------------------------------------------------------------- | ------------------------- |
| 1   | Start `waitForResponse` before `create-plan-create-draft-button` click | `e2e/create-plan.spec.ts` |
| 2   | Increase timeout from 10000 to 15000                                   | `e2e/create-plan.spec.ts` |

---

## UAT Tests (conversational)

### Test 1: Switch plan — confirmation, no reset

| Step | Action                    | Expected                                                     |
| ---- | ------------------------- | ------------------------------------------------------------ |
| 1.1  | Complete a day in plan A  | Progress recorded                                            |
| 1.2  | Go to Plans, click plan B | ConfirmSwitchPlanModal: "Switch to X? Progress preserved."   |
| 1.3  | Click Confirm             | Plan B active; plan A progress unchanged when switching back |

**Result:** _Pending_

### Test 2: Plans tab — progress display

| Step | Action                          | Expected                               |
| ---- | ------------------------------- | -------------------------------------- |
| 2.1  | Open Plans tab                  | Each plan shows "X/Y days" (e.g. 3/17) |
| 2.2  | Complete a day, return to Plans | Count updated for active plan          |

**Result:** _Pending_

### Test 3: E2E suite

| Step | Action             | Expected          |
| ---- | ------------------ | ----------------- |
| 3.1  | `npm run test:e2e` | All 13 tests pass |

**Result:** ✓ Pass (13 passed, 51s) — 2025-03-21

---

## Summary

| Item          | Status      |
| ------------- | ----------- |
| E2E diagnosis | Complete    |
| Fix plan      | Executed    |
| E2E suite     | ✓ 13 passed |
| Manual UAT    | Pending     |

---

## Fixes Applied (2025-03-21)

1. **e2e/create-plan.spec.ts** — Describe tab: start `waitForResponse` before clicking "Create draft" to avoid race with mock response; increase timeout to 15s.
