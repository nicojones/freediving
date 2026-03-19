import { memo } from 'react'
import { formatDuration } from '../utils/formatDuration'
import {
  getSessionDurationMinutes,
  getLongestHoldSeconds,
  getRecoveryDurationSeconds,
} from '../utils/sessionStats'
import type { Phase } from '../types/plan'

interface SessionPreviewStatsProps {
  phases: Phase[]
}

export const SessionPreviewStats = memo(function SessionPreviewStats({
  phases,
}: SessionPreviewStatsProps) {
  const totalMinutes = getSessionDurationMinutes(phases)
  const longestHold = getLongestHoldSeconds(phases)
  const recoveryDuration = getRecoveryDurationSeconds(phases)

  return (
    <section className="grid grid-cols-2 gap-4 mb-12">
      <div className="col-span-2 bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-40 relative overflow-hidden group">
        <div className="relative z-10">
          <span className="text-on-surface-variant font-label text-xs uppercase tracking-[0.2em]">
            Total Time
          </span>
          <div className="text-primary font-headline text-5xl font-extrabold mt-2">
            {totalMinutes}m
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
          <span className="material-symbols-outlined text-[120px]">timer</span>
        </div>
      </div>
      <div className="bg-surface-container-low p-5 rounded-xl">
        <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
          Longest Hold
        </span>
        <div className="text-on-surface font-headline text-2xl font-bold">
          {formatDuration(longestHold)}
        </div>
      </div>
      <div className="bg-surface-container-low p-5 rounded-xl">
        <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-2">
          Recovery
        </span>
        <div className="text-secondary font-headline text-2xl font-bold">
          {formatDuration(recoveryDuration)}
        </div>
      </div>
    </section>
  )
})
