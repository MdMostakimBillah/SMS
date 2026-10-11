import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTeacherStore } from './teacherStore'
import { teachersApi, departmentsApi, type TeacherData, type DepartmentData } from '@/lib/api'
import type { Teacher, Department, Subject, Designation } from '@/pages/teachers/types'

/**
 * Phase 7 tests: teacher/department state is server-authoritative.
 * - syncFromServer replaces local rows with API data (no dual writes)
 * - first successful sync backs up pre-migration local records (write-once)
 * - failed sync surfaces syncError and leaves local rows untouched
 * - subjects/designations/attendance remain local-only domains
 */
vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    teachersApi: { ...actual.teachersApi, list: vi.fn() },
    departmentsApi: { ...actual.departmentsApi, list: vi.fn() },
  }
})

const mockedTeachersApi = vi.mocked(teachersApi)
const mockedDepartmentsApi = vi.mocked(departmentsApi)

function mkServerTeacher(id: string, nameEn = 'Server Teacher'): TeacherData {
  return {
    id,
    schoolId: 'school-1',
    nameEn,
    nameBn: null,
    status: 'active',
    category: null,
    photo: null,
    gender: null,
    dob: null,
    bloodGroup: null,
    religion: null,
    phone: '+8801700000000',
    email: null,
    address: null,
    nid: null,
    emergencyPhone: null,
    departmentId: null,
    subjectIds: [],
    designation: null,
    qualification: null,
    experience: null,
    joiningDate: null,
    salary: '50000',
    salaryStartDate: null,
    bonus: null,
    overtime: '0',
    festivalBonus: null,
    inTime: null,
    outTime: null,
    fatherNameEn: null,
    fatherNameBn: null,
    fatherPhone: null,
    fatherNid: null,
    motherNameEn: null,
    motherNameBn: null,
    motherPhone: null,
    guardianName: null,
    guardianPhone: null,
    guardianRelation: null,
    parentAddress: null,
    signature: null,
    expertSubjects: null,
    applySalaryRule: false,
    createdAt: '2026-10-10T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  }
}

function mkServerDepartment(id: string, name = 'Science'): DepartmentData {
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

function localTeacher(id: string, nameEn = 'Legacy Local') {
  return { id, nameEn, nameBn: '', status: 'active', subjectIds: [], departmentId: '', salary: 0 } as Teacher
}

describe('teacherStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    useTeacherStore.setState({
      teachers: [],
      departments: [],
      subjects: [],
      designations: [],
      attendance: {},
      serverSynced: false,
      syncing: false,
      syncError: null,
      legacyTeachers: [],
      legacyDepartments: [],
    })
  })

  it('has empty state and neutral sync flags by default', () => {
    const state = useTeacherStore.getState()
    expect(state.teachers).toEqual([])
    expect(state.departments).toEqual([])
    expect(state.subjects).toEqual([])
    expect(state.designations).toEqual([])
    expect(state.attendance).toEqual({})
    expect(state.serverSynced).toBe(false)
    expect(state.syncError).toBeNull()
    expect(state.legacyTeachers).toEqual([])
  })

  // ── server sync ────────────────────────────────────────────────────────────

  it('syncFromServer replaces local rows with server data (no dual writes)', async () => {
    // Pre-migration local data present in the store
    useTeacherStore.setState({
      teachers: [localTeacher('TCH-LOCAL-1'), localTeacher('TCH-LOCAL-2')],
      departments: [{ id: 'DEPT-001', name: 'Old Dept', nameBn: '', head: '', createdAt: '', updatedAt: '' }],
      attendance: { '2026-01-01': { 'TCH-LOCAL-1': { status: 'present', punches: [{ time: '08:00', type: 'in' }] } } },
    })
    mockedTeachersApi.list.mockResolvedValue({
      data: [mkServerTeacher('srv-1'), mkServerTeacher('srv-2')],
      total: 2,
      page: 1,
      pageSize: 100,
    })
    mockedDepartmentsApi.list.mockResolvedValue({ data: [mkServerDepartment('dept-srv')], total: 1 })

    await useTeacherStore.getState().syncFromServer()

    const state = useTeacherStore.getState()
    // Server rows only — local rows are gone from the live collection
    expect(state.teachers.map((t) => t.id)).toEqual(['srv-1', 'srv-2'])
    expect(state.teachers[0].salary).toBe(50000) // Decimal string -> number
    expect(state.departments.map((d) => d.id)).toEqual(['dept-srv'])
    expect(state.serverSynced).toBe(true)
    expect(state.syncError).toBeNull()
    expect(state.syncing).toBe(false)
  })

  it('first successful sync backs up local teachers/attendance/departments write-once', async () => {
    const localAtt = { '2026-01-01': { 'TCH-LOCAL-1': { status: 'present' as const, punches: [] } } }
    useTeacherStore.setState({
      teachers: [localTeacher('TCH-LOCAL-1')],
      departments: [{ id: 'DEPT-001', name: 'Old Dept', nameBn: '', head: '', createdAt: '', updatedAt: '' }],
      attendance: localAtt,
    })
    mockedTeachersApi.list.mockResolvedValue({ data: [mkServerTeacher('srv-1')], total: 1, page: 1, pageSize: 100 })
    mockedDepartmentsApi.list.mockResolvedValue({ data: [], total: 0 })

    await useTeacherStore.getState().syncFromServer()

    // Backups written under the legacy keys — original records intact
    const tBackup = JSON.parse(localStorage.getItem('edutech-teachers-legacy')!)
    expect(tBackup.teachers).toHaveLength(1)
    expect(tBackup.teachers[0].id).toBe('TCH-LOCAL-1')
    expect(tBackup.attendance).toHaveProperty('2026-01-01')
    const dBackup = JSON.parse(localStorage.getItem('edutech-departments-legacy')!)
    expect(dBackup.departments[0].id).toBe('DEPT-001')

    const state = useTeacherStore.getState()
    // Attendance moved to backup (legacy ids never match server ids)
    expect(state.attendance).toEqual({})
    // Legacy mirrors exposed read-only for the labeled section
    expect(state.legacyTeachers.map((t) => t.id)).toEqual(['TCH-LOCAL-1'])
    expect(state.legacyDepartments.map((d) => d.id)).toEqual(['DEPT-001'])

    // Write-once: a later sync must not overwrite the backup
    localStorage.setItem(
      'edutech-teachers-legacy',
      JSON.stringify({ teachers: [], attendance: {}, backedUpAt: 'sentinel' })
    )
    useTeacherStore.setState({ serverSynced: false }) // force a re-sync path
    await useTeacherStore.getState().syncFromServer()
    const after = JSON.parse(localStorage.getItem('edutech-teachers-legacy')!)
    expect(after.backedUpAt).toBe('sentinel')
  })

  it('does not back up server data as legacy on subsequent syncs', async () => {
    useTeacherStore.setState({ teachers: [localTeacher('TCH-LOCAL-1')] })
    mockedTeachersApi.list.mockResolvedValue({ data: [mkServerTeacher('srv-1')], total: 1, page: 1, pageSize: 100 })
    mockedDepartmentsApi.list.mockResolvedValue({ data: [], total: 0 })
    await useTeacherStore.getState().syncFromServer()

    // Store now holds server rows and a backup exists; force another sync.
    mockedTeachersApi.list.mockResolvedValue({ data: [mkServerTeacher('srv-1')], total: 1, page: 1, pageSize: 100 })
    useTeacherStore.setState({ serverSynced: false })
    await useTeacherStore.getState().syncFromServer()

    const backup = JSON.parse(localStorage.getItem('edutech-teachers-legacy')!)
    expect(backup.teachers.map((t: { id: string }) => t.id)).toEqual(['TCH-LOCAL-1']) // never 'srv-1'
  })

  it('failed sync surfaces syncError and leaves local rows untouched', async () => {
    useTeacherStore.setState({ teachers: [localTeacher('TCH-LOCAL-1')] })
    mockedTeachersApi.list.mockRejectedValue(new TypeError('fetch failed'))
    mockedDepartmentsApi.list.mockResolvedValue({ data: [], total: 0 })

    await useTeacherStore.getState().syncFromServer()

    const state = useTeacherStore.getState()
    expect(state.serverSynced).toBe(false)
    expect(state.syncing).toBe(false)
    expect(state.syncError).toBeTruthy()
    expect(state.teachers.map((t) => t.id)).toEqual(['TCH-LOCAL-1']) // untouched
    expect(localStorage.getItem('edutech-teachers-legacy')).toBeNull() // no backup on failure
  })

  it('upsertServerTeacher / removeServerTeacher manage the live collection', () => {
    const store = useTeacherStore.getState()
    store.upsertServerTeacher({ id: 'srv-1', nameEn: 'A' } as Teacher)
    store.upsertServerTeacher({ id: 'srv-2', nameEn: 'B' } as Teacher)
    expect(useTeacherStore.getState().teachers.map((t) => t.id)).toEqual(['srv-2', 'srv-1'])

    store.upsertServerTeacher({ id: 'srv-1', nameEn: 'A2' } as Teacher)
    const ids = useTeacherStore.getState().teachers.map((t) => t.id)
    expect(ids).toEqual(['srv-2', 'srv-1']) // replaced in place, no duplicate
    expect(ids.filter((i) => i === 'srv-1')).toHaveLength(1)
    expect(useTeacherStore.getState().teachers.find((t) => t.id === 'srv-1')!.nameEn).toBe('A2')

    store.removeServerTeacher('srv-2')
    expect(useTeacherStore.getState().teachers.map((t) => t.id)).toEqual(['srv-1'])
  })

  it('upsertServerDepartment / removeServerDepartment manage departments', () => {
    const store = useTeacherStore.getState()
    store.upsertServerDepartment({ id: 'd1', name: 'Sci' } as Department)
    store.upsertServerDepartment({ id: 'd1', name: 'Sci Updated' } as Department)
    expect(useTeacherStore.getState().departments).toHaveLength(1)
    expect(useTeacherStore.getState().departments[0].name).toBe('Sci Updated')
    store.removeServerDepartment('d1')
    expect(useTeacherStore.getState().departments).toHaveLength(0)
  })

  // ── local-only domains (no server endpoints yet) ───────────────────────────

  it('addSubject / deleteSubject', () => {
    useTeacherStore.getState().addSubject({ id: 'SUB-1', name: 'Math' } as Subject)
    expect(useTeacherStore.getState().subjects).toHaveLength(1)
    useTeacherStore.getState().deleteSubject('SUB-1')
    expect(useTeacherStore.getState().subjects).toHaveLength(0)
  })

  it('addDesignation / deleteDesignation', () => {
    useTeacherStore.getState().addDesignation({ id: 'DES-1', name: 'Lecturer' } as Designation)
    expect(useTeacherStore.getState().designations).toHaveLength(1)
    useTeacherStore.getState().deleteDesignation('DES-1')
    expect(useTeacherStore.getState().designations).toHaveLength(0)
  })

  // ── attendance ─────────────────────────────────────────────────────────────

  it('markAttendance creates day record with punches', () => {
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-1', status: 'active' } as Teacher)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'present')
    const dayAtt = useTeacherStore.getState().attendance['2026-06-01']
    expect(dayAtt).toBeDefined()
    expect(dayAtt['TCH-1'].status).toBe('present')
    expect(dayAtt['TCH-1'].punches.length).toBeGreaterThan(0)
    expect(dayAtt['TCH-1'].punches[0].type).toBe('in')
  })

  it('markAttendance for absent does not add punches', () => {
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-1', status: 'active' } as Teacher)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'absent')
    const dayAtt = useTeacherStore.getState().attendance['2026-06-01']
    expect(dayAtt['TCH-1'].status).toBe('absent')
    expect(dayAtt['TCH-1'].punches).toHaveLength(0)
  })

  it('markAllPresent only marks active teachers', () => {
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-1', status: 'active' } as Teacher)
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-2', status: 'inactive' } as Teacher)
    useTeacherStore.getState().markAllPresent('2026-06-01')
    const dayAtt = useTeacherStore.getState().attendance['2026-06-01']
    expect(dayAtt['TCH-1']).toBeDefined()
    expect(dayAtt['TCH-1'].status).toBe('present')
    expect(dayAtt['TCH-2']).toBeUndefined()
  })

  it('getAttendanceStats counts correctly', () => {
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-1', status: 'active' } as Teacher)
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-2', status: 'active' } as Teacher)
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-3', status: 'active' } as Teacher)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'present')
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-2', 'absent')
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-3', 'on-leave')
    const stats = useTeacherStore.getState().getAttendanceStats('2026-06-01')
    expect(stats.present).toBe(1)
    expect(stats.absent).toBe(1)
    expect(stats.onLeave).toBe(1)
  })

  it('getAttendanceStats ignores inactive teachers', () => {
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-1', status: 'active' } as Teacher)
    useTeacherStore.getState().upsertServerTeacher({ id: 'TCH-2', status: 'inactive' } as Teacher)
    useTeacherStore.getState().markAttendance('2026-06-01', 'TCH-1', 'present')
    const stats = useTeacherStore.getState().getAttendanceStats('2026-06-01')
    expect(stats.present).toBe(1)
    expect(stats.absent).toBe(0)
  })
})
