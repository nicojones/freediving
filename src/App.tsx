import { getCurrentDay } from './services/planService'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { TopAppBar } from './components/TopAppBar'
import { ActiveSessionView } from './components/ActiveSessionView'
import { SessionCompleteView } from './components/SessionCompleteView'
import { SettingsView } from './components/SettingsView'
import { TrainingProvider, useTraining } from './contexts/TrainingContext'

function AppContent() {
  const {
    user,
    refreshUser,
    plan,
    error,
    completions,
    viewMode,
    sessionStatus,
    sessionDayIndex,
    setSelectedDayIndex,
    setViewMode,
    handleBackFromComplete,
    handleLogout,
  } = useTraining()

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

  const currentDayIndex = getCurrentDay(plan, completions)

  if (sessionStatus === 'running' && sessionDayIndex !== null) {
    return <ActiveSessionView />
  }

  if (sessionStatus === 'complete') {
    return (
      <SessionCompleteView
        onBackToTraining={() => {
          handleBackFromComplete()
          setSelectedDayIndex(currentDayIndex)
          setViewMode('dashboard')
        }}
        onSettingsClick={() => {
          handleBackFromComplete()
          setViewMode('settings')
        }}
      />
    )
  }

  if (viewMode === 'settings') {
    return (
      <SettingsView
        username={user?.username ?? 'Unknown'}
        onLogout={handleLogout}
        onTrainingClick={() => setViewMode('dashboard')}
      />
    )
  }

  return <Dashboard />
}

function App() {
  return (
    <TrainingProvider>
      <AppContent />
    </TrainingProvider>
  )
}

export default App
