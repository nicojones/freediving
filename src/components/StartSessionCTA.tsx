import { memo } from 'react'
import { PrimaryButton } from './PrimaryButton'

interface StartSessionCTAProps {
  onStart: () => void
  loading?: boolean
}

export const StartSessionCTA = memo(function StartSessionCTA({
  onStart,
  loading = false,
}: StartSessionCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent pt-12 pb-8 px-6 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <PrimaryButton
          onClick={onStart}
          disabled={loading}
          loading={loading}
          icon="play_arrow"
        >
          {loading ? 'Loading…' : 'Start Session'}
        </PrimaryButton>
      </div>
    </div>
  )
})
