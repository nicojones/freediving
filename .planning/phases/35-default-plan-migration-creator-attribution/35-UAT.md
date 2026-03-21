---
status: fixes-applied
phase: 35-default-plan-migration-creator-attribution
source: 35-PLAN.md, 35-CONTEXT.md
started: 2025-03-21T00:00:00Z
updated: 2025-03-21T12:00:00Z
---

## Current Test

All 8 tests completed. Four issues were diagnosed; all four fixes have been implemented (verify-work 2025-03-21). Ready for user re-verification.

## E2E Regression (plan-change.spec.ts)

Two plan-change E2E tests failed during verify-work. Diagnosis and fixes applied:

### 1. user can change plan — timeout on confirm-switch-plan-confirm

**Symptom:** Test times out (90s) waiting for `getByTestId('confirm-switch-plan-confirm')`.

**Root cause:** Test always clicked `plan-selector-option.nth(1)`. If that option was already the active plan, `PlansView.handlePlanChange` returns early (no modal). The modal only appears when switching to a _different_ plan.

**Fix:** Use the same logic as "progress is preserved" — detect the active option via `bg-primary/10` and click the non-active one.

### 2. progress is preserved when switching plans — dashboard-day-list not found

**Symptom:** `expect(getByTestId('dashboard-day-list')).toBeVisible()` fails (5s timeout).

**Root cause:** After plan switch, nav-training navigates to `/`. The Dashboard may render SessionPreviewSection (day view) instead of DayListSection when `viewMode` persists as `session-preview`. `dashboard-day-list` only exists in DayListSection.

**Fix:** If `back-button` is visible (session preview), click it to reach the day list. Increase timeout to 15s for plan load after switch.

### Fixes Applied

| File                             | Change                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| e2e/plan-change.spec.ts          | "user can change plan": click non-active option (firstIsActive check)                 |
| e2e/plan-change.spec.ts          | "progress is preserved": click back-button if visible; dashboard-day-list timeout 15s |
| src/components/ui/BackButton.tsx | Add data-testid="back-button" for E2E                                                 |

## Tests

### 1. Cold Start Smoke Test

expected: Server boots without errors; migrations complete; app loads; plans API returns data when authenticated.
result: pass

### 2. Default Plan Visible in Plans Tab

expected: Logged-in user goes to Plans tab (Settings). Sees the default plan "4:00 Dry Breathhold" in the plan selector list.
result: pass

### 3. Creator Attribution in Plans Tab

expected: In Plans tab, for the default plan, "Created by Fishly" appears below the plan name (or after progress). Text is small and greyed out (text-on-surface-variant text-sm).
result: issue
reported: "correct, but it should be smaller and greyed out"
severity: cosmetic

### 4. Creator Attribution in Training Tab

expected: On Dashboard (Training tab), when viewing the day list, "Created by Fishly" appears below the plan description for the default plan. Text is small and greyed out.
result: issue
reported: "also not small nor greyed out"
severity: cosmetic

### 5. Creator Attribution in Session Preview

expected: Creator attribution does NOT appear in Session Preview (day views). User does not want it in day views.
result: issue
reported: "we don't want it in the day views"
severity: major

### 6. Private Plans Show No Creator Text

expected: For a user-created plan (private), no "Created by" text appears in Plans tab, Training tab, or Session preview.
result: pass

### 7. Default Plan Not Deletable

expected: In Plans tab, the default plan ("4:00 Dry Breathhold") does not show a delete button. User-created plans show delete button.
result: pass

### 8. No Plans Available When Offline

expected: When offline (or when API returns no plans), user sees "No plans available" or equivalent error. No bundled default plan fallback. Icons library should be cached for offline use.
result: issue
reported: "i still have all the data — but the icons library isn't cached, and it should"
severity: major

## Summary

total: 8
passed: 4
issues: 4
pending: 0
skipped: 0

## Fixes Applied (verify-work 2025-03-21)

| Gap                          | Fix                                                                                                                 | Verified |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| Creator Plans tab styling    | PlanSelectorSection uses `subtle` class (font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant) | ✓        |
| Creator Training tab styling | DayListSection uses `subtle` class                                                                                  | ✓        |
| Session Preview no creator   | SessionPreviewSection has no creator block; Dashboard does not pass creatorName/isPublic to it                      | ✓        |
| Icons cache offline          | app/sw.ts has CacheFirst runtime rule for fonts.googleapis.com and fonts.gstatic.com                                | ✓        |

## Gaps

- truth: "Creator attribution in Plans tab uses TopAppBar-style: text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]"
  status: resolved
  reason: "User reported: correct, but it should be smaller and greyed out (same as TopAppBar 42-46)"
  severity: cosmetic
  test: 3
  root_cause: "PlanSelectorSection uses text-sm font-normal instead of font-label text-[10px] uppercase tracking-[0.2em]"
  artifacts:
  - path: src/components/settings/PlanSelectorSection.tsx
    issue: "Creator span uses text-on-surface-variant text-sm font-normal"
    missing:
  - "Use text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]"
- truth: "Creator attribution in Training tab (DayListSection) uses TopAppBar-style: text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]"
  status: resolved
  reason: "User reported: also not small nor greyed out (same as TopAppBar 42-46)"
  severity: cosmetic
  test: 4
  root_cause: "DayListSection uses text-sm font-normal instead of font-label text-[10px] uppercase tracking-[0.2em]"
  artifacts:
  - path: src/components/day/DayListSection.tsx
    issue: "Creator span uses text-on-surface-variant text-sm font-normal"
    missing:
  - "Use text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]"
- truth: "Creator attribution does NOT appear in Session Preview (day views)"
  status: resolved
  reason: "User reported: we don't want it in the day views"
  severity: major
  test: 5
  root_cause: "SessionPreviewSection renders creator block when isPublic; user wants it removed from day views"
  artifacts:
  - path: src/components/session/SessionPreviewSection.tsx
    issue: "Lines 77-81 render creator attribution"
  - path: src/views/Dashboard.tsx
    issue: "Passes creatorName and isPublic to SessionPreviewSection"
    missing:
  - "Remove creator attribution block from SessionPreviewSection"
  - "Remove creatorName and isPublic props from SessionPreviewSection (optional cleanup)"
- truth: "Icons library is cached for offline use (PWA precache)"
  status: resolved
  reason: "User reported: i still have all the data — but the icons library isn't cached, and it should"
  severity: major
  test: 8
  root_cause: "Material Symbols font (fonts.googleapis.com) not in SW runtime cache; app/layout.tsx loads it via link"
  artifacts:
  - path: app/sw.ts
    issue: "No runtime caching for fonts.googleapis.com or fonts.gstatic.com"
  - path: app/layout.tsx
    issue: "Material Symbols loaded from external URL"
    missing:
  - "Add CacheFirst runtime rule for fonts.googleapis.com and fonts.gstatic.com in sw.ts"
