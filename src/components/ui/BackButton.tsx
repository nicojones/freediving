import { memo } from 'react';

interface BackButtonProps {
  onClick: () => void;
  'aria-label'?: string;
}

export const BackButton = memo(function BackButton({
  onClick,
  'aria-label': ariaLabel = 'Back',
}: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="back-button"
      className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 min-h-11 min-w-11 transition-colors duration-400 -ml-1 shrink-0"
      aria-label={ariaLabel}
    >
      <span className="material-symbols-outlined text-xl">arrow_back</span>
      <span className="font-label text-sm font-semibold uppercase tracking-wider">Back</span>
    </button>
  );
});
