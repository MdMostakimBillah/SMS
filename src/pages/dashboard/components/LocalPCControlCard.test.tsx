import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { LocalPCControlCard } from './LocalPCControlCard'
import * as backupModule from '@/lib/backup'
import * as vaultModule from '@/lib/vault/vault'

vi.mock('@/hooks/useVault', () => ({
  useVault: () => ({
    supported: true,
    connected: true,
    needsReconnect: false,
    folderName: 'School_Data_Folder',
    busy: false,
    lastSyncAt: Date.now(),
    error: null,
    connect: vi.fn(),
    reconnect: vi.fn(),
    syncNow: vi.fn(),
  }),
}))

vi.mock('@/hooks/useDeviceStorage', () => ({
  useDeviceStorage: () => ({
    stats: {
      usedFormatted: '12.4 MB',
      totalFormatted: '500 GB',
      percentage: 2,
    },
  }),
}))

describe('LocalPCControlCard', () => {
  const defaultProps = {
    isBn: false,
    isMobile: false,
    storageMode: 'local_computer' as const,
    schoolSlug: 'model-school',
    schoolName: 'Model High School',
    totalRecordsCount: 150,
    isRefreshing: false,
    onSyncDatabase: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Local PC & Database Hub information correctly', () => {
    render(<LocalPCControlCard {...defaultProps} />)
    expect(screen.getByText('Local PC & Database Hub')).toBeInTheDocument()
    expect(screen.getByText('150 records')).toBeInTheDocument()
  })

  it('supports downloading local backup', async () => {
    const downloadSpy = vi.spyOn(backupModule, 'downloadLocalBackup').mockResolvedValue()

    render(<LocalPCControlCard {...defaultProps} />)

    const backupBtn = screen.getByText(/Download Backup|লোকাল ব্যাকআপ/i)
    await act(async () => {
      fireEvent.click(backupBtn)
    })

    expect(downloadSpy).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/Local backup.*saved!|লোকাল ব্যাকআপ.*সংরক্ষিত/i)).toBeInTheDocument()
    })
  })

  it('triggers local vault sync when clicking sync folder', async () => {
    const vaultSyncSpy = vi.spyOn(vaultModule, 'vaultSyncNow').mockResolvedValue()

    render(<LocalPCControlCard {...defaultProps} />)

    const syncFolderBtn = screen.getByText(/Sync Folder|ফোল্ডার সিঙ্ক/i)
    await act(async () => {
      fireEvent.click(syncFolderBtn)
    })

    expect(vaultSyncSpy).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/Local PC folder sync complete!|লোকাল পিসি ফোল্ডার সিঙ্ক সম্পন্ন!/i)).toBeInTheDocument()
    })
  })

  it('calls onSyncDatabase when clicking DB Sync button', () => {
    render(<LocalPCControlCard {...defaultProps} />)

    const syncBtn = screen.getByText(/Sync DB|সিঙ্ক করুন/i)
    fireEvent.click(syncBtn)

    expect(defaultProps.onSyncDatabase).toHaveBeenCalled()
  })
})
