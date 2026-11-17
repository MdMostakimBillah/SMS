import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChangeLoginPathTab } from './ChangeLoginPathTab'
import { getLoginSecret, clearLoginSecret, setLoginSecret } from '@/lib/loginPath'

describe('ChangeLoginPathTab component', () => {
  beforeEach(() => {
    localStorage.clear()
    clearLoginSecret()
  })

  it('renders the current active login URL', () => {
    setLoginSecret('custom-admin-vault')
    render(<ChangeLoginPathTab isBn={false} />)

    expect(screen.getByText(/Current Active Login URL/i)).toBeInTheDocument()
    expect(screen.getByText(new RegExp('custom-admin-vault'))).toBeInTheDocument()
  })

  it('validates and updates to a new custom secret path', () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'my-new-secret-path-2026' } })

    const saveBtn = screen.getByRole('button', { name: /^Save$/i })
    fireEvent.click(saveBtn)

    expect(screen.getByText(/Super admin login path updated successfully/i)).toBeInTheDocument()
    expect(getLoginSecret()).toBe('my-new-secret-path-2026')
  })

  it('rejects reserved system path like "dashboard"', () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'dashboard' } })

    const saveBtn = screen.getByRole('button', { name: /^Save$/i })
    fireEvent.click(saveBtn)

    expect(screen.getByText(/"dashboard" is a reserved system path/i)).toBeInTheDocument()
  })

  it('generates a random secret path when clicking Generate Random', () => {
    render(<ChangeLoginPathTab isBn={false} />)

    const rotateBtn = screen.getByRole('button', { name: /Generate Random/i })
    fireEvent.click(rotateBtn)

    expect(screen.getByText(/A new random secret login path has been generated/i)).toBeInTheDocument()
    expect(getLoginSecret()).not.toBe('k7m2x9pGKcj57PFE8oBj')
  })

  it('resets to default .env path when clicking Reset to .env Default', () => {
    setLoginSecret('temp-secret-path')
    render(<ChangeLoginPathTab isBn={false} />)

    const resetBtn = screen.getByRole('button', { name: /Reset to \.env Default/i })
    fireEvent.click(resetBtn)

    expect(screen.getByText(/Reset to the default \(\.env\) login path/i)).toBeInTheDocument()
    expect(localStorage.getItem('edutech_login_secret')).toBeNull()
  })
})
