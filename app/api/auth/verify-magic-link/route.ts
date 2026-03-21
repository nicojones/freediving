import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { initDb } from '@/lib/db';
import { getDbConnection } from '@/lib/db.config';
import { createToken, COOKIE_MAX_AGE } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    redirect('/login?error=missing');
  }

  await initDb();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, user_id, expires_at FROM magic_link_tokens WHERE token_hash = ?',
      [tokenHash]
    );
    const row = Array.isArray(rows)
      ? (rows[0] as { id: number; user_id: number; expires_at: Date } | undefined)
      : undefined;

    if (!row || new Date(row.expires_at) < new Date()) {
      redirect('/login?error=expired');
    }

    await connection.execute('DELETE FROM magic_link_tokens WHERE id = ?', [row.id]);

    const [userRows] = await connection.execute('SELECT id, username FROM users WHERE id = ?', [
      row.user_id,
    ]);
    const user = Array.isArray(userRows)
      ? (userRows[0] as { id: number; username: string } | undefined)
      : undefined;
    if (!user) {
      redirect('/login?error=expired');
    }

    const jwt = createToken({ id: user.id, username: user.username });
    const cookieStore = await cookies();
    cookieStore.set('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    redirect('/');
  } finally {
    release();
  }
}
