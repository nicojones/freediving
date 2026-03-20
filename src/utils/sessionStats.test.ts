import { describe, expect, it } from 'vitest';
import {
  getLongestHoldSeconds,
  getRecoveryDurationSeconds,
  getSessionDurationMinutes,
} from './sessionStats';

describe('sessionStats', () => {
  const phases = [
    { type: 'hold' as const, duration: 30 },
    { type: 'recovery' as const, duration: 60 },
    { type: 'hold' as const, duration: 45 },
  ];

  describe('getLongestHoldSeconds', () => {
    it('returns longest hold duration', () => {
      expect(getLongestHoldSeconds(phases)).toBe(45);
    });
    it('returns 0 for empty phases', () => {
      expect(getLongestHoldSeconds([])).toBe(0);
    });
    it('returns 0 when no holds', () => {
      expect(getLongestHoldSeconds([{ type: 'recovery', duration: 60 }])).toBe(0);
    });
  });

  describe('getRecoveryDurationSeconds', () => {
    it('returns first recovery duration', () => {
      expect(getRecoveryDurationSeconds(phases)).toBe(60);
    });
    it('returns 0 when no recovery', () => {
      expect(getRecoveryDurationSeconds([{ type: 'hold', duration: 30 }])).toBe(0);
    });
  });

  describe('getSessionDurationMinutes', () => {
    it('returns duration rounded up (relaxation + phases)', () => {
      expect(getSessionDurationMinutes(phases)).toBe(4);
    });
    it('rounds up partial minutes', () => {
      expect(getSessionDurationMinutes([{ type: 'hold', duration: 61 }])).toBe(3);
    });
  });
});
