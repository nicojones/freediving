import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { db } from './db';

export type PlanWithMeta = {
  id: string;
  name: string;
  description?: string;
  days: unknown[];
};

function loadPlan(planId = 'default'): PlanWithMeta {
  const baseName = planId === 'default' ? 'default' : planId;
  const filePath = join(process.cwd(), 'src', 'data', `${baseName}-plan.json`);
  if (existsSync(filePath)) {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  }
  const row = db
    .prepare('SELECT id, name, description, days_json FROM plans WHERE id = ?')
    .get(planId) as
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
  const fallback = join(process.cwd(), 'src', 'data', 'default-plan.json');
  return JSON.parse(readFileSync(fallback, 'utf-8'));
}

export function getDayAtIndex(plan: PlanWithMeta, dayIndex: number): { id: string } | null {
  const days = Array.isArray(plan) ? plan : plan.days;
  const day = days?.[dayIndex];
  return day != null && typeof day === 'object' && 'id' in day ? (day as { id: string }) : null;
}

export { loadPlan };
