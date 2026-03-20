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
  const content = (
    <>
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
      {onSelect && (
        <span className="text-outline-variant font-label text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
          Preview
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </span>
      )}
    </>
  )

  if (onSelect) {
    return (
      <button
        data-testid={`day-card-${dayId}`}
        type="button"
        onClick={onSelect}
        className="bg-surface-container-low/50 rounded-3xl p-6 flex items-center justify-between opacity-70 hover:opacity-90 transition-opacity duration-300 text-left w-full cursor-pointer"
      >
        {content}
      </button>
    )
  }

  return (
    <div data-testid={`day-card-${dayId}`} className="bg-surface-container-low/50 rounded-3xl p-6 flex items-center justify-between opacity-50">
      {content}
    </div>
  )
})
