import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { getLoginRedirect, getInstitutionHome, RoleProtectedRoute, ViewingRoute } from './ProtectedRoute'
import { LOGIN_ROUTE } from '@/lib/constants'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    restoreFailed: false,
    retryRestore: vi.fn(),
  }),
}))

/**
 * Phase 15 — single-source login route: every login redirect resolves to
 * LOGIN_ROUTE (the same constant App registers the login route from), so the
 * path can be rotated in exactly one place (see
 * docs/security/super-admin-login-path.md).
 *
 * Boolean-safe comparisons are used wherever the configured VITE_LOGIN_PATH
 * value would otherwise appear in test output.
 */
describe('getLoginRedirect', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('resolves to /register when no institution slug is set (protecting super admin login privacy)', () => {
    expect(getLoginRedirect()).toBe('/register')
    // Guard: it must never reveal the secret super admin login route or send users to /login.
    expect(getLoginRedirect()).not.toBe(LOGIN_ROUTE)
    expect(getLoginRedirect()).not.toBe('/login')
  })

  it('prefers an explicit institution slug', () => {
    expect(getLoginRedirect('sunrise')).toBe('/i/sunrise')
  })

  it('falls back to the stored institution slug when present', () => {
    sessionStorage.setItem('edutech_inst_slug', 'moonrise')
    expect(getLoginRedirect()).toBe('/i/moonrise')
  })
})

describe('getInstitutionHome (Tenant isolation & non-superadmin restriction)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('routes super_admin to super admin dashboard', () => {
    expect(getInstitutionHome({ role: 'super_admin' })).toBe('/super-admin/admin/dashboard')
  })

  it('routes school_admin to their institution admin dashboard (never super-admin)', () => {
    sessionStorage.setItem('edutech_inst_slug', 'sunrise')
    expect(getInstitutionHome({ role: 'school_admin' })).toBe('/i/sunrise/admin/dashboard')
    expect(getInstitutionHome({ role: 'school_admin' })).not.toContain('super-admin')
  })

  it('routes teachers to their institution teacher dashboard', () => {
    expect(getInstitutionHome({ role: 'teacher', subdomain: 'ideal-school' } as any)).toBe(
      '/i/ideal-school/teacher/dashboard'
    )
  })

  it('falls back to /register when no institution slug can be resolved', () => {
    expect(getInstitutionHome({ role: 'school_admin' })).toBe('/register')
  })
})

describe('Super admin route protection redirects unauthenticated users to /register', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('redirects unauthenticated user accessing super_admin role protected route to /register (never exposes login path)', () => {
    render(
      <MemoryRouter initialEntries={['/super-admin/schools']}>
        <Routes>
          <Route element={<RoleProtectedRoute allowedRoles={['super_admin']} />}>
            <Route path="/super-admin/schools" element={<div>Protected Super Admin Schools</div>} />
          </Route>
          <Route path="/register" element={<div>Public Register Page</div>} />
          <Route path={LOGIN_ROUTE} element={<div>Secret Super Admin Login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Super Admin Schools')).not.toBeInTheDocument()
    expect(screen.queryByText('Secret Super Admin Login')).not.toBeInTheDocument()
    expect(screen.getByText('Public Register Page')).toBeInTheDocument()
  })

  it('redirects unauthenticated user accessing ViewingRoute to /register (never exposes login path)', () => {
    render(
      <MemoryRouter initialEntries={['/super-admin/viewing/admin/dashboard']}>
        <Routes>
          <Route element={<ViewingRoute />}>
            <Route path="/super-admin/viewing/admin/dashboard" element={<div>Viewing Dashboard</div>} />
          </Route>
          <Route path="/register" element={<div>Public Register Page</div>} />
          <Route path={LOGIN_ROUTE} element={<div>Secret Super Admin Login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText('Viewing Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Secret Super Admin Login')).not.toBeInTheDocument()
    expect(screen.getByText('Public Register Page')).toBeInTheDocument()
  })
})
