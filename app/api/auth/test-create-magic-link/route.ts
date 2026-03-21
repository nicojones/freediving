import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { initDb } from '@/lib/db';
import { getDbConnection } from '@/lib/db.config';
export const runtime = 'nodejs';

/**
 * Test-only: creates a magic link for the given email and returns the verify URL.
 * Only available when NODE_ENV=test. Bypasses rate limit and email sending.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'test' && !process.env.E2E_MAGIC_LINK_ENABLED) {
    return Response.json({ error: 'Not available' }, { status: 404 });
  }

  await initDb();
  const body = await request.json().catch(() => ({}));
  const email = (body as { email?: string }).email;
  if (!email || typeof email !== 'string') {
    return Response.json({ error: 'email required' }, { status: 400 });
  }

  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute('SELECT id, username FROM users WHERE email = ?', [
      email,
    ]);
    let user = Array.isArray(rows)
      ? (rows[0] as { id: number; username: string } | undefined)
      : undefined;

    if (!user) {
      const base =
        email
          .split('@')[0]
          ?.replace(/[^a-zA-Z0-9_]/g, '_')
          .slice(0, 20) || 'user';
      let username = base;
      for (let i = 0; i < 100; i++) {
        username = i === 0 ? base : `${base}_${i}`;
        const [existing] = await connection.execute('SELECT id FROM users WHERE username = ?', [
          username,
        ]);
        if (Array.isArray(existing) && existing.length === 0) {
          break;
        }
      }
      await connection.execute(
        'INSERT INTO users (email, username, password_hash) VALUES (?, ?, NULL)',
        [email, username]
      );
      const [inserted] = await connection.execute(
        'SELECT id, username FROM users WHERE email = ?',
        [email]
      );
      user = Array.isArray(inserted)
        ? (inserted[0] as { id: number; username: string })
        : undefined;
      if (!user) {
        return Response.json({ error: 'Failed to create user' }, { status: 500 });
      }
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await connection.execute(
      'INSERT INTO magic_link_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [tokenHash, user.id, expiresAt]
    );

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const url = `${appUrl}/api/auth/verify-magic-link?token=${rawToken}`;

    return Response.json({ url });
  } finally {
    release();
  }
}
