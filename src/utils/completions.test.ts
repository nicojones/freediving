import { describe, expect, it } from 'vitest'
import { hasCompletedToday, isDayCompleted } from './completions'

describe('completions', () => {
  describe('hasCompletedToday', () => {
    it('returns true when any completion is today', () => {
      const now = new Date()
      const todaySeconds = Math.floor(now.getTime() / 1000)
      const completions = [{ completed_at: todaySeconds }]
      expect(hasCompletedToday(completions)).toBe(true)
    })
    it('returns false when no completions today', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdaySeconds = Math.floor(yesterday.getTime() / 1000)
      const completions = [{ completed_at: yesterdaySeconds }]
      expect(hasCompletedToday(completions)).toBe(false)
    })
    it('returns false for empty completions', () => {
      expect(hasCompletedToday([])).toBe(false)
    })
  })

  describe('isDayCompleted', () => {
    it('returns true when day is completed', () => {
      const completions = [{ day_id: 'day-1' }]
      expect(isDayCompleted(completions, 'day-1')).toBe(true)
    })
    it('is case-insensitive', () => {
      const completions = [{ day_id: 'Day-1' }]
      expect(isDayCompleted(completions, 'day-1')).toBe(true)
      expect(isDayCompleted(completions, 'DAY-1')).toBe(true)
    })
    it('returns false when day not completed', () => {
      const completions = [{ day_id: 'day-1' }]
      expect(isDayCompleted(completions, 'day-2')).toBe(false)
    })
    it('returns false for undefined dayId', () => {
      expect(isDayCompleted([{ day_id: 'day-1' }], undefined)).toBe(false)
    })
  })
})
