import { memo } from 'react';
import clsx from 'clsx';
import { formatDuration } from '../../utils/formatDuration';
import { formatPhaseShortLabel } from '../../utils/phaseLabels';
import type { TimelineItem } from '../../utils/buildSessionTimeline';

interface PhaseBreakdownItemProps {
  item: TimelineItem;
  isLast: boolean;
}

function getPhaseItemBorderClass(item: TimelineItem): string {
  if (item.type === 'hold' && 'isTargetPeak' in item && item.isTargetPeak) {
    return 'border border-primary/20 shadow-[0_0_20px_rgba(82,218,211,0.05)]';
  }
  return '';
}

function getPhaseIcon(item: TimelineItem): string {
  if (item.type === 'hold') {
    return 'isTargetPeak' in item && item.isTargetPeak ? 'stars' : 'scuba_diving';
  }
  return 'air';
}

function getPhaseSubtitle(item: TimelineItem): string {
  if (item.type === 'hold') {
    return 'isTargetPeak' in item && item.isTargetPeak ? 'Target Peak Effort' : 'Static Apnea';
  }
  return item.label;
}

export const PhaseBreakdownItem = memo(function PhaseBreakdownItem({
  item,
  isLast,
}: PhaseBreakdownItemProps) {
  const isTargetPeak = item.type === 'hold' && 'isTargetPeak' in item && item.isTargetPeak;

  return (
    <div className="relative pl-8 group">
      <div
        className={clsx('absolute left-[7px] top-0 bottom-0 w-[2px] bg-outline-variant/30', {
          'bg-transparent': isLast,
        })}
      />
      <div
        className={clsx(
          'absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 bg-background z-10',
          { 'border-primary': item.type === 'hold', 'border-secondary': item.type !== 'hold' }
        )}
      />
      <div
        className={clsx(
          'bg-surface-container-high/40 p-5 rounded-xl flex items-center justify-between transition-colors duration-400 hover:bg-surface-container-high',
          getPhaseItemBorderClass(item)
        )}
      >
        <div>
          <p
            className={clsx('font-headline font-bold text-lg', {
              'text-primary': item.type === 'hold',
              'text-secondary': item.type !== 'hold',
            })}
          >
            {formatDuration(item.seconds)} {formatPhaseShortLabel(item)}
          </p>
          <p className="text-on-surface-variant text-xs mt-1">{getPhaseSubtitle(item)}</p>
        </div>
        <span
          className={clsx('material-symbols-outlined', {
            'text-primary': item.type === 'hold',
            'text-secondary opacity-40': item.type !== 'hold',
          })}
          style={isTargetPeak ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {getPhaseIcon(item)}
        </span>
      </div>
    </div>
  );
});
