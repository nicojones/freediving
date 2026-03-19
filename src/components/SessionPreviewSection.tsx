import type { Phase } from '../types/plan'
import { BackButton } from './BackButton'
import { SessionBreakdown } from './SessionBreakdown'
import { SessionPreviewStats } from './SessionPreviewStats'
import { SpeedMultiplierSelector } from './SpeedMultiplierSelector'
import { StartSessionCTA } from './StartSessionCTA'

interface SessionPreviewSectionProps {
  selectedDayIndex: number
  selectedPhases: Phase[]
  currentDayIndex: number | null
  speedMultiplier: number
  testMode: boolean
  audioLoading: boolean
  hasCompletedToday: boolean
  onBack: () => void
  onSpeedMultiplierChange: (speed: number) => void
  onTestModeChange: (v: boolean) => void
  onStartSession: () => void
}

export function SessionPreviewSection({
  selectedDayIndex,
  selectedPhases,
  currentDayIndex,
  speedMultiplier,
  testMode,
  audioLoading,
  hasCompletedToday,
  onBack,
  onSpeedMultiplierChange,
  onTestModeChange,
  onStartSession,
}: SessionPreviewSectionProps) {
  const showStartCTA =
    selectedDayIndex === currentDayIndex

  return (
    <>
      <div className="mt-0 bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={onBack} />
        </div>
        <section className="mb-0">
          <h1 className="font-headline text-[3.5rem] leading-[1.1] font-bold tracking-tight text-on-surface mb-2">
            Day {selectedDayIndex + 1}: Foundation Prep
          </h1>
          <p className="text-on-surface-variant text-lg tracking-wide font-medium">
            CO2 Tolerance Training • Level 1
          </p>
        </section>
      </div>

      <SessionPreviewStats phases={selectedPhases} />

      <SpeedMultiplierSelector
        value={speedMultiplier}
        onChange={onSpeedMultiplierChange}
      />

      <label className="flex items-center gap-3 cursor-pointer mb-4">
        <input
          type="checkbox"
          checked={testMode}
          onChange={(e) => onTestModeChange(e.target.checked)}
          className="rounded border-outline-variant bg-surface-container-low"
        />
        <span className="text-on-surface-variant font-body text-sm">
          Test mode — shorten relaxation to 3s for faster testing
        </span>
      </label>

      <SessionBreakdown phases={selectedPhases} />

      {showStartCTA && (
        <StartSessionCTA
          onStart={onStartSession}
          loading={audioLoading}
          disabled={hasCompletedToday}
          disabledMessage="You've already trained today"
        />
      )}
    </>
  )
}
