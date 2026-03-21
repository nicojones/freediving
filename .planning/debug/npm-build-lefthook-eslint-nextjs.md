---
status: in_progress
trigger: '1) npm run build fails when called from lefthook.yml; 2) Next.js ESLint plugin not detected'
created: 2025-03-21
updated: 2025-03-21
---

## Issue 1: npm run build fails from lefthook pre-commit

### Symptoms

- **Expected:** Build passes when run from lefthook pre-commit (same as direct `npm run build`)
- **Actual:** User reports build fails when triggered by lefthook
- **Note:** Direct `npm run build` succeeds (exit 0)

### Reproduction

- Run `npx lefthook run pre-commit` with staged files matching `*.{js,ts,jsx,tsx,json,css,mjs}`
- Lefthook config: `lefthook.yml` pre-commit command `📦 build` runs `npm run build` at priority 3

### Investigation (2025-03-21)

**Local run:** Build succeeded when running `npx lefthook run pre-commit` with staged `src/contexts/TrainingContext.tsx`. Build, unit tests, and e2e tests all ran. Could not reproduce the failure locally.

**Potential causes to investigate:**

1. **Environment differences**
   - CI (GitHub Actions, etc.): Different Node version, memory limits, or env vars
   - `core.hooksPath` misconfiguration: If `git config core.hooksPath` returns `/dev/null`, lefthook can fail (see [lefthook#669](https://github.com/evilmartians/lefthook/issues/669))
   - Check: `git config core.hooksPath`

2. **TTY / stdin**
   - Git hooks run non-interactively; some tools fail when stdin is not a TTY
   - pnpm/npm scripts that prompt for input can fail in hooks
   - Mitigation: Ensure build script does not require interactive input

3. **Memory / resources**
   - Next.js build can be memory-intensive; CI runners may have lower limits

4. **Order of operations**
   - User may be conflating build failure with a later step (e.g. e2e tests failing)
   - Lefthook runs: format → lint → build → unit tests → e2e tests

### Recommended next steps

- Capture exact error output when build fails (exit code, stderr)
- Run in CI or user's environment and compare
- If CI: add `npm run build` as a separate job to isolate

---

## Issue 2: Next.js ESLint plugin not detected

### Symptoms

- **Warning:** "The Next.js plugin was not detected in your ESLint configuration"
- **Link:** https://nextjs.org/docs/app/api-reference/config/eslint#migrating-existing-config

### Root cause

`eslint.config.mjs` uses flat config with `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. It does **not** include `@next/eslint-plugin-next` or `eslint-config-next`.

### Fix (applied)

1. Install: `npm i -D @next/eslint-plugin-next`
2. Add plugin to `**/*.{ts,tsx}` block and spread `nextPlugin.configs.recommended.rules`
3. **Detection workaround (next.js#73655):** Next.js calls `calculateConfigForFile(configPath)` on the config file. Since our config is `eslint.config.mjs` and the plugin's `files` pattern was `**/*.{ts,tsx}`, the plugin was never detected. Add a minimal block for `eslint.config.mjs` that includes the plugin so Next.js detects it.

---

## Status

- **Issue 1 (lefthook build):** Could not reproduce locally. Debug file documents potential causes for user to investigate.
- **Issue 2 (ESLint):** Fixed — `@next/eslint-plugin-next` added; plugin detection workaround applied.
