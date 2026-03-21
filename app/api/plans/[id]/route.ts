import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return Response.json({ error: 'Plan id required' }, { status: 400 });
  }

  const [connection, release] = await getDbConnection();
  try {
    const [planRows] = await connection.execute('SELECT id, created_by FROM plans WHERE id = ?', [
      id,
    ]);
    const plan = (Array.isArray(planRows) ? planRows[0] : undefined) as
      | { id: string; created_by: number | null }
      | undefined;

    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Allow delete if user created it, or if created_by is null (plans from before Phase 22 migration)
    if (plan.created_by != null && plan.created_by !== user.id) {
      return Response.json({ error: 'You can only delete plans you created' }, { status: 403 });
    }

    const [activeRows] = await connection.execute(
      'SELECT user_id FROM user_active_plan WHERE plan_id = ?',
      [id]
    );
    const activeUser = (Array.isArray(activeRows) ? activeRows[0] : undefined) as
      | { user_id: number }
      | undefined;

    if (activeUser) {
      return Response.json(
        { error: 'Cannot delete the active plan. Switch to another plan first.' },
        { status: 400 }
      );
    }

    await connection.execute('DELETE FROM plans WHERE id = ?', [id]);
    return Response.json({ ok: true });
  } finally {
    release();
  }
}
