import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { authApi, ApiError, type SessionUser } from '@/lib/api'
import { nsRemove, setUserId, clearUserId, clearSlug, setSlug } from '@/lib/storage'
import { useClassStore, mapSchoolToInstitutionSettings, generateLightColors, generateDarkColors } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'
import { applyThemeColors } from '@/hooks/useThemeColors'
import { useSuperAdminStore } from '@/store/superAdminStore'
import {
  saveOfflineSession,
  getOfflineSession,
  clearOfflineSession,
  isOfflineSessionValid,
  type OfflineUser,
} from '@/lib/offlineSession'

export type SessionSource = 'server' | 'offline_cache' | null

export type User = OfflineUser

interface AuthContextType {
  user: User | null
  loading: boolean
  /** True when the last /me check failed for a non-401 reason (server unreachable) and no offline session exists. */
  restoreFailed: boolean
  sessionSource: SessionSource
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

function resolveUserSlug(u: User): string {
  return (
    u.schoolDomain ||
    u.subdomain ||
    u.school?.domain ||
    (u.schoolName ? u.schoolName.toLowerCase().replace(/\s+/g, '-') : '') ||
    'default'
  )
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
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('edutech_storage_mode', mapped.storageMode || 'cloud')
    if (mapped.serverUrl) localStorage.setItem('edutech_server_url', mapped.serverUrl)
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
  const [sessionSource, setSessionSource] = useState<SessionSource>(null)
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
    clearOfflineSession()
    clearUserId()
    clearSlug() // resets all institution stores via storage.ts listeners
  }, [])

  /**
   * Phase 7 & Offline-First:
   * - Attempts to restore from server session (/api/auth/me) when online.
   * - When offline or if network/server is unreachable, restores seamlessly
   *   from the validated offline session snapshot saved during online login.
   * - A 401 explicitly clears offline snapshot and logs out.
   */
  const runRestore = useCallback(async () => {
    setLoading(true)
    setRestoreFailed(false)

    // Immediate offline check
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
    if (isOffline) {
      const offline = getOfflineSession()
      if (offline && isOfflineSessionValid(offline)) {
        setUser(offline.user)
        setSessionSource('offline_cache')
        loginTimestampRef.current = offline.savedAt
        setUserId(offline.user.email)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('edutech_user_role', offline.user.role)
        }
        if (offline.user.school) {
          syncUserSchool(offline.user.school, offline.user)
        }
        setRestoreFailed(false)
        setLoading(false)
        return
      }
    }

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
      saveOfflineSession({
        user: userObj,
        savedAt: Date.now(),
        slug: resolveUserSlug(userObj),
        role: userObj.role,
      })
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
      if (err instanceof ApiError && err.status === 401) {
        clearOfflineSession()
        if (typeof window !== 'undefined') {
          setUser(null)
          setSessionSource(null)
          setRestoreFailed(false)
        }
      } else {
        // Network failure, fetch failed, or server unreachable
        const offline = getOfflineSession()
        if (offline && isOfflineSessionValid(offline)) {
          setUser(offline.user)
          setSessionSource('offline_cache')
          loginTimestampRef.current = offline.savedAt
          setUserId(offline.user.email)
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('edutech_user_role', offline.user.role)
          }
          if (offline.user.school) {
            syncUserSchool(offline.user.school, offline.user)
          }
          setRestoreFailed(false)
        } else {
          if (typeof window !== 'undefined') {
            setUser(null)
            setSessionSource(null)
            setRestoreFailed(true)
          }
        }
      }
    } finally {
      if (typeof window !== 'undefined') {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void runRestore()
  }, [runRestore])

  const retryRestore = useCallback(() => {
    void runRestore()
  }, [runRestore])

  // Server sessions: validate periodically when online
  useEffect(() => {
    if (sessionSource !== 'server') return

    const id = setInterval(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      authApi
        .me()
        .then((res) => {
          const userObj = serverUserToUser(res.user)
          setUser(userObj)
          saveOfflineSession({
            user: userObj,
            savedAt: Date.now(),
            slug: resolveUserSlug(userObj),
            role: userObj.role,
          })
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            clearOfflineSession()
            logout()
          }
        })
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(id)
  }, [sessionSource, logout])

  // Background re-verification when device reconnects online
  useEffect(() => {
    const handleOnline = () => {
      authApi
        .me()
        .then((res) => {
          const userObj = serverUserToUser(res.user)
          setUser(userObj)
          setSessionSource('server')
          saveOfflineSession({
            user: userObj,
            savedAt: Date.now(),
            slug: resolveUserSlug(userObj),
            role: userObj.role,
          })
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            clearOfflineSession()
            logout()
          }
        })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      return () => window.removeEventListener('online', handleOnline)
    }
  }, [logout])

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
      saveOfflineSession({
        user: userObj,
        savedAt: Date.now(),
        slug: resolveUserSlug(userObj),
        role: userObj.role,
      })
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
      const userObj = serverUserToUser(res.user)
      setUser(userObj)
      setSessionSource('server')
      loginTimestampRef.current = Date.now()
      clearLoginAttempts()
      saveOfflineSession({
        user: userObj,
        savedAt: Date.now(),
        slug: resolveUserSlug(userObj),
        role: userObj.role,
      })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError(msg)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const ctxValue = useMemo(() => ({
    user, loading, restoreFailed, sessionSource, retryRestore, login, register, logout, error, clearError, isLockedOut, lockoutRemaining
  }), [user, loading, restoreFailed, sessionSource, retryRestore, login, register, logout, error, clearError, isLockedOut, lockoutRemaining])

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
