import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { loadPlan, getDayAtIndex } from '@/lib/plan';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const planId = request.nextUrl.searchParams.get('plan_id') || 'default';
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT plan_id, day_id, completed_at FROM progress_completions
       WHERE user_id = ? AND plan_id = ?`,
      [user.id, planId]
    );
    const completions = (Array.isArray(rows) ? rows : []) as {
      plan_id: string;
      day_id: string;
      completed_at: number;
    }[];
    return Response.json({ completions });
  } finally {
    release();
  }
}

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { plan_id, day_id, day_index } = body as {
    plan_id?: string;
    day_id?: string;
    day_index?: number;
  };
  if (plan_id === undefined) {
    return Response.json({ error: 'plan_id required' }, { status: 400 });
  }
  let resolvedDayId: string | undefined | null = day_id;
  if (resolvedDayId === undefined && typeof day_index === 'number') {
    const plan = await loadPlan(plan_id);
    const day = getDayAtIndex(plan, day_index);
    resolvedDayId = day?.id ?? null;
  }
  if (resolvedDayId === undefined || resolvedDayId === null) {
    return Response.json({ error: 'day_id or day_index required' }, { status: 400 });
  }
  const completedAt = Date.now();
  const [connection, release] = await getDbConnection();
  try {
    await connection.execute(
      `INSERT INTO progress_completions (user_id, plan_id, day_id, completed_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE completed_at = VALUES(completed_at)`,
      [user.id, String(plan_id), String(resolvedDayId), completedAt]
    );
    return Response.json({ ok: true }, { status: 201 });
  } finally {
    release();
  }
}

export async function DELETE(request: NextRequest) {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const planId = request.nextUrl.searchParams.get('plan_id');
  if (!planId || typeof planId !== 'string') {
    return Response.json({ error: 'plan_id query param required' }, { status: 400 });
  }
  const [connection, release] = await getDbConnection();
  try {
    await connection.execute('DELETE FROM progress_completions WHERE user_id = ? AND plan_id = ?', [
      user.id,
      planId,
    ]);
    return Response.json({ ok: true });
  } finally {
    release();
  }
}
