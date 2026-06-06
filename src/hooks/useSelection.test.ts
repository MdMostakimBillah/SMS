import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSelection } from './useSelection'

describe('useSelection', () => {
  it('initializes with empty selection', () => {
    const { result } = renderHook(() => useSelection())
    expect(result.current.selected).toEqual([])
  })

  it('toggle adds id to selection', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.toggle('a'))
    expect(result.current.selected).toEqual(['a'])
  })

  it('toggle removes id from selection', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.toggle('a'))
    act(() => result.current.toggle('a'))
    expect(result.current.selected).toEqual([])
  })

  it('toggleAll selects all when none selected', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.toggleAll(['a', 'b', 'c']))
    expect(result.current.selected).toEqual(['a', 'b', 'c'])
  })

  it('toggleAll clears all when all selected', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.toggleAll(['a', 'b', 'c']))
    act(() => result.current.toggleAll(['a', 'b', 'c']))
    expect(result.current.selected).toEqual([])
  })

  it('isSelected returns true for selected id', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.toggle('a'))
    expect(result.current.isSelected('a')).toBe(true)
    expect(result.current.isSelected('b')).toBe(false)
  })

  it('clear resets selection', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.toggle('a'))
    act(() => result.current.toggle('b'))
    act(() => result.current.clear())
    expect(result.current.selected).toEqual([])
  })

  it('setSelected sets directly', () => {
    const { result } = renderHook(() => useSelection())
    act(() => result.current.setSelected(['x', 'y']))
    expect(result.current.selected).toEqual(['x', 'y'])
  })
})
