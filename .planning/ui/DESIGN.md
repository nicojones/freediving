# Design System Specification: The Submerged Protocol

## 1. Overview & Creative North Star

**Creative North Star: "The Weightless Void"**

This design system is built to facilitate a state of flow. For a freediver, the world transitions from the chaotic surface to a silent, pressurized, and meditative depth. The UI must mimic this transition. We move away from "app-like" grids toward an **Editorial Ambient** experience.

To break the "template" look, we employ **Intentional Asymmetry**. Important metrics (like hold times) should not always be centered; they should breathe within large expanses of negative space, mimicking a single diver in a vast ocean. By using a high-contrast typography scale (Manrope for displays vs. Inter for data), we create a hierarchy that feels authoritative yet serene.

## 2. Colors: The Abyssal Palette

The color strategy relies on "Luminance Signaling." In a dark environment, the eye is drawn to light and saturation. We use this to guide the diver's nervous system.

### Core Palette

- **Background (`#0d1416`):** The "True Deep." All screens start here to minimize pupillary response.
- **Primary (`#52dad3`):** The "Breathe" signal. A vibrant teal that cuts through the darkness.
- **Secondary (`#ffd799`):** The "Prepare" signal. A warm amber that evokes the last bit of sunlight before a descent.
- **Tertiary (`#b0cbd3`):** Used for passive data and "Slate" states.

### The "No-Line" Rule

**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions. To separate a list of previous dives, use `surface_container_low` against the `surface` background. If the eye can perceive the edge of a container through a color shift, a line is redundant and adds visual noise.

### The "Glass & Gradient" Rule

Standard flat buttons are prohibited for main actions. Use a subtle linear gradient from `primary` to `primary_container` to give CTAs a "soul." For floating timers or overlays, use **Glassmorphism**: apply `surface_variant` at 60% opacity with a `20px` backdrop blur. This ensures the UI feels like a transparent HUD, not a physical barrier.

## 3. Typography: Editorial Authority

We utilize two distinct typefaces to balance "Human Feeling" with "Technical Precision."

- **Display & Headlines (Manrope):** Use `display-lg` (3.5rem) for active timers. The geometric nature of Manrope feels modern and clinical, providing the diver with absolute clarity during CO2 tolerance peaks.
- **Body & Labels (Inter):** Use Inter for all instructional text and data logs (`body-md`, `label-md`). Inter’s high x-height ensures readability even when the user’s vision is slightly blurred from physiological stress.

**Hierarchy Note:** Use `on_surface_variant` (`#c0c7cd`) for secondary labels to create a "receding" effect, pushing the primary metrics (`on_surface`) to the optical foreground.

## 4. Elevation & Depth: Tonal Layering

In a dark-mode-first system, traditional drop shadows are often invisible or "muddy." We achieve depth through **Tonal Stacking**.

- **The Layering Principle:**
  - **Level 0 (Floor):** `surface`
  - **Level 1 (Section):** `surface_container_low`
  - **Level 2 (Interactive Component):** `surface_container_high`
- **Ambient Shadows:** For high-priority floating elements (like a "Start Session" FAB), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`.
- **The "Ghost Border" Fallback:** If a container sits on a background of the same color, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components: Fluidity in Interaction

### Buttons (The "Pulse" Variants)

- **Primary ("Breathe"):** Uses `primary` gradient. Large, full-width, with `xl` (1.5rem) roundedness. Minimum height: `8.5rem` (24 spacing unit) to ensure ease of tap during recovery breaths.
- **Secondary ("Prepare"):** Uses `secondary_container` color. Refined and warm.
- **Tertiary:** Text-only using `primary` color, reserved for "Cancel" or "Settings."

### Progress Indicators (The "Oxygen Flow")

Forbid thin, mechanical loading bars. Use thick, soft-ended strokes using the `primary_fixed` token. The progress indicator should feel like it is "filling" a vessel, not just checking a box.

### Lists & Cards (The "Void" List)

Forbid dividers. Separate log entries using the **Spacing Scale** (Level 4 / 1.4rem). Use a `surface_container_lowest` background for the card body and `surface_container_highest` for the "Active" state.

### Specialized Component: The "Focus Ring"

A large, circular ring surrounding the countdown timer. Use a `tertiary` stroke for the "Empty" state and a `primary` glow for the "Active" state. This provides a peripheral visual cue for the diver so they don't have to focus their eyes on the digits.

## 6. Do’s and Don'ts

### Do:

- **DO** use the `20` (7rem) spacing unit for top-level padding. Breathing room is literal in this app.
- **DO** use `surface_bright` for momentary "Flash" states (e.g., when a hold is completed).
- **DO** ensure all touch targets for "Stop" or "Emergency" buttons are at least `xl` size.

### Don't:

- **DON'T** use pure white (`#FFFFFF`). It causes "haloing" in dark mode. Always use `on_surface` (`#dde4e6`).
- **DON'T** use 100% opaque borders. They create a "boxed-in" feeling that triggers claustrophobia—the opposite of a meditative state.
- **DON'T** use rapid animations. All transitions should be at least `400ms` with a `cubic-bezier(0.4, 0, 0.2, 1)` easing to mimic the slow movement of water.
