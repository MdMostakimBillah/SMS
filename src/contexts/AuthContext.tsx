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
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'edutech_session_start'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

function isSessionValid(): boolean {
  const start = localStorage.getItem(SESSION_KEY)
  if (!start) return false
  return Date.now() - Number(start) < SESSION_DURATION
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(() => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
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
      return
    }

    // Try regular API login
    try {
      const res = await authApi.login(email, password)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem(SESSION_KEY, String(Date.now()))
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Invalid credentials'
      setError(msg)
      throw err
    }
  }, [])

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
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
