import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBn } from './useBn'
import { useAppStore } from '@/store/appStore'

describe('useBn', () => {
  beforeEach(() => {
    useAppStore.setState({ language: 'bn' })
  })

  it('returns true for Bengali', () => {
    const { result } = renderHook(() => useBn())
    expect(result.current).toBe(true)
  })

  it('returns false for English', () => {
    useAppStore.setState({ language: 'en' })
    const { result } = renderHook(() => useBn())
    expect(result.current).toBe(false)
  })
})
