import { describe, expect, it } from 'vitest'
import { getDashboardPath, type DashboardSession } from './navUtils'

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
