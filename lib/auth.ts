import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { verifyToken } from './jwt';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const INDEFINITE_SECONDS = 10 * 365 * 24 * 60 * 60; // 10 years

export function createToken(user: { id: number; username: string }): string {
  return jwt.sign({ userId: user.id, username: user.username }, SECRET, {
    expiresIn: INDEFINITE_SECONDS,
  });
}

export const COOKIE_MAX_AGE = INDEFINITE_SECONDS;

export async function getAuthUser(): Promise<{ id: number; username: string } | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('token')?.value ??
    (await headers()).get('authorization')?.replace(/^Bearer\s+/i, '') ??
    null;
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
