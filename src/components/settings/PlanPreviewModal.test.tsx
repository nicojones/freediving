import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanPreviewModal } from './PlanPreviewModal';

const MOCK_PLAN = {
  id: 'preview-plan',
  name: 'Preview Plan',
  description: 'Plan for preview',
  days: [
    {
      id: 'd1',
      day: 1,
      phases: [
        { type: 'hold' as const, duration: 90 },
        { type: 'recovery' as const, duration: 120 },
      ],
    },
    {
      id: 'd2',
      day: 2,
      rest: true,
    },
  ],
};

describe('PlanPreviewModal', () => {
  it('renders nothing when closed', () => {
    render(<PlanPreviewModal isOpen={false} onClose={() => {}} plan={MOCK_PLAN} />);
    expect(screen.queryByTestId('plan-preview-content')).not.toBeInTheDocument();
  });

  it('renders plan name and days when open', () => {
    render(<PlanPreviewModal isOpen onClose={() => {}} plan={MOCK_PLAN} />);
    expect(screen.getByText('Preview Plan')).toBeInTheDocument();
    expect(screen.getByText('Plan for preview')).toBeInTheDocument();
    expect(screen.getByTestId('plan-preview-content')).toBeInTheDocument();
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
  });

  it('shows rest day for day with rest: true', () => {
    render(<PlanPreviewModal isOpen onClose={() => {}} plan={MOCK_PLAN} />);
    expect(screen.getByText('Rest day')).toBeInTheDocument();
  });
});
