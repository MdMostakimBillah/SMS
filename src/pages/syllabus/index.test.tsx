import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@/test-wrapper'
import SyllabusPage from './index'
import { useSyllabusStore } from '@/store/syllabusStore'
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
    syllabusApi: {
      get: vi.fn().mockImplementation(async () => ({ syllabi: useSyllabusStore.getState().syllabi })),
      update: vi.fn().mockResolvedValue({ success: true }),
    },
  }
})

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

  it('renders header, syllabus statistics cards, and refresh button without Local PC badge', async () => {
    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Syllabus Management|পাঠ্যক্রম ব্যবস্থাপনা/i)).toBeInTheDocument()
    })

    expect(screen.getByTitle(/Refresh from server|রিফ্রেশ করুন/i)).toBeInTheDocument()
    // Local PC indicator text must NOT be present
    expect(screen.queryByText(/Local PC|লোকাল পিসি/i)).not.toBeInTheDocument()
  })

  it('runs cleanly in local_computer mode without displaying Local PC header badge', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const syncSpy = vi.spyOn(useSyllabusStore.getState(), 'syncFromServer')

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Syllabus Management|পাঠ্যক্রম ব্যবস্থাপনা/i)).toBeInTheDocument()
    })

    // Local PC indicator text must NOT be present
    expect(screen.queryByText(/Local PC|লোকাল পিসি/i)).not.toBeInTheDocument()

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

  it('allows full back navigation from detail to subjects, sections, and home', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    // Navigate to Class 9 -> Section A -> Mathematics
    await waitFor(() => expect(screen.getByText(/Class 9|৯ম শ্রেণি/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Class 9|৯ম শ্রেণি/i))

    await waitFor(() => expect(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A')).toBeInTheDocument())
    await user.click(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A'))

    await waitFor(() => expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Mathematics|গণিত/i))

    await waitFor(() => expect(screen.getByText(/Algebra Basics|বীজগণিত পরিচিতি/i)).toBeInTheDocument())

    // Back from detail -> subjects
    const backBtn1 = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-arrow-left'))
    expect(backBtn1).toBeDefined()
    if (backBtn1) await user.click(backBtn1)

    await waitFor(() => {
      expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument()
    })

    // Back from subjects -> sections
    const backBtn2 = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-arrow-left'))
    expect(backBtn2).toBeDefined()
    if (backBtn2) await user.click(backBtn2)

    await waitFor(() => {
      expect(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A')).toBeInTheDocument()
    })

    // Back from sections -> home
    const backBtn3 = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-arrow-left'))
    expect(backBtn3).toBeDefined()
    if (backBtn3) await user.click(backBtn3)

    await waitFor(() => {
      expect(screen.getByText(/Class 9|৯ম শ্রেণি/i)).toBeInTheDocument()
    })
  })

  it('can open Add Chapter modal and save a new chapter', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    // Navigate to detail
    await waitFor(() => expect(screen.getByText(/Class 9|৯ম শ্রেণি/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Class 9|৯ম শ্রেণি/i))

    await waitFor(() => expect(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A')).toBeInTheDocument())
    await user.click(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A'))

    await waitFor(() => expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Mathematics|গণিত/i))

    await waitFor(() => expect(screen.getByText(/Add Chapter|অধ্যায় যোগ/i)).toBeInTheDocument())

    // Click Add Chapter
    await user.click(screen.getByText(/Add Chapter|অধ্যায় যোগ/i))

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /New Chapter|নতুন অধ্যায়/i })).toBeInTheDocument()
    })

    // Enter Chapter Name (EN)
    const nameInput = screen.getByPlaceholderText(/e.g. Force & Motion/i)
    await user.type(nameInput, 'Geometry')

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Save|সংরক্ষণ/i })
    await user.click(saveBtn)

    // Modal closes and new chapter appears in store
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /New Chapter|নতুন অধ্যায়/i })).not.toBeInTheDocument()
      const current = useSyllabusStore.getState().syllabi[0]
      expect(current.chapters.some((c) => c.title === 'Geometry')).toBe(true)
    })
  })

  it('toggles topic completion status when clicking the status icon', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    // Navigate to detail
    await waitFor(() => expect(screen.getByText(/Class 9|৯ম শ্রেণি/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Class 9|৯ম শ্রেণি/i))

    await waitFor(() => expect(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A')).toBeInTheDocument())
    await user.click(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A'))

    await waitFor(() => expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Mathematics|গণিত/i))

    await waitFor(() => expect(screen.getByText(/Algebra Basics|বীজগণিত পরিচিতি/i)).toBeInTheDocument())

    // The topic status buttons have title "Toggle status" or "অবস্থা পরিবর্তন"
    const toggleBtns = screen.getAllByTitle(/Toggle status|অবস্থা পরিবর্তন/i)
    expect(toggleBtns.length).toBeGreaterThan(0)

    // Click the toggle button for the second topic (which starts as pending)
    await user.click(toggleBtns[1])

    // In store, status should change to in-progress
    await waitFor(() => {
      const topic2 = useSyllabusStore.getState().syllabi[0].chapters[0].topics[1]
      expect(topic2.status).toBe('in-progress')
    })
  })

  it('renders Go to Class Management empty state when no classes exist', async () => {
    useClassStore.setState({ classes: [] })

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getAllByText(/Go to Class Management|শ্রেণি ব্যবস্থাপনায় যান/i).length).toBeGreaterThan(0)
    })
  })

  it('opens PDF preview modal when clicking the PDF button', async () => {
    const user = userEvent.setup()

    render(
      <TestWrapper>
        <SyllabusPage />
      </TestWrapper>
    )

    // Navigate to detail
    await waitFor(() => expect(screen.getByText(/Class 9|৯ম শ্রেণি/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Class 9|৯ম শ্রেণি/i))

    await waitFor(() => expect(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A')).toBeInTheDocument())
    await user.click(screen.getByText((_, el) => el?.textContent?.trim() === 'Section A'))

    await waitFor(() => expect(screen.getByText(/Mathematics|গণিত/i)).toBeInTheDocument())
    await user.click(screen.getByText(/Mathematics|গণিত/i))

    await waitFor(() => expect(screen.getByRole('button', { name: /^PDF$/i })).toBeInTheDocument())

    // Click PDF button
    await user.click(screen.getByRole('button', { name: /^PDF$/i }))

    // Modal should be open with options
    await waitFor(() => {
      expect(screen.getByText(/Syllabus PDF|সিলেবাস PDF/i)).toBeInTheDocument()
    })
  })
})
