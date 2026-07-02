import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi, setAuthToken, getAuthToken, ApiError } from '@/lib/api'

interface User {
  id: string
  email: string
  role: string
  schoolId: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string, schoolId: string) => Promise<void>
  register: (email: string, password: string, schoolId: string, role?: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getAuthToken())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = getAuthToken()
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        if (payload.exp * 1000 > Date.now()) {
          setUser({ id: payload.userId, email: '', role: payload.role, schoolId: payload.schoolId })
          setToken(storedToken)
        } else {
          setAuthToken(null)
          setToken(null)
        }
      } catch {
        setAuthToken(null)
        setToken(null)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string, schoolId: string) => {
    setError(null)
    try {
      const res = await authApi.login(email, password, schoolId)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed'
      setError(msg)
      throw err
    }
  }, [])

  const register = useCallback(async (email: string, password: string, schoolId: string, role?: string) => {
    setError(null)
    try {
      const res = await authApi.register(email, password, schoolId, role)
      setAuthToken(res.token)
      setToken(res.token)
      setUser(res.user)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed'
      setError(msg)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
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
