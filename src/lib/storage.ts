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

type SlugChangeCallback = (slug: string | null) => void
const slugListeners: SlugChangeCallback[] = []

export function onSlugChange(cb: SlugChangeCallback): () => void {
  slugListeners.push(cb)
  return () => {
    const idx = slugListeners.indexOf(cb)
    if (idx >= 0) slugListeners.splice(idx, 1)
  }
}

export function setSlug(slug: string): void {
  sessionStorage.setItem('edutech_inst_slug', slug)
  slugListeners.forEach((cb) => cb(slug))
  rehydrateAll()
}

export function clearSlug(): void {
  sessionStorage.removeItem('edutech_inst_slug')
  slugListeners.forEach((cb) => cb(null))
  rehydrateAll()
}

const rehydrateFns: Array<() => void> = []

export function registerStoreRehydrate(rehydrateFn: () => void): void {
  rehydrateFns.push(rehydrateFn)
}

function rehydrateAll(): void {
  rehydrateFns.forEach((fn) => fn())
}

export function createNamespacedStorage<T>(base: string): PersistStorage<T> {
  function resolveKey(slug: string | null): string | null {
    return slug ? `${base}_${slug}` : null
  }

  return {
    getItem: (_name: string): StorageValue<T> | null => {
      const slug = getSlug()
      const key = resolveKey(slug)
      if (!key) return null
      try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as StorageValue<T>) : null
      } catch { return null }
    },
    setItem: (_name: string, value: StorageValue<T>): void => {
      try {
        const slug = getSlug()
        const key = resolveKey(slug)
        if (!key) return
        localStorage.setItem(key, JSON.stringify(value))
      } catch { /* ignore */ }
    },
    removeItem: (_name: string): void => {
      try {
        const slug = getSlug()
        const key = resolveKey(slug)
        if (!key) return
        localStorage.removeItem(key)
      } catch { /* ignore */ }
    },
  }
}
