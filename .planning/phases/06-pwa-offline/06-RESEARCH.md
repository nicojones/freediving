# Phase 6: PWA + Offline — Research

**Phase:** 6. PWA + Offline  
**Researched:** 2025-03-19  
**Sources:** STACK.md, ARCHITECTURE.md, PITFALLS.md, 6-CONTEXT.md, WebSearch, Chrome Workbox docs

---

## Summary

Phase 6 makes the Freediving Breathhold Trainer installable as a PWA, functional offline, and ensures audio cues play without network. Key deliverables: **vite-plugin-pwa** with Workbox precache + RangeRequestsPlugin for m4a audio, **offline completion queue** (IndexedDB) with sync-on-online, **manifest** (standalone, icons 192/512), **install prompt** on dashboard after engagement, and **responsive validation** (touch targets, safe-area). iOS has known limitations: audio stops on screen lock in standalone mode; document and prioritize Android.

---

## Key Findings

### 1. vite-plugin-pwa Setup for Vite 8

| Finding | Source |
|---------|--------|
| vite-plugin-pwa v0.21.1+ supports Vite 6 | vite-pwa-org changelog |
| Vite 8 support tracked in GitHub issue #918 (Mar 2026) | WebSearch |
| Plugin may work with Vite 8 even if not officially tested | — |
| Workbox 7.3.0 from v0.21.0 | Changelog |

**Implementation:** Install `vite-plugin-pwa` (latest). If Vite 8 causes build errors, options: (a) downgrade to Vite 6/7 temporarily, (b) use PR/branch with Vite 8 fixes, (c) check plugin releases for explicit Vite 8 support. STACK.md recommends ^1.2; npm shows v1.2.0 (Nov 2025). Verify compatibility before Phase 6 start.

**Config skeleton (vite.config.ts):**
```ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
        // Audio precache + RangeRequestsPlugin — see Finding 2
      },
    }),
  ],
})
```

---

### 2. Workbox Precache + RangeRequestsPlugin for m4a Audio

| Finding | Source |
|---------|--------|
| Browsers use range requests for media; runtime caching fails | Chrome Workbox docs |
| Must precache audio explicitly; CacheFirst + RangeRequestsPlugin | Chrome, STACK.md |
| CacheableResponsePlugin: statuses [200] — cache full responses, not 206 | Chrome docs |
| crossorigin="anonymous" required on audio elements | ARCHITECTURE Pattern 2 |

**Audio files:** `hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a` in `public/audio/`.

**Workbox config:**
```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,m4a}'],
  additionalManifestEntries: [
    { url: '/audio/hold.m4a', revision: null },
    { url: '/audio/prepare.m4a', revision: null },
    { url: '/audio/30s.m4a', revision: null },
    { url: '/audio/breathe.m4a', revision: null },
  ],
  runtimeCaching: [{
    urlPattern: /\.(m4a|mp3|wav|ogg)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'audio-cache',
      expiration: { maxEntries: 50 },
      cacheableResponse: { statuses: [200] },
      rangeRequests: true,  // RangeRequestsPlugin equivalent in vite-plugin-pwa
    },
  }],
}
```

**Pitfall (Workbox #3288):** Audio elements with `preload="auto"` can trigger range requests before precache completes, causing 206 responses that fail to cache. Mitigation: ensure precache runs at SW install; audioService already uses `preload()` before session start—validate after SW is active.

**Current state:** audioService.ts already sets `crossorigin="anonymous"` on Audio elements. No changes needed there.

---

### 3. Offline Completion Queue and Sync-on-Online

| Finding | Source |
|---------|--------|
| Store pending completions in IndexedDB; survives refresh | 6-CONTEXT, WebSearch |
| On `online` event or app load: flush queue to /api/progress | 6-CONTEXT |
| Single device, last-write-wins; no conflict resolution | 6-CONTEXT |
| idb or Dexie.js for Promise-based IndexedDB | WebSearch |

**Queue schema (minimal):**
```ts
// IndexedDB store: pending_completions
// { plan_id, day_index, completed_at, created_at }
```

**Flow:**
1. On `recordCompletion` call: if offline, push to IndexedDB queue; return success locally.
2. On app load: check `navigator.onLine`; if online, process queue.
3. On `window.addEventListener('online')`: process queue.
4. For each queued item: POST to `/api/progress`; on success, remove from queue.
5. After sync: refetch completions to update UI.

**Libraries:** `idb` (lightweight, ~1KB) or `Dexie.js` (richer API). For a simple queue, `idb` is sufficient.

**Auth:** 6-CONTEXT: "If session expires while offline, user can still run sessions; completion syncs when they log in again on next visit." Queue items are user-agnostic; backend uses cookie/session. Ensure `credentials: 'include'` on sync POST.

**Deferred:** Background Sync API — 6-CONTEXT says "simple sync on load / when online is sufficient." No need for Background Sync in v1.

---

### 4. iOS PWA Behavior: minimal-ui vs standalone, Screen Wake Lock, NoSleep.js

| Finding | Source |
|---------|--------|
| Audio stops when screen locks in standalone mode | PITFALLS 1, WebSearch |
| minimal-ui opens with address bar; may allow background audio in some iOS versions | PITFALLS, Stack Overflow |
| minimal-ui support inconsistent; can fall back to browser mode | PITFALLS |
| Screen Wake Lock API: WebKit bug #254545 fixed in iOS 18.4 | WebSearch |
| NoSleep.js: wakeLock fails in iOS PWA until 18.4; video fallback works in Safari | GitHub issues |

**Recommendation (6-CONTEXT):** Use `display: "standalone"` as default. Document iOS limitation: "Keep screen on or use Android for best experience." Optional: test `display_override: ["minimal-ui", "standalone"]` — if Safari opens with address bar, background audio may work; document as experimental.

**Screen Wake Lock:** Consider adding during active session to prevent screen sleep. iOS 18.4+ supports it in PWA. For older iOS, NoSleep.js video trick may help but adds complexity. Defer to Polish phase if needed.

---

### 5. Manifest and Installability

| Field | Value |
|-------|-------|
| name | Submerged — Breathhold Protocol |
| short_name | Submerged |
| theme_color | #52dad3 (primary) |
| background_color | #0d1416 (background) |
| display | standalone |
| start_url | / |
| icons | 192×192, 512×512 (PNG, maskable optional) |

**Install criteria (Chrome):** HTTPS, manifest, SW, icons, start_url. `beforeinstallprompt` fires when criteria met and app not already installed.

**iOS:** No `beforeinstallprompt`; users add via Share → Add to Home Screen. Provide manual instructions in UI: "Add to Home Screen" with Safari-specific steps.

---

### 6. beforeinstallprompt and Install Prompt UX

| Finding | Source |
|---------|--------|
| beforeinstallprompt only in Chromium (Chrome, Edge); not Safari/iOS | MDN, web.dev |
| event.preventDefault() to capture; event.prompt() on user gesture | MDN |
| prompt() can only be called once per captured event | web.dev |
| Show after user engagement (e.g. after first session) | 6-CONTEXT |

**Implementation:**
```ts
let deferredPrompt: BeforeInstallPromptEvent | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // Show install banner/button when appropriate
})

// On user click (e.g. "Install" button):
if (deferredPrompt) {
  await deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
}
```

**Placement:** Dashboard (6-CONTEXT). Show after first successful session or when `deferredPrompt` is set and user has interacted. Dismissible; don't re-show aggressively.

---

### 7. Responsive Validation (PWA-04)

| Rule | Current State | Action |
|------|---------------|--------|
| viewport meta | `width=device-width, initial-scale=1.0, viewport-fit=cover` | ✓ Present |
| Touch targets (Stop/Emergency) | UI-SPEC: min `xl` | Validate ActiveSessionView Stop button |
| Safe-area | BottomNavBar has `pb-safe` | ✓ Present |
| min-height | `max(884px, 100dvh)` in index.css | ✓ Present |
| 320px–tablet | max-w-2xl, px-6/8 | Validate at 320px viewport |

**Tailwind:** `min-w-[2.5rem] min-h-[2.5rem]` or `min-w-10 min-h-10` for 40px touch targets. UI-SPEC says "min xl" — Tailwind `xl` = 36px (2.25rem); 44px is often recommended for touch. Use `min-w-11 min-h-11` (44px) for critical buttons.

**Validation:** Test on 320px width (iPhone SE), 375px, 768px. Use Chrome DevTools device emulation.

---

## Implementation Notes

### New / Modified Modules

| Module | Purpose |
|--------|---------|
| vite.config.ts | Add VitePWA plugin, manifest, workbox (precache + audio runtimeCache) |
| public/icons/ | icon-192.png, icon-512.png |
| offlineQueue.ts (or similar) | IndexedDB queue for completions; sync when online |
| progressService.ts | Wrap recordCompletion: if offline, queue; if online, POST; on load, flush queue |
| InstallPrompt component | Listen beforeinstallprompt; show "Install" after engagement |
| index.html | Link manifest (plugin may inject automatically) |

### Offline Queue API (proposed)

```ts
// offlineQueue.ts
export async function queueCompletion(planId: string, dayIndex: number): Promise<void>
export async function flushQueue(): Promise<{ synced: number; failed: number }>
export async function getPendingCount(): Promise<number>
```

### Progress Service Integration

```ts
// In recordCompletion:
if (!navigator.onLine) {
  await queueCompletion(planId, dayIndex)
  return { ok: true }  // Optimistic
}
const result = await fetch(...)
// On app init + online event: await flushQueue(); refetch completions
```

### Register Service Worker

vite-plugin-pwa with `registerType: 'autoUpdate'` auto-registers. Ensure `workbox-window` or plugin's `registerSW` is called in main.tsx if using prompt-for-update flow. Default `autoUpdate` skips user prompt.

---

## Pitfalls to Avoid

| Pitfall | Mitigation |
|---------|------------|
| **Pitfall 1: iOS audio stops on lock** | Document limitation; use standalone; prioritize Android testing |
| **Pitfall 4: Offline audio 206/cache** | Precache audio; RangeRequestsPlugin; validate before session |
| **Runtime caching of audio** | Precache at SW install; runtimeCache as fallback only |
| **beforeinstallprompt on iOS** | Not available; provide manual "Add to Home Screen" instructions |
| **Queue sync without auth** | Backend uses cookie; ensure credentials: 'include' on sync POST |
| **Fonts offline** | Google Fonts may fail; 6-CONTEXT defers; use system font fallback |
| **Vite 8 + vite-plugin-pwa** | Verify build; have downgrade path if incompatible |

---

## Gaps / Deferred

- **Vite 8 compatibility:** Confirm vite-plugin-pwa works with Vite 8; issue #918 open. Fallback: Vite 6/7.
- **Font bundling for offline:** Google Fonts may fail offline; acceptable for v1 (system fallback).
- **Background Sync API:** Not needed for v1; sync on load/online sufficient.
- **minimal-ui testing:** Optional; document as experimental if tested.
- **Screen Wake Lock / NoSleep.js:** Consider for Polish phase; iOS 18.4+ supports Wake Lock in PWA.
- **Multi-device conflict:** Single device assumed; last-write-wins.

---

## Sources

- STACK.md — vite-plugin-pwa ^1.2, Workbox 7.x, RangeRequestsPlugin, globPatterns, runtimeCaching
- ARCHITECTURE.md — Pattern 2 (Audio main thread, SW cache), Pattern 4 (event-driven cues)
- PITFALLS.md — Pitfall 1 (iOS audio), Pitfall 4 (offline audio 206), Pitfall 2 (timer suspended)
- 6-CONTEXT.md — Offline queue, install prompt placement, manifest, responsive scope
- [Chrome: Serving cached audio and video (Workbox)](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video)
- [Chrome: workbox-range-requests](https://developer.chrome.com/docs/workbox/modules/workbox-range-requests)
- [vite-plugin-pwa changelog](https://vite-pwa-org.netlify.app/guide/change-log)
- [MDN: Trigger installation from your PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt)
- [web.dev: Installation prompt](https://web.dev/learn/pwa/installation-prompt)
- WebSearch: vite-plugin-pwa Vite 8, Workbox RangeRequestsPlugin m4a, iOS PWA minimal-ui, offline queue IndexedDB sync, beforeinstallprompt, Screen Wake Lock NoSleep.js iOS
