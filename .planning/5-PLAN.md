# Phase 5: Session Runner + Plan/Day Selector — Executable Plan

---
phase: 05-session-runner
plans:
  - id: "01"
    tasks: 4
    files: 4
    depends_on: [01-plan-service, 02-progress-profile, 03-timer-engine, 04-audio]
type: execute
wave: 1
files_modified:
  - src/services/planService.ts
  - src/App.tsx
autonomous: true
requirements: [PLAN-02, PLAN-03, PLAN-04, SESS-07]
user_setup: []
must_haves:
  truths:
    - "User can view session structure (hold/breathe intervals) before starting"
    - "User can select any day in the current plan"
    - "App defaults to current day (on-track: next day incl. rest; behind: skip rest)"
    - "User can start a session and complete it with all audio cues"
    - "Session completion is recorded for the selected profile and day"
  artifacts:
    - path: src/services/planService.ts
      provides: "getCurrentDay, computeSessionDurationSeconds, getDaySummary"
      contains: "getCurrentDay|computeSessionDurationSeconds|getDaySummary"
    - path: src/App.tsx
      provides: "Day selector, session preview, session flow with completion recording"
      contains: "selectedDayIndex|getCurrentDay|recordCompletion|session_complete"
  key_links:
    - from: src/App.tsx
      to: src/services/planService.ts
      via: "Day selection, current day, preview"
      pattern: "getCurrentDay|getDaySummary|computeSessionDurationSeconds"
    - from: src/App.tsx
      to: src/services/progressService.ts
      via: "recordCompletion on session_complete"
      pattern: "recordCompletion|session_complete"
---

## Objective

Implement Session Runner + Plan/Day Selector so users can select a day, view session structure, and run a full session with audio. Session completion is auto-recorded. Current day defaults using on-track vs behind logic.

**Purpose:** Core value — user picks day, sees what's coming, runs session, progress saved.

**Output:** planService extended with session helpers; App with day selector, preview, session flow, completion wiring.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/5-CONTEXT.md
- @.planning/phases/05-session-runner/05-RESEARCH.md

**Existing:** Phases 1–4 complete. Plan Service, Progress Service, Timer Engine, Audio Service exist. App currently hardcodes day 0; session_complete does not call recordCompletion.

**Design decisions (from 5-CONTEXT):**
- Preview: summary + detail; rest = "Rest day — No intervals today"; hold/recovery, duration, type
- Day selector: scrollable list; current pre-selected + badge; rest selectable (Start disabled); completed = checkmark + dimmed
- Current day: on-track = next day (incl. rest); behind = skip rest; all done = null
- Session flow: auto-record on complete; brief "Saved"; "Ready to start?" before timer
- Plan ID: `"default"`; pass through for future multi-plan

---

## Plan 01: Session Runner + Plan/Day Selector

### Task 1: Session Utilities (planService)

**Files:** `src/services/planService.ts`

**Action:**
1. Add `getCurrentDay(plan: Plan, completions: Completion[]): number | null`:
   - Import `Completion` from progressService (or define minimal type: `{ day_index: number; completed_at: number }`).
   - If no completions: return 0 (first day).
   - Sort completions by `completed_at` desc; take first → `lastCompletedDayIndex`.
   - `nextDayIndex = lastCompletedDayIndex + 1`.
   - If `nextDayIndex >= plan.length`: return `null` (all done).
   - **On track:** `lastDate.toDateString()` equals today or yesterday (local). If on track: return `nextDayIndex`.
   - **Behind:** From `nextDayIndex`, skip rest/null days (use `getIntervalsForDay(plan, i) === null`); return first training day index. If none, return `null`.
2. Add `computeSessionDurationSeconds(intervals: Interval[]): number`:
   - `RELAXATION = 60` (from timer.ts or inline).
   - `total = 60 + Σ(hold_i) + Σ(recovery_i for i < n-1)`.
   - Return total.
3. Add `getDaySummary(plan: Plan, dayIndex: number): string`:
   - If `getIntervalsForDay(plan, dayIndex) === null`: return `"Rest"`.
   - Else: `intervals = getIntervalsForDay(...)`; return `"${intervals.length} cycle(s)"` (or "1 cycle" if length 1).

**Verify:**
```typescript
// getCurrentDay: no completions → 0; all done → null; on-track includes rest; behind skips rest
// computeSessionDurationSeconds: day 0 default-plan → 60 + 60+90 + 60+90 = 360 (no recovery after last hold)
// getDaySummary: rest → "Rest"; training → "2 cycles" or "1 cycle"
```

**Done:** planService exports getCurrentDay, computeSessionDurationSeconds, getDaySummary.

---

### Task 2: Day Selector UI

**Files:** `src/App.tsx`

**Action:**
1. Update `fetchCompletions` usage: ensure completions include `completed_at` (progressService already returns it). Type completions as `Completion[]`.
2. Add state: `selectedDayIndex: number | null`; initialize from `getCurrentDay(plan, completions)` when plan and completions load. Use `null` when all done.
3. Add state: `showReadyConfirm: boolean` (for "Ready to start?" step).
4. Render day list (scrollable): for each day index 0..plan.length-1:
   - Summary: `getDaySummary(plan, i)` → "Day N — Rest" or "Day N — X cycles".
   - Add type badge if `day.type` is dry/wet (optional).
   - Current badge: if `getCurrentDay(plan, completions) === i`, show "Current" or "Next".
   - Completed: if `completions.some(c => c.day_index === i)`, show checkmark + dimmed style.
   - Click: `setSelectedDayIndex(i)`.
   - Highlight selected: border/background when `selectedDayIndex === i`.
5. When `selectedDayIndex === null` (all done): show "Plan complete" message; no selection.
6. Remove old "Day 1 intervals", "Completions", "Mark day 0 complete" demo UI. Replace with day selector.

**Verify:**
- Day list renders; clicking selects day; current day has badge; completed days dimmed + checkmark.
- All done: "Plan complete", no day selected.

**Done:** Day selector UI in place.

---

### Task 3: Session Preview

**Files:** `src/App.tsx`

**Action:**
1. Add session preview section below day list. Updates when `selectedDayIndex` changes.
2. If `selectedDayIndex === null`: show "Plan complete — no session to run."
3. If rest day (`getIntervalsForDay(plan, selectedDayIndex) === null`): show "Rest day — No intervals today." Disable Start. Show "Mark rest day complete" button; on click call `handleMarkDayComplete(selectedDayIndex)`.
4. If training day:
   - Summary: `${intervals.length} cycle(s) · ~${Math.ceil(computeSessionDurationSeconds(intervals) / 60)} min` + type if present.
   - Expandable detail: numbered list "1. Hold 60s, recover 90s", etc.
   - Show Start button (or "Ready to start?" first).
5. Pass `planId = 'default'` through; use `selectedDayIndex` in all session logic.

**Verify:**
- Rest day: "Rest day — No intervals today", Start disabled, "Mark rest day complete" works.
- Training day: summary + detail; Start enabled.

**Done:** Session preview section renders; rest vs training handled.

---

### Task 4: Session Flow & Completion Recording

**Files:** `src/App.tsx`

**Action:**
1. **Start flow:** When user clicks Start (training day selected):
   - Option A: Show "Ready to start?" button/modal; on confirm → proceed.
   - Option B: Go straight to preload + start.
   - Use Option A per research recommendation.
2. **handleStartSession:** Use `selectedDayIndex` instead of hardcoded 0. Validate `selectedDayIndex !== null` and intervals exist.
3. **session_complete handler:** Add `recordCompletion('default', selectedDayIndex)` (use the day that was started—capture in closure or ref). On success: show brief "Saved" (inline text or toast for 2–3s). Refetch completions and update UI. On error: show error message.
4. **Capture selected day for completion:** Store `sessionDayIndexRef.current = selectedDayIndex` before starting, so session_complete uses correct day even if user navigates (unlikely during session).
5. **Session takeover:** When `sessionStatus === 'running'`, session view takes most space (timer state, phase, remaining). When complete, return to day selector + preview with updated completions.
6. **Remove:** Manual "Mark day 0 complete" for training days (keep "Mark rest day complete" for rest days only).
7. **Speed control:** Keep for dev/testing; can stay in session view.

**Verify:**
```bash
npm run dev
# Login, select day 0 (training), click "Ready to start?" → Start
# Complete session (or use speed 10×)
# Expect: "Session complete" + "Saved"; completions list updates; day 0 shows checkmark
# Select day 2 (rest), click "Mark rest day complete" → completions update
# Complete all days → "Plan complete", no day selected
```

**Done:** Session flow uses selected day; completion auto-recorded; "Saved" shown; rest days markable.

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| PLAN-02: View session structure before starting | Session preview shows hold/recovery, duration, type for selected day |
| PLAN-03: Select any day | Day list; click to select; all days selectable |
| PLAN-04: Default to current day | On load, current day (on-track or behind) pre-selected with badge |
| SESS-07: Session completion recorded | Complete session → "Saved"; completions refetched; day shows complete |
| Rest day handling | Rest selectable; "Mark rest day complete"; Start disabled |
| All done | "Plan complete"; no day selected; Start disabled |

---

## Success Criteria

1. **User can view session structure before starting** — ✓ Preview with summary + detail
2. **User can select any day** — ✓ Scrollable day list
3. **App defaults to current day** — ✓ getCurrentDay; on-track/behind logic
4. **User can start and complete session with audio** — ✓ Uses selected day; audio wired
5. **Session completion recorded** — ✓ recordCompletion on session_complete; "Saved"

---

## Output

After completion:
- `src/services/planService.ts` — getCurrentDay, computeSessionDurationSeconds, getDaySummary
- `src/App.tsx` — Day selector, session preview, session flow, session_complete → recordCompletion

---

## Dependency Graph

```
Task 1 (session utils) ──> Task 2 (day selector)
                              │
                              └──> Task 3 (session preview)
                                        │
                                        └──> Task 4 (session flow)
```

**Sequential:** 1 → 2 → 3 → 4.
