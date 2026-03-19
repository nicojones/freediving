import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPhasesForDay, getCurrentDay, getDayIndexById } from '../services/planService'
import { useTraining } from '../contexts/TrainingContext'
import { isDayCompleted } from '../utils/completions'
import { TopAppBar } from '../components/TopAppBar'
import { BottomNavBar } from '../components/BottomNavBar'
import { InstallPrompt } from '../components/InstallPrompt'
import { SpeedMultiplierSelector } from '../components/SpeedMultiplierSelector'
import { TrainingDayCard } from '../components/TrainingDayCard'
import { SessionBreakdown } from '../components/SessionBreakdown'
import { BackButton } from '../components/BackButton'
import { RestDayCard } from '../components/RestDayCard'
import { SessionPreviewStats } from '../components/SessionPreviewStats'
import { StartSessionCTA } from '../components/StartSessionCTA'

export function Dashboard() {
  const navigate = useNavigate()
  const { dayId: urlDayId } = useParams<{ dayId?: string }>()
  const {
    plan,
    completions,
    viewMode,
    selectedDayIndex,
    speedMultiplier,
    audioLoading,
    progressError,
    savedMessage,
    setSelectedDayIndex,
    setViewMode,
    setSpeedMultiplier,
    handleStartSession,
  } = useTraining()

  const handleSelectDay = useCallback(
    (index: number) => {
      if (!plan) return
      const day = plan[index]
      const id = day != null && 'id' in day ? (day as { id: string }).id : null
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
  const planName = 'CO2 Tolerance III'

  return (
    <div className="min-h-screen bg-background pb-32 min-w-0 overflow-x-hidden">
      <TopAppBar
        variant={showDayDetail ? 'session-preview' : 'dashboard'}
        weekLabel="Current Week"
        planName={planName}
      />
      <main
        className={`px-6 pt-8 max-w-2xl mx-auto ${showDayDetail ? 'pb-40' : ''}`}
        style={{
          background:
            'linear-gradient(180deg, rgba(82, 218, 211, 0.05) 0%, rgba(13, 20, 22, 0) 100%)',
        }}
      >
        {progressError && (
          <p className="text-error mb-4 text-sm font-body">{progressError}</p>
        )}
        {savedMessage && (
          <p className="text-primary mb-4 text-sm font-body">Saved</p>
        )}

        {!showSessionPreview && (
          <InstallPrompt hasEngaged={completions.length > 0} />
        )}

        {showDayDetail && isRestDay ? (
          <RestDayCard
            dayIndex={selectedDayIndex!}
            isCompleted={isDayCompleted(completions, (plan[selectedDayIndex!] as { id?: string })?.id)}
            onBack={handleBack}
          />
        ) : !showSessionPreview ? (
          <>
            <section className="mb-12">
              <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
                Training
              </h1>
              <p className="text-on-surface-variant font-body text-sm max-w-[80%]">
                Focus on rhythmic breathing and peripheral relaxation during the
                peak CO2 phases.
              </p>
            </section>

            <div className="flex flex-col gap-6">
              {plan.map((_, i) => (
                <TrainingDayCard
                  key={i}
                  plan={plan}
                  dayIndex={i}
                  isCurrent={currentDayIndex === i}
                  isCompleted={isDayCompleted(completions, (plan[i] as { id?: string })?.id)}
                  onSelect={() => handleSelectDay(i)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-0 bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <BackButton onClick={handleBack} />
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

            {selectedPhases && (
              <>
                <SessionPreviewStats phases={selectedPhases} />

                <SpeedMultiplierSelector
                  value={speedMultiplier}
                  onChange={setSpeedMultiplier}
                />

                <SessionBreakdown phases={selectedPhases} />
              </>
            )}

            {showSessionPreview &&
              selectedPhases &&
              selectedDayIndex === currentDayIndex && (
                <StartSessionCTA
                  onStart={handleStartSessionClick}
                  loading={audioLoading}
                />
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
          onTrainingClick={handleTrainingClick}
          onSettingsClick={handleSettingsClick}
        />
      )}
    </div>
  )
}
