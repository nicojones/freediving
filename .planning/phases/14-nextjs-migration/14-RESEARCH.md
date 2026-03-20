# Phase 14: Next.js Migration — Research

**Researched:** 2025-03-20
**Domain:** Next.js migration, Express→Route Handlers, PWA, self-hosted deployment
**Confidence:** HIGH

## Summary

Migrate the Freediving Breathhold Trainer from Vite + Express to Next.js. The app is a PWA with cookie-based auth, SQLite backend, and offline-first progress sync. Next.js App Router with Route Handlers replaces Express; @serwist/next replaces vite-plugin-pwa; standalone output replaces dist/ + server/ for deployment.

**Primary recommendation:** Use App Router, Route Handlers for API, @serwist/next for PWA with audio precache + RangeRequestsPlugin, output: 'standalone' for VM deployment. better-sqlite3 works in Node.js runtime (default); deployment is a long-running process, not serverless.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| Migration | Express API routes → Next.js Route Handlers | Route Handlers use Web Request/Response; cookies via next/headers; request.json() for body |
| Migration | React pages/components → Next.js App Router | App Router recommended; folder-based routing; client components with 'use client' |
| PWA | PWA, offline, audio precache preserved | @serwist/next; additionalPrecacheEntries for audio; runtimeCaching + RangeRequestsPlugin |
| Deploy | Deployment updated for .next/ | output: 'standalone'; zip .next/standalone + public + .next/static; node server.js |
| Parity | All existing functionality works | Same API paths (/api/auth, /api/progress, /api/user); same fetch calls; E2E unchanged |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|---------------|
| next | ^15 | Full-stack React framework | Single framework for frontend + API; App Router stable; Route Handlers replace Express |
| @serwist/next | ^9.5 | PWA with Workbox | Next.js official PWA docs recommend Serwist; Workbox fork; precache + runtime caching |
| serwist | ^9.5 | Service worker core | Required by @serwist/next; RangeRequestsPlugin for audio |
| better-sqlite3 | ^11.6 | SQLite DB | Already used; works in Node.js runtime (default); VM deployment = persistent filesystem |
| react | ^19 | UI | Already used; Next.js uses React |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcrypt | ^5.1 | Password hashing | Auth (unchanged) |
| jsonwebtoken | ^9.0 | JWT tokens | Auth (unchanged) |
| tailwindcss | ^4.2 | Styling | Next.js supports Tailwind 4 via @tailwindcss/postcss |
| vitest | ^4.0 | Unit tests | Official Next.js Vitest guide; works with client components |
| @playwright/test | ^1.58 | E2E tests | Single Next.js dev server replaces two servers |

**Installation:**
```bash
npm install next@latest react react-dom better-sqlite3 bcrypt jsonwebtoken cookie-parser clsx date-fns idb jsonwebtoken lodash type-fest
npm install -D @serwist/next serwist @tailwindcss/postcss tailwindcss @playwright/test vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

**Version verification:** next@16.2.0, @serwist/next@9.5.7 (verified 2025-03-20)

## Architecture Patterns

### Recommended Project Structure

```
app/
├── layout.tsx              # Root layout, metadata, viewport
├── page.tsx                # / (Dashboard or redirect)
├── manifest.ts             # PWA manifest (or manifest.json)
├── sw.ts                   # Serwist service worker source
├── (auth)/
│   ├── login/page.tsx      # Optional: dedicated login route
│   └── ...
├── day/[dayId]/page.tsx    # /day/:dayId
├── session/page.tsx        # /session
├── session/complete/page.tsx
├── settings/page.tsx
└── api/
    ├── auth/
    │   ├── login/route.ts
    │   ├── logout/route.ts
    │   └── me/route.ts
    ├── progress/route.ts   # GET, POST, DELETE
    └── user/
        └── active-plan/route.ts  # GET, PUT

src/
├── components/             # Reuse as-is (add 'use client' where needed)
├── contexts/
├── hooks/
├── services/               # authService, progressService, etc. — unchanged
├── pages/                  # Migrate to app/ routes
├── data/
└── ...
```

### Pattern 1: Route Handler (API migration)

**What:** Replace Express route with Next.js Route Handler using Web Request/Response.
**When to use:** All /api/* endpoints.
**Example:**
```typescript
// app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  if (!username || !password) {
    return Response.json({ error: 'Username and password required' }, { status: 400 })
  }
  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username)
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const token = createToken({ id: user.id, username: user.username })
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
  return Response.json({ user: { id: user.id, username: user.username } })
}
```

### Pattern 2: Auth middleware for Route Handlers

**What:** Shared auth check; no Express middleware — extract to helper, call in each protected route.
**Example:**
```typescript
// lib/auth.ts
import { cookies } from 'next/headers'
import { verifyToken } from './jwt'

export async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value ?? 
    (await import('next/headers').then(m => m.headers()).then(h => h.get('authorization')?.replace('Bearer ', '')))
  if (!token) return null
  return verifyToken(token)
}

// In route: const user = await getAuthUser(); if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })
```

### Pattern 3: Client component with React Router → Next.js Link + useRouter

**What:** Replace React Router with Next.js navigation.
**When to use:** All pages that use useNavigate, Link, Route.
**Example:**
```typescript
'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Replace <Link to="/settings"> with <Link href="/settings">
// Replace navigate('/') with router.push('/')
```

### Pattern 4: PWA with Serwist (audio precache + RangeRequests)

**What:** @serwist/next wraps next.config; app/sw.ts defines Serwist with precache + runtimeCaching for audio.
**Example:**
```typescript
// next.config.ts
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [
    { url: '/audio/hold.m4a', revision: null },
    { url: '/audio/prepare.m4a', revision: null },
    { url: '/audio/30s.m4a', revision: null },
    { url: '/audio/breathe.m4a', revision: null },
  ],
})

export default withSerwist({ output: 'standalone', /* ... */ })
```

```typescript
// app/sw.ts
import { defaultCache } from '@serwist/next/worker'
import { CacheFirst, RangeRequestsPlugin, CacheableResponsePlugin, Serwist } from 'serwist'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: ({ request }) => request.destination === 'audio' || /\.(m4a|mp3|wav|ogg)$/i.test(new URL(request.url).pathname),
      handler: new CacheFirst({
        cacheName: 'audio-cache',
        plugins: [
          new CacheableResponsePlugin({ statuses: [200, 206] }),
          new RangeRequestsPlugin(),
        ],
      }),
    },
  ],
})

serwist.addEventListeners()
```

**Note:** `RangeRequestsPlugin` may be in `serwist` or `serwist/legacy`; verify import. Chrome Workbox docs require it for cached audio playback.

### Anti-Patterns to Avoid

- **Don't use Pages Router:** App Router is recommended; migration would duplicate effort.
- **Don't assume serverless:** Deployment is VM with `node server.js`; better-sqlite3 is fine.
- **Don't skip audio precache:** Runtime caching alone fails for media; must precache + RangeRequestsPlugin.
- **Don't change API paths:** Frontend uses /api/auth, /api/progress, /api/user; keep them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API routes | Custom Express-like layer | Next.js Route Handlers | Built-in, Web APIs, cookies/headers support |
| PWA / offline | Custom service worker | @serwist/next + serwist | Precaching, runtime cache, Workbox patterns |
| Audio offline | Manual cache logic | Precache + RangeRequestsPlugin | Browsers use range requests; 206 responses; complex edge cases |
| Auth middleware | Custom middleware chain | getAuthUser() helper in each route | Next.js has no Express-style middleware for Route Handlers |
| Deployment bundle | Manual node_modules copy | output: 'standalone' | Minimal deps, single server.js |

**Key insight:** PWA audio caching has subtle failure modes (range requests, 206, Safari); use Serwist/Workbox patterns, don't hand-roll.

## Common Pitfalls

### Pitfall 1: Caching Route Handlers by default

**What goes wrong:** Next.js 15+ changed GET Route Handlers to dynamic by default; older docs may show cached behavior.
**Why it happens:** Breaking change in v15 for predictability.
**How to avoid:** Expect dynamic; no change needed for auth/progress (all require fresh data).
**Warning signs:** Stale user data, cached 401s.

### Pitfall 2: better-sqlite3 in Edge runtime

**What goes wrong:** better-sqlite3 is a native Node addon; Edge runtime doesn't support it.
**Why it happens:** Default runtime for Route Handlers can vary.
**How to avoid:** Use Node.js runtime (default). Add `export const runtime = 'nodejs'` to route files if needed.
**Warning signs:** "Module not found" or "native addon" errors.

### Pitfall 3: Audio not playing offline

**What goes wrong:** Cached audio fails in Safari or returns 206 that breaks playback.
**Why it happens:** Must precache (not runtime cache) and use RangeRequestsPlugin.
**How to avoid:** Add audio URLs to additionalPrecacheEntries; use CacheFirst + RangeRequestsPlugin + CacheableResponsePlugin({ statuses: [200, 206] }); ensure `<audio crossorigin="anonymous">` if needed.
**Warning signs:** Audio plays online but not offline; duration shows 0.

### Pitfall 4: Standalone output missing files

**What goes wrong:** .next/standalone doesn't include public/ or .next/static by default.
**Why it happens:** Standalone is minimal; static assets are separate.
**How to avoid:** Copy `public` and `.next/static` into standalone folder before deploy. Next.js docs describe the layout.
**Warning signs:** 404 for /audio/*, /icons/*, or JS chunks.

### Pitfall 5: React Router imports break

**What goes wrong:** useNavigate, Link, Routes, Route from react-router-dom fail.
**Why it happens:** Next.js uses its own routing.
**How to avoid:** Replace with next/navigation (useRouter, usePathname) and next/link (Link). Migrate route guards to layout or component-level checks.
**Warning signs:** "Cannot find module" or hydration errors.

## Code Examples

### Route Handler with cookies

```typescript
// app/api/auth/logout/route.ts
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  return new Response(null, { status: 204 })
}
```

### Route Handler with query params

```typescript
// app/api/progress/route.ts, GET
import { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })
  const planId = request.nextUrl.searchParams.get('plan_id') || 'default'
  const rows = db.prepare('SELECT plan_id, day_id, completed_at FROM progress_completions WHERE user_id = ? AND plan_id = ?')
    .all(user.id, planId)
  return Response.json({ completions: rows })
}
```

### Layout with metadata

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fishly — Breathhold Protocol',
  applicationName: 'Fishly',
}

export const viewport: Viewport = {
  themeColor: '#52dad3',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router | Next 13+ | Folder routing, Server Components, Route Handlers |
| getServerSideProps | Async Server Components / fetch | Next 13+ | Data in components |
| Express API routes | Route Handlers | Next 13.2+ | Web Request/Response API |
| next-pwa (deprecated) | @serwist/next | 2024+ | Serwist = Workbox fork; maintained |
| Vite build | next build | N/A | Different output; use standalone |

**Deprecated/outdated:**
- next-pwa (wakeup0706): Unmaintained; @ducanh2912/next-pwa recommends @serwist/next
- Pages Router for new apps: Still supported but App Router recommended

## Open Questions

1. **RangeRequestsPlugin import path**
   - What we know: Serwist v9 merged packages; WebSearch says RangeRequestsPlugin in serwist or serwist/legacy
   - What's unclear: Exact export path in serwist@9.5.7
   - Recommendation: Try `import { RangeRequestsPlugin } from 'serwist'`; if missing, try `serwist/legacy` or workbox-range-requests

2. **Tailwind 4 with Next.js**
   - What we know: create-next-app can add Tailwind 4; @tailwindcss/postcss used
   - What's unclear: Exact config for existing Tailwind 4 project (e.g. @tailwindcss/vite → @tailwindcss/postcss)
   - Recommendation: Use Next.js Tailwind setup; migrate globals.css; test custom theme (--color-primary, etc.)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (unit), Playwright 1.58 (E2E) |
| Config file | vitest in next.config or vitest.config.ts; playwright.config.ts |
| Quick run command | `npm run test:run` |
| Full suite command | `npm run test:run && npm run test:e2e` |

### Phase Requirements → Test Map

| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|--------------|
| API migration | Auth, progress, user routes work | E2E | `npm run test:e2e` | ✅ e2e/login.spec.ts, session-flow.spec.ts |
| PWA | Offline, audio precache | Manual | — | Manual validation |
| Deploy | Build succeeds, standalone output | CI | `npm run build` | ✅ .github/workflows/deploy.yml |
| Parity | All functionality | E2E | `npm run test:e2e` | ✅ |

### Sampling Rate

- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run && npm run test:e2e`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps

- [ ] playwright.config.ts — change webServer from two servers to single `npm run dev` (Next.js serves both)
- [ ] vitest.config.ts — ensure compatible with Next.js (or use Next.js Vitest example)
- [ ] E2E baseURL — may stay same if Next dev runs on 5174 or use 3000

## Sources

### Primary (HIGH confidence)

- Next.js docs: Route Handlers, PWA, output standalone
- Serwist docs: Getting started, configuring, runtime caching
- Chrome Workbox: Serving cached audio and video, RangeRequestsPlugin

### Secondary (MEDIUM confidence)

- WebSearch: Next.js 15 App Router, Serwist + Next.js, better-sqlite3 Next.js
- npm: next@16.2.0, @serwist/next@9.5.7

### Tertiary (LOW confidence)

- RangeRequestsPlugin in Serwist: WebSearch suggests serwist or serwist/legacy; docs don't list it explicitly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js, Serwist, better-sqlite3 verified
- Architecture: HIGH — Route Handlers, App Router patterns from official docs
- Pitfalls: HIGH — Documented from Workbox, Next.js, deployment experience

**Research date:** 2025-03-20
**Valid until:** ~30 days (stable ecosystem)
