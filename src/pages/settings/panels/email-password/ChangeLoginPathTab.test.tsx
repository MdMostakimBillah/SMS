import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChangeLoginPathTab } from './ChangeLoginPathTab'
import { getLoginSecret, clearLoginSecret, setLoginSecret } from '@/lib/loginPath'
import { authApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  authApi: {
    getSuperAdminLoginPath: vi.fn().mockResolvedValue({ loginPath: null }),
    updateSuperAdminLoginPath: vi.fn().mockImplementation(async (path: string) => ({
      success: true,
      loginPath: path,
      envSynced: true,
      envSyncStatus: 'synced',
    })),
    resetSuperAdminLoginPath: vi.fn().mockResolvedValue({ loginPath: 'k7m2x9pGKcj57PFE8oBj' }),
  },
}))

describe('ChangeLoginPathTab component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    clearLoginSecret()
  })

  it('renders the current active login URL', () => {
    setLoginSecret('custom-admin-vault')
    render(<ChangeLoginPathTab isBn={false} />)

    expect(screen.getByText(/Current Active Login URL/i)).toBeInTheDocument()
    expect(screen.getByText(new RegExp('custom-admin-vault'))).toBeInTheDocument()
  })

  it('validates and updates to a new custom secret path', async () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'my-new-secret-path-2026' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/Super admin login path saved securely to encrypted database and updated in \.env\./i)).toBeInTheDocument()
      expect(getLoginSecret()).toBe('my-new-secret-path-2026')
      expect(authApi.updateSuperAdminLoginPath).toHaveBeenCalledWith('my-new-secret-path-2026')
    })
  })

  it('rejects reserved system path like "dashboard"', () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'dashboard' } })

    const form = input.closest('form')!
    fireEvent.submit(form)

    expect(screen.getByText(/"dashboard" is a reserved system path/i)).toBeInTheDocument()
  })

  it('generates a random secret path into the input and saves it when clicking Save', async () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const rotateBtn = screen.getByRole('button', { name: /Generate Random/i })
    fireEvent.click(rotateBtn)

    const input = screen.getByRole('textbox') as HTMLInputElement
    const generated = input.value
    expect(generated).toMatch(/^[A-Za-z0-9]{20}$/)
    // Must wait for explicit Save rather than auto-overwriting immediately
    expect(authApi.updateSuperAdminLoginPath).not.toHaveBeenCalled()

    const saveBtn = screen.getByRole('button', { name: /^Save$/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(screen.getByText(/Super admin login path saved securely to encrypted database and updated in \.env\./i)).toBeInTheDocument()
      expect(authApi.updateSuperAdminLoginPath).toHaveBeenCalledWith(generated)
    })
  })

  it('resets to default .env path when clicking Reset to .env Default', async () => {
    setLoginSecret('temp-secret-path')
    render(<ChangeLoginPathTab isBn={false} />)

    const resetBtn = screen.getByRole('button', { name: /Reset to \.env Default/i })
    fireEvent.click(resetBtn)

    await waitFor(() => {
      expect(screen.getByText(/Reset to the default \(\.env\) login path successfully/i)).toBeInTheDocument()
      expect(localStorage.getItem('edutech_login_secret')).toBeNull()
      expect(authApi.resetSuperAdminLoginPath).toHaveBeenCalled()
    })
  })
})
