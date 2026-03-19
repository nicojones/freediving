# Phase 4: Audio Service — Research

**Phase:** 4. Audio Service  
**Researched:** 2025-03-19  
**Sources:** STACK.md, ARCHITECTURE.md, PITFALLS.md, 4-CONTEXT.md, WebSearch

---

## Summary

Phase 4 needs an Audio Service that subscribes to timer events and plays cue files from `public/audio/`. HTML5 Audio is sufficient; m4a format is well-supported. Preload and validate before session start; show clear error if files missing.

---

## Key Findings

### 1. HTML5 Audio for Cue Playback

| Finding | Source |
|---------|--------|
| `new Audio(url)` or `<audio>` is sufficient for short cue files | STACK.md, ARCHITECTURE.md |
| No Web Audio API needed for simple playback | STACK.md |
| Main thread plays; Service Worker only caches (Phase 6) | ARCHITECTURE Pattern 2 |

**Implementation:** Use `new Audio('/audio/hold.m4a')` and call `.play()` on event. Cues are short; no overlap handling needed (4-CONTEXT).

### 2. M4A Format Support

| Browser | M4A Support |
|---------|-------------|
| Safari | Yes (native) |
| Chrome | Yes |
| Edge | Yes |
| Firefox | Yes (AAC in MP4 container) |

**MIME type:** `audio/mp4` for .m4a files. Vite dev server typically serves correct MIME; verify in production.

**Source:** WebSearch, MDN, Can I Use.

### 3. Preload & Validation Before Session

Per PITFALLS (Pitfall 9): "Validate audio URLs at plan load. Preload and test-play before session start. Show explicit error: 'Audio file X missing.'"

**Pattern:**
```typescript
// Option A: Preload each file, check canplaythrough / error
const audio = new Audio('/audio/hold.m4a')
audio.onloadeddata = () => resolve()
audio.onerror = () => reject(new Error('Audio file hold.m4a failed to load'))

// Option B: HEAD request (lighter, but doesn't verify playability)
// Prefer Option A: ensures file loads and is playable
```

**Recommendation:** Create Audio instances for all 4 cues before session start. Await `canplaythrough` or `loadeddata` for each. If any `onerror`, reject with clear message listing missing file(s). Block "Start session" until validation passes.

### 4. Event → Cue Wiring

From 4-CONTEXT and timerEngine:

| Timer Event | Cue File | When |
|-------------|----------|------|
| phase_start (phase: 'hold') | hold.m4a | Hold start |
| prepare_hold | prepare.m4a | 10s before hold |
| countdown_30 | 30s.m4a | 30s remaining in recovery (if recovery ≥31s) |
| hold_end | breathe.m4a | Hold end |
| session_complete | — | No cue (v2) |

**Integration:** Audio Service subscribes via `engine.on(eventType, callback)`. Each callback calls `playCue(filename)`.

### 5. crossorigin for PWA (Phase 6)

STACK and ARCHITECTURE: Add `crossorigin="anonymous"` to audio for same-origin URLs when using Service Worker cache. Phase 4 can add it proactively so Phase 6 precaching works without changes.

### 6. Pitfalls to Avoid

| Pitfall | Mitigation |
|---------|------------|
| SW playing audio | Main thread only; SW caches in Phase 6 |
| Runtime caching of audio | Phase 6 precaches; Phase 4 just fetches |
| Missing/corrupt files | Validate before session; show explicit error |
| Cue during hold | Timer emits no events during hold; no action needed |

---

## Implementation Notes

### Audio Service API (proposed)

```typescript
// audioService.ts
export function createAudioService(): {
  preload(): Promise<void>           // Validate all cues; reject if any fail
  play(cue: 'hold' | 'prepare' | '30s' | 'breathe'): void
  wireToTimer(engine: TimerEngineAPI): void  // Subscribe to events
}
```

### File Paths

- Base: `/audio/` (Vite serves from `public/`)
- Files: `hold.m4a`, `prepare.m4a`, `30s.m4a`, `breathe.m4a`

### Validation Flow

1. User clicks "Start session"
2. Call `audioService.preload()` (or validate in same flow)
3. If reject: show "Audio file X failed to load. Check that hold.m4a, prepare.m4a, 30s.m4a, breathe.m4a exist in public/audio/."
4. If resolve: create timer engine, wire Audio Service, start session

---

## Gaps / Deferred

- **Offline precaching:** Phase 6 (PWA). Phase 4 works online; offline will work after SW + RangeRequestsPlugin.
- **Volume control:** v2 (SESS-08).
- **Session-complete cue:** v2 (SESS-09).

---

## Sources

- STACK.md — HTML5 Audio, Workbox RangeRequestsPlugin
- ARCHITECTURE.md — Pattern 2 (Audio in main thread), Pattern 4 (event-driven cues)
- PITFALLS.md — Pitfall 9 (missing/corrupt audio), Pitfall 4 (offline)
- 4-CONTEXT.md — Event mapping, file names, no overlap
- WebSearch: HTML5 Audio preload validation, m4a browser support
- MDN: audio element, audio/mp4 MIME
