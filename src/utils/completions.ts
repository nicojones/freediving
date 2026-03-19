/** Minimal completion shape for day checks */
export type CompletionForDay = { day_index: number }

/** Returns true if the given day has been completed */
export function isDayCompleted(
  completions: CompletionForDay[],
  dayIndex: number
): boolean {
  return completions.some((c) => c.day_index === dayIndex)
}
