# Phase 36: Plans Tab Context Menu, Filters, Progress & How It Works — Research

**Researched:** 2025-03-21  
**Domain:** React UI (context menu, filters, expandable section, copy/download)  
**Confidence:** HIGH

## Summary

Phase 36 improves the Plans tab UX with six features: (1) replace trash icon with a "..." context menu (Copy JSON, Download, Delete, Edit); (2) All/My/Public filter above the plan list; (3) move progress to top-right of each plan box; (4) greyed 🌐 icon for public plans the user doesn't own; (5) expandable "How it works +" section at top; (6) "Create Plan" button at bottom linking to `/create`. The project already uses @headlessui/react (Dialog, Tabs, Listbox, Switch, RadioGroup). Headless UI provides Menu and Disclosure primitives that match the requirements. Copy and download patterns are standard Web APIs. Filter and progress layout are layout/CSS changes.

**Primary recommendation:** Use Headless UI Menu for the context menu, Disclosure for "How it works", RadioGroup for the filter (consistent with SpeedMultiplierSelector), and standard clipboard/blob APIs for copy/download. Follow COMPONENT-PATTERNS.md for styling and data-testid conventions.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Context menu:** Replace trash with "..." menu offering Copy JSON, Download plan (.json), Delete, Edit. Permission: Edit and delete share same "allowed" check (user-created plan). Exception: cannot delete active plan; can edit active plan.
2. **Filter:** All / My / Public above plan list.
3. **Progress:** Top-right of each plan box (like TopAppBar).
4. **Public plans:** For public plans the user did not create, show greyed 🌐 icon instead of menu. No context menu.
5. **How it works:** Expandable section at top: "How it works +". Short copy; link to Create tab.
6. **Create Plan button:** At bottom of plan list; links to `/create`.

### Claude's Discretion

- Edit flow: "Edit" navigates to Create tab with plan pre-loaded for refinement, or opens edit modal — TBD by planner. Create tab already supports refine; likely `/create?edit=planId` or similar.

### Deferred Ideas (OUT OF SCOPE)

- Inline plan editing (modal or page) — use Create tab refine if no new edit API
- Changing plan metadata (name/description) via dedicated edit UI — defer if complex
- "Explore plans without switching" — already deferred from Phase 22

</user_constraints>

## Standard Stack

### Core

| Library                  | Version | Purpose               | Why Standard                                                                                                    |
| ------------------------ | ------- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| @headlessui/react        | 2.2.9   | Menu, Disclosure      | Already installed; project standard (Phase 25); Menu for context menu, Disclosure for expandable "How it works" |
| clsx                     | 2.1.1   | Conditional classes   | Already used in PlanSelectorSection                                                                             |
| Next.js Link / useRouter | 15.x    | Navigation to /create | Already used in PlansView                                                                                       |

### Supporting

| Library                    | Version | Purpose                | When to Use             |
| -------------------------- | ------- | ---------------------- | ----------------------- |
| navigator.clipboard        | Web API | Copy JSON to clipboard | Copy JSON menu item     |
| Blob + URL.createObjectURL | Web API | Download .json file    | Download plan menu item |

### Alternatives Considered

| Instead of             | Could Use       | Tradeoff                                                                               |
| ---------------------- | --------------- | -------------------------------------------------------------------------------------- |
| Headless UI Menu       | Custom dropdown | Menu handles focus, keyboard, accessibility; custom is error-prone                     |
| Headless UI Disclosure | Collapsible div | Disclosure provides aria-expanded, keyboard; simpler than custom                       |
| RadioGroup for filter  | Tabs            | RadioGroup matches SpeedMultiplierSelector pattern; Tabs imply separate content panels |

**Installation:** No new packages. @headlessui/react already installed.

**Version verification:** `@headlessui/react` 2.2.9 (verified 2025-03-21 via npm view).

## Architecture Patterns

### Recommended Project Structure (Implemented)

```
src/
├── components/settings/
│   ├── PlanCard.tsx             # Unified plan card: active + selectable variants; progress, creator, menu
│   ├── PlanContextMenu.tsx      # Extracted: Copy, Download, Edit, Delete menu
│   ├── PlanSelectorSection.tsx  # Other plans list; uses PlanCard; excludes active; empty state
│   ├── ActivePlanSection.tsx    # Uses PlanCard; readonly current plan; click → Training
│   └── ...
├── views/
│   └── PlansView.tsx            # How it works, Active Plan, filter, PlanSelectorSection, Create Plan button
```

**PlanCard unification (2025-03-21):** ActivePlanSection and PlanSelectorSection previously shared duplicate plan card UI. Both now use `PlanCard` with `variant="active"` or `variant="selectable"`. PlanCard handles progress, creator, name, description, context menu, and public icon.

### Pattern 1: Headless UI Menu (Context Menu)

**What:** Menu, MenuButton, MenuItems, MenuItem for dropdown actions.  
**When to use:** Replace trash button with "..." trigger; actions: Copy JSON, Download, Delete, Edit.  
**Example:**

```tsx
// Source: https://headlessui.com/react/menu
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';

<Menu>
  <MenuButton className="...">
    <span className="material-symbols-outlined">more_vert</span>
  </MenuButton>
  <MenuItems anchor="bottom end" className="...">
    <MenuItem>
      <button
        onClick={handleCopyJson}
        className="block w-full text-left data-focus:bg-surface-container-high"
      >
        Copy JSON
      </button>
    </MenuItem>
    <MenuItem>
      <button
        onClick={handleDownload}
        className="block w-full text-left data-focus:bg-surface-container-high"
      >
        Download plan
      </button>
    </MenuItem>
    <MenuItem disabled={isActive}>
      <button onClick={handleDelete} className="...">
        Delete
      </button>
    </MenuItem>
    <MenuItem>
      <button onClick={handleEdit} className="...">
        Edit
      </button>
    </MenuItem>
  </MenuItems>
</Menu>;
```

- Use `anchor="bottom end"` so menu aligns to right edge of button (plan box top-right).
- Use `data-focus:` for focus/hover styling (Tailwind v4).
- Wrap each action in `MenuItem`; use `disabled` for Delete when plan is active.

### Pattern 2: Headless UI Disclosure (Expandable Section)

**What:** Disclosure, DisclosureButton, DisclosurePanel for show/hide content.  
**When to use:** "How it works +" expandable section.  
**Example:**

```tsx
// Source: https://headlessui.com/react/disclosure
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';

<Disclosure as="div">
  <DisclosureButton className="flex items-center gap-2 text-on-surface-variant text-sm font-label">
    How it works
    <span className="material-symbols-outlined text-base data-open:rotate-180 transition-transform">
      expand_more
    </span>
  </DisclosureButton>
  <DisclosurePanel className="pt-2 text-on-surface-variant text-sm">
    Plans are a way to create training programs for breathhold. You can go to the{' '}
    <Link href="/create" className="text-primary underline">
      Create
    </Link>{' '}
    tab and create one by describing what you want.
  </DisclosurePanel>
</Disclosure>;
```

- Use `data-open` on DisclosureButton for chevron rotation.
- Keep copy short (1–2 sentences); link to Create tab.

### Pattern 3: Filter Toggle (RadioGroup)

**What:** RadioGroup with All / My / Public options.  
**When to use:** Filter above plan list.  
**Example:**

```tsx
// Source: COMPONENT-PATTERNS.md, SpeedMultiplierSelector
import { Radio, RadioGroup } from '@headlessui/react';

type PlanFilter = 'all' | 'my' | 'public';
<RadioGroup value={filter} onChange={setFilter} className="flex gap-2">
  <Radio
    value="all"
    className="px-4 py-2 rounded-xl data-checked:bg-primary data-[checked=false]:bg-surface-container-high"
  >
    All
  </Radio>
  <Radio value="my" className="...">
    My
  </Radio>
  <Radio value="public" className="...">
    Public
  </Radio>
</RadioGroup>;
```

- Filter logic: `all` → all plans; `my` → `created_by === currentUserId`; `public` → `public === true`.

### Pattern 4: Copy JSON

**What:** `navigator.clipboard.writeText(planToJson(plan))`.  
**When to use:** Copy JSON menu item.  
**Implemented:** `planToJson` outputs only `{ id, name, description, days }` (no server metadata like `created_by`, `creator_name`).  
**Example:**

```tsx
// Source: PlanContextMenu.tsx
const planToJson = (plan: PlanWithMeta): string =>
  JSON.stringify(
    { id: plan.id, name: plan.name, description: plan.description, days: plan.days },
    null,
    2
  );

await navigator.clipboard.writeText(planToJson(plan));
```

- Requires secure context (HTTPS) and user gesture. Returns Promise.

### Pattern 5: Download JSON File

**What:** Blob + createObjectURL + programmatic click.  
**When to use:** Download plan menu item.  
**Example:**

```tsx
// Source: MDN Blob, CONTEXT.md
function downloadPlan(plan: PlanWithMeta) {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.name.replace(/[^a-z0-9]/gi, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Anti-Patterns to Avoid

- **Wrapping Menu in conditional render:** Pass `open`-like state via Menu; do not `{showMenu && <Menu>}`.
- **Forgetting data-testid:** PlanSelectorSection, plan-selector-option, delete-plan-_ are used by E2E; add plan-menu-_, plan-menu-copy, etc. for new actions.
- **Stop propagation on plan row click:** Context menu button must `e.stopPropagation()` so clicking menu doesn't trigger plan selection.

## Don't Hand-Roll

| Problem            | Don't Build             | Use Instead                   | Why                                                   |
| ------------------ | ----------------------- | ----------------------------- | ----------------------------------------------------- |
| Dropdown menu      | Custom div + state      | Headless UI Menu              | Focus management, keyboard nav, accessibility         |
| Expandable section | Custom open/close state | Headless UI Disclosure        | aria-expanded, keyboard, consistent with project      |
| Filter toggle      | Custom button group     | Headless UI RadioGroup        | Matches SpeedMultiplierSelector; data-checked styling |
| Copy to clipboard  | document.execCommand    | navigator.clipboard.writeText | Async, modern, deprecated execCommand                 |
| File download      | Server endpoint         | Blob + createObjectURL        | Client-side; no server round-trip                     |

**Key insight:** Headless UI primitives are already the project standard. Reuse them; avoid custom dropdown/accordion implementations.

## Common Pitfalls

### Pitfall 1: Menu Opens on Plan Row Click

**What goes wrong:** Clicking the plan row opens both the plan selection and the menu (if menu button is inside row).  
**Why it happens:** Click event bubbles.  
**How to avoid:** Use `e.stopPropagation()` on MenuButton click and on MenuItem button clicks.  
**Warning signs:** Plan changes when user intended to open menu.

### Pitfall 2: Clipboard API Fails in Non-Secure Context

**What goes wrong:** `navigator.clipboard.writeText` throws in HTTP or iframe without user gesture.  
**Why it happens:** Clipboard API requires secure context and user activation.  
**How to avoid:** Call from user-triggered handler (menu item click). E2E runs in secure context.  
**Warning signs:** Copy fails silently in dev over HTTP (less common with Next.js).

### Pitfall 3: Download Filename Invalid Characters

**What goes wrong:** Plan name with slashes or special chars breaks `a.download`.  
**Why it happens:** Filename sanitization not applied.  
**How to avoid:** Replace invalid chars: `plan.name.replace(/[^a-z0-9\-_]/gi, '_')`.  
**Warning signs:** Download fails or filename is corrupted.

### Pitfall 4: Public vs User-Created Logic Confusion

**What goes wrong:** Showing menu for public plans user didn't create, or 🌐 for user-created plans.  
**Why it happens:** Two conditions: `isUserCreated` (created_by === currentUserId) vs "public plan not owned".  
**How to avoid:** Show menu only when `isUserCreated(p)`. Show 🌐 only when `p.public === true && !isUserCreated(p)`.  
**Warning signs:** Wrong icon/menu for edge cases (default plan, public user plan).

### Pitfall 5: Disclosure Chevron Not Rotating

**What goes wrong:** Chevron doesn't rotate when expanded.  
**Why it happens:** Tailwind v4 uses `data-open:` not `group-data-open:` for DisclosureButton.  
**How to avoid:** Use `data-open:rotate-180` on the icon inside DisclosureButton, or `group` on parent and `group-data-open:rotate-180` on icon.  
**Warning signs:** Static chevron.

## Code Examples

Verified patterns from official sources:

### Plan Box Layout with Progress Top-Right

```tsx
// Layout: progress at top-right like TopAppBar (CONTEXT.md)
<div className="relative flex items-start justify-between gap-3 px-4 py-3 ...">
  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
    <span className="font-body font-medium truncate">{p.name}</span>
    {/* description, creator - no progress here */}
  </div>
  <div className="flex items-center gap-2 shrink-0">
    {planProgress[p.id] && (
      <span data-testid={`plan-progress-${p.id}`} className="text-on-surface-variant text-sm">
        {planProgress[p.id].completed}/{planProgress[p.id].total} days
      </span>
    )}
    {isUserCreated(p) ? (
      <Menu>...</Menu>
    ) : p.public ? (
      <span
        className="material-symbols-outlined text-on-surface-variant/60"
        aria-label="Public plan"
      >
        public
      </span>
    ) : null}
  </div>
</div>
```

- Progress and menu/icon in same top-right block. Use `material-symbols-outlined` "public" for 🌐 (or "language" / "globe" if preferred).

### Edit Navigation

```tsx
// Edit: navigate to Create tab with plan (CONTEXT.md)
const handleEdit = () => {
  router.push(`/create?edit=${encodeURIComponent(plan.id)}`);
};
```

- CreatePlanView must read `edit` query param and load plan for refine. Out of scope for Phase 36 implementation details; planner decides.

## State of the Art

| Old Approach                 | Current Approach                             | When Changed   | Impact                        |
| ---------------------------- | -------------------------------------------- | -------------- | ----------------------------- |
| document.execCommand('copy') | navigator.clipboard.writeText                | 2018+          | Async, promise-based          |
| data-selected (v1)           | data-selected, data-checked, data-focus (v2) | Headless UI v2 | Same pattern, v2 uses data-\* |
| Custom dropdown              | Headless UI Menu                             | Phase 25       | Project standard              |

**Deprecated/outdated:**

- `document.execCommand`: Deprecated; use Clipboard API.

## Open Questions

1. **Edit flow implementation**
   - What we know: Create tab has refine; CONTEXT suggests `/create?edit=planId`.
   - What's unclear: CreatePlanView does not currently read `edit` query param; planner must add.
   - Recommendation: Add `useSearchParams()` in CreatePlanView; if `edit` present, fetch plan and pre-fill refine. Planner decides exact UX.

2. **Material icon for "public"**
   - What we know: Project uses `material-symbols-outlined` (e.g. delete, more_vert).
   - What's unclear: Exact icon name for 🌐 — "public", "language", or "globe"?
   - Recommendation: Use `public` or `language`; both exist in Material Symbols. "globe" may also exist.

## Validation Architecture

### Test Framework

| Property           | Value                                  |
| ------------------ | -------------------------------------- |
| Framework          | Vitest 4.x + Playwright 1.58           |
| Config file        | vitest.config.ts, playwright.config.ts |
| Quick run command  | `npm run test:run`                     |
| Full suite command | `npm run test:run && npm run test:e2e` |

### Phase Requirements → Test Map

| Req ID               | Behavior                                    | Test Type | Automated Command                                      | File Exists?                                        |
| -------------------- | ------------------------------------------- | --------- | ------------------------------------------------------ | --------------------------------------------------- |
| REQ-36-menu          | Context menu with Copy/Download/Delete/Edit | unit      | `npm run test:run -- PlanSelectorSection`              | ✅ PlanSelectorSection.test.tsx                     |
| REQ-36-filter        | All/My/Public filter                        | unit      | `npm run test:run -- PlansView` or PlanSelectorSection | ❌ Extend PlanSelectorSection or add PlansView test |
| REQ-36-progress      | Progress top-right of plan box              | unit      | `npm run test:run -- PlanSelectorSection`              | ✅                                                  |
| REQ-36-public        | Public plans show 🌐, no menu               | unit      | `npm run test:run -- PlanSelectorSection`              | ✅                                                  |
| REQ-36-how-it-works  | Expandable How it works                     | unit      | `npm run test:run -- PlansView` or HowItWorks          | ❌                                                  |
| REQ-36-create-btn    | Create Plan button links to /create         | e2e       | `npm run test:e2e`                                     | ❌ Extend e2e                                       |
| REQ-36-copy-download | Copy JSON, Download work                    | unit/e2e  | Mock clipboard; E2E can verify download                | ❌                                                  |

### Sampling Rate

- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `PlanSelectorSection.test.tsx` — extend for context menu, filter (if in section), public icon, progress layout
- [ ] `PlansView.test.tsx` or `PlansHowItWorks.test.tsx` — How it works expandable, Create Plan button (if not covered by E2E)
- [ ] E2E — plan-change.spec.ts or new plans-tab.spec.ts for filter, Create Plan link, context menu actions
- [ ] Clipboard mock in unit tests for Copy JSON

## Sources

### Primary (HIGH confidence)

- https://headlessui.com/react/menu — Menu, MenuButton, MenuItems, MenuItem API
- https://headlessui.com/react/disclosure — Disclosure, DisclosureButton, DisclosurePanel
- CONTEXT.md — Copy/download patterns, permission rules, layout
- COMPONENT-PATTERNS.md — Dialog, Listbox, RadioGroup, data-testid

### Secondary (MEDIUM confidence)

- MDN Clipboard API — writeText
- MDN Blob, URL.createObjectURL — download pattern
- SpeedMultiplierSelector.tsx — RadioGroup filter pattern

### Tertiary (LOW confidence)

- WebSearch — Clipboard/Blob patterns (verified with MDN)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — @headlessui/react already project standard; Menu and Disclosure documented
- Architecture: HIGH — COMPONENT-PATTERNS and CONTEXT provide clear patterns
- Pitfalls: HIGH — Common issues documented; copy/download are well-known

**Research date:** 2025-03-21  
**Valid until:** 30 days (stable stack)
