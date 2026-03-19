import type { Plan, Interval } from '../types/plan'
import defaultPlan from '../data/default-plan.json'

const RELAXATION_SECONDS = 60

/** Minimal completion shape for getCurrentDay; avoids coupling to progressService */
export type CompletionForPlan = { day_index: number; completed_at: number }

/**
 * Loads the training plan from JSON.
 * Returns the plan or an error object if loading fails.
 */
export async function loadPlan(): Promise<Plan | { error: string }> {
  try {
    const result = defaultPlan as unknown
    if (!Array.isArray(result)) {
      return { error: 'Invalid plan: expected array of days' }
    }
    return result as Plan
  } catch (e) {
    return {
      error: `Failed to load plan: ${e instanceof Error ? e.message : 'Unknown error'}`,
    }
  }
}

/**
 * Returns intervals for a training day, or null for rest/null days or out-of-range.
 * Defensively returns null for malformed plan — does not throw.
 */
export function getIntervalsForDay(plan: Plan, dayIndex: number): Interval[] | null {
  if (!Array.isArray(plan) || dayIndex < 0 || dayIndex >= plan.length) {
    return null
  }
  const day = plan[dayIndex]
  if (day == null || (typeof day === 'object' && 'rest' in day && day.rest)) {
    return null
  }
  if (
    typeof day === 'object' &&
    'intervals' in day &&
    Array.isArray(day.intervals)
  ) {
    return day.intervals
  }
  return null
}

/**
 * Returns the current day index (next to do), or null if all days complete.
 * On track (trained yesterday or today): next day in sequence, including rest.
 * Behind (last completion 2+ days ago): skip rest days, return first training day.
 */
export function getCurrentDay(
  plan: Plan,
  completions: CompletionForPlan[]
): number | null {
  if (!Array.isArray(plan) || plan.length === 0) return null

  let lastCompletedDayIndex = -1
  if (completions.length > 0) {
    const sorted = [...completions].sort((a, b) => b.completed_at - a.completed_at)
    lastCompletedDayIndex = sorted[0].day_index
  }

  let nextDayIndex = lastCompletedDayIndex + 1
  if (nextDayIndex >= plan.length) return null

  const lastDate =
    completions.length > 0
      ? new Date(
          [...completions].sort((a, b) => b.completed_at - a.completed_at)[0]
            .completed_at
        )
      : null
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isOnTrack =
    !lastDate ||
    lastDate.toDateString() === today.toDateString() ||
    lastDate.toDateString() === yesterday.toDateString()

  if (isOnTrack) {
    // If next day is a rest day and we're past that day (viewing app after the rest day),
    // assume user took the rest and advance to the next day
    let idx = nextDayIndex
    while (idx < plan.length && getIntervalsForDay(plan, idx) === null) {
      const restDayDate = lastDate ? new Date(lastDate) : null
      if (restDayDate) restDayDate.setDate(restDayDate.getDate() + 1)
      const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const restNorm = restDayDate
        ? new Date(restDayDate.getFullYear(), restDayDate.getMonth(), restDayDate.getDate())
        : null
      if (restNorm && todayNorm.getTime() > restNorm.getTime()) {
        idx++
      } else {
        break
      }
    }
    return idx < plan.length ? idx : null
  }

  // Behind: skip rest days, return first training day
  for (let i = nextDayIndex; i < plan.length; i++) {
    if (getIntervalsForDay(plan, i) !== null) return i
  }
  return null
}

/**
 * Computes total session duration in seconds (relaxation + holds + recoveries).
 * No recovery after the last hold.
 */
export function computeSessionDurationSeconds(intervals: Interval[]): number {
  let total = RELAXATION_SECONDS
  for (let i = 0; i < intervals.length; i++) {
    total += intervals[i].holdSeconds
    if (i < intervals.length - 1) total += intervals[i].recoverySeconds
  }
  return total
}

/**
 * Returns a short summary for a day: "Rest" or "X cycle(s)".
 */
export function getDaySummary(plan: Plan, dayIndex: number): string {
  const intervals = getIntervalsForDay(plan, dayIndex)
  if (intervals === null) return 'Rest'
  const n = intervals.length
  return n === 1 ? '1 cycle' : `${n} cycles`
}
