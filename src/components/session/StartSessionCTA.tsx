import { memo } from 'react';
import { format } from 'date-fns';
import { PrimaryButton } from '../ui/PrimaryButton';

interface StartSessionCTAProps {
  onStart: () => void;
  loading?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  /** When set, shows a green disabled "Completed on [date]" button instead */
  completedAt?: number;
}

export const StartSessionCTA = memo(function StartSessionCTA({
  onStart,
  loading = false,
  disabled = false,
  disabledMessage = "You've already trained today",
  completedAt,
}: StartSessionCTAProps) {
  const isCompleted = completedAt != null;
  const isDisabled = loading || disabled || isCompleted;

  if (isCompleted) {
    const dateStr = format(new Date(completedAt), 'MMM d, yyyy');
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-linear-to-t from-background via-background to-transparent pt-12 pb-8 px-6 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <button
            data-testid="completed-session-button"
            disabled
            className="w-full h-24 rounded-xl flex items-center justify-center gap-3 font-headline font-bold text-white bg-emerald-600/50 border-2 border-emerald-500/40 shadow-[0_0_24px_rgba(5,150,105,0.2)] cursor-not-allowed"
          >
            <span className="material-symbols-outlined" aria-hidden>
              check_circle
            </span>
            Completed on {dateStr}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-6 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {disabled && (
          <p className="text-on-surface-variant font-body text-sm mb-3 text-center">
            {disabledMessage}
          </p>
        )}
        <PrimaryButton
          data-testid="start-session-button"
          onClick={onStart}
          disabled={isDisabled}
          loading={loading}
          icon="play_arrow"
        >
          Start Session
        </PrimaryButton>
      </div>
    </div>
  );
});
