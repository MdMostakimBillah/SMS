import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEffect } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import InstitutionLogin from './InstitutionLogin'
import { authApi, ApiError } from '@/lib/api'
import { browserStorageDump, makeInstitution } from '@/test-fixtures'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
    },
  }
})

// BackgroundPaths animates SVG paths via GSAP (`getTotalLength`), which jsdom
// does not implement — stub it out; it has no bearing on login behavior.
vi.mock('@/components/ui/BackgroundPaths', () => ({
  BackgroundPaths: () => null,
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

const SECRET = 'Str0ng-S3cret!'

let currentPath = ''
function LocationProbe() {
  const loc = useLocation()
  useEffect(() => {
    currentPath = loc.pathname
  }, [loc])
  return null
}

function fillAndSubmit(container: HTMLElement) {
  const email = container.querySelector('input[autocomplete="username"]') as HTMLInputElement
  const password = container.querySelector('input[autocomplete="current-password"]') as HTMLInputElement
  expect(email).toBeTruthy()
  expect(password).toBeTruthy()
  fireEvent.change(email, { target: { value: 'admin@demo.bd' } })
  fireEvent.change(password, { target: { value: SECRET } })
  const form = container.querySelector('form') as HTMLFormElement
  expect(form).toBeTruthy()
  fireEvent.submit(form)
}

/**
 * Phase 6 — login workflow regression tests.
 *
 * `handleLogin` runs its outcome after a deliberate 1s UI delay, so every
 * assertion waits with a generous timeout. Real timers are used on purpose.
 */
describe('InstitutionLogin credential handling (Phase 6)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    currentPath = ''
  })

  it('institution context fails closed without calling the API and writes no credentials', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/i/testschool/login']}>
        <LocationProbe />
        <InstitutionLogin subdomain="testschool" institution={makeInstitution()} />
      </MemoryRouter>
    )

    fillAndSubmit(container)

    // Fail-closed message replaces the removed local password comparison.
    await screen.findByText(/now requires a server-backed account/i, {}, { timeout: 4000 })

    // No browser-side credential check happened…
    expect(authApi.login).not.toHaveBeenCalled()
    // …and no password was written to any browser storage.
    expect(browserStorageDump()).not.toContain(SECRET)
    expect(currentPath).toBe('/i/testschool/login')
  })

  it('server-side rejection keeps the invalid-credentials message and attempt counter', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError('Unauthorized', 401))

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LocationProbe />
        <InstitutionLogin institution={makeInstitution()} />
      </MemoryRouter>
    )

    fillAndSubmit(container)

    await screen.findByText(/Invalid credentials\. 4 attempt\(s\) remaining/i, {}, { timeout: 4000 })

    expect(authApi.login).toHaveBeenCalledTimes(1)
    const attempts = JSON.parse(localStorage.getItem('edutech_login_attempts') || '{}')
    expect(attempts.count).toBe(1)
    expect(browserStorageDump()).not.toContain(SECRET)
  })

  it('superadmin login still works through the established backend flow', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'u-1',
        email: 'root@edutech.bd',
        name: 'Root',
        role: 'super_admin',
        schoolId: null,
        schoolName: null,
        avatar: null,
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <LocationProbe />
        <InstitutionLogin institution={makeInstitution()} />
      </MemoryRouter>
    )

    fillAndSubmit(container)

    await waitFor(() => expect(currentPath).toBe('/super-admin/admin/dashboard'), { timeout: 4000 })
    expect(authApi.login).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('edutech_login_attempts')).toBeNull()
    expect(browserStorageDump()).not.toContain(SECRET)
  })
})
