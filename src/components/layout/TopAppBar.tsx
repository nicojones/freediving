import Link from 'next/link';
import { APP_NAME } from '../../constants/app';
import { FishIcon } from '../ui/FishIcon';

interface TopAppBarProps {
  weekLabel?: string;
  onBack?: () => void;
}

export function TopAppBar({ weekLabel, onBack }: TopAppBarProps) {
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
          <Link
            href="/"
            className="flex items-center gap-3 text-primary hover:opacity-90 transition-opacity"
            aria-label="Go to training"
          >
            <FishIcon className="text-primary" size={28} aria-hidden />
            <span className="font-headline font-bold text-xl tracking-tighter text-primary">
              {APP_NAME}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {weekLabel && (
            <div className="flex flex-col items-end">
              <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]">
                {weekLabel}
              </span>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
