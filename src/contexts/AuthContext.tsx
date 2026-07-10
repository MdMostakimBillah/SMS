import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi, setAuthToken, getAuthToken, ApiError } from '@/lib/api'
import { validateAdminCredentials, createSuperAdminToken, createSuperAdminUser } from '@/lib/adminAuth'

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

const SESSION_KEY = 'edutech_session_start'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const ATTEMPTS_KEY = 'edutech_login_attempts'
const LOCKOUT_KEY = 'edutech_lockout_until'
const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 5 * 60 * 1000 // 5 minutes

function isSessionValid(): boolean {
  const start = localStorage.getItem(SESSION_KEY)
  if (!start) return false
  return Date.now() - Number(start) < SESSION_DURATION
}

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
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLockedOut, setIsLockedOut] = useState(isCurrentlyLockedOut)
  const [lockoutRemaining, setLockoutRemaining] = useState(getLockoutRemaining)

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
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('edutech_login_email')
  }, [])

  useEffect(() => {
    const storedToken = getAuthToken()
    if (storedToken && isSessionValid()) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            id: payload.userId,
            email: '',
            name: null,
            role: payload.role,
            schoolId: payload.schoolId,
            schoolName: null,
            avatar: null,
          })
          setToken(storedToken)
        } else {
          setAuthToken(null)
          setToken(null)
          localStorage.removeItem(SESSION_KEY)
        }
      } catch {
        setAuthToken(null)
        setToken(null)
        localStorage.removeItem(SESSION_KEY)
      }
    } else if (storedToken) {
      setAuthToken(null)
      setToken(null)
      localStorage.removeItem(SESSION_KEY)
    }
    setLoading(false)
  }, [])

  // Auto-logout timer
  useEffect(() => {
    if (!user) return

    const start = localStorage.getItem(SESSION_KEY)
    if (!start) return

    const elapsed = Date.now() - Number(start)
    const remaining = SESSION_DURATION - elapsed

    if (remaining <= 0) {
      logout()
      return
    }

    const timer = setTimeout(() => {
      logout()
    }, remaining)

    return () => clearTimeout(timer)
  }, [user, logout])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)

    // Check lockout
    if (isCurrentlyLockedOut()) {
      setIsLockedOut(true)
      setLockoutRemaining(getLockoutRemaining())
      setError(`Too many failed attempts. Try again in ${Math.ceil(getLockoutRemaining() / 60000)} minutes.`)
      return
    }

    try {
      // Try API verification first (database credentials)
      try {
        const result = await authApi.verifySuperAdmin(email, password)
        if (result.valid) {
          const token = createSuperAdminToken()
          const user = createSuperAdminUser()
          localStorage.setItem('edutech_admin_credentials', JSON.stringify({ email, password }))
          setAuthToken(token)
          setToken(token)
          setUser(user)
          localStorage.setItem(SESSION_KEY, String(Date.now()))
          clearLoginAttempts()
          return
        }
      } catch {
        // API not available, fall back to local check
      }

      // Fallback: check local credentials (localStorage overrides + .env defaults)
      if (validateAdminCredentials(email, password)) {
        const token = createSuperAdminToken()
        const user = createSuperAdminUser()
        setAuthToken(token)
        setToken(token)
        setUser(user)
        localStorage.setItem(SESSION_KEY, String(Date.now()))
        clearLoginAttempts()
        return
      }

      // Final fallback: always allow .env defaults regardless of localStorage
      const envEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@edutech.com'
      const envPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'Admin@123456'
      if (email === envEmail && password === envPassword) {
        const token = createSuperAdminToken()
        const user = createSuperAdminUser()
        setAuthToken(token)
        setToken(token)
        setUser(user)
        localStorage.setItem(SESSION_KEY, String(Date.now()))
        clearLoginAttempts()
        return
      }

      // Try regular API login
      try {
        const res = await authApi.login(email, password)
        setAuthToken(res.token)
        setToken(res.token)
        setUser(res.user)
        localStorage.setItem(SESSION_KEY, String(Date.now()))
        clearLoginAttempts()
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
    } catch (err) {
      // If we haven't set error yet (from non-API login paths that failed)
      if (!error && !isCurrentlyLockedOut()) {
        recordFailedAttempt()
        const attempts = getAttempts()
        if (attempts >= MAX_ATTEMPTS) {
          setIsLockedOut(true)
          setLockoutRemaining(LOCKOUT_DURATION)
          setError(`Invalid credentials. Too many failed attempts. Locked out for 5 minutes.`)
        } else {
          setError(`Invalid credentials. ${MAX_ATTEMPTS - attempts} attempt(s) remaining.`)
        }
      }
      throw err
    }
  }, [error])

  const register = useCallback(async (email: string, password: string, name: string, role?: string) => {
    setError(null)
    try {
      const res = await authApi.register(email, password, name, role)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem(SESSION_KEY, String(Date.now()))
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError(msg)
      throw err
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, error, clearError, isLockedOut, lockoutRemaining }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
