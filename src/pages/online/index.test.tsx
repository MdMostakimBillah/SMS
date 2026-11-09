import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import OnlineClassesPage from './index'
import { useOnlineStore } from '@/store/onlineStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canView: () => true,
    canRead: () => true,
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
  }),
}))

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    onlineClassesApi: {
      get: vi.fn().mockImplementation(async () => ({
        classes: useOnlineStore.getState().classes,
      })),
      update: vi.fn().mockResolvedValue({ success: true, count: 1 }),
    },
  }
})

describe('OnlineClassesPage Integration & Local PC / Connection', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    mockNavigate.mockReset()
    useOnlineStore.persist.clearStorage()
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

    useOnlineStore.setState({
      classes: [
        {
          id: 'OC-001',
          title: 'Physics Mechanics Live',
          titleBn: 'পদার্থবিজ্ঞান বলবিদ্যা',
          description: 'Newtonian Laws',
          descriptionBn: '',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          teacherId: 'tch-1',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          platform: 'youtube',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          scheduledAt: '2026-11-10T10:00',
          status: 'live',
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'OC-002',
          title: 'Chemistry Organic Recording',
          titleBn: 'রসায়ন জৈব যৌগ',
          description: 'Alkanes and Alkenes',
          descriptionBn: '',
          classId: 'cls-1',
          sectionId: 'sec-1',
          subjectId: 'sub-1',
          teacherId: 'tch-1',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
          platform: 'youtube',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          scheduledAt: '2026-11-09T10:00',
          status: 'ended',
          createdBy: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
  })

  it('renders online class page and triggers syncFromServer on mount', async () => {
    const syncSpy = vi.spyOn(useOnlineStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <OnlineClassesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Physics Mechanics Live')).toBeInTheDocument()
    })

    expect(syncSpy).toHaveBeenCalled()
    expect(screen.getByText(/1 live now/i)).toBeInTheDocument()
  })

  it('displays navigation chain breadcrumbs and handles back button click', async () => {
    const user = userEvent.setup()
    localStorage.setItem(
      'edutech_navChain',
      JSON.stringify([{ path: '/classes', label: 'Classes' }])
    )
    sessionStorage.setItem('edutech_lastRedirect', String(Date.now()))

    render(
      <TestWrapper>
        <OnlineClassesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Classes')).toBeInTheDocument()
    })

    const backButton = screen.getByRole('button', { name: /Back|ফিরে যান/i })
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/classes')
  })

  it('works seamlessly in local_computer mode and displays Local PC Storage badge', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const syncSpy = vi.spyOn(useOnlineStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <OnlineClassesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Physics Mechanics Live')).toBeInTheDocument()
      expect(screen.getByText(/Local PC Storage|লোকাল পিসি স্টোরেজ/i)).toBeInTheDocument()
    })

    expect(syncSpy).toHaveBeenCalled()
    expect(useOnlineStore.getState().serverSynced).toBe(true)
  })

  it('switches between Live Now and Recordings tabs', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <OnlineClassesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Physics Mechanics Live')).toBeInTheDocument()
    })

    // Click recordings tab
    const recTab = screen.getByRole('button', { name: /Recordings|রেকর্ডিং/i })
    await user.click(recTab)

    await waitFor(() => {
      expect(screen.getByText('Chemistry Organic Recording')).toBeInTheDocument()
    })
  })

  it('opens video player modal when clicking a video card', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <OnlineClassesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Physics Mechanics Live')).toBeInTheDocument()
    })

    const titleEl = screen.getByText('Physics Mechanics Live')
    const card = titleEl.closest('.group')
    expect(card).toBeInTheDocument()

    const playOverlay = card?.querySelector('.cursor-pointer')
    if (playOverlay) {
      await user.click(playOverlay)
    }

    await waitFor(() => {
      expect(screen.getByText('Newtonian Laws')).toBeInTheDocument()
    })
  })

  it('allows opening delete confirmation and deleting a class', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <OnlineClassesPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Physics Mechanics Live')).toBeInTheDocument()
    })

    const trashIcon = document.querySelector('.lucide-trash-2')
    const deleteBtn = trashIcon?.closest('button')
    expect(deleteBtn).toBeInTheDocument()

    await user.click(deleteBtn!)

    await waitFor(() => {
      expect(screen.getByText(/Delete this online class\?|এই অনলাইন ক্লাস মুছে ফেলতে চান\?/i)).toBeInTheDocument()
    })

    const confirmBtn = screen.getByRole('button', { name: /Delete|মুছুন/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      const remaining = useOnlineStore.getState().classes.filter((c) => c.status === 'live')
      expect(remaining).toHaveLength(0)
    })
  })
})
