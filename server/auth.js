import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function createToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET)
    return { id: decoded.userId, username: decoded.username }
  } catch {
    return null
  }
}

export function authMiddleware(req, res, next) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null)
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  const user = verifyToken(token)
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  req.user = user
  next()
}
