import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEffect } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import InstitutionLogin from './InstitutionLogin'
import { authApi, ApiError } from '@/lib/api'
import { authClient } from '@/lib/auth-client'
import { browserStorageDump, makeInstitution } from '@/test-fixtures'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      sendLoginOtp: vi.fn().mockResolvedValue({ success: true, message: 'Code generated', demoCode: '123456' }),
      emailLogin: vi.fn(),
    },
  }
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      social: vi.fn().mockResolvedValue({ data: { url: 'https://accounts.google.com' } }),
    },
  },
}))

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

  it('institution context logs in through the backend API and writes no credentials to storage', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'u-inst-1',
        email: 'admin@demo.bd',
        name: 'School Admin',
        role: 'school_admin',
        schoolId: 'inst-1',
        schoolName: 'Demo School',
        avatar: null,
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/i/testschool/login']}>
        <LocationProbe />
        <InstitutionLogin subdomain="testschool" institution={makeInstitution()} />
      </MemoryRouter>
    )

    fillAndSubmit(container)

    await waitFor(() => expect(currentPath).toBe('/i/testschool/admin/dashboard'), { timeout: 4000 })
    expect(authApi.login).toHaveBeenCalledTimes(1)
    expect(browserStorageDump()).not.toContain(SECRET)
  })

  it('role-based teacher login navigates to teacher dashboard via backend', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      user: {
        id: 'u-teacher-1',
        email: 'teacher@demo.bd',
        name: 'Teacher Demo',
        role: 'teacher',
        schoolId: 'inst-1',
        schoolName: 'Demo School',
        avatar: null,
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/i/testschool/login']}>
        <LocationProbe />
        <InstitutionLogin subdomain="testschool" institution={makeInstitution()} />
      </MemoryRouter>
    )

    fillAndSubmit(container)

    await waitFor(() => expect(currentPath).toBe('/i/testschool/teacher/dashboard'), { timeout: 4000 })
    expect(authApi.login).toHaveBeenCalledTimes(1)
    expect(browserStorageDump()).not.toContain(SECRET)
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

  it('invokes authClient.signIn.social with google provider and /dashboard callback when Sign in with Google is clicked', async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
    } as any)

    render(
      <MemoryRouter initialEntries={['/i/testschool/login']}>
        <LocationProbe />
        <InstitutionLogin subdomain="testschool" institution={makeInstitution()} />
      </MemoryRouter>
    )

    const googleBtn = screen.getByRole('button', { name: /Google/i })
    expect(googleBtn).toBeTruthy()
    fireEvent.click(googleBtn)

    await waitFor(() => {
      expect(authClient.signIn.social).toHaveBeenCalledTimes(1)
      expect(authClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: `${window.location.origin}/dashboard?institution=testschool`,
      })
    })

    expect(sessionStorage.getItem('edutech_intended_institution')).toBe('testschool')
  })

  it('displays helpful configuration message when Google sign-in fails with provider not enabled', async () => {
    vi.mocked(authClient.signIn.social).mockResolvedValueOnce({
      error: { message: 'socialProvider not enabled' },
    } as any)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LocationProbe />
        <InstitutionLogin institution={makeInstitution()} />
      </MemoryRouter>
    )

    const googleBtn = screen.getByRole('button', { name: /Google/i })
    fireEvent.click(googleBtn)

    await screen.findByText(/Google Sign-In is not enabled on the server yet/i, {}, { timeout: 3000 })
  })

  it('allows other mail (Proton Mail) authentication flow through OtherMailLoginModal', async () => {
    vi.mocked(authApi.sendLoginOtp).mockResolvedValueOnce({
      success: true,
      message: 'Code generated',
      demoCode: '654321',
    })
    vi.mocked(authApi.emailLogin).mockResolvedValueOnce({
      user: {
        id: 'u-proton-1',
        email: 'admin@proton.me',
        name: 'Proton Admin',
        role: 'school_admin',
        schoolId: 'inst-1',
        schoolName: 'Demo School',
        schoolDomain: 'testschool',
        avatar: null,
      },
    })

    render(
      <MemoryRouter initialEntries={['/i/testschool/login']}>
        <LocationProbe />
        <InstitutionLogin subdomain="testschool" institution={makeInstitution()} />
      </MemoryRouter>
    )

    // Click "Sign in with Other Mail" button
    const otherMailBtn = screen.getByRole('button', { name: /Other Mail|অন্যান্য মেইল/i })
    expect(otherMailBtn).toBeTruthy()
    fireEvent.click(otherMailBtn)

    // Modal opens
    const emailInput = screen.getByPlaceholderText(/username@proton\.me/i)
    expect(emailInput).toBeTruthy()
    fireEvent.change(emailInput, { target: { value: 'admin@proton.me' } })

    // Click Send Code
    const sendBtn = screen.getByRole('button', { name: /Send Code|কোড পাঠান/i })
    fireEvent.click(sendBtn)

    // Wait for demo code or OTP input
    await waitFor(() => {
      expect(authApi.sendLoginOtp).toHaveBeenCalledWith('admin@proton.me')
    })

    // Click auto fill demo code
    const autoFillBtn = await screen.findByRole('button', { name: /Auto Fill|স্বয়ংক্রিয় পূরণ/i })
    fireEvent.click(autoFillBtn)

    // Click verify & sign in
    const verifyBtn = screen.getByRole('button', { name: /Verify & Sign In|যাচাই করুন ও সাইন ইন করুন/i })
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(authApi.emailLogin).toHaveBeenCalledWith({
        email: 'admin@proton.me',
        code: '654321',
        verified: true,
        institution: 'testschool',
      })
      expect(currentPath).toBe('/i/testschool/admin/dashboard')
    })
  })
})
