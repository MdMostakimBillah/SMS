import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { authApi, ApiError, type SessionUser } from '@/lib/api'
import { saveOfflineSession, OFFLINE_SESSION_KEY } from '@/lib/offlineSession'

/**
 * Phase 7 — server-authoritative session restore & Offline-First local PC execution:
 * - /me success → server user (role/schoolId from server only) + saved offline snapshot
 * - 401 → unauthenticated, offline session cleared
 * - non-401 failure without offline snapshot → restoreFailed (connection-error state)
 * - non-401 failure WITH offline snapshot → restores offline user seamlessly
 * - retryRestore re-runs the check; logout revokes + clears offline snapshot
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
  const { user, loading, restoreFailed, sessionSource, retryRestore, error, logout } = useAuth()
  if (loading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <div data-testid="user">{user ? `${user.email}|${user.role}|${user.schoolId}` : 'anonymous'}</div>
      <div data-testid="restoreFailed">{restoreFailed ? 'yes' : 'no'}</div>
      <div data-testid="sessionSource">{sessionSource || 'none'}</div>
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

describe('AuthContext — Phase 7 server restore & Offline-First', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockedAuthApi.logout.mockResolvedValue(undefined)
  })

  it('restores the session from /api/auth/me (server identity) and saves offline snapshot', async () => {
    mockedAuthApi.me.mockResolvedValue({ user: SESSION_USER })
    renderAuth()

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('admin@school.test|school_admin|school-1')
    )
    expect(screen.getByTestId('restoreFailed')).toHaveTextContent('no')
    expect(screen.getByTestId('sessionSource')).toHaveTextContent('server')
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()

    // Offline session snapshot was saved
    const offlineRaw = localStorage.getItem(OFFLINE_SESSION_KEY)
    expect(offlineRaw).toBeTruthy()
    const parsed = JSON.parse(offlineRaw!)
    expect(parsed.user.email).toBe('admin@school.test')
  })

  it('401 = unauthenticated even with legacy localStorage identity present, clears offline snapshot', async () => {
    seedLegacyIdentity()
    saveOfflineSession({
      user: {
        id: 'u-1',
        email: 'admin@school.test',
        name: 'School Admin',
        role: 'school_admin',
        schoolId: 'school-1',
        schoolName: 'Test School',
        avatar: null,
        subdomain: null,
      },
      savedAt: Date.now(),
    })
    mockedAuthApi.me.mockRejectedValue(new ApiError('Unauthorized', 401))
    renderAuth()

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'))
    // Not a connection problem — the session simply ended.
    expect(screen.getByTestId('restoreFailed')).toHaveTextContent('no')
    // Offline snapshot was cleared
    expect(localStorage.getItem(OFFLINE_SESSION_KEY)).toBeNull()
  })

  it('non-401 failure without offline snapshot → restoreFailed, no user, no spinner', async () => {
    mockedAuthApi.me.mockRejectedValue(new TypeError('fetch failed'))
    renderAuth()

    await waitFor(() => expect(screen.getByTestId('restoreFailed')).toHaveTextContent('yes'))
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous')
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument() // no infinite spinner
  })

  it('non-401 failure WITH offline snapshot (user went offline) → restores offline session seamlessly', async () => {
    saveOfflineSession({
      user: {
        id: 'u-offline-1',
        email: 'offline-teacher@school.test',
        name: 'Offline Teacher',
        role: 'teacher',
        schoolId: 'school-offline-1',
        schoolName: 'Offline School',
        avatar: null,
        subdomain: 'offline',
      },
      savedAt: Date.now(),
    })
    mockedAuthApi.me.mockRejectedValue(new TypeError('Failed to fetch (offline)'))
    renderAuth()

    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent('offline-teacher@school.test|teacher|school-offline-1')
    )
    // No error screen!
    expect(screen.getByTestId('restoreFailed')).toHaveTextContent('no')
    expect(screen.getByTestId('sessionSource')).toHaveTextContent('offline_cache')
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
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

  it('logout revokes the server session and clears offline snapshot and user', async () => {
    mockedAuthApi.me.mockResolvedValue({ user: SESSION_USER })
    renderAuth()
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('admin@school.test'))

    expect(localStorage.getItem(OFFLINE_SESSION_KEY)).toBeTruthy()

    fireEvent.click(screen.getByText('logout'))

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'))
    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(OFFLINE_SESSION_KEY)).toBeNull()
  })
})
