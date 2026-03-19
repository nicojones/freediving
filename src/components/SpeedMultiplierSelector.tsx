import { memo } from 'react'
import clsx from 'clsx'

interface SpeedMultiplierSelectorProps {
  value: number
  onChange: (speed: number) => void
  label?: string
}

const SPEEDS = [1, 2, 5, 10, 25] as const

export const SpeedMultiplierSelector = memo(function SpeedMultiplierSelector({
  value,
  onChange,
  label = 'Speed (test)',
}: SpeedMultiplierSelectorProps) {
  return (
    <section className="mb-8">
      <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-3">
        {label}
      </span>
      <div className="flex gap-2">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => onChange(speed)}
            className={clsx(
              'px-4 py-2 rounded-xl font-label font-semibold transition-colors duration-400',
              value === speed
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            )}
          >
            {speed}×
          </button>
        ))}
      </div>
    </section>
  )
})
