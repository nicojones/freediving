import { memo } from 'react'
import { formatDuration } from '../utils/formatDuration'
import { formatPhaseShortLabel } from '../utils/phaseLabels'
import type { TimelineItem } from '../utils/buildSessionTimeline'

interface PhaseBreakdownItemProps {
  item: TimelineItem
  isLast: boolean
}

function getPhaseItemBorderClass(item: TimelineItem): string {
  if (
    item.type === 'hold' &&
    'isTargetPeak' in item &&
    item.isTargetPeak
  ) {
    return 'border border-primary/20 shadow-[0_0_20px_rgba(82,218,211,0.05)]'
  }
  return ''
}

function getPhaseIcon(item: TimelineItem): string {
  if (item.type === 'hold') {
    return 'isTargetPeak' in item && item.isTargetPeak ? 'stars' : 'scuba_diving'
  }
  return 'air'
}

function getPhaseSubtitle(item: TimelineItem): string {
  if (item.type === 'hold') {
    return 'isTargetPeak' in item && item.isTargetPeak
      ? 'Target Peak Effort'
      : 'Static Apnea'
  }
  return item.label
}

export const PhaseBreakdownItem = memo(function PhaseBreakdownItem({
  item,
  isLast,
}: PhaseBreakdownItemProps) {
  const isTargetPeak =
    item.type === 'hold' && 'isTargetPeak' in item && item.isTargetPeak

  return (
    <div className="relative pl-8 group">
      <div
        className={`absolute left-[7px] top-0 bottom-0 w-[2px] bg-outline-variant/30 ${
          isLast ? 'bg-transparent' : ''
        }`}
      />
      <div
        className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 bg-background z-10 ${
          item.type === 'hold' ? 'border-primary' : 'border-secondary'
        }`}
      />
      <div
        className={`bg-surface-container-high/40 p-5 rounded-xl flex items-center justify-between transition-colors duration-400 hover:bg-surface-container-high ${getPhaseItemBorderClass(item)}`}
      >
        <div>
          <p
            className={`font-headline font-bold text-lg ${
              item.type === 'hold' ? 'text-primary' : 'text-secondary'
            }`}
          >
            {formatDuration(item.seconds)} {formatPhaseShortLabel(item)}
          </p>
          <p className="text-on-surface-variant text-xs mt-1">
            {getPhaseSubtitle(item)}
          </p>
        </div>
        <span
          className={`material-symbols-outlined ${
            item.type === 'hold'
              ? 'text-primary'
              : 'text-secondary opacity-40'
          }`}
          style={
            isTargetPeak ? { fontVariationSettings: "'FILL' 1" } : undefined
          }
        >
          {getPhaseIcon(item)}
        </span>
      </div>
    </div>
  )
})
