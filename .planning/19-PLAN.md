# Phase 19: Create Plan in Settings — Executable Plan

---
phase: 19-create-plan-settings
plans:
  - id: "01"
    tasks: 5
    depends_on: [18-dynamic-version-semantic-release]
  - id: "02"
    tasks: 4
    depends_on: [19-plan-01]
type: execute
wave: 1
autonomous: false
requirements: []
must_haves:
  truths:
    - "User can upload JSON file in Settings; validated against PlanWithMeta schema"
    - "Valid plans stored (DB preferred)"
    - "Invalid JSON shows clear validation errors"
    - "(Optional) AI mode: dictate → Gemini → valid JSON → auto-fill → user confirms"
---

## Objective

Add a feature in Settings to create new training plans. Two paths:

1. **JSON upload** — User uploads a JSON file; validate against PlanWithMeta schema; store in DB (or public). Fail or succeed with clear feedback.
2. **PRO / AI mode** — Microphone icon; user dictates the plan; audio + schema sent to Google Gemini; server returns valid PlanWithMeta JSON; auto-fill form; user clicks OK to save. May be split into sub-phases if complex.

**Storage decision:** DB is cleaner (per-user or global plans, no static file deployment). Public/static: simpler, but requires deploy to add plans. Document pros/cons; implement DB path.

**Principles:**
- PlanWithMeta schema is the single source of truth (see `src/types/plan.ts` lines 30–37)
- Validation must be strict; invalid JSON never reaches storage
- AI mode is optional; JSON upload path works standalone

---

## Context

- `src/types/plan.ts` — PlanWithMeta, PlanDay, TrainingDay, RestDay, Phase
- `src/data/minimal-plan.json` — minimal valid example
- `src/services/planService.ts` — getAvailablePlans, loadPlanById (currently from bundled JSON only)
- `src/components/settings/SettingsView.tsx` — Settings page; PlanSelectorSection

**Existing:** Plans come from bundled JSON (`default-plan.json`, `minimal-plan.json`). No API to add plans. Active plan stored per user in DB.

---

## Plan 01: JSON Upload + Validation + Storage

### Task 1: JSON Schema for PlanWithMeta

**Files:** `src/schemas/planSchema.ts` (or `planWithMeta.schema.json`)

**Action:**
1. Define JSON schema that validates PlanWithMeta: `id`, `name`, `description?`, `days` (array of PlanDay)
2. PlanDay: TrainingDay | RestDay | null; TrainingDay: `id`, `day`, `group?`, `phases`, `type?`; RestDay: `id`, `day`, `group?`, `rest: true`; Phase: `type`, `duration`
3. Use a validation library (e.g. Ajv, Zod) — choice is yours
4. Export `validatePlanWithMeta(data: unknown): { success: true; data: PlanWithMeta } | { success: false; errors: string[] }`

**Done:** Reusable validator for PlanWithMeta.

---

### Task 2: API Endpoint to Create Plan

**Files:** `src/app/api/plans/route.ts` (or equivalent Next.js route)

**Action:**
1. Add POST endpoint that accepts `PlanWithMeta` JSON body
2. Validate with schema from Task 1; return 400 + error messages if invalid
3. Store plan in DB (new table or JSON column); generate id if needed, ensure uniqueness
4. Return created plan (id, name, etc.)

**Done:** Backend can accept and persist valid plans.

---

### Task 3: Settings UI — Create Plan Section

**Files:** `src/components/settings/CreatePlanSection.tsx` (new), `SettingsView.tsx`

**Action:**
1. Add "Create plan" section in Settings (below PlanSelectorSection or in a collapsible area)
2. File input for JSON upload
3. On file select: read file, parse JSON, run validation
4. If invalid: show error messages (e.g. "days[2]: must have 'phases' or 'rest'")
5. If valid: call API to create plan; on success, refresh available plans and show success message

**Done:** User can upload JSON and create a plan from Settings.

---

### Task 4: Wire planService to Include DB Plans

**Files:** `src/services/planService.ts`, API for listing plans

**Action:**
1. Add API endpoint to list plans (bundled + DB)
2. Update `getAvailablePlans()` (or equivalent) to fetch from API when user is logged in, merging bundled + DB plans
3. Ensure `loadPlanById` can resolve DB plans

**Done:** New plans appear in plan selector and can be selected.

---

### Task 5: Storage Pros/Cons Documentation

**Files:** `.planning/19-STORAGE.md` (new) or inline in plan

**Action:**
1. Document: DB vs public/static storage
2. Pros: DB — no deploy for new plans, per-user possible, centralized. Public — simpler, no backend change, works offline for bundled
3. Decision: DB for user-created plans; bundled plans remain in `src/data`

**Done:** Rationale documented for future reference.

---

## Plan 02: AI Voice Mode (PRO)

*If complex, split into 19b, 19c, etc.*

### Task 6: Server-Side Gemini Integration

**Files:** `src/app/api/plans/transcribe/route.ts` (new), env for `GEMINI_API_KEY`

**Action:**
1. POST endpoint: accepts multipart/form-data with audio file
2. Send audio + PlanWithMeta JSON schema + minimal example to Google Gemini (e.g. "Convert this speech to a valid PlanWithMeta JSON. Return only valid JSON.")
3. Parse Gemini response; validate against schema
4. If valid: return JSON. If invalid: return error (retry or show to user)

**Done:** Server can turn audio into validated PlanWithMeta.

---

### Task 7: Microphone UI + Recording

**Files:** `src/components/settings/CreatePlanSection.tsx` (or `AIVoicePlanInput.tsx`)

**Action:**
1. Add "AI mode" or "PRO" toggle/button with microphone icon
2. Use MediaRecorder (or similar) to record audio when user clicks
3. Stop recording on second click or timeout
4. Send audio blob to `/api/plans/transcribe`

**Done:** User can record and send audio to backend.

---

### Task 8: Auto-Fill JSON Field

**Files:** `CreatePlanSection.tsx`

**Action:**
1. When transcribe API returns valid JSON, auto-populate the JSON textarea/editor
2. User can edit before submitting
3. "OK" or "Save" button runs same validation + create flow as JSON upload

**Done:** AI result flows into create flow; user confirms before save.

---

### Task 9: Error Handling + UX

**Files:** `CreatePlanSection.tsx`, transcribe API

**Action:**
1. Handle: network error, invalid audio, Gemini returning invalid JSON
2. Show clear messages: "Could not transcribe. Try again or paste JSON manually."
3. Ensure API key is server-side only; never expose in client

**Done:** AI mode degrades gracefully; user can fall back to JSON upload.

---

## Verification

- [ ] User can upload valid JSON file → plan created and appears in selector
- [ ] Invalid JSON shows specific validation errors
- [ ] Plans stored in DB; `getAvailablePlans` includes them
- [ ] (Optional) AI mode: record → transcribe → valid JSON → edit → save
- [ ] `npm run build` and `npm run test:run` pass
