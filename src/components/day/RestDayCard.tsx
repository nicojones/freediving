import { memo } from 'react'
import { BackButton } from '../ui/BackButton'

interface RestDayCardProps {
  dayIndex: number
  isCompleted: boolean
  onBack: () => void
}

export const RestDayCard = memo(function RestDayCard({
  dayIndex,
  isCompleted,
  onBack,
}: RestDayCardProps) {
  return (
    <div className="mt-10 bg-surface-container-low rounded-3xl p-6 overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <BackButton onClick={onBack} />
      </div>
      <section>
        <h1 className="font-headline text-[3.5rem] leading-[1.1] font-bold tracking-tight text-on-surface mb-2">
          Day {dayIndex + 1}: Rest
        </h1>
        <p className="text-on-surface-variant text-lg tracking-wide font-medium">
          Recovery and light activity
        </p>
        {isCompleted && (
          <div className="mt-6 flex items-center gap-3 text-primary">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="font-label font-semibold uppercase tracking-wider">
              Done
            </span>
          </div>
        )}
      </section>
    </div>
  )
})
