# Server Setup — MySQL for Freediving

This guide walks you through setting up MySQL on your production server for the Freediving Breathhold Trainer app (Phase 30+).

---

## Prerequisites

- Server with MySQL installed and running (e.g. DigitalOcean droplet)
- SSH access
- App deployed (or will be after Phase 30 migration)

---

## Step 1: Create the `freediving` Database

Connect to MySQL as root or an admin user:

```bash
mysql -u root -p
```

In the MySQL shell:

```sql
CREATE DATABASE IF NOT EXISTS freediving
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'freediving'@'localhost'
  IDENTIFIED BY 'YOUR_SECURE_PASSWORD';

GRANT ALL PRIVILEGES ON freediving.* TO 'freediving'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Replace `YOUR_SECURE_PASSWORD` with a strong password. Store it securely — you'll need it for the app env.

---

## Step 2: Configure Environment Variables

The app uses `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASS`, and optionally `DB_PORT` (see `lib/db.config.ts`).

### Option A: systemd override (recommended)

Create or edit the override file:

```bash
sudo mkdir -p /etc/systemd/system/freediving.service.d
sudo nano /etc/systemd/system/freediving.service.d/override.conf
```

Add:

```ini
[Service]
Environment=DB_HOST=localhost
Environment=DB_PORT=3306
Environment=DB_USER=freediving
Environment=DB_PASS=YOUR_SECURE_PASSWORD
Environment=DB_NAME=freediving
```

Reload systemd:

```bash
sudo systemctl daemon-reload
```

### Option B: `.env.production`

If the app loads `.env.production` (e.g. via `EnvironmentFile` in the service):

```bash
nano /var/www/freediving/.env.production
```

Add:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=freediving
DB_PASS=YOUR_SECURE_PASSWORD
DB_NAME=freediving
```

Remove or stop using `FREEDIVING_DB_PATH` — the app no longer uses SQLite.

---

## Step 3: Migrations

The app runs migrations automatically on startup. No manual step required.

On first connect, the app will:

1. Create the `schema_migrations` table if missing
2. Run pending migrations from `migrations/*.sql`
3. Seed users (nico, athena)

---

## Step 4: Restart the App

```bash
sudo systemctl restart freediving
```

---

## Step 5: Verify

1. **Check logs:**

   ```bash
   journalctl -u freediving -f
   ```

   Look for "Database ready" or similar. No SQLite errors.

2. **Test the app:**
   - Open the PWA in a browser
   - Log in (nico / athena with your configured passwords)
   - Create a plan, complete a session — ensure data persists

3. **Optional — inspect DB:**
   ```bash
   mysql -u freediving -p freediving -e "SHOW TABLES;"
   ```
   You should see `users`, `progress_completions`, `user_active_plan`, `plans`, `schema_migrations`.

---

## Troubleshooting

| Issue              | Check                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| "Access denied"    | Verify `DB_USER`, `DB_PASS`; ensure user has `GRANT` on `freediving.*` |
| "Unknown database" | Run Step 1 again; ensure `freediving` exists                           |
| App won't start    | Check `journalctl -u freediving -n 50`; verify env vars are loaded     |
| Migrations fail    | Ensure `freediving` user has `CREATE`, `ALTER`, `INSERT` on the DB     |

---

## Reference: Env Vars

| Var       | Required | Example      | Description               |
| --------- | -------- | ------------ | ------------------------- |
| `DB_HOST` | Yes      | `localhost`  | MySQL host                |
| `DB_PORT` | No       | `3306`       | MySQL port (default 3306) |
| `DB_USER` | Yes      | `freediving` | MySQL user                |
| `DB_PASS` | Yes      | (secret)     | MySQL password            |
| `DB_NAME` | Yes      | `freediving` | Database name             |
