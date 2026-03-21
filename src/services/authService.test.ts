import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentUser, requestMagicLink } from './authService';

describe('authService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('requestMagicLink', () => {
    it('returns message on success', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Check your email' }),
      } as Response);
      const result = await requestMagicLink('test@example.com');
      expect(result).toEqual({ message: 'Check your email' });
    });
    it('returns error on 400', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid email' }),
      } as Response);
      const result = await requestMagicLink('bad');
      expect(result).toEqual({ error: 'Invalid email' });
    });
    it('returns rate limit message on 429', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);
      const result = await requestMagicLink('test@example.com');
      expect(result).toEqual({ error: 'Too many attempts. Try again later.' });
    });
  });

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, username: 'nico' } }),
      } as Response);
      const result = await getCurrentUser();
      expect(result).toEqual({ id: 1, username: 'nico' });
    });
    it('returns user with email when present', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 2, username: 'magic-user', email: 'magic@example.com' },
        }),
      } as Response);
      const result = await getCurrentUser();
      expect(result).toEqual({ id: 2, username: 'magic-user', email: 'magic@example.com' });
    });
    it('returns null when not authenticated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
      const result = await getCurrentUser();
      expect(result).toBeNull();
    });
  });
});
