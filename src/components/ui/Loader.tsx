import { memo } from 'react'
import clsx from 'clsx'

interface LoaderProps {
  /** Optional label shown below the spinner (e.g. "Loading…", "Loading plan…") */
  label?: string
  /** Size variant: sm for inline/buttons, md default, lg for prominent display */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Loader = memo(function Loader({
  label,
  size = 'md',
  className,
}: LoaderProps) {
  const iconSize = size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'
  const wrapperSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-12 h-12'
  const innerSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'

  const spinner = (
    <span
      className={clsx('flex items-center justify-center', wrapperSize)}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <span
        className={clsx(
          'animate-spin text-primary/70 flex items-center justify-center',
          innerSize
        )}
      >
        <span className={clsx('material-symbols-outlined', iconSize)}>progress_activity</span>
      </span>
    </span>
  )

  if (label) {
    return (
      <span className={clsx('flex flex-col items-center gap-2', className)}>
        {spinner}
        <p className="text-on-surface-variant font-body text-sm">{label}</p>
      </span>
    )
  }
  return <span className={clsx('inline-flex items-center justify-center', className)}>{spinner}</span>
})
