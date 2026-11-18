import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import { setLoginSecret, isValidLoginSecret } from '@/lib/loginPath'
import * as AuthContextModule from '@/contexts/AuthContext'

vi.mock('@/components/ui/BackgroundPaths', () => ({
  BackgroundPaths: () => <div data-testid="background-paths" />,
}))

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContextModule>('@/contexts/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

describe('Super Admin Login Access Hardening & Security Verification', () => {
  const mockLogin = vi.fn()
  const mockClearError = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    setLoginSecret('super-secret-vault-path')

    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: null,
      loading: false,
      restoreFailed: false,
      sessionSource: null,
      retryRestore: vi.fn(),
      updateCurrentUser: vi.fn(),
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      error: null,
      clearError: mockClearError,
      isLockedOut: false,
      lockoutRemaining: 0,
    })
  })

  it('strictly validates login secret candidate (fail closed)', () => {
    expect(isValidLoginSecret('super-secret-vault-path')).toBe(true)
    expect(isValidLoginSecret('random-unauthorized-path')).toBe(false)
    expect(isValidLoginSecret('')).toBe(false)
    expect(isValidLoginSecret(undefined)).toBe(false)
  })

  it('renders login page when accessing the correct secret route', () => {
    render(
      <MemoryRouter initialEntries={['/super-secret-vault-path']}>
        <Routes>
          <Route path="/:loginSecret" element={<LoginPage />} />
          <Route path="/register" element={<div>Register Redirect Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Super Admin Login|সুপার অ্যাডমিন লগইন/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument()
  })

  it('redirects away to /register when accessing with an invalid secret path (fail closed)', async () => {
    render(
      <MemoryRouter initialEntries={['/unauthorized-access-attempt']}>
        <Routes>
          <Route path="/:loginSecret" element={<LoginPage />} />
          <Route path="/register" element={<div>Register Redirect Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.queryByText(/Super Admin Login/i)).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Register Redirect Target')).toBeInTheDocument()
    })
  })

  it('transitions to Step 2 Security Verification when credentials require PIN challenge', async () => {
    mockLogin.mockResolvedValueOnce({
      requiresVerification: true,
      verificationToken: 'mock-jwt-challenge-token',
    })

    render(
      <MemoryRouter initialEntries={['/super-secret-vault-path']}>
        <Routes>
          <Route path="/:loginSecret" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText('admin@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /Sign In|Continue to Verification|লগইন করুন|পরবর্তী ধাপ/i })

    fireEvent.change(emailInput, { target: { value: 'admin@edutech.local' } })
    fireEvent.change(passwordInput, { target: { value: 'Admin@123456' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@edutech.local', 'Admin@123456')
    })

    // Now in Step 2: Security Verification
    await waitFor(() => {
      expect(screen.getByText(/Step 2: Security Verification|২-ধাপ নিরাপত্তা যাচাইকরণ/i)).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verify & Authenticate|যাচাই করুন ও প্রবেশ করুন/i })).toBeInTheDocument()
  })

  it('completes login when valid security PIN is submitted in step 2', async () => {
    mockLogin
      .mockResolvedValueOnce({
        requiresVerification: true,
        verificationToken: 'mock-jwt-challenge-token',
      })
      .mockResolvedValueOnce({
        id: 'super-admin-id',
        email: 'admin@edutech.local',
        role: 'super_admin',
      })

    render(
      <MemoryRouter initialEntries={['/super-secret-vault-path']}>
        <Routes>
          <Route path="/:loginSecret" element={<LoginPage />} />
          <Route path="/super-admin" element={<div>Super Admin Dashboard Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), { target: { value: 'admin@edutech.local' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Admin@123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In|Continue to Verification|লগইন করুন|পরবর্তী ধাপ/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    })

    // Step 2
    const pinInput = screen.getByPlaceholderText('••••••')
    fireEvent.change(pinInput, { target: { value: '849201' } })

    const verifyBtn = screen.getByRole('button', { name: /Verify & Authenticate|যাচাই করুন ও প্রবেশ করুন/i })
    fireEvent.click(verifyBtn)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'admin@edutech.local',
        'Admin@123456',
        '849201',
        'mock-jwt-challenge-token'
      )
    })
  })

  it('displays error and remains in verification step when invalid PIN is entered', async () => {
    mockLogin
      .mockResolvedValueOnce({
        requiresVerification: true,
        verificationToken: 'mock-jwt-challenge-token',
      })
      .mockRejectedValueOnce(new Error('Invalid security verification PIN'))

    render(
      <MemoryRouter initialEntries={['/super-secret-vault-path']}>
        <Routes>
          <Route path="/:loginSecret" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), { target: { value: 'admin@edutech.local' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Admin@123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In|Continue to Verification|লগইন করুন|পরবর্তী ধাপ/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    })

    // Step 2 with wrong PIN
    const pinInput = screen.getByPlaceholderText('••••••')
    fireEvent.change(pinInput, { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: /Verify & Authenticate|যাচাই করুন ও প্রবেশ করুন/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'admin@edutech.local',
        'Admin@123456',
        '000000',
        'mock-jwt-challenge-token'
      )
    })

    // Remains on step 2
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
  })

  it('navigates back to step 1 when clicking back/different credentials button', async () => {
    mockLogin.mockResolvedValueOnce({
      requiresVerification: true,
      verificationToken: 'mock-jwt-challenge-token',
    })

    render(
      <MemoryRouter initialEntries={['/super-secret-vault-path']}>
        <Routes>
          <Route path="/:loginSecret" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('admin@example.com'), { target: { value: 'admin@edutech.local' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Admin@123456' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In|Continue to Verification|লগইন করুন|পরবর্তী ধাপ/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
    })

    // Click back button
    const backBtn = screen.getByRole('button', { name: /Use different credentials|অন্য ক্রেডেনশিয়াল/i })
    fireEvent.click(backBtn)

    // Returns to Step 1
    await waitFor(() => {
      expect(screen.getByPlaceholderText('admin@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    })
  })
})
