import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmPlanModal } from './ConfirmPlanModal';

const MOCK_PLAN = {
  id: 'test-plan',
  name: 'Test Plan',
  description: 'A test plan',
  days: [
    {
      id: 'd1',
      day: 1,
      phases: [
        { type: 'hold' as const, duration: 90 },
        { type: 'recovery' as const, duration: 120 },
      ],
    },
  ],
};

describe('ConfirmPlanModal', () => {
  it('renders nothing when closed', () => {
    render(
      <ConfirmPlanModal isOpen={false} onClose={() => {}} plan={MOCK_PLAN} onConfirm={() => {}} />
    );
    expect(screen.queryByTestId('confirm-plan-name')).not.toBeInTheDocument();
  });

  it('renders name and description inputs when open', () => {
    render(<ConfirmPlanModal isOpen onClose={() => {}} plan={MOCK_PLAN} onConfirm={() => {}} />);
    expect(screen.getByTestId('confirm-plan-name')).toHaveValue('Test Plan');
    expect(screen.getByTestId('confirm-plan-description')).toHaveValue('A test plan');
    expect(screen.getByTestId('confirm-plan-submit')).toBeInTheDocument();
  });

  it('calls onConfirm with edited name and description when submit clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmPlanModal isOpen onClose={() => {}} plan={MOCK_PLAN} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByTestId('confirm-plan-name'), {
      target: { value: 'Edited Name' },
    });
    fireEvent.change(screen.getByTestId('confirm-plan-description'), {
      target: { value: 'Edited description' },
    });
    fireEvent.click(screen.getByTestId('confirm-plan-submit'));
    expect(onConfirm).toHaveBeenCalledWith('Edited Name', 'Edited description');
  });

  it('calls onClose when submit clicked', async () => {
    const onClose = vi.fn();
    render(<ConfirmPlanModal isOpen onClose={onClose} plan={MOCK_PLAN} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByTestId('confirm-plan-submit'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
