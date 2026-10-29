import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermission } from './usePermission'
import { AuthContext } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

function createWrapper(user: any) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider
        value={{
          user,
          loading: false,
          restoreFailed: false,
          retryRestore: () => {},
          login: async () => {},
          register: async () => {},
          logout: () => {},
          error: null,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }
}

describe('usePermission', () => {
  it('grants full admin access to school_admin role', () => {
    const { result } = renderHook(() => usePermission(), {
      wrapper: createWrapper({ id: 'u1', role: 'school_admin', email: 'admin@school.com' }),
    })
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canRead('students')).toBe(true)
    expect(result.current.canRead('teachers')).toBe(true)
    expect(result.current.canRead('classes')).toBe(true)
    expect(result.current.canRead('finance')).toBe(true)
    expect(result.current.canRead('exams')).toBe(true)
    expect(result.current.canCreate('attendance')).toBe(true)
    expect(result.current.canEdit('attendance')).toBe(true)
    expect(result.current.canDelete('hr')).toBe(true)
  })

  it('grants full admin access to admin role', () => {
    const { result } = renderHook(() => usePermission(), {
      wrapper: createWrapper({ id: 'u2', role: 'admin', email: 'admin@school.com' }),
    })
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canRead('students')).toBe(true)
  })

  it('grants full admin access to super_admin role', () => {
    const { result } = renderHook(() => usePermission(), {
      wrapper: createWrapper({ id: 'u3', role: 'super_admin', email: 'super@edutech.local' }),
    })
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.canRead('finance')).toBe(true)
  })

  it('does not grant admin access to unprivileged roles without explicit staff permissions', () => {
    const { result } = renderHook(() => usePermission(), {
      wrapper: createWrapper({ id: 'u4', role: 'teacher', email: 'teacher@school.com' }),
    })
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canRead('students')).toBe(false)
  })
})
