import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTimerEngine } from './timerEngine'

describe('timerEngine', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('emits phase_start when hold starts', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('phase_start', cb)
    engine.start(
      [{ type: 'recovery', duration: 2 }, { type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(100)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(3100) // 1s relaxation + 2s recovery = 3s total, hold starts
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenLastCalledWith({ type: 'phase_start', phase: 'hold', index: 0 })
  })

  it('emits prepare_hold 10s before each hold', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('prepare_hold', cb)
    engine.start(
      [{ type: 'recovery', duration: 15 }, { type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(100)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000) // 5s total, hold at 16s so prepare_hold at 6s - not yet
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1500) // 6.5s total, prepare_hold fires at 6s (10s before hold at 16s)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('emits countdown_30 only when recovery >= 31s, at 30s remaining', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('countdown_30', cb)
    engine.start(
      [{ type: 'recovery', duration: 31 }, { type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(100)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000) // 1s relax + 1s recovery = 2s, countdown_30 at 2s (32s - 30s = 2s into session)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not emit countdown_30 when recovery < 31s', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('countdown_30', cb)
    engine.start(
      [{ type: 'recovery', duration: 30 }, { type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(40000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('emits hold_end when hold ends', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('hold_end', cb)
    engine.start(
      [{ type: 'recovery', duration: 2 }, { type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(3000)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000) // 3s + 5s = 8s, hold ends
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('emits session_complete when session ends', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('session_complete', cb)
    engine.start(
      [{ type: 'recovery', duration: 2 }, { type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(100)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10000) // 1+2+5 = 8s to complete
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('relaxationSecondsOverride shortens relaxation', () => {
    const engine = createTimerEngine()
    const cb = vi.fn()
    engine.on('phase_start', cb)
    engine.start(
      [{ type: 'hold', duration: 5 }],
      { relaxationSecondsOverride: 2 }
    )
    vi.advanceTimersByTime(100)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000) // 2s relaxation, then hold starts
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('getState returns correct phase and remainingMs', () => {
    const engine = createTimerEngine()
    engine.start(
      [{ type: 'hold', duration: 10 }],
      { relaxationSecondsOverride: 1 }
    )
    vi.advanceTimersByTime(100)
    const duringRelax = engine.getState()
    expect(duringRelax.phase).toBe('relaxation')
    expect(duringRelax.remainingMs).toBeLessThanOrEqual(1000)

    vi.advanceTimersByTime(1000)
    const duringHold = engine.getState()
    expect(duringHold.phase).toBe('hold')
    expect(duringHold.remainingMs).toBeLessThanOrEqual(10000)

    vi.advanceTimersByTime(11000)
    const complete = engine.getState()
    expect(complete.phase).toBe('complete')
    expect(complete.remainingMs).toBe(0)
  })
})
