import { memo } from 'react'
import { getHoldProgressDashArray } from '../../utils/holdProgress'

interface HoldProgressRingProps {
  remainingMs: number
  holdDurationSeconds: number
  isActive: boolean
}

// Match ActiveSessionView: 320px container, 12px border → stroke center at 154 from center
const SIZE = 320
const BORDER = 12
const CIRCLE_CX = SIZE / 2
const CIRCLE_CY = SIZE / 2
const CIRCLE_R = SIZE / 2 - BORDER / 2 // 154 — stroke center aligns with border center
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R

export const HoldProgressRing = memo(function HoldProgressRing({
  remainingMs,
  holdDurationSeconds,
  isActive,
}: HoldProgressRingProps) {
  if (!isActive || holdDurationSeconds <= 0) {return null}

  const strokeDasharray = getHoldProgressDashArray(
    remainingMs,
    holdDurationSeconds,
    CIRCUMFERENCE
  )

  return (
    <svg
      data-testid="hold-progress-ring"
      data-testid-value={String(remainingMs)}
      className="absolute inset-0 w-[320px] h-[320px] -rotate-90"
      aria-hidden
    >
      <circle
        cx={CIRCLE_CX}
        cy={CIRCLE_CY}
        fill="transparent"
        r={CIRCLE_R}
        stroke="#52dad3"
        strokeDasharray={strokeDasharray}
        strokeDashoffset="0"
        strokeLinecap="round"
        strokeWidth="12"
      />
    </svg>
  )
})
