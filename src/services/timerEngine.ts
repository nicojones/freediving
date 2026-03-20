import type { Phase } from '../types/plan';
import { RELAXATION_SECONDS, type TimerEvent, type TimerState } from '../types/timer';

type EventType = TimerEvent['type'];
type EventCallback = (payload: TimerEvent) => void;

export interface TimerStartOptions {
  /** Simulated seconds per real second. Default 1. Use 10 for test mode (~10× faster). */
  speedMultiplier?: number;
  /** Override relaxation phase duration (seconds). Default uses RELAXATION_SECONDS. Use 3 for test mode. */
  relaxationSecondsOverride?: number;
}

interface TimerEngineAPI {
  start(phases: Phase[], options?: TimerStartOptions): void;
  on(eventType: EventType, callback: EventCallback): void;
  getState(): TimerState;
  stop(): void;
  setSpeedMultiplier(multiplier: number): void;
}

function buildTimeline(phases: Phase[], options?: { relaxationSeconds?: number }) {
  const relaxationSeconds = options?.relaxationSeconds ?? RELAXATION_SECONDS;
  const relaxationMs = relaxationSeconds * 1000;
  const phaseStarts: number[] = [];
  const phaseEnds: number[] = [];
  let t = 0;
  phaseStarts.push(0);
  phaseEnds.push(relaxationMs);
  t = relaxationMs;
  for (const p of phases) {
    const durMs = p.duration * 1000;
    phaseStarts.push(t);
    phaseEnds.push(t + durMs);
    t += durMs;
  }
  const holdIndices = phases.map((p, i) => (p.type === 'hold' ? i : -1)).filter((i) => i >= 0);
  const holdStarts = holdIndices.map((i) => phaseStarts[i + 1]);
  const holdEnds = holdIndices.map((i) => phaseEnds[i + 1]);
  const recoveryBeforeHold = holdIndices.map((phaseIdx) => {
    const prevIdx = phaseIdx - 1;
    if (prevIdx >= 0 && phases[prevIdx].type === 'recovery') {
      return phases[prevIdx].duration;
    }
    return 0;
  });
  return {
    relaxationMs,
    phases,
    phaseStarts,
    phaseEnds,
    holdIndices,
    holdStarts,
    holdEnds,
    recoveryBeforeHold,
  };
}

function computeState(elapsedMs: number, timeline: ReturnType<typeof buildTimeline>): TimerState {
  const { relaxationMs, phases, phaseStarts, phaseEnds, holdIndices } = timeline;

  if (elapsedMs < relaxationMs) {
    return {
      phase: 'relaxation',
      intervalIndex: -1,
      elapsedMs,
      remainingMs: relaxationMs - elapsedMs,
    };
  }

  for (let i = 0; i < phases.length; i++) {
    const start = phaseStarts[i + 1];
    const end = phaseEnds[i + 1];
    if (elapsedMs >= start && elapsedMs < end) {
      const holdIdx =
        phases[i].type === 'hold' ? holdIndices.indexOf(i) : holdIndices.indexOf(i - 1);
      return {
        phase: phases[i].type === 'hold' ? 'hold' : 'recovery',
        intervalIndex: holdIdx >= 0 ? holdIdx : 0,
        elapsedMs,
        remainingMs: end - elapsedMs,
      };
    }
  }

  return {
    phase: 'complete',
    intervalIndex: holdIndices.length - 1,
    elapsedMs,
    remainingMs: 0,
  };
}

const DEFAULT_SPEED = 1;

export function createTimerEngine(): TimerEngineAPI {
  let startTime: number | null = null;
  let phases: Phase[] = [];
  let timeline: ReturnType<typeof buildTimeline> | null = null;
  let tickId: ReturnType<typeof setInterval> | null = null;
  let lastElapsedMs = 0;
  let speedMultiplier = DEFAULT_SPEED;
  let currentState: TimerState = {
    phase: 'complete',
    intervalIndex: -1,
    elapsedMs: 0,
    remainingMs: 0,
  };

  const listeners: Partial<Record<EventType, EventCallback[]>> = {};

  function emit(event: TimerEvent) {
    const cbs = listeners[event.type];
    if (cbs) {
      for (const cb of cbs) {
        cb(event);
      }
    }
  }

  function tick() {
    if (startTime === null || timeline === null) {
      return;
    }
    const realElapsedMs = Date.now() - startTime;
    const elapsedMs = Math.floor(realElapsedMs * speedMultiplier);

    currentState = computeState(elapsedMs, timeline);
    const { holdStarts, holdEnds, recoveryBeforeHold } = timeline;

    for (let i = 0; i < holdStarts.length; i++) {
      const prepareHoldAt = holdStarts[i] - 10000;
      const countdown30At = holdStarts[i] - 30000;
      const recBeforeThisHold = recoveryBeforeHold[i] ?? 0;

      const holdIn3At = holdStarts[i] - 3000;
      if (lastElapsedMs < holdIn3At && elapsedMs >= holdIn3At) {
        emit({ type: 'hold_in_3' });
      }
      if (lastElapsedMs < prepareHoldAt && elapsedMs >= prepareHoldAt) {
        emit({ type: 'prepare_hold' });
      }
      if (recBeforeThisHold >= 31 && lastElapsedMs < countdown30At && elapsedMs >= countdown30At) {
        emit({ type: 'countdown_30' });
      }
      if (lastElapsedMs < holdStarts[i] && elapsedMs >= holdStarts[i]) {
        emit({ type: 'phase_start', phase: 'hold', index: i });
      }
      if (lastElapsedMs < holdEnds[i] && elapsedMs >= holdEnds[i]) {
        emit({ type: 'hold_end' });
      }
    }

    const lastHoldEnd = holdEnds[holdEnds.length - 1];
    if (lastElapsedMs < lastHoldEnd && elapsedMs >= lastHoldEnd) {
      emit({ type: 'session_complete' });
    }

    lastElapsedMs = elapsedMs;

    if (currentState.phase === 'complete') {
      stop();
    }
  }

  function start(phasesInput: Phase[], options?: TimerStartOptions) {
    stop();
    phases = phasesInput;
    timeline = buildTimeline(phases, {
      relaxationSeconds: options?.relaxationSecondsOverride,
    });
    speedMultiplier = options?.speedMultiplier ?? DEFAULT_SPEED;
    startTime = Date.now();
    lastElapsedMs = 0;
    tickId = setInterval(tick, 100);
    tick();
  }

  function on(eventType: EventType, callback: EventCallback) {
    if (!listeners[eventType]) {
      listeners[eventType] = [];
    }
    listeners[eventType]!.push(callback);
  }

  function getState(): TimerState {
    return { ...currentState };
  }

  function setSpeedMultiplier(multiplier: number) {
    if (startTime === null || timeline === null) {
      return;
    }
    const now = Date.now();
    const currentSimulatedMs = Math.floor((now - startTime) * speedMultiplier);
    speedMultiplier = multiplier;
    startTime = now - currentSimulatedMs / multiplier;
  }

  function stop() {
    if (tickId !== null) {
      clearInterval(tickId);
      tickId = null;
    }
    startTime = null;
    timeline = null;
    phases = [];
    lastElapsedMs = 0;
    speedMultiplier = DEFAULT_SPEED;
    currentState = {
      phase: 'complete',
      intervalIndex: -1,
      elapsedMs: 0,
      remainingMs: 0,
    };
  }

  return { start, on, getState, stop, setSpeedMultiplier };
}
