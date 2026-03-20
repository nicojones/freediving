# Phase 6: PWA + Offline — Executable Plan

---

phase: 06-pwa-offline
plans:

- id: "01"
  tasks: 4
  files: 10
  depends_on: [05-session-runner]
  type: execute
  wave: 1
  files_modified:
- vite.config.ts
- package.json
- public/icons/icon-192.png
- public/icons/icon-512.png
- src/services/offlineQueue.ts
- src/services/progressService.ts
- src/contexts/TrainingContext.tsx
- src/components/InstallPrompt.tsx
- src/pages/Dashboard.tsx
- index.html
  autonomous: true
  requirements: [PWA-01, PWA-02, PWA-03, PWA-04]
  user_setup: []
  must_haves:
  truths: - "User can install the app as a PWA (Add to Home Screen)" - "App loads and functions when offline" - "Audio cue files play when offline (precached)" - "Layout is responsive and mobile-first"
  artifacts: - path: vite.config.ts
  provides: "VitePWA plugin, manifest, workbox precache + audio"
  contains: "VitePWA|workbox|manifest" - path: src/services/offlineQueue.ts
  provides: "IndexedDB queue for completions; sync when online"
  contains: "queueCompletion|flushQueue|getPendingCount" - path: src/services/progressService.ts
  provides: "recordCompletion with offline queue fallback"
  contains: "navigator.onLine|queueCompletion" - path: src/components/InstallPrompt.tsx
  provides: "Install prompt on Dashboard after engagement"
  contains: "beforeinstallprompt|Add to Home Screen"
  key_links: - from: src/contexts/TrainingContext.tsx
  to: src/services/progressService.ts
  via: "recordCompletion on session_complete"
  pattern: "recordCompletion" - from: vite.config.ts
  to: "Service Worker"
  via: "VitePWA plugin auto-registers SW"
  pattern: "VitePWA|registerType" - from: vite.config.ts
  to: public/audio/\*.m4a
  via: "workbox additionalManifestEntries"
  pattern: "hold.m4a|prepare.m4a|30s.m4a|breathe.m4a"

---

## Objective

Make the Freediving Breathhold Trainer installable as a PWA, functional offline, with precached audio and validated responsive layout. Users can add to home screen, run sessions without network, and completions sync when back online.

**Purpose:** Core value — user lies down, follows audio; app works offline and installs like a native app.

**Output:** vite-plugin-pwa with manifest/icons/workbox; offline completion queue (idb); InstallPrompt on Dashboard; responsive validation.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/6-CONTEXT.md
- @.planning/phases/06-pwa-offline/06-RESEARCH.md

**Existing:** Phases 1–5 complete. Vite 8, no PWA plugin. progressService.recordCompletion → POST /api/progress. TrainingContext calls recordCompletion on session_complete. Audio: hold.m4a, prepare.m4a, 30s.m4a, breathe.m4a in public/audio/. Dashboard is main training view. index.html has viewport meta; index.css has min-height max(884px, 100dvh); BottomNavBar has pb-safe.

**Design decisions (from 6-CONTEXT):**

- Offline: queue completions in IndexedDB; flush on load or online event; credentials: 'include' on sync POST
- Install prompt: Dashboard, after engagement; beforeinstallprompt only on Chromium; iOS: manual "Add to Home Screen" instructions
- Manifest: standalone, theme_color #52dad3, background_color #0d1416
- Audio: precache at SW install; RangeRequestsPlugin for m4a
- Responsive: validate touch targets (min 44px), safe-area, 320px viewport

**Vite 8 compatibility:** vite-plugin-pwa may not officially support Vite 8. Install latest (^1.2.0). If build fails, note in task and fallback: downgrade Vite to 6 or 7 temporarily.

---

## Plan 01: PWA + Offline

### Task 1: vite-plugin-pwa Setup, Manifest, Icons, Audio Precache

**Files:** `vite.config.ts`, `package.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`

**Action:**

1. Install dependencies:
   ```bash
   npm install -D vite-plugin-pwa
   npm install idb
   ```
2. Add VitePWA to `vite.config.ts`:
   - Import `{ VitePWA } from 'vite-plugin-pwa'`
   - Add to plugins array after react() and tailwindcss()
   - Config:
     ```ts
     VitePWA({
       registerType: 'autoUpdate',
       manifest: {
         name: 'Submerged — Breathhold Protocol',
         short_name: 'Submerged',
         theme_color: '#52dad3',
         background_color: '#0d1416',
         display: 'standalone',
         start_url: '/',
         icons: [
           { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
           { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
         ],
       },
       workbox: {
         globPatterns: ['**/*.{js,css,html,ico,png,svg,m4a}'],
         additionalManifestEntries: [
           { url: '/audio/hold.m4a', revision: null },
           { url: '/audio/prepare.m4a', revision: null },
           { url: '/audio/30s.m4a', revision: null },
           { url: '/audio/breathe.m4a', revision: null },
         ],
         runtimeCaching: [
           {
             urlPattern: /\.(m4a|mp3|wav|ogg)$/,
             handler: 'CacheFirst',
             options: {
               cacheName: 'audio-cache',
               expiration: { maxEntries: 50 },
               cacheableResponse: { statuses: [200] },
               rangeRequests: true,
             },
           },
         ],
       },
     });
     ```
3. Create `public/icons/` directory and add placeholder icons:
   ```bash
   mkdir -p public/icons
   curl -o public/icons/icon-192.png "https://placehold.co/192x192/52dad3/0d1416/png"
   curl -o public/icons/icon-512.png "https://placehold.co/512x512/52dad3/0d1416/png"
   ```
   (placehold.co format: WIDTHxHEIGHT/FGCOLOR/BGCOLOR/png). Or create solid-color PNGs via any image tool. Icons required for installability.
4. Ensure `index.html` does not need manual manifest link — vite-plugin-pwa injects it. Verify no conflicting link rel="manifest".

**Verify:**

```bash
npm run build
# Build must succeed. If vite-plugin-pwa errors with Vite 8, document and try: npm install vite@^6 --save-dev
```

```bash
npm run preview
# Open https://localhost:4173 (or preview URL). DevTools > Application > Manifest: name, icons, display standalone present.
# DevTools > Application > Service Workers: SW registered.
# DevTools > Application > Cache Storage: precache contains .m4a files after SW install.
# Offline session: DevTools > Network > Offline; start session; confirm hold, prepare, 30s, breathe all play.
```

**Done:** Build succeeds; manifest valid; SW registered; audio files in precache; offline session plays all cues.

---

### Task 2: Offline Queue (IndexedDB) and progressService Integration

**Files:** `src/services/offlineQueue.ts`, `src/services/progressService.ts`, `src/contexts/TrainingContext.tsx`, `src/main.tsx`

**Action:**

1. Create `src/services/offlineQueue.ts`:
   - Use `idb` (already installed in Task 1). DB name: `submerged-offline`, store: `pending_completions`
   - Schema: `{ plan_id: string, day_index: number, completed_at: number, created_at: number }`
   - Export:
     - `queueCompletion(planId: string, dayIndex: number): Promise<void>` — add to store with completed_at/created_at = Date.now()
     - `flushQueue(): Promise<{ synced: number; failed: number }>` — for each item: POST to `/api/progress` with `{ plan_id, day_index }`, credentials: 'include'; on 2xx remove from store, increment synced; on error increment failed, keep in store
     - `getPendingCount(): Promise<number>` — return store count
   - Open DB: `openDB('submerged-offline', 1, { upgrade(db) { db.createObjectStore('pending_completions', { keyPath: 'id', autoIncrement: true }) } })`. Store `{ plan_id, day_index, completed_at, created_at }` (id auto-generated).
2. Update `src/services/progressService.ts`:
   - Export return type: `{ ok: boolean; queued?: boolean }` so callers handle both `{ ok: true }` and `{ ok: true, queued: true }`.
   - In `recordCompletion`: if `!navigator.onLine`, call `queueCompletion(planId, dayIndex)`, return `{ ok: true, queued: true }`. Else keep existing fetch logic (return `{ ok: true }` on success).
   - Export `flushOfflineQueue(): Promise<void>` that calls `flushQueue()` from offlineQueue.
   - Export a function `flushOfflineQueue(): Promise<void>` that calls `flushQueue()` and does nothing with result (or optionally refetch — caller handles refetch).
3. Update `src/contexts/TrainingContext.tsx`:
   - In `session_complete` handler: when `recordCompletion` returns `{ ok: true, queued: true }`, show "Saved" and optimistically add `{ plan_id: 'default', day_index, completed_at: Math.floor(Date.now()/1000) }` to completions (setCompletions). When `{ ok: true }` without queued, fetchCompletions and setCompletions as usual.
   - Add effect: on mount, if `navigator.onLine`, call `flushOfflineQueue()` from progressService (or import flushQueue and fetchCompletions). After flush, call `fetchCompletions('default')` and `setCompletions`.
   - Add `window.addEventListener('online', () => { flushOfflineQueue(); fetchCompletions('default').then(setCompletions) })` — ensure this runs when TrainingProvider is mounted (user logged in). Cleanup on unmount.
   - **Refinement:** Create `useOfflineSync()` hook or put logic in TrainingProvider: on mount + when user exists, if online then flushQueue; on 'online' event, flushQueue and refetch completions. Wire in TrainingProvider's useEffect that runs when user is set.
4. Update `src/main.tsx`:
   - Import and call `registerSW()` from `virtual:pwa-register/react` (vite-plugin-pwa provides this). Use `registerType: 'autoUpdate'` so no prompt needed; registration happens automatically. Check vite-plugin-pwa docs: it may auto-inject registration. If so, no main.tsx change. Otherwise add:
     ```ts
     import { registerSW } from 'virtual:pwa-register/react';
     registerSW({ immediate: true });
     ```
   - Actually, vite-plugin-pwa with registerType: 'autoUpdate' injects the SW registration automatically. Only add explicit registration if we need prompt-for-update. Skip main.tsx for SW — plugin handles it.
   - For offline flush: the TrainingProvider is the right place. When `user` is truthy, we need to flush on load and on online. Add to the useEffect that fetches completions: before fetchCompletions, call flushOfflineQueue (from progressService). And add window.addEventListener('online', handler). The progressService should export `flushOfflineQueue` which calls flushQueue and returns. The TrainingContext will call it and then fetchCompletions.

**Verify:**

```bash
npm run dev
# 1. Go offline (DevTools Network > Offline). Complete a session. Expect "Saved". Check IndexedDB: pending_completions has 1 entry.
# 2. Go online. Expect queue to flush (POST to /api/progress). IndexedDB empty. Completions refetched.
# 3. Refresh page while online — completions show. Go offline, complete session — Saved. Go online — sync happens.
```

**Done:** Offline completions queued; sync on load and online; UI updates after sync.

---

### Task 3: InstallPrompt Component on Dashboard

**Files:** `src/components/InstallPrompt.tsx`, `src/pages/Dashboard.tsx`

**Action:**

1. Create `src/components/InstallPrompt.tsx`:
   - State: `deferredPrompt: BeforeInstallPromptEvent | null`, `showPrompt: boolean`, `dismissed: boolean`
   - `useEffect`: `window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); setShowPrompt(true) })`. Cleanup.
   - `useEffect`: Check `window.matchMedia('(display-mode: standalone)').matches` — if true, user already installed; setShowPrompt(false).
   - Props: `hasEngaged?: boolean` — if provided, only show when hasEngaged is true (e.g. after first session). Or use internal logic: show when deferredPrompt exists and (hasEngaged ?? true). Per 6-CONTEXT: show after engagement. Pass `hasEngaged={completions.length > 0}` from Dashboard.
   - Render: If !showPrompt || dismissed, return null. Else render a dismissible banner/card:
     - Chromium (deferredPrompt): "Install Submerged" button; onClick: `deferredPrompt.prompt()`, then `deferredPrompt.userChoice`, then setDeferredPrompt(null), setDismissed(true)
     - iOS/Safari (no beforeinstallprompt): Show "Add to Home Screen" with instructions: "Tap Share → Add to Home Screen" (or similar). Detect iOS: `navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')`.
   - Dismiss button: setDismissed(true). Store dismissed in sessionStorage so we don't re-show this session: `sessionStorage.setItem('install-prompt-dismissed', '1')` on dismiss; check on mount.
   - Placement: Non-intrusive. Per 6-CONTEXT: Dashboard. Render at top of main content or as a subtle card. Not blocking.
2. Add `<InstallPrompt hasEngaged={completions.length > 0} />` to `src/pages/Dashboard.tsx`. Place after TopAppBar or at top of main, before day list. Only show when `!showSessionPreview` (dashboard view) so it doesn't compete with session preview.

**Verify:**

```bash
npm run build && npm run preview
# Chrome: Open in non-installed state. beforeinstallprompt fires. Install banner/button appears. Click Install → install flow. After install, prompt hidden.
# iOS Safari: Manual instructions visible when no beforeinstallprompt. Dismiss works.
```

**Done:** Install prompt on Dashboard; Chromium install flow; iOS manual instructions; dismissible.

---

### Task 4: Responsive Validation (PWA-04)

**Files:** `src/components/ActiveSessionView.tsx`, `src/pages/Dashboard.tsx`, `src/components/BottomNavBar.tsx`, `src/components/PrimaryButton.tsx` (if exists)

**Action:**

1. Validate viewport: `index.html` has `width=device-width, initial-scale=1.0, viewport-fit=cover` — ✓
2. Validate touch targets (UI-SPEC: min 44px for critical actions):
   - ActiveSessionView "Abort Session" button: currently `h-24` (96px) — exceeds 44px ✓
   - BottomNavBar tabs: `px-6 py-2` — ensure tap area ≥ 44px. Add `min-h-[44px] min-w-[44px]` or equivalent to tab buttons if needed.
   - PrimaryButton (Start Session): Check `PrimaryButton.tsx` — ensure min 44px height/width for touch.
   - Back buttons on Dashboard: `px-4 py-2` — add `min-h-11 min-w-11` (44px) for the icon+text area if it's a single touch target.
3. Validate safe-area: BottomNavBar has `pb-safe` ✓. Check any fixed bottom elements.
4. Validate 320px viewport: Open DevTools device emulation, iPhone SE (320px). Verify:
   - No horizontal overflow
   - Day cards readable
   - Start Session button accessible
   - BottomNavBar not cut off
   - Add `min-w-0` or `overflow-hidden` where text might overflow. Use `max-w-2xl mx-auto px-6` — at 320px, px-6 = 24px each side, content ~272px. Test.
5. Document any fixes in task. If all pass, add a brief validation note. If issues found, fix them.

**Verify:**

```bash
npm run dev
# Chrome DevTools > Toggle device toolbar. Test:
# - 320px (iPhone SE): Layout works, no overflow, touch targets tappable
# - 375px (iPhone 14): Same
# - 768px (tablet): Same
# - ActiveSessionView Abort button: min 44px tap target ✓
# - BottomNavBar: pb-safe visible on devices with notch
```

**Done:** Touch targets ≥ 44px; safe-area applied; 320px–768px layout validated.

---

## Verification

| Success Criterion     | How to Verify                                                                |
| --------------------- | ---------------------------------------------------------------------------- |
| PWA-01: Installable   | Chrome: Add to Home Screen; manifest valid; icons present                    |
| PWA-02: Works offline | DevTools Offline; app loads; session runs; completions queue                 |
| PWA-03: Audio offline | DevTools Offline; start session; all cues play (hold, prepare, 30s, breathe) |
| PWA-04: Responsive    | 320px, 375px, 768px; touch targets 44px; safe-area                           |
| Offline sync          | Complete offline → go online → completions sync to backend                   |

---

## Success Criteria

1. **User can install the app as a PWA** — ✓ Manifest, icons, install prompt on Dashboard
2. **App loads and functions when offline** — ✓ Precached assets; offline queue for completions
3. **Audio cue files play when offline** — ✓ Precached in workbox; RangeRequests for m4a
4. **Layout is responsive and mobile-first** — ✓ Validated at 320px–768px; touch targets; safe-area

---

## Output

After completion:

- `vite.config.ts` — VitePWA, manifest, workbox precache + audio
- `public/icons/icon-192.png`, `icon-512.png`
- `src/services/offlineQueue.ts` — queueCompletion, flushQueue, getPendingCount
- `src/services/progressService.ts` — offline fallback in recordCompletion
- `src/contexts/TrainingContext.tsx` — flush on load + online event
- `src/components/InstallPrompt.tsx` — install prompt, iOS instructions
- `src/pages/Dashboard.tsx` — InstallPrompt integration
- Responsive validation applied

---

## Dependency Graph

```
Task 1 (vite-plugin-pwa, manifest, icons, audio precache)
    │
    ├──> Task 2 (offline queue) — independent, parallel
    │
    └──> Task 3 (InstallPrompt) — needs Task 1 for installability
              │
              └──> Task 4 (responsive validation) — independent
```

**Wave 1:** Task 1, Task 2, Task 4 (parallel)
**Wave 2:** Task 3 (after Task 1)
