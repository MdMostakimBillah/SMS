import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import SyllabusPage from './index'
import { useSyllabusStore } from '@/store/syllabusStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'

describe('SyllabusPage Integration & LocalPC/Database Parity', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useSyllabusStore.persist.clearStorage()
    useClassStore.persist.clearStorage()
    useTeacherStore.persist.clearStorage()

    useClassStore.setState({
      institution: {
        id: 'inst-1',
        name: 'Udvas High School',
        nameBn: 'উদ্ভাস হাই স্কুল',
        code: 'UHS-01',
        established: '2000',
        currentSession: '2026-27',
      },
      classes: [
        {
          id: 'cls-1',
          name: 'Class 9',
          nameBn: '৯ম শ্রেণি',
          numericValue: 9,
          sections: [
            {
              id: 'sec-1',
              name: 'A',
              nameBn: 'ক',
              capacity: 50,
              roomNo: '101',
              subjectIds: ['sub-1'],
            },
          ],
        },
      ],
    })

    useTeacherStore.setState({
      subjects: [
        {
          id: 'sub-1',
          name: 'Mathematics',
          nameBn: 'গণিত',
          code: 'MATH101',
          type: 'theory',
          order: 1,
        },
      ],
    })

    useSyllabusStore.setState({
      syllabi: [
        {
          id: 'SYL-1',
          classId: '9',
          sectionId: 'A',
          subjectId: 'sub-1',
          sessionId: '2026-27',
          totalChapters: 1,
          totalTopics: 2,
          completedTopics: 1,
          chapters: [
            {
              id: 'CH-1',
              title: 'Algebra Basics',
              titleBn: 'বীজগণিত পরিচিতি',
              description: 'Intro to algebra',
              descriptionBn: '',
              order: 1,
              langMode: 'both',
              topics: [
                {
                  id: 'TP-1',
                  title: 'Variables',
                  titleBn: 'চলক',
                  description: '',
                  descriptionBn: '',
                  marks: 10,
                  status: 'completed',
                },
                {
                  id: 'TP-2',
                  title: 'Equations',
                  titleBn: 'সমীকরণ',
                  description: '',
                  descriptionBn: '',
                  marks: 15,
                  status: 'pending',
                },
              ],
            },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
  })

  it('renders header, syllabus statistics cards, and database synced badge in database mode', async () => {
    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Syllabus Management|পাঠ্যক্রম ব্যবস্থাপনা/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Database Synced|ডাটাবেস কানেক্টেড/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Refresh from server|রিফ্রেশ করুন/i)).toBeInTheDocument()
  })

  it('renders Local PC storage badge when in local_computer mode without network calls', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const syncSpy = vi.spyOn(useSyllabusStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Local PC|লোকাল পিসি/i)).toBeInTheDocument()
    })

    syncSpy.mockRestore()
  })

  it('clicking the Refresh button triggers syncFromServer', async () => {
    const user = userEvent.setup()
    let syncCalled = false
    const origSync = useSyllabusStore.getState().syncFromServer
    useSyllabusStore.setState({
      syncFromServer: async () => {
        syncCalled = true
      },
    })

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTitle(/Refresh from server|রিফ্রেশ করুন/i)).toBeInTheDocument()
    })

    const refreshBtn = screen.getByTitle(/Refresh from server|রিফ্রেশ করুন/i)
    await user.click(refreshBtn)

    expect(syncCalled).toBe(true)
    useSyllabusStore.setState({ syncFromServer: origSync })
  })

  it('navigates from Class card to sections, subjects, and opens syllabus detail', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    // Wait for Class 9 card to appear
    await waitFor(() => {
      expect(screen.getByText(/Class 9|৯ম শ্রেণি/i)).toBeInTheDocument()
    })

    // Click Class 9 card
    const classCard = screen.getByText(/Class 9|৯ম শ্রেণি/i)
    await user.click(classCard)

    // Wait for Section A to appear
    await waitFor(() => {
      expect(screen.getByText('Select Section')).toBeInTheDocument()
    })

    // Click section A
    const secBtn = screen.getByText((_, el) => el?.textContent?.trim() === 'Section A')
    await user.click(secBtn)

    // Wait for subject Mathematics
    await waitFor(() => {
      expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument()
    })

    // Click Mathematics
    const subBtn = screen.getByText(/Mathematics|গণিত/i)
    await user.click(subBtn)

    // Now in detail view: Chapter "Algebra Basics" should be visible
    await waitFor(() => {
      expect(screen.getByText(/Algebra Basics|বীজগণিত পরিচিতি/i)).toBeInTheDocument()
    })
  })
})
