import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('p-2', 'p-4')).toBe('p-2 p-4')
  })

  it('handles falsy values', () => {
    expect(cn('text-red', false && 'text-blue', null, undefined, '')).toBe('text-red')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })
})
