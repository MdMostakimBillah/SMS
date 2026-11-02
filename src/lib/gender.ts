/**
 * Normalized gender utility functions to handle case-insensitivity,
 * bilingual formats ('Male / পুরুষ', 'Female / মহিলা'), abbreviations ('m', 'f'),
 * and localized variations across students and teachers.
 */

export type NormalizedGender = 'male' | 'female' | 'other'

export function normalizeGender(val?: string | null): NormalizedGender | '' {
  if (!val || typeof val !== 'string') return ''
  const trimmed = val.trim().toLowerCase()
  if (!trimmed) return ''

  // Check female first so 'female' is never matched by 'male' substring
  if (
    trimmed === 'female' ||
    trimmed === 'f' ||
    trimmed.startsWith('female') ||
    trimmed.includes('female') ||
    trimmed.includes('মহিলা') ||
    trimmed.includes('মেয়ে')
  ) {
    return 'female'
  }

  if (
    trimmed === 'male' ||
    trimmed === 'm' ||
    trimmed.startsWith('male') ||
    trimmed.includes('male') ||
    trimmed.includes('পুরুষ') ||
    trimmed.includes('ছেলে')
  ) {
    return 'male'
  }

  if (trimmed === 'other' || trimmed.includes('other') || trimmed.includes('অন্যান্য')) {
    return 'other'
  }

  return 'other'
}

export function isMale(val?: string | null): boolean {
  return normalizeGender(val) === 'male'
}

export function isFemale(val?: string | null): boolean {
  return normalizeGender(val) === 'female'
}

export function matchesGender(targetGender?: string | null, filterGender?: string | null): boolean {
  if (!filterGender || !filterGender.trim()) return true
  const filterNorm = normalizeGender(filterGender)
  if (!filterNorm) return true
  const targetNorm = normalizeGender(targetGender)
  return targetNorm === filterNorm
}

export function formatGender(val?: string | null, isBn = false, isStudent = false): string {
  const norm = normalizeGender(val)
  if (norm === 'female') {
    return isBn ? (isStudent ? 'মেয়ে' : 'মহিলা') : 'Female'
  }
  if (norm === 'male') {
    return isBn ? (isStudent ? 'ছেলে' : 'পুরুষ') : 'Male'
  }
  if (norm === 'other') {
    return isBn ? 'অন্যান্য' : 'Other'
  }
  return val ? String(val).split(' / ')[0] : '—'
}

export function toStudentFormGender(val?: string | null): string {
  const norm = normalizeGender(val)
  if (norm === 'male') return 'Male / পুরুষ'
  if (norm === 'female') return 'Female / মহিলা'
  if (norm === 'other') return 'Other / অন্যান্য'
  return val || ''
}

export function toTeacherFormGender(val?: string | null): string {
  const norm = normalizeGender(val)
  if (norm === 'male') return 'Male'
  if (norm === 'female') return 'Female'
  return val || ''
}
