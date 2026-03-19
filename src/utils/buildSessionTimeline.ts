import type { Interval } from '../types/plan'
import { RELAXATION_SECONDS } from '../types/timer'

export type TimelineItem =
  | { type: 'prepare'; seconds: number; label: string }
  | { type: 'hold'; seconds: number; label: string; isTargetPeak: boolean }

export const buildSessionTimeline = (intervals: Interval[]): TimelineItem[] => {
  const maxHold = Math.max(...intervals.map((i) => i.holdSeconds))
  const items: TimelineItem[] = []
  items.push({
    type: 'prepare',
    seconds: RELAXATION_SECONDS,
    label: 'Relaxation',
  })
  for (let i = 0; i < intervals.length; i++) {
    const iv = intervals[i]
    items.push({
      type: 'hold',
      seconds: iv.holdSeconds,
      label: 'Static Apnea',
      isTargetPeak: iv.holdSeconds >= maxHold && intervals.length > 1,
    })
    if (i < intervals.length - 1) {
      items.push({
        type: 'prepare',
        seconds: iv.recoverySeconds,
        label: 'Controlled Inhalation',
      })
    }
  }
  return items
}
