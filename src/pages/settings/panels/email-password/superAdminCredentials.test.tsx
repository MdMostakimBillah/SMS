import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChangeEmailTab } from './ChangeEmailTab'
import { ChangePasswordTab } from './ChangePasswordTab'
import { authApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  authApi: {
    checkEmail: vi.fn().mockResolvedValue({ available: true }),
    getSuperAdmin: vi.fn().mockResolvedValue({ email: 'superadmin@edutech.bd', hasCustomPassword: true }),
    updateSuperAdmin: vi.fn().mockResolvedValue({ success: true, email: 'newadmin@edutech.bd' }),
    updateCredentials: vi.fn().mockResolvedValue({ success: true }),
  },
}))

vi.mock('@/lib/emailService', () => ({
  sendVerificationCode: vi.fn().mockResolvedValue({ success: true, simulated: true }),
  sendEmailChangeNotification: vi.fn().mockResolvedValue({ success: true }),
  sendPasswordNotification: vi.fn().mockResolvedValue({ success: true }),
}))

describe('Super Admin Email and Password change in Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows super admin to update email with current password authentication', async () => {
    const onEmailUpdated = vi.fn()

    render(
      <ChangeEmailTab
        isBn={false}
        currentEmail="superadmin@edutech.bd"
        onEmailUpdated={onEmailUpdated}
        isSuperAdmin={true}
      />
    )

    // Enter new email
    const emailInput = screen.getByPlaceholderText('new-email@example.com')
    fireEvent.change(emailInput, { target: { value: 'newadmin@edutech.bd' } })

    // Enter current password
    const passwordInput = screen.getByPlaceholderText('Enter current password to confirm')
    fireEvent.change(passwordInput, { target: { value: 'CurrentSuperSecret123!' } })

    // Save button should be enabled because current password is provided
    const saveButton = screen.getByRole('button', { name: /Save New Email/i })
    expect(saveButton).not.toBeDisabled()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(authApi.updateSuperAdmin).toHaveBeenCalledWith({
        email: 'newadmin@edutech.bd',
        currentPassword: 'CurrentSuperSecret123!',
        emailVerified: false,
      })
      expect(onEmailUpdated).toHaveBeenCalledWith('newadmin@edutech.bd')
      expect(screen.getByText(/Email updated successfully!/i)).toBeInTheDocument()
    })
  })

  it('allows super admin to update password with previous password authentication', async () => {
    render(
      <ChangePasswordTab
        isBn={false}
        currentEmail="superadmin@edutech.bd"
        isSuperAdmin={true}
      />
    )

    // Fill current password
    const currentPwInput = screen.getByPlaceholderText('Enter previous password')
    fireEvent.change(currentPwInput, { target: { value: 'OldSuperSecret123!' } })

    // Fill new password (min 8 chars)
    const newPwInput = screen.getByPlaceholderText('New password (min 8 characters)')
    fireEvent.change(newPwInput, { target: { value: 'NewSuperSecret456!' } })

    // Fill confirm password
    const confirmPwInput = screen.getByPlaceholderText('Re-enter new password')
    fireEvent.change(confirmPwInput, { target: { value: 'NewSuperSecret456!' } })

    const saveButton = screen.getByRole('button', { name: /Update Password/i })
    expect(saveButton).not.toBeDisabled()
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(authApi.updateSuperAdmin).toHaveBeenCalledWith({
        password: 'NewSuperSecret456!',
        currentPassword: 'OldSuperSecret123!',
        emailVerified: false,
      })
      expect(screen.getByText(/Password changed successfully!/i)).toBeInTheDocument()
    })
  })
})
