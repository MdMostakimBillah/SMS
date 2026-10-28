import { describe, it, expect, beforeEach } from 'vitest'
import { getLoginRedirect, getInstitutionHome } from './ProtectedRoute'
import { LOGIN_ROUTE } from '@/lib/constants'

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

  it('resolves to the configured LOGIN_ROUTE when no institution slug is set', () => {
    expect(getLoginRedirect() === LOGIN_ROUTE).toBe(true)
    // Guard: it must never send users to the legacy hard-coded /login path.
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
