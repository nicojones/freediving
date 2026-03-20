import { DEFAULT_PLAN_NAME } from '../../constants/app'
import { FishIcon } from '../ui/FishIcon'

type TopAppBarVariant = 'dashboard' | 'session-preview' | 'active-session'

interface TopAppBarProps {
  variant: TopAppBarVariant
  weekLabel?: string
  planName?: string
  showPlanName?: boolean
  onBack?: () => void
  onShare?: () => void
}

export function TopAppBar({
  variant,
  weekLabel = 'Current Week',
  planName = DEFAULT_PLAN_NAME,
  showPlanName = true,
  onBack,
  onShare,
}: TopAppBarProps) {
  return (
    <header className="bg-background h-20 w-full flex items-center justify-between px-8 z-50">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-full px-4 py-2 transition-colors duration-400 -ml-1"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="font-label text-sm font-semibold uppercase tracking-wider">Back</span>
          </button>
        )}
        <FishIcon className="text-primary" size={28} aria-hidden />
        <span className="font-headline font-bold text-xl tracking-tighter text-primary">
          Fishly
        </span>
      </div>
      <div className="flex items-center gap-4">
        {variant === 'dashboard' && (
          <div className="flex flex-col items-end">
            <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em]">
              {weekLabel}
            </span>
            {showPlanName && (
              <span className="text-primary font-headline font-bold text-lg" data-testid="header-plan-name">
                {planName}
              </span>
            )}
          </div>
        )}
        {variant === 'session-preview' && onShare && (
          <button
            type="button"
            onClick={onShare}
            className="text-on-surface-variant hover:bg-surface-container-low transition-colors duration-400 p-2 rounded-full"
            aria-label="Share"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        )}
      </div>
    </header>
  )
}
