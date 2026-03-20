-- Users: pre-defined accounts (nico, athena)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- Progress completions: per user, per plan, per day (day_id = 8 hex chars from plan)
CREATE TABLE IF NOT EXISTS progress_completions (
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  day_id TEXT NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, plan_id, day_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Active training plan per user
CREATE TABLE IF NOT EXISTS user_active_plan (
  user_id INTEGER PRIMARY KEY,
  plan_id TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User-created plans (bundled plans remain in src/data)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  days_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
