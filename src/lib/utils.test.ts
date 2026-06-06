import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('combines class names', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles falsy values', () => {
    expect(cn('text-red', false && 'text-blue', null, undefined, '')).toBe('text-red')
  })

  it('merges Tailwind conflicts', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('deduplicates classes', () => {
    expect(cn('p-2', 'p-2')).toBe('p-2')
  })
})
