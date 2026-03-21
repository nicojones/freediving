import { NextRequest } from 'next/server';
import { getDbConnection } from '@/lib/db.config';
import { initDb } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { validatePlanWithMeta } from '@/src/schemas/planSchema';
import { APP_NAME, BUNDLED_PLAN_IDS } from '@/src/constants/app';
import { parseJson } from '@/src/utils/parseJson';

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
      `SELECT p.id, p.name, p.description, p.days_json, p.created_by, p.public, p.published_on,
        CASE WHEN p.created_by IS NULL THEN '${APP_NAME}' ELSE COALESCE(u.name, u.username) END AS creator_name
       FROM plans p
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.created_at DESC`
    );
    const rawRows = (Array.isArray(rows) ? rows : []) as {
      id: string;
      name: string;
      description: string | null;
      days_json: string;
      created_by: number | null;
      public: boolean;
      published_on: string | null;
      creator_name: string;
    }[];
    const plans = rawRows.map((r) => {
      const d = parseJson(r.days_json, [] as unknown[]);
      return {
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        days: Array.isArray(d) ? d : [],
        created_by: r.created_by ?? undefined,
        public: Boolean(r.public),
        published_on: r.published_on ?? null,
        creator_name: r.creator_name ?? APP_NAME,
      };
    });
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
      'INSERT INTO plans (id, name, description, days_json, created_at, created_by, public, published_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, description ?? null, daysJson, createdAt, user.id, false, null]
    );
    return Response.json({ id, name, description, days, created_at: createdAt }, { status: 201 });
  } finally {
    release();
  }
}
