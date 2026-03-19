import { useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { FishIcon } from './components/FishIcon'
import { getCurrentDay } from './services/planService'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { TopAppBar } from './components/TopAppBar'
import { ActiveSessionView } from './components/ActiveSessionView'
import { SessionCompleteView } from './components/SessionCompleteView'
import { SettingsView } from './components/SettingsView'
import { TrainingProvider, useTraining } from './contexts/TrainingContext'

function SessionRouteGuard({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useTraining()
  if (sessionStatus !== 'running') return <Navigate to="/" replace />
  return <>{children}</>
}

function SessionCompleteRouteGuard({ children }: { children: React.ReactNode }) {
  const { sessionStatus } = useTraining()
  if (sessionStatus !== 'complete') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppContent() {
  const {
    user,
    refreshUser,
    plan,
    error,
    completions,
    setSelectedDayIndex,
    handleBackFromComplete,
    handleLogout,
  } = useTraining()
  const navigate = useNavigate()

  const currentDayIndex = plan ? getCurrentDay(plan, completions) : 0
  const handleBackToTraining = useCallback(() => {
    handleBackFromComplete()
    setSelectedDayIndex(currentDayIndex)
    navigate('/')
  }, [handleBackFromComplete, setSelectedDayIndex, currentDayIndex, navigate])

  const handleSettingsClick = useCallback(() => {
    handleBackFromComplete()
    navigate('/settings')
  }, [handleBackFromComplete, navigate])

  if (user === undefined) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-background text-on-surface p-8">
        <div className="flex items-center gap-3">
          <FishIcon className="text-primary animate-pulse" size={28} aria-hidden />
          <span className="font-headline font-bold text-xl text-primary">Fishly</span>
        </div>
        <p className="mt-4 text-on-surface-variant font-body">Loading…</p>
      </main>
    )
  }

  if (!user) {
    return <LoginPage onLoginSuccess={refreshUser} />
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

  return (
    <Routes>
      <Route
        path="/session"
        element={
          <SessionRouteGuard>
            <ActiveSessionView />
          </SessionRouteGuard>
        }
      />
      <Route
        path="/session/complete"
        element={
          <SessionCompleteRouteGuard>
            <SessionCompleteView
              onBackToTraining={handleBackToTraining}
              onSettingsClick={handleSettingsClick}
            />
          </SessionCompleteRouteGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <SettingsView
            username={user?.username ?? 'Unknown'}
            onLogout={handleLogout}
          />
        }
      />
      <Route path="/" element={<Dashboard />} />
      <Route path="/day/:dayId" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <TrainingProvider>
      <AppContent />
    </TrainingProvider>
  )
}

export default App
