import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export type PlanWithMeta = {
  id: string
  name: string
  description?: string
  days: unknown[]
}

function loadPlan(planId = 'default'): PlanWithMeta {
  const baseName = planId === 'default' ? 'default' : planId
  const path = join(process.cwd(), 'src', 'data', `${baseName}-plan.json`)
  if (!existsSync(path)) {
    const fallback = join(process.cwd(), 'src', 'data', 'default-plan.json')
    return JSON.parse(readFileSync(fallback, 'utf-8'))
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function getDayAtIndex(plan: PlanWithMeta, dayIndex: number): { id: string } | null {
  const days = Array.isArray(plan) ? plan : plan.days
  const day = days?.[dayIndex]
  return day != null && typeof day === 'object' && 'id' in day
    ? (day as { id: string })
    : null
}

export { loadPlan }
