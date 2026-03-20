import { describe, expect, it } from 'vitest';
import { formatMmSs } from './formatMmSs';

describe('formatMmSs', () => {
  it('formats zero', () => {
    expect(formatMmSs(0)).toBe('00:00');
  });
  it('formats seconds only', () => {
    expect(formatMmSs(5000)).toBe('00:05');
  });
  it('formats minutes and seconds', () => {
    expect(formatMmSs(125000)).toBe('02:05');
  });
  it('pads with leading zeros', () => {
    expect(formatMmSs(61000)).toBe('01:01');
  });
  it('rounds up partial seconds', () => {
    expect(formatMmSs(1500)).toBe('00:02');
  });
});
