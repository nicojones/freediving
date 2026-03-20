import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const row = db.prepare('SELECT plan_id FROM user_active_plan WHERE user_id = ?').get(user.id) as
    | { plan_id: string }
    | undefined;
  if (!row) {
    return Response.json({ error: 'No active plan set' }, { status: 404 });
  }
  return Response.json({ plan_id: row.plan_id });
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { plan_id } = body as { plan_id?: string };
  if (!plan_id || typeof plan_id !== 'string') {
    return Response.json({ error: 'plan_id required' }, { status: 400 });
  }
  db.prepare(
    `INSERT INTO user_active_plan (user_id, plan_id) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET plan_id = excluded.plan_id`
  ).run(user.id, plan_id);
  return Response.json({ ok: true });
}
