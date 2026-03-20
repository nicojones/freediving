import { z } from 'zod';
import { planWithMetaSchema, type PlanWithMeta } from '../types/plan';

export type PlanWithMetaInput = z.infer<typeof planWithMetaSchema>;

export function validatePlanWithMeta(
  data: unknown
): { success: true; data: PlanWithMeta } | { success: false; errors: string[] } {
  const result = planWithMetaSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as PlanWithMeta };
  }
  const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
  return { success: false, errors };
}
