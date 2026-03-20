import type { MouseEvent } from 'react'
import { memo } from 'react'
import { PrimaryButton } from '../ui/PrimaryButton'
import { pluralizeHolds } from '../../utils/phaseLabels'

interface CurrentDayTrainingCardProps {
  dayIndex: number
  dayId: string
  summary: string
  duration: number
  holdCount: number
  onSelect: () => void
}

export const CurrentDayTrainingCard = memo(function CurrentDayTrainingCard({
  dayIndex,
  dayId,
  summary,
  duration,
  holdCount,
  onSelect,
}: CurrentDayTrainingCardProps) {
  return (
    <div
      data-testid={`day-card-${dayId}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className="relative group w-full text-left cursor-pointer"
    >
      <div className="absolute -inset-1 bg-primary/10 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition duration-1000" />
      <div className="relative bg-surface-container-high border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-primary/20 text-primary font-label text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest mb-3 inline-block">
                Current
              </span>
              <h3 className="font-headline font-bold text-3xl text-on-surface">
                Day {dayIndex + 1}
              </h3>
              <p className="font-body text-sm text-on-surface-variant mt-1">
                {summary} • {holdCount} {pluralizeHolds(holdCount)}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-secondary font-headline text-2xl font-bold">
                {duration}:00
              </span>
              <span className="text-on-surface-variant text-[10px] font-label uppercase tracking-widest">
                Est. Duration
              </span>
            </div>
          </div>
          <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary w-0 rounded-full" />
          </div>
          <PrimaryButton
            onClick={(e?: MouseEvent) => {
              e?.stopPropagation()
              onSelect()
            }}
            icon="play_arrow"
          >
            Start Session
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
})
