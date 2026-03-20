'use client'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PLAN_ID } from '../constants/app'
import {
  loadPlanById,
  getAvailablePlans,
  getPhasesForDay,
  getCurrentDay,
  getDayId,
} from '../services/planService'
import { getCurrentUser, logout } from '../services/authService'
import {
  recordCompletion,
  fetchCompletions,
  fetchActivePlan,
  setActivePlan as apiSetActivePlan,
  resetProgress as apiResetProgress,
  flushOfflineQueue,
  type Completion,
} from '../services/progressService'
import { hasCompletedToday } from '../utils/completions'
import { useSessionEngine } from '../hooks/useSessionEngine'
import type { Plan, PlanWithMeta } from '../types/plan'
import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'

export type TimerState = {
  phase: string
  intervalIndex: number
  remainingMs: number
  elapsedMs: number
}

export type ViewMode = 'dashboard' | 'session-preview' | 'settings'

export type SessionStatus = 'idle' | 'running' | 'awaitingCompletionConfirm' | 'complete'

interface TrainingContextValue {
  // Auth
  user: { id: number; username: string } | null | undefined
  refreshUser: () => Promise<void>

  // Plan & progress
  plan: Plan | null
  planWithMeta: PlanWithMeta | null
  activePlanId: string | null
  availablePlans: PlanWithMeta[]
  activePlanLoading: boolean
  error: string | null
  completions: Completion[]
  progressError: string | null
  resetProgress: () => Promise<void>
  setActivePlan: (planId: string) => Promise<void>

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
  testMode: boolean
  hasCompletedToday: boolean

  // Actions
  setSelectedDayIndex: (index: number | null) => void
  setViewMode: (mode: ViewMode) => void
  setSpeedMultiplier: (speed: number) => void
  setTestMode: (v: boolean) => void
  handleStartSession: () => Promise<void>
  handleAbortSession: () => void
  handleCompleteSession: () => Promise<void>
  handleBackFromComplete: () => void
  handleBackToTraining: () => void
  handleSettingsClick: () => void
  handleLogout: () => Promise<void>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

export function TrainingProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{ id: number; username: string } | null | undefined>(undefined)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planWithMeta, setPlanWithMeta] = useState<PlanWithMeta | null>(null)
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [availablePlans, setAvailablePlans] = useState<PlanWithMeta[]>([])
  const [activePlanLoading, setActivePlanLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completions, setCompletions] = useState<Completion[]>([])
  const [progressError, setProgressError] = useState<string | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [savedMessage, setSavedMessage] = useState(false)
  const [sessionDayIndex, setSessionDayIndex] = useState<number | null>(null)
  const [testMode, setTestMode] = useState(false)
  const sessionDayIndexRef = useRef<number | null>(null)

  const {
    startSession: engineStartSession,
    abortSession: engineAbortSession,
    resetToIdle: engineResetToIdle,
    markComplete: engineMarkComplete,
    timerState,
    sessionStatus,
    setSpeedMultiplier,
    audioLoading,
    speedMultiplier,
  } = useSessionEngine()

  const refreshUser = useCallback(() => getCurrentUser().then(setUser), [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (!user) return

    let cancelled = false
    const run = async () => {
      const available = getAvailablePlans()
      setAvailablePlans(available)
      if (isEmpty(available)) {
        setError('No plans available')
        return
      }

      let planId = await fetchActivePlan()
      if (planId === null) {
        planId = available[0].id
        const res = await apiSetActivePlan(planId)
        if (!('ok' in res)) {
          setError(res.error)
          return
        }
      }
      if (cancelled) return
      setActivePlanId(planId)

      const planResult = loadPlanById(planId)
      if ('error' in planResult) {
        setError(planResult.error)
        return
      }
      const meta = planResult
      setPlanWithMeta(meta)
      setPlan(meta.days)

      if (navigator.onLine) await flushOfflineQueue()
      const c = await fetchCompletions(planId)
      if (cancelled) return
      setCompletions(c)
    }

    setActivePlanLoading(true)
    setError(null)
    run()
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setActivePlanLoading(false))

    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user || !activePlanId) return
    const handleOnline = async () => {
      await flushOfflineQueue()
      const c = await fetchCompletions(activePlanId)
      setCompletions(c)
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [user, activePlanId])

  useEffect(() => {
    if (plan) {
      const current = getCurrentDay(plan, completions)
      setSelectedDayIndex((prev) => (prev === null ? current : prev))
    }
  }, [plan, completions])

  const handleStartSession = useCallback(async () => {
    if (isNil(plan) || selectedDayIndex === null) return
    if (hasCompletedToday(completions)) return
    const phases = getPhasesForDay(plan!, selectedDayIndex)
    if (!phases) return

    sessionDayIndexRef.current = selectedDayIndex
    setSessionDayIndex(selectedDayIndex)

    await engineStartSession(phases, {
      relaxationSecondsOverride: testMode ? 3 : undefined,
    })
  }, [plan, selectedDayIndex, testMode, completions, engineStartSession])

  const handleAbortSession = useCallback(() => {
    engineAbortSession()
    setSessionDayIndex(null)
  }, [engineAbortSession])

  const handleLogout = useCallback(async () => {
    await logout()
    setUser(null)
  }, [])

  const resetProgress = useCallback(async () => {
    const planId = activePlanId ?? DEFAULT_PLAN_ID
    const res = await apiResetProgress(planId)
    if ('ok' in res) {
      const c = await fetchCompletions(planId)
      setCompletions(c)
    } else {
      setProgressError(res.error)
    }
  }, [activePlanId])

  const setActivePlan = useCallback(async (planId: string) => {
    const res = await apiSetActivePlan(planId)
    if (!('ok' in res)) {
      setProgressError(res.error)
      return
    }
    await apiResetProgress(planId)
    const planResult = loadPlanById(planId)
    if ('error' in planResult) {
      setError(planResult.error)
      return
    }
    setActivePlanId(planId)
    setPlanWithMeta(planResult)
    setPlan(planResult.days)
    const c = await fetchCompletions(planId)
    setCompletions(c)
  }, [])

  const handleBackFromComplete = useCallback(() => {
    engineResetToIdle()
  }, [engineResetToIdle])

  const handleBackToTraining = useCallback(() => {
    handleBackFromComplete()
    const current = plan ? getCurrentDay(plan, completions) : 0
    setSelectedDayIndex(current)
    router.push('/')
  }, [handleBackFromComplete, plan, completions, router])

  const handleSettingsClick = useCallback(() => {
    handleBackFromComplete()
    router.push('/settings')
  }, [handleBackFromComplete, router])

  const handleCompleteSession = useCallback(async () => {
    const dayToRecord = sessionDayIndexRef.current
    const p = plan
    if (dayToRecord === null || isNil(p)) {
      setProgressError('Day not found')
      return
    }
    const dayId = getDayId(p!, dayToRecord)
    if (!dayId) {
      setProgressError('Day not found in plan — cannot record progress')
      return
    }
    const planId = activePlanId ?? DEFAULT_PLAN_ID
    const result = await recordCompletion(planId, dayId, dayToRecord)
    if ('ok' in result) {
      setProgressError(null)
      engineMarkComplete()
      setSessionDayIndex(null)
      router.push('/session/complete')
      setSavedMessage(true)
      setTimeout(() => setSavedMessage(false), 2500)
      if ('queued' in result && result.queued) {
        setCompletions((prev) => [
          ...prev,
          {
            plan_id: planId,
            day_id: dayId,
            completed_at: Math.floor(Date.now() / 1000),
          },
        ])
      } else {
        const c = await fetchCompletions(planId)
        setCompletions(c)
      }
    } else {
      setProgressError(result.error)
    }
  }, [plan, activePlanId, router, engineMarkComplete])

  const value: TrainingContextValue = {
    user,
    refreshUser,
    plan,
    planWithMeta,
    activePlanId,
    availablePlans,
    activePlanLoading,
    error,
    completions,
    progressError,
    resetProgress,
    setActivePlan,
    selectedDayIndex,
    viewMode,
    savedMessage,
    sessionStatus,
    sessionDayIndex,
    timerState,
    audioLoading,
    speedMultiplier,
    testMode,
    hasCompletedToday: hasCompletedToday(completions),
    setSelectedDayIndex,
    setViewMode,
    setSpeedMultiplier,
    setTestMode,
    handleStartSession,
    handleAbortSession,
    handleCompleteSession,
    handleBackFromComplete,
    handleBackToTraining,
    handleSettingsClick,
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
