import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DepartmentsPage from './index'
import { useTeacherStore } from '@/store/teacherStore'
import { departmentsApi, ApiError, type DepartmentData } from '@/lib/api'

/**
 * Phase 7 — departments page: server CRUD through /api/departments.
 * - create/update/delete go through the API (no local DEPT-xxx ids)
 * - refusals (409/403) surface errors without dropping rows
 * - super_admin sees no write actions; legacy departments are read-only
 * - create payload never carries schoolId (server derives tenant from session)
 */
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    departmentsApi: {
      ...actual.departmentsApi,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
})

const mockUser = vi.hoisted(() => ({
  current: {
    id: 'u-1',
    email: 'admin@school.test',
    name: 'Admin',
    role: 'school_admin',
    schoolId: 'school-1',
    schoolName: 'Test School',
    avatar: null,
    subdomain: null,
  } as { role: string; [k: string]: unknown },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser.current, loading: false }),
}))

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

const mockedApi = vi.mocked(departmentsApi)

function mkDept(id: string, name: string): DepartmentData {
  return {
    id,
    schoolId: 'school-1',
    name,
    nameBn: null,
    head: null,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  }
}

function seedStore(overrides: Partial<ReturnType<typeof useTeacherStore.getState>> = {}) {
  useTeacherStore.setState({
    teachers: [],
    departments: [mkDept('dept-srv-1', 'Science'), mkDept('dept-srv-2', 'Math')],
    subjects: [],
    designations: [],
    attendance: {},
    serverSynced: true,
    syncing: false,
    syncError: null,
    legacyTeachers: [],
    legacyDepartments: [],
    ...overrides,
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/teachers/departments']}>
      <DepartmentsPage />
    </MemoryRouter>
  )
}

/** Labels in this page are not associated with inputs — resolve via parent. */
function fieldByLabel(container: HTMLElement, labelText: string): HTMLInputElement | HTMLSelectElement {
  const labels = Array.from(container.querySelectorAll('label'))
  const label = labels.find((l) => l.textContent?.replace('*', '').trim().startsWith(labelText))
  if (!label) throw new Error(`label not found: ${labelText}`)
  const el = label.parentElement!.querySelector('input, select')
  if (!el) throw new Error(`field not found for: ${labelText}`)
  return el as HTMLInputElement | HTMLSelectElement
}

describe('DepartmentsPage — Phase 7 server flows', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockUser.current.role = 'school_admin'
    mockedApi.create.mockResolvedValue(mkDept('dept-new', 'Chemistry'))
    mockedApi.delete.mockResolvedValue({ success: true })
    seedStore()
  })

  it('renders server-synced departments', async () => {
    renderPage()
    expect(await screen.findByText('Science')).toBeInTheDocument()
    expect(screen.getByText('Math')).toBeInTheDocument()
  })

  it('create posts to the API without schoolId (server derives tenant) and inserts the response row', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Add Department/ }))

    const modal = (await screen.findByText('New Department')).closest('.modal-content') as HTMLElement
    fireEvent.change(fieldByLabel(modal, 'Name (English)'), { target: { value: 'Chemistry' } })
    fireEvent.click(within(modal).getByRole('button', { name: 'Add' }))

    await waitFor(() => expect(mockedApi.create).toHaveBeenCalledTimes(1))
    const payload = mockedApi.create.mock.calls[0][0]
    expect(payload).toEqual({ name: 'Chemistry', nameBn: null, head: null })
    expect(payload).not.toHaveProperty('schoolId')

    expect(await screen.findByText('Chemistry')).toBeInTheDocument()
  })

  it('create refusal (409) shows the server message and keeps the modal open', async () => {
    mockedApi.create.mockRejectedValue(new ApiError('Department with this name already exists', 409))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Add Department/ }))

    const modal = (await screen.findByText('New Department')).closest('.modal-content') as HTMLElement
    fireEvent.change(fieldByLabel(modal, 'Name (English)'), { target: { value: 'Science' } })
    fireEvent.click(within(modal).getByRole('button', { name: 'Add' }))

    expect(await within(modal).findByText('Department with this name already exists')).toBeInTheDocument()
    expect(within(modal).getByText('New Department')).toBeInTheDocument() // modal still open
    expect(screen.getByText('Science')).toBeInTheDocument() // original row untouched
  })

  it('delete calls the API and removes the row', async () => {
    renderPage()
    const row = (await screen.findByText('Science')).closest('tr') as HTMLElement
    fireEvent.click(within(row).getByTitle('Delete'))

    const confirmHeading = await screen.findByText('Delete?')
    const overlay = confirmHeading.closest('.modal-overlay') as HTMLElement
    fireEvent.click(within(overlay).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedApi.delete).toHaveBeenCalledWith('dept-srv-1'))
    await waitFor(() => expect(screen.queryByText('Science')).not.toBeInTheDocument())
    expect(screen.getByText('Math')).toBeInTheDocument()
  })

  it('delete refusal keeps the row and shows the error', async () => {
    mockedApi.delete.mockRejectedValue(new ApiError('Forbidden', 403))
    renderPage()
    const row = (await screen.findByText('Science')).closest('tr') as HTMLElement
    fireEvent.click(within(row).getByTitle('Delete'))

    const confirmHeading = await screen.findByText('Delete?')
    const overlay = confirmHeading.closest('.modal-overlay') as HTMLElement
    fireEvent.click(within(overlay).getByRole('button', { name: 'Delete' }))

    expect(await within(overlay).findByText(/You are not allowed to perform this action/)).toBeInTheDocument()
    expect(screen.getByText('Science')).toBeInTheDocument() // still there
  })

  it('super_admin sees no write actions', async () => {
    mockUser.current.role = 'super_admin'
    renderPage()
    expect(await screen.findByText('Science')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add Department/ })).not.toBeInTheDocument()
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('shows a labeled read-only legacy section for pre-migration departments', async () => {
    seedStore({
      legacyDepartments: [{ id: 'DEPT-001', name: 'Old Local Dept', nameBn: '', head: '', createdAt: '', updatedAt: '' }],
    })
    renderPage()
    expect(await screen.findByText(/Legacy local departments \(not migrated\)/)).toBeInTheDocument()
    expect(screen.getByText('Old Local Dept')).toBeInTheDocument()
  })
})
