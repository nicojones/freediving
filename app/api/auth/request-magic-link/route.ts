import { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { initDb } from '@/lib/db';
import { getDbConnection } from '@/lib/db.config';
import { checkLimit, recordAttempt } from '@/lib/rateLimit';
import { sendMagicLink } from '@/lib/email';

export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().email().trim(),
});

const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
};

export const POST = async (request: NextRequest) => {
  await initDb();
  const ip = getClientIp(request);

  if (!checkLimit(ip)) {
    return Response.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }
  recordAttempt(ip);

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }
  const { email } = parsed.data;

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
        throw new Error('Failed to create user');
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
    const magicLinkUrl = `${appUrl}/api/auth/verify-magic-link?token=${rawToken}`;

    try {
      await sendMagicLink(email, magicLinkUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Email send failed';
      console.error('[request-magic-link] sendMagicLink failed:', msg);
      return Response.json(
        { error: 'Unable to send sign-in link. Please try again later.' },
        { status: 503 }
      );
    }

    return Response.json({
      message: 'If an account exists with this email, you will receive a sign-in link shortly.',
    });
  } finally {
    release();
  }
};
