# Phase 5: Session Runner + Plan/Day Selector — Research

**Phase:** 5. Session Runner + Plan/Day Selector  
**Researched:** 2025-03-19  
**Sources:** 5-CONTEXT.md, ARCHITECTURE.md, PITFALLS.md, progressService, planService, timerEngine, WebSearch

---

## Summary

Phase 5 orchestrates day selection, session preview, and full session execution with audio. It wires existing services (Plan, Progress, Timer, Audio) into a cohesive flow. Key novel pieces: **current-day logic** (on-track vs behind, skip rest when behind), **session duration calculation** for preview, and **session_complete → recordCompletion** wiring.

---

## Key Findings

### 1. Current Day Logic (getCurrentDay)

**Requirements (5-CONTEXT):**
- **On track** (trained yesterday or today): Current = next day in sequence, including rest days.
- **Behind** (last completion 2+ days ago): Skip rest days; current = first non-completed training day.
- **All done:** No day selected; Start disabled.

**Implementation approach:**

| Step | Logic |
|------|-------|
| 1. Last completion | Sort completions by `completed_at` desc; take first. That day index = last completed. |
| 2. On track? | `completed_at` in ms. Compare to local calendar: `new Date(completed_at).toDateString()` equals today or yesterday (`new Date()` minus 1 day). |
| 3. Next day | `nextDayIndex = lastCompletedDayIndex + 1` (or 0 if no completions). |
| 4. If on track | `current = nextDayIndex` (can be rest). |
| 5. If behind | From `nextDayIndex`, skip rest/null days until first training day. Use `getPhasesForDay(plan, i) !== null` to detect training days. |
| 6. All done | If `nextDayIndex >= plan.length` or all days completed, return `null` (no current day). |

**Date comparison (local timezone):**

```typescript
function isOnTrack(completions: Completion[]): boolean {
  if (completions.length === 0) return true
  const last = [...completions].sort((a, b) => b.completed_at - a.completed_at)[0]
  const lastDate = new Date(last.completed_at)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  return lastDate.toDateString() === today.toDateString() ||
         lastDate.toDateString() === yesterday.toDateString()
}
```

**Source:** WebSearch (Stack Overflow, codestudy.net); `completed_at` is Unix ms (backend uses `Date.now()`).

---

### 2. Session Duration for Preview

**Requirement:** Summary shows "~X min total" (5-CONTEXT).

**Formula (from timerEngine):**
- Relaxation: 60s (RELAXATION_SECONDS)
- Phases: flat sequence (hold, recovery, hold, recovery, hold…; no recovery after last hold)
- Total seconds = 60 + Σ(phase.duration) for all phases

```typescript
function computeSessionDurationSeconds(phases: Phase[]): number {
  const RELAXATION = 60
  let total = RELAXATION
  for (const p of phases) {
    total += p.duration
  }
  return total
}
```

**Display:** `~${Math.ceil(total / 60)} min` (round up for user-friendly estimate).

---

### 3. Session Complete → Record Completion

**Current state:** App has `handleMarkDayComplete` (manual button). Session `session_complete` handler does NOT call `recordCompletion`.

**Wiring:**
1. In `session_complete` callback: call `recordCompletion(planId, selectedDayIndex)`.
2. Use `planId = 'default'`; `selectedDayIndex` = day user started session with.
3. On success: show brief "Saved" (e.g. toast or inline text for 2–3s).
4. On error: show error message; completion still recorded server-side if POST succeeded—client error is rare (network). Retry or surface "Sync failed" if needed.

**API:** `recordCompletion(planId, dayIndex)` returns `{ ok: boolean } | { error: string }`. Backend uses `INSERT OR REPLACE`; idempotent.

---

### 4. Day Selector UI Patterns

**5-CONTEXT:** Scrollable list, day number + summary, current pre-selected + badge, rest selectable (Start disabled), completed = checkmark + dimmed.

**React patterns:**
- Controlled selection: `selectedDayIndex` state; `onClick` on day item updates it.
- Current day badge: compute `currentDay` via `getCurrentDay(plan, completions)`; show "Current" or "Next" on that item.
- Rest day: `getPhasesForDay(plan, i) === null` → render "Rest" summary; disable Start when selected.
- Completed: `completions.some(c => c.day_index === i)` → checkmark + dimmed style.

**Summary text per day:**
- Rest: "Day N — Rest"
- Training: "Day N — X cycles" (hold phase count) or "Day N — 1 cycle"
- Optional: "dry" / "wet" from `day.type` if present.

---

### 5. Session Preview Format

**5-CONTEXT:** Summary + detail; "3 cycles · ~12 min total"; expandable per-cycle; rest = "Rest day — No intervals today"; hold/recovery, duration, type.

**Structure:**
- **Summary line:** `${holdCount} cycle(s) · ~${Math.ceil(durationSec / 60)} min` + type if present (`dry`/`wet`).
- **Expandable detail:** Numbered list of phases: "1. Hold 60s", "2. Recovery 90s", "3. Hold 60s", etc.
- **Rest day:** "Rest day — No intervals today."

---

### 6. Layout Options (5-CONTEXT: b or c)

**Option B — One screen:** Day list (top or side), preview + Start below. When session runs, session view takes over (full-screen or dominant).

**Option C — Three screens:** Day selector → Preview/confirm → Session (full-screen).

**Recommendation:** Option B is simpler—fewer navigation steps, matches Pitfall 8 (decision fatigue). Single screen with session "takeover" when running. After session complete, return to same screen with updated completions.

---

### 7. "Ready to Start?" Confirmation (5-CONTEXT: b or c)

**Option B:** "Ready to start?" button/modal before timer begins.  
**Option C:** Short checklist ("Eyes closed? Ready?").

**Recommendation:** Option B—single "Ready to start?" is sufficient. Checklist adds friction; can be added later if needed.

---

## Pitfalls to Avoid

| Pitfall | Mitigation |
|---------|------------|
| **Pitfall 8: Decision fatigue** | Default to current day; single tap to start; avoid extra steps |
| **Pitfall 11: No feedback when complete** | Show "Session complete" + brief "Saved" after recordCompletion |
| **Timezone edge cases** | Use `toDateString()` for calendar-day comparison; avoid UTC-only logic |
| **Rest day "current" when behind** | Skip rest days when behind; only select rest when on track |

---

## Implementation Notes

### New / Modified Modules

| Module | Purpose |
|--------|---------|
| `getCurrentDay(plan, completions)` | Returns day index or null; uses on-track/behind logic |
| `computeSessionDurationSeconds(phases)` | Total seconds for preview |
| `getDaySummary(plan, dayIndex)` | "Rest" or "X cycles" for list item |
| App.tsx | Day selector, preview, session flow, session_complete → recordCompletion |

### Data Flow

```
App load
  → fetchCompletions('default')
  → getCurrentDay(plan, completions) → selectedDayIndex (default)
  → User can change selection
  → Preview updates for selected day
  → User clicks "Start" → (optional) "Ready to start?" → preload audio → start timer
  → session_complete → recordCompletion('default', selectedDayIndex) → "Saved"
  → Refetch completions, update UI
```

---

## Gaps / Deferred

- Plan selector — single plan `"default"` for Phase 5
- "Skip" as distinct from "complete" — skip = mark complete
- Session-complete audio cue — v2 (SESS-09)
- Volume control — v2 (SESS-08)

---

## Sources

- 5-CONTEXT.md — Session preview, day selector, current day, session flow
- ARCHITECTURE.md — Data flow, "what's next" flow, Plan/Day Selector responsibility
- PITFALLS.md — Pitfall 8 (decision fatigue), Pitfall 11 (completion feedback)
- progressService.ts — fetchCompletions, recordCompletion, Completion type
- planService.ts — getPhasesForDay, loadPlan
- timerEngine.ts — buildTimeline, RELAXATION_SECONDS, session structure
- server/routes/progress.js — completed_at as Date.now()
- WebSearch: JavaScript date comparison (today/yesterday, local timezone)
