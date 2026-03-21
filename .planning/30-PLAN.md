# Phase 30: Dockerize MySQL + Change Database Type — Plan

**Status:** Done  
**Depends on:** Phase 29 (E2E Tests)

---

## Goal

Migrate from SQLite to MySQL; Dockerize MySQL for dev/local; versioned migrations run on startup; E2E and CI use MySQL. Production server uses existing MySQL; app runs migrations automatically on deploy.

---

## Success Criteria

1. App uses MySQL (`mysql2`) instead of SQLite for backend persistence
2. MySQL runs in Docker for local/dev; `docker-compose.yml`; optional `npm run db:up` / `db:down`
3. Versioned migrations (Alembic-style) run on app startup; `schema_migrations` table tracks applied migrations
4. E2E uses a **fresh database per run** (`freediving_test_${timestamp}`) — no pollution between runs
5. CI (GitHub Actions) runs MySQL service container; E2E creates fresh DB per run
6. Production: create `freediving` DB; app runs migrations on start; `docs/SERVER-SETUP.md` provides step-by-step guide

---

## Tasks

### 1. Add dependencies and Docker

- [ ] **1.1** Install `mysql2`, `named-placeholders`; remove `better-sqlite3` and `@types/better-sqlite3`
- [ ] **1.2** Create `docker-compose.yml` with MySQL 8 service:
  - Image: `mysql:8.0`
  - Env: `MYSQL_ROOT_PASSWORD=root`, `MYSQL_DATABASE=freediving`, `MYSQL_USER=freediving`, `MYSQL_PASSWORD=freediving`
  - Port: `3306:3306`
  - Health check: `mysqladmin ping -h localhost -u root -proot`
  - No init script needed — E2E script creates `freediving_test_${ts}` per run
- [ ] **1.3** Add npm scripts: `db:up` (`docker compose up -d`), `db:down` (`docker compose down`)
- [ ] **1.4** Add `.env.example`: `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=freediving`, `DB_PASS=freediving`, `DB_NAME=freediving`

### 2. Migration system

- [ ] **2.1** Create `lib/migrate.ts`: custom migration runner
  - Read `migrations/*.sql` files sorted by name
  - Create `schema_migrations` table if missing (columns: `name` VARCHAR PRIMARY KEY, `applied_at` TIMESTAMP)
  - For each file not in `schema_migrations`: execute SQL, insert row
  - Export `runMigrations(connection): Promise<void>` (uses mysql PoolConnection from getDbConnection)
- [ ] **2.2** Create `migrations/001_initial.sql` — MySQL DDL converted from `lib/schema.sql`:
  - `INTEGER PRIMARY KEY AUTOINCREMENT` → `INT AUTO_INCREMENT PRIMARY KEY`
  - `TEXT` → `VARCHAR(255)` or `TEXT` as appropriate
  - `INTEGER` → `INT` or `BIGINT`
  - Include `created_by` on plans (from current schema)
  - Use `utf8mb4` charset
- [ ] **2.3** Remove `lib/schema.sql` after migration system works

### 3. DB layer — `lib/db.config.ts` (required pattern)

- [ ] **3.1** Create `lib/db.config.ts` following the pattern in 30-CONTEXT § G:
  - `"use server"`
  - `mysql2/promise` + `named-placeholders`
  - `globalForDb` singleton to avoid pool exhaustion on server hot reload
  - Pool config: `connectionLimit: 10`, `maxIdle: 10`, `idleTimeout: 60000`, `enableKeepAlive: true`, `namedPlaceholders: true`
  - Env: `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASS`, `DB_PORT`
  - Export `getDbConnection()` → `[connection, release]`
  - Export `namedPlaceholders(q, params)` for `:param` → `?` conversion
- [ ] **3.2** Create `lib/db.ts`: `initDb()` gets connection via `getDbConnection()`, calls `runMigrations(connection)`, `seedUsers(connection)`, then `release()`
- [ ] **3.3** Update `seedUsers(connection)`: `INSERT IGNORE`; bcrypt hashes for nico/athena
- [ ] **3.4** Remove `runSchema`, `migratePlansCreatedBy` (replaced by migrations)
- [ ] **3.5** Ensure `initDb()` runs before first API request (instrumentation or lazy init)

### 4. API routes — async queries

Use `getDbConnection()`; `connection.execute()` or `connection.query()`; call `release()` when done. Optionally use `namedPlaceholders` for `:param` syntax.

- [ ] **4.1** `app/api/auth/login/route.ts`: `getDbConnection` → `connection.execute('SELECT ...', [username])`; destructure `rows[0]`; `release()`
- [ ] **4.2** `app/api/user/active-plan/route.ts`: GET `SELECT`; PUT `INSERT ... ON DUPLICATE KEY UPDATE` (replace `ON CONFLICT`)
- [ ] **4.3** `app/api/progress/route.ts`: GET `SELECT`; POST `REPLACE INTO` or `INSERT ... ON DUPLICATE KEY UPDATE` (replace `INSERT OR REPLACE`); DELETE
- [ ] **4.4** `app/api/plans/route.ts`: GET `SELECT`; POST `INSERT`
- [ ] **4.5** `app/api/plans/[id]/route.ts`: `SELECT` plan, `SELECT` active user, `DELETE`

### 5. `lib/plan.ts` — async loadPlan

- [ ] **5.1** Change `loadPlan(planId)` to `async loadPlan(planId): Promise<PlanWithMeta>`:
  - File reads stay sync; DB read uses `pool.execute('SELECT ...', [planId])`
  - Return plan from row or fallback to default-plan.json
- [ ] **5.2** Update `app/api/progress/route.ts`: `await loadPlan(plan_id)` for day_index → day_id resolution

### 6. App initialization

- [ ] **6.1** Ensure `initDb()` runs before any DB access. Options:
  - **A:** `instrumentation.ts` (Next.js 15) — `register()` calls `initDb()`
  - **B:** Lazy init in first route — check `initialized` flag; call `initDb()` if needed; await
- [ ] **6.2** Remove `FREEDIVING_DB_PATH` usage; document removal in server guide

### 7. E2E — fresh DB per run (local + CI)

- [ ] **7.1** Create `scripts/run-e2e-with-fresh-db.mjs`:
  - Generate `DB_NAME=freediving_test_${Date.now()}`
  - Connect to MySQL (root/root, localhost:3306) and `CREATE DATABASE ${DB_NAME}`
  - Set env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
  - Spawn `npx playwright test` with that env (Playwright webServer inherits it)
  - Use `mysql2` for DB creation (already a dependency)
- [ ] **7.2** Update `package.json`: `test:e2e` runs `node scripts/run-e2e-with-fresh-db.mjs` (replacing direct `playwright test`)
- [ ] **7.3** Update `playwright.config.ts`: remove hardcoded `FREEDIVING_DB_PATH`; webServer inherits `DB_*` from parent process
- [ ] **7.4** Document: run `npm run db:up` before `npm run test:e2e` (local); README or docs

### 8. CI (GitHub Actions)

- [ ] **8.1** Add MySQL service to `.github/workflows/deploy.yml`:
  ```yaml
  services:
    mysql:
      image: mysql:8.0
      env:
        MYSQL_ROOT_PASSWORD: root
      ports:
        - 3306:3306
      options: >-
        --health-cmd="mysqladmin ping -h localhost -u root -proot"
        --health-interval=10s
        --health-timeout=5s
        --health-retries=5
  ```
- [ ] **8.2** E2E step runs `npm run test:e2e` — the script creates a fresh DB per run; no job-level `DB_NAME` (script sets it)
- [ ] **8.3** Set job env for MySQL connection: `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, `DB_PASS=root` (script uses these to create DB and pass to Playwright)

### 9. Server setup guide

- [ ] **9.1** Ensure `docs/SERVER-SETUP.md` exists and is complete (created in this phase)
- [ ] **9.2** Add README section or link: "Server setup: see [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md)"

### 10. Cleanup and verification

- [ ] **10.1** Remove `better-sqlite3`, `@types/better-sqlite3` from package.json
- [ ] **10.2** Delete `lib/schema.sql` after migrations work
- [ ] **10.3** Update `.env.production.example` (if exists) or create: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- [ ] **10.4** Run `npm run build`, `npm run lint`, `npm run test:run`, `npm run test:e2e` — all pass
- [ ] **10.5** Update `STATE.md`, `.continue-here.md` when phase complete

---

## SQLite → MySQL mapping reference

| SQLite                              | MySQL                                                  |
| ----------------------------------- | ------------------------------------------------------ |
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `INT AUTO_INCREMENT PRIMARY KEY`                       |
| `TEXT`                              | `VARCHAR(255)` or `TEXT`                               |
| `INTEGER`                           | `INT` or `BIGINT`                                      |
| `INSERT OR IGNORE`                  | `INSERT IGNORE`                                        |
| `INSERT OR REPLACE`                 | `REPLACE INTO` or `INSERT ... ON DUPLICATE KEY UPDATE` |
| `ON CONFLICT(x) DO UPDATE SET`      | `ON DUPLICATE KEY UPDATE`                              |
| `PRAGMA table_info`                 | `INFORMATION_SCHEMA.COLUMNS` / `DESCRIBE`              |

---

## File changes summary

| Action  | File(s)                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create  | `docker-compose.yml`, `lib/db.config.ts`, `lib/migrate.ts`, `migrations/001_initial.sql`, `scripts/run-e2e-with-fresh-db.mjs`, `docs/SERVER-SETUP.md`                   |
| Rewrite | `lib/db.ts` (initDb, seedUsers; uses db.config)                                                                                                                         |
| Modify  | `lib/plan.ts`, `app/api/auth/login/route.ts`, `app/api/user/active-plan/route.ts`, `app/api/progress/route.ts`, `app/api/plans/route.ts`, `app/api/plans/[id]/route.ts` |
| Modify  | `playwright.config.ts`, `.github/workflows/deploy.yml`                                                                                                                  |
| Delete  | `lib/schema.sql`                                                                                                                                                        |
| Update  | `package.json`, `.env.example`, `30-CONTEXT.md` (server guide)                                                                                                          |

---

## Context

See `30-CONTEXT.md` for implementation decisions and server guidance.
