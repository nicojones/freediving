/**
 * E2E-only: Set session cookie for a seeded user (nico, athena).
 * Enables tests to bypass the login UI. Only active when NODE_ENV=test.
 */
import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { createToken, COOKIE_MAX_AGE } from '@/lib/auth';

export const runtime = 'nodejs';

const ALLOWED = ['nico', 'athena'];

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'test' && !process.env.E2E_MAGIC_LINK_ENABLED) {
    return Response.json({ error: 'Not available' }, { status: 404 });
  }

  const username = request.nextUrl.searchParams.get('username');
  if (!username || !ALLOWED.includes(username)) {
    return Response.json({ error: 'Invalid username' }, { status: 400 });
  }

  await initDb();
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute('SELECT id, username FROM users WHERE username = ?', [
      username,
    ]);
    const user = Array.isArray(rows) ? (rows[0] as { id: number; username: string }) : undefined;
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const token = createToken({ id: user.id, username: user.username });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    redirect('/');
  } finally {
    release();
  }
}
