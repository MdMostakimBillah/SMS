import { describe, it, expect } from 'vitest'
import { numberToWords } from './numberToWords'

describe('numberToWords', () => {
  it('handles 0, null, NaN', () => {
    expect(numberToWords(0)).toBe('Zero')
    expect(numberToWords(NaN)).toBe('Zero')
  })

  it('handles small numbers', () => {
    expect(numberToWords(5)).toBe('Five')
    expect(numberToWords(15)).toBe('Fifteen')
    expect(numberToWords(25)).toBe('Twenty Five')
  })

  it('handles hundreds and thousands', () => {
    expect(numberToWords(100)).toBe('One Hundred')
    expect(numberToWords(150)).toBe('One Hundred and Fifty')
    expect(numberToWords(1500)).toBe('One Thousand Five Hundred')
    expect(numberToWords(52000)).toBe('Fifty Two Thousand')
  })
})
