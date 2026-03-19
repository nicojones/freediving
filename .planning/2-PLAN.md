# Phase 2: Progress + Profile Services — Executable Plan

---
phase: 02-progress-profile
plans:
  - id: "01"
    tasks: 3
    files: 8
    depends_on: []
  - id: "02"
    tasks: 2
    files: 5
    depends_on: ["01"]
type: execute
wave: 1
files_modified:
  - package.json
  - vite.config.ts
  - server/index.js
  - server/db.js
  - server/schema.sql
  - server/auth.js
  - server/routes/auth.js
  - server/routes/progress.js
  - src/services/authService.ts
  - src/services/progressService.ts
  - src/pages/LoginPage.tsx
  - src/App.tsx
  - src/main.tsx
autonomous: true
requirements: [PROF-01, PROF-02, SESS-07]
user_setup:
  - service: backend
    why: "Initial user credentials"
    env_vars:
      - name: SESSION_SECRET
        source: "Generate with: openssl rand -hex 32"
      - name: USER_PASSWORD_NICO
        source: "Set password for nico (or use default in seed for dev)"
      - name: USER_PASSWORD_ATHENA
        source: "Set password for athena (or use default in seed for dev)"

must_haves:
  truths:
    - "User can log in with username/password (pre-defined users)"
    - "Backend persists progress in SQLite; PWA fetches/stores via API"
    - "App records session completion per user per day"
    - "Progress survives browser restart and syncs across devices"
  artifacts:
    - path: server/db.js
      provides: "SQLite connection and schema init"
      contains: "better-sqlite3, CREATE TABLE"
    - path: server/schema.sql
      provides: "users and progress_completions schema"
      contains: "user_id, plan_id, day_index, completed_at"
    - path: server/routes/auth.js
      provides: "POST /api/auth/login"
      exports: ["login"]
    - path: server/routes/progress.js
      provides: "POST /api/progress, GET /api/progress"
      exports: ["recordCompletion", "fetchCompletions"]
    - path: src/services/authService.ts
      provides: "Client-side auth (login, logout, getCurrentUser)"
    - path: src/services/progressService.ts
      provides: "Client-side progress (recordCompletion, fetchCompletions)"
    - path: src/pages/LoginPage.tsx
      provides: "Login form UI"
  key_links:
    - from: src/App.tsx
      to: src/services/authService.ts
      via: "require login before rendering main app"
      pattern: "getCurrentUser|login"
    - from: src/services/progressService.ts
      to: "/api/progress"
      via: "fetch"
      pattern: "fetch.*api/progress"
    - from: server/routes/progress.js
      to: "server/db.js"
      via: "SQLite insert/select"
      pattern: "progress_completions"
---

## Objective

Implement Progress + Profile Services so users can log in, and the app stores/retrieves session completion per user per day via a backend API. Progress persists in SQLite and syncs across devices.

**Purpose:** Phase 3+ need user context and completion data. Session completion (SESS-07) and per-profile progress (PROF-02) require this foundation.

**Output:** Backend (Node/Express + SQLite), auth + progress API, login page, auth + progress services, App wired to require login and use progress.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/2-CONTEXT.md
- @.planning/STATE.md

**Existing:** Phase 1 complete. `src/services/planService.ts`, `src/types/plan.ts`, `src/data/default-plan.json` exist. Plan = array of days; index = day number.

**Interfaces (from Phase 1):**

From `src/types/plan.ts`:
```typescript
export type Plan = PlanDay[]
export type PlanDay = TrainingDay | RestDay | null
export interface Interval { holdSeconds: number; recoverySeconds: number }
```

From `src/services/planService.ts`:
```typescript
export async function loadPlan(): Promise<Plan | { error: string }>
export function getIntervalsForDay(plan: Plan, dayIndex: number): Interval[] | null
```

**Decisions (from 2-CONTEXT):**
- Backend: Node/Express + SQLite (better-sqlite3)
- Auth: username/password, pre-defined users (nico, athena), no registration
- Progress schema: `user_id`, `plan_id`, `day_index`, `completed_at`; uniqueness on (user_id, plan_id, day_index)
- Plan ID: store in records; use "default" for single plan
- Session: survives browser restart; cross-device sync (server-side storage)

---

## Plan 01: Backend + Auth + Progress API

### Task 1: Backend server + SQLite schema

**Files:** `package.json`, `server/index.js`, `server/db.js`, `server/schema.sql`

**Action:**
1. Add backend dependencies: `express`, `better-sqlite3`, `bcrypt`, `jsonwebtoken`, `cookie-parser`, `cors`. Add `"type": "module"` or use .mjs if needed; ensure server runs as ESM.
2. Create `server/index.js`: Express app, CORS for `http://localhost:5173` (Vite dev), `cookie-parser`, mount routes at `/api/auth` and `/api/progress`. Listen on `PORT` (default 3001). Add `npm run server` script.
3. Create `server/db.js`: Initialize better-sqlite3, run schema from `server/schema.sql` on startup. Export `db` and `runSchema()`.
4. Create `server/schema.sql`:
   - `users`: `id INTEGER PRIMARY KEY`, `username TEXT UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`
   - `progress_completions`: `user_id INTEGER NOT NULL`, `plan_id TEXT NOT NULL`, `day_index INTEGER NOT NULL`, `completed_at INTEGER NOT NULL`, `PRIMARY KEY (user_id, plan_id, day_index)`, `FOREIGN KEY (user_id) REFERENCES users(id)`
5. Seed users: In `db.js` or a separate `seed.js`, insert `nico` and `athena` with bcrypt-hashed passwords. Use `process.env.USER_PASSWORD_NICO` and `USER_PASSWORD_ATHENA` if set; else use `"password"` for dev. Run seed on first init.
6. Vite proxy: Add `server.proxy: { '/api': 'http://localhost:3001' }` to `vite.config.ts` so frontend fetches `/api/*` hit the backend.

**Verify:**
```bash
npm run server
# Server starts on 3001; no errors
```

**Done:** Backend runs; SQLite DB created with users and progress_completions; nico and athena seeded.

---

### Task 2: Auth API (login, session)

**Files:** `server/auth.js`, `server/routes/auth.js`

**Action:**
1. Create `server/auth.js`: 
   - `hashPassword(password)`: bcrypt.hash
   - `verifyPassword(password, hash)`: bcrypt.compare
   - `createToken(user)`: sign JWT with `{ userId, username }`, expiry 7 days. Use `process.env.SESSION_SECRET` or fallback for dev.
   - `verifyToken(token)`: verify and decode; return user or null
   - `authMiddleware(req, res, next)`: read token from `req.cookies.token` (or `Authorization: Bearer` header); verify; set `req.user`; 401 if invalid.
2. Create `server/routes/auth.js`:
   - `POST /api/auth/login`: body `{ username, password }`. Look up user by username; verify password. If valid: create token, set `res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7*24*60*60*1000 })`, return `{ user: { id, username } }`. Else 401.
   - `POST /api/auth/logout`: clear cookie, return 204.
   - `GET /api/auth/me`: use authMiddleware; return `{ user: { id, username } }` or 401.
3. Mount auth routes in `server/index.js`.

**Verify:**
```bash
curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"nico","password":"password"}' -c cookies.txt -v
# Returns 200 with user; Set-Cookie: token=...
curl -b cookies.txt http://localhost:3001/api/auth/me
# Returns 200 with user
```

**Done:** Login returns 200 + token cookie; /me returns 401 when unauthenticated, 200 when authenticated.

---

### Task 3: Progress API

**Files:** `server/routes/progress.js`

**Action:**
1. Create `server/routes/progress.js`:
   - `POST /api/progress`: body `{ plan_id, day_index }`. Require auth (authMiddleware). Insert or replace `progress_completions` with `user_id=req.user.id`, `plan_id`, `day_index`, `completed_at=Date.now()`. Use `INSERT OR REPLACE` or upsert. Return 201 `{ ok: true }`.
   - `GET /api/progress`: query `?plan_id=default` (optional, default "default"). Require auth. Select rows for `user_id=req.user.id` and given plan_id. Return `{ completions: [{ plan_id, day_index, completed_at }] }`.
2. Mount progress routes in `server/index.js`.

**Verify:**
```bash
# After login (with cookie)
curl -b cookies.txt -X POST http://localhost:3001/api/progress -H "Content-Type: application/json" -d '{"plan_id":"default","day_index":0}'
# Returns 201
curl -b cookies.txt "http://localhost:3001/api/progress?plan_id=default"
# Returns 200 with completions array
```

**Done:** Progress can be recorded and fetched per user; auth required.

---

## Plan 02: Frontend Auth + Progress + Wire App

### Task 4: Frontend auth service + login page

**Files:** `src/services/authService.ts`, `src/pages/LoginPage.tsx`

**Action:**
1. Create `src/services/authService.ts`:
   - `login(username: string, password: string): Promise<{ user } | { error: string }>`: POST `/api/auth/login`, credentials: 'include'. On 200: return { user }. On 401: return { error: 'Invalid credentials' }.
   - `logout(): Promise<void>`: POST `/api/auth/logout`, credentials: 'include'.
   - `getCurrentUser(): Promise<{ id: number; username: string } | null>`: GET `/api/auth/me`, credentials: 'include'. On 200: return user. On 401: return null.
2. Create `src/pages/LoginPage.tsx`: Form with username and password inputs, submit button. On submit: call `authService.login(username, password)`. On success: redirect or set state so parent shows app. On error: show error message. Keep it simple (no router required for now — use state/callback).

**Verify:**
```bash
npm run dev
# Visit app; see login form; login with nico/password; should redirect or show main app
```

**Done:** Login page renders; valid credentials log user in; invalid show error.

---

### Task 5: Frontend progress service + wire App

**Files:** `src/services/progressService.ts`, `src/App.tsx`, `src/main.tsx`

**Action:**
1. Create `src/services/progressService.ts`:
   - `recordCompletion(planId: string, dayIndex: number): Promise<{ ok: boolean } | { error: string }>`: POST `/api/progress` with `{ plan_id: planId, day_index: dayIndex }`, credentials: 'include'. Return result or error.
   - `fetchCompletions(planId?: string): Promise<{ plan_id: string; day_index: number; completed_at: number }[]>`: GET `/api/progress?plan_id=...`, credentials: 'include'. Return completions array or [] on error.
2. Update `src/App.tsx`:
   - On mount: call `authService.getCurrentUser()`. If null: render `<LoginPage onLoginSuccess={...} />` (or similar). If user: render main app.
   - Main app: show plan info (from planService) and a way to record completion (e.g. "Mark day 0 complete" button for demo). Call `progressService.recordCompletion('default', 0)` on click. On "Mark day 0 complete", also fetch and display completions count. This proves: login required, progress can be recorded and fetched.
   - Provide `onLogout` that calls `authService.logout()` and refreshes state.
3. Ensure `main.tsx` or App fetches `getCurrentUser` before rendering; show loading state briefly if needed.

**Verify:**
```bash
npm run dev
# Visit app; login; see plan; click "Mark day 0 complete"; refresh page; still logged in; completions persist
# Open in another browser/device; login; see same completions (cross-device sync)
```

**Done:** App requires login; user can record completion; progress survives refresh; syncs across devices (same backend).

---

## Verification

| Success Criterion | How to Verify |
|-------------------|---------------|
| User can log in with username/password | Login page; nico/password succeeds; invalid fails |
| Backend persists progress in SQLite | POST /api/progress; restart server; GET completions still returns data |
| App records session completion per user per day | Click "Mark day X complete"; GET /api/progress shows it |
| Progress survives browser restart | Close browser; reopen; login; completions still there |
| Cross-device sync | Login from second browser; same completions |

---

## Success Criteria

1. **User can log in with username/password (pre-defined users, no registration)** — ✓ Login page; nico, athena work; invalid credentials rejected.
2. **Backend persists progress in SQLite; PWA fetches/stores via API** — ✓ POST/GET /api/progress; SQLite stores progress_completions.
3. **App records session completion per user per day** — ✓ recordCompletion(planId, dayIndex) writes to backend; fetchCompletions returns per-user data.
4. **Progress survives browser restart and syncs across devices** — ✓ Session survives (cookie); progress in DB; same user on different device sees same data.

---

## Output

After completion:
- `server/` — Express backend, SQLite, auth + progress routes
- `src/services/authService.ts` — login, logout, getCurrentUser
- `src/services/progressService.ts` — recordCompletion, fetchCompletions
- `src/pages/LoginPage.tsx` — login form
- `src/App.tsx` — requires login; wires progress; demo "Mark day complete"

---

## Dependency Graph

```
Task 1 (backend + schema) ──┬──> Task 2 (auth API)
                            │
                            └──> Task 3 (progress API)
                                      │
Task 2 ───────────────────────────────┼──> Task 4 (auth service + login page)
                                      │
Task 3 ───────────────────────────────┼──> Task 5 (progress service + wire App)
                                      │
Task 4 ───────────────────────────────┘
```

**Waves:** 1 → 2,3 (parallel) → 4,5 (4 depends on 2; 5 depends on 2,3,4). Sequential: 1 → 2 → 3 → 4 → 5 (simplest).
