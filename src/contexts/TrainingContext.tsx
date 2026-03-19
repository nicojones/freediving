import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadPlan,
  getPhasesForDay,
  getCurrentDay,
} from '../services/planService'
import { getCurrentUser, logout } from '../services/authService'
import {
  recordCompletion,
  fetchCompletions,
  flushOfflineQueue,
  type Completion,
} from '../services/progressService'
import { createTimerEngine } from '../services/timerEngine'
import { createAudioService } from '../services/audioService'
import type { Plan } from '../types/plan'

export type TimerState = {
  phase: string
  intervalIndex: number
  remainingMs: number
  elapsedMs: number
}

export type ViewMode = 'dashboard' | 'session-preview' | 'settings'

export type SessionStatus = 'idle' | 'running' | 'complete'

interface TrainingContextValue {
  // Auth
  user: { id: number; username: string } | null | undefined
  refreshUser: () => Promise<void>

  // Plan & progress
  plan: Plan | null
  error: string | null
  completions: Completion[]
  progressError: string | null

  // UI
  selectedDayIndex: number | null
  viewMode: ViewMode
  savedMessage: boolean

  // Session
  sessionStatus: SessionStatus
  sessionDayIndex: number | null
  timerState: TimerState | null
  audioLoading: boolean
  speedMultiplier: number

  // Actions
  setSelectedDayIndex: (index: number | null) => void
  setViewMode: (mode: ViewMode) => void
  setSpeedMultiplier: (speed: number) => void
  handleStartSession: () => Promise<void>
  handleAbortSession: () => void
  handleBackFromComplete: () => void
  handleLogout: () => Promise<void>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

export function TrainingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ id: number; username: string } | null | undefined>(undefined)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completions, setCompletions] = useState<Completion[]>([])
  const [progressError, setProgressError] = useState<string | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [savedMessage, setSavedMessage] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle')
  const [sessionDayIndex, setSessionDayIndex] = useState<number | null>(null)
  const [timerState, setTimerState] = useState<TimerState | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const engineRef = useRef<ReturnType<typeof createTimerEngine> | null>(null)
  const sessionDayIndexRef = useRef<number | null>(null)

  const refreshUser = useCallback(() => getCurrentUser().then(setUser), [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (user) {
      loadPlan()
        .then((result) => {
          if ('error' in result) {
            setError(result.error)
          } else {
            setPlan(result)
          }
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Unknown error')
        })
      const loadCompletions = async () => {
        if (navigator.onLine) {
          await flushOfflineQueue()
        }
        const c = await fetchCompletions('default')
        setCompletions(c)
      }
      loadCompletions()
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const handleOnline = async () => {
      await flushOfflineQueue()
      const c = await fetchCompletions('default')
      setCompletions(c)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user])

  useEffect(() => {
    if (plan && completions.length >= 0) {
      const current = getCurrentDay(plan, completions)
      setSelectedDayIndex((prev) => (prev === null ? current : prev))
    }
  }, [plan, completions])

  useEffect(() => {
    if (sessionStatus !== 'running') return
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

  const handleStartSession = useCallback(async () => {
    if (!plan || selectedDayIndex === null) return
    const phases = getPhasesForDay(plan, selectedDayIndex)
    if (!phases) return

    sessionDayIndexRef.current = selectedDayIndex
    setSessionDayIndex(selectedDayIndex)

    const audioService = createAudioService()
    setAudioLoading(true)
    try {
      await audioService.preload()
    } catch {
      setAudioLoading(false)
      return
    }
    setAudioLoading(false)

    const engine = createTimerEngine()
    engineRef.current = engine
    audioService.wireToTimer(engine)
    engine.on('session_complete', async () => {
      engine.stop()
      engineRef.current = null
      setSessionStatus('complete')
      setTimerState(null)
      setSessionDayIndex(null)
      navigate('/session/complete')

      const dayToRecord = sessionDayIndexRef.current
      if (dayToRecord !== null) {
        const result = await recordCompletion('default', dayToRecord)
        if ('ok' in result) {
          setSavedMessage(true)
          setTimeout(() => setSavedMessage(false), 2500)
          if ('queued' in result && result.queued) {
            setCompletions((prev) => [
              ...prev,
              {
                plan_id: 'default',
                day_index: dayToRecord,
                completed_at: Math.floor(Date.now() / 1000),
              },
            ])
          } else {
            const c = await fetchCompletions('default')
            setCompletions(c)
          }
        } else {
          setProgressError(result.error)
        }
      }
    })
    engine.start(phases, { speedMultiplier })
    setSessionStatus('running')
  }, [plan, selectedDayIndex, speedMultiplier])

  const handleAbortSession = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    setSessionStatus('idle')
    setTimerState(null)
    setSessionDayIndex(null)
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])

  const handleBackFromComplete = useCallback(() => {
    setSessionStatus('idle')
  }, [])

  const setSpeedMultiplierWithEngine = useCallback((speed: number) => {
    setSpeedMultiplier(speed)
    engineRef.current?.setSpeedMultiplier(speed)
  }, [])

  const value: TrainingContextValue = {
    user,
    refreshUser,
    plan,
    error,
    completions,
    progressError,
    selectedDayIndex,
    viewMode,
    savedMessage,
    sessionStatus,
    sessionDayIndex,
    timerState,
    audioLoading,
    speedMultiplier,
    setSelectedDayIndex,
    setViewMode,
    setSpeedMultiplier: setSpeedMultiplierWithEngine,
    handleStartSession,
    handleAbortSession,
    handleBackFromComplete,
    handleLogout,
  }

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  )
}

export function useTraining(): TrainingContextValue {
  const ctx = useContext(TrainingContext)
  if (!ctx) {
    throw new Error('useTraining must be used within a TrainingProvider')
  }
  return ctx
}
