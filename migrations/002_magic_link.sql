-- Magic link tokens: one-time use, 15 min expiry
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add email column for magic-link users (nullable for legacy nico, athena)
ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL UNIQUE;

-- Allow password_hash to be NULL for magic-link-only users
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
