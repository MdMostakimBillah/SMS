import { describe, expect, it } from 'vitest'
import { resolveMediaUrl } from './api'

describe('resolveMediaUrl', () => {
  it('returns empty string for null or undefined', () => {
    expect(resolveMediaUrl(null)).toBe('')
    expect(resolveMediaUrl(undefined)).toBe('')
    expect(resolveMediaUrl('')).toBe('')
  })

  it('preserves absolute URLs', () => {
    expect(resolveMediaUrl('https://pub-r2.dev/schools/1/logo.png')).toBe('https://pub-r2.dev/schools/1/logo.png')
    expect(resolveMediaUrl('http://example.com/logo.png')).toBe('http://example.com/logo.png')
  })

  it('preserves data and blob URLs', () => {
    expect(resolveMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(resolveMediaUrl('blob:http://localhost/xyz')).toBe('blob:http://localhost/xyz')
  })

  it('returns relative streaming endpoint correctly', () => {
    expect(resolveMediaUrl('/api/media/public/media-123')).toBe('/api/media/public/media-123')
  })
})
