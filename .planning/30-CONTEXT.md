# Phase 30: Dockerize MySQL + Change Database Type — Context

**Created:** 2025-03-20  
**Purpose:** Implementation decisions for migrating from SQLite to MySQL, Dockerizing MySQL for dev, and guiding server setup.  
**Phase:** 30. Dockerize MySQL + Change Database Type

---

## Decisions (from user)

### 1. Change Database Type: SQLite → MySQL

- **Rationale:** Production server already has MySQL; align dev and prod for consistency.
- **Change:** Replace `better-sqlite3` with a MySQL client (e.g. `mysql2` or `mysql`).
- **Scope:** Backend only; IndexedDB/offline queue in `src/services/offlineQueue.ts` stays (client-side, unrelated).

### 2. Dockerize MySQL for Dev/Local

- **Rationale:** One-command local DB; no manual MySQL install on dev machines.
- **Change:** Add `docker-compose.yml` (or similar) to run MySQL container for local development.
- **Production:** Server uses existing MySQL (not Docker); Docker is for dev only.

### 3. Server State: MySQL Exists, DB and Migrations Missing

- **Current:** Server has MySQL installed and running.
- **Missing:** Database named `freediving`; schema/migrations.
- **Requirement:** Guide user through server changes: create DB, run migrations, configure connection.

---

## Gray Areas — Resolved

### A. Migration Tool

- **Decision:** No migration tool. Use raw SQL schema file(s); run on startup or via simple script.
- **Rationale:** Keep it simple; no migration framework.

### B. MySQL Client Library

- **Decision:** Decide as we go (TBD during implementation).

### C. E2E/Test Database

- **Decision:** Yes — E2E runs against MySQL. Create a dedicated test user per run.
- **Naming:** `test_{timestamp}` (e.g. `test_1710932400`).
- **Rationale:** Isolated test user; no pollution of real data.

### D. Connection String / Env Vars

- **Local/dev:** You (implementer) choose the env var names; MySQL must be installed locally (or via Docker).
- **Server:** User will provide env vars; no need to prescribe exact names in code.

---

## Code Context

### Current DB Usage

| File                                | Usage                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `lib/db.ts`                         | `better-sqlite3`; `runSchema()`; `migratePlansCreatedBy()`; `seedUsers()`; `db.prepare()`, `db.exec()` |
| `lib/schema.sql`                    | SQLite DDL: `INTEGER PRIMARY KEY AUTOINCREMENT`, `TEXT`, `INTEGER`                                     |
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

_This section guides you through the server changes. Execute these steps on your production server (DigitalOcean or similar) when ready._

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

### Step 2: Run Schema

_After Phase 30 implementation, schema will be MySQL-compatible. No migration tool — raw SQL run on startup or via script._

```bash
# From the app directory on the server (or as part of deploy)
# App may run schema on startup; or manual:
mysql -u freediving -p freediving < lib/schema.sql
```

### Step 3: Configure Environment Variables

Add to your server's env (e.g. `/etc/systemd/system/freediving.service.d/override.conf` or `.env.production`):

```bash
# MySQL connection (exact names TBD in plan)
DATABASE_URL=mysql://freediving:YOUR_SECURE_PASSWORD@localhost:3306/freediving
# Or separate vars:
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_USER=freediving
# MYSQL_PASSWORD=YOUR_SECURE_PASSWORD
# MYSQL_DATABASE=freediving
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

If you have existing SQLite data on the server:

```bash
# Backup SQLite DB
cp /path/to/data.db /path/to/data.db.backup.$(date +%Y%m%d)
```

Data migration (SQLite → MySQL) is a separate concern; Phase 30 may assume fresh install or a one-time migration script (TBD in plan).

---

## Out of Scope for Phase 30

- Data migration from existing SQLite to MySQL (unless explicitly in plan)
- Changing IndexedDB/offline queue (client-side)
- Changing deployment target (still DigitalOcean)

---

## Traceability

| Decision     | Outcome                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| DB type      | MySQL (replace SQLite)                                                     |
| Docker       | MySQL in Docker for dev/local only                                         |
| Migration    | No migration tool; raw SQL schema                                          |
| Env vars     | Local: implementer chooses; MySQL installed. Server: user provides         |
| E2E          | Create test user `test_{timestamp}`; run E2E against MySQL                 |
| Server       | Use existing MySQL; create `freediving` DB; run migrations; document steps |
| Server guide | Create DB, run migrations, env vars, restart, verify                       |

---

_Context captured from /gsd-add-phase 30 + /gsd-discuss-phase 30_
