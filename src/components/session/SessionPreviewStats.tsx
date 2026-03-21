import { memo } from 'react';
import { Stat } from '../ui/Stat';
import { formatDuration } from '../../utils/formatDuration';
import {
  getSessionDurationMinutes,
  getLongestHoldSeconds,
  getRecoveryDurationSeconds,
} from '../../utils/sessionStats';
import type { Phase } from '../../types/plan';

interface SessionPreviewStatsProps {
  phases: Phase[];
}

export const SessionPreviewStats = memo(function SessionPreviewStats({
  phases,
}: SessionPreviewStatsProps) {
  const totalMinutes = getSessionDurationMinutes(phases);
  const longestHold = getLongestHoldSeconds(phases);
  const recoveryDuration = getRecoveryDurationSeconds(phases);

  return (
    <section className="grid grid-cols-2 gap-4">
      <Stat
        label="Total Time"
        value={`${totalMinutes}m`}
        variant="large"
        valueClassName="text-primary"
        icon="timer"
      />
      <Stat label="Longest Hold" value={formatDuration(longestHold)} />
      <Stat
        label="Recovery"
        value={formatDuration(recoveryDuration)}
        valueClassName="text-secondary"
      />
    </section>
  );
});
