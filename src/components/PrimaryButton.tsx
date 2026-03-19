import { memo, type ReactNode } from 'react'
import clsx from 'clsx'

interface PrimaryButtonProps {
  children: ReactNode
  onClick?: (e?: React.MouseEvent) => void
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  size?: 'login' | 'session'
  icon?: string
  className?: string
}

export const PrimaryButton = memo(function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  size = 'session',
  icon,
  className,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        'w-full primary-pulse-gradient rounded-xl flex items-center justify-center gap-3 transition-all duration-400 active:scale-95 overflow-hidden relative shadow-[0_20px_40px_rgba(0,0,0,0.4)] font-headline font-bold text-on-primary',
        size === 'login' ? 'h-[5.5rem] text-xl' : 'h-24 text-2xl',
        { 'opacity-50 cursor-not-allowed': isDisabled },
        className
      )}
    >
      {loading ? (
        <span className="relative z-10">Loading…</span>
      ) : (
        <>
          <span className="relative z-10 tracking-wide">{children}</span>
          {icon && (
            <span
              className="material-symbols-outlined text-on-primary relative z-10"
              style={icon === 'play_arrow' ? { fontVariationSettings: "'FILL' 1" } : undefined}
              aria-hidden
            >
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  )
})
