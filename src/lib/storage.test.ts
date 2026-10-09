import { beforeEach, describe, expect, it } from 'vitest'
import { withSlug } from './storage'

describe('withSlug', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('points the storage namespace at the given slug while fn runs', () => {
    withSlug('sunrise', () => {
      expect(sessionStorage.getItem('edutech_inst_slug')).toBe('sunrise')
    })
  })

  it('returns whatever fn returns', () => {
    expect(withSlug('sunrise', () => 42)).toBe(42)
  })

  it('restores the slug that was active before', () => {
    sessionStorage.setItem('edutech_inst_slug', 'previous')

    withSlug('sunrise', () => {
      /* seed the new institution */
    })

    expect(sessionStorage.getItem('edutech_inst_slug')).toBe('previous')
  })

  it('leaves no slug behind when there was none before', () => {
    withSlug('sunrise', () => {
      /* seed the new institution */
    })

    expect(sessionStorage.getItem('edutech_inst_slug')).toBeNull()
  })

  it('still restores when fn throws', () => {
    sessionStorage.setItem('edutech_inst_slug', 'previous')

    expect(() =>
      withSlug('sunrise', () => {
        throw new Error('seed failed')
      })
    ).toThrow('seed failed')

    expect(sessionStorage.getItem('edutech_inst_slug')).toBe('previous')
  })
})
