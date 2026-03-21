import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getDbConnection } from './db.config';
import { parseJson } from '@/src/utils/parseJson';

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
    const content = readFileSync(filePath, 'utf-8');
    const parsed = parseJson(content, null as unknown as PlanWithMeta);
    if (typeof parsed === 'string') {
      throw new Error(`Invalid JSON in plan file: ${filePath}`);
    }
    return parsed as PlanWithMeta;
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
        days: (() => {
          const d = parseJson(row.days_json, [] as unknown[]);
          return Array.isArray(d) ? d : [];
        })(),
      };
    }
  } finally {
    release();
  }
  const fallback = join(process.cwd(), 'src', 'data', 'default-plan.json');
  const content = readFileSync(fallback, 'utf-8');
  const parsed = parseJson(content, null as unknown as PlanWithMeta);
  if (typeof parsed === 'string') {
    throw new Error(`Invalid JSON in fallback plan file: ${fallback}`);
  }
  return parsed as PlanWithMeta;
}

export function getDayAtIndex(plan: PlanWithMeta, dayIndex: number): { id: string } | null {
  const days = Array.isArray(plan) ? plan : plan.days;
  const day = days?.[dayIndex];
  return day != null && typeof day === 'object' && 'id' in day ? (day as { id: string }) : null;
}
