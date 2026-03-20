import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { phaseSchema, planWithMetaSchema } from './plan';

describe('plan types', () => {
  describe('z.toJSONSchema', () => {
    it('produces valid JSON Schema for planWithMetaSchema', () => {
      const jsonSchema = z.toJSONSchema(planWithMetaSchema);
      expect(jsonSchema).toBeDefined();
      expect(typeof jsonSchema).toBe('object');
      expect(jsonSchema).toHaveProperty('$schema');
      expect(jsonSchema).toHaveProperty('type', 'object');
      expect(jsonSchema).toHaveProperty('properties');
      const props = jsonSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty('id');
      expect(props).toHaveProperty('name');
      expect(props).toHaveProperty('days');
    });

    it('produces valid JSON Schema for phaseSchema', () => {
      const jsonSchema = z.toJSONSchema(phaseSchema);
      expect(jsonSchema).toBeDefined();
      expect(jsonSchema).toHaveProperty('properties');
    });
  });

  describe('phaseSchema', () => {
    it('parses valid hold phase', () => {
      const result = phaseSchema.safeParse({ type: 'hold', duration: 60 });
      expect(result.success).toBe(true);
    });
    it('parses valid recovery phase', () => {
      const result = phaseSchema.safeParse({ type: 'recovery', duration: 120 });
      expect(result.success).toBe(true);
    });
    it('rejects invalid type', () => {
      const result = phaseSchema.safeParse({ type: 'invalid', duration: 60 });
      expect(result.success).toBe(false);
    });
  });

  describe('planWithMetaSchema', () => {
    it('parses valid PlanWithMeta', () => {
      const plan = {
        id: 'test-plan',
        name: 'Test Plan',
        days: [
          { id: 'd1', day: 1, phases: [{ type: 'hold', duration: 60 }] },
          { id: 'd2', day: 2, rest: true },
        ],
      };
      const result = planWithMetaSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });
    it('accepts optional created_by', () => {
      const plan = {
        id: 'test-plan',
        name: 'Test Plan',
        days: [{ id: 'd1', day: 1, phases: [{ type: 'hold', duration: 60 }] }],
        created_by: 1,
      };
      const result = planWithMetaSchema.safeParse(plan);
      expect(result.success).toBe(true);
    });
    it('rejects null as rest day (rest days must be { rest: true })', () => {
      const plan = {
        id: 'test-plan',
        name: 'Test Plan',
        days: [{ id: 'd1', day: 1, phases: [{ type: 'hold', duration: 60 }] }, null],
      };
      const result = planWithMetaSchema.safeParse(plan);
      expect(result.success).toBe(false);
    });
  });
});
