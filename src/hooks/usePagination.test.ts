import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('initializes with page 1 and default perPage', () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5]))
    expect(result.current.page).toBe(1)
    expect(result.current.perPage).toBe(20)
    expect(result.current.totalPages).toBe(1)
  })

  it('computes totalPages correctly', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.totalPages).toBe(5)
  })

  it('paginated returns correct slice', () => {
    const items = Array.from({ length: 25 }, (_, i) => i)
    const { result } = renderHook(() => usePagination(items, 10))
    expect(result.current.paginated).toHaveLength(10)
    expect(result.current.paginated[0]).toBe(0)
    expect(result.current.paginated[9]).toBe(9)
  })

  it('setPage changes page', () => {
    const items = Array.from({ length: 25 }, (_, i) => i)
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.setPage(2))
    expect(result.current.page).toBe(2)
    expect(result.current.paginated[0]).toBe(10)
  })

  it('setPerPage updates perPage and totalPages', () => {
    const items = Array.from({ length: 50 }, (_, i) => i)
    const { result } = renderHook(() => usePagination(items, 20))
    act(() => result.current.setPerPage(5))
    expect(result.current.perPage).toBe(5)
    expect(result.current.totalPages).toBe(10)
  })

  it('resetPage goes back to page 1', () => {
    const items = Array.from({ length: 30 }, (_, i) => i)
    const { result } = renderHook(() => usePagination(items, 10))
    act(() => result.current.setPage(3))
    act(() => result.current.resetPage())
    expect(result.current.page).toBe(1)
  })

  it('handles empty array', () => {
    const { result } = renderHook(() => usePagination([]))
    expect(result.current.totalPages).toBe(1)
    expect(result.current.paginated).toHaveLength(0)
  })
})
