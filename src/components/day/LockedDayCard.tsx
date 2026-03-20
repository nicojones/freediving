import { memo } from 'react'

interface LockedDayCardProps {
  dayIndex: number
  dayId: string
  summary: string
  onSelect?: () => void
}

export const LockedDayCard = memo(function LockedDayCard({
  dayIndex,
  dayId,
  summary,
  onSelect,
}: LockedDayCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onSelect()
    }
  }

  const content = (
    <div className="flex items-center gap-5">
      <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center">
        <span className="material-symbols-outlined text-outline-variant">
          lock
        </span>
      </div>
      <div>
        <h3 className="font-headline font-bold text-on-surface-variant">
          Day {dayIndex + 1}
        </h3>
        <p className="font-body text-xs text-outline-variant">{summary}</p>
      </div>
    </div>
  )

  const baseClasses = 'bg-surface-container-low/50 rounded-3xl p-6 flex items-center justify-between opacity-50'
  const interactiveClasses = onSelect ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''

  if (onSelect) {
    return (
      <button
        type="button"
        data-testid={`day-card-${dayId}`}
        className={`${baseClasses} ${interactiveClasses}`}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        aria-label={`Preview day ${dayIndex + 1}`}
      >
        {content}
      </button>
    )
  }

  return (
    <div data-testid={`day-card-${dayId}`} className={baseClasses}>
      {content}
    </div>
  )
})
