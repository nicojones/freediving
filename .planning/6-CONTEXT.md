# Phase 6: PWA + Offline — Context

**Created:** 2025-03-19  
**Purpose:** Implementation decisions for research and planning.  
**Phase:** 6. PWA + Offline

---

## Decisions

### Offline Behavior for API Features (PWA-02)

- **Queue and sync:** When offline, allow session completion. Queue the completion locally; sync to backend when back online.
- **Single device:** User uses one device at a time. No conflict resolution needed — last-write-wins is acceptable.
- **Auth:** User must log in when online. No offline login. If session expires while offline, user can still run sessions; completion syncs when they log in again on next visit.
- **Completions while offline:** Store in local queue (e.g. IndexedDB or in-memory + localStorage fallback). On app load or when network returns, flush queue to `/api/progress`.

### Install Prompt UX (PWA-01)

- **Placement:** Dashboard (homepage). Show install prompt or "Add to Home Screen" affordance on the main training view.
- **Timing:** After user is engaged — e.g. after first successful session, or when `beforeinstallprompt` fires and user has interacted. Avoid showing on first-ever visit before they've used the app.
- **Dismissal:** User can dismiss; don't re-show aggressively. Respect `beforeinstallprompt` availability (not all browsers/situations show it).

### Responsive Layout (PWA-04)

- **Scope:** App is already mobile-first (Tailwind, `max-w-2xl`, `px-6`, viewport meta). Phase 6 validates and polishes — no major layout overhaul.
- **Validation:** Ensure touch targets meet UI-SPEC (min `xl` for Stop/Emergency), safe-area insets (`pb-safe` where needed), and layout works on small phones (320px) and tablets.

### Manifest & Display Mode (PWA-01)

- **Manifest:** Required. Include name, short_name, icons, theme_color, background_color, start_url, display.
- **Display mode:** `standalone` — full-screen app experience, no browser chrome. Per PITFALLS: `minimal-ui` can help iOS background audio in some versions, but support is inconsistent. Use `standalone` as default; document iOS limitation ("Keep screen on or use Android for best experience").
- **Icons:** Provide 192×192 and 512×512 for installability. Use Submerged branding (waves, primary color).

### Audio Precaching (PWA-03)

- **Files:** `public/audio/hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a` (per 4-CONTEXT).
- **Strategy:** Precache at service worker install. Use Workbox `RangeRequestsPlugin` for audio (browsers use range requests; 206 responses must be handled).
- **Validation:** Audio availability check before session start remains (4-CONTEXT); precache ensures offline playback.

---

## Out of Scope for Phase 6

- Multi-device conflict resolution — single device assumed
- Offline login — must be online to authenticate
- Font bundling for offline — Google Fonts may fail offline; acceptable for v1 (fallback to system fonts)
- Background Sync API for completion queue — simple "sync on load / when online" is sufficient

---

## Traceability

| Requirement | Decision                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| PWA-01      | Manifest with standalone; install prompt on dashboard after engagement   |
| PWA-02      | App loads offline; completions queued and synced when online             |
| PWA-03      | Audio precached at SW install; RangeRequestsPlugin for m4a               |
| PWA-04      | Validate mobile-first; touch targets, safe-area; no major layout changes |

---

## Code Context

- **Plan:** Bundled via import (`src/data/default-plan.json`) — works offline.
- **Auth:** `src/services/authService.ts` — `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`.
- **Progress:** `src/services/progressService.ts` — `fetchCompletions`, `recordCompletion` → `/api/progress`.
- **Audio:** `src/services/audioService.ts` — `/audio/hold.m4a`, etc. (Vite serves from `public/`).
- **Build:** Vite 8, no PWA plugin yet. Add `vite-plugin-pwa` per STACK.md.
- **index.html:** viewport meta present; fonts from Google CDN.
- **UI-SPEC:** Touch targets min `xl`; `pb-safe` for bottom nav; `min-height: max(884px, 100dvh)`.

---

_Context captured from /gsd-discuss-phase 6_
