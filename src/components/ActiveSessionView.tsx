import clsx from 'clsx'
import { useSessionProgress } from '../utils/sessionProgress'
import { formatDuration } from '../utils/formatDuration'
import { formatMmSs } from '../utils/formatMmSs'
import { formatPhaseDisplayName, formatPhaseShortLabel } from '../utils/phaseLabels'
import { useTraining } from '../contexts/TrainingContext'
import { TopAppBar } from './TopAppBar'
import { SpeedMultiplierSelector } from './SpeedMultiplierSelector'
import { HoldProgressRing } from './HoldProgressRing'

export function ActiveSessionView() {
  const {
    plan,
    sessionDayIndex,
    sessionStatus,
    timerState,
    speedMultiplier,
    setSpeedMultiplier,
    handleAbortSession,
    handleCompleteSession,
  } = useTraining()

  if (!plan || sessionDayIndex === null) return null

  const {
    phases,
    totalRounds,
    currentRound,
    progressPercent,
    nextItem,
  } = useSessionProgress(plan, sessionDayIndex, timerState)


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
          <div className="h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/40 rounded-full transition-all duration-400"
              style={{
                width: `${
                  sessionStatus === 'awaitingCompletionConfirm'
                    ? 100
                    : progressPercent
                }%`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 w-full relative">
          <div
            className={clsx(
              'absolute w-[320px] h-[320px] rounded-full flex items-center justify-center transition-all duration-400',
              { 'border-transparent completion-glow': sessionStatus === 'awaitingCompletionConfirm' },
              { 'border-transparent focus-glow': sessionStatus !== 'awaitingCompletionConfirm' && timerState?.phase === 'hold' },
              { 'border-transparent recovery-breathe': sessionStatus !== 'awaitingCompletionConfirm' && timerState?.phase === 'recovery' },
              { 'border-surface-container-high': sessionStatus !== 'awaitingCompletionConfirm' && timerState?.phase !== 'hold' && timerState?.phase !== 'recovery' }
            )}
          >
            {timerState?.phase === 'hold' && phases && (
              <HoldProgressRing
                remainingMs={timerState.remainingMs}
                holdDurationSeconds={
                  phases.filter((p) => p.type === 'hold')[
                    timerState.intervalIndex
                  ]?.duration ?? 60
                }
                isActive
              />
            )}
          </div>
          <div className="z-10 text-center">
            {sessionStatus === 'awaitingCompletionConfirm' ? (
              <>
                <p className="text-primary font-headline text-2xl font-bold tracking-widest mb-2 uppercase">
                  Session complete!
                </p>
                <h1 className="text-on-surface font-headline text-3xl font-extrabold tracking-tight leading-tight mb-8">
                  Great work. Tap below to save and finish.
                </h1>
              </>
            ) : (
              <>
                <p className="text-primary font-headline text-2xl font-bold tracking-widest mb-2 uppercase">
                  {formatPhaseDisplayName(timerState?.phase)}
                </p>
                <h1 className="text-on-surface font-headline text-[5rem] font-extrabold tracking-tighter leading-none tabular-nums">
                  {timerState ? formatMmSs(timerState.remainingMs) : '--:--'}
                </h1>
                {nextItem && timerState?.phase !== 'complete' && (
                  <div className="mt-8 flex items-center justify-center gap-2 bg-surface-container-low px-6 py-3 rounded-full">
                    <span className="material-symbols-outlined text-tertiary text-sm">
                      next_plan
                    </span>
                    <span className="text-on-surface-variant font-label text-sm tracking-wide">
                      Next: {formatDuration(nextItem.seconds)}{' '}
                      {formatPhaseShortLabel(nextItem)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-6 mb-12">
          {sessionStatus === 'awaitingCompletionConfirm' ? (
            <button
              type="button"
              onClick={handleCompleteSession}
              className="completion-gradient h-24 w-full rounded-xl flex items-center justify-center gap-4 active:scale-95 transition-transform duration-400"
            >
              <span
                className="material-symbols-outlined text-on-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="text-on-primary font-headline text-2xl font-extrabold uppercase tracking-tight">
                Complete session
              </span>
            </button>
          ) : (
            <>
              <SpeedMultiplierSelector value={speedMultiplier} onChange={setSpeedMultiplier} />
              <button
                type="button"
                onClick={handleAbortSession}
                className="primary-pulse-gradient h-24 w-full rounded-xl flex items-center justify-center gap-4 active:scale-95 transition-transform duration-400"
              >
                <span
                  className="material-symbols-outlined text-on-primary text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stop_circle
                </span>
                <span className="text-on-primary font-headline text-2xl font-extrabold uppercase tracking-tight">
                  Abort Session
                </span>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
