import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TestWrapper } from '@/test-wrapper'
import ExamDashboard from './index'
import { useExamStore } from '@/store/examStore'
import { useClassStore } from '@/store/classStore'
import { examsApi } from '@/lib/api'

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

describe('ExamDashboard integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    useExamStore.persist.clearStorage()
    useExamStore.setState({
      examConfigs: [
        {
          id: 'EXAM-1',
          name: 'Final Examination 2026',
          nameBn: 'বার্ষিক পরীক্ষা ২০২৬',
          type: 'final',
          session: '2026',
          startDate: '2026-11-15',
          endDate: '2026-11-30',
          isActive: true,
          isPublished: false,
          publishedAt: null,
          publishedClasses: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      subjectMarkConfigs: [],
      studentMarks: [],
      routines: [],
      rooms: [],
      seatPlans: [],
      invigilators: [],
      attendances: [],
      markAdjustments: [],
      omrConfigs: [],
      omrTemplates: [],
      extraMarks: [],
      extraMarkTypes: [],
      marksheetConfigs: [],
      generalAbilities: [],
      gradeScales: [],
      workingDays: [],
      promotions: [],
      cumulativeSheets: [],
      marksEntryStatuses: [],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    useClassStore.setState({
      institution: {
        id: 'INST-1',
        name: 'Demo School',
        nameBn: 'ডেমো স্কুল',
        code: '1234',
        currentSession: '2026',
        sessions: ['2026'],
      } as any,
    })
  })

  it('renders exam dashboard header, active exam badge, and refresh button', async () => {
    render(
      <TestWrapper>
        <ExamDashboard />
      </TestWrapper>
    )

    // Wait for skeleton timer to resolve
    await waitFor(
      () => {
        expect(screen.getByText(/পরীক্ষা ও ফলাফল ব্যবস্থাপনা|Examination & Results/)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Check refresh button exists
    const refreshBtn = screen.getByRole('button', { name: /রিফ্রেশ|Refresh/i })
    expect(refreshBtn).toBeInTheDocument()

    // Check active exam is shown
    expect(screen.getByText(/Final Examination 2026|বার্ষিক পরীক্ষা ২০২৬/)).toBeInTheDocument()
  })

  it('clicking refresh button invokes syncFromServer', async () => {
    const syncSpy = vi.spyOn(useExamStore.getState(), 'syncFromServer').mockResolvedValue(undefined)

    render(
      <TestWrapper>
        <ExamDashboard />
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

    expect(syncSpy).toHaveBeenCalled()
  })

  it('bypasses remote sync when local_computer mode is active', async () => {
    localStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(examsApi, 'get')

    render(
      <TestWrapper>
        <ExamDashboard />
      </TestWrapper>
    )

    await waitFor(
      () => {
        expect(screen.getByText(/পরীক্ষা ও ফলাফল ব্যবস্থাপনা|Examination & Results/)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    expect(getSpy).not.toHaveBeenCalled()
  })
})
