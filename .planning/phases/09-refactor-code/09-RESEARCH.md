# Phase 9: Refactor Code — Research

**Status:** Complete
**Researched:** 2025-03-19

## Summary

Phase 9 improves code quality through targeted refactoring. Scope is bounded: no user-facing behavior changes, no new features. Focus on type safety, reducing duplication, and improving maintainability.

## Codebase Analysis

### File Size (lines)

| File | Lines | Notes |
|------|-------|-------|
| TrainingContext.tsx | 302 | Largest; auth + plan + progress + session |
| timerEngine.ts | 229 | Pure logic, well-structured |
| Dashboard.tsx | 222 | Complex conditional rendering |
| ActiveSessionView.tsx | 159 | Reasonable |
| planService.ts | 153 | Good separation |

### Identified Refactoring Targets

1. **Plan day ID access** — Repeated `(plan[i] as { id?: string })?.id` in Dashboard, TrainingContext, completions checks. Plan types define `TrainingDay | RestDay` with `id`, but `PlanDay` includes `null`; callers defensively cast. Add `getDayId(plan, index): string | null` to planService.

2. **TrainingContext** — Single context with ~20 state values and handlers. Could split into sub-contexts or custom hooks. Recommendation: extract `useSessionEngine` (timer + audio wiring) to reduce TrainingProvider size; keep single context for simplicity.

3. **Dashboard** — Nested conditionals: `showSessionPreview`, `showDayDetail`, `isRestDay`, `isPlanComplete`. Extract `SessionPreviewSection` and `DayListSection` as components for readability.

4. **Plan name** — "CO2 Tolerance III" hardcoded in Dashboard. Plan JSON has no metadata. Option: add `name` to plan or keep hardcoded (low priority).

5. **Completion types** — `CompletionForDay` and `CompletionWithTimestamp` in completions.ts; `Completion` from progressService. Types are coherent; no urgent change.

## Refactoring Principles (Phase 9)

- **Component size:** Target ~150 lines max; split when exceeding.
- **Utils vs hooks:** Pure logic → `src/utils`; React state/effects → `src/hooks`.
- **No duplication:** Extract shared logic; components compose.
- **Reusable helpers:** Highly reusable pure functions → `src/utils`.

## Out of Scope

- Splitting TrainingContext into multiple contexts (adds complexity)
- Changing timer/audio architecture
- Adding tests (separate phase)
- Migrating to different state management

## Sources

- Codebase grep for `as { id` patterns
- ROADMAP.md Phase 9 success criteria
- ARCHITECTURE.md patterns
