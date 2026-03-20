import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
