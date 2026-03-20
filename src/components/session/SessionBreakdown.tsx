import { memo, useMemo } from 'react';
import { buildSessionTimeline } from '../../utils/buildSessionTimeline';
import { PhaseBreakdownItem } from './PhaseBreakdownItem';
import type { Phase } from '../../types/plan';

interface SessionBreakdownProps {
  phases: Phase[];
}

export const SessionBreakdown = memo(function SessionBreakdown({ phases }: SessionBreakdownProps) {
  const timeline = useMemo(() => buildSessionTimeline(phases), [phases]);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-on-surface font-headline text-xl font-bold">Session Breakdown</h3>
        <span className="text-on-surface-variant font-label text-xs">{timeline.length} Phases</span>
      </div>
      <div className="space-y-4">
        {timeline.map((item, idx) => (
          <PhaseBreakdownItem key={idx} item={item} isLast={idx === timeline.length - 1} />
        ))}
      </div>
    </section>
  );
});
