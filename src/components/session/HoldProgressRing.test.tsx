import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HoldProgressRing } from './HoldProgressRing'

describe('HoldProgressRing', () => {
  it('renders when active with valid duration', () => {
    render(
      <HoldProgressRing remainingMs={5000} holdDurationSeconds={10} isActive />
    )
    const ring = screen.getByTestId('hold-progress-ring')
    expect(ring).toBeInTheDocument()
    expect(ring).toHaveAttribute('data-testid-value', '5000')
  })
  it('returns null when not active', () => {
    render(
      <HoldProgressRing remainingMs={5000} holdDurationSeconds={10} isActive={false} />
    )
    expect(screen.queryByTestId('hold-progress-ring')).toBeNull()
  })
  it('returns null when holdDurationSeconds is 0', () => {
    render(
      <HoldProgressRing remainingMs={5000} holdDurationSeconds={0} isActive />
    )
    expect(screen.queryByTestId('hold-progress-ring')).toBeNull()
  })
})
