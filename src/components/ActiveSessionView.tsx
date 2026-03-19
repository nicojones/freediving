import { useSessionProgress } from '../utils/sessionProgress'
import { formatDuration } from '../utils/formatDuration'
import { formatMmSs } from '../utils/formatMmSs'
import { useTraining } from '../contexts/TrainingContext'
import { TopAppBar } from './TopAppBar'
import { SpeedMultiplierSelector } from './SpeedMultiplierSelector'

export function ActiveSessionView() {
  const {
    plan,
    sessionDayIndex,
    timerState,
    speedMultiplier,
    setSpeedMultiplier,
    handleAbortSession,
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
            {timerState?.phase === 'hold' && phases ? (
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
                      (phases
                        .filter((p) => p.type === 'hold')
                        [timerState.intervalIndex]?.duration ?? 60)) *
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
              {timerState?.phase === 'hold'
                ? 'Holding'
                : timerState?.phase === 'recovery'
                  ? 'Recovery'
                  : timerState?.phase === 'relaxation'
                    ? 'Prepare'
                    : 'Complete'}
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
                  {nextItem.type === 'hold' ? 'Hold' : nextItem.label.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col gap-6 mb-12">
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
        </div>
      </main>
    </div>
  )
}
