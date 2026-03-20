import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DevModeSection } from './DevModeSection'

describe('DevModeSection', () => {
  it('renders dev mode toggle for any user', () => {
    render(<DevModeSection />)
    expect(screen.getByTestId('dev-mode-section')).toBeInTheDocument()
    expect(screen.getByTestId('dev-mode-toggle')).toBeInTheDocument()
    expect(screen.getByText(/show test controls on session preview/i)).toBeInTheDocument()
  })
})
