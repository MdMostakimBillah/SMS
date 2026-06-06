import { describe, it, expect } from 'vitest'
import { sectionCls, sectionTitleCls, inputCls, selectCls, btnPrimary, btnSecondary } from './styles'

describe('styles', () => {
  it('sectionCls is a non-empty string', () => {
    expect(typeof sectionCls).toBe('string')
    expect(sectionCls.length).toBeGreaterThan(0)
  })

  it('sectionTitleCls is a non-empty string', () => {
    expect(typeof sectionTitleCls).toBe('string')
    expect(sectionTitleCls.length).toBeGreaterThan(0)
  })

  it('inputCls is a non-empty string', () => {
    expect(typeof inputCls).toBe('string')
    expect(inputCls.length).toBeGreaterThan(0)
  })

  it('selectCls is a non-empty string', () => {
    expect(typeof selectCls).toBe('string')
    expect(selectCls.length).toBeGreaterThan(0)
  })

  it('btnPrimary is a non-empty string', () => {
    expect(typeof btnPrimary).toBe('string')
    expect(btnPrimary.length).toBeGreaterThan(0)
  })

  it('btnSecondary is a non-empty string', () => {
    expect(typeof btnSecondary).toBe('string')
    expect(btnSecondary.length).toBeGreaterThan(0)
  })
})
