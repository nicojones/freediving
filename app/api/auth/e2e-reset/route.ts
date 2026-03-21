/**
 * E2E-only: Reset mutable state for nico and athena.
 * Clears progress, active plan, and user-created plans.
 * Only active when NODE_ENV=test.
 */
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST() {
  if (process.env.NODE_ENV !== 'test' && !process.env.E2E_MAGIC_LINK_ENABLED) {
    return Response.json({ error: 'Not available' }, { status: 404 });
  }

  await initDb();
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute('SELECT id FROM users WHERE username IN (?, ?)', [
      'nico',
      'athena',
    ]);
    const ids = (Array.isArray(rows) ? rows : []).map((r) => (r as { id: number }).id);
    if (ids.length === 0) {
      return Response.json({ ok: true });
    }

    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(
      `DELETE FROM progress_completions WHERE user_id IN (${placeholders})`,
      ids
    );
    await connection.execute(
      `DELETE FROM user_active_plan WHERE user_id IN (${placeholders})`,
      ids
    );
    await connection.execute(`DELETE FROM plans WHERE created_by IN (${placeholders})`, ids);

    return Response.json({ ok: true });
  } finally {
    release();
  }
}
