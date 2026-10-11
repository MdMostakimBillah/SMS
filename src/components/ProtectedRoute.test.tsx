import { describe, it, expect, beforeEach } from 'vitest'
import { getLoginRedirect } from './ProtectedRoute'
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
