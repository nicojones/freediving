import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { loadPlan, getDayAtIndex } from '@/lib/plan'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const planId = request.nextUrl.searchParams.get('plan_id') || 'default'
  const rows = db
    .prepare(
      `SELECT plan_id, day_id, completed_at FROM progress_completions
       WHERE user_id = ? AND plan_id = ?`
    )
    .all(user.id, planId) as { plan_id: string; day_id: string; completed_at: number }[]
  return Response.json({ completions: rows })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const { plan_id, day_id, day_index } = body as {
    plan_id?: string
    day_id?: string
    day_index?: number
  }
  if (plan_id === undefined) {
    return Response.json({ error: 'plan_id required' }, { status: 400 })
  }
  let resolvedDayId: string | undefined | null = day_id
  if (resolvedDayId === undefined && typeof day_index === 'number') {
    const plan = loadPlan(plan_id)
    const day = getDayAtIndex(plan, day_index)
    resolvedDayId = day?.id ?? null
  }
  if (resolvedDayId === undefined || resolvedDayId === null) {
    return Response.json(
      { error: 'day_id or day_index required' },
      { status: 400 }
    )
  }
  const completedAt = Date.now()
  db.prepare(
    `INSERT OR REPLACE INTO progress_completions (user_id, plan_id, day_id, completed_at)
     VALUES (?, ?, ?, ?)`
  ).run(user.id, String(plan_id), String(resolvedDayId), completedAt)
  return Response.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const planId = request.nextUrl.searchParams.get('plan_id')
  if (!planId || typeof planId !== 'string') {
    return Response.json(
      { error: 'plan_id query param required' },
      { status: 400 }
    )
  }
  db.prepare(
    'DELETE FROM progress_completions WHERE user_id = ? AND plan_id = ?'
  ).run(user.id, planId)
  return Response.json({ ok: true })
}
