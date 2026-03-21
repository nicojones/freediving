import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT plan_id FROM user_active_plan WHERE user_id = ?',
      [user.id]
    );
    const row = (Array.isArray(rows) ? rows[0] : undefined) as { plan_id: string } | undefined;
    if (!row) {
      return Response.json({ error: 'No active plan set' }, { status: 404 });
    }
    return Response.json({ plan_id: row.plan_id });
  } finally {
    release();
  }
}

export async function PUT(request: NextRequest) {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { plan_id } = body as { plan_id?: string };
  if (!plan_id || typeof plan_id !== 'string') {
    return Response.json({ error: 'plan_id required' }, { status: 400 });
  }
  const [connection, release] = await getDbConnection();
  try {
    await connection.execute(
      `INSERT INTO user_active_plan (user_id, plan_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id)`,
      [user.id, plan_id]
    );
    return Response.json({ ok: true });
  } finally {
    release();
  }
}
