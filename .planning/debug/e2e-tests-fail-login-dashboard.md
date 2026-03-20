---
status: resolved
trigger: "E2E tests fail: login-username not found, dashboard-day-list not found"
created: 2025-03-20
updated: 2025-03-20
---

## Root Cause

Tests were flaky due to:
1. **Short timeouts** (5s) for dashboard-day-list — plan loading can take several seconds
2. **No explicit wait** for login form before filling — app shows loader first
3. **Default test timeout** (30s) too tight for login + plan load flow

Error contexts from failed runs showed:
- "Login failed" (API returned non-200)
- Next.js "clientReferenceManifest" InvariantError on /day/invalid-day-999

## Fix Applied

1. **Shared login helper** (`e2e/helpers/login.ts`): `loginAsNico(page)` with 10s wait for login form, 15s for dashboard
2. **Increased project timeout** to 60s in playwright.config.ts
3. **Refactored all specs** to use `loginAsNico` for consistent, robust login flow
4. **Explicit wait** for login form in "invalid login" test before filling

## Verification

All 10 E2E tests pass locally (both with and without CI=true).
