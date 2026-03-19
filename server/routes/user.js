import { Router } from 'express'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

export const userRouter = Router()

userRouter.use(authMiddleware)

userRouter.get('/active-plan', (req, res) => {
  const userId = req.user.id
  const row = db
    .prepare('SELECT plan_id FROM user_active_plan WHERE user_id = ?')
    .get(userId)
  if (!row) {
    return res.status(404).json({ error: 'No active plan set' })
  }
  res.json({ plan_id: row.plan_id })
})

userRouter.put('/active-plan', (req, res) => {
  const { plan_id } = req.body || {}
  if (!plan_id || typeof plan_id !== 'string') {
    return res.status(400).json({ error: 'plan_id required' })
  }
  const userId = req.user.id
  db.prepare(
    `INSERT INTO user_active_plan (user_id, plan_id) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET plan_id = excluded.plan_id`
  ).run(userId, plan_id)
  res.json({ ok: true })
})
