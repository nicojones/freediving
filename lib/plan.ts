import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDbConnection } from './db.config';

export type PlanWithMeta = {
  id: string;
  name: string;
  description?: string;
  days: unknown[];
};

export async function loadPlan(planId = 'default'): Promise<PlanWithMeta> {
  const baseName = planId === 'default' ? 'default' : planId;
  const filePath = join(process.cwd(), 'src', 'data', `${baseName}-plan.json`);
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  const [connection, release] = await getDbConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, name, description, days_json FROM plans WHERE id = ?',
      [planId]
    );
    const row = (Array.isArray(rows) ? rows[0] : undefined) as
      | { id: string; name: string; description: string | null; days_json: string }
      | undefined;
    if (row) {
      return {
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        days: JSON.parse(row.days_json) as unknown[],
      };
    }
  } finally {
    release();
  }
  const fallback = join(process.cwd(), 'src', 'data', 'default-plan.json');
  return JSON.parse(readFileSync(fallback, 'utf-8'));
}

export function getDayAtIndex(plan: PlanWithMeta, dayIndex: number): { id: string } | null {
  const days = Array.isArray(plan) ? plan : plan.days;
  const day = days?.[dayIndex];
  return day != null && typeof day === 'object' && 'id' in day ? (day as { id: string }) : null;
}
