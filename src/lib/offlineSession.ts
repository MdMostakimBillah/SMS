export interface OfflineUser {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  avatar: string | null
  subdomain: string | null
  schoolDomain?: string | null
  school?: any
  staffId?: string
  photo?: string | null
}

export interface OfflineSessionData {
  user: OfflineUser
  savedAt: number
  slug?: string | null
  role?: string
}

export const OFFLINE_SESSION_KEY = 'edutech_offline_session'

/**
 * Validates whether an offline session object is structurally sound and intact.
 */
export function isOfflineSessionValid(session: unknown): session is OfflineSessionData {
  if (!session || typeof session !== 'object') return false
  const s = session as Partial<OfflineSessionData>
  if (!s.user || typeof s.user !== 'object') return false
  const u = s.user as Partial<OfflineUser>
  if (typeof u.id !== 'string' || !u.id.trim()) return false
  if (typeof u.email !== 'string' || !u.email.trim()) return false
  if (typeof u.role !== 'string' || !u.role.trim()) return false
  if (typeof s.savedAt !== 'number' || s.savedAt <= 0) return false
  return true
}

/**
 * Persists an authenticated user snapshot to local storage for offline use.
 */
export function saveOfflineSession(data: OfflineSessionData): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('[OfflineSession] Failed to persist session snapshot:', err)
  }
}

/**
 * Retrieves the saved offline session snapshot, returning null if missing or invalid.
 */
export function getOfflineSession(): OfflineSessionData | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (isOfflineSessionValid(parsed)) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Clears the offline session snapshot completely (e.g. on explicit logout or 401).
 */
export function clearOfflineSession(): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(OFFLINE_SESSION_KEY)
  } catch {
    // Ignore storage errors on cleanup
  }
}
