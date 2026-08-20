import type { RegisteredFace } from '@/hooks/useFaceApi'

const STORAGE_KEY = 'kioskFaces'
const MAX_FACES = 200

/**
 * `loadFaces` — reads enrolled faces from localStorage.
 * Returns an empty array on any parse/storage error.
 */
export function loadFaces(): RegisteredFace[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * `saveFaces` — quota-safe write of enrolled faces to localStorage.
 * Caps the stored list at `MAX_FACES` and silently drops the write if
 * the quota is exceeded so the attendance/enrollment flow never breaks.
 */
export function saveFaces(faces: RegisteredFace[]): void {
  const capped = faces.length > MAX_FACES ? faces.slice(-MAX_FACES) : faces
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped))
  } catch {
    // Quota exceeded — drop the write rather than breaking the UI.
  }
}