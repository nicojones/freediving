import { Router } from 'express'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadPlan() {
  const path = join(__dirname, '../../src/data/default-plan.json')
  return JSON.parse(readFileSync(path, 'utf-8'))
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
    const plan = loadPlan()
    const day = plan[day_index]
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
