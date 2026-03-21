import { describe, expect, it } from 'vitest';
import {
  getAvailablePlans,
  loadPlanById,
  getPhasesForDay,
  getDayId,
  getDayById,
  getDayIndexById,
  getCurrentDay,
  computeSessionDurationSeconds,
  getDaySummary,
  getPlanDays,
} from './planService';
import type { Plan } from '../types/plan';

const fixturePlan: Plan = [
  {
    id: 'd1',
    day: 1,
    phases: [
      { type: 'hold', duration: 10 },
      { type: 'recovery', duration: 20 },
      { type: 'hold', duration: 10 },
    ],
  },
  { id: 'd2', day: 2, rest: true },
  { id: 'd3', day: 3, phases: [{ type: 'hold', duration: 5 }] },
];

describe('planService', () => {
  describe('getAvailablePlans', () => {
    it('returns [] when no plans passed', () => {
      const plans = getAvailablePlans();
      expect(plans).toEqual([]);
    });
    it('returns passed plans when provided', () => {
      const fixture = [
        { id: 'p1', name: 'Plan 1', days: fixturePlan },
      ] as import('../types/plan').PlanWithMeta[];
      const plans = getAvailablePlans(fixture);
      expect(plans).toEqual(fixture);
    });
  });

  describe('loadPlanById', () => {
    it('returns plan when plan is in list', () => {
      const fixture = [
        { id: 'default', name: 'Default', days: fixturePlan },
      ] as import('../types/plan').PlanWithMeta[];
      const result = loadPlanById('default', fixture);
      expect(result).not.toHaveProperty('error');
      if (!('error' in result)) {
        expect(result.id).toBe('default');
        expect(result.days).toBeDefined();
      }
    });
    it('returns error when plan not in list', () => {
      const result = loadPlanById('nonexistent-plan-xyz', []);
      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('Plan not found');
    });
  });

  describe('getPhasesForDay', () => {
    it('returns phases for training day', () => {
      const phases = getPhasesForDay(fixturePlan, 0);
      expect(phases).toEqual([
        { type: 'hold', duration: 10 },
        { type: 'recovery', duration: 20 },
        { type: 'hold', duration: 10 },
      ]);
    });
    it('returns null for rest day', () => {
      const phases = getPhasesForDay(fixturePlan, 1);
      expect(phases).toBeNull();
    });
    it('returns null for out-of-range index', () => {
      expect(getPhasesForDay(fixturePlan, -1)).toBeNull();
      expect(getPhasesForDay(fixturePlan, 10)).toBeNull();
    });
    it('returns null for malformed plan', () => {
      expect(getPhasesForDay(null as unknown as Plan, 0)).toBeNull();
      expect(getPhasesForDay([] as Plan, 0)).toBeNull();
    });
  });

  describe('getDayId', () => {
    it('returns id for valid index', () => {
      expect(getDayId(fixturePlan, 0)).toBe('d1');
      expect(getDayId(fixturePlan, 2)).toBe('d3');
    });
    it('returns null for invalid index', () => {
      expect(getDayId(fixturePlan, -1)).toBeNull();
      expect(getDayId(fixturePlan, 10)).toBeNull();
    });
  });

  describe('getDayById', () => {
    it('returns day for matching id', () => {
      const day = getDayById(fixturePlan, 'd1');
      expect(day).not.toBeNull();
      expect(day).toHaveProperty('id', 'd1');
    });
    it('is case-insensitive', () => {
      const day = getDayById(fixturePlan, 'D1');
      expect(day).not.toBeNull();
      expect(day).toHaveProperty('id', 'd1');
    });
    it('returns null for unknown id', () => {
      expect(getDayById(fixturePlan, 'unknown')).toBeNull();
    });
  });

  describe('getDayIndexById', () => {
    it('returns index for matching id', () => {
      expect(getDayIndexById(fixturePlan, 'd1')).toBe(0);
      expect(getDayIndexById(fixturePlan, 'd3')).toBe(2);
    });
    it('is case-insensitive', () => {
      expect(getDayIndexById(fixturePlan, 'D2')).toBe(1);
    });
    it('returns null for unknown id', () => {
      expect(getDayIndexById(fixturePlan, 'unknown')).toBeNull();
    });
  });

  describe('getCurrentDay', () => {
    it('returns 0 when no completions', () => {
      expect(getCurrentDay(fixturePlan, [])).toBe(0);
    });
    it('on-track: returns next day after last completion', () => {
      const today = Date.now();
      const completions = [{ day_id: 'd1', completed_at: today }];
      expect(getCurrentDay(fixturePlan, completions)).toBe(1);
    });
    it('on-track: skips rest days when past rest day date', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const completions = [{ day_id: 'd1', completed_at: yesterday.getTime() }];
      const next = getCurrentDay(fixturePlan, completions);
      expect(next).toBe(1);
    });
    it('returns null when all days complete', () => {
      const base = Date.now();
      const completions = [
        { day_id: 'd1', completed_at: base },
        { day_id: 'd2', completed_at: base + 1 },
        { day_id: 'd3', completed_at: base + 2 },
      ];
      expect(getCurrentDay(fixturePlan, completions)).toBeNull();
    });
    it('behind: skips rest days, returns first training day', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const completions = [{ day_id: 'd1', completed_at: threeDaysAgo.getTime() }];
      const next = getCurrentDay(fixturePlan, completions);
      expect(next).toBe(2);
    });
  });

  describe('computeSessionDurationSeconds', () => {
    it('returns relaxation + phase durations', () => {
      const phases = [
        { type: 'hold' as const, duration: 10 },
        { type: 'recovery' as const, duration: 20 },
      ];
      expect(computeSessionDurationSeconds(phases)).toBe(60 + 10 + 20);
    });
  });

  describe('getDaySummary', () => {
    it('returns "Rest" for rest day', () => {
      expect(getDaySummary(fixturePlan, 1)).toBe('Rest');
    });
    it('returns "1 cycle" for single hold', () => {
      expect(getDaySummary(fixturePlan, 2)).toBe('1 cycle');
    });
    it('returns "N cycles" for multiple holds', () => {
      expect(getDaySummary(fixturePlan, 0)).toBe('2 cycles');
    });
  });

  describe('getPlanDays', () => {
    it('returns days from PlanWithMeta', () => {
      const meta = { id: 'x', name: 'X', days: fixturePlan };
      expect(getPlanDays(meta)).toEqual(fixturePlan);
    });
    it('returns plan when given Plan array', () => {
      expect(getPlanDays(fixturePlan)).toEqual(fixturePlan);
    });
  });
});
