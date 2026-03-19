import { memo } from 'react'

interface LockedDayCardProps {
  dayIndex: number
  summary: string
}

export const LockedDayCard = memo(function LockedDayCard({
  dayIndex,
  summary,
}: LockedDayCardProps) {
  return (
    <div className="bg-surface-container-low/50 rounded-3xl p-6 flex items-center justify-between opacity-50">
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
    </div>
  )
})
