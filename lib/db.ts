import type { PoolConnection } from 'mysql2/promise';
import { getDbConnection } from './db.config';
import { runMigrations } from './migrate';

let initialized = false;

export async function initDb(): Promise<void> {
  if (initialized) {
    return;
  }
  const [connection, release] = await getDbConnection();
  try {
    await runMigrations(connection);
    await seedUsers(connection);
    initialized = true;
    if (process.env.NODE_ENV !== 'test') {
      console.log('Database ready');
    }
  } finally {
    release();
  }
}

/**
 * Seeds nico and athena for E2E tests (e2e-set-session).
 * No password — legacy login removed; magic link is the only user-facing auth.
 */
export async function seedUsers(connection: PoolConnection): Promise<void> {
  await connection.execute(
    'INSERT IGNORE INTO users (username, password_hash, email) VALUES (?, NULL, NULL)',
    ['nico']
  );
  await connection.execute(
    'INSERT IGNORE INTO users (username, password_hash, email) VALUES (?, NULL, NULL)',
    ['athena']
  );
}
