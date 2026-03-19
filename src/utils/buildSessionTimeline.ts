import type { Phase } from '../types/plan'
import { RELAXATION_SECONDS } from '../types/timer'

export type TimelineItem =
  | { type: 'prepare'; seconds: number; label: string }
  | { type: 'hold'; seconds: number; label: string; isTargetPeak: boolean }

export const buildSessionTimeline = (phases: Phase[]): TimelineItem[] => {
  const holdPhases = phases.filter((p) => p.type === 'hold')
  const maxHold = holdPhases.length > 0 ? Math.max(...holdPhases.map((p) => p.duration)) : 0
  const items: TimelineItem[] = []
  items.push({
    type: 'prepare',
    seconds: RELAXATION_SECONDS,
    label: 'Relaxation',
  })
  for (const p of phases) {
    if (p.type === 'hold') {
      items.push({
        type: 'hold',
        seconds: p.duration,
        label: 'Static Apnea',
        isTargetPeak: p.duration >= maxHold && holdPhases.length > 1,
      })
    } else {
      items.push({
        type: 'prepare',
        seconds: p.duration,
        label: 'Controlled Inhalation',
      })
    }
  }
  return items
}
