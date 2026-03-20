# Phase 20: Preview Future Days — Executable Plan

---
phase: 20-preview-future-days
plans:
  - id: "01"
    tasks: 0
    depends_on: [19-create-plan-settings]
type: execute
wave: 1
autonomous: false
requirements: []
must_haves:
  truths:
    - "User can view session structure (hold/breathe intervals) for future days in the plan"
    - "User cannot start or execute a session for a future day"
    - "Future days are clearly differentiated from current/available days (read-only preview, no start button)"
---

## Objective

Add the ability to preview future days in a training plan — view their structure (hold/breathe intervals) — while ensuring there is **no way** to execute them. Future days are read-only; only the current/available day can be started.

**Principles:**
- Preview = view session structure only (no execution)
- Future days: no start button, no session runner access
- Clear visual distinction between current vs future days

---

## Context

- Phase 5: Session Runner + Plan/Day Selector — day selection, session preview, current-day logic
- Phase 7: Day IDs + Routing — `/day/:dayId`, completions by day_id
- Phase 8: One session per day, completion flow

**Existing:** User selects day; session preview shows structure; only "current" day (first non-completed) is typically actionable. Need to allow viewing future days while blocking execution.

---

## Plan 01: Preview Future Days (TBD)

*Tasks to be defined after research.*

---

## Verification

- [ ] User can open/preview any future day and see its session structure
- [ ] User cannot start a session for a future day
- [ ] Future days are visually distinct (e.g. locked, preview-only)
- [ ] `npm run build` and `npm run test:run` pass
