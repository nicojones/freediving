# Feature Landscape

**Domain:** Breathhold training, meditation timer, interval timer apps
**Project:** Freediving Breathhold Trainer PWA
**Researched:** 2025-03-19

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Audio cues for phase transitions** | All three domains: users follow timers eyes-closed or while moving. Meditation: interval bells. Interval: work/rest beeps. Breathhold: "Hold", "Breathe!", countdown warnings. | Low | Core value of this project. Must work reliably. |
| **Offline operation** | Meditation users explicitly reject apps without offline. Interval timers used in gyms/pools with poor connectivity. Breathhold training often at home or poolside. | Medium | PWA service worker, cached assets. |
| **Screen-off / background operation** | Meditation: timer runs while phone sleeps. Interval: phone in pocket during workout. Breathhold: eyes closed, phone face-down. | Medium | PWA limitation: browsers suspend background; requires workarounds (Web Locks API, keep-alive patterns). |
| **Customizable or pre-defined session structure** | Meditation: warm-up, meditate, cool-down. Interval: work/rest rounds. Breathhold: hold/breathe sequences. Users expect to see structure before starting. | Low | Project uses JSON plans; no in-app editor (out of scope). |
| **Reliable cue timing** | Timer accuracy is non-negotiable. Late "Breathe!" or missed interval = trust destroyed. | Low | Critical for safety in breathhold. |
| **Quick start (minimal taps)** | Meditation: "minimal taps to start." Interval: "quick-start in 8–10 seconds." Users want to begin without friction. | Low | Default to current day, one-tap start. |
| **Quality audio (not synthesized)** | Meditation users reject poor/synthesized sounds; prefer authentic bells, gongs. Breathhold: user-provided audio files (project constraint). | Low | Project: user supplies audio; ensure clean playback. |
| **Session completion recording** | Interval: workout history. Breathhold: "completed trainings with full history." Meditation: auto-logging. Users expect progress to persist. | Low | Project: SQLite, per-user per-day completion. |
| **"What's next" / current day logic** | Breathhold: daily sessions, need to know which day to do. Interval: repeat previous workout. Meditation: preset suggestions. | Low | Project: first non-completed day or today's scheduled day. |
| **Installable (PWA or native)** | Users expect to add to home screen and use like an app. PWA install via browser. | Low | Project: PWA, mobile-first. |
| **Responsive / mobile-first layout** | All three domains used primarily on phones. Lie down, gym, meditation = phone in hand or nearby. | Low | Project requirement. |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Hands-free, eyes-closed operation** | Breathhold/meditation: no need to look at screen. Differentiator because many apps require visual attention. | Medium | Project core value. Audio-only cues, no screen during hold. |
| **Admin-managed plans (JSON)** | Coach/trainer controls progression; users get curated plans without decision fatigue. | Low | Project: JSON, no in-app editor. Simpler than custom table builders. |
| **Pre-defined user profiles (no registration)** | Small groups (club, family): no sign-up friction, no account management. | Low | Project: pre-defined users. |
| **Voice announcements in multiple languages** | Interval apps: 32-language TTS. Accessibility and international use. | Medium | Defer unless needed. |
| **Haptic feedback** | Alternative to audio; useful in noisy environments or when audio is off. | Low | Consider for "Prepare for hold" and "Breathe!" |
| **Music ducking** | Lowers music during announcements. Interval apps offer this. | Medium | Nice-to-have if user listens to ambient during recovery. |
| **CO2/O2 table auto-calculation** | Breathhold apps: tables derived from max hold time. Reduces manual setup. | High | Out of scope for project (plans from JSON). |
| **Heart rate / SpO₂ integration** | Breathhold: Bluetooth HRM, pulse oximeter. Advanced users value data. | High | Out of scope; adds hardware dependency. |
| **Progress charts and statistics** | Meditation: yearly/monthly stats. Breathhold: best time progression. | Medium | Project: explicitly out of scope (progress = "what's next" only). |
| **Session presets / saved configurations** | Meditation: save common durations. Interval: repeat previous workout. | Low | Project: plan structure provides this via JSON. |
| **Apple Watch / wearable standalone** | Interval: watch with live view. Meditation: watch timers. | High | Out of scope for PWA. |

## Anti-Features

Features to deliberately NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User registration / sign-up** | Project: few pre-defined users. Auth adds complexity, privacy surface, and maintenance. | Pre-defined profiles, no accounts. |
| **Records / best times / performance metrics** | Project scope: progress = "what's next," not leaderboards or PRs. Avoids scope creep into analytics. | Completion per day only; surface next session. |
| **In-app plan editor** | Project: admin manages JSON. Editor adds UI complexity and risk of conflicting with JSON source. | Admin edits JSON; app consumes. |
| **Audio generation (TTS/synthesized cues)** | User provides audio files. Generated audio often sounds robotic; meditation users reject it. | User-supplied audio files for cues. |
| **Forced social features** | Meditation apps (e.g. Insight Timer) criticized for social feeds, gratitude posts, "how are you?" prompts. Users want focused timers. | No social, no feeds, no gamification. |
| **Excessive notifications** | Deal-breaker: "intrusive notifications," "how are you doing today?" prompts. | Minimal notifications; only if user opts in for reminders. |
| **Core timer behind paywall** | Users reject "timer features locked behind paywalls." | Free core; optional premium only for extras. |
| **Algorithm-chosen content** | Meditation apps criticized for algorithm picking sessions instead of manual choice. | User selects plan and day explicitly. |
| **Requires account for offline** | Offline must work without login. | Full offline, no account required. |
| **Ads during session** | Unacceptable during breathhold/meditation. | No ads, or only on non-session screens if ever. |

## Feature Dependencies

```
Session structure (hold/breathe intervals) → Audio cues (cues reference intervals)
Session structure → "What's next" logic (completion per day depends on plan)
Offline operation → Installable PWA (service worker, cached assets)
Audio cues → Quality audio playback (user-provided files)
Pre-defined profiles → Session completion (stored per user)
JSON plans → Session structure (plans define intervals)
```

## MVP Recommendation

Prioritize (aligned with project requirements):

1. **Audio cues** — Hold, prepare (10s before), optional countdown (30s when recovery ≥ 31s), Breathe!
2. **Session structure from JSON** — Read plan, display before start, execute intervals
3. **"What's next" / current day** — First non-completed day or today
4. **Session completion recording** — Per user, per day, SQLite
5. **Offline + installable PWA** — Works without network, add to home screen
6. **Responsive, mobile-first** — Lie-down use case

Defer:

- **Haptic feedback** — Add if users request; audio primary
- **Music ducking** — Nice-to-have for ambient listeners
- **Multiple languages** — Unless user base requires

Out of scope (do not build):

- Registration, records/best times, in-app plan editor, audio generation, social features

## Sources

- Freediving Apnea Trainer how-to (freedivingapp.pro) — CO2/O2 tables, methodology
- WebSearch: breathhold training app features 2024–2025
- WebSearch: meditation timer app features, deal-breakers (StillMind, Insight Timer reviews)
- WebSearch: interval timer app features HIIT 2024
- WebSearch: hands-free breath hold app audio cues
- WebSearch: PWA timer offline installable 2024
- WebSearch: meditation timer complaints (Insight Timer, Zenitizer)
- Confidence: MEDIUM — WebSearch and official site; no Context7 for app store ecosystem
