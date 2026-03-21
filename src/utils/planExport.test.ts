import { describe, expect, it } from 'vitest';
import { validatePlanWithMeta } from '../schemas/planSchema';
import type { PlanWithMeta } from '../types/plan';
import { planToJson } from './planExport';

describe('planExport', () => {
  const minimalPlan: PlanWithMeta = {
    id: 'test-plan',
    name: 'Test Plan',
    days: [
      { id: 'd1', day: 1, phases: [{ type: 'hold', duration: 60 }] },
      { id: 'd2', day: 2, rest: true },
    ],
  };

  const planWithMeta: PlanWithMeta = {
    ...minimalPlan,
    description: 'A test plan',
    created_by: 42,
    public: true,
    published_on: '2025-01-15',
    creator_name: 'Jane Doe',
  };

  describe('planToJson', () => {
    it('outputs valid JSON', () => {
      const json = planToJson(minimalPlan);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('output validates as PlanWithMeta (can be used to create a new plan)', () => {
      const json = planToJson(minimalPlan);
      const parsed = JSON.parse(json);
      const result = validatePlanWithMeta(parsed);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(minimalPlan.id);
        expect(result.data.name).toBe(minimalPlan.name);
        expect(result.data.days).toEqual(minimalPlan.days);
      }
    });

    it('output contains only portable keys (no backend metadata)', () => {
      const json = planToJson(planWithMeta);
      const parsed = JSON.parse(json);
      const allowedKeys = new Set(['id', 'name', 'description', 'days']);
      expect(Object.keys(parsed).every((k) => allowedKeys.has(k))).toBe(true);
      expect(parsed).not.toHaveProperty('created_by');
      expect(parsed).not.toHaveProperty('public');
      expect(parsed).not.toHaveProperty('published_on');
      expect(parsed).not.toHaveProperty('creator_name');
    });

    it('includes description when present', () => {
      const json = planToJson(planWithMeta);
      const parsed = JSON.parse(json);
      expect(parsed.description).toBe('A test plan');
    });

    it('omits description when undefined', () => {
      const json = planToJson(minimalPlan);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('description');
    });

    it('preserves full days structure', () => {
      const plan: PlanWithMeta = {
        id: 'p1',
        name: 'Complex',
        description: 'Desc',
        days: [
          {
            id: 'd1',
            day: 1,
            group: 'A',
            phases: [
              { type: 'hold', duration: 90 },
              { type: 'recovery', duration: 120 },
            ],
            type: 'dry',
          },
          { id: 'd2', day: 2, rest: true },
        ],
      };
      const json = planToJson(plan);
      const result = validatePlanWithMeta(JSON.parse(json));
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.days).toEqual(plan.days);
      }
    });
  });
});
