import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  recordCompletion,
  fetchCompletions,
  resetProgress,
} from './progressService'

vi.mock('./offlineQueue', () => ({
  queueCompletion: vi.fn(),
  flushQueue: vi.fn(),
  clearByPlanId: vi.fn().mockResolvedValue(0),
}))

describe('progressService', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('recordCompletion', () => {
    it('returns ok when fetch succeeds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as Response)
      const result = await recordCompletion('default', 'day-1')
      expect(result).toEqual({ ok: true })
    })
    it('returns error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      const result = await recordCompletion('default', 'day-1')
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toContain('Network')
    })
    it('returns session expired on 401', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)
      const result = await recordCompletion('default', 'day-1')
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toContain('Session expired')
    })
  })

  describe('fetchCompletions', () => {
    it('returns completions array on success', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          completions: [{ plan_id: 'default', day_id: 'd1', completed_at: 123 }],
        }),
      } as Response)
      const result = await fetchCompletions('default')
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('day_id', 'd1')
    })
    it('returns empty array when not ok', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response)
      const result = await fetchCompletions('default')
      expect(result).toEqual([])
    })
  })

  describe('resetProgress', () => {
    it('returns ok when delete succeeds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)
      const result = await resetProgress('default')
      expect(result).toEqual({ ok: true })
    })
    it('returns session expired on 401', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)
      const result = await resetProgress('default')
      expect(result).toHaveProperty('error')
      expect((result as { error: string }).error).toContain('Session expired')
    })
  })
})
