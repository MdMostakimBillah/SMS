import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getDashboardPath, getLogoutRedirect, type DashboardSession } from './navUtils'
import { LOGIN_ROUTE } from './constants'

const session = (over: Partial<DashboardSession> = {}): DashboardSession => ({
  slug: null,
  viewingId: null,
  ...over,
})

describe('getDashboardPath', () => {
  it('sends signed-out visitors to the public home', () => {
    expect(getDashboardPath(null, session())).toBe('/')
  })

  // The regression this helper exists for: `/dashboard` is not a route, so a
  // super admin launching the installed PWA used to land on the 404 page.
  it('sends a super admin with no institution to the super admin dashboard', () => {
    expect(getDashboardPath({ role: 'super_admin' }, session())).toBe(
      '/super-admin/admin/dashboard'
    )
  })

  it('sends an institution user to their own institution dashboard', () => {
    expect(getDashboardPath({ role: 'teacher' }, session({ slug: 'sunrise' }))).toBe(
      '/i/sunrise/teacher/dashboard'
    )
  })

  it('prefers the institution a super admin is currently viewing', () => {
    expect(getDashboardPath({ role: 'super_admin' }, session({ viewingId: 'inst_7' }))).toBe(
      '/super-admin/viewing/admin/dashboard'
    )
  })

  it('falls back to the public home for a non-super-admin with no institution', () => {
    expect(getDashboardPath({ role: 'teacher' }, session())).toBe('/')
  })
})

describe('getLogoutRedirect (Phase 15 — server-role-only logout redirect)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('sends an institution admin back to their institution landing page', () => {
    expect(getLogoutRedirect('admin', 'sunrise')).toBe('/i/sunrise')
  })

  it('sends every other role to the configured login route', () => {
    // Boolean-safe comparisons: a failure reports true/false, never the
    // configured VITE_LOGIN_PATH value, in test output.
    expect(getLogoutRedirect('school_admin', 'sunrise') === LOGIN_ROUTE).toBe(true)
    expect(getLogoutRedirect('teacher', null) === LOGIN_ROUTE).toBe(true)
    expect(getLogoutRedirect(null, null) === LOGIN_ROUTE).toBe(true)
  })

  it('ignores legacy localStorage identity: a stale "admin" claim changes nothing', () => {
    localStorage.setItem(
      'edutech_user',
      JSON.stringify({ role: 'admin', email: 'legacy-admin@old.local' })
    )
    expect(getLogoutRedirect(null, 'somewhere') === LOGIN_ROUTE).toBe(true)
    expect(getLogoutRedirect(null, 'somewhere')).not.toBe('/i/somewhere')
  })

  it('never reads web storage at all (pure function of its arguments)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem')
    getLogoutRedirect('teacher', 'slug')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
