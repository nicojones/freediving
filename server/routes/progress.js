import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadPlan(planId = 'default') {
  const baseName = planId === 'default' ? 'default' : planId
  const path = join(__dirname, `../../src/data/${baseName}-plan.json`)
  if (!existsSync(path)) {
    const fallback = join(__dirname, '../../src/data/default-plan.json')
    const data = JSON.parse(readFileSync(fallback, 'utf-8'))
    return data
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function getDayAtIndex(plan, dayIndex) {
  const days = Array.isArray(plan) ? plan : plan.days
  return days?.[dayIndex] ?? null
}

export const progressRouter = Router()

progressRouter.use(authMiddleware)

progressRouter.post('/', (req, res) => {
  const { plan_id, day_id, day_index } = req.body || {}
  if (plan_id === undefined) {
    return res.status(400).json({ error: 'plan_id required' })
  }
  let resolvedDayId = day_id
  if (resolvedDayId === undefined && typeof day_index === 'number') {
    const plan = loadPlan(plan_id)
    const day = getDayAtIndex(plan, day_index)
    resolvedDayId = day?.id ?? null
  }
  if (resolvedDayId === undefined || resolvedDayId === null) {
    return res.status(400).json({ error: 'day_id or day_index required' })
  }
  const userId = req.user.id
  const completedAt = Date.now()
  db.prepare(
    `INSERT OR REPLACE INTO progress_completions (user_id, plan_id, day_id, completed_at)
     VALUES (?, ?, ?, ?)`
  ).run(userId, String(plan_id), String(resolvedDayId), completedAt)
  res.status(201).json({ ok: true })
})

progressRouter.get('/', (req, res) => {
  const planId = req.query.plan_id || 'default'
  const userId = req.user.id
  const rows = db
    .prepare(
      `SELECT plan_id, day_id, completed_at FROM progress_completions
       WHERE user_id = ? AND plan_id = ?`
    )
    .all(userId, planId)
  res.json({ completions: rows })
})

progressRouter.delete('/', (req, res) => {
  const planId = req.query.plan_id
  if (!planId || typeof planId !== 'string') {
    return res.status(400).json({ error: 'plan_id query param required' })
  }
  const userId = req.user.id
  db.prepare(
    'DELETE FROM progress_completions WHERE user_id = ? AND plan_id = ?'
  ).run(userId, planId)
  res.json({ ok: true })
})
