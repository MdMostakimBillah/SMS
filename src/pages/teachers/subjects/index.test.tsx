import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SubjectsPage from './index'
import { useTeacherStore } from '@/store/teacherStore'
import { subjectsApi, type SubjectData } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    subjectsApi: {
      ...actual.subjectsApi,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
})

vi.mock('@/hooks/usePermission', () => ({
  usePermission: () => ({
    canCreate: () => true,
    canEdit: () => true,
    canDelete: () => true,
    canView: () => true,
    canRead: () => true,
    isAdmin: () => true,
  }),
}))

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as any
}

describe('SubjectsPage Dual Storage (Database and Local PC Storage)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useTeacherStore.persist.clearStorage()
    useTeacherStore.setState({
      teachers: [],
      departments: [{ id: 'dept-1', name: 'Science', nameBn: 'বিজ্ঞান' }],
      subjects: [],
      designations: [],
      attendance: {},
      serverSynced: true,
      syncing: false,
      syncError: null,
    })
    vi.mocked(subjectsApi.list).mockResolvedValue({ data: [], total: 0 })
    vi.mocked(subjectsApi.create).mockReset()
    vi.mocked(subjectsApi.update).mockReset()
    vi.mocked(subjectsApi.delete).mockReset()
  })

  it('adds subject to both local PC store and calls subjectsApi.create for database persistence', async () => {
    const mockCreated: SubjectData = {
      id: 'sub-db-101',
      schoolId: 'school-1',
      name: 'Physics',
      nameBn: 'পদার্থবিজ্ঞান',
      departmentId: 'dept-1',
      departmentIds: ['dept-1'],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    }
    vi.mocked(subjectsApi.create).mockResolvedValue(mockCreated)

    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    )

    // Open Add Subject modal
    const addBtn = screen.getByRole('button', { name: /Add Subject|বিষয় যোগ করুন/i })
    fireEvent.click(addBtn)

    const modal = document.querySelector('.modal-box') as HTMLElement
    expect(modal).not.toBeNull()
    const modalScope = within(modal)

    // Fill form
    const nameInput = modalScope.getByPlaceholderText(/Subject name|বিষয়ের নাম/i)
    fireEvent.change(nameInput, { target: { value: 'Physics' } })

    // Select department checkbox inside modal
    const deptCheckbox = modalScope.getByRole('checkbox')
    fireEvent.click(deptCheckbox)

    // Save
    const saveBtn = modalScope.getByRole('button', { name: /^Add$|^যোগ করুন$/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(subjectsApi.create).toHaveBeenCalledWith({
        name: 'Physics',
        nameBn: null,
        departmentId: 'dept-1',
        departmentIds: ['dept-1'],
      })
    })

    // Assert subject is present in store
    const currentSubjects = useTeacherStore.getState().subjects
    expect(currentSubjects.some((s) => s.name === 'Physics')).toBe(true)
  })

  it('preserves subject in local PC storage even if database create fails or offline', async () => {
    vi.mocked(subjectsApi.create).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <SubjectsPage />
      </MemoryRouter>
    )

    const addBtn = screen.getByRole('button', { name: /Add Subject|বিষয় যোগ করুন/i })
    fireEvent.click(addBtn)

    const modal = document.querySelector('.modal-box') as HTMLElement
    expect(modal).not.toBeNull()
    const modalScope = within(modal)

    const nameInput = modalScope.getByPlaceholderText(/Subject name|বিষয়ের নাম/i)
    fireEvent.change(nameInput, { target: { value: 'Chemistry' } })

    const deptCheckbox = modalScope.getByRole('checkbox')
    fireEvent.click(deptCheckbox)

    const saveBtn = modalScope.getByRole('button', { name: /^Add$|^যোগ করুন$/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(subjectsApi.create).toHaveBeenCalled()
    })

    // Must be retained in local store
    const currentSubjects = useTeacherStore.getState().subjects
    expect(currentSubjects.some((s) => s.name === 'Chemistry')).toBe(true)
  })
})
