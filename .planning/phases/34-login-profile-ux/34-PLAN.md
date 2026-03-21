# Phase 34: Login & Profile UX — Plan

**Status:** Complete  
**Depends on:** Phase 33 (Sign Up — magic link, email on users)

---

## Goal

Improve login and profile UX: UserProfileCard shows email (Option B — no name migration); Login page hides form after magic link sent, shows "Check inbox for {email}" with try-again link; Fishly in TopAppBar links to current training plan (Dashboard at `/`).

---

## Success Criteria

1. UserProfileCard displays email (greyed, smaller) for magic-link users; falls back to username for legacy users without email
2. Login page: after magic link sent, input and button are hidden; shows "Check the inbox for {email}"; greyed helper "If you didn't receive any email, wait some seconds and try again" with "try again" as link; link resets to form with email preserved
3. Clicking "Fishly" in TopAppBar navigates to `/` (current training plan / Dashboard)

---

## Tasks

### 1. Auth API — return email (REQ-34-profile)

- [x] **1.1** In `app/api/auth/me/route.ts`: after `getAuthUser()`, if authenticated, call `initDb()`, then fetch full user from DB via `getDbConnection()`: `SELECT id, username, email FROM users WHERE id = ?`. Return `{ user: { id, username, email } }`. Handle legacy users (email may be NULL) — include email in response when present.

### 2. User type and context (REQ-34-profile)

- [x] **2.1** In `src/services/authService.ts`, extend `User` interface: `email?: string | null`. Update `getCurrentUser` return type.
- [x] **2.2** In `src/contexts/trainingContextState.ts`, extend user type: `user: { id: number; username: string; email?: string | null } | null | undefined`. Ensure `refreshUser` / `getCurrentUser` flow passes through.

### 3. UserProfileCard — email display (REQ-34-profile)

- [x] **3.1** Update `UserProfileCard` props: `username: string; email?: string | null`. Display: "Logged in as" label; primary text = `email ?? username` (Option B: email when present, else username for legacy). When showing email, use greyed smaller text (`text-on-surface-variant text-base`); when showing username, keep current `text-xl font-bold`.
- [x] **3.2** In `SettingsView.tsx`, pass `email={user?.email ?? undefined}` to `UserProfileCard`.

### 4. Login page — success state (REQ-34-login)

- [x] **4.1** Add state: `emailSent: boolean` (default false). On successful `requestMagicLink`, set `emailSent = true` (keep `email` in state).
- [x] **4.2** When `emailSent`: hide the form (input, button). Show: main text "Check the inbox for {email}" (larger, e.g. `text-lg` or `text-xl`); below, greyed helper "If you didn't receive any email, wait some seconds and try again." — "try again" is a clickable link/button.
- [x] **4.3** "Try again" onClick: set `emailSent = false`; keep `email` in state so input is pre-filled when form reappears.
- [x] **4.4** Preserve error display when `emailSent` (e.g. if user had an error before retry). Clear error on "try again" or on new submit.
- [x] **4.5** Add `data-testid="login-try-again"` for E2E.

### 5. TopAppBar — Fishly link (REQ-34-nav)

- [x] **5.1** In `TopAppBar.tsx`, wrap the FishIcon + APP_NAME block in a `Link` from `next/link` with `href="/"`. Use `className` to preserve styling; ensure it looks like a single clickable unit (e.g. `flex items-center gap-3`). Add `aria-label="Go to training"` or similar for accessibility.
- [x] **5.2** Ensure TopAppBar is used consistently; no `onBack` conflict — when `onBack` is present, Fishly link should still work (or consider layout: Fishly always links, Back is separate). Verify in Dashboard, Plans, Create, Settings, Session views.

### 6. Tests

- [x] **6.1** Unit: `authService.getCurrentUser` returns user with `email` when present (mock `/api/auth/me` response).
- [x] **6.2** E2E in `e2e/magic-link.spec.ts`: visit `/login`, fill email input, submit "Send me a link", assert success state shows "Check the inbox for {email}" and form is hidden; click "try again" (data-testid), assert form reappears with email pre-filled.
- [x] **6.3** E2E: TopAppBar — from Plans or Settings, click Fishly → navigates to `/` (Dashboard).

---

## File changes summary

| Action | File(s)                                                    |
| ------ | ---------------------------------------------------------- |
| Modify | `app/api/auth/me/route.ts`                                 |
| Modify | `src/services/authService.ts`                              |
| Modify | `src/contexts/trainingContextState.ts`                     |
| Modify | `src/components/settings/UserProfileCard.tsx`              |
| Modify | `src/components/settings/SettingsView.tsx`                 |
| Modify | `src/views/LoginPage.tsx`                                  |
| Modify | `src/components/layout/TopAppBar.tsx`                      |
| Modify | `src/services/authService.test.ts`                         |
| Modify | `e2e/magic-link.spec.ts` (login success state + try again) |
| Modify | `e2e/login.spec.ts` or new spec (TopAppBar Fishly → `/`)   |

---

## Context

- User decisions: `.planning/phases/34-login-profile-ux/34-CONTEXT.md`
- Option B chosen: email only in UserProfileCard; no `name` column migration
- Phase 33 adds `email` to users; legacy users (nico, athena) may have `email = NULL`
