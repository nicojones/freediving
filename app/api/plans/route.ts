import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { validatePlanWithMeta } from '@/src/schemas/planSchema';
import { BUNDLED_PLAN_IDS } from '@/src/constants/app';

export const runtime = 'nodejs';

export async function GET() {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, description, days_json, created_by FROM plans ORDER BY created_at DESC'
    );
    const rawRows = (Array.isArray(rows) ? rows : []) as {
      id: string;
      name: string;
      description: string | null;
      days_json: string;
      created_by: number | null;
    }[];
    const plans = rawRows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      days: JSON.parse(r.days_json) as unknown[],
      created_by: r.created_by ?? undefined,
    }));
    return Response.json({ plans });
  } finally {
    release();
  }
}

export async function POST(request: NextRequest) {
  await initDb();
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const result = validatePlanWithMeta(body);
  if (!result.success) {
    return Response.json({ error: 'Validation failed', details: result.errors }, { status: 400 });
  }
  const { id, name, description, days } = result.data;
  if (BUNDLED_PLAN_IDS.includes(id)) {
    return Response.json(
      { error: `Plan id "${id}" is reserved for built-in plans` },
      { status: 400 }
    );
  }
  const [connection, release] = await getDbConnection();
  try {
    const [existingRows] = await connection.execute('SELECT id FROM plans WHERE id = ?', [id]);
    const existing = (Array.isArray(existingRows) ? existingRows[0] : undefined) as
      | { id: string }
      | undefined;
    if (existing) {
      return Response.json({ error: `Plan with id "${id}" already exists` }, { status: 409 });
    }
    const daysJson = JSON.stringify(days);
    const createdAt = Date.now();
    await connection.execute(
      'INSERT INTO plans (id, name, description, days_json, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description ?? null, daysJson, createdAt, user.id]
    );
    return Response.json({ id, name, description, days, created_at: createdAt }, { status: 201 });
  } finally {
    release();
  }
}
