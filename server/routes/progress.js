import { Router } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

export const progressRouter = Router()

progressRouter.use(authMiddleware)

progressRouter.post('/', (req, res) => {
  const { plan_id, day_index } = req.body || {}
  if (plan_id === undefined || day_index === undefined) {
    return res.status(400).json({ error: 'plan_id and day_index required' })
  }
  const userId = req.user.id
  const completedAt = Date.now()
  db.prepare(
    `INSERT OR REPLACE INTO progress_completions (user_id, plan_id, day_index, completed_at)
     VALUES (?, ?, ?, ?)`
  ).run(userId, String(plan_id), Number(day_index), completedAt)
  res.status(201).json({ ok: true })
})

progressRouter.get('/', (req, res) => {
  const planId = req.query.plan_id || 'default'
  const userId = req.user.id
  const rows = db
    .prepare(
      `SELECT plan_id, day_index, completed_at FROM progress_completions
       WHERE user_id = ? AND plan_id = ?`
    )
    .all(userId, planId)
  res.json({ completions: rows })
})
