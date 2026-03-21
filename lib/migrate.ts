import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { PoolConnection } from 'mysql2/promise';

const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

export async function runMigrations(connection: PoolConnection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const name = file;
    const [rows] = await connection.query('SELECT name FROM schema_migrations WHERE name = ?', [
      name,
    ]);
    const applied = Array.isArray(rows) && (rows as { name: string }[]).length > 0;
    if (applied) {
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await connection.query(stmt);
    }
    await connection.query('INSERT IGNORE INTO schema_migrations (name) VALUES (?)', [name]);
  }
}
