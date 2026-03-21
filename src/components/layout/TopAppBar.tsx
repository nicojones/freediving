import { APP_NAME } from '../../constants/app';
import { FishIcon } from '../ui/FishIcon';

type TopAppBarVariant = 'dashboard' | 'session-preview' | 'active-session';

interface TopAppBarProps {
  variant: TopAppBarVariant;
  weekLabel?: string;
  onBack?: () => void;
  onShare?: () => void;
}

export function TopAppBar({
  variant,
  weekLabel,
  onBack,
  onShare,
}: TopAppBarProps) {
  return (
    <>
      <div className="h-16 w-full" />
      <header className="bg-background h-14 w-full flex items-center justify-between px-8 z-50 fixed top-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 transition-colors duration-400 -ml-1"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span className="font-label text-sm font-semibold uppercase tracking-wider">
                Back
              </span>
            </button>
          )}
          <FishIcon className="text-primary" size={28} aria-hidden />
          <span className="font-headline font-bold text-xl tracking-tighter text-primary">
            {APP_NAME}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {variant === 'dashboard' && weekLabel && (
            <div className="flex flex-col items-end">
              <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]">
                {weekLabel}
              </span>
            </div>
          )}
          {variant === 'session-preview' && (
            <>
              {onShare && (
                <button
                  type="button"
                  onClick={onShare}
                  className="text-on-surface-variant hover:bg-surface-container-low transition-colors duration-400 p-2 rounded-full"
                  aria-label="Share"
                >
                  <span className="material-symbols-outlined">share</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>
    </>
  );
}
