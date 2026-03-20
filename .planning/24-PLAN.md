# Phase 24: AI Plan Input Enhancements — Executable Plan

---

phase: 24-ai-plan-input-enhancements
plans:

- id: "01"
  tasks: 7
  depends_on: [23-prettier-lefthook-ci]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths:
  - "Plan types in plan.ts defined with Zod; types inferred from schemas; single source of truth"
  - "Zod validation decides JSON vs AI path: valid Plan JSON → /api/plans; otherwise → transcribe-from-text"
  - "Create-plan accepts free-form text; if not valid PlanWithMeta JSON, send to LLM; returns PlanWithMeta"
  - "Text path uses prompt variant 'Given the text...'; audio path uses 'Convert this audio...'"
  - "responseJsonSchema passed to Gemini for structured output"

---

## Objective

(1) Build the transcribe/plan prompt dynamically from `planSchema.ts` so schema changes propagate automatically; (2) allow users to paste or type free-form text — if parseable as PlanWithMeta JSON, validate as now; otherwise send text to LLM with a text-specific prompt; (3) keep plan creation inline in PlansView (dedicated screen optional, deferred).

**Principles:**

- Zod schemas as single source of truth; types inferred from schemas (`z.infer`)
- Define schemas in `src/types/plan.ts` using Zod; infer Phase, TrainingDay, RestDay, PlanWithMeta from them
- Two endpoints: audio-based and text-based (cleaner separation)
- Validation via Zod: if JSON parses and validates against Plan schema → valid, POST to /api/plans; otherwise → treat as AI prompt, POST to transcribe-from-text

---

## Context

- Phase 19 already has: AI voice mode, transcribe route, CreatePlanSection; Zod schemas in planSchema.ts, types in plan.ts
- Current transcribe route: hardcoded PROMPT; only accepts FormData; uses responseMimeType only
- Zod 4.3.6 in project; `z.toJSONSchema()` exists
- CreatePlanSection: textarea, upload, paste, AI voice; Create button validates JSON and POSTs to /api/plans

---

## Plan 01: Dynamic Prompt + Text Path + Schema-Driven Output

### Task 1: Define Schemas in plan.ts with Zod; Infer Types

**Files:** `src/types/plan.ts`, `src/schemas/planSchema.ts`

**Action:**

1. Replace TypeScript interfaces in `plan.ts` with Zod schemas. Define `phaseSchema`, `trainingDaySchema`, `restDaySchema`, `planDaySchema`, `planWithMetaSchema` in plan.ts.
2. Infer types: `export type Phase = z.infer<typeof phaseSchema>`, etc. Export `PlanWithMeta` as `z.infer<typeof planWithMetaSchema>`.
3. Add `.describe()` to schema fields for LLM guidance.
4. Update `planSchema.ts` to import schemas from plan.ts and re-export `validatePlanWithMeta` (or move validation into plan.ts). Ensure `validatePlanWithMeta` uses the schema and returns typed data.
5. Update all imports: types from plan.ts; validation from planSchema (or plan.ts).

**Done:** plan.ts is schema-first; types inferred from Zod; single source of truth.

---

### Task 2: Audio Endpoint — Dynamic Schema

**Files:** `app/api/plans/transcribe/route.ts`

**Action:**

1. Import `planWithMetaSchema` from plan.ts (or planSchema); use `z.toJSONSchema(planWithMetaSchema)` for schema.
2. Add `config.responseJsonSchema` alongside `responseMimeType`. Remove hardcoded schema from prompt text.
3. Keep AUDIO_PROMPT ("Convert this audio..."); same safety instructions and "Return ONLY valid JSON".
4. Validate response with `validatePlanWithMeta` (Zod).

**Done:** Audio transcribe route uses dynamic schema; responseJsonSchema; Zod validation.

---

### Task 2b: Text Endpoint — New Route

**Files:** `app/api/plans/transcribe-from-text/route.ts` (or `parse-text`)

**Action:**

1. New POST route accepting `application/json` with `{ text: string }`.
2. TEXT_PROMPT ("Given the following text describing a freediving training plan..."); same safety instructions.
3. Use same `z.toJSONSchema(planWithMetaSchema)` and `responseJsonSchema`.
4. Same validation: `validatePlanWithMeta` (Zod).
5. Shared logic (prompt template, schema, validation) can be extracted to a helper if desired.

**Done:** Text endpoint returns PlanWithMeta from free-form text.

---

### Task 3: CreatePlanSection — Zod Validation to Decide JSON vs AI Path

**Files:** `src/components/settings/CreatePlanSection.tsx`

**Action:**

1. Before sending: try `JSON.parse(val)`. If parse throws → treat as AI prompt, POST to transcribe-from-text.
2. If parse succeeds: validate with `validatePlanWithMeta(parsed)`. If valid → POST to /api/plans as now.
3. If parse succeeds but validation fails → treat as AI prompt, POST `{ text: jsonText }` to transcribe-from-text (invalid JSON structure is still natural language for the LLM).
4. Single "Create plan" button with smart detection.
5. Ensure loading state during text-endpoint call; show error if it fails.

**Done:** Create-plan uses Zod validation to decide: valid Plan JSON → POST to /api/plans; otherwise → treat as AI prompt (transcribe-from-text).

---

### Task 4: Update Placeholder and Copy

**Files:** `src/components/settings/CreatePlanSection.tsx`

**Action:**

1. Update placeholder text: "Paste JSON or describe your plan in text (e.g. \"3 days of holds, 2 min each, 2 min recovery\")."
2. Update section description: "Upload a JSON file, paste PlanWithMeta JSON, describe your plan in text, or use AI voice."

**Done:** Copy reflects text + JSON + voice options.

---

### Task 5: Unit Tests

**Files:** `app/api/plans/transcribe/route.test.ts` (new), `app/api/plans/transcribe-from-text/route.test.ts` (new), `src/types/plan.test.ts` (if not present)

**Action:**

1. Create transcribe route unit test: mock Gemini; test audio path (FormData) returns valid PlanWithMeta.
2. Create transcribe-from-text route unit test: mock Gemini; test text path returns valid PlanWithMeta; test rejects empty text.
3. If plan.test.ts exists: add test that `z.toJSONSchema(planWithMetaSchema)` produces valid JSON Schema. If not present: create minimal test file for schema types.

**Done:** Unit tests cover transcribe + schema export.

---

### Task 6: E2E Test for Text Path

**Files:** `e2e/create-plan.spec.ts`

**Action:**

1. Add test: paste free-form text (e.g. "3 days of holds, 2 min each, 2 min recovery"); click Create; verify textarea shows plan JSON (from transcribe-from-text); user clicks Create; plan created. Note: Requires GEMINI_API_KEY or mock; consider skipping if no key in CI.
2. Or: add test that non-JSON text triggers transcribe call (mock fetch if needed).

**Done:** E2E covers text-to-plan flow (or skip if no API key in CI).

---

## Success Criteria

1. **Dynamic prompt** — ✓ Transcribe uses `z.toJSONSchema(planWithMetaSchema)` and `responseJsonSchema`; no hardcoded schema in prompt
2. **Text path** — ✓ POST `{ text }` to transcribe-from-text returns PlanWithMeta; CreatePlanSection uses Zod validation to decide: valid Plan JSON → /api/plans; otherwise → AI prompt
3. **Prompt variants** — ✓ Audio: "Convert this audio..."; Text: "Given the following text..."
4. **No schema drift** — ✓ Changes to plan.ts schemas propagate to types, validation, and LLM without manual edits
5. **Tests** — ✓ Unit tests for both endpoints; E2E for text path (or skip if no key)

---

## How to Test

1. **JSON path:** Paste valid PlanWithMeta JSON → Create → plan created (unchanged)
2. **Text path:** Paste "3 days of holds, 2 min each, 2 min recovery" → Create → textarea auto-fills with plan → Create → plan created
3. **Voice path:** Record AI voice → same as before (unchanged)
4. **Schema change:** Add a field to plan.ts schema with .describe() → transcribe route should still work; no manual prompt edit
5. `npm run test:run` — pass
6. `npx playwright test e2e/create-plan.spec.ts` — pass (or skip text path if no GEMINI_API_KEY)

---

## Optional (Deferred)

- Dedicated plan creation screen (`/plans/create`): Keep in backlog; implement if user feedback warrants it.
