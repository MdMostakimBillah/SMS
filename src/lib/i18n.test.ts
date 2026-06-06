import { describe, it, expect } from 'vitest'
import { t, translations, type TranslationKey } from './i18n'

describe('i18n', () => {
  it('t returns Bengali translation', () => {
    expect(t('nav_dashboard', 'bn')).toBe('ড্যাশবোর্ড')
  })

  it('t returns English translation', () => {
    expect(t('nav_dashboard', 'en')).toBe('Dashboard')
  })

  it('t falls back to key for missing translations', () => {
    expect(t('nonexistent_key' as TranslationKey, 'bn')).toBe('nonexistent_key')
  })

  it('all English keys exist in Bengali', () => {
    const enKeys = Object.keys(translations.en)
    const bnKeys = Object.keys(translations.bn)
    const missingInBn = enKeys.filter(k => !bnKeys.includes(k))
    expect(missingInBn).toEqual([])
  })

  it('all Bengali keys exist in English', () => {
    const enKeys = Object.keys(translations.en)
    const bnKeys = Object.keys(translations.bn)
    const missingInEn = bnKeys.filter(k => !enKeys.includes(k))
    expect(missingInEn).toEqual([])
  })

  it('translations have same key count', () => {
    expect(Object.keys(translations.en).length).toBe(Object.keys(translations.bn).length)
  })
})
