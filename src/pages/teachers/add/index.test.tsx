import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AddTeacherPage from './index'
import { useTeacherStore } from '@/store/teacherStore'
import { teachersApi, ApiError, type TeacherData } from '@/lib/api'

/**
 * Phase 7 — add teacher page:
 * - submit posts to POST /api/teachers with the full form payload
 * - the payload NEVER carries schoolId/id/createdAt (server derives tenant)
 * - server refusals (409/400) surface as errors; no local fallback row
 * - the success screen shows the SERVER-assigned id (no local id generation)
 */
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    teachersApi: { ...actual.teachersApi, create: vi.fn() },
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
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const mockedTeachersApi = vi.mocked(teachersApi)

function mkCreatedTeacher(nameEn: string): TeacherData {
  return {
    id: 'srv-uuid-1',
    schoolId: 'school-1',
    nameEn,
    nameBn: null,
    status: 'active',
    phone: '+8801700000001',
    email: null,
    departmentId: 'dept-1',
    subjectIds: [],
    salary: '0',
    overtime: '0',
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  } as TeacherData
}

function seedStore() {
  useTeacherStore.setState({
    teachers: [],
    departments: [
      { id: 'dept-1', name: 'Science', nameBn: '', head: '', createdAt: '', updatedAt: '' },
    ],
    subjects: [],
    designations: [],
    attendance: {},
    serverSynced: true,
    syncing: false,
    syncError: null,
    legacyTeachers: [],
    legacyDepartments: [],
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/teachers/add']}>
      <AddTeacherPage />
    </MemoryRouter>
  )
}

/** Labels are not associated with inputs — resolve via the label's parent. */
function fieldByLabel(container: HTMLElement, labelText: string): HTMLInputElement | HTMLSelectElement {
  const labels = Array.from(container.querySelectorAll('label'))
  const label = labels.find((l) => l.textContent?.replace('*', '').trim().startsWith(labelText))
  if (!label) throw new Error(`label not found: ${labelText}`)
  const el = label.parentElement!.querySelector('input, select')
  if (!el) throw new Error(`field not found for: ${labelText}`)
  return el as HTMLInputElement | HTMLSelectElement
}

/** Walk personal → professional (dept selected) → family → review screen. */
async function reachReview(container: HTMLElement) {
  const nameInput = fieldByLabel(container, 'Name (English)')
  fireEvent.change(nameInput, { target: { value: 'API Teacher' } })
  const phoneInput = fieldByLabel(container, 'Mobile')
  fireEvent.change(phoneInput, { target: { value: '+8801711111111' } })

  fireEvent.click(screen.getByRole('button', { name: /Next/ }))

  // Professional tab: department select (the one holding the server dept)
  const deptSelect = Array.from(container.querySelectorAll('select')).find((s) =>
    Array.from(s.options).some((o) => o.textContent === 'Science')
  )
  if (!deptSelect) throw new Error('department select not found')
  fireEvent.change(deptSelect, { target: { value: 'dept-1' } })

  fireEvent.click(screen.getByRole('button', { name: /Next/ }))

  // Family tab (last) → Review
  fireEvent.click(await screen.findByRole('button', { name: /Review/ }))
}

describe('AddTeacherPage — Phase 7 server create', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockedTeachersApi.create.mockResolvedValue(mkCreatedTeacher('API Teacher'))
    seedStore()
  })

  it('creates via POST /api/teachers — payload has no schoolId/id/createdAt', async () => {
    const { container } = renderPage()
    await reachReview(container)

    fireEvent.click(screen.getByRole('button', { name: /Submit/ }))

    await waitFor(() => expect(mockedTeachersApi.create).toHaveBeenCalledTimes(1))
    const payload = mockedTeachersApi.create.mock.calls[0][0]
    expect(payload.nameEn).toBe('API Teacher')
    expect(payload.phone).toBe('+8801711111111')
    expect(payload.departmentId).toBe('dept-1')
    expect(payload).not.toHaveProperty('schoolId')
    expect(payload).not.toHaveProperty('id')
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('createdBy')

    // Success screen shows the SERVER-assigned id
    expect(await screen.findByText('Teacher Added!')).toBeInTheDocument()
    expect(screen.getByText('srv-uuid-1')).toBeInTheDocument()

    // Store contains exactly the server row (no local TCH-xxx duplicate)
    const ids = useTeacherStore.getState().teachers.map((t) => t.id)
    expect(ids).toEqual(['srv-uuid-1'])
  })

  it('surfaces a 409 refusal with the server message and does not add a local row', async () => {
    mockedTeachersApi.create.mockRejectedValue(
      new ApiError('Teacher with this phone already exists', 409)
    )
    const { container } = renderPage()
    await reachReview(container)

    fireEvent.click(screen.getByRole('button', { name: /Submit/ }))

    expect(await screen.findByText('Teacher with this phone already exists')).toBeInTheDocument()
    expect(screen.queryByText('Teacher Added!')).not.toBeInTheDocument()
    expect(useTeacherStore.getState().teachers).toHaveLength(0) // no local fallback row
  })

  it('surfaces validation errors (400) from the server', async () => {
    mockedTeachersApi.create.mockRejectedValue(
      new ApiError('Validation failed: email is invalid', 400)
    )
    const { container } = renderPage()
    await reachReview(container)

    fireEvent.click(screen.getByRole('button', { name: /Submit/ }))

    expect(await screen.findByText(/email is invalid/)).toBeInTheDocument()
    expect(useTeacherStore.getState().teachers).toHaveLength(0)
    expect(mockedTeachersApi.create).toHaveBeenCalledTimes(1)
  })

  it('generates sequential ET0001 id and skips server API in local_computer mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const { container } = renderPage()
    await reachReview(container)

    fireEvent.click(screen.getByRole('button', { name: /Submit/ }))

    expect(await screen.findByText('Teacher Added!')).toBeInTheDocument()
    expect(screen.getByText('ET0001')).toBeInTheDocument()
    expect(mockedTeachersApi.create).not.toHaveBeenCalled()

    const stored = useTeacherStore.getState().teachers
    expect(stored).toHaveLength(1)
    expect(stored[0].id).toBe('ET0001')
  })
})
