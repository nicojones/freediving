import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { login, getCurrentUser } from './authService'

describe('authService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('login', () => {
    it('returns user on success', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, username: 'nico' } }),
      } as Response)
      const result = await login('nico', 'password')
      expect(result).toEqual({ user: { id: 1, username: 'nico' } })
    })
    it('returns error on 401', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)
      const result = await login('nico', 'wrong')
      expect(result).toEqual({ error: 'Invalid credentials' })
    })
  })

  describe('getCurrentUser', () => {
    it('returns user when authenticated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, username: 'nico' } }),
      } as Response)
      const result = await getCurrentUser()
      expect(result).toEqual({ id: 1, username: 'nico' })
    })
    it('returns null when not authenticated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
      const result = await getCurrentUser()
      expect(result).toBeNull()
    })
  })
})
