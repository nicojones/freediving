interface ResetProgressSectionProps {
  onRequestReset: () => void;
  planName?: string | null;
}

export function ResetProgressSection({ onRequestReset, planName }: ResetProgressSectionProps) {
  const planLabel = planName ? `"${planName}"` : 'the current plan';
  return (
    <div className="bg-surface-container-low rounded-3xl p-6 overflow-hidden border border-outline-variant/30 flex flex-col gap-y-4">
      <h2 className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
        Reset progress
      </h2>
      <p className="text-on-surface-variant font-body text-sm">
        Clear all completed days for {planLabel}. <br />
        This cannot be undone.
      </p>
      <button
        type="button"
        data-testid="reset-progress-button"
        onClick={onRequestReset}
        className="w-full h-12 rounded-xl border-2 border-error/50 bg-error/10 hover:bg-error/20 font-headline font-bold text-error text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
      >
        <span className="material-symbols-outlined text-xl" aria-hidden>
          restart_alt
        </span>
        Reset progress
      </button>
    </div>
  );
}
