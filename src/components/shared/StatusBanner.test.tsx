import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBanner } from './StatusBanner'

describe('StatusBanner', () => {
  it('renders error when progressError provided', () => {
    render(<StatusBanner progressError="Network error" />)
    const el = screen.getByTestId('status-banner-error')
    expect(el).toHaveAttribute('data-testid-value', 'Network error')
    expect(el).toHaveTextContent('Network error')
  })
  it('renders Saved when savedMessage true', () => {
    render(<StatusBanner savedMessage />)
    expect(screen.getByTestId('status-banner-saved')).toBeInTheDocument()
    expect(screen.getByTestId('status-banner-saved')).toHaveTextContent('Saved')
  })
  it('renders nothing when neither', () => {
    render(<StatusBanner />)
    expect(screen.queryByTestId('status-banner-error')).toBeNull()
    expect(screen.queryByTestId('status-banner-saved')).toBeNull()
  })
})
