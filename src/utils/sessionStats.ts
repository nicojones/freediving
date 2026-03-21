import type { Phase } from '../types/plan';
import { computeSessionDurationSeconds } from '../services/planService';

/** Longest hold duration in seconds from phases */
export const getLongestHoldSeconds = (phases: Phase[]): number => {
  const holds = phases.filter((p) => p.type === 'hold').map((p) => p.duration);
  return holds.length > 0 ? Math.max(...holds) : 0;
};

/** Recovery phase duration in seconds (first recovery phase) */
export const getRecoveryDurationSeconds = (phases: Phase[]): number =>
  phases.find((p) => p.type === 'recovery')?.duration ?? 0;

/** Total session duration in minutes (rounded up) */
export const getSessionDurationMinutes = (phases: Phase[]): number =>
  Math.ceil(computeSessionDurationSeconds(phases) / 60);
