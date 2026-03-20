import { memo } from 'react'
import clsx from 'clsx'
import { SPEEDS } from '../../constants/test'

interface SpeedMultiplierSelectorProps {
  value: number
  onChange: (speed: number) => void
  label?: string
}

export const SpeedMultiplierSelector = memo(function SpeedMultiplierSelector({
  value,
  onChange,
  label = 'Speed (test)',
}: SpeedMultiplierSelectorProps) {
  return (
    <section data-testid="speed-selector" className="mb-8">
      <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-[0.2em] block mb-3">
        {label}
      </span>
      <div className="flex gap-2">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            data-testid="speed-option"
            data-testid-value={String(speed)}
            type="button"
            onClick={() => onChange(speed)}
            className={clsx(
              'px-4 py-2 rounded-xl font-label font-semibold transition-colors duration-400',
              {
                'bg-primary text-on-primary': value === speed,
                'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant':
                  value !== speed,
              }
            )}
          >
            {speed}×
          </button>
        ))}
      </div>
    </section>
  )
})
