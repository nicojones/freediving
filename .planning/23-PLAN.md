# Phase 23: Prettier + Lefthook + CI Format/Lint — Executable Plan

---

phase: 23-prettier-lefthook-ci
plans:

- id: "01"
  tasks: 5
  depends_on: [22-plans-tab-settings-cleanup]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths:
  - "Prettier installed and configured; code formatted consistently"
  - "lefthook.yml runs format + lint + unit tests + build + e2e on pre-commit (when source files staged); emoji-prefixed commands; blocks commit if checks fail"
  - "GitHub workflow runs format/lint checks; emoji-prefixed step names; job aborts if any files would be changed (i.e. unformatted or lint-fixable)"

---

## Objective

Add basic formatter (Prettier). Code must be formatted and linted via lefthook pre-commit hooks, and the GitHub workflow must enforce the same checks — if format or lint would change any files, the pipeline job aborts.

**Principles:**

- Prettier for consistent formatting
- lefthook for pre-commit: format + lint before commit
- CI: run format check + lint; fail if code is not already formatted/linted (no auto-fix in CI)

---

## Context

- ESLint already configured (Phase 15); `npm run lint` exists
- GitHub workflow (`.github/workflows/deploy.yml`) runs `npm run lint` before deploy
- No Prettier or lefthook yet

---

## Plan 01: Prettier + Lefthook + CI

### Task 1: Add Prettier

**Files:** `package.json`, `.prettierrc`, `.prettierignore`

**Action:**

1. Install Prettier: `npm install -D prettier`
2. Create `.prettierrc` with sensible defaults (e.g. semi, singleQuote, tabWidth)
3. Create `.prettierignore` (e.g. `.next`, `node_modules`, `build.zip`, `*.lock`)
4. Add script: `"format": "prettier --write ."` and `"format:check": "prettier --check ."`
5. Run `npm run format` to format entire codebase

**Done:** Prettier configured; codebase formatted.

---

### Task 2: Add lefthook

**Files:** `lefthook.yml`, `package.json`

**Action:**

1. Install lefthook: `npm install -D lefthook`
2. Create `lefthook.yml` with pre-commit hook:
   - Run `prettier --write` (or `prettier --write .` on staged files)
   - Run `eslint .` (or staged files)
   - Hook blocks commit if either fails
3. Add script: `"prepare": "lefthook install"` (or ensure `lefthook install` runs postinstall)
4. Run `lefthook install` so hooks are active

**Enhancements (post-execution):**

- **Emojis** — Each command uses an emoji prefix for easy identification: ✨ format, 🔍 lint, 🧪 unit tests, 📦 build, 🎭 e2e tests
- **Build + tests in pre-commit** — Pre-commit also runs unit tests, build, and E2E tests when staged files match `*.{js,ts,jsx,tsx,json,css,mjs}`. Format and lint run on matching file types; build/tests skip for docs-only commits (e.g. `.md`, `.yml` only).

**Done:** lefthook pre-commit runs format + lint + unit tests + build + e2e; commit blocked if checks fail.

---

### Task 3: Update GitHub Workflow — Format/Lint Check with Abort on Changes

**Files:** `.github/workflows/deploy.yml`

**Action:**

1. Add a step (or modify existing) to run format check and lint in "check" mode:
   - `npm run format:check` — fails if any file needs formatting
   - `npm run lint` — already present; fails if lint issues
2. Alternative: run `prettier --write .` and `eslint --fix .`, then `git diff --exit-code` — if diff is non-empty, fail (abort). Simpler approach: use `format:check` so CI never modifies files.
3. Ensure job fails (aborts pipeline) when format or lint would change files.

**Enhancement (post-execution):**

- **Emojis** — All workflow step names use emoji prefixes for easy identification in the GitHub Actions UI: 📥 Checkout, 📦 Setup Node.js, 🔎 Check deps, 📚 Install deps, 🎭 Playwright, ✨ Format check, 🔍 Lint, 🧪 Unit tests, 🎭 E2E tests, 🏷️ Semantic Release, 🏗️ Build, 📦 Prepare packages, 🚀 Upload, 🔄 Post-deployment.

**Done:** CI runs format:check + lint; pipeline aborts if code is not formatted or has lint issues; steps are visually scannable via emojis.

---

### Task 4: Document and Verify

**Action:**

1. Add brief note to README or CONTRIBUTING: "Run `npm run format` before commit, or rely on lefthook."
2. Verify: `npm run format:check` and `npm run lint` pass
3. Verify: `lefthook run pre-commit` (or manual commit attempt) blocks when unformatted

**Done:** Docs updated; all checks pass.

---

### Task 5: Final Integration

**Action:**

1. Run full test suite: `npm run test:run`, `npm run test:e2e`
2. Ensure `npm run build` still succeeds
3. Confirm deploy workflow runs format:check before lint (or in parallel) and aborts on failure

**Done:** Tests pass; CI enforces format + lint; pipeline aborts when checks fail.

---

## Success Criteria

1. **Prettier** — ✓ Installed; `format` and `format:check` scripts; codebase formatted
2. **lefthook** — ✓ pre-commit runs format + lint + unit tests + build + e2e (when source files staged); emoji-prefixed commands; blocks commit on failure
3. **GitHub workflow** — ✓ format:check + lint; job aborts if any files would be changed; emoji-prefixed step names for scanability
4. **No behavior change** — ✓ Tests pass; app works as before

---

## How to Test

1. `npm run format:check` — passes
2. `npm run lint` — passes
3. `lefthook run pre-commit` — passes (or make a small unformatted change and try commit — should block). With staged `.ts`/`.tsx` files, format + lint + unit tests + build + e2e all run (~2 min).
4. Push to branch — CI runs format:check + lint; fails if code not formatted; step names show emojis in GitHub Actions UI
5. `npm run build` and `npm run test:run` — pass
