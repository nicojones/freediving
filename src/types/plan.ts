/** One phase in a training session: hold or recovery */
export interface Phase {
  type: 'hold' | 'recovery'
  duration: number
}

/** Training day with phases (hold, recovery, hold, recovery, hold...); type defaults to "dry" if omitted */
export interface TrainingDay {
  id: string
  day: number
  group?: string
  phases: Phase[]
  type?: 'dry' | 'wet'
}

/** Rest day */
export interface RestDay {
  id: string
  day: number
  group?: string
  rest: true
}

/** A day in the plan: training, rest, or null */
export type PlanDay = TrainingDay | RestDay | null

/** Plan: array of days; index = day number (0-based) */
export type Plan = PlanDay[]

/** Plan with metadata; new structure for multi-plan support */
export interface PlanWithMeta {
  id: string
  name: string
  description?: string
  days: PlanDay[]
  /** User id who created this plan (DB plans only); undefined for bundled plans */
  created_by?: number
}
