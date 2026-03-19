import { Router } from 'express'
import { db } from '../db.js'
import { verifyPassword, createToken, authMiddleware } from '../auth.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }
  const user = db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?').get(username)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = createToken({ id: user.id, username: user.username })
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  res.json({ user: { id: user.id, username: user.username } })
})

authRouter.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.status(204).send()
})

authRouter.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})
