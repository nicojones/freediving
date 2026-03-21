# Phase 28: Create Plan Tab + Multi-Modal Create/Refine + Preview Feedback — Executable Plan

---

phase: 28-create-plan-tab-multimodal
plans:

- id: "01"
  tasks: 3
  depends_on: [27-refactor-create-plan]
  type: execute
  wave: 1
  autonomous: false
  requirements: [CPT-01]
  must_haves:
  truths: - "CreatePlanSection lives in its own bottom tab (+); route /create" - "BottomNavBar has four tabs: Training, Plans, Create (+), Settings" - "PlansView no longer contains CreatePlanSection"

- id: "02"
  tasks: 2
  depends_on: [01]
  type: execute
  wave: 2
  autonomous: false
  requirements: [CPT-02]
  must_haves:
  truths: - "Create: voice OR text; Refine: voice OR text; mix and match" - "CreatePlanDraftPreview has AIVoicePlanInput for refine; handleVoiceRefineResult in useCreatePlanHandlers"

- id: "03"
  tasks: 2
  depends_on: [02]
  type: execute
  wave: 3
  autonomous: false
  requirements: [CPT-03, CPT-04]
  must_haves:
  truths: - "Preview button visible when draftPlan set (create or refine, text or voice)" - "After refinement: attention brought to Preview (pulse, toast, or label change)" - "E2E create-plan updated for Create tab; all tests pass"

---

## Objective

Move CreatePlanSection to its own bottom tab (+); allow create and refine via voice and/or text (mix and match); improve Preview feedback so users clearly see when the preview was updated after refinement.

**Principles:**

- Create Plan as cornerstone: own tab, prominent placement
- Multi-modal: create and refine support both voice and text; user can mix (e.g. create by voice → refine with text)
- Preview visibility: button appears when draftPlan is set (already true; ensure after any create/refine)
- Preview feedback: after refinement, bring attention to Preview (mechanism TBD — pulse, toast, label change, or auto-open)

**Post-execution refinements (TBD):**

- Tab order: Training | Plans | **+** (Create) | Settings
- Icon: "add" or "add_circle" (Material Symbols)
- Preview feedback mechanism: brief pulse on Preview button when draftPlan updates after refine

---

## Context

- **28-CONTEXT.md:** Full decisions (Create Plan tab, multi-modal create/refine, Preview feedback).
- **BottomNavBar:** `src/components/layout/BottomNavBar.tsx` — three tabs; add fourth for Create.
- **CreatePlanSection:** `src/components/settings/CreatePlanSection.tsx` — used in PlansView; will move to CreateView.
- **CreatePlanDescribeInput:** Create flow — textarea + AIVoicePlanInput (voice). ✓ Voice for create.
- **CreatePlanDraftPreview:** Refine flow — refine textarea + Refine + Confirm. ✗ No voice for refine.
- **useCreatePlanHandlers:** handleCreateDraft (text), handleRefine (text), handleVoiceResult (voice → draftPlan). Need handleVoiceRefineResult.
- **Routing:** `/`, `/plans`, `/settings`. Add `/create`.
- **AIVoicePlanInput:** Uses `/api/plans/transcribe` (audio). Refine needs `/api/plans/transcribe` with contextPlan — transcribe endpoint is audio-only; refine is text+context. For voice refine: transcribe audio → get text → send to transcribe-from-text with contextPlan. Or: extend transcribe to accept contextPlan for refine mode. Research: transcribe-from-text already has contextPlan. Voice returns audio → transcribe → JSON. For refine: we need audio → transcribe → text → transcribe-from-text with contextPlan. Simpler: transcribe returns PlanWithMeta; for refine we need "modify this plan per user speech". Option A: Add optional contextPlan to /api/plans/transcribe; when present, use refine prompt. Option B: transcribe returns text, client sends to transcribe-from-text. Transcribe currently returns PlanWithMeta (full plan). For refine: user speaks "make it 2:30" → we need to send audio to something that returns modified plan. Transcribe endpoint: audio → Gemini → PlanWithMeta. We can extend: if contextPlan provided (as JSON in form?), use refine prompt. Check transcribe route.
- **Preview feedback:** 28-CONTEXT lists: pulse, toast, label change, auto-open, scroll/focus. Pick one for MVP: brief pulse on Preview button when draftPlan updates after refine.

---

## Plan 01: Create Plan Tab + Route + BottomNavBar

### Task 1: Add Create Route and CreateView

**Files:** `app/create/page.tsx` (new), `src/views/CreatePlanView.tsx` (new)

**Action:**

1. Create `app/create/page.tsx`:
   ```tsx
   import { CreatePlanView } from '@/src/views/CreatePlanView';
   export default function CreatePage() {
     return <CreatePlanView />;
   }
   ```
2. Create `CreatePlanView.tsx`: TopAppBar (variant="dashboard", weekLabel="Create plan" or "Create"); main content with CreatePlanSection; BottomNavBar with activeTab="create"; onPlanCreated can refresh plans (optional — user may need to switch to Plans to see new plan; or we navigate to Plans after create).
3. CreatePlanView receives `onPlanCreated?: () => void`. For now, pass nothing or a no-op; PlansView's refresh happens when user navigates to Plans. Alternatively: useTraining().refreshAvailablePlans and pass it so new plan appears in selector when user goes to Plans.
4. Add `data-testid="create-plan-view"` to CreatePlanView container for E2E.

**Done:** Route `/create` renders CreatePlanView with CreatePlanSection.

---

### Task 2: Add Fourth Tab to BottomNavBar

**Files:** `src/components/layout/BottomNavBar.tsx`, all views that use BottomNavBar

**Action:**

1. Extend BottomNavBar props: `activeTab: 'training' | 'plans' | 'create' | 'settings'`, `onCreateClick?: () => void`.
2. Add fourth button between Plans and Settings: icon "add" or "add_circle", label "Create" (or "+").
3. Tab order: Training | Plans | Create | Settings.
4. Add `data-testid="nav-create"` for E2E.
5. Update Dashboard, PlansView, SettingsView, SessionCompleteView, CreatePlanView: pass `onCreateClick={() => router.push('/create')}` and `activeTab` as appropriate.

**Done:** BottomNavBar shows four tabs; Create navigates to /create.

---

### Task 3: Remove CreatePlanSection from PlansView

**Files:** `src/views/PlansView.tsx`

**Action:**

1. Remove CreatePlanSection import and usage from PlansView.
2. PlansView: PlanSelectorSection, PlanDeleteSection only. Update copy if needed (e.g. "Choose your plan or create a new one" → "Choose your plan" with link/hint to Create tab, or keep "create a new one" as users will use Create tab).
3. Update BottomNavBar in PlansView: add onCreateClick, activeTab="plans".
4. Ensure E2E that used Plans → CreatePlanSection now goes to Create tab instead.

**Done:** PlansView no longer contains CreatePlanSection; Create lives in its own tab.

---

## Plan 02: Multi-Modal Refine (Voice + Text)

### Task 4: Add Voice Input to CreatePlanDraftPreview (Refine)

**Files:** `src/components/settings/create-plan/CreatePlanDraftPreview.tsx`, `src/components/settings/create-plan/useCreatePlanHandlers.ts`

**Action:**

1. **Refine voice flow:** User can refine via text (existing) or voice. For voice refine: AIVoicePlanInput sends audio → /api/plans/transcribe. Transcribe returns PlanWithMeta. For refine we need contextPlan. Check: /api/plans/transcribe is audio-only; returns full plan. To support "refine by voice": we need either (a) extend transcribe to accept contextPlan and use refine prompt when present, or (b) transcribe returns text, client sends to transcribe-from-text with contextPlan. Current transcribe returns PlanWithMeta (structured). For refine-by-voice: user says "make the holds 2:30" → we need modified plan. Simplest: extend transcribe to accept optional `contextPlan` in form (e.g. `contextPlan` as JSON string in FormData). When present, use refine prompt. Implement in Task 4.
2. Add `handleVoiceRefineResult(json: string)` to useCreatePlanHandlers: parse, validate, setDraftPlan, clear refineText, setError(null). Same as handleVoiceResult but for refine path.
3. Extend CreatePlanDraftPreview props: `onVoiceRefineResult`, `recording`, `onRecordingChange`, `isRefining` (already have). Add AIVoicePlanInput to CreatePlanDraftPreview: layout similar to CreatePlanDescribeInput — "or" divider, then AIVoicePlanInput. When voice returns, call onVoiceRefineResult.
4. **API:** Extend POST /api/plans/transcribe to accept optional FormData field `contextPlan` (JSON string). When present, use refine prompt (same as transcribe-from-text with contextPlan). Return modified PlanWithMeta. Client: AIVoicePlanInput needs to send contextPlan when in refine mode. Add prop `contextPlan?: PlanWithMeta` to AIVoicePlanInput; when provided, include in FormData. On result, call onResult with JSON. (AIVoicePlanInput currently calls /api/plans/transcribe with audio only.)
5. Wire CreatePlanDescribeTab → CreatePlanDraftPreview: pass onVoiceRefineResult={handlers.handleVoiceRefineResult}, recording, onRecordingChange, and ensure handlers exports handleVoiceRefineResult.

**Done:** User can refine via voice (Explain button in refine section) or text; mix and match with create (voice or text).

---

### Task 5: Ensure Preview Button Visibility After Create/Refine (Text or Voice)

**Files:** `src/components/settings/create-plan/CreatePlanDraftPreview.tsx`, `src/components/settings/create-plan/useCreatePlanHandlers.ts`

**Action:**

1. Preview button already appears when draftPlan is set. Verify: after handleCreateDraft (text), handleVoiceResult (voice create), handleRefine (text), handleVoiceRefineResult (voice refine) — draftPlan is set, so Preview is visible. No code change needed if flow is correct.
2. Document: "Preview button appears when user types/submits or audio is sent/re-sent" — already satisfied when draftPlan is set after any of those actions.

**Done:** Preview visibility confirmed; no regression.

---

## Plan 03: Preview Feedback + E2E

### Task 6: Implement Preview Feedback After Refinement

**Files:** `src/components/settings/create-plan/CreatePlanDraftPreview.tsx`, `src/components/settings/create-plan/useCreatePlanHandlers.ts`

**Action:**

1. **Mechanism:** When draftPlan updates after refine (handleRefine or handleVoiceRefineResult), bring attention to Preview. Options: (a) brief pulse animation on Preview button, (b) toast "Preview updated", (c) button label "Preview updated" for 2–3 seconds, (d) auto-open Preview modal. Pick (a) pulse for MVP — minimal, non-intrusive.
2. Add state `previewJustUpdated: boolean` in useCreatePlanHandlers. Set true when handleRefine or handleVoiceRefineResult succeeds; clear after 2 seconds (setTimeout).
3. Pass `previewJustUpdated` to CreatePlanDraftPreview. On Preview button: when previewJustUpdated, add CSS class for pulse animation (e.g. `animate-pulse` or custom `@keyframes` ring/pulse). Clear previewJustUpdated when user clicks Preview (onOpenPreview) or after timeout.
4. Alternative: use `data-preview-updated` attribute and CSS `[data-preview-updated]` selector for animation. Simpler: add `className={clsx(previewJustUpdated && 'animate-pulse')}` to Preview button. Tailwind `animate-pulse` may be too subtle; consider `ring-2 ring-primary` or custom animation.
5. Recommendation: `previewJustUpdated` → add `ring-2 ring-primary ring-offset-2` or `animate-[pulse_1s_ease-in-out_2]` for 2 pulses. Or: `animate-pulse` for 2s then clear.

**Done:** After refinement, Preview button pulses briefly; user clearly sees preview was updated.

---

### Task 7: Update E2E Tests for Create Tab

**Files:** `e2e/create-plan.spec.ts`, `e2e/plan-change.spec.ts` (if it navigates to Plans)

**Action:**

1. **goToPlansAndCreatePlanSection:** Rename to `goToCreatePlanSection`. Navigate to Create tab: `page.getByRole('button', { name: /create/i }).click()` or `page.getByTestId('nav-create').click()`, then `page.waitForURL(/\/create/)`. Ensure create-plan-tab-describe is visible.
2. **Paste tab tests:** After goToCreatePlanSection, switch to Paste tab. Paste tab content is in CreatePlanView now.
3. **Describe flow:** Same as before; CreatePlanSection is in CreatePlanView. Mock transcribe-from-text; fill describe textarea; Create draft; Preview; Refine; Confirm.
4. **Plan selector:** After creating a plan, user may need to go to Plans to select it. E2E verifyPlanCreation uses plan-selector — that's in PlansView. So: Create plan in Create tab → success → navigate to Plans → select new plan → confirm reset → Training. Update flow: goToCreatePlanSection → create plan → success → click nav-plans → wait for /plans → plan-selector → select → confirm → nav-training → verify.
5. Run `npm run test:e2e -- create-plan`; all tests pass.

**Done:** E2E create-plan tests use Create tab; all pass.

---

## Success Criteria

1. **Create Plan tab** — ✓ CreatePlanSection in own tab (+); route /create; BottomNavBar has four tabs
2. **Multi-modal** — ✓ Create via voice OR text; Refine via voice OR text; mix and match
3. **Preview visibility** — ✓ Preview button appears when draftPlan set (create or refine, text or voice)
4. **Preview feedback** — ✓ After refinement, attention brought to Preview (pulse or equivalent)
5. **E2E** — ✓ create-plan tests pass; use Create tab

---

## How to Test

1. **Build:** `npm run build` — succeeds
2. **Lint:** `npm run lint` — no errors
3. **E2E:** `npm run test:e2e -- create-plan` — paste, upload, type, describe→confirm all pass
4. **Manual Create tab:** Click Create in nav → CreatePlanView with Describe/Paste tabs
5. **Manual multi-modal:** Create by voice → Preview → Refine with text → Refine with voice → Preview pulses → Confirm
6. **Manual Preview feedback:** Describe → Create draft → Refine with "add a day" → Preview button pulses

---

## Verification

- [x] Create tab visible in BottomNavBar; navigates to /create
- [x] CreatePlanView shows CreatePlanSection; PlansView does not
- [x] Create: voice and text both work
- [x] Refine: voice and text both work; mix and match
- [x] Preview button visible when draftPlan set
- [x] After refine: Preview button pulses (or equivalent feedback)
- [x] E2E create-plan: all tests pass

---

## API Extension (Task 4)

**File:** `app/api/plans/transcribe/route.ts`

**Action:** Accept optional FormData field `contextPlan` (string, JSON). When present, validate as PlanWithMeta, use refine prompt (same logic as transcribe-from-text with contextPlan), return modified plan. When absent, use create prompt (current behavior).

**Client:** AIVoicePlanInput accepts optional `contextPlan?: PlanWithMeta`. When provided, append to FormData as `contextPlan: JSON.stringify(contextPlan)`. Used only in refine mode.
