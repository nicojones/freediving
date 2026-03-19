# Domain Pitfalls

**Domain:** Freediving breathhold trainer PWA (interval timer + meditation-style audio + apnea training)
**Researched:** 2025-03-19

---

## Critical Pitfalls

### Pitfall 1: iOS PWA Audio Stops on Screen Lock

**What goes wrong:** On iOS, PWA audio stops when the screen locks or the app goes to the background. Unlike Safari browser tabs, PWAs do not keep playing audio. Users lie down with eyes closed, so the screen will lock—and they lose all cues mid-session.

**Why it happens:** Apple does not support the Screen Wake Lock API in Mobile Safari/PWAs (WebKit bug #254545). When the PWA is backgrounded, the system suspends it; JavaScript execution is throttled and audio stops. The `minimal-ui` manifest workaround is not officially supported and may fall back to `browser` mode.

**Consequences:** Session becomes unusable on iOS. User gets no "Breathe!" cue, no "Prepare for hold," no "30 seconds"—they are left guessing or must keep the screen on (defeating the eyes-closed workflow).

**Prevention:**
- Document iOS limitation clearly in onboarding: "Keep screen on or use Android for best experience."
- Test `display: "minimal-ui"` and `display_override`—if Safari opens with address bar, background audio may work in some iOS versions.
- Consider NoSleep.js or similar to prevent display sleep (limited iOS support).
- Prioritize Android testing; PWAs behave correctly there.

**Detection:** Run session on iOS PWA, lock screen after 30s—audio stops. Check Apple Developer Forums for ongoing reports.

**Phase:** PWA Setup, Audio/Playback

---

### Pitfall 2: Timer Stops When App Is Suspended

**What goes wrong:** When the screen locks, the OS suspends the app. JavaScript timers (`setInterval`, `setTimeout`) stop running. The session logic thinks time has passed, but the actual countdown freezes. Cues fire late, early, or not at all.

**Why it happens:** iOS and Android suspend background processes. Timers are not real-time—they pause with the process.

**Consequences:** "Breathe!" plays 2 minutes late. "Prepare for hold" never fires. User holds too long or breathes too early. Session state is corrupted.

**Prevention:**
- Use **local notifications** for critical cues: schedule "Breathe!" and "Prepare for hold" at absolute times before starting the session, so the OS fires them even when the app is suspended.
- Keep a single source of truth: session start time + planned cue times. On resume, recalculate elapsed time from `Date.now()` vs start time, not from accumulated ticks.
- Avoid relying on `setInterval` for session progression—use `Date`/`performance.now()` for elapsed time.

**Detection:** Start session, lock screen for 60s, unlock—check if cues fired and if state is correct.

**Phase:** Session/Timer Logic

---

### Pitfall 3: JavaScript Timer Drift for Audio Cues

**What goes wrong:** `setInterval` and `setTimeout` drift over time. OS interrupts, GC pauses, and main-thread blocking cause accumulated delays. After 10+ minutes, cues can be seconds off—"30 seconds" might play at 25 or 35 seconds.

**Why it happens:** JS timers are best-effort, not real-time. They do not compensate for execution gaps.

**Consequences:** User loses trust in cues. "30 seconds" is a critical safety/psychology marker; inaccuracy undermines the session.

**Prevention:**
- Use **Web Audio API** for cue scheduling. `AudioContext.currentTime` is a high-precision audio clock; schedule `source.start(audioCtx.currentTime + offset)` for each cue.
- Pre-schedule all cues at session start using a lookahead scheduler if events depend on user input.
- Never use `setInterval` for sub-second or multi-minute precision timing.

**Detection:** Run a 15-minute session, log actual vs expected cue times—drift >500ms indicates a problem.

**Phase:** Audio/Playback, Session/Timer Logic

---

### Pitfall 4: PWA Offline Audio Fails to Load

**What goes wrong:** User starts a session offline. Audio files fail to load—404 or cache miss. Cues are silent. Session runs but user hears nothing.

**Why it happens:** Browsers request audio with `Range: bytes=0-` (partial content). Responses are 206, which the Cache API often cannot store correctly. If audio wasn't pre-cached, offline playback fails.

**Consequences:** Session is unusable offline despite "works offline" promise. User in airplane mode or poor signal gets no cues.

**Prevention:**
- **Preload audio at install**: Use Workbox `warmStrategyCache()` or equivalent to cache all cue files when the service worker installs.
- Use `RangeRequestsPlugin` when serving cached audio so range requests are honored.
- Validate audio availability before starting a session; show clear error if files are missing.
- Ensure `crossorigin="anonymous"` on audio elements for same-origin URLs if needed.

**Detection:** Clear cache, go offline, start session—cues should still play.

**Phase:** PWA Setup, Offline/Service Worker

---

### Pitfall 5: Aggressive or Unsafe Training Tables

**What goes wrong:** Plans use hold durations >50% of personal best for CO2 tables, or >80% for O2 tables. Recovery times are too short. User pushes too hard, leading to LMC (loss of motor control) or blackout.

**Why it happens:** Admin-authored JSON plans may be copied from advanced sources or mis-scaled. No validation against safe percentages. Users may not know their true max.

**Consequences:** Medical risk: syncope, pulmonary edema (documented in dry apnea), or—in water—drowning. Even dry static apnea has caused prolonged syncope and pulmonary edema in unsupervised training (PubMed 34157738).

**Prevention:**
- Document safe table construction in admin docs: CO2 holds ≤50% of PB, O2 final holds ≤80%, max 8 cycles per table.
- Add plan validation: flag holds that exceed configurable thresholds.
- Include safety disclaimer: "Never train alone in water. Dry training: lie down, have a spotter if possible."
- Recommend 2–3 min recovery between tables; never CO2 and O2 on same day.

**Detection:** Audit JSON plans for hold/recovery ratios. Check for tables with >8 cycles.

**Phase:** Plans/Training, Admin Tooling

---

### Pitfall 6: Cue During Breathhold (User Confusion)

**What goes wrong:** A cue plays during the hold—e.g., "30 seconds" when recovery was 25s, or a stray "Breathe!" mid-hold. User is confused, may breathe early or lose focus.

**Why it happens:** Logic error: "30 seconds" is conditional on recovery ≥31s. Edge cases (recovery exactly 30s, off-by-one, timer drift) can fire the cue at the wrong moment.

**Consequences:** Breaks the core promise: "No audio during the breathhold." User cannot trust the app.

**Prevention:**
- Strict state machine: HOLD → no cues. Only transition to RECOVERY before any recovery-related cue.
- Unit test edge cases: recovery 30s, 31s, 32s—"30 seconds" must only play when appropriate.
- Double-check condition: recovery phase `duration >= 31` before scheduling "30 seconds" cue.

**Detection:** Run sessions with recovery 30s, 31s, 35s—verify "30 seconds" never plays during hold.

**Phase:** Session/Timer Logic

---

## Moderate Pitfalls

### Pitfall 7: Audio Conflict with Other Apps

**What goes wrong:** Another app (music, podcast, phone call) grabs the audio session. Cues stop or are inaudible. Common on iOS when multiple apps compete for audio.

**Why it happens:** Device-level audio routing. First-come or priority rules vary by OS.

**Prevention:** Document: "Close other audio apps before starting." Consider `audioSession` / `AudioContext` configuration for mix-with-others if supported. Test with Spotify/Music playing in background.

**Phase:** Audio/Playback

---

### Pitfall 8: Decision Fatigue Before Session

**What goes wrong:** User must choose profile, day, review session, confirm—too many steps. Drop-off before starting. Meditation apps show 95%+ 30-day churn partly due to friction (Pauso, RelaxFrens).

**Why it happens:** Each decision is a dropout point. "What should I do today?" should be answered by the app, not the user.

**Prevention:** Default to "current" day (first non-completed or today). Single tap to start. Pre-read is optional. Avoid "which session length?"—plans define it.

**Phase:** UX/Onboarding

---

### Pitfall 9: Missing or Corrupt User-Provided Audio

**What goes wrong:** Admin uploads plans that reference audio files that don't exist or are corrupt. Session starts, cues fail silently.

**Why it happens:** PROJECT.md says "user provides audio files." Paths in JSON may be wrong; files may be missing from deployment.

**Prevention:** Validate audio URLs at plan load. Preload and test-play before session start. Show explicit error: "Audio file X missing." Admin tooling should verify paths.

**Phase:** Plans/Training, Audio/Playback

---

## Minor Pitfalls

### Pitfall 10: Volume Not User-Adjustable

**What goes wrong:** Cue volume is fixed. User has hearing sensitivity or environment noise—too loud or too quiet. Interval timer apps get complaints about non-adjustable volume.

**Prevention:** Add volume control for cues. Respect system volume; consider separate cue volume slider.

**Phase:** Audio/Playback

---

### Pitfall 11: No Feedback When Session Completes

**What goes wrong:** Last "Breathe!" plays, then silence. User doesn't know if session is done or app froze.

**Prevention:** Final cue: "Session complete" or distinct end sound. Clear transition to completion state.

**Phase:** Session/Timer Logic, UX

---

## Phase-Specific Warnings

| Phase Topic              | Likely Pitfall                          | Mitigation                                                                 |
|--------------------------|-----------------------------------------|----------------------------------------------------------------------------|
| PWA Setup                | iOS background audio broken             | Document limitation; test minimal-ui; prioritize Android                  |
| Offline / Service Worker | Audio 206 responses not cached         | Preload with warmStrategyCache; RangeRequestsPlugin                        |
| Session / Timer          | Timers stop when suspended              | Local notifications for cues; Date-based elapsed time                       |
| Session / Timer          | setInterval drift                       | Web Audio API for cue scheduling                                          |
| Session / Timer          | Cue during hold                         | State machine; strict recovery ≥31s check; edge-case tests                 |
| Plans / Training         | Unsafe table design                     | Validation rules; admin docs; safety disclaimer                            |
| Audio / Playback         | Missing or corrupt files                | Validate at load; preload check; clear error messages                      |
| Audio / Playback         | Other app steals audio                  | User guidance; test with background music                                 |

---

## Sources

- Apple Developer Forums: iOS Audio Lockscreen Problem in PWA (thread 762582)
- Stack Overflow: iOS PWA Background Audio Support; setInterval timing drift; Range requests for audio
- PubMed 34157738: Prolonged syncope, pulmonary edema from unsupervised dry static apnea
- Australian Institute of Sport: Breath-hold blackout and risk of death
- Apnealogy, Apnetica, FreediveUK: CO2/O2 table construction, safe percentages
- Web.dev: Audio scheduling, PWA offline streaming
- Chrome Developers: Serving cached audio with Workbox RangeRequestsPlugin
- Medium/RelaxFrens/Pauso: Meditation app retention, decision fatigue
- JustUseApp: Interval timer and meditation app user complaints (crashes, screen lock, audio)
