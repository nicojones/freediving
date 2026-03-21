import { getDbConnection } from './db.config';
import { parseJson } from '@/src/utils/parseJson';

export type PlanWithMeta = {
  id: string;
  name: string;
  description?: string;
  days: unknown[];
};

export async function loadPlan(planId = 'default'): Promise<PlanWithMeta> {
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
  throw new Error(`Plan not found: ${planId}`);
}

export function getDayAtIndex(plan: PlanWithMeta, dayIndex: number): { id: string } | null {
  const days = Array.isArray(plan) ? plan : plan.days;
  const day = days?.[dayIndex];
  return day != null && typeof day === 'object' && 'id' in day ? (day as { id: string }) : null;
}
