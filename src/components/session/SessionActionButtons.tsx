import { SpeedMultiplierSelector } from './SpeedMultiplierSelector'

interface SessionActionButtonsProps {
  sessionStatus: 'idle' | 'running' | 'awaitingCompletionConfirm' | 'complete'
  speedMultiplier: number
  onSpeedMultiplierChange: (speed: number) => void
  onCompleteSession: () => void
  onAbortSession: () => void
}

export function SessionActionButtons({
  sessionStatus,
  speedMultiplier,
  onSpeedMultiplierChange,
  onCompleteSession,
  onAbortSession,
}: SessionActionButtonsProps) {
  return (
    <div className="w-full flex flex-col gap-6 mb-12">
      {sessionStatus === 'awaitingCompletionConfirm' ? (
        <button
          data-testid="complete-session-button"
          type="button"
          onClick={onCompleteSession}
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
          <SpeedMultiplierSelector value={speedMultiplier} onChange={onSpeedMultiplierChange} />
          <button
            type="button"
            data-testid="abort-session-button"
            onClick={onAbortSession}
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
  )
}
