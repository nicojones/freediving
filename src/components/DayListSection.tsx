import type { Plan } from '../types/plan'
import { getDayId } from '../services/planService'
import { isDayCompleted } from '../utils/completions'
import { TrainingDayCard } from './TrainingDayCard'

interface DayListSectionProps {
  plan: Plan
  completions: { day_id: string }[]
  currentDayIndex: number | null
  onSelectDay: (index: number) => void
}

export function DayListSection({
  plan,
  completions,
  currentDayIndex,
  onSelectDay,
}: DayListSectionProps) {
  return (
    <>
      <section className="mb-12">
        <h1 className="font-headline text-[2.5rem] font-extrabold tracking-tight leading-none mb-2">
          Training
        </h1>
        <p className="text-on-surface-variant font-body text-sm max-w-[80%]">
          Focus on rhythmic breathing and peripheral relaxation during the peak
          CO2 phases.
        </p>
      </section>

      <div data-testid="dashboard-day-list" className="flex flex-col gap-6">
        {plan.map((_, i) => (
          <TrainingDayCard
            key={i}
            plan={plan}
            dayIndex={i}
            dayId={getDayId(plan, i) ?? `day-${i}`}
            isCurrent={currentDayIndex === i}
            isCompleted={isDayCompleted(completions, getDayId(plan, i) ?? undefined)}
            onSelect={() => onSelectDay(i)}
          />
        ))}
      </div>
    </>
  )
}
