/** Fixed relaxation duration at session start (silent, no events) */
export const RELAXATION_SECONDS = 60;

export type Phase = 'relaxation' | 'recovery' | 'hold' | 'complete';

export type TimerEvent =
  | { type: 'phase_start'; phase: 'hold'; index: number }
  | { type: 'hold_in_3' }
  | { type: 'prepare_hold' }
  | { type: 'countdown_30' }
  | { type: 'hold_end' }
  | { type: 'session_complete' };

export interface TimerState {
  phase: Phase;
  intervalIndex: number;
  elapsedMs: number;
  remainingMs: number;
}
