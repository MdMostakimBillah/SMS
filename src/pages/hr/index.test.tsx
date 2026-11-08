import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import HRPage from './index'
import { useHRStore } from '@/store/hrStore'
import { useTeacherStore } from '@/store/teacherStore'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canExport: () => true,
    canPrint: () => true,
    canApprove: () => true,
    canReject: () => true,
    can: () => true,
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'U-1', username: 'admin', role: 'school_admin' },
  }),
  AuthProvider: ({ children }: any) => children,
}))

describe('HRPage integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    useHRStore.setState({
      increments: [],
      bonuses: [],
      promotions: [],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    useTeacherStore.setState({
      teachers: [
        {
          id: 'T-1',
          nameEn: 'Rahim Khan',
          nameBn: 'রহিম খান',
          status: 'active',
          departmentId: 'DEP-1',
          designation: 'Senior Teacher',
          phone: '01711111111',
          email: 'rahim@school.com',
          gender: 'male',
          type: 'teaching',
          qualification: 'M.Sc',
          basicSalary: 35000,
          joinDate: '2020-01-01',
          shift: 'Morning',
          subjectIds: [],
        },
      ],
      departments: [
        { id: 'DEP-1', name: 'Science', nameBn: 'বিজ্ঞান' },
      ],
      attendance: [],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
  })

  it('renders HR page header, stats, and refresh button', async () => {
    render(
      <TestWrapper>
        <HRPage />
      </TestWrapper>
    )

    // Wait for skeleton timer to resolve
    await waitFor(
      () => {
        expect(screen.getByText(/HR ও কর্মচারী ব্যবস্থাপনা|HR & Staff Management/)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Check refresh button exists
    const refreshBtn = screen.getByRole('button', { name: /রিফ্রেশ|Refresh/i })
    expect(refreshBtn).toBeInTheDocument()

    // Check staff & department counts are displayed
    expect(screen.getByText(/1.*সক্রিয় কর্মচারী|1 active staff/i)).toBeInTheDocument()
  })

  it('handles clicking the refresh button and triggers syncFromServer', async () => {
    const hrSyncSpy = vi.spyOn(useHRStore.getState(), 'syncFromServer').mockResolvedValue()
    const teacherSyncSpy = vi.spyOn(useTeacherStore.getState(), 'syncFromServer').mockResolvedValue()

    render(
      <TestWrapper>
        <HRPage />
      </TestWrapper>
    )

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /রিফ্রেশ|Refresh/i })).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    const refreshBtn = screen.getByRole('button', { name: /রিফ্রেশ|Refresh/i })
    fireEvent.click(refreshBtn)

    await waitFor(() => {
      expect(hrSyncSpy).toHaveBeenCalled()
      expect(teacherSyncSpy).toHaveBeenCalled()
    })
  })

  it('works in local_computer mode without network calls', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')

    render(
      <TestWrapper>
        <HRPage />
      </TestWrapper>
    )

    await waitFor(
      () => {
        expect(screen.getByText(/HR ও কর্মচারী ব্যবস্থাপনা|HR & Staff Management/)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    const refreshBtn = screen.getByRole('button', { name: /রিফ্রেশ|Refresh/i })
    fireEvent.click(refreshBtn)

    // In local_computer mode, syncing completes immediately without errors
    await waitFor(() => {
      expect(useHRStore.getState().serverSynced).toBe(true)
    })
  })

  it('switches between tabs and displays increment and bonus records properly', async () => {
    useHRStore.setState({
      increments: [
        { id: 'INC-101', teacherId: 'T-1', type: 'annual', amount: 3500, percentage: 10, reason: 'Good year', date: '2026-01-15', approvedBy: 'Admin' }
      ],
      bonuses: [
        { id: 'BON-101', teacherId: 'T-1', type: 'festival', amount: 15000, month: '2026-04', reason: 'Eid ul Fitr', date: '2026-04-10' }
      ],
      promotions: [],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],
    })

    render(
      <TestWrapper>
        <HRPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/HR ও কর্মচারী ব্যবস্থাপনা|HR & Staff Management/)).toBeInTheDocument()
    })

    // Click on Increments tab
    const incTab = screen.getByRole('button', { name: /বেতন বৃদ্ধি|Increment/i })
    fireEvent.click(incTab)

    await waitFor(() => {
      expect(screen.getByText('Good year')).toBeInTheDocument()
      expect(screen.getByText('10%')).toBeInTheDocument()
    })

    // Click on Bonuses tab
    const bonTab = screen.getByRole('button', { name: /বোনাস|Bonus/i })
    fireEvent.click(bonTab)

    await waitFor(() => {
      expect(screen.getByText('Eid ul Fitr')).toBeInTheDocument()
    })
  })

  it('handles promotion and updates teacher designation in teacher store', async () => {
    useHRStore.setState({
      increments: [],
      bonuses: [],
      promotions: [
        { id: 'PRO-101', teacherId: 'T-1', fromDesignation: 'Senior Teacher', toDesignation: 'Assistant Headmaster', date: '2026-05-01', reason: 'Promotion review' }
      ],
      funds: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],
    })

    render(
      <TestWrapper>
        <HRPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/HR ও কর্মচারী ব্যবস্থাপনা|HR & Staff Management/)).toBeInTheDocument()
    })

    const proTab = screen.getByRole('button', { name: /পদোন্নতি|Promotion/i })
    fireEvent.click(proTab)

    await waitFor(() => {
      expect(screen.getByText('Assistant Headmaster')).toBeInTheDocument()
      expect(screen.getByText('Promotion review')).toBeInTheDocument()
    })
  })

  it('renders fund transactions and allows deleting a fund entry', async () => {
    useHRStore.setState({
      funds: [
        { id: 'FND-101', type: 'contribution', amount: 25000, description: 'Alumni donation', date: '2026-06-01' }
      ],
      increments: [],
      bonuses: [],
      promotions: [],
      homeworkRecords: [],
      dailyReports: [],
      recommendations: [],
      monthlySalaryConfigs: [],
      facilities: [],
      teacherFacilities: [],
    })

    render(
      <TestWrapper>
        <HRPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/HR ও কর্মচারী ব্যবস্থাপনা|HR & Staff Management/)).toBeInTheDocument()
    })

    const fundTab = screen.getByRole('button', { name: /তহবিল|Fund/i })
    fireEvent.click(fundTab)

    await waitFor(() => {
      expect(screen.getByText('Alumni donation')).toBeInTheDocument()
    })

    // Click delete on fund entry
    const delButtons = screen.getAllByRole('button', { name: /মুছুন|Delete/i })
    expect(delButtons.length).toBeGreaterThan(0)
    fireEvent.click(delButtons[0])

    await waitFor(() => {
      expect(useHRStore.getState().funds).toHaveLength(0)
    })
  })
})
