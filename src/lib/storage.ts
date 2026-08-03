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
