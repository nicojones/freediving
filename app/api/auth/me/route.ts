import { getAuthUser } from '@/lib/auth';
import { initDb } from '@/lib/db';
import { getDbConnection } from '@/lib/db.config';

export const runtime = 'nodejs';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await initDb();
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute('SELECT id, username, email FROM users WHERE id = ?', [
      authUser.id,
    ]);
    const row = Array.isArray(rows)
      ? (rows[0] as { id: number; username: string; email: string | null } | undefined)
      : undefined;
    if (!row) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return Response.json({
      user: { id: row.id, username: row.username, email: row.email ?? undefined },
    });
  } finally {
    release();
  }
}
