import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionPreviewSection } from './SessionPreviewSection'

const mockPhases = [
  { type: 'prepare', duration: 60 },
  { type: 'hold', duration: 30 },
]

describe('SessionPreviewSection', () => {
  it('renders day heading', () => {
    render(
      <SessionPreviewSection
        selectedDayIndex={0}
        selectedPhases={mockPhases}
        currentDayIndex={0}
        speedMultiplier={1}
        testMode={false}
        showTestControls={true}
        audioLoading={false}
        hasCompletedToday={false}
        onBack={() => {}}
        onSpeedMultiplierChange={() => {}}
        onTestModeChange={() => {}}
        onStartSession={() => {}}
      />
    )
    expect(screen.getByRole('heading', { name: /day 1/i })).toBeInTheDocument()
  })

  it('renders start session button when current day', () => {
    render(
      <SessionPreviewSection
        selectedDayIndex={0}
        selectedPhases={mockPhases}
        currentDayIndex={0}
        speedMultiplier={1}
        testMode={false}
        showTestControls={true}
        audioLoading={false}
        hasCompletedToday={false}
        onBack={() => {}}
        onSpeedMultiplierChange={() => {}}
        onTestModeChange={() => {}}
        onStartSession={() => {}}
      />
    )
    expect(screen.getByTestId('start-session-button')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn()
    render(
      <SessionPreviewSection
        selectedDayIndex={0}
        selectedPhases={mockPhases}
        currentDayIndex={0}
        speedMultiplier={1}
        testMode={false}
        showTestControls={true}
        audioLoading={false}
        hasCompletedToday={false}
        onBack={onBack}
        onSpeedMultiplierChange={() => {}}
        onTestModeChange={() => {}}
        onStartSession={() => {}}
      />
    )
    await screen.getByRole('button', { name: /back/i }).click()
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('hides test controls (toggle and speed selector) when showTestControls is false', () => {
    render(
      <SessionPreviewSection
        selectedDayIndex={0}
        selectedPhases={mockPhases}
        currentDayIndex={0}
        speedMultiplier={1}
        testMode={true}
        showTestControls={false}
        audioLoading={false}
        hasCompletedToday={false}
        onBack={() => {}}
        onSpeedMultiplierChange={() => {}}
        onTestModeChange={() => {}}
        onStartSession={() => {}}
      />
    )
    expect(screen.queryByTestId('test-mode-toggle')).not.toBeInTheDocument()
    expect(screen.queryByTestId('speed-selector')).not.toBeInTheDocument()
  })

  it('shows test controls (toggle and speed selector) when showTestControls is true', () => {
    render(
      <SessionPreviewSection
        selectedDayIndex={0}
        selectedPhases={mockPhases}
        currentDayIndex={0}
        speedMultiplier={1}
        testMode={false}
        showTestControls={true}
        audioLoading={false}
        hasCompletedToday={false}
        onBack={() => {}}
        onSpeedMultiplierChange={() => {}}
        onTestModeChange={() => {}}
        onStartSession={() => {}}
      />
    )
    expect(screen.getByTestId('test-mode-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('speed-selector')).toBeInTheDocument()
  })
})
