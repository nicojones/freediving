-- Users: pre-defined accounts (nico, athena)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- Progress completions: per user, per plan, per day
CREATE TABLE IF NOT EXISTS progress_completions (
  user_id INTEGER NOT NULL,
  plan_id TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, plan_id, day_index),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
