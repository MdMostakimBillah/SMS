import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prefetchAllRoutes } from './prefetchRoutes'

describe('prefetchRoutes utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('runs without throwing errors when invoked', () => {
    expect(() => prefetchAllRoutes()).not.toThrow()
  })

  it('is safe to call multiple times (idempotent)', () => {
    expect(() => {
      prefetchAllRoutes()
      prefetchAllRoutes()
    }).not.toThrow()
  })
})
