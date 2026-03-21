# Phase 18: Dynamic Version Display & Semantic Release — Executable Plan

---

phase: 18-dynamic-version-semantic-release
plans:

- id: "01"
  tasks: 4
  depends_on: [17-test-controls]
  type: execute
  wave: 1
  autonomous: false
  requirements: []
  must_haves:
  truths: - "Login page shows version from package.json" - "Push to main with fix: bumps patch" - "Push to main with feat: bumps minor" - "Push to main with chore: no version bump" - "Major versions updated manually (BREAKING CHANGE or feat!:)"

---

## Objective

Display app version dynamically from package.json on the login page. Automate version bumping on push to GitHub using conventional commits: fix → patch, feat → minor, chore → no bump, major → manual.

**Purpose:** Single source of truth for version; no manual version edits; semantic versioning from commit messages.

**Principles:**

- Version read from package.json at build time
- semantic-release analyzes commits and bumps version
- fix: → patch, feat: → minor, chore: → no release, BREAKING CHANGE / feat!: → major

---

## Context

- @.planning/PROJECT.md

**Existing:** LoginPage shows hardcoded "Version 2.0.4". package.json has "version": "0.0.0".

---

## Plan 01: Dynamic Version & Semantic Release

### Task 1: Dynamic Version in LoginPage

**Files:** `src/views/LoginPage.tsx`

**Action:**

1. Import version from package.json (e.g. `import { version } from '../../package.json'`)
2. Replace hardcoded "2.0.4" with `{version}` in the footer
3. Ensure Next.js can resolve the JSON import (works by default)

**Done:** Login page displays version from package.json.

---

### Task 2: semantic-release Configuration

**Files:** `release.config.js` (new), `package.json`

**Action:**

1. Add semantic-release and @semantic-release/git as devDependencies
2. Create release.config.js with conventional commits preset
3. Configure @semantic-release/git to commit package.json and package-lock.json on release
4. Ensure chore: commits do not trigger a release (default behavior)

**Done:** semantic-release configured for fix=patch, feat=minor, chore=no bump.

---

### Task 3: GitHub Action for Release

**Files:** `.github/workflows/release.yml` (new)

**Action:**

1. Create workflow that runs on push to main
2. Checkout with fetch-depth: 0 (full history for commit analysis)
3. Run semantic-release with GITHUB_TOKEN
4. Ensure workflow has contents: write for creating releases and tags

**Done:** Push to main triggers semantic-release; new version created when commits warrant it.

---

### Task 4: Sync package.json Version

**Files:** `package.json`

**Action:**

1. Set initial version to current (e.g. 2.0.4) or leave at 0.0.0 for first semantic-release run
2. Document that first release will establish version from commit history

**Done:** package.json ready for semantic-release to manage.

---

## Verification

- [x] Login page shows version from package.json
- [x] fix: commit → patch bump on next push to main
- [x] feat: commit → minor bump on next push to main
- [x] chore: commit → no new release
- [x] feat!: or BREAKING CHANGE → major bump (manual trigger)
- [x] `npm run build` and `npm run test:run` pass
