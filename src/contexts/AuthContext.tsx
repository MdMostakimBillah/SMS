import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { authApi, setAuthToken, ApiError } from '@/lib/api'
import { createSuperAdminToken, createSuperAdminUser } from '@/lib/adminAuth'

const VITE_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL as string) || 'admin@edutech.com'
const VITE_PASSWORD = (import.meta.env.VITE_SUPER_ADMIN_PASSWORD as string) || 'Admin@123456'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  avatar: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, role?: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
  isLockedOut: boolean
  lockoutRemaining: number
}

const AuthContext = createContext<AuthContextType | null>(null)

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
  }, [])

  // Token lives in memory only — no localStorage persistence
  // On page reload, user must re-login (acceptable for admin panel)
  useEffect(() => {
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

    let apiResponded = false

    // Try API verification first (database credentials)
    try {
      const result = await authApi.verifySuperAdmin(email, password)
      apiResponded = true
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
    } catch (err) {
      // 404 = endpoint not found (no backend deployed)
      // Other ApiError = API is live but rejected the request
      if (err instanceof ApiError && err.status !== 404) apiResponded = true
    }

    // Try regular API login
    try {
      const res = await authApi.login(email, password)
      apiResponded = true
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
      loginTimestampRef.current = Date.now()
      clearLoginAttempts()
      return
    } catch (err) {
      if (err instanceof ApiError && err.status !== 404) apiResponded = true
      // If API responded with a real error, don't try fallback
      if (apiResponded) {
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
    }

    // Fallback: client-side credential check (only when API is completely unreachable)
    if (!apiResponded && VITE_EMAIL && VITE_PASSWORD) {
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
    }

    // All checks failed
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
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, role?: string) => {
    setError(null)
    try {
      const res = await authApi.register(email, password, name, role)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
      loginTimestampRef.current = Date.now()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError(msg)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const ctxValue = useMemo(() => ({
    user, token, loading, login, register, logout, error, clearError, isLockedOut, lockoutRemaining
  }), [user, token, loading, login, register, logout, error, clearError, isLockedOut, lockoutRemaining])

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
