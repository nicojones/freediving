# Architecture Patterns

**Domain:** PWA interval timer, audio-guided breathhold trainer
**Project:** Freediving Breathhold Trainer PWA
**Researched:** 2025-03-19

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI Layer                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────────┐  │
│  │ Profile      │  │ Plan/Day     │  │ Session Runner                    │  │
│  │ Selector    │  │ Selector     │  │ (minimal UI, audio-driven)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────────┘  │
└─────────┼─────────────────┼─────────────────────────┼──────────────────────┘
          │                 │                         │
          ▼                 ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Service Layer                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Profile      │  │ Plan         │  │ Timer        │  │ Progress         │ │
│  │ Service      │  │ Service      │  │ Engine       │  │ Service          │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
└─────────┼─────────────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                 │                   │
          │                 │                 │  ┌────────────────┘
          │                 │                 │  │
          ▼                 ▼                 ▼  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Data / Infrastructure                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ JSON Plans   │  │ Audio Files  │  │ SQLite       │  │ Service Worker   │ │
│  │ (static)     │  │ (precached)  │  │ (sql.js +    │  │ (Workbox)        │ │
│  │              │  │              │  │  IndexedDB)  │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component                  | Responsibility                                                                               | Communicates With                                           |
| -------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Profile Service**        | Exposes pre-defined profiles; selected profile drives all storage keys                       | Progress Service (per-user completion)                      |
| **Plan Service**           | Loads JSON plans, parses session structure (hold/breathe intervals), resolves "current day"  | Progress Service (completion state), JSON static assets     |
| **Timer Engine**           | State machine for session phases; emits events at phase transitions and countdown milestones | Audio Service (cue triggers), Progress Service (completion) |
| **Audio Service**          | Preloads cue files, plays cues on demand; uses HTML5 Audio in main thread                    | Timer Engine (subscribes to events), Service Worker (cache) |
| **Progress Service**       | Persists session completion per user per day; exposes "first non-completed day"              | Plan Service, Profile Service, SQLite/IndexedDB             |
| **Session Runner (UI)**    | Orchestrates start/stop; wires Timer Engine → Audio; minimal visual feedback                 | Timer Engine, Audio Service, Progress Service               |
| **Plan/Day Selector (UI)** | Profile pick, plan day selection, session preview                                            | Profile Service, Plan Service                               |
| **Service Worker**         | Precaches app shell, JSON plans, audio files; serves offline                                 | Audio Service (via fetch), Plan Service (via fetch)         |

### Data Flow

**Session execution flow (primary path):**

```
User taps Start
    → Session Runner initializes Timer Engine with session structure from Plan Service
    → Timer Engine enters RECOVERY (breathe) phase
    → On phase start: Timer Engine emits "phase_start" → Audio Service plays "Hold" or no cue (recovery)
    → Timer Engine ticks; at 10s before hold: emits "prepare_hold" → Audio plays "Prepare for hold"
    → At hold start: emits "hold_start" → Audio plays "Hold"; no further audio during hold
    → At 30s remaining (if recovery ≥ 31s): emits "countdown_30" → Audio plays "30 seconds"
    → At hold end: emits "hold_end" → Audio plays "Breathe!"
    → Repeat until session complete
    → On complete: Timer Engine emits "session_complete" → Progress Service records completion
```

**"What's next" flow:**

```
App load
    → Profile Service provides selected profile
    → Plan Service loads plan JSON
    → Progress Service queries completion per user per day
    → Plan Service computes "current day" = first non-completed day, or today if all previous done
    → Plan/Day Selector displays current day by default
```

**Offline / PWA flow:**

```
Install / first visit
    → Service Worker precaches: index.html, JS/CSS, manifest, JSON plans, audio cue files
    → Subsequent loads: Service Worker serves from cache when offline
    → Audio: main thread fetches audio URLs; SW intercepts, returns cached response (CacheFirst + RangeRequestsPlugin)
```

---

## Patterns to Follow

### Pattern 1: Timer as Pure State Machine

**What:** Timer Engine is a deterministic state machine. State transitions are driven by elapsed time and session structure. Side effects (audio, persistence) are handled by subscribers, not inside the engine.

**When:** Any interval-based timer where accuracy and testability matter.

**Example:**

```typescript
// States: IDLE | RECOVERY | HOLD | COMPLETE
// Events: phase_start | prepare_hold | countdown_30 | hold_end | session_complete

type TimerEvent =
  | { type: 'phase_start'; phase: 'recovery' | 'hold'; index: number }
  | { type: 'prepare_hold' }
  | { type: 'countdown_30' }
  | { type: 'hold_end' }
  | { type: 'session_complete' };

// Reducer: (state, elapsedMs) → { newState, events[] }
// Subscribers receive events and trigger audio/persistence
```

**Rationale:** Keeps timer logic pure and testable. Audio and DB writes are side effects; separating them avoids timing bugs and makes it easy to add haptics or logging later.

### Pattern 2: Audio in Main Thread, Cache in Service Worker

**What:** Audio playback happens in the main thread via `HTMLAudioElement` or `Web Audio API`. The Service Worker does not create `AudioContext`—it only intercepts fetch requests for audio files and returns cached responses.

**When:** PWA with offline audio cues.

**Example:**

```typescript
// Main thread: preload and play
const audio = new Audio('/audio/breathe.mp3');
audio.crossOrigin = 'anonymous'; // Required for SW cache
await audio.play();

// Service Worker: CacheFirst + RangeRequestsPlugin for media
registerRoute(
  ({ request }) => request.destination === 'audio',
  new CacheFirst({
    cacheName: 'audio-cache',
    plugins: [new RangeRequestsPlugin(), new CacheableResponsePlugin({ statuses: [200] })],
  })
);
```

**Rationale:** Web Audio API cannot run in Service Workers. Precaching audio (not runtime caching) is required—streaming fetches produce partial 206 responses that don't populate cache correctly. See [Chrome Workbox docs](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video).

### Pattern 3: SQLite via sql.js + IndexedDB Persistence

**What:** sql.js runs SQLite in-memory. IndexedDB stores the serialized database (`db.export()` → `Uint8Array`). On load, restore from IndexedDB or create fresh DB.

**When:** Project requires SQLite (per PROJECT.md); PWA needs offline persistence beyond localStorage's 5MB limit.

**Example:**

```typescript
// Load: IndexedDB → Uint8Array → new SQL.Database(saved)
// Save: db.export() → saveDatabase(data)
// Save triggers: after each write, periodic (e.g. 30s), beforeunload
```

**Rationale:** localStorage is string-only (Base64 inflates size ~33%) and 5MB cap. IndexedDB supports binary natively and has much larger quota. See [sql.js + IndexedDB guide](https://dev.to/recca0120/sqljs-indexeddb-building-an-offline-first-web-app-i0j).

### Pattern 4: Event-Driven Cue Triggers

**What:** Timer Engine emits discrete events at specific moments. Audio Service subscribes and maps events to cue files. No polling.

**When:** Cues must fire at exact moments (e.g. "Prepare for hold" at 10s before, "30 seconds" at 30s remaining).

**Example:**

```typescript
timerEngine.on('prepare_hold', () => audioService.play('prepare'));
timerEngine.on('hold_end', () => audioService.play('breathe'));
timerEngine.on('countdown_30', () => audioService.play('thirty_seconds'));
```

**Rationale:** Decouples timing logic from playback. Avoids `setInterval`-based polling that can drift or miss cues under JS throttling.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Service Worker Playing Audio

**What:** Creating `AudioContext` or playing audio inside the Service Worker.

**Why bad:** Service Workers cannot output audio. Browsers do not support it.

**Instead:** Main thread plays audio; Service Worker only caches and serves audio files.

### Anti-Pattern 2: Runtime Caching of Audio

**What:** Relying on "cache as you stream" for audio—letting the first playback populate the cache.

**Why bad:** Media requests use range requests; only partial content is fetched. Cache never gets a full copy; offline playback fails.

**Instead:** Explicitly precache all audio cue files at install/first visit via `cache.add()` or Workbox precache.

### Anti-Pattern 3: Timer Logic Mixed with Side Effects

**What:** Playing audio or writing to DB inside the timer tick/interval callback.

**Why bad:** Hard to test, easy to introduce race conditions, difficult to add new subscribers (e.g. haptics).

**Instead:** Timer emits events; dedicated services handle side effects.

### Anti-Pattern 4: localStorage for SQLite Persistence

**What:** Storing `db.export()` as Base64 in localStorage.

**Why bad:** 5MB limit, 33% size inflation, string encoding overhead.

**Instead:** IndexedDB with `Uint8Array` for sql.js persistence.

---

## Scalability Considerations

| Concern             | At 10 users                 | At 100 users | At 1000+ users                                              |
| ------------------- | --------------------------- | ------------ | ----------------------------------------------------------- |
| **SQLite size**     | &lt; 1 MB                   | &lt; 10 MB   | Consider periodic pruning of old completion records         |
| **Audio cache**     | Fixed (user-provided files) | Same         | Same; precache set is bounded                               |
| **JSON plans**      | Small (KB)                  | Same         | Same; admin-managed                                         |
| **IndexedDB quota** | Plenty                      | Plenty       | Check `navigator.storage.estimate()` if storing large blobs |

For this project (few pre-defined users, local-only storage), scale is not a primary concern. The architecture is suitable for the stated scope.

---

## Suggested Build Order

Dependencies between components imply this order:

```
1. Plan Service + JSON schema
   └─ No deps. Everything else needs session structure.

2. Progress Service (SQLite + IndexedDB)
   └─ Depends on: Profile Service (for user key). Can stub profile initially.

3. Profile Service
   └─ Lightweight. Progress Service needs it for per-user keys.

4. Timer Engine
   └─ Depends on: Plan Service (session structure). Pure logic, no UI.

5. Audio Service
   └─ Depends on: cue file URLs (from config/manifest). No timer dependency yet.

6. Session Runner (UI)
   └─ Depends on: Timer Engine, Audio Service, Progress Service, Plan Service.
   └─ Wires: Timer events → Audio; session_complete → Progress.

7. Plan/Day Selector (UI)
   └─ Depends on: Plan Service, Progress Service, Profile Service.
   └─ Displays: current day, session preview.

8. Service Worker + PWA manifest
   └─ Depends on: asset list (HTML, JS, CSS, JSON, audio).
   └─ Add last so precache list is stable.
```

**Phase ordering rationale:**

- **Plan Service first:** Session structure is the backbone. Timer, UI, and "what's next" all depend on it.
- **Progress + Profile before Timer:** Completion recording and user context are simple; Timer can call Progress on complete.
- **Timer before Session Runner:** Runner is the orchestration layer; it needs Timer and Audio to exist.
- **PWA last:** Manifest and SW precache are infrastructure; build once asset set is known.

---

## Sources

- [web.dev: PWA with offline streaming](https://web.dev/articles/pwa-with-offline-streaming) — IndexedDB for media, Fetch + range requests
- [Chrome: Serving cached audio and video (Workbox)](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video) — Precaching, RangeRequestsPlugin, crossorigin
- [DEV: sql.js + IndexedDB offline-first](https://dev.to/recca0120/sqljs-indexeddb-building-an-offline-first-web-app-i0j) — Persistence pattern for SQLite in PWA
- WebSearch: interval timer state machine (Ready/Running/Done), event-driven countdown callbacks
- WebSearch: breathwork/meditation app components (timer, audio cues, session structure)
- Confidence: HIGH for PWA/audio/IndexedDB (official docs); MEDIUM for timer patterns (community + articles)
