# Phase 1: Plan Service — Executable Plan

---

phase: 1-plan-service
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:

- package.json
- vite.config.ts
- tsconfig.json
- tsconfig.node.json
- index.html
- src/main.tsx
- src/App.tsx
- src/vite-env.d.ts
  autonomous: true
  requirements: [PLAN-01, ADMN-01]
  user_setup: []

must_haves:
truths: - "App loads training plans from JSON files (day sequences)" - "Parsed plans expose hold/breathe intervals per day" - "Admin can add or modify plans by updating JSON (no in-app editor)" - "Invalid JSON surfaces clear error message, app does not crash"
artifacts: - path: src/types/plan.ts
provides: "Type definitions for Plan, Day, Phase"
contains: "PlanDay, Phase, type hold|recovery, duration" - path: src/data/default-plan.json
provides: "Example training plan"
contains: "phases, type, duration" - path: src/services/planService.ts
provides: "Plan loading and phase exposure"
exports: ["loadPlan", "getPhasesForDay"]
key_links: - from: src/services/planService.ts
to: src/data/default-plan.json
via: "import or fetch"
pattern: "default-plan\\.json" - from: src/App.tsx
to: src/services/planService.ts
via: "import and call"
pattern: "planService|loadPlan"

---

## Objective

Implement the Plan Service so the app can load training plans from JSON, parse them, and expose hold/breathe intervals per day. Admin workflow: edit JSON in repo, git commit, deploy. No in-app plan editor.

**Purpose:** Session structure is the backbone for Timer Engine (Phase 3) and Plan/Day Selector (Phase 5). Both need day list and intervals.

**Output:** Plan Service module, types, example plan JSON, minimal app that demonstrates loading.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- 1-CONTEXT.md
- @.planning/research/STACK.md
- @.planning/research/ARCHITECTURE.md

**Stack:** React 19 + Vite 6 + TypeScript (from research). Project scaffold does not exist yet — create it.

**Plan structure (from 1-CONTEXT.md):**

- Single array of days; index = day number (0-based)
- Rest days: `null` or `{ rest: true }`
- Training days: `{ phases: [{ type: "hold" | "recovery", duration }], type?: "dry" | "wet" }` (default type: "dry")
- Location: `src/data/`

---

## Tasks

### Task 1: Project scaffold

**Files:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

**Action:**

1. Run `npm create vite@latest . -- --template react-ts` (use `.` for current dir; overwrite if prompted).
2. Ensure `package.json` has React 19, Vite 6, TypeScript 5. If template uses older versions, update to match STACK.md.
3. Create `src/data/` directory (empty for now).
4. Verify dev server starts: `npm run dev` — app renders.

**Verify:**

```bash
npm run dev
# App loads at localhost:5173 (or similar)
```

**Done:** Vite + React + TS app runs; `src/data/` exists.

---

### Task 2: Types and example plan JSON

**Files:** `src/types/plan.ts`, `src/data/default-plan.json`

**Action:**

1. Create `src/types/plan.ts` with:
   - `Phase`: `{ type: "hold" | "recovery"; duration: number }`
   - `TrainingDay`: `{ phases: Phase[]; type?: "dry" | "wet" }` (default "dry")
   - `RestDay`: `{ rest: true }`
   - `PlanDay`: `TrainingDay | RestDay | null`
   - `Plan`: `PlanDay[]` (array of days; index = day number)
2. Create `src/data/default-plan.json` using the example from 1-CONTEXT.md:
   ```json
   [
     {
       "phases": [
         { "type": "hold", "duration": 60 },
         { "type": "recovery", "duration": 90 },
         { "type": "hold", "duration": 60 },
         { "type": "recovery", "duration": 90 }
       ],
       "type": "dry"
     },
     {
       "phases": [
         { "type": "hold", "duration": 90 },
         { "type": "recovery", "duration": 120 }
       ],
       "type": "wet"
     },
     null,
     { "rest": true },
     {
       "phases": [
         { "type": "hold", "duration": 75 },
         { "type": "recovery", "duration": 100 }
       ]
     }
   ]
   ```
3. Add `"resolveJsonModule": true` to `tsconfig.json` if not present (for importing JSON).

**Verify:**

```bash
npm run build
# Build succeeds; no type errors
```

**Done:** Types exported; example plan JSON exists and is valid.

---

### Task 3: Plan Service

**Files:** `src/services/planService.ts`

**Action:**

1. Create `src/services/planService.ts`.
2. Implement:
   - `loadPlan(planPath?: string): Promise<Plan | { error: string }>` — loads plan from JSON. Default path: `src/data/default-plan.json`. Use static import: `import planData from '../data/default-plan.json'` and return as `Plan`. For invalid JSON (if loading dynamically later), catch and return `{ error: "Failed to load plan: <message>" }`. For now, static import fails at build time if JSON is invalid — that's acceptable.
   - `getPhasesForDay(plan: Plan, dayIndex: number): Phase[] | null` — returns `phases` for training day, or `null` for rest/null days. Handles out-of-range: return `null`.
3. Export both functions.
4. In `loadPlan`, after loading: if result is not an array, return `{ error: "Invalid plan: expected array of days" }`. This handles malformed JSON or wrong structure.
5. In `getPhasesForDay`, if `plan` is malformed (e.g. not an array), defensively return `null` — do not throw. Schema validation is out of scope; we only ensure no crash.

**API shape:**

```typescript
// src/services/planService.ts
import type { Plan, Phase } from '../types/plan';
import defaultPlan from '../data/default-plan.json';

export async function loadPlan(): Promise<Plan | { error: string }> {
  try {
    return defaultPlan as Plan;
  } catch (e) {
    return { error: `Failed to load plan: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}

export function getPhasesForDay(plan: Plan, dayIndex: number): Phase[] | null {
  const day = plan[dayIndex];
  if (day == null || (typeof day === 'object' && 'rest' in day && day.rest)) return null;
  if (typeof day === 'object' && 'phases' in day && Array.isArray(day.phases)) {
    return day.phases;
  }
  return null;
}
```

**Verify:**

```bash
npm run build
# Build succeeds
```

**Done:** Plan Service loads plan and exposes intervals per day; invalid/malformed data does not crash.

---

### Task 4: Wire Plan Service into App

**Files:** `src/App.tsx`

**Action:**

1. In `src/App.tsx`, import `loadPlan` and `getPhasesForDay` from `src/services/planService`.
2. On mount (useEffect), call `loadPlan()`. If result has `error`, display the error message in the UI (e.g. a simple `<p>` or `<div>`). If successful, display: "Plan loaded: X days" and for day 0, show "Day 1 phases: [hold 60s, recover 90s, ...]" (or similar). This proves the app loads plans and exposes phases.
3. Ensure no crash on load — wrap in try/catch if needed.

**Verify:**

```bash
npm run dev
# Visit app; see "Plan loaded: 5 days" and day 1 intervals
```

**Done:** App demonstrates loading plan and displaying intervals; success criteria 1 and 2 are met.

---

### Task 5: Admin workflow documentation

**Files:** `README.md` or `1-CONTEXT.md` (add section)

**Action:**

1. Add a short section "Adding or modifying plans" to README (create if missing): "Edit JSON files in `src/data/`. Add new files (e.g. `plan-b.json`) or modify `default-plan.json`. Commit and deploy. No in-app editor."
2. This satisfies ADMN-01: admin workflow is git commit + deploy.

**Verify:** README contains the section.

**Done:** Admin knows how to add/modify plans (edit JSON, commit, deploy).

---

## Verification

| Success Criterion                               | How to Verify                                                   |
| ----------------------------------------------- | --------------------------------------------------------------- |
| App loads training plans from JSON              | `npm run dev` → app shows "Plan loaded: X days"                 |
| Parsed plans expose hold/breathe phases per day | `getPhasesForDay(plan, 0)` returns phases; UI shows them        |
| Admin can add/modify plans via JSON             | Edit `src/data/default-plan.json`, rebuild, see changes         |
| Invalid JSON: graceful error                    | Manually corrupt JSON → app shows error message, does not crash |

---

## Success Criteria

1. **App loads training plans from JSON files (monthly plans, day sequences)** — ✓ Plan Service loads `default-plan.json`; App displays day count.
2. **Parsed plans expose hold/breathe phases per day** — ✓ `getPhasesForDay(plan, dayIndex)` returns `Phase[]` or `null`.
3. **Admin can add or modify plans by updating JSON (no in-app editor)** — ✓ README documents: edit JSON in `src/data/`, commit, deploy.

---

## Output

After completion:

- `src/types/plan.ts` — type definitions
- `src/data/default-plan.json` — example plan
- `src/services/planService.ts` — load + getPhasesForDay
- `src/App.tsx` — wired to Plan Service, displays plan info
- README section for admin workflow

---

## Dependency Graph

```
Task 1 (scaffold) ──┬──> Task 2 (types + JSON)
                    │
                    └──> Task 3 (Plan Service) ──> Task 4 (wire App)
                                                    │
                                                    └──> Task 5 (README)
```

**Waves:** 1 → 2 → 3 → 4 → 5 (sequential; each builds on previous).
