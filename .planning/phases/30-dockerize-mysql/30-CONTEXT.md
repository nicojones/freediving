# Phase 30: Dockerize MySQL + Change Database Type — Context

**Created:** 2025-03-20  
**Purpose:** Implementation decisions for migrating from SQLite to MySQL, Dockerizing MySQL for dev, and guiding server setup.  
**Phase:** 30. Dockerize MySQL + Change Database Type

---

## Decisions (from user)

### 1. Change Database Type: SQLite → MySQL

- **Rationale:** Production server already has MySQL; align dev and prod for consistency.
- **Change:** Replace `better-sqlite3` with `mysql2` (promise-based, widely used).
- **Scope:** Backend only; IndexedDB/offline queue in `src/services/offlineQueue.ts` stays (client-side, unrelated).

### 2. Dockerize MySQL for Dev/Local

- **Rationale:** One-command local DB; no manual MySQL install on dev machines.
- **Change:** Add `docker-compose.yml` to run MySQL container for local development. Optional `npm run db:up` / `npm run db:down` scripts.
- **Production:** Server uses existing MySQL (not Docker); Docker is for dev only.

### 3. Server State: MySQL Exists, DB and Migrations Missing

- **Current:** Server has MySQL installed and running.
- **Missing:** Database named `freediving`; schema/migrations.
- **Requirement:** Guide user through server changes: create DB, run migrations, configure connection.

---

## Gray Areas — Resolved

### A. Migration Tool

- **Decision:** Versioned migrations (Alembic-style). Run automatically on app startup/deploy.
- **Approach:** `migrations/001_initial.sql`, `002_add_created_by.sql`, etc.; `schema_migrations` table tracks applied migrations; custom runner (~50 lines) or Umzug.
- **Rationale:** Supports future schema changes; no migration framework dependency initially.

### B. MySQL Client Library

- **Decision:** `mysql2` (promise-based, widely used).

### C. E2E/Test Database

- **Decision:** Fresh database per E2E run: `freediving_test_${timestamp}`.
- **Rationale:** No pollution between runs; works locally and in CI; each run gets a clean DB.
- **Implementation:** `scripts/run-e2e-with-fresh-db.mjs` creates DB, spawns Playwright with `DB_NAME` env.

### D. CI

- **Decision:** MySQL in GitHub Actions. E2E runs against MySQL (service container).

### E. Data Migration

- **Decision:** None. Fresh install only. No SQLite → MySQL data migration.

### F. Connection String / Env Vars

- **Local/dev:** Implementer chooses env var names; MySQL via Docker.
- **Server:** User provides env vars; app runs migrations on startup.

### G. DB Config Pattern (required)

- **Rationale:** Avoids connection pool exhaustion and OOO (out-of-order) issues on the server — singleton pool across hot reloads.
- **Pattern:** `lib/db.config.ts` (or `lib/db.ts`) MUST follow the structure below.
- **Env vars:** `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASS`, `DB_PORT` (optional).
- **Dependencies:** `mysql2`, `named-placeholders`.

```ts
'use server';

import mysql from 'mysql2/promise';
// @ts-expect-error invalid Typescript
import named from 'named-placeholders';

const globalForDb = global as unknown as { dbPool: mysql.Pool };

globalForDb.dbPool =
  globalForDb.dbPool ||
  mysql.createPool({
    host: process.env.DB_HOST ?? '',
    user: process.env.DB_USER ?? '',
    database: process.env.DB_NAME ?? '',
    password: process.env.DB_PASS ?? '',
    ...(process.env.DB_PORT ? { port: +process.env.DB_PORT } : {}),
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    namedPlaceholders: true,
  });

const dbPool = globalForDb.dbPool;

export const getDbConnection = async (): Promise<[mysql.PoolConnection, () => void]> => {
  const connection = await dbPool.getConnection();
  return [
    connection,
    () => {
      dbPool.releaseConnection(connection);
      connection.release();
    },
  ];
};

export const namedPlaceholders: (
  q: string,
  p: Record<string, unknown>
) => { sql: string; values: unknown[] } = named();
```

---

## Code Context

### Current DB Usage

| File                                | Usage                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `lib/db.ts`                         | `better-sqlite3`; `runSchema()`; `migratePlansCreatedBy()`; `seedUsers()`; `db.prepare()`, `db.exec()` |
| `lib/schema.sql`                    | SQLite DDL (will become `migrations/001_initial.sql` etc.)                                             |
| `app/api/auth/login/route.ts`       | `db.prepare('SELECT ...').get()`                                                                       |
| `app/api/user/active-plan/route.ts` | `db.prepare().get()`, `db.prepare().run()`                                                             |
| `app/api/progress/route.ts`         | `db.prepare()` for GET, POST, DELETE                                                                   |
| `app/api/plans/route.ts`            | `db.prepare().get()`, `db.prepare().run()`                                                             |
| `app/api/plans/[id]/route.ts`       | `db.prepare().get()`, `db.prepare().run()`                                                             |

### Schema (SQLite → MySQL Mapping)

- `INTEGER PRIMARY KEY AUTOINCREMENT` → `INT AUTO_INCREMENT PRIMARY KEY`
- `TEXT` → `VARCHAR(255)` or `TEXT` (MySQL has both)
- `INTEGER` → `INT` or `BIGINT`
- `INSERT OR IGNORE` → `INSERT IGNORE` (MySQL)
- `PRAGMA table_info` → `INFORMATION_SCHEMA.COLUMNS` or `DESCRIBE`

### Deployment

- **Phase 13:** GitHub Actions deploy to DigitalOcean; `start_freediving.sh`; systemd `freediving.service`.
- **Env:** `.env.production` or server env; `FREEDIVING_DB_PATH` currently.

---

## Server Setup Guide (for user)

_See **`docs/SERVER-SETUP.md`** for the full step-by-step guide. Summary below._

### Prerequisites

- MySQL already installed and running on the server.
- SSH access to the server.
- App deployed (or will be after Phase 30).

### Step 1: Create the `freediving` Database

```bash
# On the server, connect to MySQL as root or admin user
mysql -u root -p

# In MySQL shell:
CREATE DATABASE IF NOT EXISTS freediving CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'freediving'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON freediving.* TO 'freediving'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Replace `YOUR_SECURE_PASSWORD` with a strong password. Store it in your env (see Step 3).

### Step 2: Run Migrations

_App runs migrations automatically on startup. No manual step — ensure app has DB access and restart; migrations apply on first connect._

### Step 3: Configure Environment Variables

Add to your server's env (e.g. `/etc/systemd/system/freediving.service.d/override.conf` or `.env.production`):

```bash
# MySQL connection (required by db.config.ts)
DB_HOST=localhost
DB_PORT=3306
DB_USER=freediving
DB_PASS=YOUR_SECURE_PASSWORD
DB_NAME=freediving
```

Remove or stop using `FREEDIVING_DB_PATH` once migration is complete.

### Step 4: Restart the App

```bash
sudo systemctl restart freediving
```

### Step 5: Verify

- Check app logs: `journalctl -u freediving -f`
- Ensure no SQLite errors; app connects to MySQL.
- Test login, progress, plans via the PWA.

### Optional: Backup Before Migration

_Phase 30 assumes fresh install. No SQLite → MySQL data migration._

---

## Out of Scope for Phase 30

- Data migration from existing SQLite to MySQL (fresh install only)
- Changing IndexedDB/offline queue (client-side)
- Changing deployment target (still DigitalOcean)

---

## Traceability

| Decision     | Outcome                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------- |
| DB type      | MySQL (replace SQLite); client: `mysql2`                                                          |
| Docker       | `docker-compose.yml` for dev/local; optional npm scripts                                          |
| Migration    | Versioned migrations; run on startup/deploy (Alembic-style)                                       |
| Env vars     | `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASS`, `DB_PORT` (db.config.ts)                              |
| E2E          | Fresh DB `freediving_test_${timestamp}` per run; script creates it, spawns Playwright             |
| CI           | MySQL service container in GitHub Actions                                                         |
| Data         | Fresh install only; no SQLite → MySQL migration                                                   |
| Server       | Use existing MySQL; create `freediving` DB; app runs migrations on start                          |
| Server guide | `docs/SERVER-SETUP.md` — step-by-step: create DB, env vars, restart; migrations run automatically |

---

_Context captured from /gsd-add-phase 30 + /gsd-discuss-phase 30 + discussion 2025-03-21_
