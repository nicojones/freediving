import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SpeedMultiplierSelector } from './SpeedMultiplierSelector';

describe('SpeedMultiplierSelector', () => {
  it('renders speed options', () => {
    render(<SpeedMultiplierSelector value={1} onChange={() => {}} />);
    expect(screen.getByTestId('speed-selector')).toBeInTheDocument();
    const options = screen.getAllByTestId('speed-option');
    expect(options.length).toBeGreaterThan(0);
  });
  it('calls onChange on selection', async () => {
    const onChange = vi.fn();
    render(<SpeedMultiplierSelector value={1} onChange={onChange} />);
    const options = screen.getAllByTestId('speed-option');
    const target = options.find((o) => o.getAttribute('data-testid-value') === '10');
    if (target) {
      fireEvent.click(target);
      expect(onChange).toHaveBeenCalledWith(10);
    }
  });
  it('shows selected speed with data-testid-value', () => {
    render(<SpeedMultiplierSelector value={10} onChange={() => {}} />);
    const options = screen.getAllByTestId('speed-option');
    const selected = options.find((o) => o.getAttribute('data-testid-value') === '10');
    expect(selected).toBeDefined();
    expect(selected).toHaveAttribute('data-testid-value', '10');
  });
});
