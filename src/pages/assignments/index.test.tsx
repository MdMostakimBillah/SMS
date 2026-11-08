import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import AssignmentPage from './index'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canView: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canDownload: () => true,
    canExport: () => true,
    canPrint: () => true,
  }),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    assignmentsApi: {
      get: vi.fn().mockImplementation(async () => ({
        assignments: useAssignmentStore.getState().assignments,
        submissions: useAssignmentStore.getState().submissions,
      })),
      update: vi.fn().mockResolvedValue({ success: true, count: 1 }),
    },
  }
})

describe('AssignmentPage Integration & LocalPC/Database Connection', () => {
  const todayStr = new Date().toISOString().split('T')[0]

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAssignmentStore.persist.clearStorage()
    useClassStore.persist.clearStorage()
    useTeacherStore.persist.clearStorage()

    useClassStore.setState({
      institution: {
        id: 'inst-1',
        name: 'Model High School',
        nameBn: 'মডেল হাই স্কুল',
        code: 'MHS-01',
        established: '2000',
        currentSession: '2026-27',
      } as any,
      classes: [
        {
          id: 'cls-1',
          name: 'Class 9',
          nameBn: '৯ম শ্রেণি',
          numericValue: 9,
          subjectIds: ['sub-1'],
          sections: [
            {
              id: 'sec-1',
              name: 'Section A',
              nameBn: 'ক শাখা',
              roomNumber: '101',
              seatQuantity: 40,
              subjectIds: ['sub-1'],
            },
          ],
        },
      ],
    })

    useTeacherStore.setState({
      teachers: [
        {
          id: 'tch-1',
          nameEn: 'Dr. John Doe',
          nameBn: 'ড. জন ডো',
          email: 'john@example.com',
          phone: '01700000000',
          subjectIds: ['sub-1'],
          active: true,
          gender: 'male',
          bloodGroup: 'A+',
          joiningDate: '2020-01-01',
          education: 'PhD',
          nationalId: '1234567890',
        } as any,
      ],
      subjects: [
        {
          id: 'sub-1',
          name: 'Mathematics',
          nameBn: 'গণিত',
          code: '101',
          classId: 'cls-1',
          type: 'theory',
          totalMarks: 100,
          passMarks: 33,
        } as any,
      ],
    })

    useAssignmentStore.setState({
      assignments: [
        {
          id: 'ASN-2026-001',
          type: 'assignment',
          title: 'Algebra Problem Set',
          titleBn: 'বীজগণিত সমস্যা',
          description: 'Solve page 40 to 45',
          descriptionBn: '',
          subjectId: 'sub-1',
          classId: 'cls-1',
          sectionId: 'sec-1',
          teacherId: 'tch-1',
          dueDate: todayStr,
          maxMarks: 50,
          status: 'active',
          attachments: [],
          createdAt: todayStr,
          updatedAt: todayStr,
        },
      ],
      submissions: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
  })

  it('renders assignment page and triggers syncFromServer on mount', async () => {
    const syncSpy = vi.spyOn(useAssignmentStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <AssignmentPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Algebra Problem Set')).toBeInTheDocument()
    })

    expect(syncSpy).toHaveBeenCalled()
  })

  it('displays the existing assignment for today and opens detail modal', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <AssignmentPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Algebra Problem Set')).toBeInTheDocument()
    })

    expect(screen.getByText(/Mathematics · Class 9-Section A · 50 marks/)).toBeInTheDocument()

    // Click the Eye button to view details
    const eyeIcon = document.querySelector('.lucide-eye')
    const eyeBtn = eyeIcon?.closest('button')
    expect(eyeBtn).toBeInTheDocument()
    await user.click(eyeBtn!)
    await waitFor(() => {
      expect(screen.getByText('Solve page 40 to 45')).toBeInTheDocument()
    })
  })

  it('works seamlessly in local_computer mode without network error', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const syncSpy = vi.spyOn(useAssignmentStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <AssignmentPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Algebra Problem Set')).toBeInTheDocument()
    })

    expect(syncSpy).toHaveBeenCalled()
  })

  it('allows opening delete confirmation and deleting an assignment', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <AssignmentPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Algebra Problem Set')).toBeInTheDocument()
    })

    // Find the delete button with trash icon
    const trashIcon = document.querySelector('.lucide-trash-2')
    const deleteBtn = trashIcon?.closest('button')
    expect(deleteBtn).toBeInTheDocument()

    await user.click(deleteBtn!)

    // Wait for DeleteConfirmDialog modal
    await waitFor(() => {
      expect(screen.getByText('Delete?')).toBeInTheDocument()
      expect(screen.getByText(/"Algebra Problem Set" will be deleted\./)).toBeInTheDocument()
    })

    // Click confirm delete button
    const confirmBtn = screen.getByRole('button', { name: /Delete|মুছুন/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(useAssignmentStore.getState().assignments).toHaveLength(0)
    })
  })
})
