# Phase 27: Refactor CreatePlanSection — Context

**Phase:** 27
**Focus:** Reduce CreatePlanSection component size following Phase 11 refactoring rules.

## Background

- **Phase 11 rules:** clsx correctness; components <150 lines; extract sub-components for clarity and testability.
- **CreatePlanSection** (`src/components/settings/CreatePlanSection.tsx`): ~592 lines; two tabs (Describe, Paste/Raw); draft flow with Preview, Refine, Confirm; error/success banners.
- **Future:** Will migrate to its own page; extracted components should be page-ready.

## Target Component

`src/components/settings/CreatePlanSection.tsx` — used in PlansView; will become a standalone page.

## Refactoring Rules (Phase 11)

1. **clsx:** All conditional classNames use clsx; no string concatenation or template literals.
2. **Size:** Components <150 lines; split when larger.
3. **Extract:** Small UI blocks → named sub-components for clarity and testability.
4. **Tooling:** ESLint passes; Prettier formatting.

## Identified Extractions

| Block                         | Lines (approx) | New Component          |
| ----------------------------- | -------------- | ---------------------- |
| Describe tab content          | ~130           | CreatePlanDescribeTab  |
| Paste tab content             | ~100           | CreatePlanPasteTab     |
| Error + success banners       | ~20            | CreatePlanStatusBanner |
| Shared button/textarea styles | —              | create-plan/styles.ts  |

## Constraints

- Preserve all `data-testid` attributes for E2E.
- No user-facing behavior change.
- E2E create-plan tests must pass.
