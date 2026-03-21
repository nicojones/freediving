import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { DEFAULT_PLAN_ID } from '@/src/constants/app';

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
    if (row) {
      return Response.json({ plan_id: row.plan_id });
    }
    // No active plan: auto-set default. Prefer DEFAULT_PLAN_ID if in plans, else first available.
    const [defaultRows] = await connection.execute('SELECT id FROM plans WHERE id = ? LIMIT 1', [
      DEFAULT_PLAN_ID,
    ]);
    const defaultRow = Array.isArray(defaultRows) ? defaultRows[0] : undefined;
    let planId: string;
    if (defaultRow && typeof (defaultRow as { id: string }).id === 'string') {
      planId = (defaultRow as { id: string }).id;
    } else {
      const [firstRows] = await connection.execute(
        'SELECT id FROM plans ORDER BY created_at ASC LIMIT 1'
      );
      const firstRow = Array.isArray(firstRows) ? firstRows[0] : undefined;
      if (!firstRow || typeof (firstRow as { id: string }).id !== 'string') {
        return Response.json({ error: 'No plans available' }, { status: 404 });
      }
      planId = (firstRow as { id: string }).id;
    }
    await connection.execute(
      `INSERT INTO user_active_plan (user_id, plan_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id)`,
      [user.id, planId]
    );
    return Response.json({ plan_id: planId });
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
