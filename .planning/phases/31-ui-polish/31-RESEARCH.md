# Phase 31: UI Polish — Research

**Researched:** 2025-03-21  
**Domain:** UI polish, layout consistency, navigation UX, component styling  
**Confidence:** HIGH

## Summary

Phase 31 refines six UI areas using the existing stack (Next.js, Tailwind, Headless UI, clsx, Material Symbols). No new libraries are required. Each change is localized to specific components with clear before/after behavior. The "active tab label only" pattern aligns with Material Design's shifting bottom navigation style for 4+ tabs. Dashboard keeps weekLabel in TopAppBar with "Day X of Y" progress. Plan complete: no day selected; whole plan gets green border. Create-plan success flow needs an `onNavigateToPlans` callback threaded from CreatePlanView through CreatePlanSection to CreatePlanStatusBanner.

**Primary recommendation:** Implement each area as a focused edit to the identified files; preserve data-testids for E2E; update unit tests for CreatePlanStatusBanner when success message changes.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Bottom Tabs — Label Only on Active:** Only the active tab displays its label; inactive tabs show icon only. No screenreaders in scope — no need for `sr-only` on inactive labels. Remove label span from DOM for inactive tabs (or hide via CSS); active tab keeps icon + label.

2. **Top-Right Corner — Dashboard Progress; Remove Elsewhere:** Dashboard (Training tab): Keep `weekLabel` in TopAppBar top-right. Content: "Day 3 of 21" (progress format, not "Current Week"). Others (Plans, Create, Settings): Remove `weekLabel` from TopAppBar; nothing shown.

3. **Developer Zone — Muted, Move to Bottom:** Styling: Muted (smaller text, lighter border, lower contrast). Placement: Move to bottom of Settings (below UserProfileCard, above Sign out, or at very bottom before VersionFooter — implementer chooses).

4. **Create Plan Success — Button + Auto-Dismiss:** Replace "Plan created successfully. It should appear in the plan selector above." with "See plans here" and a separate button that navigates to Plans tab. Button: Separate button (not inline link) to go to Plans tab. Notification: Auto-dismissed (existing 3s timeout remains).

5. **Plan Complete — No Day Selected; Whole Plan Green Border:** When plan is complete, no day is selected. The whole plan (DayListSection view) gets the same green border as completed days: `ring-2 ring-emerald-500/60 shadow-[0_0_32px_rgba(5,150,105,0.15)]`.

### Claude's Discretion

- Developer zone placement: below UserProfileCard vs above Sign out vs at very bottom before VersionFooter

### Deferred Ideas (OUT OF SCOPE)

- Screenreader support
- Changing TopAppBar left side (logo, brand)
- Changing bottom tab order or icons
- New features beyond the five success criteria

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                     | Research Support                                                          |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| REQ-31-1 | Bottom tabs: only active tab shows label; inactive show icon only               | Material "shifting" pattern; conditional render or `hidden` on label span |
| REQ-31-2 | Top-right: Dashboard keeps weekLabel with "Day X of Y"; others remove weekLabel | Dashboard: pass weekLabel="Day X of Y"; others: stop passing weekLabel    |
| REQ-31-3 | Trainings tab padding matches Plans/Create/Settings (`px-6 pt-8`)               | Dashboard main: change `px-2 sm:px-6` → `px-6`                            |
| REQ-31-4 | Developer zone: muted styling; move to bottom of Settings                       | DevModeSection: muted classes; SettingsView: reorder components           |
| REQ-31-5 | Create plan success: "See plans here" + button → Plans tab; auto-dismiss        | CreatePlanStatusBanner: new message + button; onNavigateToPlans callback  |
| REQ-31-6 | Plan complete: no day selected; whole plan green border                         | Dashboard main: add isPlanComplete to green ring condition                |

</phase_requirements>

## Standard Stack

### Core (existing — no new installs)

| Library            | Version | Purpose                 | Why Standard     |
| ------------------ | ------- | ----------------------- | ---------------- |
| Next.js App Router | 15.x    | Routing, layouts        | Project standard |
| Tailwind CSS       | 4.x     | Styling                 | Project standard |
| clsx               | 2.x     | Conditional classNames  | Project standard |
| @headlessui/react  | 2.x     | Switch (DevModeSection) | Project standard |
| Material Symbols   | —       | Icons                   | Project standard |

### Supporting

| Library         | Version | Purpose                | When to Use                    |
| --------------- | ------- | ---------------------- | ------------------------------ |
| next/navigation | —       | useRouter, router.push | Tab navigation, Plans redirect |

**Installation:** None. All dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── layout/       # BottomNavBar, TopAppBar
│   └── settings/     # DevModeSection, CreatePlanSection, create-plan/
├── views/            # Dashboard, PlansView, CreatePlanView, SettingsView
└── services/         # planService (getCurrentDay, getPlanDays)
```

### Pattern 1: Conditional Label Visibility (Bottom Tabs)

**What:** Render label span only when tab is active; inactive tabs show icon only.  
**When to use:** Bottom nav with 4+ tabs to save space (Material "shifting" style).  
**Example:**

```tsx
// In BottomNavBar: per-tab button
<button ...>
  <span className="material-symbols-outlined ...">timer</span>
  {activeTab === 'training' && (
    <span className="font-label text-xs ...">Training</span>
  )}
</button>
```

**Alternative:** Use `className={clsx(activeTab !== 'training' && 'sr-only')}` to hide label — but CONTEXT says "Remove label span from DOM for inactive tabs (or hide via CSS)". Either approach is acceptable; conditional render is simpler and avoids sr-only (no screenreaders).

### Pattern 2: Callback Prop for Cross-Tab Navigation

**What:** Parent view owns router; passes `onNavigateToPlans` to child that shows success.  
**When to use:** CreatePlanSection lives in CreatePlanView; Plans tab is `/plans`.  
**Example:**

```tsx
// CreatePlanView.tsx
<CreatePlanSection
  onPlanCreated={refreshAvailablePlans}
  onNavigateToPlans={() => router.push('/plans')}
/>

// CreatePlanSection → CreatePlanStatusBanner
<CreatePlanStatusBanner
  error={handlers.error}
  success={handlers.success}
  onNavigateToPlans={onNavigateToPlans}
/>
```

### Pattern 3: Muted Section Styling

**What:** Lower contrast, smaller text, lighter border for secondary/developer content.  
**When to use:** DevModeSection — same structure as ResetProgressSection but visually de-emphasized.  
**Example:**

```tsx
// ResetProgressSection (reference): bg-surface-container-low, border-outline-variant/30
// DevModeSection (muted): smaller text, lighter border, lower opacity
<div className="bg-surface-container-low/50 rounded-2xl p-4 mb-6 border border-outline-variant/20">
  <h2 className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant/70 mb-2">
    Developer
  </h2>
  ...
</div>
```

### Anti-Patterns to Avoid

- **Adding weekLabel to TopAppBar for non-Dashboard views:** CONTEXT says remove from Plans, Create, Settings; only Dashboard keeps it with "Day X of Y".
- **Using inline link for "See plans here":** CONTEXT requires a separate button, not inline link.
- **Changing BottomNavBar data-testids:** E2E uses `nav-training`, `nav-plans`, `nav-create`; preserve them.

## Don't Hand-Roll

| Problem              | Don't Build          | Use Instead                                                        | Why                        |
| -------------------- | -------------------- | ------------------------------------------------------------------ | -------------------------- |
| Tab navigation       | Custom router logic  | `router.push('/plans')` from Next.js                               | Already in use; consistent |
| Progress calculation | Custom day counting  | `getCurrentDay(plan, completions)`, `plan.length` from planService | Already exists             |
| Conditional classes  | Manual string concat | clsx                                                               | Project standard           |
| Success auto-dismiss | Custom timer         | Existing `setTimeout(..., 3000)` in useCreatePlanHandlers          | Keep as-is                 |

## Common Pitfalls

### Pitfall 1: Dashboard weekLabel Must Show "Day X of Y"

**What goes wrong:** Dashboard still shows "Current Week" instead of progress.  
**Why it happens:** Dashboard passes `weekLabel="Current Week"`; needs dynamic "Day X of Y".  
**How to avoid:** Compute `dayNum` and `totalDays` from plan; pass `weekLabel={\`Day ${dayNum} of ${totalDays}\`}` to TopAppBar.  
**Warning signs:** Hardcoded "Current Week" in Dashboard.

### Pitfall 1b: Forgetting to Remove weekLabel from Non-Dashboard Views

**What goes wrong:** PlansView, CreatePlanView, SettingsView still pass weekLabel.  
**Why it happens:** Three views pass weekLabel; only Dashboard should.  
**How to avoid:** Remove `weekLabel` prop from PlansView, CreatePlanView, SettingsView TopAppBar usages.  
**Warning signs:** `weekLabel=` in non-Dashboard views.

### Pitfall 2: Progress "day X of Y" When Plan Is Complete

**What goes wrong:** `getCurrentDay` returns `null` when all days complete; naive `currentDayIndex + 1` throws or shows "day NaN of 14".  
**Why it happens:** Plan complete → currentDayIndex is null.  
**How to avoid:** Use `currentDayIndex !== null ? currentDayIndex + 1 : plan.length` for day number; total is always `plan.length`. Display: "day X of Y" where X = next day (1-based) or total when complete.  
**Warning signs:** Using `currentDayIndex!` without null check.

### Pitfall 3: CreatePlanStatusBanner Lacking Navigation

**What goes wrong:** Success message says "See plans here" but no way to navigate; user stays on Create tab.  
**Why it happens:** CreatePlanStatusBanner is presentational; CreatePlanView owns router.  
**How to avoid:** Add `onNavigateToPlans?: () => void` prop; render button that calls it; CreatePlanView passes `() => router.push('/plans')`.  
**Warning signs:** CreatePlanStatusBanner without callback prop.

### Pitfall 4: E2E Tests Expecting Old Success Text

**What goes wrong:** `create-plan-success` E2E and unit test expect "Plan created successfully"; new message breaks them.  
**Why it happens:** CreatePlanStatusBanner.test.tsx asserts `toHaveTextContent('Plan created successfully')`.  
**How to avoid:** Update unit test to assert "See plans here" (or partial match); add assertion for Plans button if needed. E2E verifyPlanCreation already checks `create-plan-success` visible and navigates via nav-plans — ensure new button also works or E2E still passes.  
**Warning signs:** Test failures after changing success message.

## Code Examples

### Bottom Tabs — Label Only on Active

```tsx
// BottomNavBar.tsx — Training tab (repeat pattern for Plans, Create, Settings)
<button
  type="button"
  data-testid="nav-training"
  onClick={onTrainingClick}
  className={clsx(
    'flex flex-col items-center justify-center rounded-2xl px-4 py-2 min-h-[44px] min-w-[44px] transition-all duration-400',
    {
      'text-primary bg-primary/10': activeTab === 'training',
      'text-tertiary opacity-60 hover:opacity-100 hover:text-primary': activeTab !== 'training',
    }
  )}
>
  <span
    className="material-symbols-outlined mb-1"
    style={{ fontVariationSettings: activeTab === 'training' ? "'FILL' 1" : undefined }}
    aria-hidden
  >
    timer
  </span>
  {activeTab === 'training' && (
    <span className="font-label text-xs font-medium uppercase tracking-widest">Training</span>
  )}
</button>
```

### Dashboard weekLabel "Day X of Y"

```tsx
// Dashboard.tsx — pass to TopAppBar
const currentDayIndex = getCurrentDay(p, completions);
const dayNum = currentDayIndex !== null ? currentDayIndex + 1 : p.length;
const totalDays = p.length;

<TopAppBar
  variant={showDayDetail ? 'session-preview' : 'dashboard'}
  weekLabel={`Day ${dayNum} of ${totalDays}`}
/>;
```

### Plan Complete Green Border

```tsx
// Dashboard.tsx — main className
className={clsx(
  'px-6 pt-8 max-w-2xl mx-auto rounded-3xl transition-all duration-300',
  { 'pb-12': showDayDetail },
  (isSelectedDayCompleted || isPlanComplete) &&
    'ring-2 ring-emerald-500/60 shadow-[0_0_32px_rgba(5,150,105,0.15)]'
)}
```

### CreatePlanStatusBanner — Success with Button

```tsx
// CreatePlanStatusBanner.tsx
interface CreatePlanStatusBannerProps {
  error?: string | null;
  success?: boolean;
  onNavigateToPlans?: () => void;
}

if (success) {
  return (
    <div
      className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-body flex flex-col gap-2"
      data-testid="create-plan-success"
    >
      <span>See plans here</span>
      {onNavigateToPlans && (
        <button
          type="button"
          onClick={onNavigateToPlans}
          className="w-full py-2 rounded-lg bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary"
          data-testid="create-plan-go-to-plans"
        >
          Go to Plans
        </button>
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach             | Current Approach               | When Changed                           | Impact                                  |
| ------------------------ | ------------------------------ | -------------------------------------- | --------------------------------------- |
| All tabs show label      | Active-only label (shifting)   | Material Design 3 / React Native Paper | Better use of space for 4+ tabs         |
| weekLabel "Current Week" | "Day X of Y" in Dashboard only | Phase 31 decision                      | Dashboard shows progress; others remove |

**Deprecated/outdated:** None for this phase.

## Open Questions

1. **Developer zone exact placement**
   - What we know: Below UserProfileCard, above Sign out, or at very bottom before VersionFooter.
   - What's unclear: Which is least prominent.
   - Recommendation: At very bottom, before VersionFooter — last in Settings flow; user scrolls past primary actions first.

2. **Dashboard weekLabel** — Resolved: Keep in TopAppBar, show "Day X of Y".

## Validation Architecture

### Test Framework

| Property           | Value                                    |
| ------------------ | ---------------------------------------- |
| Framework          | Vitest 4.x (unit), Playwright 1.58 (E2E) |
| Config file        | vitest.config.ts, playwright.config.ts   |
| Quick run command  | `npm run test:run`                       |
| Full suite command | `npm run test:run && npm run test:e2e`   |

### Phase Requirements → Test Map

| Req ID   | Behavior                                            | Test Type       | Automated Command                                                               | File Exists? |
| -------- | --------------------------------------------------- | --------------- | ------------------------------------------------------------------------------- | ------------ |
| REQ-31-1 | Bottom tabs: active shows label, inactive icon only | visual/manual   | —                                                                               | —            |
| REQ-31-2 | Top-right: no tab name; Dashboard progress          | visual/manual   | —                                                                               | —            |
| REQ-31-3 | Trainings tab padding matches others                | visual/manual   | —                                                                               | —            |
| REQ-31-4 | Developer zone muted, at bottom                     | unit (optional) | `npm run test:run -- CreatePlanStatusBanner`                                    | ✅           |
| REQ-31-5 | Create plan success: message + button → Plans       | unit + E2E      | `npm run test:run -- CreatePlanStatusBanner`; `npm run test:e2e -- create-plan` | ✅           |
| REQ-31-6 | Plan complete: whole plan green border              | visual/manual   | —                                                                               | —            |

### Sampling Rate

- **Per task commit:** `npm run test:run` (unit)
- **Per wave merge:** `npm run test:run && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `CreatePlanStatusBanner.test.tsx` — update assertion from "Plan created successfully" to "See plans here"; add test for button and `onNavigateToPlans` when provided
- [ ] E2E `create-plan.spec.ts` — verify `create-plan-success` still visible; optionally add `create-plan-go-to-plans` click to navigate to Plans (or rely on existing nav-plans flow)

_(No new test files required; updates to existing tests suffice.)_

## Sources

### Primary (HIGH confidence)

- Project codebase: BottomNavBar, TopAppBar, Dashboard, SettingsView, CreatePlanView, CreatePlanSection, CreatePlanStatusBanner, useCreatePlanHandlers, planService
- CONTEXT.md: Locked decisions, code locations
- COMPONENT-PATTERNS.md: Headless UI patterns, data-testids

### Secondary (MEDIUM confidence)

- Web search: Material "shifting" bottom nav pattern (React Native Paper, 4+ tabs)
- UX best practices: Active tab label only for space-constrained mobile nav

### Tertiary (LOW confidence)

- Material Design M2 bottom navigation page (redirected to M3; specific shifting docs not fetched)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries already in project
- Architecture: HIGH — patterns match existing codebase structure
- Pitfalls: HIGH — derived from code inspection and CONTEXT

**Research date:** 2025-03-21  
**Valid until:** 30 days (stable UI patterns)
