---
status: awaiting_human_verify
trigger: 'plan_id and day_index required error when completing session'
created: 2025-03-19
updated: 2025-03-19
---

## Current Focus

hypothesis: CONFIRMED — Request body can omit day_id when undefined (JSON.stringify drops it); server needs day_id OR day_index. Adding day_index as fallback makes requests robust.
test: Implemented day_index in recordCompletion, queueCompletion, flushQueue; fixed TrainingContext else-branch bug.
expecting: User confirms session completion records progress and shows "Saved".
next_action: Await human verification.

## Symptoms

expected: Completing a training session should record progress via POST /api/progress and show "Saved".
actual: Error "plan_id required" or "day_id or day_index required" (server returns these).
errors: Server validation in server/routes/progress.js returns 400.
reproduction: Complete a training session (or come back online after completing offline).
started: Unknown.

## Eliminated

(none)

## Evidence

- Server requires plan_id; requires day_id OR day_index (number). Server loads plan and resolves day from plan[day_index].id when day_id missing.
- progressService.recordCompletion sent only { plan_id, day_id }; no day_index. If day_id undefined, JSON.stringify omits it.
- offlineQueue sent { plan_id, day_id }; PendingCompletion had no day_index. Old queue items or edge cases could have day_id undefined.
- TrainingContext had bug: else branch setProgressError(result.error) when !dayId — result undefined. Fixed to setProgressError('Day not found in plan — cannot record progress').
- default-plan.json: all days have id. Root cause: missing day_index fallback; server already supports it.

## Resolution

root_cause: Client sent only day_id; when day_id was undefined (edge case, old queue data, or JSON.stringify omission), server received neither day_id nor day_index and returned 400. TrainingContext had logic bug when dayId was null.
fix: Added day_index as optional parameter to recordCompletion and queueCompletion; send day_index in POST body when available. Server already resolves day from plan[day_index].id. Fixed TrainingContext else branch to use explicit error message when dayId is null.
verification: Build passes. Awaiting user confirmation.
files_changed: [src/services/progressService.ts, src/services/offlineQueue.ts, src/contexts/TrainingContext.tsx]
