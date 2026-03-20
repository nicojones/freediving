# Phase 5: Session Runner + Plan/Day Selector — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 5. Session Runner + Plan/Day Selector

---

## Decisions

### Session Structure Preview (PLAN-02)

- **Format:** Summary + detail — e.g. "3 cycles · ~12 min total" with expandable per-cycle details. Fallback to numbered list if needed.
- **Rest days:** Show "Rest day" + note: "No intervals today."
- **Placement:** Dedicated session preview section that updates when day changes. Start button lives on its own page or takes most of the space.
- **Density:** All: hold/recovery per cycle, total duration (~X min), and type (dry/wet) if present in plan.

### Day Selection UI (PLAN-03)

- **Format:** Scrollable list with day number + short summary (e.g. "Day 3 — Rest", "Day 4 — 2 cycles").
- **Current-day highlighting:** Pre-selected + badge ("Current" or "Next").
- **Rest days:** Selectable. Selecting shows "Rest day — no session" and disables Start.
- **Completed days:** Checkmark + dimmed.

### Current Day Logic (PLAN-04)

- **On track** (trained yesterday or today): Current = next day in sequence, including rest days. If next is rest, rest is preselected.
- **Behind** (last completion 2+ days ago): Skip rest days; current = first non-completed training day (day after the rest day).
- **Source of truth:** Completions with `completed_at` timestamp. "On track" = last completion was today or yesterday (calendar).
- **Skipped days:** Treat as complete (mark complete); current = first non-completed. Per 2-CONTEXT.
- **All days complete:** Show "All done" / "Plan complete"; no day selected; Start disabled.

### Session Flow & Completion

- **Record completion:** Auto-record on `session_complete`; show brief "Saved" confirmation.
- **Before starting:** "Ready to start?" confirmation or short checklist (e.g. "Eyes closed? Ready?"). Either acceptable.
- **Plan selection:** Single plan for Phase 5. Pass `plan_id` through (e.g. `"default"`) so plan selector can be added later.
- **Layout:** One screen (day list top/side, preview + Start below, session takes over when running) OR three screens (Day selector → Preview/confirm → Session full-screen). Either acceptable.

---

## Out of Scope for Phase 5

- Plan selector / multi-plan UX — single plan only
- Calendar-based scheduling (plan start date) — completions + recency determine current
- "Skip" as distinct from "complete" — skip = mark complete for now
- Session-complete audio cue — v2 (SESS-09)

---

## Traceability

| Requirement | Decision                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| PLAN-02     | Summary + detail preview; rest day note; dedicated section; hold/recovery, duration, type                                    |
| PLAN-03     | Scrollable list with summary; current pre-selected + badge; rest selectable (Start disabled); completed = checkmark + dimmed |
| PLAN-04     | On track: next day (incl. rest). Behind: skip rest, first training day. All done: "Plan complete"                            |
| SESS-07     | Auto-record on session_complete; brief "Saved" confirmation                                                                  |

---

## Code Context

- **Plan Service:** `src/services/planService.ts` — `loadPlan()`, `getPhasesForDay(plan, dayIndex)`
- **Progress Service:** `src/services/progressService.ts` — `fetchCompletions(planId)`, `recordCompletion(planId, dayIndex)`. `Completion` has `completed_at`.
- **Plan types:** `src/types/plan.ts` — `Plan`, `PlanDay`, `Phase`, `TrainingDay` (has optional `type: 'dry' | 'wet'`)
- **App:** `src/App.tsx` — currently hardcodes day 0; session_complete not wired to recordCompletion. Manual "Mark day 0 complete" button exists.
- **Current day helper:** Needs `getCurrentDay(plan, completions)` — uses `completed_at` to determine on-track vs behind; skips rest when behind.
- **Plan ID:** Use `"default"`; pass through so multi-plan is easy later.

---

_Context captured from /gsd-discuss-phase 5_
