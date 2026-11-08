import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OthersIncomePage from './index'
import { useOthersIncomeStore } from '@/store/othersIncomeStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { othersIncomeApi } from '@/lib/api'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
  }),
}))

describe('OthersIncomePage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useOthersIncomeStore.setState({
      categories: [
        {
          id: 'OIC-101',
          name: 'Day Care',
          nameBn: 'ডে কেয়ার',
          amount: 500,
          type: 'monthly',
          description: 'Day care facilities',
          descriptionBn: 'ডে কেয়ার সুবিধা',
          isActive: true,
          createdAt: '2026-11-07',
        },
      ],
      assignments: [
        {
          id: 'OIA-101',
          categoryId: 'OIC-101',
          studentId: 'STU-001',
          months: [10],
          academicYear: '2025-26',
          assignedDate: '2026-11-07',
          isActive: true,
        },
      ],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    useAdmissionStore.setState({
      students: [
        {
          id: 'STU-001',
          nameEn: 'Fahim Mia',
          nameBn: 'ফাহিম মিয়া',
          class: 'HSC',
          section: 'Humanity',
          roll: '77',
          isActive: true,
        } as any,
      ],
    })
    vi.restoreAllMocks()
  })

  it('renders header, stat cards, and types tab with categories data', async () => {
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Day Care')).toBeInTheDocument()
    })

    expect(screen.getByText('Others Income')).toBeInTheDocument()
    expect(screen.getByText('Total Categories')).toBeInTheDocument()
    expect(screen.getByText('Active Categories')).toBeInTheDocument()
    expect(screen.getByText('Monthly Income')).toBeInTheDocument()
  })

  it('switches between Categories and Assignments tabs', async () => {
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Day Care')).toBeInTheDocument()
    })

    const assignTabBtn = screen.getByRole('button', { name: /assignments/i })
    fireEvent.click(assignTabBtn)

    await waitFor(() => {
      expect(screen.getByText('Fahim Mia')).toBeInTheDocument()
    })
  })

  it('triggers syncFromServer when clicking the Refresh button in database mode', async () => {
    const syncSpy = vi.spyOn(useOthersIncomeStore.getState(), 'syncFromServer').mockImplementation(async () => {})
    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Day Care')).toBeInTheDocument()
    })

    const refreshBtn = screen.getByRole('button', { name: /refresh|রিফ্রেশ/i })
    expect(refreshBtn).toBeInTheDocument()
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalled()
    })
  })

  it('runs properly in Local PC mode without requiring backend database', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(othersIncomeApi, 'get')

    render(<OthersIncomePage />)

    await waitFor(() => {
      expect(screen.getByText('Day Care')).toBeInTheDocument()
    })

    expect(getSpy).not.toHaveBeenCalled()
  })
})
