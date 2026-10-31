import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { authApi, ApiError, type SessionUser } from '@/lib/api'
import { nsRemove, setUserId, clearUserId, clearSlug, setSlug } from '@/lib/storage'
import { useClassStore, mapSchoolToInstitutionSettings, generateLightColors, generateDarkColors } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'
import { applyThemeColors } from '@/hooks/useThemeColors'
import { useSuperAdminStore } from '@/store/superAdminStore'

interface User {
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

interface AuthContextType {
  user: User | null
  loading: boolean
  /** True when the last /me check failed for a non-401 reason (server unreachable). */
  restoreFailed: boolean
  /** Re-runs the server session check (used by the connection-error screen). */
  retryRestore: () => void
  login: (email: string, password: string) => Promise<User | void>
  register: (email: string, password: string, name: string, role?: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
  isLockedOut: boolean
  lockoutRemaining: number
}

export const AuthContext = createContext<AuthContextType | null>(null)

// Client-side throttling hints (UX only — the server rate-limits authoritatively).
// Keys are namespaced "api" to avoid colliding with InstitutionLogin's own counters.
const ATTEMPTS_KEY = 'edutech_api_login_attempts'
const LOCKOUT_KEY = 'edutech_api_lockout_until'
const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes
const SERVER_LOCKOUT_DURATION = 60 * 1000 // matches server rate-limit window
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000

function getAttempts(): number {
  return Number(localStorage.getItem(ATTEMPTS_KEY) || '0')
}

function getLockoutUntil(): number {
  return Number(localStorage.getItem(LOCKOUT_KEY) || '0')
}

function isCurrentlyLockedOut(): boolean {
  return Date.now() < getLockoutUntil()
}

function getLockoutRemaining(): number {
  const remaining = getLockoutUntil() - Date.now()
  return remaining > 0 ? remaining : 0
}

function recordFailedAttempt(): void {
  const attempts = getAttempts() + 1
  localStorage.setItem(ATTEMPTS_KEY, String(attempts))
  if (attempts >= MAX_ATTEMPTS) {
    localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_DURATION))
  }
}

function recordServerLockout(): void {
  localStorage.setItem(LOCKOUT_KEY, String(Date.now() + SERVER_LOCKOUT_DURATION))
}

function clearLoginAttempts(): void {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
}

function applyError(err: unknown, fallback: string, onLockoutState: (locked: boolean, remaining: number) => void): string {
  if (err instanceof ApiError && err.status === 429) {
    recordServerLockout()
    onLockoutState(true, SERVER_LOCKOUT_DURATION)
    return err.message
  }
  recordFailedAttempt()
  const attempts = getAttempts()
  if (attempts >= MAX_ATTEMPTS) {
    onLockoutState(true, LOCKOUT_DURATION)
    return 'Too many failed attempts. Locked out for 5 minutes.'
  }
  const base = err instanceof ApiError ? err.message : fallback
  return `${base}. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`
}

/** Removes every legacy identity key so a logout can never resurrect a session. */
function clearAllIdentityKeys(): void {
  const legacyKeys = ['edutech_current_user', 'edutech_user', 'edutech_superadmin_user']
  for (const key of legacyKeys) {
    localStorage.removeItem(key)
  }
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('edutech_user_') || key.startsWith('edutech_institutionId')) {
      localStorage.removeItem(key)
    }
  }
  sessionStorage.removeItem('edutech_viewing_id')
  sessionStorage.removeItem('edutech_user_id')
  sessionStorage.removeItem('edutech_user_role')
}

function serverUserToUser(u: SessionUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    schoolId: u.schoolId,
    schoolName: u.schoolName,
    avatar: u.avatar,
    subdomain: u.schoolDomain || null,
    schoolDomain: u.schoolDomain || null,
    school: u.school || null,
    photo: u.avatar,
  }
}

export function syncUserSchool(school: any, u: SessionUser | User): void {
  if (!school) return
  const targetSlug =
    u.schoolDomain ||
    school.domain ||
    school.slug ||
    (u.schoolName ? u.schoolName.toLowerCase().replace(/\s+/g, '-') : '')

  if (targetSlug) {
    setSlug(targetSlug)
  }

  const mapped = mapSchoolToInstitutionSettings(school, useClassStore.getState().institution)
  useClassStore.getState().updateInstitution(mapped)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
    sessionStorage.setItem('edutech_server_url', mapped.serverUrl || '')
  }

  const brandColor = school.brandColor || '#6366f1'
  const currentTheme = useAppStore.getState().theme
  const isDark =
    currentTheme === 'dark' ||
    (currentTheme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  applyThemeColors(isDark ? generateDarkColors(brandColor) : generateLightColors(brandColor))

  if (targetSlug) {
    const instId = school.id || `INST-${targetSlug}`
    const existing = useSuperAdminStore.getState().institutions.find((i) => i.id === instId || i.slug === targetSlug)
    if (existing) {
      useSuperAdminStore.getState().updateInstitution(existing.id, {
        name: school.name,
        nameBn: school.nameBn || school.name,
        brandName: school.brandName || school.name,
        brandColor,
        logo: school.logo || '',
        banner: school.banner || '',
        slug: targetSlug,
        subdomain: targetSlug,
      })
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLockedOut, setIsLockedOut] = useState(isCurrentlyLockedOut)
  const [lockoutRemaining, setLockoutRemaining] = useState(getLockoutRemaining)
  const [sessionSource, setSessionSource] = useState<'server' | null>(null)
  const [restoreFailed, setRestoreFailed] = useState(false)
  const loginTimestampRef = useRef<number | null>(null)

  // Lockout countdown timer
  useEffect(() => {
    if (!isLockedOut) return

    const interval = setInterval(() => {
      const remaining = getLockoutRemaining()
      if (remaining <= 0) {
        setIsLockedOut(false)
        setLockoutRemaining(0)
        clearInterval(interval)
      } else {
        setLockoutRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isLockedOut])

  const logout = useCallback(() => {
    // Revoke the server-side session (fire and forget)
    authApi.logout().catch(() => { /* already gone */ })
    setUser(null)
    loginTimestampRef.current = null
    setSessionSource(null)
    setRestoreFailed(false)
    nsRemove('user')
    nsRemove('institutionId')
    nsRemove('institutionSubdomain')
    clearAllIdentityKeys()
    clearUserId()
    clearSlug() // resets all institution stores via storage.ts listeners
  }, [])

  /**
   * Phase 7 — restore ONLY from the server session (HttpOnly cookie + /me).
   * Legacy localStorage identity is never consulted: a 401 is clean
   * "not signed in", and any other failure (server unreachable) is surfaced
   * as `restoreFailed` so the UI can offer a retry instead of trusting a
   * cached role/school or spinning forever.
   */
  const runRestore = useCallback(async () => {
    setLoading(true)
    setRestoreFailed(false)
    try {
      const res = await authApi.me()
      const userObj = serverUserToUser(res.user)
      setUser(userObj)
      setSessionSource('server')
      loginTimestampRef.current = Date.now()
      setUserId(res.user.email)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('edutech_user_role', res.user.role)
      }
      if (res.user.role === 'super_admin' && typeof sessionStorage !== 'undefined') {
        const viewingId = sessionStorage.getItem('edutech_viewing_id')
        if (viewingId) {
          try {
            const pubSchool = await authApi.getPublicSchool(viewingId)
            if (pubSchool?.school) {
              syncUserSchool(pubSchool.school, { ...res.user, schoolDomain: pubSchool.school.domain })
            } else if (res.user.school) {
              syncUserSchool(res.user.school, res.user)
            }
          } catch {
            if (res.user.school) {
              syncUserSchool(res.user.school, res.user)
            }
          }
        } else if (res.user.school) {
          syncUserSchool(res.user.school, res.user)
        }
      } else if (res.user.school) {
        syncUserSchool(res.user.school, res.user)
      }
    } catch (err) {
      setUser(null)
      setSessionSource(null)
      if (!(err instanceof ApiError && err.status === 401)) {
        setRestoreFailed(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void runRestore()
  }, [runRestore])

  const retryRestore = useCallback(() => {
    void runRestore()
  }, [runRestore])

  // Server sessions: validate periodically so an expired/revoked session
  // actually ends the UI session instead of persisting until reload.
  useEffect(() => {
    if (sessionSource !== 'server') return

    const id = setInterval(() => {
      authApi
        .me()
        .then((res) => setUser(serverUserToUser(res.user)))
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            logout()
          }
        })
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(id)
  }, [sessionSource, logout])

  const setLockoutState = useCallback((locked: boolean, remaining: number) => {
    setIsLockedOut(locked)
    setLockoutRemaining(remaining)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)

    if (isCurrentlyLockedOut()) {
      setIsLockedOut(true)
      setLockoutRemaining(getLockoutRemaining())
      setError(`Too many failed attempts. Try again in ${Math.ceil(getLockoutRemaining() / 60000)} minutes.`)
      return
    }

    try {
      const res = await authApi.login(email, password)
      const userObj = serverUserToUser(res.user)
      setUser(userObj)
      setSessionSource('server')
      loginTimestampRef.current = Date.now()
      setUserId(res.user.email)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('edutech_user_role', res.user.role)
      }
      clearLoginAttempts()
      if (res.user.role === 'super_admin' && typeof sessionStorage !== 'undefined') {
        const viewingId = sessionStorage.getItem('edutech_viewing_id')
        if (viewingId) {
          try {
            const pubSchool = await authApi.getPublicSchool(viewingId)
            if (pubSchool?.school) {
              syncUserSchool(pubSchool.school, { ...res.user, schoolDomain: pubSchool.school.domain })
            } else if (res.user.school) {
              syncUserSchool(res.user.school, res.user)
            }
          } catch {
            if (res.user.school) {
              syncUserSchool(res.user.school, res.user)
            }
          }
        } else if (res.user.school) {
          syncUserSchool(res.user.school, res.user)
        }
      } else if (res.user.school) {
        syncUserSchool(res.user.school, res.user)
      }
      return userObj
    } catch (err) {
      const msg = applyError(err, 'Invalid credentials', setLockoutState)
      setError(msg)
      throw err
    }
  }, [setLockoutState])

  const register = useCallback(async (email: string, password: string, name: string, role?: string) => {
    setError(null)
    try {
      const res = await authApi.register(email, password, name, role)
      setUser(serverUserToUser(res.user))
      setSessionSource('server')
      loginTimestampRef.current = Date.now()
      clearLoginAttempts()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError(msg)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const ctxValue = useMemo(() => ({
    user, loading, restoreFailed, retryRestore, login, register, logout, error, clearError, isLockedOut, lockoutRemaining
  }), [user, loading, restoreFailed, retryRestore, login, register, logout, error, clearError, isLockedOut, lockoutRemaining])

  return (
    <AuthContext.Provider value={ctxValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
