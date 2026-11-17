import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EmailBackupSection } from './EmailBackupSection'
import { backupApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  backupApi: {
    testEmail: vi.fn(),
    sendEmailBackup: vi.fn(),
  },
}))

vi.mock('@/lib/backup', () => ({
  collectLocalStores: vi.fn().mockReturnValue({ metadata: {}, data: {} }),
}))

describe('EmailBackupSection (Proton Mail & Other Email Cloud Backup Fetcher)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly, appends domain chip, and runs test ping', async () => {
    const onEmailChange = vi.fn()
    vi.mocked(backupApi.testEmail).mockResolvedValueOnce({
      success: true,
      message: 'Connected successfully! Test ping delivered to school@proton.me.',
      email: 'school@proton.me',
    })

    render(
      <EmailBackupSection
        isBn={false}
        schoolSlug="testschool"
        schoolName="Test School"
        email="school@proton.me"
        onEmailChange={onEmailChange}
      />
    )

    expect(screen.getByText(/Email & Proton Mail Cloud Backup Fetcher/i)).toBeInTheDocument()

    // Click a domain chip
    const protonChip = screen.getByRole('button', { name: '@proton.me' })
    fireEvent.click(protonChip)
    expect(onEmailChange).toHaveBeenCalledWith('school@proton.me')

    // Click test ping
    const testBtn = screen.getByRole('button', { name: /Test Connection & Ping/i })
    fireEvent.click(testBtn)

    await waitFor(() => {
      expect(backupApi.testEmail).toHaveBeenCalledWith({ email: 'school@proton.me' })
      expect(screen.getByText(/Email backup connection successful!/i)).toBeInTheDocument()
    })
  })

  it('sends backup bundle to Proton Mail cloud destination', async () => {
    const onEmailChange = vi.fn()
    vi.mocked(backupApi.sendEmailBackup).mockResolvedValueOnce({
      success: true,
      message: 'Backup bundle successfully sent to school@proton.me!',
      details: {
        email: 'school@proton.me',
        filename: 'testschool-backup-2026.json',
        size: '14.2 KB',
        sha256: 'abc123def456',
      },
    })

    render(
      <EmailBackupSection
        isBn={false}
        schoolSlug="testschool"
        schoolName="Test School"
        email="school@proton.me"
        onEmailChange={onEmailChange}
      />
    )

    const sendBtn = screen.getByRole('button', { name: /Send Backup to Email Now/i })
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(backupApi.sendEmailBackup).toHaveBeenCalledWith({
        email: 'school@proton.me',
        schoolSlug: 'testschool',
        schoolName: 'Test School',
        clientData: { metadata: {}, data: {} },
      })
      expect(screen.getByText(/Backup bundle successfully sent to school@proton.me!/i)).toBeInTheDocument()
      expect(screen.getByText(/File: testschool-backup-2026.json/i)).toBeInTheDocument()
    })
  })
})
