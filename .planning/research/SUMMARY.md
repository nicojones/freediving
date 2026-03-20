# Research Summary

**Project:** Freediving Breathhold Trainer PWA  
**Synthesized:** 2025-03-19  
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

The Freediving Breathhold Trainer is a PWA that guides users through hold/breathe intervals via audio cues while they lie down with eyes closed. Experts in meditation timers, interval timers, and breathhold training converge on a clear pattern: audio-driven, offline-first, minimal-friction UX. The recommended approach is React + Vite + TypeScript for the UI, vite-plugin-pwa with Workbox for offline, @webreflection/sql.js for SQLite persistence, and a pure state-machine Timer Engine that emits events to an Audio Service. The architecture must separate timing logic from side effects (audio, persistence) to keep cues accurate and testable.

The main risks are platform-specific: iOS suspends PWA audio and timers when the screen locks—a deal-breaker for eyes-closed use. Mitigation: document the limitation, prioritize Android, and use Date-based elapsed time plus local notifications for critical cues where possible. Offline audio requires explicit precaching and RangeRequestsPlugin; runtime caching fails for media. Timer drift must be avoided by using Web Audio API scheduling or Date-based elapsed time, not setInterval.

---

## Key Findings

### From STACK.md

| Technology            | Version | Rationale                                                       |
| --------------------- | ------- | --------------------------------------------------------------- |
| React                 | 19.x    | Mature ecosystem; Actions for async flows. Vue 3 equally valid. |
| Vite                  | 6.x     | Fast HMR, PWA plugin support, standard for modern PWAs.         |
| TypeScript            | 5.x     | Type safety for session logic and SQL schema.                   |
| vite-plugin-pwa       | ^1.2    | Zero-config PWA; Workbox under the hood.                        |
| Workbox               | 7.x     | RangeRequestsPlugin required for offline audio.                 |
| @webreflection/sql.js | latest  | SQLite in browser with IndexedDB persistence; no COOP/COEP.     |
| Tailwind CSS          | 4.x     | Mobile-first, zero-runtime.                                     |
| Kysely                | ^0.27   | Optional type-safe SQL if schema grows.                         |
| date-fns              | ^4.x    | Date handling for "current day" logic.                          |

**Critical:** Precache audio; use `RangeRequestsPlugin` and `CacheFirst` for audio routes. Add `crossorigin="anonymous"` to `<audio>`. Avoid SQLocal (COOP/COEP), runtime-only audio caching, Web Audio API for simple cues, localStorage for progress.

### From FEATURES.md

**Table stakes:** Audio cues for phase transitions, offline operation, screen-off/background operation (with PWA caveats), customizable session structure (JSON plans), reliable cue timing, quick start (minimal taps), quality user-provided audio, session completion recording, "what's next" / current day logic, installable PWA, responsive mobile-first layout.

**Differentiators:** Hands-free eyes-closed operation, admin-managed JSON plans, pre-defined profiles (no registration). Defer: voice announcements, haptic feedback (consider), music ducking, CO2/O2 auto-calculation, HR/SpO₂, progress charts.

**Anti-features:** No registration, no records/best times, no in-app plan editor, no audio generation, no social features, minimal notifications, no paywall on core timer, no algorithm-chosen content, offline without account, no ads during session.

**MVP order:** Audio cues → Session structure from JSON → "What's next" → Completion recording → Offline PWA → Responsive layout.

### From ARCHITECTURE.md

**Components:** Profile Service, Plan Service, Timer Engine, Audio Service, Progress Service, Session Runner (UI), Plan/Day Selector (UI), Service Worker.

**Patterns:**

1. **Timer as pure state machine** — States: IDLE | RECOVERY | HOLD | COMPLETE. Events: phase_start, prepare_hold, countdown_30, hold_end, session_complete. Subscribers handle audio/persistence; no side effects in engine.
2. **Audio in main thread, cache in SW** — Main thread plays via HTML5 Audio; SW only caches and serves. Precache audio; RangeRequestsPlugin for media.
3. **SQLite via sql.js + IndexedDB** — Export/restore pattern; save after writes, on periodic interval, beforeunload.
4. **Event-driven cue triggers** — Timer emits events; Audio Service maps to cue files. No polling.

**Anti-patterns:** SW playing audio, runtime caching of audio, timer logic mixed with side effects, localStorage for SQLite.

**Build order:** Plan Service → Progress Service → Profile Service → Timer Engine → Audio Service → Session Runner → Plan/Day Selector → Service Worker + PWA.

### From PITFALLS.md

**Critical:**

1. **iOS PWA audio stops on screen lock** — Document limitation; test minimal-ui; prioritize Android.
2. **Timer stops when suspended** — Use local notifications for cues; Date-based elapsed time; avoid setInterval for progression.
3. **JS timer drift** — Use Web Audio API for cue scheduling or Date-based elapsed; never setInterval for precision.
4. **Offline audio fails** — Preload at install; RangeRequestsPlugin; validate before session.
5. **Unsafe training tables** — Validate hold/recovery ratios; document safe percentages; safety disclaimer.
6. **Cue during hold** — Strict state machine; HOLD → no cues; test recovery 30s/31s/32s edge cases.

**Moderate:** Audio conflict with other apps; decision fatigue (default to current day, one-tap start); missing/corrupt audio files.

**Minor:** Volume not adjustable; no feedback when session completes.

---

## Implications for Roadmap

### Suggested Phase Structure

| Phase                                     | Rationale                                                | Delivers                                                                  | Pitfalls to Avoid                                           |
| ----------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **1. Plan Service + JSON schema**         | Session structure is backbone; everything depends on it. | Load plans, parse hold/breathe intervals, resolve "current day".          | —                                                           |
| **2. Progress + Profile Services**        | Completion and user context before Timer.                | SQLite schema, per-user per-day completion, profile selection.            | localStorage for persistence.                               |
| **3. Timer Engine**                       | Pure logic, no UI. Depends on Plan Service.              | State machine, event emission, Date-based elapsed time.                   | setInterval drift; side effects in engine; cue during hold. |
| **4. Audio Service**                      | Cue playback; no timer dependency yet.                   | Preload, play on event, HTML5 Audio.                                      | SW playing audio; runtime caching.                          |
| **5. Session Runner + Plan/Day Selector** | Orchestration and selection UI.                          | Start/stop, wire Timer→Audio→Progress; profile/day pick, session preview. | Decision fatigue; no "session complete" feedback.           |
| **6. PWA + Offline**                      | Infrastructure last; asset list stable.                  | Service worker, precache, manifest, RangeRequestsPlugin for audio.        | iOS audio limitation; offline audio 206/cache.              |
| **7. Polish**                             | After core works.                                        | Volume control, session-complete cue, iOS limitation docs.                | —                                                           |

### Phase Ordering Rationale

- **Plan Service first:** Timer, UI, and "what's next" all need session structure.
- **Progress + Profile before Timer:** Timer calls Progress on session_complete.
- **Timer before Session Runner:** Runner orchestrates Timer and Audio.
- **PWA last:** Precache list depends on final asset set.

### Research Flags

| Phase              | Needs `/gsd-research-phase`? | Notes                                                                |
| ------------------ | ---------------------------- | -------------------------------------------------------------------- |
| Plan Service       | No                           | JSON schema is straightforward; patterns documented.                 |
| Progress + Profile | No                           | sql.js + IndexedDB pattern well-documented.                          |
| Timer Engine       | **Yes**                      | Web Audio API vs Date-based scheduling; local notifications for iOS. |
| Audio Service      | No                           | Workbox + RangeRequestsPlugin pattern clear.                         |
| Session Runner     | No                           | Standard orchestration.                                              |
| PWA + Offline      | **Yes**                      | iOS background behavior; minimal-ui testing.                         |
| Polish             | No                           | Standard UX.                                                         |

---

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                            |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Vite 6, React 19, vite-plugin-pwa, Workbox docs are current and authoritative. sql.js has medium confidence (single-tab caveat). |
| Features     | MEDIUM     | WebSearch and domain sites; no Context7 for app store ecosystem. Table stakes well-aligned with PROJECT.md.                      |
| Architecture | HIGH       | PWA/audio/IndexedDB from official docs; timer patterns from community. Build order is dependency-driven.                         |
| Pitfalls     | HIGH       | iOS audio, timer drift, offline audio, safety—all well-documented with prevention strategies.                                    |

**Gaps:** iOS PWA background behavior is a known limitation with no perfect fix. Local notifications for cues may require additional research (Web Notifications API vs native). Safe table validation thresholds need domain input (CO2 ≤50% PB, O2 ≤80%, max 8 cycles—from research but should be confirmed).

---

## Sources

| Source                                                 | Used In                       |
| ------------------------------------------------------ | ----------------------------- |
| PowerSync: SQLite Persistence on the Web (Nov 2025)    | STACK                         |
| Chrome: Serving cached audio and video (Workbox)       | STACK, ARCHITECTURE, PITFALLS |
| vite-plugin-pwa                                        | STACK                         |
| @webreflection/sql.js                                  | STACK                         |
| Vite 6, React 19 releases                              | STACK                         |
| Freediving Apnea Trainer, Apnealogy, Apnetica          | FEATURES, PITFALLS            |
| WebSearch: meditation/interval/breathhold app features | FEATURES                      |
| web.dev: PWA offline streaming                         | ARCHITECTURE                  |
| DEV: sql.js + IndexedDB offline-first                  | ARCHITECTURE                  |
| Apple Developer Forums: iOS PWA background audio       | PITFALLS                      |
| PubMed 34157738: dry static apnea safety               | PITFALLS                      |
