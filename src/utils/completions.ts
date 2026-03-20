import { isSameDay } from 'date-fns'

/** Minimal completion shape for day checks */
export type CompletionForDay = { day_id: string }

/** Shape for completed_at (Unix seconds) */
export type CompletionWithTimestamp = { completed_at: number }

/** Returns true if any completion is from today (timezone-aware) */
export function hasCompletedToday(
  completions: CompletionWithTimestamp[]
): boolean {
  const now = new Date()
  return completions.some((c) =>
    isSameDay(new Date(c.completed_at * 1000), now)
  )
}

/** Returns true if the given day has been completed */
export function isDayCompleted(
  completions: CompletionForDay[],
  dayId: string | undefined
): boolean {
  if (!dayId) {return false}
  return completions.some(
    (c) => c?.day_id && c.day_id.toLowerCase() === dayId.toLowerCase()
  )
}
