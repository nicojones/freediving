import { buildSessionTimeline } from '../utils/buildSessionTimeline'
import { formatDuration } from '../utils/formatDuration'
import type { Phase } from '../types/plan'

interface SessionBreakdownProps {
  phases: Phase[]
}

export function SessionBreakdown({ phases }: SessionBreakdownProps) {
  const timeline = buildSessionTimeline(phases)

  return (
    <section className="mb-32">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-on-surface font-headline text-xl font-bold">
          Session Breakdown
        </h3>
        <span className="text-on-surface-variant font-label text-xs">
          {timeline.length} Phases
        </span>
      </div>
      <div className="space-y-4">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative pl-8 group">
            <div
              className={`absolute left-[7px] top-0 bottom-0 w-[2px] bg-outline-variant/30 ${
                idx === timeline.length - 1 ? 'bg-transparent' : ''
              }`}
            />
            <div
              className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 bg-background z-10 ${
                item.type === 'hold'
                  ? item.isTargetPeak
                    ? 'border-primary'
                    : 'border-primary'
                  : 'border-secondary'
              }`}
            />
            <div
              className={`bg-surface-container-high/40 p-5 rounded-xl flex items-center justify-between transition-colors duration-400 hover:bg-surface-container-high ${
                item.type === 'hold' && 'isTargetPeak' in item && item.isTargetPeak
                  ? 'border border-primary/20 shadow-[0_0_20px_rgba(82,218,211,0.05)]'
                  : ''
              }`}
            >
              <div>
                <p
                  className={`font-headline font-bold text-lg ${
                    item.type === 'hold' ? 'text-primary' : 'text-secondary'
                  }`}
                >
                  {formatDuration(item.seconds)}{' '}
                  {item.type === 'hold' ? 'Hold' : item.label.split(' ')[0]}
                </p>
                <p className="text-on-surface-variant text-xs mt-1">
                  {item.type === 'hold'
                    ? item.isTargetPeak
                      ? 'Target Peak Effort'
                      : 'Static Apnea'
                    : item.label}
                </p>
              </div>
              <span
                className={`material-symbols-outlined ${
                  item.type === 'hold' ? 'text-primary' : 'text-secondary opacity-40'
                }`}
                style={
                  item.type === 'hold' &&
                  'isTargetPeak' in item &&
                  item.isTargetPeak
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.type === 'hold'
                  ? 'isTargetPeak' in item && item.isTargetPeak
                    ? 'stars'
                    : 'scuba_diving'
                  : 'air'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
