import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TeachersListPage from './index'
import { useTeacherStore } from '@/store/teacherStore'
import { teachersApi, departmentsApi, ApiError, type TeacherData, type DepartmentData } from '@/lib/api'
import type { Teacher } from '@/pages/teachers/types'

/**
 * Phase 7 — teacher list page:
 * - renders server-synced data behind loading/error states (local rows are
 *   never presented as server data)
 * - labeled read-only legacy section for pre-migration local records
 * - delete goes through the API; refusals surface errors without removing rows
 * - super_admin (read-only role) sees no write actions
 */
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    teachersApi: { ...actual.teachersApi, list: vi.fn(), delete: vi.fn() },
    departmentsApi: { ...actual.departmentsApi, list: vi.fn() },
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

// Export/print plumbing is irrelevant to these flows.
vi.mock('@/components/shared/TeacherPDFOptionsModal', () => ({ TeacherPDFOptionsModal: () => null }))
vi.mock('@/lib/pdf', () => ({ openPrintWindow: vi.fn() }))
vi.mock('@/pages/teachers/listPdfTemplate', () => ({
  generateTeacherListPDF: vi.fn(),
  getPdfOptions: vi.fn(),
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

function mkTeacher(id: string, nameEn: string): TeacherData {
  return {
    id,
    schoolId: 'school-1',
    nameEn,
    nameBn: null,
    status: 'active',
    phone: '+8801700000001',
    departmentId: null,
    subjectIds: [],
    salary: '50000',
    overtime: '0',
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  } as TeacherData
}

function seedSyncedStore(overrides: Partial<ReturnType<typeof useTeacherStore.getState>> = {}) {
  useTeacherStore.setState({
    teachers: [mkTeacher('srv-1', 'Server Teacher A'), mkTeacher('srv-2', 'Server Teacher B')],
    departments: [{ id: 'dept-1', name: 'Science', nameBn: '', head: '', createdAt: '', updatedAt: '' } as DepartmentData],
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
    <MemoryRouter initialEntries={['/teachers/all']}>
      <TeachersListPage />
    </MemoryRouter>
  )
}

async function openDeleteModal(rowName: string) {
  const row = await screen.findByText(rowName)
  const rowEl = row.closest('tr')!
  fireEvent.click(within(rowEl).getByTitle('Delete'))
  const heading = await screen.findByText('Delete?')
  const overlay = heading.closest('.modal-overlay') as HTMLElement
  return within(overlay)
}

describe('TeachersListPage — Phase 7 server flows', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    mockUser.current.role = 'school_admin'
    mockedTeachersApi.delete.mockResolvedValue({ success: true })
    seedSyncedStore()
  })

  it('renders server-synced teachers', async () => {
    renderPage()
    expect(await screen.findByText('Server Teacher A')).toBeInTheDocument()
    expect(screen.getByText('Server Teacher B')).toBeInTheDocument()
    // No sync problems on a synced store
    expect(screen.queryByText('Server data could not be loaded')).not.toBeInTheDocument()
  })

  it('shows a labeled read-only legacy section for pre-migration local records', async () => {
    seedSyncedStore({
      legacyTeachers: [{ id: 'TCH-2025-001', nameEn: 'Legacy Local Teacher', nameBn: '', phone: '01711', status: 'active', subjectIds: [] } as Teacher],
    })
    renderPage()

    expect(await screen.findByText(/Legacy local records \(not migrated\)/)).toBeInTheDocument()
    expect(screen.getByText('Legacy Local Teacher')).toBeInTheDocument()
    // Read-only: the legacy row has no edit/delete actions (only server rows do)
    const legacyId = screen.getByText('TCH-2025-001')
    const legacyItem = legacyId.closest('li') as HTMLElement
    expect(within(legacyItem).queryByTitle('Edit')).not.toBeInTheDocument()
    expect(within(legacyItem).queryByTitle('Delete')).not.toBeInTheDocument()
  })

  it('shows loading state before sync (no local rows faked as server data)', async () => {
    seedSyncedStore({ serverSynced: false, syncing: true, syncError: null })
    renderPage()
    expect(await screen.findByText(/Loading teachers from server/)).toBeInTheDocument()
    expect(screen.queryByText('Server Teacher A')).not.toBeInTheDocument()
  })

  it('sync error panel surfaces the failure; Retry re-syncs and renders server rows', async () => {
    // Error before any successful sync: store has no rows yet.
    seedSyncedStore({ serverSynced: false, syncing: false, syncError: 'Could not reach the server', teachers: [] })
    renderPage()
    expect(await screen.findByText('Server data could not be loaded')).toBeInTheDocument()
    expect(screen.queryByText('Server Teacher A')).not.toBeInTheDocument() // local data not faked as server data

    vi.mocked(teachersApi.list).mockResolvedValue({
      data: [mkTeacher('srv-1', 'Server Teacher A')],
      total: 1,
      page: 1,
      pageSize: 100,
    })
    vi.mocked(departmentsApi.list).mockResolvedValue({ data: [], total: 0 })
    fireEvent.click(screen.getByRole('button', { name: /Retry/ }))

    expect(await screen.findByText('Server Teacher A')).toBeInTheDocument()
    expect(screen.queryByText('Server data could not be loaded')).not.toBeInTheDocument()
  })

  it('delete calls the API and removes the row on success', async () => {
    renderPage()
    const overlay = await openDeleteModal('Server Teacher A')
    fireEvent.click(overlay.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mockedTeachersApi.delete).toHaveBeenCalledWith('srv-1'))
    await waitFor(() => expect(screen.queryByText('Server Teacher A')).not.toBeInTheDocument())
    expect(screen.getByText('Server Teacher B')).toBeInTheDocument()
  })

  it('delete refusal (403) keeps the row and shows the error', async () => {
    mockedTeachersApi.delete.mockRejectedValue(new ApiError('Forbidden', 403))
    renderPage()
    const overlay = await openDeleteModal('Server Teacher A')
    fireEvent.click(overlay.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText(/You are not allowed to perform this action/)).toBeInTheDocument()
    // Row still present — no optimistic local delete
    expect(screen.getByText('Server Teacher A')).toBeInTheDocument()
    expect(mockedTeachersApi.delete).toHaveBeenCalledWith('srv-1')
  })

  it('super_admin (read-only) sees no write actions', async () => {
    mockUser.current.role = 'super_admin'
    renderPage()
    expect(await screen.findByText('Server Teacher A')).toBeInTheDocument()
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add Teacher/ })).not.toBeInTheDocument()
  })
})
