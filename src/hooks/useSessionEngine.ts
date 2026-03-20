import { useState, useRef, useEffect, useCallback } from 'react'
import type { Phase } from '../types/plan'
import { createTimerEngine } from '../services/timerEngine'
import type { AudioServiceAPI } from '../services/audioService'
import { createAudioService } from '../services/audioService'

export type TimerState = {
  phase: string
  intervalIndex: number
  remainingMs: number
  elapsedMs: number
}

export type SessionStatus = 'idle' | 'running' | 'awaitingCompletionConfirm' | 'complete'

export interface SessionEngineOptions {
  speedMultiplier?: number
  relaxationSecondsOverride?: number
}

export function useSessionEngine() {
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const engineRef = useRef<ReturnType<typeof createTimerEngine> | null>(null)
  const audioServiceRef = useRef<AudioServiceAPI | null>(null)

  useEffect(() => {
    if (sessionStatus !== 'running') {return}
    const id = setInterval(() => {
      const engine = engineRef.current
      if (engine) {
        const s = engine.getState()
        setTimerState({
          phase: s.phase,
          intervalIndex: s.intervalIndex,
          remainingMs: s.remainingMs,
          elapsedMs: s.elapsedMs,
        })
      }
    }, 100)
    return () => clearInterval(id)
  }, [sessionStatus])

  const startSession = useCallback(
    async (phases: Phase[], options?: SessionEngineOptions) => {
      const audioService = createAudioService()
      setAudioLoading(true)
      try {
        await audioService.preload()
      } catch {
        setAudioLoading(false)
        return
      }
      setAudioLoading(false)

      const speed = options?.speedMultiplier ?? speedMultiplier
      const engine = createTimerEngine()
      engineRef.current = engine
      audioServiceRef.current = audioService
      audioService.wireToTimer(engine)
      engine.on('session_complete', () => {
        engine.stop()
        engineRef.current = null
        audioServiceRef.current = null
        setSessionStatus('awaitingCompletionConfirm')
        setTimerState(null)
      })
      engine.start(phases, {
        speedMultiplier: speed,
        relaxationSecondsOverride: options?.relaxationSecondsOverride,
      })
      setSessionStatus('running')
    },
    [speedMultiplier]
  )

  const abortSession = useCallback(() => {
    audioServiceRef.current?.stop()
    audioServiceRef.current = null
    engineRef.current?.stop()
    engineRef.current = null
    setSessionStatus('idle')
    setTimerState(null)
  }, [])

  const resetToIdle = useCallback(() => {
    setSessionStatus('idle')
  }, [])

  const markComplete = useCallback(() => {
    setSessionStatus('complete')
  }, [])

  const setSpeedMultiplierWithEngine = useCallback((speed: number) => {
    setSpeedMultiplier(speed)
    engineRef.current?.setSpeedMultiplier(speed)
  }, [])

  return {
    startSession,
    abortSession,
    resetToIdle,
    markComplete,
    timerState,
    sessionStatus,
    setSpeedMultiplier: setSpeedMultiplierWithEngine,
    audioLoading,
    speedMultiplier,
  }
}
