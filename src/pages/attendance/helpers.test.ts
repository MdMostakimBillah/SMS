import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { today, twentyDaysAgo, toBnNum, getDaysBetween, shortDate, dayName, isFriday, setGlobalBn } from './helpers'

describe('attendance helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('today returns YYYY-MM-DD format', () => {
    expect(today()).toBe('2026-06-06')
  })

  it('twentyDaysAgo returns 20 days before today', () => {
    expect(twentyDaysAgo()).toBe('2026-05-17')
  })

  it('toBnNum converts digits to Bengali', () => {
    expect(toBnNum(0)).toBe('০')
    expect(toBnNum(123)).toBe('১২৩')
    expect(toBnNum(4567)).toBe('৪৫৬৭')
    expect(toBnNum(10)).toBe('১০')
  })

  it('getDaysBetween returns inclusive range', () => {
    const days = getDaysBetween('2026-06-01', '2026-06-03')
    expect(days).toEqual(['2026-06-01', '2026-06-02', '2026-06-03'])
  })

  it('getDaysBetween returns single day for same date', () => {
    const days = getDaysBetween('2026-06-01', '2026-06-01')
    expect(days).toEqual(['2026-06-01'])
  })

  it('shortDate returns MM-DD portion', () => {
    expect(shortDate('2026-06-05')).toBe('06-05')
    expect(shortDate('2026-12-25')).toBe('12-25')
  })

  it('dayName returns weekday abbreviation', () => {
    expect(dayName('2026-06-08')).toBe('Mon')
    expect(dayName('2026-06-09')).toBe('Tue')
  })

  it('dayName returns Bengali Friday text when isBnGlobal', () => {
    setGlobalBn(true)
    expect(dayName('2026-06-05')).toBe('সাপ্তাহিক ছুটি')
    setGlobalBn(false)
  })

  it('dayName returns "Fri" for Friday when not Bengali', () => {
    setGlobalBn(false)
    expect(dayName('2026-06-05')).toBe('Fri')
  })

  it('isFriday returns true for Friday', () => {
    expect(isFriday('2026-06-05')).toBe(true)
  })

  it('isFriday returns false for non-Friday', () => {
    expect(isFriday('2026-06-06')).toBe(false)
    expect(isFriday('2026-06-08')).toBe(false)
  })

  it('setGlobalBn toggles Bengali mode', () => {
    setGlobalBn(true)
    expect(dayName('2026-06-05')).toBe('সাপ্তাহিক ছুটি')
    setGlobalBn(false)
    expect(dayName('2026-06-05')).toBe('Fri')
  })
})
