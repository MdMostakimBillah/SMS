import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { authApi, type SessionUser } from '@/lib/api'
import { getOfflineSession, OFFLINE_SESSION_KEY } from '@/lib/offlineSession'

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

const MOCK_USER: SessionUser = {
  id: 'usr-offline-100',
  email: 'principal@school.edu',
  name: 'Principal Ahmed',
  role: 'school_admin',
  schoolId: 'sch-100',
  schoolName: 'Offline Test Academy',
  schoolDomain: 'academy',
  avatar: null,
}

function OfflineAppTester() {
  const { user, loading, restoreFailed, sessionSource, login, logout } = useAuth()

  if (loading) return <div data-testid="status">loading</div>

  return (
    <div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <div data-testid="user-role">{user?.role || 'none'}</div>
      <div data-testid="session-source">{sessionSource || 'none'}</div>
      <div data-testid="restore-failed">{restoreFailed ? 'yes' : 'no'}</div>
      <button
        data-testid="login-btn"
        onClick={() => void login('principal@school.edu', 'secret123')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => void logout()}>
        Logout
      </button>
    </div>
  )
}

describe('Offline-First Local PC Full Workflow Integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockedAuthApi.logout.mockResolvedValue(undefined)
  })

  it('completes the full cycle: Online Login -> Disconnect -> Offline Reload -> Online Reconnect -> Logout', async () => {
    // 1. Initial State: Unauthenticated mount online
    mockedAuthApi.me.mockResolvedValueOnce({ user: MOCK_USER })
    const { unmount } = render(
      <AuthProvider>
        <OfflineAppTester />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('principal@school.edu')
    })
    expect(screen.getByTestId('session-source')).toHaveTextContent('server')
    expect(screen.getByTestId('restore-failed')).toHaveTextContent('no')

    // Verify offline session snapshot was automatically persisted to local PC storage
    const offlineSession = getOfflineSession()
    expect(offlineSession).not.toBeNull()
    expect(offlineSession?.user.email).toBe('principal@school.edu')
    expect(offlineSession?.user.role).toBe('school_admin')

    // 2. Unmount (simulate user closing the browser or refreshing page while offline)
    unmount()

    // 3. User is now completely OFFLINE ("turned off data")
    // When the app starts, /api/auth/me fails because there is no internet connection
    mockedAuthApi.me.mockRejectedValue(new TypeError('Failed to fetch'))

    // Mount app again (simulates browser reload or opening tab offline)
    render(
      <AuthProvider>
        <OfflineAppTester />
      </AuthProvider>
    )

    // Verify the app restores seamlessly from the offline snapshot without connection error screen
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('principal@school.edu')
    })
    expect(screen.getByTestId('session-source')).toHaveTextContent('offline_cache')
    expect(screen.getByTestId('restore-failed')).toHaveTextContent('no')

    // 4. User reconnects internet ("turns data back on")
    // Background re-verification succeeds silently
    mockedAuthApi.me.mockResolvedValue({ user: MOCK_USER })
    window.dispatchEvent(new Event('online'))

    await waitFor(() => {
      expect(screen.getByTestId('session-source')).toHaveTextContent('server')
    })

    // 5. Explicit Logout: Completely wipes offline session so machine is secured
    fireEvent.click(screen.getByTestId('logout-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('none')
    })
    expect(screen.getByTestId('session-source')).toHaveTextContent('none')
    expect(localStorage.getItem(OFFLINE_SESSION_KEY)).toBeNull()
  })
})
