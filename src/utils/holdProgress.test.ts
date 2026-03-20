import { describe, expect, it } from 'vitest';
import { getHoldProgressDashArray } from './holdProgress';

describe('holdProgress', () => {
  describe('getHoldProgressDashArray', () => {
    it('returns 0 circumference when totalDurationSeconds is 0', () => {
      const result = getHoldProgressDashArray(5000, 0);
      expect(result).toMatch(/^0 \d+\.\d+$/);
    });
    it('computes progress for elapsed hold', () => {
      const result = getHoldProgressDashArray(5000, 10);
      expect(result).toMatch(/^\d+\.?\d* 1005\.\d+$/);
    });
    it('full progress when remainingMs is 0', () => {
      const result = getHoldProgressDashArray(0, 10);
      expect(result).toMatch(/^0 1005\.\d+$/);
    });
    it('accepts custom circumference', () => {
      const result = getHoldProgressDashArray(5000, 10, 100);
      expect(result).toBe('50 100');
    });
  });
});
