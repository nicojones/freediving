import { memo } from 'react'
import { getHoldProgressDashArray } from '../utils/holdProgress'

interface HoldProgressRingProps {
  remainingMs: number
  holdDurationSeconds: number
  isActive: boolean
}

const CIRCLE_CX = 172
const CIRCLE_CY = 172
const CIRCLE_R = 160
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R

export const HoldProgressRing = memo(function HoldProgressRing({
  remainingMs,
  holdDurationSeconds,
  isActive,
}: HoldProgressRingProps) {
  if (!isActive || holdDurationSeconds <= 0) return null

  const strokeDasharray = getHoldProgressDashArray(
    remainingMs,
    holdDurationSeconds,
    CIRCUMFERENCE
  )

  return (
    <svg
      className="absolute inset-[-12px] w-[344px] h-[344px] rotate-[-90deg]"
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
