import { useMemo } from 'react';
import type { Plan } from '../types/plan';
import { getPhasesForDay, computeSessionDurationSeconds } from '../services/planService';
import { buildSessionTimeline, type TimelineItem } from './buildSessionTimeline';

export type TimerState = {
  phase: string;
  intervalIndex: number;
  remainingMs: number;
  elapsedMs: number;
};

export type SessionProgress = {
  phases: import('../types/plan').Phase[] | null;
  timeline: TimelineItem[];
  totalRounds: number;
  currentRound: number;
  totalDurationMs: number;
  progressPercent: number;
  currentIdx: number;
  nextItem: TimelineItem | undefined;
};

const getCurrentTimelineIndex = (
  timerState: TimerState | null,
  timeline: TimelineItem[]
): number => {
  if (!timerState) {
    return 0;
  }
  if (timerState.phase === 'relaxation') {
    return 0;
  }
  if (timerState.phase === 'hold') {
    return 1 + timerState.intervalIndex * 2;
  }
  if (timerState.phase === 'recovery') {
    return 2 + timerState.intervalIndex * 2;
  }
  return timeline.length - 1;
};

export const useSessionProgress = (
  plan: Plan | null,
  sessionDayIndex: number | null,
  timerState: TimerState | null
): SessionProgress => {
  return useMemo(() => {
    const phases = sessionDayIndex !== null && plan ? getPhasesForDay(plan, sessionDayIndex) : null;
    const timeline = phases ? buildSessionTimeline(phases) : [];
    const totalRounds = timeline.filter((t) => t.type === 'hold').length;
    const currentRound =
      timerState && timerState.phase === 'hold'
        ? timerState.intervalIndex + 1
        : timerState && timerState.phase === 'recovery'
          ? timerState.intervalIndex + 1
          : timerState && timerState.phase === 'relaxation'
            ? 0
            : 1;
    const totalDurationMs = phases ? computeSessionDurationSeconds(phases) * 1000 : 0;
    const progressPercent =
      totalDurationMs > 0 && timerState
        ? Math.min(100, (timerState.elapsedMs / totalDurationMs) * 100)
        : 0;
    const currentIdx = getCurrentTimelineIndex(timerState, timeline);
    const nextItem = timeline[currentIdx + 1];

    return {
      phases,
      timeline,
      totalRounds,
      currentRound,
      totalDurationMs,
      progressPercent,
      currentIdx,
      nextItem,
    };
  }, [plan, sessionDayIndex, timerState]);
};
