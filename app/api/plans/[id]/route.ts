import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { id } = await params
  if (!id) {
    return Response.json({ error: 'Plan id required' }, { status: 400 })
  }

  const plan = db
    .prepare('SELECT id, created_by FROM plans WHERE id = ?')
    .get(id) as { id: string; created_by: number | null } | undefined

  if (!plan) {
    return Response.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Allow delete if user created it, or if created_by is null (plans from before Phase 22 migration)
  if (plan.created_by != null && plan.created_by !== user.id) {
    return Response.json(
      { error: 'You can only delete plans you created' },
      { status: 403 }
    )
  }

  const activeUser = db
    .prepare('SELECT user_id FROM user_active_plan WHERE plan_id = ?')
    .get(id) as { user_id: number } | undefined

  if (activeUser) {
    return Response.json(
      { error: 'Cannot delete the active plan. Switch to another plan first.' },
      { status: 400 }
    )
  }

  db.prepare('DELETE FROM plans WHERE id = ?').run(id)
  return Response.json({ ok: true })
}
