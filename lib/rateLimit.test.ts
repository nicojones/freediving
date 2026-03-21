import { describe, expect, it, beforeEach } from 'vitest';
import { checkLimit, recordAttempt } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    // Rate limit state is module-level; we can't reset it directly.
    // Tests assume fresh state or use unique IPs.
  });

  it('allows requests under limit', () => {
    expect(checkLimit('1.2.3.4')).toBe(true);
  });

  it('records attempts and enforces limit', () => {
    const ip = `test-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkLimit(ip)).toBe(true);
      recordAttempt(ip);
    }
    expect(checkLimit(ip)).toBe(false);
  });

  it('allows requests after limit for different IP', () => {
    const ip1 = `ip1-${Date.now()}`;
    const ip2 = `ip2-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      recordAttempt(ip1);
    }
    expect(checkLimit(ip1)).toBe(false);
    expect(checkLimit(ip2)).toBe(true);
  });
});
