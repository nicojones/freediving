---
status: awaiting_human_verify
trigger: "Investigate issue: app-constantly-refreshing-favicon-404"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — Serwist + public watcher loop; missing favicon
next_action: user confirms no Fast Refresh spam in real browser session

## Symptoms

expected: App should run normally without constant refresh cycles; favicon should load
actual: Fast Refresh keeps rebuilding (dozens of "rebuilding" / "done" cycles); favicon.ico returns 404
errors: GET http://localhost:3000/favicon.ico [HTTP/1.1 404 Not Found]; Fast Refresh logs in console
reproduction: Run dev server (npm run dev), visit localhost:3000
started: Not specified

## Eliminated

## Evidence

- timestamp: 2026-03-20
  checked: next.config.ts, @serwist/next source, public/
  found: withSerwist writes swDest to public/sw.js; glob cleanup runs each compile; no favicon.ico in app/ or valid public/; prior public/favicon.ico was HTML error body
  implication: Dev rebuild loop matches Serwist→public write→watch; 404 from missing favicon

## Resolution

root_cause: @serwist/next InjectManifest rebuilds service worker into public/ on every webpack compilation; Next dev watches public/ and retriggers compilation. No favicon file served at /favicon.ico.
fix: disable Serwist when NODE_ENV !== production; add app/icon.tsx (ImageResponse) and rewrite /favicon.ico → /icon
verification: npm run dev — Serwist disabled log; curl /favicon.ico and /icon return 200; no rapid rebuild in short run
files_changed: [next.config.ts, app/icon.tsx, public/favicon.ico (removed invalid file)]
