## Summary

**Phase 30: Dockerize MySQL + Change Database Type**

**Goal:** Migrate from SQLite to MySQL; Dockerize MySQL for dev/local; versioned migrations run on startup; E2E and CI use MySQL. Production server uses existing MySQL; app runs migrations automatically on deploy.

**Status:** Phase complete ✓

This phase replaces SQLite with MySQL across the backend. Local development uses Docker for MySQL; production uses the server's existing MySQL. Versioned migrations run automatically on app startup. E2E tests use a fresh database per run (`freediving_test_${timestamp}`) to avoid pollution. CI runs MySQL as a service container. `docs/SERVER-SETUP.md` provides step-by-step guide for production server setup.

---

## Changes

### Plan 30: Dockerize MySQL + Change Database Type

Replace SQLite with MySQL; Dockerize MySQL for dev; versioned migrations; E2E fresh DB per run; CI MySQL service; server setup guide.

**Key files:**

- **Created:** `docker-compose.yml`, `lib/db.config.ts`, `lib/migrate.ts`, `migrations/001_initial.sql`, `scripts/run-e2e-with-fresh-db.mjs`, `docs/SERVER-SETUP.md`, `.env.example`
- **Modified:** `lib/db.ts`, `lib/plan.ts`, `app/api/auth/login/route.ts`, `app/api/user/active-plan/route.ts`, `app/api/progress/route.ts`, `app/api/plans/route.ts`, `app/api/plans/[id]/route.ts`, `playwright.config.ts`, `.github/workflows/deploy.yml`, `package.json`
- **Deleted:** `lib/schema.sql`, `data.db`

---

## Requirements Addressed

- Database infrastructure (PROF-01, PROF-02, SESS-07 — backend persistence via MySQL)

---

## Verification

- [x] Build passes (`npm run build`)
- [x] Unit tests pass (147 tests)
- [x] ESLint passes (Node globals added for `scripts/*.mjs`)
- [ ] E2E: run `npm run db:up` before `npm run test:e2e` (local); CI uses MySQL service container
- [ ] Server setup: follow `docs/SERVER-SETUP.md` for production

---

## Key Decisions

- **DB type:** MySQL (replace SQLite); client: `mysql2` + `named-placeholders`
- **Docker:** `docker-compose.yml` for dev/local; optional `npm run db:up` / `db:down`
- **Migration:** Versioned migrations; run on startup/deploy (Alembic-style) via `schema_migrations` table
- **Env vars:** `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASS`, `DB_PORT` (db.config.ts)
- **E2E:** Fresh DB `freediving_test_${timestamp}` per run; script creates it, spawns Playwright
- **CI:** MySQL service container in GitHub Actions
- **Data:** Fresh install only; no SQLite → MySQL migration
- **Server:** Use existing MySQL; create `freediving` DB; app runs migrations on start
