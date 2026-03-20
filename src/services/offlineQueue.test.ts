import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queueCompletion, flushQueue, clearByPlanId, getPendingCount } from './offlineQueue'

describe('offlineQueue', () => {
  beforeEach(async () => {
    vi.stubGlobal('fetch', vi.fn())
    await clearByPlanId('default')
    await clearByPlanId('other')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('queueCompletion', () => {
    it('adds completion to queue', async () => {
      await queueCompletion('default', 'day-1')
      const count = await getPendingCount()
      expect(count).toBe(1)
    })
  })

  describe('flushQueue', () => {
    it('syncs queued completions when fetch succeeds', async () => {
      await queueCompletion('default', 'day-1')
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
      const result = await flushQueue()
      expect(result.synced).toBe(1)
      expect(result.failed).toBe(0)
    })
    it('reports failed when fetch fails', async () => {
      await queueCompletion('default', 'day-1')
      vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
      const result = await flushQueue()
      expect(result.failed).toBe(1)
    })
  })

  describe('clearByPlanId', () => {
    it('removes completions for plan', async () => {
      await queueCompletion('default', 'day-1')
      await queueCompletion('other', 'day-2')
      const removed = await clearByPlanId('default')
      expect(removed).toBe(1)
      const count = await getPendingCount()
      expect(count).toBe(1)
    })
  })
})
