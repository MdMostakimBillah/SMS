import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWindowSize } from './useWindowSize'

describe('useWindowSize', () => {
  it('returns current window dimensions', () => {
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.width).toBe(window.innerWidth)
    expect(result.current.height).toBe(window.innerHeight)
  })

  it('computes isMobile for width < 768', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('computes isTablet for 768 <= width < 1024', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true })
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })

  it('computes isDesktop for width >= 1024', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
  })

  it('updates on resize', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 400, writable: true })
    const { result } = renderHook(() => useWindowSize())
    expect(result.current.isMobile).toBe(true)

    act(() => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.width).toBe(1200)
    expect(result.current.isDesktop).toBe(true)
  })
})
