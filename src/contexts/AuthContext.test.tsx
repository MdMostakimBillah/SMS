import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { authApi, ApiError, type SessionUser } from '@/lib/api'

/**
 * Phase 7 — server-authoritative session restore:
 * - /me success → server user (role/schoolId from server only)
 * - 401 → unauthenticated, even when legacy localStorage identity exists
 * - non-401 failure → restoreFailed (connection-error state), never a local
 *   identity grant and never an infinite spinner
 * - retryRestore re-runs the check; logout revokes + clears
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

const mockedAuthApi = vi.mocked(authApi)

const SESSION_USER: SessionUser = {
  id: 'u-1',
  email: 'admin@school.test',
  name: 'School Admin',
  role: 'school_admin',
  schoolId: 'school-1',
  schoolName: 'Test School',
  avatar: null,
}

function Probe() {
  const { user, loading, restoreFailed, retryRestore, error, logout } = useAuth()
  if (loading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <div data-testid="user">{user ? `${user.email}|${user.role}|${user.schoolId}` : 'anonymous'}</div>
      <div data-testid="restoreFailed">{restoreFailed ? 'yes' : 'no'}</div>
      {error && <div data-testid="error">{error}</div>}
      <button onClick={retryRestore}>retry-restore</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  )
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
}

/** Legacy local identity that the old code used to restore from. */
function seedLegacyIdentity() {
  const legacy = JSON.stringify({
    email: 'legacy-admin@old.local',
    role: 'admin',
    name: 'Legacy Admin',
    institutionId: 'INST-1',
    subdomain: 'old',
    loginTimestamp: Date.now(),
  })
  localStorage.setItem('edutech_current_user', legacy)
  localStorage.setItem('edutech_user', legacy)
}

describe('AuthContext — Phase 7 server restore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockedAuthApi.logout.mockResolvedValue(undefined)
  })

  it('restores the session from /api/auth/me (server identity)', async () => {
    mockedAuthApi.me.mockResolvedValue({ user: SESSION_USER })
    renderAuth()

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('admin@school.test|school_admin|school-1')
    )
    expect(screen.getByTestId('restoreFailed')).toHaveTextContent('no')
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
  })

  it('401 = unauthenticated even with legacy localStorage identity present', async () => {
    seedLegacyIdentity()
    mockedAuthApi.me.mockRejectedValue(new ApiError('Unauthorized', 401))
    renderAuth()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'))
    // Not a connection problem — the session simply ended.
    expect(screen.getByTestId('restoreFailed')).toHaveTextContent('no')
    // Legacy keys are never consulted (and never grant a user object).
    expect(JSON.parse(localStorage.getItem('edutech_current_user')!).email).toBe('legacy-admin@old.local')
  })

  it('non-401 failure (server unreachable) → restoreFailed, no user, no spinner', async () => {
    mockedAuthApi.me.mockRejectedValue(new TypeError('fetch failed'))
    renderAuth()

    await waitFor(() => expect(screen.getByTestId('restoreFailed')).toHaveTextContent('yes'))
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument() // no infinite spinner
  })

  it('retryRestore re-runs /me and picks up a recovered session', async () => {
    mockedAuthApi.me.mockRejectedValueOnce(new TypeError('fetch failed'))
    renderAuth()

    await waitFor(() => expect(screen.getByTestId('restoreFailed')).toHaveTextContent('yes'))

    mockedAuthApi.me.mockResolvedValueOnce({ user: SESSION_USER })
    fireEvent.click(screen.getByText('retry-restore'))

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('admin@school.test|school_admin|school-1')
    )
    expect(screen.getByTestId('restoreFailed')).toHaveTextContent('no')
    expect(mockedAuthApi.me).toHaveBeenCalledTimes(2)
  })

  it('logout revokes the server session and clears the user', async () => {
    mockedAuthApi.me.mockResolvedValue({ user: SESSION_USER })
    renderAuth()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin@school.test'))

    fireEvent.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'))
    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1)
  })
})
