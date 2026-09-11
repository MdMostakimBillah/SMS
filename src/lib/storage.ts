const STORAGE_PREFIX = 'edutech'

function getSlug(): string | null {
  try {
    return sessionStorage.getItem('edutech_inst_slug')
  } catch {
    return null
  }
}

function getUserId(): string | null {
  try {
    return sessionStorage.getItem('edutech_user_id')
  } catch {
    return null
  }
}

export function setUserId(userId: string): void {
  try {
    sessionStorage.setItem('edutech_user_id', userId)
  } catch { /* ignore */ }
}

export function clearUserId(): void {
  try {
    sessionStorage.removeItem('edutech_user_id')
  } catch { /* ignore */ }
}

export function getStorageKey(base: string): string {
  const slug = getSlug()
  const userId = getUserId()
  if (slug && userId) return `${base}_${slug}_${userId}`
  if (slug) return `${base}_${slug}`
  return base
}

export function nsKey(key: string): string {
  const slug = getSlug()
  const userId = getUserId()
  if (slug && userId) return `${STORAGE_PREFIX}_${key}_${slug}_${userId}`
  if (slug) return `${STORAGE_PREFIX}_${key}_${slug}`
  return `${STORAGE_PREFIX}_${key}`
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
  'edutech-hr', 'edutech-todos', 'edutech-store',
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

const resetFns: Array<() => void> = []
const loadFns: Array<() => void> = []

export function registerStoreReset(resetFn: () => void): void {
  resetFns.push(resetFn)
}

export function registerStoreLoad(loadFn: () => void): void {
  loadFns.push(loadFn)
}

function resetAllStores(): void {
  resetFns.forEach((fn) => fn())
}

function loadAllStores(): void {
  loadFns.forEach((fn) => fn())
}

export function setSlug(slug: string): void {
  sessionStorage.setItem('edutech_inst_slug', slug)
  slugListeners.forEach((cb) => cb(slug))
  loadAllStores()
}

export function clearSlug(): void {
  sessionStorage.removeItem('edutech_inst_slug')
  slugListeners.forEach((cb) => cb(null))
  resetAllStores()
}

export function createNamespacedStorage<T>(base: string, fallback?: string, opts?: { debounce?: boolean; perUser?: boolean }): PersistStorage<T> {
  const isPerUser = !!opts?.perUser

  function resolveKey(slug: string | null): string {
    if (isPerUser) {
      const userId = getUserId()
      if (slug && userId) return `${base}_${slug}_${userId}`
      if (slug) return `${base}_${slug}`
      return (fallback || base)
    }
    return slug ? `${base}_${slug}` : (fallback || base)
  }

  const shouldDebounce = !!opts?.debounce

  return {
    getItem: (_name: string): StorageValue<T> | null => {
      const slug = getSlug()
      const key = resolveKey(slug)
      const pending = pendingWrites.get(key)
      if (pending) return JSON.parse(pending.value) as StorageValue<T>
      try {
        const raw = localStorage.getItem(key)
        if (raw) return JSON.parse(raw) as StorageValue<T>
        // Fallback: try without userId for per-user stores (migration from old format)
        if (isPerUser && slug && getUserId()) {
          const oldKey = `${base}_${slug}`
          const oldRaw = localStorage.getItem(oldKey)
          if (oldRaw) {
            localStorage.setItem(key, oldRaw)
            localStorage.removeItem(oldKey)
            return JSON.parse(oldRaw) as StorageValue<T>
          }
        }
        return null
      } catch { return null }
    },
    setItem: (_name: string, value: StorageValue<T>): void => {
      const slug = getSlug()
      const key = resolveKey(slug)
      if (shouldDebounce) {
        scheduleWrite(key, value)
        return
      }
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Quota exceeded — drop the write rather than breaking the UI.
      }
    },
    removeItem: (_name: string): void => {
      const slug = getSlug()
      const key = resolveKey(slug)
      cancelWrite(key)
      try {
        localStorage.removeItem(key)
      } catch { /* ignore */ }
    },
  }
}

const WRITE_DEBOUNCE_MS = 300
const pendingWrites = new Map<string, { timer: ReturnType<typeof setTimeout>; value: string }>()

function scheduleWrite(key: string, value: unknown): void {
  const json = JSON.stringify(value)
  const existing = pendingWrites.get(key)
  if (existing) clearTimeout(existing.timer)
  const timer = setTimeout(() => {
    pendingWrites.delete(key)
    try {
      localStorage.setItem(key, json)
    } catch {
      // Quota exceeded — drop the write rather than breaking the UI.
    }
  }, WRITE_DEBOUNCE_MS)
  pendingWrites.set(key, { timer, value: json })
}

function cancelWrite(key: string): void {
  const existing = pendingWrites.get(key)
  if (existing) {
    clearTimeout(existing.timer)
    pendingWrites.delete(key)
  }
}

function flushPendingWrites(): void {
  pendingWrites.forEach((entry, key) => {
    clearTimeout(entry.timer)
    try {
      localStorage.setItem(key, entry.value)
    } catch {
      // Quota exceeded — drop the write.
    }
  })
  pendingWrites.clear()
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => flushPendingWrites())
}
