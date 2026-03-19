import type { MouseEvent } from 'react'
import type { Plan } from '../types/plan'
import {
  getIntervalsForDay,
  computeSessionDurationSeconds,
  getDaySummary,
} from '../services/planService'
import { PrimaryButton } from './PrimaryButton'

interface TrainingDayCardProps {
  plan: Plan
  dayIndex: number
  isCurrent: boolean
  isCompleted: boolean
  onSelect: () => void
}

export function TrainingDayCard({
  plan,
  dayIndex,
  isCurrent,
  isCompleted,
  onSelect,
}: TrainingDayCardProps) {
  const intervals = getIntervalsForDay(plan, dayIndex)
  const summary = getDaySummary(plan, dayIndex)
  const duration =
    intervals !== null
      ? Math.ceil(computeSessionDurationSeconds(intervals) / 60)
      : 0
  const holdCount = intervals?.length ?? 0

  if (isCurrent && intervals) {
    return (
      <button
        type="button"
        onClick={onSelect}
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
                  {summary} • {holdCount} {holdCount === 1 ? 'Hold' : 'Holds'}
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
      </button>
    )
  }

  if (isCurrent && !intervals) {
    return (
      <div className="relative group w-full text-left">
        <div className="absolute -inset-1 bg-primary/10 blur-xl rounded-full opacity-50 transition duration-1000" />
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
                  Rest day — recovery and light activity
                </p>
              </div>
              <span className="material-symbols-outlined text-secondary text-3xl">
                self_improvement
              </span>
            </div>
            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary w-0 rounded-full" />
            </div>
            <div className="h-24 w-full rounded-xl bg-secondary/20 border-2 border-secondary/30 flex items-center justify-center gap-3 pointer-events-none">
              <span className="material-symbols-outlined text-secondary">
                bed
              </span>
              <span className="text-secondary font-headline text-xl font-bold">
                Take a rest day today
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <button
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
            <p className="font-body text-xs text-on-surface-variant">
              {intervals
                ? `${duration}:00 Total • ${holdCount} ${holdCount === 1 ? 'Hold' : 'Holds'}`
                : 'Rest'}
            </p>
          </div>
        </div>
        <span className="text-primary font-label text-[10px] uppercase font-bold tracking-widest">
          Done
        </span>
      </button>
    )
  }

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
}
