import type { PlanWithMeta } from '../types/plan';

/**
 * Serializes a plan to JSON using only the portable subset (id, name, description, days).
 * Excludes backend metadata (created_by, public, published_on, creator_name).
 * The output is valid PlanWithMeta JSON and can be pasted/uploaded to create a new plan.
 */
export const planToJson = (plan: PlanWithMeta): string =>
  JSON.stringify(
    { id: plan.id, name: plan.name, description: plan.description, days: plan.days },
    null,
    2
  );
