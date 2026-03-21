import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResetProgressSection } from './ResetProgressSection';

describe('ResetProgressSection', () => {
  it('renders reset button', () => {
    render(<ResetProgressSection onRequestReset={() => {}} />);
    expect(screen.getByTestId('reset-progress-button')).toBeInTheDocument();
  });

  it('calls onRequestReset when button is clicked', async () => {
    const onRequestReset = vi.fn();
    render(<ResetProgressSection onRequestReset={onRequestReset} />);
    fireEvent.click(screen.getByTestId('reset-progress-button'));
    expect(onRequestReset).toHaveBeenCalledTimes(1);
  });

  it('shows plan name when provided', () => {
    render(<ResetProgressSection onRequestReset={() => {}} planName="Week 1" />);
    expect(screen.getByText(/Clear all completed days for "Week 1"/)).toBeInTheDocument();
  });

  it('shows "the current plan" when plan name is not provided', () => {
    render(<ResetProgressSection onRequestReset={() => {}} />);
    expect(screen.getByText(/Clear all completed days for the current plan/)).toBeInTheDocument();
  });
});
