import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PrimaryButton } from './PrimaryButton'

describe('PrimaryButton', () => {
  it('renders label', () => {
    render(<PrimaryButton>Start</PrimaryButton>)
    expect(screen.getByTestId('primary-button')).toHaveTextContent('Start')
  })
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<PrimaryButton onClick={onClick}>Start</PrimaryButton>)
    fireEvent.click(screen.getByTestId('primary-button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('is disabled when disabled prop', () => {
    render(<PrimaryButton disabled>Start</PrimaryButton>)
    expect(screen.getByTestId('primary-button')).toBeDisabled()
  })
  it('is disabled when loading', () => {
    render(<PrimaryButton loading>Start</PrimaryButton>)
    expect(screen.getByTestId('primary-button')).toBeDisabled()
    expect(screen.getByTestId('primary-button')).toHaveTextContent('Loading')
  })
})
