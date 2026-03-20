---
status: awaiting_human_verify
trigger: 'react-router-dom remnants in Next.js — remove and use App Router only'
created: 2025-03-20T00:00:00Z
updated: 2025-03-20T12:35:00Z
---

## Current Focus

hypothesis: Legacy Vite entry files (main.tsx, App.tsx) are the only react-router-dom usage; safe to delete with index.html and unused vite.config.ts
test: grep for react-router after deletion; run vitest + next build
expecting: zero react-router imports; tests and build pass
next_action: delete orphans, update tsconfigs, run verify

## Symptoms

expected: Next.js app uses App Router exclusively; no react-router-dom
actual: src/App.tsx imports Routes, Route, Navigate, useNavigate from react-router-dom; src/main.tsx imports BrowserRouter
errors: None reported (files excluded from tsconfig)
reproduction: Open src/App.tsx — line 2 shows react-router-dom import
started: Migration from Vite to Next.js; App Router in app/ and AppShell.tsx

## Eliminated

## Evidence

- timestamp: 2025-03-20
  checked: grep react-router in repo
  found: Only src/App.tsx and src/main.tsx reference react-router-dom; package.json has no react-router-dom dep
  implication: Dead code from pre-Next migration

- timestamp: 2025-03-20
  checked: package.json scripts, app/ routes, AppShell.tsx
  found: dev/build use next; app/layout.tsx and pages exist; AppShell uses next/navigation
  implication: Routing is fully on App Router; Vite entry is unused

## Resolution

root_cause: Orphaned Vite SPA shell (main.tsx + App.tsx + index.html) left after Next migration; still imported react-router-dom though those files were excluded from TypeScript and not run by npm scripts.
fix: Deleted src/App.tsx, src/main.tsx, index.html, vite.config.ts; tsconfig.json exclude list simplified; tsconfig.node.json now includes vitest.config.ts instead of vite.config.ts.
verification: grep shows no react-router in TS/TSX/JSON; npm run test:run (120 tests) passed; npm run build passed.
files_changed: ["tsconfig.json", "tsconfig.node.json", "deleted: src/App.tsx", "deleted: src/main.tsx", "deleted: index.html", "deleted: vite.config.ts"]
