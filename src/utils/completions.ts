/** Minimal completion shape for day checks */
export type CompletionForDay = { day_id: string }

/** Returns true if the given day has been completed */
export function isDayCompleted(
  completions: CompletionForDay[],
  dayId: string | undefined
): boolean {
  if (!dayId) return false
  return completions.some(
    (c) => c?.day_id && c.day_id.toLowerCase() === dayId.toLowerCase()
  )
}
