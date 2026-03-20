# Phase 6: PWA + Offline — Validation

**Phase:** 6. PWA + Offline  
**Plan:** 6-PLAN.md  
**Purpose:** Automated and manual verification of Phase 6 success criteria.

---

## Success Criteria

1. User can install the app as a PWA (Add to Home Screen)
2. App loads and functions when offline
3. Audio cue files play when offline (precached)
4. Layout is responsive and mobile-first

---

## Verification Commands

### Build & Preview

```bash
npm run build
# Expect: Build succeeds. No vite-plugin-pwa errors.

npm run preview
# Expect: Server starts. Open https://localhost:4173 (or preview URL).
```

### PWA-01: Installable

1. Open app in Chrome (non-installed state).
2. DevTools > Application > Manifest: `name`, `short_name`, `icons` (192×192, 512×512), `display: standalone` present.
3. DevTools > Application > Service Workers: SW registered.
4. Install prompt appears on Dashboard after engagement (`completions.length > 0`).
5. Click Install → install flow completes.
6. After install, prompt hidden (standalone mode).

### PWA-02: Works Offline

1. DevTools > Network > Offline.
2. Refresh page. App loads (shell + assets from precache).
3. Complete a session. Expect "Saved".
4. DevTools > Application > IndexedDB > `submerged-offline` > `pending_completions`: 1 entry.
5. DevTools > Network > Online.
6. Queue flushes (POST to /api/progress). IndexedDB empty. Completions refetched.

### PWA-03: Audio Offline

1. DevTools > Network > Offline.
2. DevTools > Application > Cache Storage: precache contains `hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a`.
3. Start session. All four cues play: hold, prepare (10s before hold), 30s (when recovery ≥31s), breathe (at hold end).
4. Session completes without network errors.

### PWA-04: Responsive

1. Chrome DevTools > Toggle device toolbar.
2. Test viewports: 320px (iPhone SE), 375px (iPhone 14), 768px (tablet).
3. No horizontal overflow; day cards readable; Start Session button accessible; BottomNavBar not cut off.
4. Touch targets ≥ 44px: ActiveSessionView Abort, PrimaryButton, BottomNavBar tabs.
5. Safe-area: `pb-safe` on BottomNavBar visible on devices with notch.

---

## Automated Checks (Optional)

If Nyquist or CI runs validation:

```bash
# Build must succeed
npm run build

# Lint must pass
npm run lint
```

---

## Traceability

| Requirement | Verification                                                  |
| ----------- | ------------------------------------------------------------- |
| PWA-01      | Manifest valid; SW registered; Install prompt; install flow   |
| PWA-02      | Offline load; session runs; completions queue; sync on online |
| PWA-03      | Precached audio; offline session; all cues play               |
| PWA-04      | 320px–768px; touch targets 44px; safe-area                    |
