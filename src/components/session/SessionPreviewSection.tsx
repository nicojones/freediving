import type { Phase } from '../../types/plan'
import { BackButton } from '../ui/BackButton'

/** Title-cases a string like "warm-up" → "Warm-up" */
function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}
import { SessionBreakdown } from './SessionBreakdown'
import { SessionPreviewStats } from './SessionPreviewStats'
import { SpeedMultiplierSelector } from './SpeedMultiplierSelector'
import { StartSessionCTA } from './StartSessionCTA'

interface SessionPreviewSectionProps {
  selectedDayIndex: number
  selectedPhases: Phase[]
  planName?: string
  dayGroup?: string
  currentDayIndex: number | null
  speedMultiplier: number
  testMode: boolean
  showTestControls: boolean
  audioLoading: boolean
  hasCompletedToday: boolean
  isDayCompleted: boolean
  completedAt: number | null
  onBack: () => void
  onSpeedMultiplierChange: (speed: number) => void
  onTestModeChange: (v: boolean) => void
  onStartSession: () => void
}

export function SessionPreviewSection({
  selectedDayIndex,
  selectedPhases,
  planName,
  dayGroup,
  currentDayIndex,
  speedMultiplier,
  testMode,
  showTestControls,
  audioLoading,
  hasCompletedToday,
  isDayCompleted,
  completedAt,
  onBack,
  onSpeedMultiplierChange,
  onTestModeChange,
  onStartSession,
}: SessionPreviewSectionProps) {
  const isCurrentDay = selectedDayIndex === currentDayIndex
  const isFutureDay = currentDayIndex !== null && selectedDayIndex > currentDayIndex
  const showStartCTA = isCurrentDay && !isDayCompleted
  const showCompletedCTA = isDayCompleted && completedAt != null

  return (
    <>
      <div className="mt-0 bg-surface-container-low rounded-3xl p-6 mb-8 overflow-hidden">
        <div className="flex items-center gap-4 mb-6">
          <BackButton onClick={onBack} />
        </div>
        <section className="mb-0">
          {isFutureDay && (
            <span className="bg-surface-variant/40 text-on-surface-variant font-label text-[10px] px-3 py-1 rounded-full uppercase font-black tracking-widest mb-3 inline-block">
              Preview
            </span>
          )}
          <h1 className="font-headline text-[3.5rem] leading-[1.1] font-bold tracking-tight text-on-surface mb-2">
            Day {selectedDayIndex + 1}{dayGroup ? `: ${titleCase(dayGroup)}` : ''}
          </h1>
          {planName && (
            <p className="text-on-surface-variant text-lg tracking-wide font-medium">
              {planName}
            </p>
          )}
        </section>
      </div>

      <SessionPreviewStats phases={selectedPhases} />

      {showTestControls && (
        <SpeedMultiplierSelector
          value={speedMultiplier}
          onChange={onSpeedMultiplierChange}
        />
      )}

      {showTestControls && (
        <label data-testid="test-mode-toggle" className="flex items-center gap-3 cursor-pointer mb-4">
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
      )}

      <SessionBreakdown phases={selectedPhases} />

      {showStartCTA && (
        <StartSessionCTA
          onStart={onStartSession}
          loading={audioLoading}
          disabled={hasCompletedToday}
          disabledMessage="You've already trained today"
        />
      )}

      {showCompletedCTA && (
        <StartSessionCTA
          onStart={onStartSession}
          completedAt={completedAt!}
        />
      )}
    </>
  )
}
