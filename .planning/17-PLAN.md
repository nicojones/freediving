# Phase 17: Test Controls — Executable Plan

---
phase: 17-test-controls
plans:
  - id: "01"
    tasks: 4
    depends_on: [16-alias-imports-component-folders-tests]
type: execute
wave: 1
autonomous: false
requirements: []
must_haves:
  truths:
    - "Settings has dev mode toggle (visible to all users)"
    - "When dev mode unchecked, test controls invisible on all pages"
    - "Dev mode default is OFF"
    - "Dev mode preference persisted in localStorage"
---

## Objective

Add a Settings toggle (dev mode) to show/hide test controls. When unchecked, test controls are invisible on all pages. All users can toggle dev mode.

**Purpose:** Developer experience — users can enable test controls for faster iteration when needed.

**Principles:**
- Dev mode toggle in Settings, visible to all users
- localStorage for persistence (`freediving_dev_mode` or similar)
- Default: dev mode off (test controls hidden)

---

## Context

- @.planning/17-CONTEXT.md
- @.planning/PROJECT.md

**Existing:** Phase 8 added test toggle in SessionPreviewSection. TrainingContext holds `testMode` state; `relaxationSecondsOverride: testMode ? 3 : undefined` passed to session engine. User from `useTraining().user`.

---

## Plan 01: Test Controls Gating

### Task 1: Dev Mode Preference

**Files:** `src/hooks/useDevMode.ts` (new), or `src/utils/devMode.ts` + hook

**Action:**
1. Define localStorage key (e.g. `freediving_dev_mode`)
2. Create hook `useDevMode()` that returns `[devModeEnabled: boolean, setDevModeEnabled: (v: boolean) => void]`
3. Read from localStorage on mount; write on change
4. Default: `false`

**Done:** Hook available; preference persists across reloads.

---

### Task 2: Dev Mode Toggle in Settings

**Files:** `src/components/settings/SettingsView.tsx`, optionally `src/components/settings/DevModeSection.tsx`

**Action:**
1. Add dev mode toggle to Settings page
2. Label: "Dev mode" or "Show test controls" — "Show test controls on session preview for faster testing"
3. Wire to `useDevMode()` hook
4. Place after ResetProgressSection or in a small "Developer" section

**Done:** All users see toggle in Settings.

---

### Task 3: Gate Test Controls

**Files:** `src/views/Dashboard.tsx`, `src/components/session/SessionPreviewSection.tsx`, `src/contexts/TrainingContext.tsx`

**Action:**
1. In Dashboard (or TrainingContext): compute `showTestControls = devModeEnabled`
2. Pass `showTestControls` to SessionPreviewSection (or derive inside)
3. SessionPreviewSection: render the test toggle block only when `showTestControls`
4. When `showTestControls` is false: pass `testMode={false}` (or equivalent) so session never uses relaxation override
5. TrainingContext: when `!showTestControls`, treat testMode as false for session engine (ensure `relaxationSecondsOverride` is never set)

**Done:** Test controls invisible when dev mode off; session uses normal relaxation.

---

### Task 4: Tests

**Files:** `src/components/settings/DevModeSection.test.tsx` (if extracted), `src/hooks/useDevMode.test.ts`, E2E

**Action:**
1. Unit test: `useDevMode` reads/writes localStorage correctly
2. Unit test: Dev mode section/toggle renders for any user
3. E2E (optional): Login → Settings → toggle dev mode → session preview shows/hides test toggle

**Done:** Tests pass; coverage for gating logic.

---

## Verification

- [ ] All users see dev mode toggle in Settings
- [ ] Dev mode ON: test toggle visible on session preview
- [ ] Dev mode OFF (default): test toggle invisible
- [ ] Dev mode preference persists after reload
- [ ] `npm run build` and `npm run test:run` pass
