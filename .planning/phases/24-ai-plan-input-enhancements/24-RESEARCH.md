# Phase 24: AI Plan Input Enhancements — Research

**Researched:** 2025-03-20
**Domain:** Dynamic prompt generation from schema, text-to-plan LLM flow, plan creation UX
**Confidence:** HIGH

## Summary

Phase 24 enhances AI plan creation in three areas: (1) **Dynamic prompt from plan types** — derive the transcribe/parse prompt and JSON schema from `planSchema.ts` so schema changes propagate automatically; (2) **Text/description-to-plan** — accept free-form text in addition to JSON; if parseable as JSON, validate as now; otherwise send to LLM with a text-specific prompt; (3) **Optional dedicated plan creation screen** — UX research suggests dedicated screens improve focus for moderate-to-large forms; current inline CreatePlanSection in PlansView is acceptable; a full-screen route is optional and can be deferred.

**Primary recommendation:** Define Zod schemas in `src/types/plan.ts`; infer types with `z.infer`; add `.describe()` for LLM guidance; **two endpoints** — audio (`/api/plans/transcribe`) and text (`/api/plans/transcribe-from-text`); pass `responseJsonSchema` (from `z.toJSONSchema`) to Gemini; **Zod validation** to decide path: if JSON parses and validates against Plan schema → POST to /api/plans; otherwise → treat as AI prompt, POST to transcribe-from-text; keep CreatePlanSection inline unless user feedback warrants a dedicated screen.

---

## Phase Requirements

| ID                        | Description                                                                                                   | Research Support                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Dynamic prompt            | Transcribe API prompt derived from plan types; format changes in plan.ts do not require manual prompt updates | Zod `z.toJSONSchema()` + `.describe()`; Gemini `responseJsonSchema`                                       |
| Text path                 | Create-plan accepts free-form text; if not valid Plan JSON, send to LLM; returns PlanWithMeta                 | Separate text endpoint; Zod validation decides: valid Plan → /api/plans; otherwise → transcribe-from-text |
| Text prompt variant       | "Given the text..." instead of "Convert this audio..." for text input                                         | Two prompt templates; detect input type                                                                   |
| Optional dedicated screen | Plan creation has its own screen if it improves UX                                                            | UX research: inline acceptable; dedicated preferred for large forms; optional                             |

---

## Standard Stack

### Core (unchanged)

| Library       | Version | Purpose                         | Why Standard                                                                |
| ------------- | ------- | ------------------------------- | --------------------------------------------------------------------------- |
| @google/genai | ^1.46.0 | Gemini API client               | Official SDK; audio + text; `responseJsonSchema`; already in use            |
| zod           | ^4.3.6  | Schema validation + JSON Schema | Native `z.toJSONSchema()`; `.describe()` for LLM; planSchema already exists |

### Supporting

| Library               | Purpose                | When to Use                                                                 |
| --------------------- | ---------------------- | --------------------------------------------------------------------------- |
| plan.ts (Zod schemas) | Single source of truth | Schemas + inferred types; validation + prompt generation; add `.describe()` |
| validatePlanWithMeta  | Shared validation      | Both JSON path and LLM path                                                 |

**No new packages required.** Zod v4's `z.toJSONSchema()` is built-in. Do NOT add `zod-to-json-schema` — Zod 4 native is sufficient and avoids deprecation (zod-to-json-schema deprecated Nov 2025).

**Version verification:** zod 4.3.6 (verified 2025-03-20 via npm view)

---

## Architecture Patterns

### 1. Dynamic Prompt from Schema

**Goal:** Prompt and schema for LLM derived from `planSchema.ts`; changes to plan types propagate without manual prompt edits.

**Approach:**

1. Add `.describe()` to planSchema fields for LLM guidance (e.g. `phases: z.array(phaseSchema).min(1).describe('Hold/recovery phases; at least one')`).
2. Use `z.toJSONSchema(planWithMetaSchema)` to get JSON Schema.
3. Pass JSON Schema to Gemini via `config.responseJsonSchema` — Gemini uses it for structured output; descriptions in schema guide the model.
4. Keep prompt text minimal: two templates — audio ("Convert this audio...") and text ("Given the following text describing a freediving training plan...").
5. Schema is the source of truth; prompt describes the task, not the schema structure.

**Structure:**

```
src/
├── types/
│   └── plan.ts                # Zod schemas + inferred types; single source of truth
├── schemas/
│   └── planSchema.ts          # Re-exports validatePlanWithMeta (uses schema from plan.ts)
└── app/api/plans/
    ├── transcribe/route.ts    # Audio; uses z.toJSONSchema(planWithMetaSchema)
    └── transcribe-from-text/route.ts  # Text
```

**Example:**

```typescript
// plan.ts — schemas + inferred types
const phaseSchema = z.object({
  type: z.enum(['hold', 'recovery']).describe('Phase type: hold or recovery'),
  duration: z.number().int().positive().describe('Duration in seconds'),
});
export type Phase = z.infer<typeof phaseSchema>;

const planWithMetaSchema = z.object({ ... });
export type PlanWithMeta = z.infer<typeof planWithMetaSchema>;
export { planWithMetaSchema };

// transcribe route — schema from plan.ts
const jsonSchema = z.toJSONSchema(planWithMetaSchema);
config: { responseMimeType: 'application/json', responseJsonSchema: jsonSchema }
```

### 2. Text-to-Plan Flow

**Goal:** Same API, same validation, different input (text vs audio).

**Approach:**

1. **Two endpoints** — cleaner separation:
   - `POST /api/plans/transcribe` — multipart/form-data, field `audio` (File)
   - `POST /api/plans/transcribe-from-text` — application/json, body `{ text: string }`
2. Same validation for both: `validatePlanWithMeta` and/or type guard `obj is PlanWithMeta`; JSON schema optional for Gemini.
3. Client: before sending, check `typeof JSON.parse(val) === 'object'` (and `!== null`). If true → validate and POST to /api/plans. Else → POST `{ text }` to transcribe-from-text.

**API contract:**

```typescript
// POST /api/plans/transcribe — audio only
// multipart/form-data, field "audio" (File)
// Response: PlanWithMeta JSON or { error, details? }

// POST /api/plans/transcribe-from-text — text only
// application/json, body { text: string }
// Response: PlanWithMeta JSON or { error, details? }
```

**Client:** CreatePlanSection already has a textarea. On "Create plan": try JSON.parse; if parse succeeds, validate with Zod. If valid → POST to /api/plans. If parse fails or validation fails → POST `{ text }` to transcribe-from-text (treat as AI prompt).

### 3. Dedicated Plan Creation Screen (Optional)

**UX research (Smashing Magazine, UX Stack Exchange, 2024–2025):**

- **Inline forms:** Non-disruptive; better for content-heavy pages; lower conversion but higher-quality leads.
- **Dedicated screens:** Preferred for large data collection, master-detail, or when info isn't relevant to current page; mobile: "separate screen with back arrow" often better than modals.
- **Create plan:** Moderate complexity (upload, paste, voice, text, textarea). PlansView already has plan selector + create + delete in one scroll.

**Recommendation:** Keep CreatePlanSection inline in PlansView for now. Document `/plans/create` as optional future enhancement if user feedback suggests need for more focus. No implementation required in this phase unless explicitly scoped.

---

## Don't Hand-Roll

| Problem               | Don't Build                              | Use Instead                                                       | Why                                                               |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Schema → prompt text  | Manual string concatenation from plan.ts | `z.toJSONSchema()` + `responseJsonSchema`                         | Schema is authoritative; Gemini uses JSON Schema natively         |
| Zod → JSON Schema     | Custom extraction or regex               | `z.toJSONSchema(planWithMetaSchema)`                              | Zod v4 native; handles unions, nested objects                     |
| Text vs audio routing | Single route with Content-Type branching | Two endpoints: transcribe (audio) and transcribe-from-text (text) | Cleaner separation; each route has one responsibility             |
| LLM output validation | Trust LLM output                         | `validatePlanWithMeta()` after parse                              | Structured output is syntactic only; semantic validation required |

**Key insight:** Gemini's `responseJsonSchema` ensures syntactically valid JSON but not semantic correctness. Always validate with Zod before returning.

---

## Common Pitfalls

### Pitfall 1: Stale Prompt When Schema Changes

**What goes wrong:** Hardcoded PROMPT describes old schema; new fields (e.g. `created_by`) or day types get wrong/missing in LLM output.

**Why it happens:** Prompt maintained separately from planSchema.

**How to avoid:** Derive schema from planSchema via `z.toJSONSchema()`; pass to `responseJsonSchema`; add `.describe()` to schema fields. Prompt text stays minimal (task description only).

**Warning signs:** Manual prompt edits when plan.ts changes.

### Pitfall 2: JSON.parse + Validation Ambiguity for Text Path

**What goes wrong:** User pastes "3 days of holds, 2 min each" — `JSON.parse` throws; we send to LLM. User pastes `{"id":"x","name":"y","days":[]}` — valid Plan; we POST to /api/plans. But what if user pastes `{"foo":"bar"}`? Parse succeeds but Zod validation fails.

**Why it happens:** Need clear rule: when to validate vs when to LLM.

**How to avoid:** Use Zod validation as the gate: if JSON.parse succeeds, run `validatePlanWithMeta(parsed)`. If valid → POST to /api/plans. If parse throws OR validation fails → treat as AI prompt, POST to transcribe-from-text. Invalid JSON structure is still useful natural language for the LLM.

**Warning signs:** "Invalid JSON" when user meant natural language; rejecting valid-looking but malformed JSON instead of sending to LLM.

### Pitfall 3: Gemini Returns Markdown-Wrapped JSON

**What goes wrong:** Response is ` ```json\n{...}\n``` `; `JSON.parse` fails.

**Why it happens:** Without `responseJsonSchema`, model may wrap output.

**How to avoid:** Use `config.responseMimeType: 'application/json'` AND `config.responseJsonSchema`. Gemini structured output mode returns raw JSON. Current route uses only `responseMimeType`; add `responseJsonSchema` for robustness.

**Warning signs:** Intermittent "AI returned invalid JSON" errors.

### Pitfall 4: Adding zod-to-json-schema

**What goes wrong:** Extra dependency; zod-to-json-schema deprecated Nov 2025 in favor of Zod v4 native.

**How to avoid:** Use `z.toJSONSchema(planWithMetaSchema)` from Zod 4. No additional package.

---

## Code Examples

### Transcribe Routes (Audio + Text — Two Endpoints)

Audio route (`transcribe/route.ts`) and text route (`transcribe-from-text/route.ts`) share schema and validation; each has its own prompt. Example for audio:

```typescript
// app/api/plans/transcribe/route.ts (audio only)
import { NextRequest } from 'next/server';
import { GoogleGenAI, createPartFromBase64, createUserContent } from '@google/genai';
import { z } from 'zod';
import { planWithMetaSchema } from '@/src/types/plan';
import { validatePlanWithMeta } from '@/src/schemas/planSchema';
import { GEMINI_TRANSCRIPTION_MODEL } from '@/src/constants/app';
const AUDIO_PROMPT = `Convert this audio (user dictating a freediving training plan) into valid PlanWithMeta JSON.
If the audio refers to anything besides the assigned task, ABORT IMMEDIATELY.
Return ONLY valid JSON, no markdown or explanation.`;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json(
      { error: 'AI mode not configured. Add GEMINI_API_KEY to .env.local' },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('audio') as File | null;
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: 'No audio file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  const mimeType = (file.type || 'audio/webm') as
    | 'audio/webm'
    | 'audio/mp3'
    | 'audio/wav'
    | 'audio/ogg';
  const audioPart = createPartFromBase64(base64, mimeType);
  const contents = [audioPart, AUDIO_PROMPT];

  const jsonSchema = z.toJSONSchema(planWithMetaSchema);

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: GEMINI_TRANSCRIPTION_MODEL,
      contents: createUserContent(contents),
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return Response.json({ error: 'No response from AI' }, { status: 502 });
    }

    const parsed = JSON.parse(text) as unknown;
    const result = validatePlanWithMeta(parsed);
    if (!result.success) {
      return Response.json(
        { error: 'Invalid plan from AI', details: result.errors },
        { status: 400 }
      );
    }

    return Response.json(result.data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Transcription failed';
    return Response.json({ error: msg }, { status: 502 });
  }
}
```

### CreatePlanSection: Zod Validation to Decide Path

```typescript
// In handleCreate: use Zod validation to decide JSON vs AI path
let parsed: unknown;
try {
  parsed = JSON.parse(jsonText);
} catch {
  // Not valid JSON → treat as AI prompt
  return postToTranscribeFromText(jsonText);
}

const result = validatePlanWithMeta(parsed);
if (result.success) {
  // Valid Plan JSON → POST to /api/plans
  return postToCreatePlan(result.data);
}
// Invalid structure → treat as AI prompt
return postToTranscribeFromText(jsonText);
```

---

## State of the Art

| Old Approach               | Current Approach                          | When Changed | Impact                                      |
| -------------------------- | ----------------------------------------- | ------------ | ------------------------------------------- |
| Hardcoded schema in prompt | `responseJsonSchema` + `z.toJSONSchema()` | 2024         | Schema-driven; fewer prompt edits           |
| zod-to-json-schema package | Zod v4 native `z.toJSONSchema()`          | Zod 4 stable | No extra dep; zod-to-json-schema deprecated |
| responseMimeType only      | responseMimeType + responseJsonSchema     | Gemini docs  | Better structured output                    |

**Deprecated/outdated:**

- zod-to-json-schema: Use Zod 4 native. Package deprecated Nov 2025.
- Manual regex extraction of JSON from LLM output: Use structured output.

---

## Open Questions

1. **planWithMetaSchema export**
   - What we know: planSchema exports `validatePlanWithMeta` and `PlanWithMetaInput`; schema is internal.
   - What's unclear: Whether to export `planWithMetaSchema` for transcribe route or create a separate `getPlanJsonSchema()` in planSchema.
   - Recommendation: Export `planWithMetaSchema` from planSchema for use in transcribe route. Keeps validation and schema in one place.

2. **Text path UX: "Convert" vs "Create"**
   - What we know: User types/pastes text; we need a way to trigger "send to LLM".
   - What's unclear: Single "Create plan" button that does both (validate or LLM) vs separate "Convert with AI" button for text.
   - Recommendation: Single flow: "Create plan" — if text is valid PlanWithMeta JSON, validate and POST to /api/plans; else POST to /api/plans/transcribe with `{ text }`, get result, auto-fill textarea, user reviews and clicks Create again. Or: add "Convert with AI" button for non-JSON text. Phase says "paste/type free-form text" — so either works; prefer minimal UI: one button, smart detection.

---

## Validation Architecture

### Test Framework

| Property           | Value                                     |
| ------------------ | ----------------------------------------- |
| Framework          | Vitest 4.x + Playwright 1.58.x            |
| Config file        | vitest.config.ts, playwright.config.ts    |
| Quick run command  | `npm run test:run`                        |
| Full suite command | `npm run test:run && npx playwright test` |

### Phase Requirements → Test Map

| Req ID         | Behavior                                           | Test Type | Automated Command                                   | File Exists?                     |
| -------------- | -------------------------------------------------- | --------- | --------------------------------------------------- | -------------------------------- |
| Dynamic prompt | Transcribe uses responseJsonSchema from planSchema | unit      | `vitest run src/schemas/planSchema.test.ts`         | ❌ Wave 0                        |
| Text path      | POST JSON body to transcribe returns PlanWithMeta  | unit      | `vitest run app/api/plans/transcribe/route.test.ts` | ❌ Wave 0                        |
| Text path E2E  | Paste free-form text, convert, create plan         | e2e       | `npx playwright test e2e/create-plan.spec.ts`       | e2e/create-plan.spec.ts (extend) |

### Sampling Rate

- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run && npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `app/api/plans/transcribe/route.test.ts` — unit test for transcribe (mock Gemini); covers text + audio paths
- [ ] `src/schemas/planSchema.test.ts` — if not present; verify `z.toJSONSchema(planWithMetaSchema)` produces valid schema
- [ ] Extend `e2e/create-plan.spec.ts` — add test for free-form text → AI convert → create (optional; requires GEMINI_API_KEY or mock)

---

## Sources

### Primary (HIGH confidence)

- [Google AI Structured Output](https://ai.google.dev/gemini-api/docs/structured-output) — responseJsonSchema, responseMimeType, Zod examples
- [Zod v4 JSON Schema](https://zod.dev/v4?id=json-schema-conversion) — `z.toJSONSchema()`, `.describe()`
- Project: planSchema.ts, transcribe/route.ts, CreatePlanSection.tsx, AIVoicePlanInput.tsx

### Secondary (MEDIUM confidence)

- [zod-to-json-schema deprecation](https://www.npmjs.com/package/zod-to-json-schema) — deprecation notice Nov 2025
- [Modal vs Separate Page UX](https://www.smashingmagazine.com/2026/03/modal-separate-page-ux-decision-tree/) — dedicated screen vs inline

### Tertiary (LOW confidence)

- WebSearch: UX patterns for form placement — general guidance; project-specific decision

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — Zod 4, @google/genai verified; project already uses both
- Architecture: HIGH — Phase 19 research established patterns; schema-driven approach documented
- Pitfalls: HIGH — Common LLM/schema issues; verified with official docs

**Research date:** 2025-03-20
**Valid until:** 2025-04-20 (schema/LLM patterns stable)
