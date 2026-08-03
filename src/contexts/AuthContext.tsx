import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { authApi, setAuthToken, ApiError, API_BASE } from '@/lib/api'
import { createSuperAdminToken, createSuperAdminUser } from '@/lib/adminAuth'

const VITE_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL as string) || 'admin@edutech.com'
const VITE_PASSWORD = (import.meta.env.VITE_SUPER_ADMIN_PASSWORD as string) || 'Admin@123456'
const HAS_BACKEND = API_BASE !== ''

interface User {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  avatar: string | null
  subdomain: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role?: string) => Promise<void>
  setInstitutionUser: (email: string, name: string, role: string, institutionId: string, subdomain: string, slug?: string) => void
  logout: () => void
  error: string | null
  clearError: () => void
  isLockedOut: boolean
  lockoutRemaining: number
}

export const AuthContext = createContext<AuthContextType | null>(null)

const ATTEMPTS_KEY = 'edutech_login_attempts'
const LOCKOUT_KEY = 'edutech_lockout_until'
const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes

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

function clearLoginAttempts(): void {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLockedOut, setIsLockedOut] = useState(isCurrentlyLockedOut)
  const [lockoutRemaining, setLockoutRemaining] = useState(getLockoutRemaining)
  const loginTimestampRef = useRef<number | null>(null)
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

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
    setAuthToken(null)
    setToken(null)
    setUser(null)
    loginTimestampRef.current = null
    localStorage.removeItem('edutech_user')
    localStorage.removeItem('edutech_institutionId')
    localStorage.removeItem('edutech_institutionSubdomain')
  }, [])

  // Restore user from localStorage (set by InstitutionLogin)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('edutech_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.email && parsed?.role) {
          const subdomain = parsed.subdomain || localStorage.getItem('edutech_institutionSubdomain') || null
          setUser({
            id: parsed.institutionId || 'super-admin',
            email: parsed.email,
            name: parsed.name || null,
            role: parsed.role,
            schoolId: parsed.institutionId || null,
            schoolName: parsed.name || null,
            avatar: null,
            subdomain,
          })
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  // Auto-logout timer
  useEffect(() => {
    if (!user || !loginTimestampRef.current) return

    const elapsed = Date.now() - loginTimestampRef.current
    const remaining = SESSION_DURATION - elapsed

    if (remaining <= 0) {
      logout()
      return
    }

    const timer = setTimeout(() => {
      logout()
    }, remaining)

    return () => clearTimeout(timer)
  }, [user, logout, SESSION_DURATION])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)

    // Check lockout
    if (isCurrentlyLockedOut()) {
      setIsLockedOut(true)
      setLockoutRemaining(getLockoutRemaining())
      setError(`Too many failed attempts. Try again in ${Math.ceil(getLockoutRemaining() / 60000)} minutes.`)
      return
    }

    // When no backend is deployed, use client-side credentials directly
    if (!HAS_BACKEND) {
      if (email === VITE_EMAIL && password === VITE_PASSWORD) {
        const token = await createSuperAdminToken(password)
        const user = createSuperAdminUser()
        setAuthToken(token)
        setToken(token)
        setUser(user)
        loginTimestampRef.current = Date.now()
        clearLoginAttempts()
        return
      }
      // Wrong credentials
      recordFailedAttempt()
      const attempts = getAttempts()
      if (attempts >= MAX_ATTEMPTS) {
        setIsLockedOut(true)
        setLockoutRemaining(LOCKOUT_DURATION)
        setError(`Too many failed attempts. Locked out for 5 minutes.`)
      } else {
        setError(`Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`)
      }
      throw new Error('Invalid credentials')
    }

    // Backend is deployed — try API verification first
    try {
      const result = await authApi.verifySuperAdmin(email, password)
      if (result.valid) {
        const token = await createSuperAdminToken(password)
        const user = createSuperAdminUser()
        setAuthToken(token)
        setToken(token)
        setUser(user)
        loginTimestampRef.current = Date.now()
        clearLoginAttempts()
        return
      }
    } catch {
      // API not available
    }

    // Try regular API login
    try {
      const res = await authApi.login(email, password)
      setAuthToken(res.token)
      setToken(res.token)
      setUser({ ...res.user, subdomain: (res.user as any).subdomain || null })
      loginTimestampRef.current = Date.now()
      clearLoginAttempts()
      return
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Invalid credentials'
      recordFailedAttempt()
      const attempts = getAttempts()
      if (attempts >= MAX_ATTEMPTS) {
        setIsLockedOut(true)
        setLockoutRemaining(LOCKOUT_DURATION)
        setError(`Too many failed attempts. Locked out for 5 minutes.`)
      } else {
        setError(`${msg}. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`)
      }
      throw err
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, role?: string) => {
    setError(null)
    try {
      const res = await authApi.register(email, password, name, role)
      setAuthToken(res.token)
      setToken(res.token)
      setUser({ ...res.user, subdomain: (res.user as any).subdomain || null })
      loginTimestampRef.current = Date.now()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError(msg)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const setInstitutionUser = useCallback((email: string, name: string, role: string, institutionId: string, subdomain: string, slug?: string) => {
    setUser({
      id: institutionId,
      email,
      name,
      role,
      schoolId: institutionId,
      schoolName: name,
      avatar: null,
      subdomain,
    })
    localStorage.setItem('edutech_user', JSON.stringify({ email, role, name, institutionId, subdomain, slug }))
    localStorage.setItem('edutech_institutionId', institutionId)
    localStorage.setItem('edutech_institutionSubdomain', subdomain)
    sessionStorage.setItem('edutech_inst_subdomain', subdomain)
    if (slug) sessionStorage.setItem('edutech_inst_slug', slug)
  }, [])

  const ctxValue = useMemo(() => ({
    user, token, loading, login, register, setInstitutionUser, logout, error, clearError, isLockedOut, lockoutRemaining
  }), [user, token, loading, login, register, setInstitutionUser, logout, error, clearError, isLockedOut, lockoutRemaining])

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
