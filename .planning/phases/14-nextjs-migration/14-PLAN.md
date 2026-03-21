# Phase 14: Next.js Migration — Executable Plan

---

phase: 14-nextjs-migration
plans:

- id: "01"
  tasks: 9
  files: 45
  depends_on: [13-deployment]
  type: execute
  wave: 1
  files_modified:
- package.json
- next.config.ts
- app/layout.tsx
- app/page.tsx
- app/globals.css
- app/sw.ts
- app/manifest.ts
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- app/api/auth/me/route.ts
- app/api/progress/route.ts
- app/api/user/active-plan/route.ts
- app/day/[dayId]/page.tsx
- app/session/page.tsx
- app/session/complete/page.tsx
- app/settings/page.tsx
- lib/db.ts
- lib/auth.ts
- lib/jwt.ts
- lib/plan.ts
- .github/workflows/deploy.yml
- playwright.config.ts
- vitest.config.ts
  autonomous: false
  requirements: []
  user_setup:
- "Update systemd service if PORT changes (Next.js default 3000)"
- "Verify RangeRequestsPlugin import (serwist vs serwist/legacy)"
  must_haves:
  truths: - "Express API routes migrated to Next.js Route Handlers" - "React pages/components migrated to Next.js App Router" - "PWA, offline support, and audio precache preserved" - "Deployment updated for .next/standalone" - "All existing functionality works (login, session, progress, settings)"
  artifacts: - path: app/api/auth/login/route.ts
  provides: "Auth login Route Handler"
  contains: "POST" - path: app/api/progress/route.ts
  provides: "Progress API Route Handler"
  contains: "GET" - path: app/sw.ts
  provides: "Serwist service worker with audio precache"
  contains: "additionalPrecacheEntries"
  key_links: - from: next.config.ts
  to: app/sw.ts
  via: "withSerwistInit"
  pattern: "swSrc"

---

## Objective

Migrate the Freediving Breathhold Trainer from Vite + Express to Next.js. Single framework for frontend and API; PWA and offline support preserved; deployment uses standalone output.

**Purpose:** Simplify stack; single dev server; unified routing; modern React patterns.

**Principles:**

- App Router + Route Handlers (no Pages Router)
- Same API paths: /api/auth, /api/progress, /api/user
- @serwist/next for PWA (audio precache + RangeRequestsPlugin)
- output: 'standalone' for VM deployment
- better-sqlite3 in Node.js runtime (default)

**Output:** Next.js app; Route Handlers; App Router pages; PWA; updated deploy workflow.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/phases/14-nextjs-migration/14-RESEARCH.md

**Existing:** Vite frontend (React 19, Tailwind 4), Express backend (auth, progress, user), vite-plugin-pwa, dual servers for E2E.

**Reference:** 14-RESEARCH.md — Route Handlers, getAuthUser helper, Serwist patterns, standalone deployment.

---

## Plan 01: Next.js Migration

### Task 1: Next.js Scaffold + Config

**Files:** `package.json`, `next.config.ts`, `tsconfig.json` (or extend existing)

**Action:**

1. Add Next.js and Serwist deps; remove Vite, vite-plugin-pwa, express, cors, cookie-parser:
   ```bash
   npm install next@^15 react react-dom better-sqlite3 bcrypt jsonwebtoken clsx date-fns idb lodash type-fest
   npm install -D @serwist/next serwist @tailwindcss/postcss tailwindcss
   npm uninstall vite @vitejs/plugin-react vite-plugin-pwa express cors cookie-parser
   ```
2. Create `next.config.ts`:
   - `output: 'standalone'`
   - `withSerwistInit` from @serwist/next (swSrc: 'app/sw.ts', swDest: 'public/sw.js')
   - `additionalPrecacheEntries` for /audio/\*.m4a (hold, prepare, 30s, breathe)
   - `transpilePackages` if needed for idb
3. Update `package.json` scripts:
   - `dev`: `next dev`
   - `build`: `next build`
   - `start`: `next start`
   - `lint`: `next lint` (or keep eslint)
4. Add `@tailwindcss/postcss` and `postcss.config.mjs` for Tailwind 4.
5. Create `app/` directory; `app/globals.css` (migrate from `src/index.css`).

**Verification:** `npm run dev` starts Next.js; `npm run build` succeeds.

---

### Task 2: Lib Migration (db, auth, schema)

**Files:** `lib/db.ts`, `lib/auth.ts`, `lib/jwt.ts`, `lib/schema.sql` (or inline)

**Action:**

1. Create `lib/db.ts`:
   - Port from `server/db.js`; use `path.join(process.cwd(), ...)` for schema/data paths
   - DB_PATH from `process.env.FREEDIVING_DB_PATH` or `join(process.cwd(), 'data.db')`
   - Export `db`, `runSchema`, `seedUsers`; call schema/seed on init
2. Create `lib/auth.ts`:
   - Port `verifyPassword`, `createToken` from `server/auth.js`
   - Add `getAuthUser()`: read token from `cookies().get('token')` or `headers().get('authorization')`; call `verifyToken`; return user or null
3. Create `lib/jwt.ts` (or keep in auth): `verifyToken` using `jsonwebtoken`
4. Copy `server/schema.sql` to `lib/schema.sql` or `prisma/`; ensure db init runs before first request (or use lazy init)

**Verification:** `lib/db` and `lib/auth` can be imported; `getAuthUser` returns null when no cookie.

---

### Task 3: API Routes — Auth

**Files:** `app/api/auth/login/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts`

**Action:**

1. `app/api/auth/login/route.ts` (POST):
   - Parse `request.json()` for username, password
   - Query db for user; verify password; create token
   - `cookies().set('token', token, { httpOnly, secure, sameSite: 'lax', path: '/', maxAge: 7*24*60*60 })`
   - Return `Response.json({ user: { id, username } })`
2. `app/api/auth/logout/route.ts` (POST):
   - `cookies().delete('token')`
   - Return `new Response(null, { status: 204 })`
3. `app/api/auth/me/route.ts` (GET):
   - Call `getAuthUser()`; if null return 401
   - Return `Response.json({ user })`
4. Add `export const runtime = 'nodejs'` to each route (explicit, since better-sqlite3 is Node-only)

**Verification:** `curl -X POST http://localhost:3000/api/auth/login -d '{"username":"nico","password":"password"}' -H "Content-Type: application/json"` returns user; `/api/auth/me` with cookie returns user.

---

### Task 4: API Routes — Progress + User

**Files:** `app/api/progress/route.ts`, `app/api/user/active-plan/route.ts`

**Action:**

1. `app/api/progress/route.ts`:
   - GET: `getAuthUser()`; query `plan_id` from `request.nextUrl.searchParams`; return completions
   - POST: parse body for `plan_id`, `day_id` or `day_index`; resolve day_id from plan if needed; INSERT OR REPLACE
   - DELETE: require `plan_id` query param; delete completions for user+plan
2. `app/api/user/active-plan/route.ts`:
   - GET: `getAuthUser()`; return `{ plan_id }` or 404
   - PUT: parse body for `plan_id`; INSERT OR REPLACE in user_active_plan
3. Port `loadPlan` and `getDayAtIndex` from `server/routes/progress.js` to `lib/plan.ts`; read from `src/data/*-plan.json` (add `lib/plan.ts` to files if created)
4. Add `runtime = 'nodejs'` to each route

**Verification:** GET/POST/DELETE progress work; GET/PUT active-plan work with auth cookie.

---

### Task 5: Root Layout + Pages Shell

**Files:** `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

**Action:**

1. `app/layout.tsx`:
   - Metadata: title "Fishly — Breathhold Protocol", applicationName "Fishly"
   - Viewport: themeColor "#52dad3"
   - `<html lang="en" className="dark">`; `<body>{children}</body>`
   - Wrap with `TrainingProvider` (from contexts)
2. `app/globals.css`:
   - Migrate `src/index.css` (Tailwind @theme, :root, body)
   - Remove `#root` if not needed (Next.js uses body)
3. `app/page.tsx`:
   - Redirect or render Dashboard; use `AppContent`-style logic (auth check, plan load, routes)
4. Create route structure: `/`, `/day/[dayId]`, `/session`, `/session/complete`, `/settings`
5. Add `'use client'` to components that use hooks (TrainingContext, useRouter, etc.)

**Verification:** `npm run dev` shows layout; `/` loads (may show login or dashboard).

---

### Task 6: Page Migration (Dashboard, Session, Settings)

**Files:** `app/page.tsx`, `app/day/[dayId]/page.tsx`, `app/session/page.tsx`, `app/session/complete/page.tsx`, `app/settings/page.tsx`

**Action:**

1. Replace React Router with Next.js:
   - `useNavigate` → `useRouter` from `next/navigation`; `navigate('/x')` → `router.push('/x')`
   - `<Link to="/x">` → `<Link href="/x">` from `next/link`
   - `<Route path="/x">` → file-based: `app/x/page.tsx`
2. Migrate `AppContent` logic into layout or shared client component:
   - Auth check (user undefined → loading; !user → LoginPage)
   - Error/plan loading states
   - Route guards: SessionRouteGuard, SessionCompleteRouteGuard → redirect via `router.replace` or layout
3. `app/page.tsx` and `app/day/[dayId]/page.tsx`: render `<Dashboard />`; pass `dayId` from params to Dashboard
4. `app/session/page.tsx`: render `<ActiveSessionView />` with route guard
5. `app/session/complete/page.tsx`: render `<SessionCompleteView />` with route guard
6. `app/settings/page.tsx`: render `<SettingsView />`
7. Move `src/components`, `src/contexts`, `src/hooks`, `src/services`, `src/pages` into `src/` (keep structure) or `app/`; update imports to use `@/` alias

**Verification:** All routes work; login → dashboard → day → session → complete → settings; back navigation works.

---

### Task 7: PWA with Serwist (Audio Precache)

**Files:** `app/sw.ts`, `next.config.ts`, `app/manifest.ts` (or `manifest.json`)

**Action:**

1. In `next.config.ts` (withSerwistInit):
   - `additionalPrecacheEntries`: `/audio/hold.m4a`, `/audio/prepare.m4a`, `/audio/30s.m4a`, `/audio/breathe.m4a` (revision: null)
2. Create `app/sw.ts`:
   - Use Serwist with `precacheEntries: self.__SW_MANIFEST`
   - `runtimeCaching`: add CacheFirst for audio (`request.destination === 'audio'` or `\.(m4a|mp3|wav|ogg)$`)
   - Use `CacheableResponsePlugin({ statuses: [200, 206] })` and `RangeRequestsPlugin` (from serwist or serwist/legacy)
   - `skipWaiting`, `clientsClaim`, `navigationPreload`
3. PWA manifest: `app/manifest.ts` or `public/manifest.json` with name, short_name, theme_color, icons, start_url
4. Copy `public/audio`, `public/icons` from current structure (or ensure they exist in `public/`)

**Verification:** Build succeeds; service worker registers; audio files precached; offline playback works (manual test).

---

### Task 8: Deployment Update

**Files:** `.github/workflows/deploy.yml`, `start_freediving.sh`, `.env.production.example`, `freediving.service.example`

**Action:**

1. Update deploy workflow:
   - Build: `npm run build` (produces `.next/`)
   - Copy into standalone, then zip:
     ```yaml
     - run: |
         npm run build
         cp -r public .next/standalone/
         cp -r .next/static .next/standalone/.next/
         cd .next/standalone && zip -r ../../build.zip . && cd ../..
     ```
   - Standalone is self-contained; `modules.zip` for node_modules may no longer be needed (Next.js bundles deps)
   - Start: `node server.js` from standalone (Next.js outputs `server.js` in standalone)
2. Update `start_freediving.sh`:
   - `cd` to app dir; `node server.js` (or `node .next/standalone/server.js` if different)
   - Standalone structure: `node server.js` runs from standalone folder; ensure `public` and `.next/static` are sibling to `server.js`
3. Next.js standalone: typically `cp -r public .next/standalone/` and `cp -r .next/static .next/standalone/.next/` before zip
4. Update `.env.production.example`: PORT (3000 default), others unchanged
5. Update `freediving.service.example` if PORT or paths change

**Verification:** `npm run build`; inspect `.next/standalone`; run `node server.js` from standalone; app serves.

---

### Task 9: Tests (Vitest + Playwright)

**Files:** `vitest.config.ts`, `playwright.config.ts`, `next.config.ts` (vitest integration)

**Action:**

1. Playwright:
   - Single webServer: `npm run dev` (Next.js serves both frontend and API)
   - baseURL: `http://localhost:3000` (or `process.env.PORT` if different)
   - Remove dual server setup (no VITE_API_PORT); set `FREEDIVING_DB_PATH=:memory:` in webServer env
2. Vitest:
   - Use `@vitejs/plugin-react` or Next.js Vitest setup (see nextjs.org/docs/app/building-your-application/testing/vitest)
   - Ensure `src/test/setup.ts` still loads (fake-indexeddb)
   - Exclude `app/`, `e2e/` from unit test glob if needed
3. Update E2E tests: baseURL, any API path changes (should be same /api/\*)
4. Ensure `npm run test:run` and `npm run test:e2e` pass

**Verification:** `npm run test:run` passes; `npm run test:e2e` passes with single Next.js dev server.

---

## Task Dependencies

```
Task 1 (scaffold) ──┬──> Task 2 (lib)
                    ├──> Task 5 (layout)
                    └──> Task 7 (PWA config)
Task 2 ──> Task 3 (auth API)
Task 2 ──> Task 4 (progress/user API)
Task 5 ──> Task 6 (pages)
Task 3,4 ──> Task 6 (pages use API)
Task 6 ──> Task 7 (PWA)
Task 1,7 ──> Task 8 (deploy)
Task 1,6 ──> Task 9 (tests)
```

---

## Success Criteria Checklist

| Criterion                | Task | Verification                                           |
| ------------------------ | ---- | ------------------------------------------------------ |
| Express → Route Handlers | 3, 4 | /api/auth, /api/progress, /api/user work               |
| React → App Router       | 5, 6 | /, /day/:dayId, /session, /session/complete, /settings |
| PWA + offline + audio    | 7    | Serwist SW; precache; RangeRequestsPlugin              |
| Deploy .next/standalone  | 8    | build; zip; node server.js                             |
| All functionality        | 6, 9 | E2E login, session, complete                           |

---

## How to Test

1. **Local dev:** `npm run dev` — open http://localhost:3000; login, run session, complete, check settings
2. **Build:** `npm run build && npm run start` — verify production build
3. **Unit tests:** `npm run test:run`
4. **E2E:** `npm run test:e2e` — login, session flow
5. **Offline:** Build, serve, go offline, reload — app and audio should work

---

## User Setup (Manual)

1. **RangeRequestsPlugin:** If `import { RangeRequestsPlugin } from 'serwist'` fails, try `serwist/legacy` or `workbox-range-requests`
2. **Server:** Update systemd service if PORT changes; ensure `.env.production` has FREEDIVING_DB_PATH, SESSION_SECRET, etc.
3. **First deploy:** Standalone folder structure may require copying public + static; follow Next.js standalone docs
