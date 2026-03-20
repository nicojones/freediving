# Phase 13: Deployment — Executable Plan

---

phase: 13-deployment
plans:

- id: "01"
  tasks: 6
  files: 12
  depends_on: [12-tests]
  type: execute
  wave: 1
  files_modified:
- server/index.js
- package.json
- start_freediving.sh
- .github/workflows/deploy.yml
- .env.production.example
  autonomous: false
  requirements: []
  user_setup:
- "Create GitHub repo secrets: SSH_HOST, SSH_USER, SSH_PRIVATE_KEY"
- "Create systemd service on DigitalOcean VM"
- "Create /var/www/freediving on server"
  must_haves:
  truths: - "Server serves Vite dist/ and API in production" - "CORS origin configurable via CORS_ORIGIN env" - "GitHub Actions deploys on push to main" - "Deploy uses SCP + SSH (zip build, conditional node_modules)" - "systemctl restart freediving.service after deploy"
  artifacts: - path: .github/workflows/deploy.yml
  provides: "CI/CD deploy on push to main"
  contains: "Deploy Fishly" - path: start_freediving.sh
  provides: "Production start script"
  contains: "node server"
  key_links: - from: server/index.js
  to: dist/
  via: "express.static"
  pattern: "static"

---

## Objective

Deploy the app to DigitalOcean via GitHub Actions. Push to `main` triggers build, zip, SCP to server, and systemctl restart.

**Purpose:** Automated deployment; single source of truth (GitHub); no manual FTP/rsync.

**Principles:**

- Same pattern as Geonaut: zip build + conditional node_modules
- Server serves both API and static frontend
- Secrets in GitHub; env on VM for DB path, session secret, etc.

**Output:** `.github/workflows/deploy.yml`; server production-ready; `start_freediving.sh`; systemd service template.

---

## Context

- @.planning/PROJECT.md
- @.planning/ROADMAP.md
- @.planning/phases/13-deployment/13-RESEARCH.md

**Existing:** Vite frontend, Express backend. Server is API-only; CORS hardcoded to localhost:5173. No deployment pipeline.

**Reference:** Geonaut workflow (Next.js → zip → SCP → SSH → systemctl restart).

---

## Plan 01: Deployment

### Task 1: Server Production Mode (Static + CORS)

**Files:** `server/index.js`

**Action:**

1. Add static file serving for production:
   - If `NODE_ENV === 'production'`, serve `dist/` with `express.static('dist')`
   - Add SPA fallback: `app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')))` — only for non-API routes
   - API routes (`/api/*`) must be registered before static/fallback
2. Make CORS configurable:
   - Replace `origin: 'http://localhost:5173'` with `origin: process.env.CORS_ORIGIN || 'http://localhost:5173'`
   - In production, set `CORS_ORIGIN` to app URL (e.g. `https://fishly.example.com`)
3. Use `path` and `path.join` for cross-platform paths; `__dirname` is available in CommonJS (server uses .js).

**Verification:** Run `npm run build && NODE_ENV=production CORS_ORIGIN=https://example.com node server/index.js` — server serves dist/ and API.

---

### Task 2: Production Start Script

**Files:** `start_freediving.sh`

**Action:**

1. Create `start_freediving.sh` at project root:
   ```bash
   #!/bin/bash
   cd "$(dirname "$0")"
   export NODE_ENV=production
   exec node server/index.js
   ```
2. Ensure it is executable: `chmod +x start_freediving.sh`
3. Document: Server expects `dist/` to exist (built before deploy). Env vars: `PORT`, `FREEDIVING_DB_PATH`, `SESSION_SECRET`, `CORS_ORIGIN`, `USER_PASSWORD_NICO`, `USER_PASSWORD_ATHENA`.

**Verification:** `./start_freediving.sh` starts server (with dist/ present).

---

### Task 3: Environment Example

**Files:** `.env.production.example`

**Action:**

1. Create `.env.production.example` (do NOT commit real secrets):
   ```
   NODE_ENV=production
   PORT=3001
   FREEDIVING_DB_PATH=/var/www/freediving/data.db
   SESSION_SECRET=generate-a-strong-secret
   CORS_ORIGIN=https://your-domain.com
   USER_PASSWORD_NICO=...
   USER_PASSWORD_ATHENA=...
   ```
2. Add `.env.production` to `.gitignore` if not already.

**Verification:** File exists; no real secrets.

---

### Task 4: GitHub Actions Workflow

**Files:** `.github/workflows/deploy.yml`

**Action:**

1. Create `.github/workflows/deploy.yml`:
   - **Trigger:** `push` to `main`
   - **Steps:**
     1. Checkout (fetch-depth: 0)
     2. Setup Node 20, cache npm
     3. Check for dependency changes (tj-actions/changed-files: package.json, package-lock.json)
     4. `npm ci`
     5. `npm run build`
     6. Prepare zips:
        - `build.zip`: dist/, server/, package.json, package-lock.json, start_freediving.sh
        - `modules.zip`: node_modules (only if deps changed)
     7. Upload via appleboy/scp-action: host, username, key from secrets; source: build.zip,modules.zip; target: /var/www/freediving
     8. Post-deploy via appleboy/ssh-action:
        - cd /var/www/freediving
        - If modules.zip: rm -rf node_modules; unzip modules.zip; rm modules.zip
        - If build.zip: unzip -o build.zip; rm build.zip
        - systemctl restart freediving.service
2. Secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`

**Verification:** Push to main triggers workflow; manual run or dry-run to validate.

---

### Task 5: systemd Service Template

**Files:** `.planning/phases/13-deployment/freediving.service.example`

**Action:**

1. Create `freediving.service.example` in phase directory:

   ```ini
   [Unit]
   Description=Fishly — Freediving Breathhold Trainer
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/freediving
   EnvironmentFile=/var/www/freediving/.env.production
   ExecStart=/var/www/freediving/start_freediving.sh
   Restart=on-failure
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

2. Document in plan: Copy to `/etc/systemd/system/freediving.service`, `systemctl daemon-reload`, `systemctl enable freediving`, `systemctl start freediving`. User must create `.env.production` on server.

**Verification:** Example file exists; docs clear.

---

### Task 6: Vite Base URL for Production

**Files:** `vite.config.ts`

**Action:**

1. Ensure Vite build works when served from root. Default `base: '/'` is correct.
2. If API is same-origin in production (server serves both), frontend fetches `/api` — no proxy needed. Verify `fetch('/api/...')` or base URL in auth/progress services uses relative path.
3. Add `base: '/'` explicitly if needed for clarity.

**Verification:** Built app works when served from Express at `/`; API at `/api/*`.

---

## Task Dependencies

```
Task 1 (server prod) ──┬──> Task 2 (start script)
                       └──> Task 4 (workflow uses start script)
Task 2 ──> Task 4
Task 3 ──> (user setup on server)
Task 4 ──> Task 5 (systemd referenced in workflow)
Task 6 ──> (verify build)
```

---

## Success Criteria Checklist

| Criterion                | Task | Verification                      |
| ------------------------ | ---- | --------------------------------- |
| Server serves dist + API | 1    | NODE_ENV=production node server   |
| CORS configurable        | 1    | CORS_ORIGIN env                   |
| Start script             | 2    | ./start_freediving.sh             |
| Env example              | 3    | .env.production.example           |
| Deploy on push to main   | 4    | .github/workflows/deploy.yml      |
| systemd template         | 5    | freediving.service.example        |
| Build works for prod     | 6    | npm run build; serve from Express |

---

## How to Test

1. **Local production build:** `npm run build && NODE_ENV=production node server/index.js` — open http://localhost:3001
2. **Deploy:** Push to main; check Actions tab
3. **Server:** Ensure VM has .env.production, systemd service, /var/www/freediving

---

## User Setup (Manual)

1. **GitHub Secrets:** Settings → Secrets → Actions → Add SSH_HOST, SSH_USER, SSH_PRIVATE_KEY
2. **Server:** Create /var/www/freediving; copy .env.production.example → .env.production; fill secrets
3. **systemd:** Copy freediving.service.example to /etc/systemd/system/freediving.service; daemon-reload; enable; start
