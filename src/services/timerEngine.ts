import type { Interval } from '../types/plan'
import {
  RELAXATION_SECONDS,
  type TimerEvent,
  type TimerState,
} from '../types/timer'

type EventType = TimerEvent['type']
type EventCallback = (payload: TimerEvent) => void

export interface TimerStartOptions {
  /** Simulated seconds per real second. Default 1. Use 10 for test mode (~10× faster). */
  speedMultiplier?: number
}

interface TimerEngineAPI {
  start(intervals: Interval[], options?: TimerStartOptions): void
  on(eventType: EventType, callback: EventCallback): void
  getState(): TimerState
  stop(): void
  setSpeedMultiplier(multiplier: number): void
}

function buildTimeline(intervals: Interval[]) {
  const relaxationMs = RELAXATION_SECONDS * 1000
  const holdStarts: number[] = []
  const holdEnds: number[] = []
  let t = relaxationMs
  for (let i = 0; i < intervals.length; i++) {
    const iv = intervals[i]
    const holdMs = iv.holdSeconds * 1000
    holdStarts.push(t)
    holdEnds.push(t + holdMs)
    t += holdMs
    if (i < intervals.length - 1) {
      t += iv.recoverySeconds * 1000
    }
  }
  return { relaxationMs, holdStarts, holdEnds, intervals }
}

function computeState(
  elapsedMs: number,
  timeline: ReturnType<typeof buildTimeline>
): TimerState {
  const { relaxationMs, holdStarts, holdEnds, intervals } = timeline

  if (elapsedMs < relaxationMs) {
    return {
      phase: 'relaxation',
      intervalIndex: -1,
      elapsedMs,
      remainingMs: relaxationMs - elapsedMs,
    }
  }

  for (let i = 0; i < intervals.length; i++) {
    if (elapsedMs < holdStarts[i]) {
      return {
        phase: 'recovery',
        intervalIndex: i - 1,
        elapsedMs,
        remainingMs: holdStarts[i] - elapsedMs,
      }
    }
    if (elapsedMs < holdEnds[i]) {
      return {
        phase: 'hold',
        intervalIndex: i,
        elapsedMs,
        remainingMs: holdEnds[i] - elapsedMs,
      }
    }
  }

  return {
    phase: 'complete',
    intervalIndex: intervals.length - 1,
    elapsedMs,
    remainingMs: 0,
  }
}

const DEFAULT_SPEED = 1

export function createTimerEngine(): TimerEngineAPI {
  let startTime: number | null = null
  let intervals: Interval[] = []
  let timeline: ReturnType<typeof buildTimeline> | null = null
  let tickId: ReturnType<typeof setInterval> | null = null
  let lastElapsedMs = 0
  let speedMultiplier = DEFAULT_SPEED
  let currentState: TimerState = {
    phase: 'complete',
    intervalIndex: -1,
    elapsedMs: 0,
    remainingMs: 0,
  }

  const listeners: Partial<Record<EventType, EventCallback[]>> = {}

  function emit(event: TimerEvent) {
    const cbs = listeners[event.type]
    if (cbs) {
      for (const cb of cbs) {
        cb(event)
      }
    }
  }

  function tick() {
    if (startTime === null || timeline === null) return
    const realElapsedMs = Date.now() - startTime
    const elapsedMs = Math.floor(realElapsedMs * speedMultiplier)

    currentState = computeState(elapsedMs, timeline)
    const { holdStarts, holdEnds, intervals: ivs } = timeline

    for (let i = 0; i < ivs.length; i++) {
      const prepareHoldAt = holdStarts[i] - 10000
      const countdown30At = holdStarts[i] - 30000
      const recBeforeThisHold = i > 0 ? ivs[i - 1].recoverySeconds : 0

      const holdIn3At = holdStarts[i] - 3000
      if (lastElapsedMs < holdIn3At && elapsedMs >= holdIn3At) {
        emit({ type: 'hold_in_3' })
      }
      if (lastElapsedMs < prepareHoldAt && elapsedMs >= prepareHoldAt) {
        emit({ type: 'prepare_hold' })
      }
      if (
        recBeforeThisHold >= 31 &&
        lastElapsedMs < countdown30At &&
        elapsedMs >= countdown30At
      ) {
        emit({ type: 'countdown_30' })
      }
      if (lastElapsedMs < holdStarts[i] && elapsedMs >= holdStarts[i]) {
        emit({ type: 'phase_start', phase: 'hold', index: i })
      }
      if (lastElapsedMs < holdEnds[i] && elapsedMs >= holdEnds[i]) {
        emit({ type: 'hold_end' })
      }
    }

    const lastHoldEnd = holdEnds[holdEnds.length - 1]
    if (lastElapsedMs < lastHoldEnd && elapsedMs >= lastHoldEnd) {
      emit({ type: 'session_complete' })
    }

    lastElapsedMs = elapsedMs

    if (currentState.phase === 'complete') {
      stop()
    }
  }

  function start(ivs: Interval[], options?: TimerStartOptions) {
    stop()
    intervals = ivs
    timeline = buildTimeline(intervals)
    speedMultiplier = options?.speedMultiplier ?? DEFAULT_SPEED
    startTime = Date.now()
    lastElapsedMs = 0
    tickId = setInterval(tick, 100)
    tick()
  }

  function on(eventType: EventType, callback: EventCallback) {
    if (!listeners[eventType]) listeners[eventType] = []
    listeners[eventType]!.push(callback)
  }

  function getState(): TimerState {
    return { ...currentState }
  }

  function setSpeedMultiplier(multiplier: number) {
    if (startTime === null || timeline === null) return
    const now = Date.now()
    const currentSimulatedMs = Math.floor((now - startTime) * speedMultiplier)
    speedMultiplier = multiplier
    startTime = now - currentSimulatedMs / multiplier
  }

  function stop() {
    if (tickId !== null) {
      clearInterval(tickId)
      tickId = null
    }
    startTime = null
    timeline = null
    intervals = []
    lastElapsedMs = 0
    speedMultiplier = DEFAULT_SPEED
    currentState = {
      phase: 'complete',
      intervalIndex: -1,
      elapsedMs: 0,
      remainingMs: 0,
    }
  }

  return { start, on, getState, stop, setSpeedMultiplier }
}
