---
status: resolved
trigger: "E2E tests don't start - playwright test hangs with no output"
created: 2025-03-20
updated: 2025-03-20
---

## Root Cause

**Port 3098 was already in use** by another process (likely a leftover Next.js dev server or another app). When Playwright runs:

1. It starts `npx next dev -p 3098` as the web server
2. With `reuseExistingServer: !process.env.CI`, it may try to reuse an existing server
3. If the process on 3098 was stuck or not a healthy Next app, the health check to `/api/auth/me` would hang
4. If starting a new server, it would fail with `EADDRINUSE` and Playwright would hang waiting
5. **Result:** No output, tests appear to "not start"

## Fix Applied

1. **Port check script** (`scripts/check-e2e-port.mjs`): Runs before `playwright test` to ensure port 3098 is free
2. **Fail fast with clear error**: If port is in use, exits immediately with instructions:
   ```
   lsof -ti :3098 | xargs kill -9
   ```
3. **Updated `test:e2e` script** in package.json to run the check first

## Verification

- Port free: `npm run test:e2e` runs all 10 tests (~1.1m)
- Port in use: Script exits in <1s with helpful error message
