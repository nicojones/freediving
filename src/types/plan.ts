import { z } from 'zod';

/** Phase schema: hold or recovery with duration in seconds */
export const phaseSchema = z.object({
  type: z.enum(['hold', 'recovery']).describe('Phase type: hold or recovery'),
  duration: z.number().int().positive().describe('Duration in seconds'),
});

/** Training day schema: hold/recovery phases; type defaults to "dry" if omitted */
export const trainingDaySchema = z.object({
  id: z.string().min(1).describe('Unique day identifier'),
  day: z.number().int().positive().describe('Day index (1-based)'),
  group: z.string().optional().describe('Optional group label'),
  phases: z.array(phaseSchema).min(1).describe('Hold/recovery phases; at least one'),
  type: z.enum(['dry', 'wet']).optional().describe('Training type: dry or wet'),
});

/** Rest day schema */
export const restDaySchema = z.object({
  id: z.string().min(1).describe('Unique day identifier'),
  day: z.number().int().positive().describe('Day index (1-based)'),
  group: z.string().optional().describe('Optional group label'),
  rest: z.literal(true).describe('Marks this as a rest day'),
});

/** A day in the plan: training or rest (rest days use { rest: true } for extensibility) */
export const planDaySchema = z.union([trainingDaySchema, restDaySchema]);

/** Plan with metadata; new structure for multi-plan support */
export const planWithMetaSchema = z.object({
  id: z.string().min(1).describe('Unique plan identifier'),
  name: z.string().min(1).describe('Plan display name'),
  description: z.string().optional().describe('Optional plan description'),
  days: z.array(planDaySchema).describe('Array of plan days (training or rest)'),
  created_by: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('User id who created this plan (DB plans only); undefined for bundled plans'),
  public: z.boolean().optional().describe('Whether plan is public'),
  published_on: z.string().nullable().optional().describe('ISO date when published'),
  creator_name: z.string().optional().describe('Display name of creator (never email)'),
});

export type Phase = z.infer<typeof phaseSchema>;
export type TrainingDay = z.infer<typeof trainingDaySchema>;
export type RestDay = z.infer<typeof restDaySchema>;
export type PlanDay = z.infer<typeof planDaySchema>;
export type Plan = PlanDay[];
export type PlanWithMeta = z.infer<typeof planWithMetaSchema>;
