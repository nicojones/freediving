import { useNavigate } from 'react-router-dom'
import {
  getPhasesForDay,
  computeSessionDurationSeconds,
  getCurrentDay,
} from '../services/planService'
import { formatDuration } from '../utils/formatDuration'
import { useTraining } from '../contexts/TrainingContext'
import { TopAppBar } from '../components/TopAppBar'
import { BottomNavBar } from '../components/BottomNavBar'
import { PrimaryButton } from '../components/PrimaryButton'
import { InstallPrompt } from '../components/InstallPrompt'
import { SpeedMultiplierSelector } from '../components/SpeedMultiplierSelector'
import { TrainingDayCard } from '../components/TrainingDayCard'
import { SessionBreakdown } from '../components/SessionBreakdown'

export function Dashboard() {
  const navigate = useNavigate()
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

  if (!plan) return null

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

  const handleSelectDay = (index: number) => {
    setSelectedDayIndex(index)
    setViewMode('session-preview')
  }

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
          <div className="mt-10 bg-surface-container-low rounded-3xl p-6 overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
                <button
                type="button"
                onClick={() => setViewMode('dashboard')}
                className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 min-h-11 min-w-11 transition-colors duration-400 -ml-1 shrink-0"
                aria-label="Back"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                <span className="font-label text-sm font-semibold uppercase tracking-wider">
                  Back
                </span>
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
                  <span className="font-label font-semibold uppercase tracking-wider">
                    Done
                  </span>
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
                  isCompleted={completions.some((c) => c.day_index === i)}
                  onSelect={() => handleSelectDay(i)}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-10 bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setViewMode('dashboard')}
                  className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 min-h-11 min-w-11 transition-colors duration-400 -ml-1 shrink-0"
                  aria-label="Back"
                >
                  <span className="material-symbols-outlined text-xl">
                    arrow_back
                  </span>
                  <span className="font-label text-sm font-semibold uppercase tracking-wider">
                    Back
                  </span>
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

            {selectedPhases && (
              <>
                <section className="grid grid-cols-2 gap-4 mb-12">
                  <div className="col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-40 relative overflow-hidden group">
                    <div className="relative z-10">
                      <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em]">
                        Total Time
                      </span>
                      <div className="text-primary font-headline text-5xl font-extrabold mt-2">
                        {Math.ceil(
                          computeSessionDurationSeconds(selectedPhases) / 60
                        )}
                        m
                      </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                      <span className="material-symbols-outlined text-[120px]">
                        timer
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl">
                    <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
                      Longest Hold
                    </span>
                    <div className="text-on-surface font-headline text-2xl font-bold">
                      {formatDuration(
                        Math.max(
                          ...selectedPhases
                            .filter((p) => p.type === 'hold')
                            .map((p) => p.duration)
                        )
                      )}
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-5 rounded-xl">
                    <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
                      Recovery
                    </span>
                    <div className="text-secondary font-headline text-2xl font-bold">
                      {formatDuration(
                        selectedPhases.find((p) => p.type === 'recovery')?.duration ?? 0
                      )}
                    </div>
                  </div>
                </section>

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
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-6 pointer-events-none">
                  <div className="max-w-md mx-auto pointer-events-auto">
                    <PrimaryButton
                      onClick={async () => {
                        await handleStartSession()
                        navigate('/session')
                      }}
                      disabled={audioLoading}
                      loading={audioLoading}
                      icon="play_arrow"
                    >
                      {audioLoading ? 'Loading…' : 'Start Session'}
                    </PrimaryButton>
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
          onTrainingClick={() => navigate('/')}
          onSettingsClick={() => navigate('/settings')}
        />
      )}
    </div>
  )
}
