# UI Design Contract: Submerged Protocol

**Version:** 1.0  
**Source:** `.planning/ui/DESIGN.md`  
**Prototypes:** `.planning/ui/*.html`  
**Target:** React app in `src/`

This document is the implementation contract for applying the Submerged design system to the Freediving Breathhold Trainer. It maps the existing HTML prototypes to app screens and defines concrete component specs. **Do not blindly copy templates** — implement within the existing app structure.

---

## 1. Screen Map

| App Screen | Prototype | Route / Component |
|------------|-----------|--------------------|
| Login | `login.html` | `LoginPage` |
| Training Dashboard | `training-dashboard.html` | `App` (day selector + current day) |
| Session Preview | `session-preview.html` | `App` (session breakdown section) |
| Active Session | `active-session-timer.html` | `App` (sessionStatus === 'running') |
| Session Complete | — | `App` (sessionStatus === 'complete') |
| Error / Loading | — | Inline states in `App` |

---

## 2. Shared Components

### 2.1 TopAppBar

**Used on:** Training Dashboard, Session Preview, Active Session  
**Not used on:** Login (standalone identity)

| Prop | Value |
|------|-------|
| Height | `h-20` (5rem) |
| Background | `bg-background` (#0d1416) |
| Layout | `flex items-center justify-between px-8` |
| z-index | `z-50` |

**Left:** Logo + brand
- `waves` icon (Material Symbols Outlined), `text-primary`
- "Submerged" text: `font-headline font-bold text-xl tracking-tighter text-primary`

**Right (context-dependent):**
- Training Dashboard: Week label ("Current Week") + plan name ("CO2 Tolerance III")
- Session Preview: Share + more_vert icons
- Active Session: more_vert only

**Reference:** `training-dashboard.html` L94–106, `session-preview.html` L94–109, `active-session-timer.html` L97–109

---

### 2.2 BottomNavBar

**Used on:** Training Dashboard  
**Hidden on:** Session Preview (Start Session FAB takes priority), Active Session (focus mode)

| Prop | Value |
|------|-------|
| Position | `fixed bottom-0 w-full z-50` |
| Height | `h-24` + `pb-safe` |
| Background | `bg-background/60 backdrop-blur-xl` |
| Shadow | `shadow-[0_-20px_40px_rgba(0,0,0,0.4)]` |

**Tabs:** Training (active), Settings (inactive)
- Active: `text-primary bg-primary/10 rounded-2xl px-6 py-2`
- Inactive: `text-tertiary opacity-60 hover:opacity-100 hover:text-primary`

**Reference:** `training-dashboard.html` L222–233

---

### 2.3 Primary CTA Button ("Breathe")

**Used on:** Login, Session Preview, Training Dashboard (Start Session)

| Prop | Value |
|------|-------|
| Background | `linear-gradient(135deg, primary 0%, primary-container 100%)` |
| Height | `h-[5.5rem]` (login) or `h-24` (session) — min 5.5rem for main actions |
| Border radius | `rounded-xl` |
| Shadow | `shadow-[0_20px_40px_rgba(0,0,0,0.4)]` |
| Text | `font-headline font-bold text-on-primary` |
| Transition | `duration-400` |
| Active state | `active:scale-95` |

**Reference:** `login.html` L134–138, `session-preview.html` L207–210

---

### 2.4 Text Input (Form Fields)

**Used on:** Login

| Prop | Value |
|------|-------|
| Container | `bg-surface-container-low rounded-xl focus-within:bg-surface-container-high` |
| No borders | Use `border-transparent focus-within:border-primary/20` only if needed; prefer tonal shift |
| Icon | Material Symbols, `text-on-surface-variant group-focus-within:text-primary` |
| Input | `bg-transparent border-none py-5 pl-14 pr-6 placeholder:text-outline-variant` |
| Label | `font-label text-on-surface-variant text-[0.7rem] uppercase tracking-widest` |

**Reference:** `login.html` L118–132

---

### 2.5 Day Card (Training List)

**States:** Completed, Current (active), Upcoming (locked)

| State | Background | Icon | Badge |
|-------|------------|------|-------|
| Completed | `surface-container-low` | check_circle (filled), primary | "Done" |
| Current | `surface-container-high border-2 border-primary/20` | — | "Current" |
| Upcoming | `surface-container-low/50 opacity-50` | lock, outline | — |

**Layout:** `rounded-3xl p-6 flex items-center justify-between`  
**Spacing between cards:** `gap-6` (no dividers)

**Reference:** `training-dashboard.html` L115–218

---

### 2.6 Interval Card (Session Breakdown)

**Types:** Prepare (secondary), Hold (primary), Target Peak (primary + stars)

| Type | Accent | Icon |
|------|--------|------|
| Prepare | `text-secondary` | air |
| Hold | `text-primary` | scuba_diving |
| Target Peak | `text-primary` + `border-primary/20` | stars (filled) |

**Layout:** Timeline with vertical line (`w-[2px] bg-outline-variant/30`), dot (`w-4 h-4 rounded-full border-2`), card (`bg-surface-container-high/40 rounded-xl p-5`)

**Reference:** `session-preview.html` L147–198

---

### 2.7 Progress Bar (Oxygen Flow)

**Used on:** Active Session, Training Dashboard (current day)

| Prop | Value |
|------|-------|
| Track | `bg-surface-container-high rounded-full h-3` |
| Fill | `bg-primary-fixed` (or `bg-primary`) |
| Ends | Rounded (soft-ended stroke) |
| No thin bars | Forbid thin mechanical bars; use thick stroke |

**Reference:** `active-session-timer.html` L116–121, `training-dashboard.html` L173–175

---

### 2.8 Focus Ring (Active Session Timer)

**Used on:** Active Session only

| Prop | Value |
|------|-------|
| Size | `w-[320px] h-[320px]` |
| Stroke | `border-[12px]` or SVG circle `stroke-width="12"` |
| Empty state | `border-surface-container-high` or `stroke-tertiary` |
| Active state | `primary` stroke + `focus-glow`: `box-shadow: 0 0 60px rgba(82,218,211,0.15)` |
| Timer text | `font-headline text-[5rem] font-extrabold` |

**Reference:** `active-session-timer.html` L125–138

---

### 2.9 Bento Stats (Session Preview)

**Layout:** `grid grid-cols-2 gap-4`

| Cell | Content |
|------|---------|
| Hero (col-span-2) | Total time, large `text-primary font-headline text-5xl` |
| Small cells | Longest Hold, Recovery — `text-on-surface` or `text-secondary` |

**Reference:** `session-preview.html` L117–136

---

## 3. Layout & Spacing

| Rule | Value |
|------|-------|
| Top-level padding | `px-6` or `px-8`, `pt-8` |
| Section spacing | `mb-12` between major sections |
| Card spacing | `gap-6` for lists (no dividers) |
| Min body height | `min-height: max(884px, 100dvh)` |

---

## 4. Typography Scale

| Use | Class | Font |
|-----|-------|------|
| Display (timer) | `text-[5rem]` or `text-[3.5rem]` | Manrope |
| Page title | `text-[2.5rem]`–`text-[3.5rem]` | Manrope |
| Section title | `text-xl`–`text-2xl` | Manrope |
| Body | `text-sm`–`text-lg` | Inter |
| Labels | `text-[0.7rem]`–`text-xs` uppercase tracking-widest | Inter |
| Secondary text | `text-on-surface-variant` | — |

---

## 5. Color Tokens (Tailwind)

Extract from prototypes into shared config. Core tokens:

| Token | Hex |
|-------|-----|
| background | #0d1416 |
| surface | #0d1416 |
| surface-container-low | #161d1f |
| surface-container-high | #242b2d |
| surface-container-highest | #2f3638 |
| primary | #52dad3 |
| primary-container | #004e4b |
| secondary | #ffd799 |
| tertiary | #b0cbd3 |
| on-surface | #dde4e6 |
| on-surface-variant | #c0c7cd |
| on-primary | #003735 |
| outline-variant | #40484c |

---

## 6. Design Rules (from DESIGN.md)

### Must Do
- Use `20` spacing unit (7rem) for top-level padding where appropriate
- Use `surface_bright` for momentary "Flash" states (e.g., hold completed)
- Touch targets for Stop/Emergency: min `xl` size
- Transitions: min `400ms`, `cubic-bezier(0.4, 0, 0.2, 1)`

### Must Not
- No pure white (#FFFFFF) — use `on_surface` (#dde4e6)
- No 1px solid borders for sectioning — use tonal shifts
- No rapid animations
- No flat buttons for main CTAs — use gradient

---

## 7. Implementation Checklist

When implementing in React:

1. **Tailwind config:** Add color tokens and font families from prototypes to `tailwind.config`
2. **index.css:** Set `html.dark`, load Manrope + Inter, Material Symbols
3. **LoginPage:** Replace with layout from `login.html` (abyssal gradient, form styling, primary CTA)
4. **App (dashboard):** Add TopAppBar, day cards (Completed/Current/Upcoming), BottomNavBar
5. **App (session preview):** Add bento stats, interval timeline, Start Session FAB
6. **App (active session):** Add progress bar, focus ring, timer display, Stop/Pause/Lap buttons
7. **Error/Loading:** Use `surface-container-low`, `text-error` or `text-on-surface-variant`
8. **Shared:** Extract TopAppBar, BottomNavBar, PrimaryButton as components

---

## 8. Prototype → App Mapping Notes

- **Login:** Standalone; no TopAppBar. Use `abyssal-gradient` background, centered content.
- **Training Dashboard:** Combines day list + current day card. Current day card has "Start Session" CTA.
- **Session Preview:** Can be same page as dashboard when a day is selected, or separate route. Prototype shows Day 4 detail with breakdown.
- **Active Session:** Full-screen focus mode. BottomNavBar can be hidden or minimal.
- **Rest day:** Use secondary styling; "Mark rest day complete" as secondary button.
- **Plan complete:** Message in `text-on-surface-variant`; no primary CTA.

---

*Last updated: 2025-03-19*
