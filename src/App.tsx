import { useEffect, useState, useRef } from 'react'
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
import type { Plan } from './types/plan'

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null | undefined>(undefined)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completions, setCompletions] = useState<Completion[]>([])
  const [progressError, setProgressError] = useState<string | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [showReadyConfirm, setShowReadyConfirm] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'running' | 'complete'>('idle')
  const [timerState, setTimerState] = useState<{
    phase: string
    intervalIndex: number
    remainingMs: number
  } | null>(null)
  const [sessionMessage, setSessionMessage] = useState<string | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const engineRef = useRef<ReturnType<typeof createTimerEngine> | null>(null)
  const sessionDayIndexRef = useRef<number | null>(null)

  const SPEED_OPTIONS = [1, 3, 5, 10, 20] as const

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
      setSelectedDayIndex(current)
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

  function handleSpeedChange(newSpeed: number) {
    setSpeedMultiplier(newSpeed)
    engineRef.current?.setSpeedMultiplier(newSpeed)
  }

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
    engine.start(intervals, {
      speedMultiplier,
    })
    setSessionStatus('running')
  }

  async function handleLogout() {
    await logout()
    setUser(null)
  }

  async function handleMarkDayComplete(dayIndex: number) {
    setProgressError(null)
    const result = await recordCompletion('default', dayIndex)
    if ('ok' in result) {
      const c = await fetchCompletions('default')
      setCompletions(c)
    } else {
      setProgressError(result.error)
    }
  }

  if (user === undefined) {
    return (
      <main className="p-8">
        <h1>Freediving Breathhold Trainer</h1>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return <LoginPage onLoginSuccess={() => getCurrentUser().then(setUser)} />
  }

  if (error) {
    return (
      <main className="p-8">
        <h1>Freediving Breathhold Trainer</h1>
        <p className="text-[crimson]">{error}</p>
        <button onClick={handleLogout}>Sign out</button>
      </main>
    )
  }

  if (!plan) {
    return (
      <main className="p-8">
        <h1>Freediving Breathhold Trainer</h1>
        <p>Loading plan...</p>
        <button onClick={handleLogout}>Sign out</button>
      </main>
    )
  }

  const currentDayIndex = getCurrentDay(plan, completions)
  const selectedIntervals =
    selectedDayIndex !== null
      ? getIntervalsForDay(plan, selectedDayIndex)
      : null
  const isRestDay = selectedIntervals === null && selectedDayIndex !== null
  const isPlanComplete = selectedDayIndex === null && plan.length > 0

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">Freediving Breathhold Trainer</h1>
      <p className="text-sm text-gray-600 mb-4">
        Signed in as <strong>{user.username}</strong>{' '}
        <button
          onClick={handleLogout}
          className="text-blue-600 hover:underline"
        >
          Sign out
        </button>
      </p>
      {progressError && (
        <p className="text-red-600 mb-2 text-sm">{progressError}</p>
      )}
      {savedMessage && (
        <p className="text-green-600 mb-2 text-sm">Saved</p>
      )}

      {sessionStatus === 'running' ? (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h2 className="text-lg font-medium mb-2">Session in progress</h2>
          {sessionMessage && (
            <p className="text-red-600 mb-2 text-sm">{sessionMessage}</p>
          )}
          {timerState && (
            <p className="font-mono text-sm mb-2">
              {timerState.phase}
              {timerState.intervalIndex >= 0 &&
                ` · interval ${timerState.intervalIndex + 1}`}{' '}
              · {Math.ceil(timerState.remainingMs / 1000)}s remaining
            </p>
          )}
          <label className="flex items-center gap-2 mb-2">
            <span className="text-sm">Speed:</span>
            <select
              value={speedMultiplier}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {SPEED_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <>
          <section className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Select day
            </h2>
            {isPlanComplete ? (
              <p className="text-gray-600 py-4">Plan complete — no session to run.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {plan.map((_, i) => {
                  const summary = getDaySummary(plan, i)
                  const isCurrent = currentDayIndex === i
                  const isCompleted = completions.some((c) => c.day_index === i)
                  const isSelected = selectedDayIndex === i
                  return (
                    <li key={i}>
                      <button
                        onClick={() => setSelectedDayIndex(i)}
                        className={`
                          px-3 py-2 rounded-lg border text-left text-sm transition-colors
                          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                          ${isCompleted ? 'opacity-70' : ''}
                        `}
                      >
                        <span>Day {i + 1} — {summary}</span>
                        {isCurrent && (
                          <span className="ml-2 text-xs text-blue-600 font-medium">
                            Current
                          </span>
                        )}
                        {isCompleted && (
                          <span className="ml-2 text-green-600" aria-hidden>✓</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="mb-6 pt-4 border-t border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Session preview
            </h2>
            {selectedDayIndex === null && !isPlanComplete ? (
              <p className="text-gray-500 text-sm">
                Select a day above
              </p>
            ) : isPlanComplete ? (
              <p className="text-gray-600 text-sm">
                Plan complete — no session to run.
              </p>
            ) : isRestDay ? (
              <div>
                <p className="text-gray-600 mb-2">Rest day — No intervals today.</p>
                <button
                  onClick={() => handleMarkDayComplete(selectedDayIndex!)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  Mark rest day complete
                </button>
              </div>
            ) : selectedIntervals ? (
              <div>
                <p className="text-gray-700 mb-2">
                  {selectedIntervals.length} cycle
                  {selectedIntervals.length !== 1 ? 's' : ''} · ~
                  {Math.ceil(
                    computeSessionDurationSeconds(selectedIntervals) / 60
                  )}{' '}
                  min
                </p>
                <ul className="list-decimal list-inside text-sm text-gray-600 mb-4">
                  {selectedIntervals.map((iv, idx) => (
                    <li key={idx}>
                      Hold {iv.holdSeconds}s, recover {iv.recoverySeconds}s
                    </li>
                  ))}
                </ul>
                {!showReadyConfirm ? (
                  <button
                    onClick={() => setShowReadyConfirm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Ready to start?
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartSession}
                      disabled={audioLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {audioLoading ? 'Loading audio…' : 'Start'}
                    </button>
                    <button
                      onClick={() => setShowReadyConfirm(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </section>

          {sessionStatus === 'complete' && (
            <p className="text-green-600 mb-4 text-sm">Session complete</p>
          )}
        </>
      )}
    </main>
  )
}

export default App
