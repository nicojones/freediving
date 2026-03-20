import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DayListSection } from './DayListSection'

const mockPlan = [
  { phases: [{ type: 'hold', duration: 30 }] },
  { phases: [{ type: 'hold', duration: 45 }] },
]

describe('DayListSection', () => {
  it('renders day list with data-testid', () => {
    render(
      <DayListSection
        plan={mockPlan}
        completions={[]}
        currentDayIndex={0}
        onSelectDay={() => {}}
        planName="CO2 Tolerance"
      />
    )
    expect(screen.getByTestId('dashboard-day-list')).toBeInTheDocument()
  })

  it('renders plan name heading', () => {
    render(
      <DayListSection
        plan={mockPlan}
        completions={[]}
        currentDayIndex={0}
        onSelectDay={() => {}}
        planName="CO2 Tolerance"
      />
    )
    expect(screen.getByTestId('plan-name')).toHaveTextContent('CO2 Tolerance')
  })

  it('calls onSelectDay when day card is clicked', async () => {
    const onSelectDay = vi.fn()
    render(
      <DayListSection
        plan={mockPlan}
        completions={[]}
        currentDayIndex={0}
        onSelectDay={onSelectDay}
        planName="CO2 Tolerance"
      />
    )
    const dayCards = screen.getAllByTestId(/^day-card-/)
    await dayCards[0].click()
    expect(onSelectDay).toHaveBeenCalledWith(0)
  })
})
