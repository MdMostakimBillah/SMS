import { describe, it, expect } from 'vitest'
import { normalizeGender, isMale, isFemale, matchesGender, formatGender, toStudentFormGender, toTeacherFormGender } from './gender'

describe('gender utility functions', () => {
  it('correctly normalizes male in various formats', () => {
    expect(normalizeGender('male')).toBe('male')
    expect(normalizeGender('Male')).toBe('male')
    expect(normalizeGender('MALE')).toBe('male')
    expect(normalizeGender('m')).toBe('male')
    expect(normalizeGender('M')).toBe('male')
    expect(normalizeGender('Male / পুরুষ')).toBe('male')
    expect(normalizeGender('পুরুষ')).toBe('male')
    expect(normalizeGender('ছেলে')).toBe('male')
  })

  it('correctly normalizes female in various formats', () => {
    expect(normalizeGender('female')).toBe('female')
    expect(normalizeGender('Female')).toBe('female')
    expect(normalizeGender('FEMALE')).toBe('female')
    expect(normalizeGender('f')).toBe('female')
    expect(normalizeGender('F')).toBe('female')
    expect(normalizeGender('Female / মহিলা')).toBe('female')
    expect(normalizeGender('মহিলা')).toBe('female')
    expect(normalizeGender('মেয়ে')).toBe('female')
  })

  it('handles null, undefined and empty values', () => {
    expect(normalizeGender(null)).toBe('')
    expect(normalizeGender(undefined)).toBe('')
    expect(normalizeGender('')).toBe('')
    expect(normalizeGender('   ')).toBe('')
  })

  it('isMale correctly identifies male and rejects female', () => {
    expect(isMale('male')).toBe(true)
    expect(isMale('Male')).toBe(true)
    expect(isMale('Male / পুরুষ')).toBe(true)
    expect(isMale('female')).toBe(false)
    expect(isMale('Female')).toBe(false)
    expect(isMale('Female / মহিলা')).toBe(false)
    expect(isMale(null)).toBe(false)
  })

  it('isFemale correctly identifies female and rejects male', () => {
    expect(isFemale('female')).toBe(true)
    expect(isFemale('Female')).toBe(true)
    expect(isFemale('Female / মহিলা')).toBe(true)
    expect(isFemale('male')).toBe(false)
    expect(isFemale('Male')).toBe(false)
    expect(isFemale('Male / পুরুষ')).toBe(false)
    expect(isFemale(null)).toBe(false)
  })

  it('matchesGender correctly matches regardless of casing or format', () => {
    // Both sides male
    expect(matchesGender('male', 'Male')).toBe(true)
    expect(matchesGender('Male', 'male')).toBe(true)
    expect(matchesGender('Male / পুরুষ', 'Male')).toBe(true)
    expect(matchesGender('male', 'Male / পুরুষ')).toBe(true)

    // Both sides female
    expect(matchesGender('female', 'Female')).toBe(true)
    expect(matchesGender('Female', 'female')).toBe(true)
    expect(matchesGender('Female / মহিলা', 'Female')).toBe(true)
    expect(matchesGender('female', 'Female / মহিলা')).toBe(true)

    // Cross matches
    expect(matchesGender('male', 'Female')).toBe(false)
    expect(matchesGender('female', 'Male')).toBe(false)

    // Empty filter matches everything
    expect(matchesGender('male', '')).toBe(true)
    expect(matchesGender('female', '')).toBe(true)
    expect(matchesGender(null, '')).toBe(true)

    // Non-empty filter with empty target does not match
    expect(matchesGender('', 'Male')).toBe(false)
    expect(matchesGender(null, 'Female')).toBe(false)
  })

  it('formatGender produces proper bilingual labels', () => {
    expect(formatGender('male', false, true)).toBe('Male')
    expect(formatGender('male', true, true)).toBe('ছেলে')
    expect(formatGender('male', true, false)).toBe('পুরুষ')

    expect(formatGender('female', false, true)).toBe('Female')
    expect(formatGender('female', true, true)).toBe('মেয়ে')
    expect(formatGender('female', true, false)).toBe('মহিলা')
  })

  it('toStudentFormGender correctly formats gender for student forms', () => {
    expect(toStudentFormGender('male')).toBe('Male / পুরুষ')
    expect(toStudentFormGender('Male')).toBe('Male / পুরুষ')
    expect(toStudentFormGender('female')).toBe('Female / মহিলা')
    expect(toStudentFormGender('Female')).toBe('Female / মহিলা')
    expect(toStudentFormGender('other')).toBe('Other / অন্যান্য')
    expect(toStudentFormGender('')).toBe('')
  })

  it('toTeacherFormGender correctly formats gender for teacher forms', () => {
    expect(toTeacherFormGender('male')).toBe('Male')
    expect(toTeacherFormGender('Male')).toBe('Male')
    expect(toTeacherFormGender('female')).toBe('Female')
    expect(toTeacherFormGender('Female')).toBe('Female')
    expect(toTeacherFormGender('')).toBe('')
  })
})
