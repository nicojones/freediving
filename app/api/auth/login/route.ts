import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  await initDb();
  const body = await request.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };
  if (!username || !password) {
    return Response.json({ error: 'Username and password required' }, { status: 400 });
  }
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );
    const user = (Array.isArray(rows) ? rows[0] : undefined) as
      | { id: number; username: string; password_hash: string }
      | undefined;
    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = createToken({ id: user.id, username: user.username });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return Response.json({ user: { id: user.id, username: user.username } });
  } finally {
    release();
  }
}
