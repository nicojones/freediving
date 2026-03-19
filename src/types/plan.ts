/** One hold/recovery cycle */
export interface Interval {
  holdSeconds: number
  recoverySeconds: number
}

/** Training day with intervals; type defaults to "dry" if omitted */
export interface TrainingDay {
  intervals: Interval[]
  type?: 'dry' | 'wet'
}

/** Rest day */
export interface RestDay {
  rest: true
}

/** A day in the plan: training, rest, or null */
export type PlanDay = TrainingDay | RestDay | null

/** Plan: array of days; index = day number (0-based) */
export type Plan = PlanDay[]
