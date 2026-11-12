import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ForgotPasswordModal } from './ForgotPasswordModal'
import * as api from '@/lib/api'
import * as emailService from '@/lib/emailService'

describe('ForgotPasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(api.authApi, 'resetPassword').mockResolvedValue({ success: true })
    vi.spyOn(emailService, 'sendVerificationCode').mockResolvedValue({ success: true, simulated: true })
    vi.spyOn(emailService, 'sendPasswordNotification').mockResolvedValue({ success: true, simulated: true })
  })

  it('does not render when isOpen is false', () => {
    render(<ForgotPasswordModal isOpen={false} onClose={vi.fn()} isBn={false} />)
    expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
  })

  it('renders modal and handles complete reset password flow with email verification and password sent', async () => {
    const handleClose = vi.fn()
    render(<ForgotPasswordModal isOpen={true} onClose={handleClose} isBn={false} />)

    expect(screen.getByText('Reset Password')).toBeInTheDocument()

    // 1. Enter email
    const emailInput = screen.getByPlaceholderText('admin@institution.edu')
    fireEvent.change(emailInput, { target: { value: 'user@test.com' } })

    // 2. Click Send Code
    const sendCodeBtn = screen.getByRole('button', { name: /send code/i })
    fireEvent.click(sendCodeBtn)

    await waitFor(() => {
      expect(emailService.sendVerificationCode).toHaveBeenCalledWith(
        'user@test.com',
        expect.any(String),
        'password_change'
      )
    })

    // In demo mode, demo code box appears
    await waitFor(() => {
      expect(screen.getByText(/demo code:/i)).toBeInTheDocument()
    })

    // Fill OTP
    fireEvent.click(screen.getByRole('button', { name: /fill/i }))

    await waitFor(() => {
      expect(screen.getByText('Email successfully verified')).toBeInTheDocument()
    })

    // 3. Enter new password
    const newPwInput = screen.getByPlaceholderText('At least 8 characters')
    const confirmPwInput = screen.getByPlaceholderText('Re-enter password')

    fireEvent.change(newPwInput, { target: { value: 'Secret12345!' } })
    fireEvent.change(confirmPwInput, { target: { value: 'Secret12345!' } })

    // 4. Submit reset
    const submitBtn = screen.getByRole('button', { name: /reset password & send email/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(api.authApi.resetPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        newPassword: 'Secret12345!',
        emailVerified: true,
      })
      expect(emailService.sendPasswordNotification).toHaveBeenCalledWith(
        'user@test.com',
        'Secret12345!'
      )
    })

    // Success screen shown
    await waitFor(() => {
      expect(screen.getByText('Password Reset Successfully!')).toBeInTheDocument()
    })
  })
})
