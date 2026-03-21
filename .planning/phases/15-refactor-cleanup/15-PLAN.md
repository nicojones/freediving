# Phase 15: Refactor Code (Cleanup) — Executable Plan

---

phase: 15-refactor-cleanup
plans:

- id: "01"
  tasks: 5
  depends_on: [14-nextjs-migration]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths: - "ESLint configured and passing (flat config)" - "All if statements use curly braces" - "No unused variables, functions, imports, or exports"

---

## Objective

Third refactor pass: add ESLint, enforce style (curly braces for all `if`), remove all unused code.

**Purpose:** Reduce noise, improve maintainability, keep codebase lean.

**Principles:**

- ESLint flat config with strict rules.
- All `if` statements use curly braces (no single-line `if (x) return`).
- Zero unused code — variables, functions, imports, exports, types.
- Workflow: add rules → `npm run lint -- --fix` → manual fix only what autofix cannot handle.
- Plan and Context kept concise (this document).

---

## Context

- @.planning/PROJECT.md
- 15-CONTEXT.md

**Existing:** Phases 1–14 complete. Next.js migration done. `next lint` prompts for config — ESLint not yet set up. Similar scope to Phase 11 (quality pass) but focused on ESLint + style + dead-code removal.

---

## Plan 01: Cleanup Pass

### Task 1: Add ESLint Configuration

**Files:** `eslint.config.mjs`, `package.json`

**Action:**

1. Create `eslint.config.mjs` (flat config) with:
   - `typescript-eslint` for TS/TSX
   - `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` (Next.js)
   - `@next/eslint-plugin-next` if available
2. Enable `@typescript-eslint/no-unused-vars` (error).
3. Add `eslint-plugin-unused-imports` or use `@typescript-eslint/no-unused-vars` with `argsIgnorePattern` for intentional unused params.
4. Update `package.json` scripts: `"lint": "eslint ."` (or keep `next lint` if it works with config).
5. Run `npm run lint` — note violations.

**Done:** ESLint runs and reports issues.

---

### Task 2: Enforce Curly Braces for All if Statements

**Files:** `eslint.config.mjs`, all `src/**/*.{ts,tsx}` and `app/**/*.{ts,tsx}`

**Action:**

1. Add rule: `curly: ['error', 'all']` — requires curly braces for all `if`, `else`, `for`, `while`, `do`.
2. Run `npm run lint -- --fix` — autofix curly violations (do NOT convert manually).
3. Run `npm run lint` — fix any remaining violations that cannot be autofixed.

**Done:** All `if` statements use curly braces; `curly` rule passes.

---

### Task 3: Remove Unused Code

**Files:** All `src/**/*.{ts,tsx}`, `app/**/*.{ts,tsx}`, `lib/**/*.ts`

**Action:**

1. Run `npm run lint -- --fix` — autofix what can be autofixed (e.g. unused imports).
2. Manually fix remaining: unused variables, function parameters (prefix with `_` if intentionally unused), exports, types, dead functions/components.
3. Remove unused constants from `src/constants/*` if any.
4. Verify: `npm run build` and `npm run lint` pass.

**Done:** Zero unused code.

---

### Task 4: Verify and Document

**Action:**

1. Run full test suite: `npm run test` (unit + E2E).
2. Manual smoke: login, start session, complete session — unchanged behavior.

**Done:** Refactor complete; no behavior change.

---

### Task 5: Update CI (Optional)

**Files:** `.github/workflows/deploy.yml` or CI config

**Action:**

1. Ensure `npm run lint` runs in CI (if not already).
2. Lint must pass before deploy.

**Done:** CI enforces lint.

---

## Success Criteria

1. **ESLint configured** — ✓ `eslint.config.mjs` exists; `npm run lint` runs
2. **Curly braces** — ✓ All `if` statements use `{ }`
3. **No unused code** — ✓ ESLint passes; no unused vars/functions/imports/exports
4. **No behavior change** — ✓ Tests pass; manual smoke unchanged

---

## How to Test

1. `npm run lint` — passes (curly, no-unused-vars, no-unused-imports)
2. `npm run build` — succeeds
3. `npm run test` — all pass
4. Manual: login → start session → complete — same as before
