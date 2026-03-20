import { memo } from 'react'
import type { Plan } from '../../types/plan'
import { getPhasesForDay, getDaySummary } from '../../services/planService'
import { getSessionDurationMinutes } from '../../utils/sessionStats'
import { CurrentDayTrainingCard } from './CurrentDayTrainingCard'
import { CurrentDayRestCard } from './CurrentDayRestCard'
import { CompletedDayCard } from './CompletedDayCard'
import { LockedDayCard } from './LockedDayCard'

interface TrainingDayCardProps {
  plan: Plan
  dayIndex: number
  dayId: string
  isCurrent: boolean
  isCompleted: boolean
  onSelect: () => void
}

export const TrainingDayCard = memo(function TrainingDayCard({
  plan,
  dayIndex,
  dayId,
  isCurrent,
  isCompleted,
  onSelect,
}: TrainingDayCardProps) {
  const phases = getPhasesForDay(plan, dayIndex)
  const summary = getDaySummary(plan, dayIndex)
  const duration =
    phases !== null ? getSessionDurationMinutes(phases) : 0
  const holdCount = phases?.filter((p) => p.type === 'hold').length ?? 0

  if (isCurrent && phases) {
    return (
      <CurrentDayTrainingCard
        dayIndex={dayIndex}
        dayId={dayId}
        summary={summary}
        duration={duration}
        holdCount={holdCount}
        onSelect={onSelect}
      />
    )
  }

  if (isCurrent && !phases) {
    return <CurrentDayRestCard dayIndex={dayIndex} dayId={dayId} />
  }

  if (isCompleted) {
    return (
      <CompletedDayCard
        dayIndex={dayIndex}
        dayId={dayId}
        duration={duration}
        holdCount={holdCount}
        isRestDay={phases === null}
        onSelect={onSelect}
      />
    )
  }

  return (
    <LockedDayCard dayIndex={dayIndex} dayId={dayId} summary={summary} />
  )
})
