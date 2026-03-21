import bcrypt from 'bcrypt';
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

export async function seedUsers(connection: PoolConnection): Promise<void> {
  const nicoPassword = process.env.USER_PASSWORD_NICO || 'password';
  const athenaPassword = process.env.USER_PASSWORD_ATHENA || 'password';

  const nicoHash = await bcrypt.hash(nicoPassword, 10);
  const athenaHash = await bcrypt.hash(athenaPassword, 10);

  await connection.execute('INSERT IGNORE INTO users (username, password_hash) VALUES (?, ?)', [
    'nico',
    nicoHash,
  ]);
  await connection.execute('INSERT IGNORE INTO users (username, password_hash) VALUES (?, ?)', [
    'athena',
    athenaHash,
  ]);
}
