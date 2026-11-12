import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmailPasswordPanel } from './EmailPassword'
import * as api from '@/lib/api'
import * as emailService from '@/lib/emailService'

// Mock AuthContext
const mockUpdateCurrentUser = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'current@test.com',
      role: 'school_admin',
      name: 'Admin User',
    },
    updateCurrentUser: mockUpdateCurrentUser,
  }),
}))

describe('EmailPasswordPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(api.authApi, 'checkEmail').mockResolvedValue({ available: true })
    vi.spyOn(api.authApi, 'updateCredentials').mockResolvedValue({ success: true })
    vi.spyOn(emailService, 'sendVerificationCode').mockResolvedValue({ success: true, simulated: true })
    vi.spyOn(emailService, 'sendPasswordNotification').mockResolvedValue({ success: true, simulated: true })
    vi.spyOn(emailService, 'sendEmailChangeNotification').mockResolvedValue({ success: true, simulated: true })
  })

  it('renders with Email and Password tabs', () => {
    render(<EmailPasswordPanel isBn={false} onBack={vi.fn()} />)

    expect(screen.getByText('Change Email')).toBeInTheDocument()
    expect(screen.getByText('Change Password')).toBeInTheDocument()
    expect(screen.getByText('Current Email')).toBeInTheDocument()
    expect(screen.getByText('current@test.com')).toBeInTheDocument()
  })

  it('allows switching to Change Password tab and changing password with previous password', async () => {
    render(<EmailPasswordPanel isBn={false} onBack={vi.fn()} />)

    // Switch to password tab
    fireEvent.click(screen.getByText('Change Password'))

    expect(screen.getByPlaceholderText('Enter previous password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('New password (min 8 characters)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Re-enter new password')).toBeInTheDocument()

    // Enter credentials
    fireEvent.change(screen.getByPlaceholderText('Enter previous password'), {
      target: { value: 'OldPassword123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 characters)'), {
      target: { value: 'NewPassword123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'NewPassword123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /update password/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.authApi.updateCredentials).toHaveBeenCalledWith({
        password: 'NewPassword123!',
        currentPassword: 'OldPassword123!',
        emailVerified: false,
      })
    })

    // Confirms password notification email is sent
    await waitFor(() => {
      expect(emailService.sendPasswordNotification).toHaveBeenCalledWith(
        'current@test.com',
        'NewPassword123!'
      )
    })
  })

  it('shows error when new passwords do not match', async () => {
    render(<EmailPasswordPanel isBn={false} onBack={vi.fn()} />)

    fireEvent.click(screen.getByText('Change Password'))

    fireEvent.change(screen.getByPlaceholderText('Enter previous password'), {
      target: { value: 'OldPassword123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 characters)'), {
      target: { value: 'NewPassword123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'DifferentPassword!' },
    })

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    const submitBtn = screen.getByRole('button', { name: /update password/i })
    expect(submitBtn).toBeDisabled()
  })

  it('supports email verification code flow to change email', async () => {
    render(<EmailPasswordPanel isBn={false} onBack={vi.fn()} />)

    const newEmailInput = screen.getByPlaceholderText('new-email@example.com')
    fireEvent.change(newEmailInput, { target: { value: 'updated@test.com' } })

    const sendCodeBtn = screen.getByRole('button', { name: /send code/i })
    expect(sendCodeBtn).not.toBeDisabled()

    fireEvent.click(sendCodeBtn)

    await waitFor(() => {
      expect(api.authApi.checkEmail).toHaveBeenCalledWith('updated@test.com')
      expect(emailService.sendVerificationCode).toHaveBeenCalled()
    })

    // In demo mode, demo code box appears
    await waitFor(() => {
      expect(screen.getByText(/demo verification code/i)).toBeInTheDocument()
    })

    // Click Auto Fill to simulate entering correct OTP
    fireEvent.click(screen.getByRole('button', { name: /auto fill/i }))

    await waitFor(() => {
      expect(screen.getByText('New email verified successfully')).toBeInTheDocument()
    })

    // Enter current password to authorize email change
    const currentPwInput = screen.getByPlaceholderText(/Enter current password to confirm/i)
    fireEvent.change(currentPwInput, { target: { value: 'MySecretPassword123!' } })

    const saveBtn = screen.getByRole('button', { name: /save new email/i })
    expect(saveBtn).not.toBeDisabled()

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(api.authApi.updateCredentials).toHaveBeenCalledWith({
        email: 'updated@test.com',
        currentPassword: 'MySecretPassword123!',
        emailVerified: true,
      })
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ email: 'updated@test.com' })
    })
  })

  it('supports changing email using email verification without providing current password', async () => {
    render(<EmailPasswordPanel isBn={false} onBack={vi.fn()} />)

    const newEmailInput = screen.getByPlaceholderText('new-email@example.com')
    fireEvent.change(newEmailInput, { target: { value: 'no-password@test.com' } })

    const sendCodeBtn = screen.getByRole('button', { name: /send code/i })
    fireEvent.click(sendCodeBtn)

    await waitFor(() => {
      expect(screen.getByText(/demo verification code/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /auto fill/i }))

    await waitFor(() => {
      expect(screen.getByText('New email verified successfully')).toBeInTheDocument()
    })

    // Do NOT enter current password — save button should be enabled because email is verified
    const saveBtn = screen.getByRole('button', { name: /save new email/i })
    expect(saveBtn).not.toBeDisabled()

    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(api.authApi.updateCredentials).toHaveBeenCalledWith({
        email: 'no-password@test.com',
        currentPassword: undefined,
        emailVerified: true,
      })
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith({ email: 'no-password@test.com' })
    })
  })

  it('supports changing password using email verification flow and sends password to email', async () => {
    render(<EmailPasswordPanel isBn={false} onBack={vi.fn()} />)

    // Switch to password tab
    fireEvent.click(screen.getByText('Change Password'))

    // Switch method to Email Verification
    fireEvent.click(screen.getByRole('button', { name: /email verification/i }))

    // Send code button in the verification box
    const sendOtpBtn = screen.getByRole('button', { name: /send code/i })
    fireEvent.click(sendOtpBtn)

    await waitFor(() => {
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        'current@test.com',
        expect.any(String),
        'password_change'
      )
      expect(screen.getByText(/demo code:/i)).toBeInTheDocument()
    })

    // Click Auto Fill to verify OTP
    fireEvent.click(screen.getByRole('button', { name: /auto fill/i }))

    await waitFor(() => {
      expect(screen.getByText(/email successfully verified/i)).toBeInTheDocument()
    })

    // Enter new password and confirm (no previous password entered!)
    fireEvent.change(screen.getByPlaceholderText('New password (min 8 characters)'), {
      target: { value: 'BrandNewPassword123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('Re-enter new password'), {
      target: { value: 'BrandNewPassword123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /update password/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.authApi.updateCredentials).toHaveBeenCalledWith({
        password: 'BrandNewPassword123!',
        currentPassword: undefined,
        emailVerified: true,
      })
      expect(emailService.sendPasswordNotification).toHaveBeenCalledWith(
        'current@test.com',
        'BrandNewPassword123!'
      )
    })
  })
})
