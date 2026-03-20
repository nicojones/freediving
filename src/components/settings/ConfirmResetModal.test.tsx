import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmResetModal } from './ConfirmResetModal'

describe('ConfirmResetModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmResetModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Reset"
        message="Are you sure?"
      />
    )
    expect(screen.queryByTestId('confirm-reset-input')).not.toBeInTheDocument()
  })

  it('renders input and buttons when open', () => {
    render(
      <ConfirmResetModal
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        title="Reset progress"
        message="Type reset to confirm"
      />
    )
    expect(screen.getByTestId('confirm-reset-input')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-reset-confirm')).toBeInTheDocument()
  })

  it('disables confirm until user types "reset"', () => {
    render(
      <ConfirmResetModal
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        title="Reset"
        message="Confirm"
      />
    )
    const confirmBtn = screen.getByTestId('confirm-reset-confirm')
    expect(confirmBtn).toBeDisabled()
    fireEvent.change(screen.getByTestId('confirm-reset-input'), {
      target: { value: 'reset' },
    })
    expect(confirmBtn).not.toBeDisabled()
  })

  it('calls onConfirm when user types reset and clicks confirm', async () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmResetModal
        isOpen
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Reset"
        message="Confirm"
      />
    )
    fireEvent.change(screen.getByTestId('confirm-reset-input'), {
      target: { value: 'reset' },
    })
    fireEvent.click(screen.getByTestId('confirm-reset-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
