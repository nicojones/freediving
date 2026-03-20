import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CreatePlanStatusBanner } from './CreatePlanStatusBanner';

describe('CreatePlanStatusBanner', () => {
  it('renders nothing when no error or success', () => {
    const { container } = render(<CreatePlanStatusBanner error={null} success={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message when error is set', () => {
    render(<CreatePlanStatusBanner error="Invalid JSON" success={false} />);
    expect(screen.getByTestId('create-plan-error')).toHaveTextContent('Invalid JSON');
  });

  it('renders success message when success is true', () => {
    render(<CreatePlanStatusBanner error={null} success />);
    expect(screen.getByTestId('create-plan-success')).toHaveTextContent(
      'Plan created successfully'
    );
  });

  it('prefers error over success when both are set', () => {
    render(<CreatePlanStatusBanner error="Something went wrong" success />);
    expect(screen.getByTestId('create-plan-error')).toBeInTheDocument();
    expect(screen.queryByTestId('create-plan-success')).not.toBeInTheDocument();
  });
});
