# Phase 17: Test Controls — Context

**Created:** 2025-03-20  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 17. Test Controls

---

## Decisions

### 1. Dev Mode Toggle (Settings)

- **Placement:** Settings page, new section or row (e.g. "Developer" or "Dev mode").
- **Label:** "Show test controls" or "Dev mode" — when checked, test controls appear on other pages.
- **Visibility:** All users can see and toggle it.
- **Default:** OFF (unchecked).

### 2. Test Controls Visibility

- **Definition:** The test toggle in SessionPreviewSection ("Test mode — shorten relaxation to 3s for faster testing").
- **Rule:** Test controls are visible only when dev mode toggle in Settings is checked.
- **When unchecked:** Test controls are invisible on all pages (session preview, etc.). The test toggle is not rendered.

### 3. Persistence

- **Storage:** `localStorage` (key e.g. `freediving_dev_mode`).
- **Rationale:** Client-side preference; no backend change needed.

---

## Code Context

- **User:** `useTraining().user` → `{ id, username }`
- **Test toggle:** `SessionPreviewSection` receives `testMode`, `onTestModeChange` from `TrainingContext` via `Dashboard`
- **Settings:** `SettingsView` has `PlanSelectorSection`, `ResetProgressSection`, `UserProfileCard`
- **TrainingContext:** `testMode` state, `setTestMode`; `relaxationSecondsOverride: testMode ? 3 : undefined` passed to session engine
- **No user restriction:** All users can toggle dev mode; test controls are gated by dev mode only.

---

## Out of Scope for Phase 17

- Adding new test controls beyond the existing test toggle
- Server-side enforcement (test controls are UI-only; relaxation override is client-side)
