import { useCallback, useEffect } from 'react'
import clsx from 'clsx'
import { useNavigate, useParams } from 'react-router-dom'
import { getPhasesForDay, getCurrentDay, getDayIndexById, getDayId } from '../services/planService'
import { useTraining } from '../contexts/TrainingContext'
import { isDayCompleted } from '../utils/completions'
import { TopAppBar } from '../components/TopAppBar'
import { BottomNavBar } from '../components/BottomNavBar'
import { InstallPrompt } from '../components/InstallPrompt'
import { DayListSection } from '../components/DayListSection'
import { SessionPreviewSection } from '../components/SessionPreviewSection'
import { RestDayCard } from '../components/RestDayCard'

export function Dashboard() {
  const navigate = useNavigate()
  const { dayId: urlDayId } = useParams<{ dayId?: string }>()
  const {
    plan,
    planWithMeta,
    completions,
    viewMode,
    selectedDayIndex,
    speedMultiplier,
    audioLoading,
    progressError,
    savedMessage,
    hasCompletedToday,
    testMode,
    setSelectedDayIndex,
    setViewMode,
    setSpeedMultiplier,
    setTestMode,
    handleStartSession,
  } = useTraining()

  const handleSelectDay = useCallback(
    (index: number) => {
      if (!plan) return
      const id = getDayId(plan, index)
      if (id) {
        navigate(`/day/${id}`)
      }
      setSelectedDayIndex(index)
      setViewMode('session-preview')
    },
    [plan, navigate, setSelectedDayIndex, setViewMode]
  )

  const handleBack = useCallback(() => {
    navigate('/')
    setViewMode('dashboard')
  }, [navigate, setViewMode])

  const handleStartSessionClick = useCallback(async () => {
    await handleStartSession()
    navigate('/session')
  }, [handleStartSession, navigate])

  const handleTrainingClick = useCallback(() => navigate('/'), [navigate])
  const handleSettingsClick = useCallback(
    () => navigate('/settings'),
    [navigate]
  )

  if (!plan) return null

  // Sync URL dayId to selected day; invalid dayId → redirect to /
  useEffect(() => {
    if (urlDayId) {
      const idx = getDayIndexById(plan, urlDayId)
      if (idx === null) {
        navigate('/', { replace: true })
      } else {
        setSelectedDayIndex(idx)
        setViewMode('session-preview')
      }
    }
  }, [urlDayId, plan, navigate, setSelectedDayIndex, setViewMode])

  const currentDayIndex = getCurrentDay(plan, completions)
  const selectedPhases =
    selectedDayIndex !== null ? getPhasesForDay(plan, selectedDayIndex) : null
  const isRestDay = selectedPhases === null && selectedDayIndex !== null
  const isPlanComplete = selectedDayIndex === null && plan.length > 0
  const showSessionPreview =
    viewMode === 'session-preview' &&
    selectedDayIndex !== null &&
    selectedPhases !== null &&
    !isRestDay
  const showDayDetail = selectedDayIndex !== null
  const planName = planWithMeta?.name ?? 'CO2 Tolerance III'

  return (
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar
        variant={showDayDetail ? 'session-preview' : 'dashboard'}
        weekLabel="Current Week"
        planName={planName}
      />
      <main
        className={clsx('px-6 pt-8 max-w-2xl mx-auto', { 'pb-40': showDayDetail })}
        style={{
          background:
            'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        {progressError && (
          <p className="px-6 py-3 w-full text-center text-error bg-error/20 rounded-lg text-sm font-body mb-4">
            {progressError}
          </p>
        )}
        {savedMessage  && (
          <p className="px-6 py-3 w-full text-center text-primary bg-primary/20 rounded-lg text-sm font-body mb-4">
            Saved
          </p>
        )}

        {!showSessionPreview && (
          <InstallPrompt hasEngaged={completions.length > 0} />
        )}

        {showDayDetail && isRestDay ? (
          <RestDayCard
            dayIndex={selectedDayIndex!}
            isCompleted={isDayCompleted(completions, getDayId(plan, selectedDayIndex!) ?? undefined)}
            onBack={handleBack}
          />
        ) : !showSessionPreview ? (
          <DayListSection
            plan={plan}
            completions={completions}
            currentDayIndex={currentDayIndex}
            onSelectDay={handleSelectDay}
          />
        ) : (
          selectedPhases && (
            <SessionPreviewSection
              selectedDayIndex={selectedDayIndex!}
              selectedPhases={selectedPhases}
              currentDayIndex={currentDayIndex}
              speedMultiplier={speedMultiplier}
              testMode={testMode}
              audioLoading={audioLoading}
              hasCompletedToday={hasCompletedToday}
              onBack={handleBack}
              onSpeedMultiplierChange={setSpeedMultiplier}
              onTestModeChange={setTestMode}
              onStartSession={handleStartSessionClick}
            />
          )
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
          onTrainingClick={handleTrainingClick}
          onSettingsClick={handleSettingsClick}
        />
      )}
    </div>
  )
}
