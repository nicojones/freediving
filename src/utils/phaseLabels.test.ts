import { describe, expect, it } from 'vitest'
import {
  formatPhaseShortLabel,
  pluralizeHolds,
  formatPhaseDisplayName,
} from './phaseLabels'

describe('phaseLabels', () => {
  describe('formatPhaseShortLabel', () => {
    it('returns "Hold" for hold type', () => {
      expect(formatPhaseShortLabel({ type: 'hold', label: 'Static Apnea' })).toBe('Hold')
    })
    it('returns first word for non-hold', () => {
      expect(formatPhaseShortLabel({ type: 'prepare', label: 'Controlled Inhalation' })).toBe('Controlled')
    })
  })

  describe('pluralizeHolds', () => {
    it('returns "Hold" for count 1', () => {
      expect(pluralizeHolds(1)).toBe('Hold')
    })
    it('returns "Holds" for count > 1', () => {
      expect(pluralizeHolds(2)).toBe('Holds')
    })
  })

  describe('formatPhaseDisplayName', () => {
    it('returns correct labels for phases', () => {
      expect(formatPhaseDisplayName('hold')).toBe('Holding')
      expect(formatPhaseDisplayName('recovery')).toBe('Recovery')
      expect(formatPhaseDisplayName('relaxation')).toBe('Prepare')
      expect(formatPhaseDisplayName('complete')).toBe('Complete')
    })
    it('returns "Complete" for unknown', () => {
      expect(formatPhaseDisplayName(undefined)).toBe('Complete')
      expect(formatPhaseDisplayName('unknown')).toBe('Complete')
    })
  })
})
