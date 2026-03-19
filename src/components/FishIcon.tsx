interface FishIconProps {
  className?: string
  size?: number
  'aria-hidden'?: boolean
}

export function FishIcon({ className = '', size = 24, 'aria-hidden': ariaHidden }: FishIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden={ariaHidden}
      className={className}
    >
      {/* Fish swimming down: forked tail at top, head at bottom */}
      <path d="M10 4 L16 12 L22 4 Z" fill="currentColor" />
      <ellipse cx="16" cy="18" rx="7" ry="9" fill="currentColor" />
      <circle cx="17.6" cy="22.4" r="2" fill="var(--color-background)" />
    </svg>
  )
}
