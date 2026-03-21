-- Users: pre-defined accounts (nico, athena)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Progress completions: per user, per plan, per day (day_id = 8 hex chars from plan)
CREATE TABLE IF NOT EXISTS progress_completions (
  user_id INT NOT NULL,
  plan_id VARCHAR(255) NOT NULL,
  day_id VARCHAR(255) NOT NULL,
  completed_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, plan_id, day_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Active training plan per user
CREATE TABLE IF NOT EXISTS user_active_plan (
  user_id INT PRIMARY KEY,
  plan_id VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- User-created plans
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  days_json TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  created_by INT REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
