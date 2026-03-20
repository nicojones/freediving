# Technology Stack

**Project:** Freediving Breathhold Trainer  
**Researched:** 2025-03-19  
**Mode:** Ecosystem (PWA with audio, SQLite, offline)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose                 | Why                                                                                                                                              |
| ---------- | ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| React      | 19.x    | UI framework            | Mature ecosystem, React 19 adds Actions for async transitions; fits session-state flows. Vue 3 is equally valid—choose based on team preference. |
| Vite       | 6.x     | Build tool & dev server | Near-instant HMR, optimized Rollup builds, first-class PWA plugin support. De facto standard for modern PWAs in 2025.                            |
| TypeScript | 5.x     | Type safety             | Reduces bugs in session logic and SQL schema; standard for production PWAs.                                                                      |

**Confidence:** HIGH — Vite 6 released Nov 2024; React 19 Dec 2024. Both widely adopted.

### PWA & Offline

| Technology      | Version          | Purpose                           | Why                                                                                                               |
| --------------- | ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| vite-plugin-pwa | ^1.2             | Service worker, manifest, offline | Zero-config PWA; uses Workbox under the hood. Generates SW with precache and runtime caching. Framework-agnostic. |
| Workbox         | 7.x (via plugin) | Caching strategies                | Handles precache, runtime cache, and—critically—RangeRequestsPlugin for audio.                                    |

**Confidence:** HIGH — vite-plugin-pwa v1.2.0 (Nov 2025); Workbox v7 is dependency.

**Audio-specific config:** Use `RangeRequestsPlugin` and `CacheFirst` for audio routes. Precache audio files explicitly (runtime streaming won't cache). Add `crossorigin="anonymous"` to `<audio>` elements.

### Local Storage (SQLite)

| Technology            | Version | Purpose                                      | Why                                                                                                                                                                                                             |
| --------------------- | ------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @webreflection/sql.js | latest  | SQLite in browser with IndexedDB persistence | ESM package with embedded WASM; `/persistent` export gives `save()`/`delete()` backed by IndexedDB. No COOP/COEP headers. Single-tab limitation is acceptable for this app (user trains one session at a time). |

**Confidence:** MEDIUM — Well-documented, simpler than wa-sqlite. Single-tab caveat is explicit; for multi-tab, use `/shared` export (SharedWorker).

**Alternative (more robust):** wa-sqlite with `IDBBatchAtomicVFS` — production-grade persistence, no COOP/COEP, runs in main thread or worker. Requires Asyncify build. PowerSync blog (Nov 2025) recommends wa-sqlite for production; `OPFSCoopSyncVFS` for best performance but needs dedicated worker setup.

### Audio Playback

| Technology                  | Version | Purpose               | Why                                                                                                                                                        |
| --------------------------- | ------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTML5 Audio API             | —       | Playback of cue files | Native `<audio>` or `new Audio()` is sufficient. No Web Audio API needed for simple cue playback.                                                          |
| Workbox RangeRequestsPlugin | —       | Offline audio         | Browsers use range requests for media; runtime caching fails. Must precache audio and use RangeRequestsPlugin so cached partial responses serve correctly. |

**Confidence:** HIGH — Chrome Workbox docs and real-world PWA audio implementations confirm this pattern.

### Styling

| Technology   | Version | Purpose           | Why                                                                                                                |
| ------------ | ------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Tailwind CSS | 4.x     | Utility-first CSS | Mobile-first responsive layout; zero-runtime. Tailwind 4 (Jan 2025) has first-party Vite plugin, CSS-first config. |

**Confidence:** HIGH — Tailwind 4 released 2025; widely used.

### Supporting Libraries

| Library  | Version | Purpose                  | When to Use                                                |
| -------- | ------- | ------------------------ | ---------------------------------------------------------- |
| Kysely   | ^0.27   | Type-safe SQL (optional) | If schema grows or you want typed queries over raw sql.js. |
| date-fns | ^4.x    | Date handling            | For "current day" logic, session scheduling. Lightweight.  |

---

## Alternatives Considered

| Category  | Recommended           | Alternative      | Why Not                                                                                                                              |
| --------- | --------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| SQLite    | @webreflection/sql.js | SQLocal          | SQLocal requires COOP/COEP headers; complicates deployment and breaks some third-party embeds.                                       |
| SQLite    | @webreflection/sql.js | wa-sqlite        | wa-sqlite is more powerful and production-ready but adds worker/Asyncify complexity. Use if you need multi-tab or higher throughput. |
| SQLite    | @webreflection/sql.js | sql.js (vanilla) | Vanilla sql.js is in-memory only; persistence requires manual IndexedDB import/export.                                               |
| Framework | React                 | Vue 3            | Both work. Vue 3 + Vite is equally standard; choose by team familiarity.                                                             |
| Build     | Vite                  | Next.js, Remix   | Overkill for a static PWA with no SSR. Vite is the right fit.                                                                        |

---

## What NOT to Use

| Avoid                              | Reason                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SQLocal without COOP/COEP planning | Requires `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`. Adds hosting constraints. |
| Runtime-only audio caching         | Media uses range requests; only precached audio works offline.                                                                 |
| Web Audio API for simple cues      | Overkill for playing fixed cue files. Use HTML5 Audio.                                                                         |
| localStorage for progress          | 5MB limit; not suitable for relational data. SQLite/IndexedDB is correct.                                                      |
| Create React App                   | Deprecated; Vite is the replacement.                                                                                           |

---

## Installation

```bash
# Core
npm create vite@latest . -- --template react-ts
npm install @webreflection/sql.js date-fns

# PWA
npm install -D vite-plugin-pwa

# Styling
npm install -D tailwindcss @tailwindcss/vite
```

---

## PWA Configuration (vite.config.ts)

```ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,wav}'],
        runtimeCaching: [
          {
            urlPattern: /\.(mp3|wav|ogg|m4a)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 50 },
              cacheableResponse: { statuses: [200] },
              rangeRequests: true, // Required for audio/video offline playback
            },
          },
        ],
      },
    }),
  ],
});
```

**Audio precaching:** Include audio files in `globPatterns` or use `additionalManifestEntries` so they are precached. Runtime caching alone won't cache streamed media (browsers use range requests). Add `crossorigin="anonymous"` to `<audio>` elements.

---

## SQLite Usage Pattern

```ts
import Database from '@webreflection/sql.js/persistent';

const db = new Database('freediving.db');

// Schema
db.run(`
  CREATE TABLE IF NOT EXISTS session_completions (
    user_id TEXT NOT NULL,
    day_date TEXT NOT NULL,
    completed_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, day_date)
  )
`);

// After writes
db.save();
```

---

## Sources

| Source                                                                                                                       | Confidence | Date    |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| [PowerSync: SQLite Persistence on the Web (Nov 2025)](https://www.powersync.com/blog/sqlite-persistence-on-the-web)          | HIGH       | 2025-11 |
| [Chrome: Serving cached audio and video (Workbox)](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video) | HIGH       | —       |
| [vite-plugin-pwa](https://vite-plugin-pwa.netlify.app/)                                                                      | HIGH       | 2025    |
| [@webreflection/sql.js](https://github.com/WebReflection/sql.js)                                                             | MEDIUM     | —       |
| [Vite 6 release](https://vitejs.dev/blog/announcing-vite6)                                                                   | HIGH       | 2024-11 |
| [React 19 release](https://react.dev/blog/2024/12/05/react-19)                                                               | HIGH       | 2024-12 |
| [SQLocal setup (COOP/COEP)](https://sqlocal.dallashoffman.com/guide/setup)                                                   | HIGH       | —       |
