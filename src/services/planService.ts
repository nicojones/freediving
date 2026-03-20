import { isEmpty, isNil } from '../utils/lang'
import type { Plan, PlanWithMeta, Phase } from '../types/plan'
import defaultPlanData from '../data/default-plan.json'
import minimalPlanData from '../data/minimal-plan.json'

const planModules: PlanWithMeta[] = [
  defaultPlanData as PlanWithMeta,
  minimalPlanData as PlanWithMeta,
]

const RELAXATION_SECONDS = 60

/** Minimal completion shape for getCurrentDay; avoids coupling to progressService */
export type CompletionForPlan = { day_id: string; completed_at: number }

/** Returns plan days from Plan or PlanWithMeta for backward compatibility */
export function getPlanDays(plan: Plan | PlanWithMeta): Plan {
  return (Array.isArray(plan) ? plan : plan.days) as Plan
}

/**
 * Returns all available plans from bundled JSON files.
 */
export function getAvailablePlans(): PlanWithMeta[] {
  return planModules.filter(
    (p): p is PlanWithMeta => Boolean(p && 'id' in p && 'days' in p)
  )
}

/**
 * Loads a plan by id. Returns the plan or an error object if not found.
 */
export function loadPlanById(planId: string): PlanWithMeta | { error: string } {
  const plans = getAvailablePlans()
  const plan = plans.find((p) => p.id === planId)
  if (isNil(plan)) {
    return { error: `Plan not found: ${planId}` }
  }
  return plan as PlanWithMeta
}

/**
 * Loads the training plan. If planId is provided, loads that plan; otherwise loads the first available.
 * Returns PlanWithMeta or an error object if loading fails.
 */
export async function loadPlan(planId?: string): Promise<PlanWithMeta | { error: string }> {
  try {
    if (planId) {
      return loadPlanById(planId)
    }
    const plans = getAvailablePlans()
    if (isEmpty(plans)) {
      return { error: 'No plans available' }
    }
    return plans[0]
  } catch (e) {
    return {
      error: `Failed to load plan: ${e instanceof Error ? e.message : 'Unknown error'}`,
    }
  }
}

/**
 * Returns phases for a training day, or null for rest/null days or out-of-range.
 * Defensively returns null for malformed plan — does not throw.
 */
export function getPhasesForDay(plan: Plan, dayIndex: number): Phase[] | null {
  if (!Array.isArray(plan) || dayIndex < 0 || dayIndex >= plan.length) {
    return null
  }
  const day = plan[dayIndex]
  if (day == null || (typeof day === 'object' && 'rest' in day && day.rest)) {
    return null
  }
  if (
    typeof day === 'object' &&
    'phases' in day &&
    Array.isArray(day.phases)
  ) {
    return day.phases
  }
  return null
}

/**
 * Returns the day id at the given index, or null if missing/invalid.
 */
export function getDayId(plan: Plan, dayIndex: number): string | null {
  if (!Array.isArray(plan) || dayIndex < 0 || dayIndex >= plan.length) {return null}
  const day = plan[dayIndex]
  if (day == null || typeof day !== 'object' || !('id' in day)) {return null}
  return (day as { id: string }).id
}

/**
 * Returns the day object for a given id, or null. Case-insensitive for URLs.
 */
export function getDayById(plan: Plan, dayId: string): (typeof plan)[number] | null {
  if (!Array.isArray(plan) || !dayId) {return null}
  const lower = dayId.toLowerCase()
  const day = plan.find((d) => d != null && 'id' in d && (d as { id: string }).id.toLowerCase() === lower)
  return day ?? null
}

/**
 * Returns the index of the day with the given id, or null.
 */
export function getDayIndexById(plan: Plan, dayId: string): number | null {
  if (!Array.isArray(plan) || !dayId) {return null}
  const lower = dayId.toLowerCase()
  const idx = plan.findIndex((d) => d != null && 'id' in d && (d as { id: string }).id.toLowerCase() === lower)
  return idx >= 0 ? idx : null
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
  if (!Array.isArray(plan) || isEmpty(plan)) {return null}

  let lastCompletedDayIndex = -1
  if (completions.length > 0) {
    const sorted = [...completions].sort((a, b) => b.completed_at - a.completed_at)
    const lastId = sorted[0].day_id
    const idx = getDayIndexById(plan, lastId)
    lastCompletedDayIndex = idx ?? -1
  }

  const nextDayIndex = lastCompletedDayIndex + 1
  if (nextDayIndex >= plan.length) {return null}

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
    while (idx < plan.length && getPhasesForDay(plan, idx) === null) {
      const restDayDate = lastDate ? new Date(lastDate) : null
      if (restDayDate) {restDayDate.setDate(restDayDate.getDate() + 1)}
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
    if (getPhasesForDay(plan, i) !== null) {return i}
  }
  return null
}

/**
 * Computes total session duration in seconds (relaxation + all phases).
 */
export function computeSessionDurationSeconds(phases: Phase[]): number {
  let total = RELAXATION_SECONDS
  for (const p of phases) {
    total += p.duration
  }
  return total
}

/**
 * Returns a short summary for a day: "Rest" or "X cycle(s)".
 */
export function getDaySummary(plan: Plan, dayIndex: number): string {
  const phases = getPhasesForDay(plan, dayIndex)
  if (phases === null) {return 'Rest'}
  const holdCount = phases.filter((p) => p.type === 'hold').length
  return holdCount === 1 ? '1 cycle' : `${holdCount} cycles`
}
