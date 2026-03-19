import { useEffect, useState } from 'react'
import { loadPlan, getIntervalsForDay } from './services/planService'
import { getCurrentUser, logout } from './services/authService'
import { recordCompletion, fetchCompletions } from './services/progressService'
import { LoginPage } from './pages/LoginPage'
import type { Plan } from './types/plan'

function App() {
  const [user, setUser] = useState<{ id: number; username: string } | null | undefined>(undefined)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completions, setCompletions] = useState<{ day_index: number }[]>([])

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

  async function handleLogout() {
    await logout()
    setUser(null)
  }

  async function handleMarkDayComplete(dayIndex: number) {
    const result = await recordCompletion('default', dayIndex)
    if ('ok' in result) {
      const c = await fetchCompletions('default')
      setCompletions(c)
    }
  }

  if (user === undefined) {
    return (
      <main style={{ padding: '2rem' }}>
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
      <main style={{ padding: '2rem' }}>
        <h1>Freediving Breathhold Trainer</h1>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={handleLogout}>Sign out</button>
      </main>
    )
  }

  if (!plan) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Freediving Breathhold Trainer</h1>
        <p>Loading plan...</p>
        <button onClick={handleLogout}>Sign out</button>
      </main>
    )
  }

  const day0Intervals = getIntervalsForDay(plan, 0)
  const intervalsText =
    day0Intervals === null
      ? 'rest day'
      : day0Intervals
          .map((i) => `hold ${i.holdSeconds}s / recover ${i.recoverySeconds}s`)
          .join(', ')

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Freediving Breathhold Trainer</h1>
      <p>
        Signed in as <strong>{user.username}</strong>{' '}
        <button onClick={handleLogout}>Sign out</button>
      </p>
      <p>Plan loaded: {plan.length} days</p>
      <p>Day 1 intervals: {intervalsText}</p>
      <p>Completions: {completions.length}</p>
      <button onClick={() => handleMarkDayComplete(0)}>Mark day 0 complete</button>
    </main>
  )
}

export default App
