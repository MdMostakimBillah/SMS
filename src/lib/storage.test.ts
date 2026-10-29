import { beforeEach, describe, expect, it } from 'vitest'
import { withSlug, setSlug, clearSlug, getStorageKey } from './storage'

describe('withSlug', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
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

describe('setSlug and clearSlug', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('setSlug saves slug in both sessionStorage and localStorage', () => {
    setSlug('udvash')
    expect(sessionStorage.getItem('edutech_inst_slug')).toBe('udvash')
    expect(localStorage.getItem('edutech_inst_slug')).toBe('udvash')
    expect(getStorageKey('edutech-classes')).toBe('edutech-classes_udvash')
  })

  it('clearSlug clears slug from both storages', () => {
    setSlug('udvash')
    clearSlug()
    expect(sessionStorage.getItem('edutech_inst_slug')).toBeNull()
    expect(localStorage.getItem('edutech_inst_slug')).toBeNull()
  })

  it('resolves slug from localStorage if sessionStorage is empty (e.g. hard refresh)', () => {
    localStorage.setItem('edutech_inst_slug', 'udvash')
    sessionStorage.removeItem('edutech_inst_slug')
    expect(getStorageKey('edutech-classes')).toBe('edutech-classes_udvash')
    expect(sessionStorage.getItem('edutech_inst_slug')).toBe('udvash')
  })
})
