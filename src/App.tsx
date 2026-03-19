import { useEffect, useState, useRef, type MouseEvent } from 'react'
import {
  loadPlan,
  getIntervalsForDay,
  getCurrentDay,
  computeSessionDurationSeconds,
  getDaySummary,
} from './services/planService'
import { getCurrentUser, logout } from './services/authService'
import {
  recordCompletion,
  fetchCompletions,
  type Completion,
} from './services/progressService'
import { createTimerEngine } from './services/timerEngine'
import { createAudioService } from './services/audioService'
import { LoginPage } from './pages/LoginPage'
import { TopAppBar } from './components/TopAppBar'
import { BottomNavBar } from './components/BottomNavBar'
import { PrimaryButton } from './components/PrimaryButton'
import type { Plan, Interval } from './types/plan'
import { RELAXATION_SECONDS } from './types/timer'

type TimelineItem =
  | { type: 'prepare'; seconds: number; label: string }
  | { type: 'hold'; seconds: number; label: string; isTargetPeak: boolean }

function buildSessionTimeline(intervals: Interval[]): TimelineItem[] {
  const maxHold = Math.max(...intervals.map((i) => i.holdSeconds))
  const items: TimelineItem[] = []
  items.push({
    type: 'prepare',
    seconds: RELAXATION_SECONDS,
    label: 'Relaxation',
  })
  for (let i = 0; i < intervals.length; i++) {
    const iv = intervals[i]
    items.push({
      type: 'hold',
      seconds: iv.holdSeconds,
      label: 'Static Apnea',
      isTargetPeak: iv.holdSeconds >= maxHold && intervals.length > 1,
    })
    if (i < intervals.length - 1) {
      items.push({
        type: 'prepare',
        seconds: iv.recoverySeconds,
        label: 'Controlled Inhalation',
      })
    }
  }
  return items
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}m`
}

function formatMmSs(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null | undefined>(undefined)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completions, setCompletions] = useState<Completion[]>([])
  const [progressError, setProgressError] = useState<string | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'dashboard' | 'session-preview' | 'settings'>('dashboard')
  const [showReadyConfirm, setShowReadyConfirm] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'running' | 'complete'>('idle')
  const [timerState, setTimerState] = useState<{
    phase: string
    intervalIndex: number
    remainingMs: number
  } | null>(null)
  const [, setSessionMessage] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const engineRef = useRef<ReturnType<typeof createTimerEngine> | null>(null)
  const sessionDayIndexRef = useRef<number | null>(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

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
      fetchCompletions('default').then((c) => setCompletions(c))
    }
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
        })
      }
    }, 100)
    return () => clearInterval(id)
  }, [sessionStatus])

  async function handleStartSession() {
    if (!plan || selectedDayIndex === null) return
    setSessionMessage(null)
    const intervals = getIntervalsForDay(plan, selectedDayIndex)
    if (!intervals) {
      setSessionMessage('Selected day is a rest day or has no intervals.')
      return
    }

    sessionDayIndexRef.current = selectedDayIndex
    setShowReadyConfirm(false)

    const audioService = createAudioService()
    setAudioLoading(true)
    try {
      await audioService.preload()
    } catch (e) {
      setSessionMessage(e instanceof Error ? e.message : 'Audio failed to load.')
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

      const dayToRecord = sessionDayIndexRef.current
      if (dayToRecord !== null) {
        const result = await recordCompletion('default', dayToRecord)
        if ('ok' in result) {
          setSavedMessage(true)
          setTimeout(() => setSavedMessage(false), 2500)
          const c = await fetchCompletions('default')
          setCompletions(c)
        } else {
          setProgressError(result.error)
        }
      }
    })
    engine.start(intervals, { speedMultiplier: speedMultiplier })
    setSessionStatus('running')
  }

  async function handleLogout() {
    await logout()
    setUser(null)
  }

  if (user === undefined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary animate-pulse">waves</span>
          <span className="font-headline font-bold text-xl text-primary">Submerged</span>
        </div>
        <p className="mt-4 text-on-surface-variant font-body">Loading…</p>
      </main>
    )
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => getCurrentUser().then(setUser)} />
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background text-on-surface p-8 max-w-2xl mx-auto">
        <TopAppBar variant="dashboard" />
        <div className="pt-8">
          <p className="text-error font-body mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="text-primary font-label hover:underline"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-background text-on-surface p-8 max-w-2xl mx-auto">
        <TopAppBar variant="dashboard" />
        <div className="pt-8">
          <p className="text-on-surface-variant font-body mb-4">Loading plan…</p>
          <button
            onClick={handleLogout}
            className="text-primary font-label hover:underline"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  const currentDayIndex = getCurrentDay(plan, completions)
  const selectedIntervals =
    selectedDayIndex !== null ? getIntervalsForDay(plan, selectedDayIndex) : null
  const isRestDay = selectedIntervals === null && selectedDayIndex !== null
  const isPlanComplete = selectedDayIndex === null && plan.length > 0

  // Active Session view
  if (sessionStatus === 'running') {
    const intervals = sessionDayIndexRef.current !== null
      ? getIntervalsForDay(plan, sessionDayIndexRef.current)
      : null
    const timeline = intervals ? buildSessionTimeline(intervals) : []
    const totalRounds = timeline.filter((t) => t.type === 'hold').length
    const currentRound =
      timerState && timerState.phase === 'hold'
        ? timerState.intervalIndex + 1
        : timerState && timerState.phase === 'recovery'
          ? timerState.intervalIndex + 1
          : timerState && timerState.phase === 'relaxation'
            ? 0
            : 1
    const progressPercent = totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0
    const getCurrentTimelineIndex = () => {
      if (!timerState) return 0
      if (timerState.phase === 'relaxation') return 0
      if (timerState.phase === 'hold') return 1 + timerState.intervalIndex * 2
      if (timerState.phase === 'recovery') return 2 + timerState.intervalIndex * 2
      return timeline.length - 1
    }
    const currentIdx = getCurrentTimelineIndex()
    const nextItem = timeline[currentIdx + 1]

    return (
      <div className="min-h-screen bg-background font-body selection:bg-primary/30">
        <TopAppBar variant="active-session" onMore={() => {}} />
        <main className="min-h-screen flex flex-col pt-20 pb-24 px-8 items-center justify-between">
          <div className="w-full mt-4">
            <div className="flex justify-between items-end mb-3">
              <span className="text-on-surface-variant font-label text-xs tracking-widest uppercase">
                Session Progress
              </span>
              <span className="text-on-surface font-headline font-bold">
                {currentRound} / {totalRounds} Rounds
              </span>
            </div>
            <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-fixed rounded-full transition-all duration-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 w-full relative">
            <div
              className={`absolute w-[320px] h-[320px] rounded-full border-[12px] flex items-center justify-center transition-all duration-400 ${
                timerState?.phase === 'hold'
                  ? 'border-transparent focus-glow'
                  : 'border-surface-container-high'
              }`}
            >
              {timerState?.phase === 'hold' && intervals ? (
                <svg
                  className="absolute inset-[-12px] w-[344px] h-[344px] rotate-[-90deg]"
                  aria-hidden
                >
                  <circle
                    cx="172"
                    cy="172"
                    fill="transparent"
                    r="160"
                    stroke="#52dad3"
                    strokeDasharray={`${
                      (timerState.remainingMs / 1000 /
                        (intervals[timerState.intervalIndex]?.holdSeconds ?? 60)) *
                      1005
                    } 1005`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    strokeWidth="12"
                  />
                </svg>
              ) : null}
            </div>
            <div className="z-10 text-center">
              <p className="text-primary font-headline text-2xl font-bold tracking-widest mb-2 uppercase">
                {timerState?.phase === 'hold' ? 'Holding' : timerState?.phase === 'recovery' ? 'Recovery' : timerState?.phase === 'relaxation' ? 'Prepare' : 'Complete'}
              </p>
              <h1 className="text-on-surface font-headline text-[5rem] font-extrabold tracking-tighter leading-none tabular-nums">
                {timerState ? formatMmSs(timerState.remainingMs) : '--:--'}
              </h1>
              {nextItem && timerState?.phase !== 'complete' && (
                <div className="mt-8 flex items-center justify-center gap-2 bg-surface-container-low px-6 py-3 rounded-full">
                  <span className="material-symbols-outlined text-tertiary text-sm">next_plan</span>
                  <span className="text-on-surface-variant font-label text-sm tracking-wide">
                    Next: {formatDuration(nextItem.seconds)}{' '}
                    {nextItem.type === 'hold' ? 'Hold' : nextItem.label.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col gap-6 mb-12">
            <button
              type="button"
              onClick={() => {
                engineRef.current?.stop()
                engineRef.current = null
                setSessionStatus('idle')
                setTimerState(null)
              }}
              className="primary-pulse-gradient h-24 w-full rounded-xl flex items-center justify-center gap-4 active:scale-95 transition-transform duration-400"
            >
              <span
                className="material-symbols-outlined text-on-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stop_circle
              </span>
              <span className="text-on-primary font-headline text-2xl font-extrabold uppercase tracking-tight">
                Stop Hold
              </span>
            </button>
            <button
              type="button"
              className="w-full bg-surface-container-high h-20 rounded-xl flex items-center justify-center gap-3 hover:bg-surface-variant transition-colors duration-400"
            >
              <span className="material-symbols-outlined text-tertiary">flag</span>
              <span className="text-on-surface font-label font-semibold">Lap</span>
            </button>
          </div>
        </main>
      </div>
    )
  }

  // Session Complete view
  if (sessionStatus === 'complete') {
    return (
      <div className="min-h-screen bg-background">
        <TopAppBar variant="dashboard" planName="CO2 Tolerance III" />
        <main className="px-6 pt-8 pb-32 max-w-2xl mx-auto">
          <div className="bg-surface-container-low rounded-3xl p-8 text-center">
            <span
              className="material-symbols-outlined text-6xl text-primary mb-4"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">
              Session Complete
            </h2>
            <p className="text-on-surface-variant font-body mb-6">
              Great work. Your progress has been saved.
            </p>
            <PrimaryButton
              onClick={() => {
                setSessionStatus('idle')
                setViewMode('dashboard')
                setSelectedDayIndex(currentDayIndex)
              }}
              icon="arrow_forward"
            >
              Back to Training
            </PrimaryButton>
          </div>
        </main>
        <BottomNavBar
          activeTab="training"
          onTrainingClick={() => {}}
          onSettingsClick={() => {
            setSessionStatus('idle')
            setViewMode('settings')
          }}
        />
      </div>
    )
  }

  // Settings view
  if (viewMode === 'settings') {
    return (
      <div className="min-h-screen bg-background pb-32">
        <TopAppBar variant="dashboard" weekLabel="Settings" planName="" />
        <main className="px-6 pt-8 max-w-2xl mx-auto">
          <section className="mb-12">
            <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
              Settings
            </h1>
            <p className="text-on-surface-variant font-body text-sm mb-8">
              Account and app preferences.
            </p>
            <div className="bg-surface-container-low rounded-2xl p-6">
              <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
                Logged in as
              </span>
              <p className="text-on-surface font-headline text-xl font-bold">
                {user?.username ?? 'Unknown'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 text-primary font-label hover:underline"
            >
              Sign out
            </button>
          </section>
        </main>
        <BottomNavBar
          activeTab="settings"
          onTrainingClick={() => setViewMode('dashboard')}
          onSettingsClick={() => {}}
        />
      </div>
    )
  }

  // Dashboard + Session Preview
  const showSessionPreview =
    viewMode === 'session-preview' &&
    selectedDayIndex !== null &&
    selectedIntervals &&
    !isRestDay
  const showDayDetail = viewMode === 'session-preview' && selectedDayIndex !== null
  const planName = 'CO2 Tolerance III'

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopAppBar
        variant={showDayDetail ? 'session-preview' : 'dashboard'}
        weekLabel="Current Week"
        planName={planName}
      />
      <main
        className={`px-6 pt-8 max-w-2xl mx-auto ${showDayDetail ? 'pb-40' : ''}`}
        style={{
          background: 'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        {progressError && (
          <p className="text-error mb-4 text-sm font-body">{progressError}</p>
        )}
        {savedMessage && (
          <p className="text-primary mb-4 text-sm font-body">Saved</p>
        )}

        {showDayDetail && isRestDay ? (
          <div className="mt-10 bg-surface-container-low rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 transition-colors duration-400 -ml-1 shrink-0"
                aria-label="Back"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                <span className="font-label text-sm font-semibold uppercase tracking-wider">Back</span>
              </button>
            </div>
            <section>
              <h1 className="font-headline text-[3.5rem] leading-[1.1] font-bold tracking-tight text-on-surface mb-2">
                Day {selectedDayIndex! + 1}: Rest
              </h1>
              <p className="text-on-surface-variant text-lg tracking-wide font-medium">
                Recovery and light activity
              </p>
              {completions.some((c) => c.day_index === selectedDayIndex) && (
                <div className="mt-6 flex items-center gap-3 text-primary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span className="font-label font-semibold uppercase tracking-wider">Done</span>
                </div>
              )}
            </section>
          </div>
        ) : !showSessionPreview ? (
          <>
            <section className="mb-12">
              <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
                Training
              </h1>
              <p className="text-on-surface-variant font-body text-sm max-w-[80%]">
                Focus on rhythmic breathing and peripheral relaxation during the peak CO2 phases.
              </p>
            </section>

            <div className="flex flex-col gap-6">
              {plan.map((_, i) => {
                const summary = getDaySummary(plan, i)
                const isCurrent = currentDayIndex === i
                const isCompleted = completions.some((c) => c.day_index === i)
                const intervals = getIntervalsForDay(plan, i)
                const duration =
                  intervals !== null
                    ? Math.ceil(computeSessionDurationSeconds(intervals) / 60)
                    : 0
                const holdCount = intervals?.length ?? 0

                if (isCurrent && intervals) {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedDayIndex(i)
                        setViewMode('session-preview')
                      }}
                      className="relative group w-full text-left cursor-pointer"
                    >
                      <div className="absolute -inset-1 bg-primary/10 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition duration-1000" />
                      <div className="relative bg-surface-container-high border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex flex-col gap-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="bg-primary/20 text-primary font-label text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest mb-3 inline-block">
                                Current
                              </span>
                              <h3 className="font-headline font-bold text-3xl text-on-surface">
                                Day {i + 1}
                              </h3>
                              <p className="font-body text-sm text-on-surface-variant mt-1">
                                {summary} • {holdCount} {holdCount === 1 ? 'Hold' : 'Holds'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-secondary font-headline text-2xl font-bold">
                                {duration}:00
                              </span>
                              <span className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest">
                                Est. Duration
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-0 rounded-full" />
                          </div>
                          <PrimaryButton
                            onClick={(e?: MouseEvent) => {
                              e?.stopPropagation()
                              setSelectedDayIndex(i)
                              setViewMode('session-preview')
                            }}
                            icon="play_arrow"
                          >
                            Start Session
                          </PrimaryButton>
                        </div>
                      </div>
                    </button>
                  )
                }

                if (isCurrent && !intervals) {
                  return (
                    <div
                      key={i}
                      className="relative group w-full text-left"
                    >
                      <div className="absolute -inset-1 bg-primary/10 blur-xl rounded-full opacity-50 transition duration-1000" />
                      <div className="relative bg-surface-container-high border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="flex flex-col gap-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="bg-primary/20 text-primary font-label text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest mb-3 inline-block">
                                Current
                              </span>
                              <h3 className="font-headline font-bold text-3xl text-on-surface">
                                Day {i + 1}
                              </h3>
                              <p className="font-body text-sm text-on-surface-variant mt-1">
                                Rest day — recovery and light activity
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-secondary text-3xl">
                              self_improvement
                            </span>
                          </div>
                          <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-0 rounded-full" />
                          </div>
                          <div className="h-24 w-full rounded-xl bg-secondary/20 border-2 border-secondary/30 flex items-center justify-center gap-3 pointer-events-none">
                            <span className="material-symbols-outlined text-secondary">
                              bed
                            </span>
                            <span className="text-secondary font-headline text-xl font-bold">
                              Take a rest day today
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                if (isCompleted) {
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedDayIndex(i)
                        setViewMode('session-preview')
                      }}
                      className="bg-surface-container-low rounded-3xl p-6 flex items-center justify-between transition-colors duration-400 text-left w-full cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span
                            className="material-symbols-outlined text-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline font-bold text-on-surface">Day {i + 1}</h3>
                          <p className="font-body text-xs text-on-surface-variant">
                            {intervals
                              ? `${duration}:00 Total • ${holdCount} ${holdCount === 1 ? 'Hold' : 'Holds'}`
                              : 'Rest'}
                          </p>
                        </div>
                      </div>
                      <span className="text-primary font-label text-[10px] uppercase font-bold tracking-widest">
                        Done
                      </span>
                    </button>
                  )
                }

                return (
                  <div
                    key={i}
                    className="bg-surface-container-low/50 rounded-3xl p-6 flex items-center justify-between opacity-50"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline-variant">lock</span>
                      </div>
                      <div>
                        <h3 className="font-headline font-bold text-on-surface-variant">
                          Day {i + 1}
                        </h3>
                        <p className="font-body text-xs text-outline-variant">
                          {summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mt-10 bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 transition-colors duration-400 -ml-1 shrink-0"
                  aria-label="Back"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                  <span className="font-label text-sm font-semibold uppercase tracking-wider">Back</span>
                </button>
              </div>
              <section className="mb-0">
                <h1 className="font-headline text-[3.5rem] leading-[1.1] font-bold tracking-tight text-on-surface mb-2">
                  Day {selectedDayIndex! + 1}: Foundation Prep
                </h1>
                <p className="text-on-surface-variant text-lg tracking-wide font-medium">
                  CO2 Tolerance Training • Level 1
                </p>
              </section>
            </div>

            {selectedIntervals && (
              <>
                <section className="grid grid-cols-2 gap-4 mb-12">
                  <div className="col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="relative z-10">
                      <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em]">
                        Total Time
                      </span>
                      <div className="text-primary font-headline text-5xl font-extrabold mt-2">
                        {Math.ceil(computeSessionDurationSeconds(selectedIntervals) / 60)}m
                      </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                      <span className="material-symbols-outlined text-[120px]">timer</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl">
                    <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
                      Longest Hold
                    </span>
                    <div className="text-on-surface font-headline text-2xl font-bold">
                      {formatDuration(Math.max(...selectedIntervals.map((i) => i.holdSeconds)))}
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl">
                    <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
                      Recovery
                    </span>
                    <div className="text-secondary font-headline text-2xl font-bold">
                      {formatDuration(
                        selectedIntervals[0]?.recoverySeconds ?? 0
                      )}
                    </div>
                  </div>
                </section>

                <section className="mb-8">
                  <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-3">
                    Speed (test)
                  </span>
                  <div className="flex gap-2">
                    {[1, 2, 5, 10].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setSpeedMultiplier(speed)}
                        className={`px-4 py-2 rounded-xl font-label font-semibold transition-colors duration-400 ${
                          speedMultiplier === speed
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                        }`}
                      >
                        {speed}×
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mb-32">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-on-surface font-headline text-xl font-bold">
                      Session Breakdown
                    </h3>
                    <span className="text-on-surface-variant font-label text-xs">
                      {buildSessionTimeline(selectedIntervals).length} Intervals
                    </span>
                  </div>
                  <div className="space-y-4">
                    {buildSessionTimeline(selectedIntervals).map((item, idx) => (
                      <div key={idx} className="relative pl-8 group">
                        <div
                          className={`absolute left-[7px] top-0 bottom-0 w-[2px] bg-outline-variant/30 ${
                            idx === buildSessionTimeline(selectedIntervals).length - 1
                              ? 'bg-transparent'
                              : ''
                          }`}
                        />
                        <div
                          className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 bg-background z-10 ${
                            item.type === 'hold'
                              ? item.isTargetPeak
                                ? 'border-primary'
                                : 'border-primary'
                              : 'border-secondary'
                          }`}
                        />
                        <div
                          className={`bg-surface-container-high/40 p-5 rounded-xl flex items-center justify-between transition-colors duration-400 hover:bg-surface-container-high ${
                            item.type === 'hold' && 'isTargetPeak' in item && item.isTargetPeak
                              ? 'border border-primary/20 shadow-[0_0_20px_rgba(82,218,211,0.05)]'
                              : ''
                          }`}
                        >
                          <div>
                            <p
                              className={`font-headline font-bold text-lg ${
                                item.type === 'hold' ? 'text-primary' : 'text-secondary'
                              }`}
                            >
                              {formatDuration(item.seconds)}{' '}
                              {item.type === 'hold'
                                ? 'Hold'
                                : item.label.split(' ')[0]}
                            </p>
                            <p className="text-on-surface-variant text-xs mt-1">
                              {item.type === 'hold'
                                ? item.isTargetPeak
                                  ? 'Target Peak Effort'
                                  : 'Static Apnea'
                                : item.label}
                            </p>
                          </div>
                          <span
                            className={`material-symbols-outlined ${
                              item.type === 'hold' ? 'text-primary' : 'text-secondary opacity-40'
                            }`}
                            style={
                              item.type === 'hold' &&
                              'isTargetPeak' in item &&
                              item.isTargetPeak
                                ? { fontVariationSettings: "'FILL' 1" }
                                : undefined
                            }
                          >
                            {item.type === 'hold'
                              ? 'isTargetPeak' in item && item.isTargetPeak
                                ? 'stars'
                                : 'scuba_diving'
                              : 'air'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {showSessionPreview &&
              selectedIntervals &&
              selectedDayIndex === currentDayIndex && (
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-6 pointer-events-none">
                <div className="max-w-md mx-auto pointer-events-auto">
                  {!showReadyConfirm ? (
                    <PrimaryButton
                      onClick={() => setShowReadyConfirm(true)}
                      icon="play_arrow"
                    >
                      Start Session
                    </PrimaryButton>
                  ) : (
                    <div className="flex gap-4">
                      <PrimaryButton
                        onClick={handleStartSession}
                        disabled={audioLoading}
                        loading={audioLoading}
                        icon="play_arrow"
                      >
                        {audioLoading ? 'Loading…' : 'Start'}
                      </PrimaryButton>
                      <button
                        type="button"
                        onClick={() => setShowReadyConfirm(false)}
                        className="flex-1 h-24 bg-surface-container-high rounded-xl font-label font-semibold text-on-surface hover:bg-surface-variant transition-colors duration-400"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}


        {isPlanComplete && (
          <p className="text-on-surface-variant py-8 font-body">
            Plan complete — no session to run.
          </p>
        )}
      </main>

      {!showSessionPreview && (
        <BottomNavBar
          activeTab="training"
          onTrainingClick={() => setViewMode('dashboard')}
          onSettingsClick={() => setViewMode('settings')}
        />
      )}
    </div>
  )
}

export default App
