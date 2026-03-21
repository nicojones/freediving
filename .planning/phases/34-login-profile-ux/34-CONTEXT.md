# Phase 34: Login & Profile UX — Context

**Created:** 2025-03-21  
**Purpose:** Implementation decisions for UserProfileCard, Login page UX, and Fishly TopAppBar link.  
**Phase:** 34. Login & Profile UX

---

## Decisions (from user)

### 1. UserProfileCard — Email + Name vs Email Only

**Current:** `UserProfileCard` receives `username` and displays it. No email shown.

**Desired:** Show email (greyed out, smaller) and name (editable with pencil icon next to it).

**Two options (user presented both):**

| Option | Approach                                      | Migration | Notes                                                                                  |
| ------ | --------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| **A**  | Add `name` column to users; show email + name | Yes       | Name is editable (pencil). Name is for now unused elsewhere — display-only in profile. |
| **B**  | No migration                                  | No        | Display full email address in settings only. Simpler; no name field.                   |

**Planner decision:** Choose based on scope. Option B is simpler. Option A prepares for future name usage (e.g. display name in app).

---

### 2. Login Page — After Magic Link Sent

**Current:** Form stays visible; small "Check your email" message; input and button remain.

**Desired:**

1. **Hide the input** after email is sent.
2. **Larger text:** "Check the inbox for {email}" (show the email they entered).
3. **Greyed-out helper:** "If you didn't receive any email, wait some seconds and try again."
4. **"try again"** is a link that resets the page back to the original form, with the email still in the input box.

---

### 3. Fishly in TopAppBar — Navigation

**Current:** "Fishly" in TopAppBar is static text (no link).

**Desired:** Clicking "Fishly" navigates to the current training plan (Dashboard / Training tab).

---

## Gray Areas — Resolved

### A. UserProfileCard Display

- **Option A:** Migration adds `name`; UserProfileCard shows email (greyed, smaller) + name (editable with pencil). Name unused elsewhere for now.
- **Option B:** No migration; show full email in settings. Simpler.

### B. Login Success State

- Hide input and button.
- Larger "Check the inbox for {email}".
- Greyed-out "If you didn't receive any email, wait some seconds and try again" — "try again" is a link.
- Link resets to form state with email preserved.

### C. Fishly Link Target

- Navigate to current training plan = Dashboard (Training tab, root `/`).

---

## Implementation Implications

### UserProfileCard

- Needs `email` (and optionally `name`) from user object. Phase 33 adds `email` to users.
- If Option A: migration adds `name VARCHAR(255) NULL`; API returns name; editable via PATCH or similar.
- If Option B: pass `email` to UserProfileCard; display only.

### Login Page

- State: `emailSent: boolean` or similar to toggle between form view and success view.
- Success view: no form; "Check the inbox for {email}"; helper text with "try again" link.
- "Try again" onClick: set `emailSent = false`; keep `email` in state (do not clear).

### TopAppBar

- Wrap "Fishly" in `Link` or `router.push('/')`; ensure it goes to Dashboard/Training.
- May need to pass `href` or `onClick` from parent; TopAppBar is used in multiple views (Dashboard, Plans, Create, Settings, Session). Link to `/` is consistent for "current training plan".

---

## Code Context

### Current

| File                  | Current                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| `UserProfileCard.tsx` | Props: `username`; displays "Logged in as" + username                             |
| `SettingsView.tsx`    | `username = user?.username ?? DEFAULT_USERNAME`; passes to UserProfileCard        |
| `LoginPage.tsx`       | Form always visible; `successMessage = 'Check your email'`; no hide, no try-again |
| `TopAppBar.tsx`       | FishIcon + APP_NAME as static span; no link                                       |

### User Object (Phase 33+)

- `user: { id, username }` — Phase 33 adds `email` for magic-link users.
- Legacy users (nico, athena) may not have email; planner to handle.

---

## Out of Scope for Phase 34

- OAuth
- Password reset (no passwords for magic-link users)
- Name used elsewhere in app (if Option A, name is profile-only for now)

---

## Traceability

| Decision         | Outcome                                                                           |
| ---------------- | --------------------------------------------------------------------------------- |
| UserProfileCard  | Email + name (Option A) or email only (Option B) — planner to choose              |
| Login success UX | Hide input; "Check inbox for {email}"; try-again link resets with email preserved |
| Fishly link      | Navigate to `/` (current training plan)                                           |

---

_Context captured from /gsd-discuss-phase 34 — 2025-03-21_
