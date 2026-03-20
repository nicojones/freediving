import { memo } from 'react'
import { pluralizeHolds } from '../utils/phaseLabels'

interface CompletedDayCardProps {
  dayIndex: number
  dayId: string
  duration: number
  holdCount: number
  isRestDay: boolean
  onSelect: () => void
}

export const CompletedDayCard = memo(function CompletedDayCard({
  dayIndex,
  dayId,
  duration,
  holdCount,
  isRestDay,
  onSelect,
}: CompletedDayCardProps) {
  const subtitle = isRestDay
    ? 'Rest'
    : `${duration}:00 Total • ${holdCount} ${pluralizeHolds(holdCount)}`

  return (
    <button
      data-testid={`day-card-${dayId}`}
      type="button"
      onClick={onSelect}
      className="bg-surface-container-low rounded-3xl p-6 flex items-center justify-between transition-colors duration-400 text-left w-full cursor-pointer"
    >
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-surface">
            Day {dayIndex + 1}
          </h3>
          <p className="font-body text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <span className="text-primary font-label text-[10px] uppercase font-bold tracking-widest">
        Done
      </span>
    </button>
  )
})
