# Phase 32: Multi-Program Switching — Plan

**Status:** Pending  
**Depends on:** Phase 31 (UI Polish)

---

## Goal

Users can switch between training programs; progress is preserved per plan (not reset). Plans tab shows progress (e.g. 3/17 days). Switching asks for confirmation but does not open the Reset prompt. Supports users training different skills at once.

---

## Success Criteria

1. User can switch between training programs; status is preserved per plan (NOT reset)
2. Plans tab shows progress per plan (e.g. "3/17 days" or similar)
3. Switching plan asks for confirmation; does NOT open the Reset prompt
4. Users may train different skills at once by switching between plans

---

## Tasks (TBD — task breakdown)

- [ ] Task breakdown after research

---

## Context

- **Current behavior:** Changing plan triggers warning that progress will be reset (Phase 10)
- **New behavior:** Switching is a separate flow; progress stored per plan_id; no reset on switch
- **Plans tab:** Display progress indicator (e.g. 3/17 days) for each plan
- **Confirmation:** Simple "Switch to X?" dialog — not the Reset prompt
- **Use case:** User trains CO2 tolerance plan 3 days, then switches to O2 table plan for 2 days; both progress states preserved
