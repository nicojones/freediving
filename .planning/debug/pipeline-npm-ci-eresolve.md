---
status: resolved
trigger: 'npm ci fails in pipeline with ERESOLVE dependency conflict'
created: 2025-03-20
updated: 2025-03-20
---

## ROOT CAUSE FOUND

**Root cause:** Peer dependency conflict between `vite-plugin-pwa@1.2.0` and `vite@8.0.1`.

**Evidence:**

- `vite-plugin-pwa@1.2.0` declares peer: `vite@"^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"` (no Vite 8)
- Project `package.json` has `vite@^8.0.1`
- npm ci uses strict peer resolution → ERESOLVE

**Source:** npm registry, package.json, .planning/phases/06-pwa-offline/6-PLAN.md line 86 ("vite-plugin-pwa may not officially support Vite 8")

## Symptoms

expected: npm ci runs successfully in CI pipeline
actual: npm ci fails with ERESOLVE could not resolve
errors: peer vite@"^3.1.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0" from vite-plugin-pwa@1.2.0; project has vite@8.0.1
reproduction: Run `npm ci` (e.g. in GitHub Actions)
timeline: Pipeline; started when Vite 8 was adopted

## Fix Options

1. **Downgrade Vite to ^7.x** — vite-plugin-pwa supports ^7.0.0; @tailwindcss/vite, @vitejs/plugin-react, vitest all support Vite 7. Clean fix.
2. **Use --legacy-peer-deps in CI** — Workaround; not ideal.
3. **Remove/upgrade vite-plugin-pwa** — If PWA not critical; or wait for plugin to add Vite 8 support.

Recommended: Option 1 (downgrade Vite to ^7.x).

## Resolution Applied

- Downgraded `vite` from ^8.0.1 to ^7.3.1 (vite-plugin-pwa supports up to ^7.0.0)
- Downgraded `@vitejs/plugin-react` from ^6.0.1 to ^5.2.0 (v6 requires Vite 8)
- Verified: npm ci, build, and test:run all pass
