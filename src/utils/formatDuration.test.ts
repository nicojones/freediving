import { describe, expect, it } from 'vitest'
import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it('formats minutes only when no seconds', () => {
    expect(formatDuration(60)).toBe('1m')
  })
  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1:30')
  })
  it('pads seconds with leading zero', () => {
    expect(formatDuration(65)).toBe('1:05')
  })
  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0m')
  })
})
