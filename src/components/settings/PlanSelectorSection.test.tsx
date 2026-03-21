import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanSelectorSection } from './PlanSelectorSection';

const mockPlans = [
  {
    id: 'plan-1',
    name: 'Plan A',
    description: 'Description A',
    days: [{ phases: [] }],
    created_by: undefined,
  },
  {
    id: 'plan-2',
    name: 'Plan B',
    description: 'Description B',
    days: [{ phases: [] }, { phases: [] }, { phases: [] }],
    created_by: 1,
  },
];

describe('PlanSelectorSection', () => {
  it('renders plan progress when planProgress prop is provided', () => {
    const planProgress = {
      'plan-1': { completed: 3, total: 17 },
      'plan-2': { completed: 0, total: 3 },
    };
    render(
      <PlanSelectorSection
        availablePlans={mockPlans}
        activePlanId="plan-1"
        currentUserId={1}
        onPlanChange={() => {}}
        onPlanDeleted={() => {}}
        planProgress={planProgress}
      />
    );
    expect(screen.getByTestId('plan-progress-plan-1')).toHaveTextContent('3/17 days');
    expect(screen.getByTestId('plan-progress-plan-2')).toHaveTextContent('0/3 days');
  });

  it('does not render progress when planProgress is empty', () => {
    render(
      <PlanSelectorSection
        availablePlans={mockPlans}
        activePlanId="plan-1"
        currentUserId={1}
        onPlanChange={() => {}}
        onPlanDeleted={() => {}}
      />
    );
    expect(screen.queryByTestId('plan-progress-plan-1')).not.toBeInTheDocument();
  });
});
