import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmSwitchPlanModal } from './ConfirmSwitchPlanModal';

describe('ConfirmSwitchPlanModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmSwitchPlanModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        planName="CO2 Tolerance"
      />
    );
    expect(screen.queryByTestId('confirm-switch-plan-modal')).not.toBeInTheDocument();
  });

  it('renders when open with planName in message', () => {
    render(
      <ConfirmSwitchPlanModal
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        planName="CO2 Tolerance"
      />
    );
    expect(screen.getByTestId('confirm-switch-plan-modal')).toBeInTheDocument();
    expect(screen.getByText(/Switch to CO2 Tolerance\?/)).toBeInTheDocument();
    expect(screen.getByText(/Your progress in both plans will be preserved/)).toBeInTheDocument();
  });

  it('Cancel calls onClose', () => {
    const onClose = vi.fn();
    render(
      <ConfirmSwitchPlanModal isOpen onClose={onClose} onConfirm={() => {}} planName="Test Plan" />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Confirm calls onConfirm and onClose', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmSwitchPlanModal isOpen onClose={onClose} onConfirm={onConfirm} planName="Test Plan" />
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('confirm-switch-plan-confirm'));
    });
    await vi.waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
