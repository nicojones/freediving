import jwt from 'jsonwebtoken';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

export const verifyToken = (token: string): { id: number; username: string } | null => {
  try {
    const decoded = jwt.verify(token, SECRET) as { userId: number; username: string };
    return { id: decoded.userId, username: decoded.username };
  } catch {
    return null;
  }
};
