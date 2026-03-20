import { z } from 'zod'
import type { PlanWithMeta } from '../types/plan'

const phaseSchema = z.object({
  type: z.enum(['hold', 'recovery']),
  duration: z.number().int().positive(),
})

const trainingDaySchema = z.object({
  id: z.string().min(1),
  day: z.number().int().positive(),
  group: z.string().optional(),
  phases: z.array(phaseSchema).min(1),
  type: z.enum(['dry', 'wet']).optional(),
})

const restDaySchema = z.object({
  id: z.string().min(1),
  day: z.number().int().positive(),
  group: z.string().optional(),
  rest: z.literal(true),
})

const planDaySchema = z.union([
  trainingDaySchema,
  restDaySchema,
  z.null(),
])

const planWithMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  days: z.array(planDaySchema),
})

export type PlanWithMetaInput = z.infer<typeof planWithMetaSchema>

export function validatePlanWithMeta(
  data: unknown
): { success: true; data: PlanWithMeta } | { success: false; errors: string[] } {
  const result = planWithMetaSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data as PlanWithMeta }
  }
  const errors = result.error.issues.map(
    (e) => `${e.path.join('.')}: ${e.message}`
  )
  return { success: false, errors }
}
