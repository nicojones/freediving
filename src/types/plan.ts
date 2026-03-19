/** One phase in a training session: hold or recovery */
export interface Phase {
  type: 'hold' | 'recovery'
  duration: number
}

/** Training day with phases (hold, recovery, hold, recovery, hold...); type defaults to "dry" if omitted */
export interface TrainingDay {
  phases: Phase[]
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
