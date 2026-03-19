# Phase 7: day_index → day_id Migration

## Summary

Progress completions now use `day_id` (8 hex chars from plan) instead of `day_index` (integer). Each day in the plan has a stable `id` field.

## For Fresh Installs

No action needed. The new schema uses `day_id` from the start.

## For Existing Data

If you have an existing database with `day_index`-based completions:

### Option A: Reset database (simplest)

Delete the SQLite database file and restart. All progress will be lost.

```bash
# Typical location (adjust if your server uses a different path)
rm server/data/submerged.db
# Restart the server
```

### Option B: Migrate data

1. Ensure the plan has `id` on each day (default-plan.json).
2. Run a migration script that:
   - Reads existing `progress_completions` (user_id, plan_id, day_index, completed_at)
   - Maps `day_index` → `day_id` via the plan: `plan[day_index].id`
   - Creates new table with `day_id`, inserts migrated rows, drops old table, renames.

Example migration (run manually or as a one-off script):

```sql
-- Backup existing data
CREATE TABLE progress_completions_backup AS SELECT * FROM progress_completions;

-- Drop old table
DROP TABLE progress_completions;

-- Create new schema
CREATE TABLE progress_completions (
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  day_id TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, plan_id, day_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Migrate: requires plan data to map day_index → day_id
-- INSERT INTO progress_completions (user_id, plan_id, day_id, completed_at)
-- SELECT user_id, plan_id, <day_id from plan[day_index]>, completed_at
-- FROM progress_completions_backup;
-- (Use application code or a script with plan JSON to do the mapping)

-- Drop backup when done
DROP TABLE progress_completions_backup;
```
