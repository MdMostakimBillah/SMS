const STORAGE_PREFIX = 'edutech'

function getSlug(): string | null {
  try {
    return sessionStorage.getItem('edutech_inst_slug')
  } catch {
    return null
  }
}

export function getStorageKey(base: string): string {
  const slug = getSlug()
  return slug ? `${base}_${slug}` : base
}

export function nsKey(key: string): string {
  const slug = getSlug()
  return slug ? `${STORAGE_PREFIX}_${key}_${slug}` : `${STORAGE_PREFIX}_${key}`
}

export function nsGet(key: string): string | null {
  try {
    return localStorage.getItem(nsKey(key))
  } catch {
    return null
  }
}

export function nsSet(key: string, value: string): void {
  try {
    localStorage.setItem(nsKey(key), value)
  } catch { /* ignore */ }
}

export function nsRemove(key: string): void {
  try {
    localStorage.removeItem(nsKey(key))
  } catch { /* ignore */ }
}

export function migrateOldKeys(slug: string): void {
  const oldKeys = ['edutech_user', 'edutech_institutionId', 'edutech_institutionSubdomain']
  oldKeys.forEach((key) => {
    const oldVal = localStorage.getItem(key)
    if (oldVal) {
      const newKey = `${STORAGE_PREFIX}_${key}_${slug}`
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldVal)
      }
      localStorage.removeItem(key)
    }
  })
}

const INSTITUTION_STORE_KEYS = [
  'edutech-classes', 'edutech-teachers', 'edutech-exams', 'edutech-syllabus',
  'edutech-online', 'edutech-assignments', 'edutech-admissions', 'edutech-fees',
  'edutech-hr', 'edutech-todos',
]

export function cleanupOrphanedBaseKeys(): void {
  INSTITUTION_STORE_KEYS.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key)
    }
  })
}

import type { PersistStorage, StorageValue } from 'zustand/middleware/persist'

export function createNamespacedStorage<T>(base: string): PersistStorage<T> {
  function resolveKey(): string | null {
    const slug = getSlug()
    return slug ? `${base}_${slug}` : null
  }
  return {
    getItem: (_name: string): StorageValue<T> | null => {
      try {
        const key = resolveKey()
        if (!key) return null
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as StorageValue<T>) : null
      } catch { return null }
    },
    setItem: (_name: string, value: StorageValue<T>): void => {
      try {
        const key = resolveKey()
        if (!key) return
        localStorage.setItem(key, JSON.stringify(value))
      } catch { /* ignore */ }
    },
    removeItem: (_name: string): void => {
      try {
        const key = resolveKey()
        if (!key) return
        localStorage.removeItem(key)
      } catch { /* ignore */ }
    },
  }
}
