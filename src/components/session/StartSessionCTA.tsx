import { memo } from 'react'
import { PrimaryButton } from '../ui/PrimaryButton'

interface StartSessionCTAProps {
  onStart: () => void
  loading?: boolean
  disabled?: boolean
  disabledMessage?: string
}

export const StartSessionCTA = memo(function StartSessionCTA({
  onStart,
  loading = false,
  disabled = false,
  disabledMessage = "You've already trained today",
}: StartSessionCTAProps) {
  const isDisabled = loading || disabled
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-6 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        {disabled && (
          <p className="text-on-surface-variant font-body text-sm mb-3 text-center">
            {disabledMessage}
          </p>
        )}
        <PrimaryButton
          data-testid="start-session-button"
          onClick={onStart}
          disabled={isDisabled}
          loading={loading}
          icon="play_arrow"
        >
          Start Session
        </PrimaryButton>
      </div>
    </div>
  )
})
