import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { LOGIN_PATH, LOGIN_ROUTE } from '@/lib/constants'
import { authApi, ApiError } from '@/lib/api'

/**
 * Phase 15 — login-route registration consistency:
 * App mounts the login form on LOGIN_ROUTE, the same single-source constant
 * used by every login redirect (ProtectedRoute.getLoginRedirect,
 * getLogoutRedirect). Rotating VITE_LOGIN_PATH therefore changes the route
 * and every redirect together — see
 * docs/security/super-admin-login-path.md.
 *
 * The route is obscurity only: this test asserts wiring consistency, not
 * that the path is secret (it is present in the browser bundle by design).
 */

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      me: vi.fn(),
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    },
  }
})

// BackgroundPaths animates SVG paths via GSAP (`getTotalLength`), which jsdom
// does not implement — stub it out; it has no bearing on route registration.
vi.mock('@/components/ui/BackgroundPaths', () => ({
  BackgroundPaths: () => null,
}))

// UpdateToast wires a periodic update check into a store; irrelevant to route
// registration and it would keep timers alive in jsdom.
vi.mock('@/components/ui/UpdateToast', () => ({
  UpdateToast: () => null,
}))

// jsdom does not implement matchMedia; the login page reads it for theme.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const mockedMe = vi.mocked(authApi.me)

describe('App login-route registration (VITE_LOGIN_PATH wiring)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Anonymous visitor: no session to restore (401, not a network failure).
    mockedMe.mockRejectedValue(new ApiError('Unauthorized', 401))
  })

  it('mounts the login form on the configured LOGIN_ROUTE', async () => {
    if (!LOGIN_PATH) {
      // Route is intentionally not registered without VITE_LOGIN_PATH —
      // nothing to assert, and no configured value appears in output.
      expect(LOGIN_ROUTE).toBe('/register')
      return
    }
    render(
      <MemoryRouter initialEntries={[LOGIN_ROUTE]}>
        <App />
      </MemoryRouter>
    )
    expect(await screen.findByPlaceholderText('admin@example.com')).toBeInTheDocument()
  })

  it('does not mount the login form on an unrelated path (wildcard → 404 page)', async () => {
    render(
      <MemoryRouter initialEntries={['/definitely-not-a-login-route']}>
        <App />
      </MemoryRouter>
    )
    expect(await screen.findByText(/Page not found/i)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('admin@example.com')).not.toBeInTheDocument()
  })
})
