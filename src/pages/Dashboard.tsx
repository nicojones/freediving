import clsx from 'clsx'
import isNil from 'lodash/isNil'
import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BottomNavBar } from '../components/BottomNavBar'
import { DayListSection } from '../components/DayListSection'
import { InstallPrompt } from '../components/InstallPrompt'
import { PlanCompleteMessage } from '../components/PlanCompleteMessage'
import { RestDayCard } from '../components/RestDayCard'
import { SessionPreviewSection } from '../components/SessionPreviewSection'
import { StatusBanner } from '../components/StatusBanner'
import { TopAppBar } from '../components/TopAppBar'
import { DEFAULT_PLAN_NAME } from '../constants/app'
import { useTraining } from '../contexts/TrainingContext'
import { getCurrentDay, getDayId, getDayIndexById, getPhasesForDay } from '../services/planService'
import { isDayCompleted } from '../utils/completions'

/** Dashboard: ~162 lines. Slightly over 150; further extraction would split cohesive day/session routing logic. */
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
      if (isNil(plan)) return
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

  // Sync URL dayId to selected day; invalid dayId → redirect to /
  useEffect(() => {
    if (isNil(plan)) return
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

  if (isNil(plan)) return null

  const p = plan!
  const currentDayIndex = getCurrentDay(p, completions)
  const selectedPhases =
    selectedDayIndex !== null ? getPhasesForDay(p, selectedDayIndex) : null
  const isRestDay = selectedPhases === null && selectedDayIndex !== null
  const isPlanComplete = selectedDayIndex === null && p.length > 0
  const showSessionPreview =
    viewMode === 'session-preview' &&
    selectedDayIndex !== null &&
    selectedPhases !== null &&
    !isRestDay
  const showDayDetail = selectedDayIndex !== null
  const planName = planWithMeta?.name ?? DEFAULT_PLAN_NAME

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
        <StatusBanner progressError={progressError} savedMessage={savedMessage} />

        {!showSessionPreview && (
          <InstallPrompt hasEngaged={completions.length > 0} />
        )}

        {showDayDetail && isRestDay ? (
          <RestDayCard
            dayIndex={selectedDayIndex!}
            isCompleted={isDayCompleted(completions, getDayId(p, selectedDayIndex!) ?? undefined)}
            onBack={handleBack}
          />
        ) : !showSessionPreview ? (
          <DayListSection
            plan={p}
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

        {isPlanComplete && <PlanCompleteMessage />}
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
