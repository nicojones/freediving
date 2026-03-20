import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDevMode } from './useDevMode'

const STORAGE_KEY = 'freediving_dev_mode'

describe('useDevMode', () => {
  let storage: Record<string, string>

  beforeEach(() => {
    storage = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value
      },
      removeItem: (key: string) => {
        delete storage[key]
      },
      clear: () => {
        storage = {}
      },
      length: 0,
      key: () => null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false by default when localStorage is empty', () => {
    const { result } = renderHook(() => useDevMode())
    expect(result.current[0]).toBe(false)
  })

  it('reads initial value from localStorage', () => {
    storage[STORAGE_KEY] = 'true'
    const { result } = renderHook(() => useDevMode())
    expect(result.current[0]).toBe(true)
  })

  it('writes to localStorage when setDevModeEnabled is called', () => {
    const { result } = renderHook(() => useDevMode())
    expect(storage[STORAGE_KEY]).toBeUndefined()

    act(() => {
      result.current[1](true)
    })
    expect(result.current[0]).toBe(true)
    expect(storage[STORAGE_KEY]).toBe('true')

    act(() => {
      result.current[1](false)
    })
    expect(result.current[0]).toBe(false)
    expect(storage[STORAGE_KEY]).toBe('false')
  })
})
