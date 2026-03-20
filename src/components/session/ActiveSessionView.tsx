'use client';
import clsx from 'clsx';
import { useSessionProgress } from '../../utils/sessionProgress';
import { formatDuration } from '../../utils/formatDuration';
import { formatMmSs } from '../../utils/formatMmSs';
import { formatPhaseDisplayName, formatPhaseShortLabel } from '../../utils/phaseLabels';
import { useTraining } from '../../hooks/useTraining';
import { TopAppBar } from '../layout/TopAppBar';
import { HoldProgressRing } from './HoldProgressRing';
import { SessionActionButtons } from './SessionActionButtons';

export function ActiveSessionView() {
  const {
    plan,
    sessionDayIndex,
    sessionStatus,
    timerState,
    speedMultiplier,
    setSpeedMultiplier,
    showTestControls,
    handleAbortSession,
    handleCompleteSession,
  } = useTraining();

  const { phases, totalRounds, currentRound, progressPercent, nextItem } = useSessionProgress(
    plan,
    sessionDayIndex,
    timerState
  );

  if (!plan || sessionDayIndex === null) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-body selection:bg-primary/30 flex flex-col">
      <TopAppBar variant="active-session" />
      <main className="flex-1 min-h-0 overflow-auto flex flex-col px-8 pt-4 pb-48 items-center">
        <div className="w-full shrink-0 mt-2 mb-4">
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
                width: `${sessionStatus === 'awaitingCompletionConfirm' ? 100 : progressPercent}%`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 min-h-[280px] w-full relative">
          <div
            className={clsx(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(320px,75vw)] max-w-[320px] aspect-square rounded-full flex items-center justify-center transition-all duration-400',
              {
                'border-transparent completion-glow': sessionStatus === 'awaitingCompletionConfirm',
              },
              {
                'border-transparent focus-glow':
                  sessionStatus !== 'awaitingCompletionConfirm' && timerState?.phase === 'hold',
              },
              {
                'border-transparent recovery-breathe':
                  sessionStatus !== 'awaitingCompletionConfirm' && timerState?.phase === 'recovery',
              },
              {
                'border-surface-container-high':
                  sessionStatus !== 'awaitingCompletionConfirm' &&
                  timerState?.phase !== 'hold' &&
                  timerState?.phase !== 'recovery',
              }
            )}
          >
            {timerState?.phase === 'hold' && phases && (
              <HoldProgressRing
                remainingMs={timerState.remainingMs}
                holdDurationSeconds={
                  phases.filter((p) => p.type === 'hold')[timerState.intervalIndex]?.duration ?? 60
                }
                isActive
              />
            )}
          </div>
          <div className="relative z-10 text-center">
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
                      Next: {formatDuration(nextItem.seconds)} {formatPhaseShortLabel(nextItem)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-8 pb-8 pt-4 bg-background z-40">
        <SessionActionButtons
          sessionStatus={sessionStatus}
          speedMultiplier={speedMultiplier}
          onSpeedMultiplierChange={setSpeedMultiplier}
          showTestControls={showTestControls}
          onCompleteSession={handleCompleteSession}
          onAbortSession={handleAbortSession}
        />
      </div>
    </div>
  );
}
