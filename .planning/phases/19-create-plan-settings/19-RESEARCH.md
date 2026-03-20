# Phase 19: Create Plan in Settings — Research

**Researched:** 2025-03-20
**Domain:** AI voice mode (Gemini), JSON plan creation, modular feature architecture
**Confidence:** HIGH

## Summary

Phase 19 adds plan creation in Settings via two paths: (1) JSON upload with schema validation, (2) optional AI voice mode — dictate → Gemini → PlanWithMeta JSON. The AI mode must be implemented as a **self-contained module** so it can be removed without penetrating the core codebase. JSON types and validation remain; only AI-specific code is isolated.

**Primary recommendation:** Use `@google/genai` for Gemini audio→JSON; keep AI in `src/features/ai-plan/` (or `src/modules/ai-plan/`) with a single integration point in CreatePlanSection; API key in `.env.local` (dev) and `.env.production` (prod).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| JSON upload | User uploads JSON; validate against PlanWithMeta; store in DB | Zod or Ajv; existing plan types in `src/types/plan.ts` |
| AI mode | Microphone → audio → Gemini → valid JSON → auto-fill → user confirms | Gemini Files API + generateContent; structured output for JSON |
| Modular AI | AI code removable without affecting JSON path or plan types | Feature folder; single import in CreatePlanSection; no AI imports in planService, types, or core |
| API key | Server-side only; developer can test locally | `.env.local` (Next.js auto-loads; add to .gitignore) |

---

## Standard Stack

### Core (AI mode)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @google/genai | ^1.x | Gemini API client | Official Google SDK; supports Files API, audio, structured JSON output; Node.js 20+ |
| zod | ^3.x | Schema validation | Already common in Next.js; PlanWithMeta validation; shared with JSON upload path |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| MediaRecorder | Browser API | Client-side audio recording | No npm package; use `navigator.mediaRecorder` |
| multipart/form-data | Built-in | Audio upload to API | `request.formData()` in Route Handler |

**Installation:**
```bash
npm install @google/genai zod
```

**Version verification:** @google/genai v1.46+ (verified 2025-03-20)

---

## Architecture Patterns

### 1. Modular AI — Feature Isolation

**Goal:** AI mode is a separate module. Deleting it leaves JSON upload, plan types, and planService untouched.

**Structure:**
```
src/
├── features/
│   └── ai-plan/                    # AI module — delete entire folder to remove AI
│       ├── index.ts                # Public API: transcribeAudio(audioBlob) => Promise<PlanWithMeta | Error>
│       ├── transcribeClient.ts     # fetch to /api/plans/transcribe
│       ├── AIVoicePlanInput.tsx     # Microphone UI, recording, send to API
│       └── types.ts                # Only if AI-specific types needed
├── components/settings/
│   ├── CreatePlanSection.tsx       # Integrates: JSON upload + optional <AIVoicePlanInput />
│   └── ...
├── app/api/plans/
│   ├── route.ts                   # POST create plan (no AI)
│   └── transcribe/
│       └── route.ts               # AI-only route; can delete with feature
├── types/plan.ts                  # UNCHANGED — shared by both paths
├── schemas/planSchema.ts          # UNCHANGED — shared validation
└── services/planService.ts       # UNCHANGED — no AI imports
```

**Integration point:** CreatePlanSection imports `AIVoicePlanInput` from `@/features/ai-plan`. If feature is removed, delete the import and the component usage; JSON path works standalone.

**Don't:** Import Gemini or AI logic in planService, planSchema, or plan types. Keep AI behind a single boundary.

### 2. Gemini Audio → PlanWithMeta Flow

**Flow:**
1. Client: MediaRecorder records audio → Blob
2. Client: POST multipart/form-data to `/api/plans/transcribe`
3. Server: Parse formData, get audio file
4. Server: Upload audio via `ai.files.upload()` (or inline for small files)
5. Server: `ai.models.generateContent()` with prompt + schema + minimal example
6. Server: Parse response; validate with Zod; return JSON or 400
7. Client: Auto-fill textarea; user edits; Save uses same create flow as JSON upload

**Gemini API (Node.js):**
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Option A: Inline base64 (simpler for small audio)
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",  // or gemini-1.5-flash
  contents: [{
    parts: [
      { inlineData: { mimeType: "audio/webm", data: base64Audio } },
      { text: prompt }
    ]
  }],
  config: {
    responseMimeType: "application/json",
    responseSchema: planWithMetaSchema  // structured output
  }
});

// Option B: Files API for larger files
const file = await ai.files.upload({ file: tempPath, config: { mimeType: "audio/webm" } });
// then use createPartFromUri(file.uri, file.mimeType)
```

**Supported audio formats:** webm, mp3, mpeg, wav, ogg (see [Gemini audio docs](https://ai.google.dev/gemini-api/docs/audio)).

### 3. Don't Hand-Roll

- **Speech-to-text:** Use Gemini's native audio understanding. Do NOT use a separate Speech-to-Text API unless Gemini fails; adds complexity.
- **JSON extraction from LLM:** Use `responseMimeType: "application/json"` + `responseSchema` (structured output). Do NOT regex-parse free text.
- **Audio recording:** Use MediaRecorder. Do NOT use Web Audio API for recording unless you need low-level control.
- **Validation:** Use shared Zod schema for both JSON upload and AI output. Do NOT duplicate validation logic.

### 4. Common Pitfalls

| Pitfall | Mitigation |
|---------|------------|
| Gemini returns markdown-wrapped JSON | Use structured output; avoid parsing raw text |
| Audio too large for inline | Use Files API; upload to Gemini, then reference URI |
| API key exposed to client | Route Handler only; never in client bundle |
| AI module leaks into planService | ESLint: block imports from `features/ai-plan` into `services/`, `types/` |
| MediaRecorder not supported | Check `navigator.mediaRecorder`; show "Use JSON upload" fallback |

---

## API Key Placement

**Where to put `GEMINI_API_KEY` for development and testing:**

| Environment | File | Notes |
|-------------|------|-------|
| **Local dev** | `.env.local` | Next.js auto-loads; create in project root. Add to `.gitignore` if not already. |
| **Production** | `.env.production` | Same as other secrets (SESSION_SECRET, etc.). Server loads via systemd `EnvironmentFile`. |

**Setup:**
1. Create `.env.local` in project root (same level as `package.json`)
2. Add: `GEMINI_API_KEY=your_api_key_here`
3. Ensure `.env.local` is in `.gitignore` (Next.js default; verify)
4. Restart dev server: `npm run dev`

**Get API key:** [Google AI Studio](https://aistudio.google.com/apikey) — free tier available.

**Verification:** Transcribe route checks `process.env.GEMINI_API_KEY`; if missing, return 503 with message "AI mode not configured."

---

## Feasibility Assessment

| Aspect | Feasibility | Notes |
|--------|-------------|-------|
| Gemini audio → JSON | **High** | Native support; structured output for PlanWithMeta; proven pattern |
| Modular removal | **High** | Feature folder + single integration point; no core coupling |
| MediaRecorder | **High** | Supported in all modern browsers; fallback to JSON upload |
| Cost | **Low** | Gemini free tier; audio + JSON generation is cheap per request |
| Latency | **Medium** | 2–5s typical for short audio; show loading state |

**Verdict:** Feasible. AI mode can be implemented as a clean optional module. JSON path remains primary; AI is additive.

---

## Code Examples

### Transcribe Route (minimal)

```typescript
// app/api/plans/transcribe/route.ts
import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { validatePlanWithMeta } from '@/schemas/planSchema'

const PROMPT = `Convert this audio (user dictating a freediving training plan) into valid PlanWithMeta JSON.
Schema: { id, name, description?, days: [TrainingDay|RestDay|null] }
TrainingDay: { id, day, group?, phases: [{ type: 'hold'|'recovery', duration }], type?: 'dry'|'wet' }
RestDay: { id, day, group?, rest: true }
Return ONLY valid JSON, no markdown.`

export async function POST(request: NextRequest) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return Response.json({ error: 'AI mode not configured' }, { status: 503 })

  const formData = await request.formData()
  const file = formData.get('audio') as File | null
  if (!file) return Response.json({ error: 'No audio file' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')
  const mimeType = file.type || 'audio/webm'

  const ai = new GoogleGenAI({ apiKey: key })
  const res = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      parts: [
        { inlineData: { mimeType, data: base64 } },
        { text: PROMPT }
      ]
    }],
    config: { responseMimeType: 'application/json' }
  })

  const text = res.text
  if (!text) return Response.json({ error: 'No response from AI' }, { status: 502 })

  const parsed = JSON.parse(text)
  const result = validatePlanWithMeta(parsed)
  if (!result.success) return Response.json({ error: 'Invalid plan', details: result.errors }, { status: 400 })

  return Response.json(result.data)
}
```

### CreatePlanSection integration (modular)

```tsx
// CreatePlanSection.tsx — AI is optional import
import { AIVoicePlanInput } from '@/features/ai-plan'

export function CreatePlanSection() {
  const [jsonText, setJsonText] = useState('')
  return (
    <section>
      <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} />
      <AIVoicePlanInput onResult={setJsonText} />  {/* Only AI import */}
      <button onClick={() => createPlan(jsonText)}>Save</button>
    </section>
  )
}
```

---

## RESEARCH COMPLETE

**Next steps:** Plan phase (`/gsd-plan-phase 19`), or implement following this research. Ensure `.env.local` exists with `GEMINI_API_KEY` for local testing.
