import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChangeLoginPathTab } from './ChangeLoginPathTab'
import { getLoginSecret, clearLoginSecret, setLoginSecret } from '@/lib/loginPath'
import { authApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  authApi: {
    getSuperAdminLoginPath: vi.fn().mockResolvedValue({ loginPath: null }),
    updateSuperAdminLoginPath: vi.fn().mockImplementation(async (path: string) => ({ loginPath: path })),
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
      expect(screen.getByText(/Super admin login path updated and saved to database successfully/i)).toBeInTheDocument()
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

  it('generates a random secret path when clicking Generate Random', async () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const rotateBtn = screen.getByRole('button', { name: /Generate Random/i })
    fireEvent.click(rotateBtn)

    await waitFor(() => {
      expect(screen.getByText(/A new random secret login path has been generated and saved to database/i)).toBeInTheDocument()
      expect(authApi.updateSuperAdminLoginPath).toHaveBeenCalled()
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
