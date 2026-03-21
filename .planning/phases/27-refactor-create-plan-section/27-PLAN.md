# Phase 27: Refactor CreatePlanSection (Component Size) — Executable Plan

---

phase: 27-refactor-create-plan
plans:

- id: "01"
  tasks: 4
  depends_on: [26-plan-creation-ux]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths: - "clsx used correctly for all conditional classNames in CreatePlanSection and extracted components" - "CreatePlanSection and all sub-components under ~150 lines" - "CreatePlanDescribeTab, CreatePlanPasteTab, CreatePlanStatusBanner extracted" - "ESLint passes; Prettier formatting applied" - "No user-facing behavior change; E2E create-plan tests pass"

---

## Objective

Reduce CreatePlanSection component size following Phase 11 refactoring rules. Prepare for eventual migration to its own page.

**Principles (from Phase 11):**

- clsx for all conditional classNames; no string concatenation or template literals.
- Components under ~150 lines; split when larger.
- Extract small UI blocks to named sub-components for clarity and testability.

**Scope:** `src/components/settings/CreatePlanSection.tsx` (~592 lines). Target: main component <150 lines; extracted sub-components each <150 lines.

---

## Context

- **Phase 11 rules:** clsx correctness; small components; extract sub-components.
- **CreatePlanSection:** Two tabs (Describe, Paste/Raw); draft flow; error/success banners; modals.
- **Current issues:** Line 503 uses template literal `\`${btnBase} disabled:...\`` instead of clsx; component ~592 lines; repeated button/textarea styles; inline error/success blocks.
- **Future:** Will migrate to its own page; extracted components should be page-ready.

---

## Plan 01: Refactor CreatePlanSection

### Task 1: clsx Correctness + Shared Style Constants

**Files:** `src/components/settings/CreatePlanSection.tsx`, `src/components/settings/create-plan/styles.ts` (new)

**Action:**

1. Create `src/components/settings/create-plan/styles.ts`:

   ```ts
   /** Shared button base for create-plan actions */
   export const CREATE_PLAN_BTN_BASE =
     'h-12 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low hover:border-outline font-headline font-bold text-on-surface text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]';

   /** Primary action button (Create draft, Confirm, Create plan) */
   export const CREATE_PLAN_BTN_PRIMARY =
     'h-12 rounded-xl border-2 border-primary bg-primary/20 hover:bg-primary/30 font-headline font-bold text-primary text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

   /** Secondary/outline button */
   export const CREATE_PLAN_BTN_SECONDARY =
     'h-12 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 hover:bg-surface-container-low font-headline font-bold text-on-surface text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

   /** Textarea base */
   export const CREATE_PLAN_TEXTAREA =
     'w-full px-4 py-3 rounded-xl border-2 border-outline-variant/60 bg-surface-container-low/50 text-on-surface font-body text-sm resize-y focus:border-primary focus:outline-none placeholder:text-on-surface-variant/50';
   ```

2. In CreatePlanSection: Replace `btnBase` with imports from styles.ts.
3. Fix line 503: Replace `className={\`${btnBase} disabled:opacity-50 disabled:cursor-not-allowed\`}`with`clsx(CREATE_PLAN_BTN_BASE, 'disabled:opacity-50 disabled:cursor-not-allowed')`.
4. Audit all `className=` in CreatePlanSection: ensure any conditional classes use clsx (no template literals with conditionals).

**Verify:** `npm run build`; `npm run lint`; no clsx violations.

**Done:** clsx correctness; shared constants in create-plan/styles.ts.

---

### Task 2: Extract CreatePlanDescribeTab

**Files:** `src/components/settings/CreatePlanSection.tsx`, `src/components/settings/create-plan/CreatePlanDescribeTab.tsx` (new)

**Action:**

1. Create `CreatePlanDescribeTab.tsx` with props:
   - `describeText`, `setDescribeText`, `draftPlan`, `refineText`, `setRefineText`
   - `isCreatingDraft`, `isRefining`, `loading`, `recording`
   - `onCreateDraft`, `onRefine`, `onResetDraft`, `onOpenPreview`, `onOpenConfirm`
   - `onRecordingChange`
2. Move Describe tab content (TabPanel body) into CreatePlanDescribeTab:
   - Draft state: Preview button, Start over, refine textarea, Refine + Confirm buttons
   - Input state: describe textarea, Create draft button, "or" divider, AIVoicePlanInput
3. Import styles from create-plan/styles.ts.
4. Preserve all data-testid attributes.
5. In CreatePlanSection: render `<CreatePlanDescribeTab ... />` inside first TabPanel.

**Verify:** `npm run build`; manual Describe flow; E2E create-plan (Describe path).

**Done:** CreatePlanDescribeTab extracted; CreatePlanSection reduced.

---

### Task 3: Extract CreatePlanPasteTab + CreatePlanStatusBanner

**Files:** `src/components/settings/CreatePlanSection.tsx`, `src/components/settings/create-plan/CreatePlanPasteTab.tsx` (new), `src/components/settings/create-plan/CreatePlanStatusBanner.tsx` (new)

**Action:**

1. Create `CreatePlanStatusBanner.tsx`:
   ```tsx
   interface CreatePlanStatusBannerProps {
     error?: string | null;
     success?: boolean;
   }
   export function CreatePlanStatusBanner({ error, success }: CreatePlanStatusBannerProps) {
     if (error) {
       return (
         <div
           className="mt-3 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body"
           data-testid="create-plan-error"
         >
           {error}
         </div>
       );
     }
     if (success) {
       return (
         <div
           className="mt-3 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-body"
           data-testid="create-plan-success"
         >
           Plan created successfully. It should appear in the plan selector above.
         </div>
       );
     }
     return null;
   }
   ```
2. Create `CreatePlanPasteTab.tsx` with props:
   - `jsonText`, `setJsonText`, `loading`, `fileInputRef`
   - `onFileSelect`, `onPaste`, `onClear`, `onCreate`
3. Move Paste tab content into CreatePlanPasteTab: file input, Upload/Paste/Clear buttons, textarea, Create plan button.
4. In CreatePlanSection: replace inline error/success blocks with `<CreatePlanStatusBanner error={error} success={success} />`.
5. In CreatePlanSection: render `<CreatePlanPasteTab ... />` inside second TabPanel.
6. Preserve all data-testid attributes.

**Verify:** `npm run build`; manual Paste flow; E2E create-plan (Paste path).

**Done:** CreatePlanPasteTab and CreatePlanStatusBanner extracted.

---

### Task 4: Size Audit + ESLint + Formatting

**Files:** All modified files in Phase 27

**Action:**

1. Run `wc -l src/components/settings/CreatePlanSection.tsx src/components/settings/create-plan/*.tsx`.
2. **Target:** CreatePlanSection <150 lines; each extracted component <150 lines. If CreatePlanSection still >150, extract handlers to a custom hook (e.g. `useCreatePlanHandlers`) to move logic out.
3. Run `npm run lint`; fix any ESLint issues.
4. Run `npm run format` (or `npx prettier --write`); ensure consistent formatting.
5. Run `npm run test:e2e -- create-plan`; all tests pass.

**Verify:**

```bash
npm run build
npm run lint
npm run format
npm run test:e2e -- create-plan
wc -l src/components/settings/CreatePlanSection.tsx src/components/settings/create-plan/*.tsx
```

**Done:** Size compliance; lint clean; formatted; E2E pass.

---

## Success Criteria

1. **clsx correctness** — ✓ All conditional classNames use clsx; no template literals
2. **Component size** — ✓ CreatePlanSection and sub-components <150 lines each
3. **Sub-components** — ✓ CreatePlanDescribeTab, CreatePlanPasteTab, CreatePlanStatusBanner; styles in create-plan/styles.ts
4. **ESLint** — ✓ `npm run lint` passes
5. **Formatting** — ✓ Prettier applied
6. **No behavior change** — ✓ E2E create-plan tests pass

---

## How to Test

1. **Build:** `npm run build` — succeeds
2. **Lint:** `npm run lint` — no errors
3. **E2E:** `npm run test:e2e -- create-plan` — paste, upload, type, describe→confirm all pass
4. **Manual Describe:** Plans → Describe tab → type → Create draft → Preview → Refine → Confirm → success
5. **Manual Paste:** Plans → Paste tab → paste/upload JSON → Create plan → success

---

## Output

- `src/components/settings/create-plan/styles.ts` — shared button/textarea constants
- `src/components/settings/create-plan/CreatePlanDescribeTab.tsx` — Describe tab content
- `src/components/settings/create-plan/CreatePlanPasteTab.tsx` — Paste tab content
- `src/components/settings/create-plan/CreatePlanStatusBanner.tsx` — error/success banners
- `src/components/settings/CreatePlanSection.tsx` — orchestration only; <150 lines
