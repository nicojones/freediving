import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LockedDayCard } from './LockedDayCard'

describe('LockedDayCard', () => {
  it('renders with data-testid', () => {
    render(
      <LockedDayCard dayIndex={2} dayId="day-2" summary="Rest day" />
    )
    expect(screen.getByTestId('day-card-day-2')).toBeInTheDocument()
  })

  it('renders day number', () => {
    render(
      <LockedDayCard dayIndex={4} dayId="day-4" summary="Locked" />
    )
    expect(screen.getByText('Day 5')).toBeInTheDocument()
  })

  it('renders summary', () => {
    render(
      <LockedDayCard dayIndex={0} dayId="day-0" summary="Complete previous days" />
    )
    expect(screen.getByText('Complete previous days')).toBeInTheDocument()
  })

  it('calls onSelect when clicked and onSelect is provided', async () => {
    const onSelect = vi.fn()
    render(
      <LockedDayCard
        dayIndex={2}
        dayId="day-2"
        summary="Locked"
        onSelect={onSelect}
      />
    )
    await screen.getByTestId('day-card-day-2').click()
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('renders as button when onSelect is provided', () => {
    render(
      <LockedDayCard
        dayIndex={1}
        dayId="day-1"
        summary="Preview"
        onSelect={() => {}}
      />
    )
    const card = screen.getByRole('button', { name: /preview day 2/i })
    expect(card).toBeInTheDocument()
  })
})
