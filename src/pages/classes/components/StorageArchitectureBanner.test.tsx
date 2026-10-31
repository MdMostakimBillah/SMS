import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StorageArchitectureBanner } from './StorageArchitectureBanner'
import { useClassStore } from '@/store/classStore'

describe('StorageArchitectureBanner', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('renders Provider Cloud Database banner and triggers manual sync', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'cloud')
    const syncToServerSpy = vi.spyOn(useClassStore.getState(), 'syncToServer').mockResolvedValue()

    render(<StorageArchitectureBanner isBn={false} />)

    expect(screen.getByText('Provider Cloud Database')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL database connected & auto-synced')).toBeInTheDocument()

    const syncBtn = screen.getByText('Sync Database')
    expect(syncBtn).toBeInTheDocument()

    fireEvent.click(syncBtn)
    await waitFor(() => {
      expect(syncToServerSpy).toHaveBeenCalled()
    })
    expect(await screen.findByText('Synced')).toBeInTheDocument()
  })

  it('renders Local PC Storage banner and triggers JSON export', () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName)
      if (tagName === 'a') {
        el.click = clickSpy
      }
      return el
    })

    render(
      <StorageArchitectureBanner
        isBn={false}
        currentSession="2025-26"
        classes={[{ id: 'CLS-01', name: 'Class 1', nameBn: '১ম শ্রেণি', startTime: '08:00', endTime: '13:00', sections: [], subjectIds: [], createdAt: '', updatedAt: '' }]}
        routines={[{ classId: 'CLS-01', sectionId: 'SEC-A', periodDuration: 40, weekendDays: [5], periods: [] }]}
      />
    )

    expect(screen.getByText('Local PC Storage')).toBeInTheDocument()
    expect(screen.getByText('Offline first — data stored locally on your device')).toBeInTheDocument()

    const exportBtn = screen.getByText('Export JSON to PC')
    expect(exportBtn).toBeInTheDocument()

    fireEvent.click(exportBtn)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('renders Custom VPS Server banner and displays VPS API URL', () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_server')
    sessionStorage.setItem('edutech_server_url', 'https://vps.edutech.bd')

    render(<StorageArchitectureBanner isBn={false} serverUrl="https://vps.edutech.bd" />)

    expect(screen.getByText('Custom VPS Server')).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/vps\.edutech\.bd/)).toBeInTheDocument()
    expect(screen.getByText('Sync VPS')).toBeInTheDocument()
  })
})
