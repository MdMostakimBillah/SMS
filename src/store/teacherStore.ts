import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Teacher, Department, Subject, Designation } from '@/pages/teachers/types'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { teachersApi, departmentsApi, subjectsApi, designationsApi, type TeacherData } from '@/lib/api'
import {
  serverTeacherToTeacher,
  serverDepartmentToDepartment,
  serverSubjectToSubject,
  serverDesignationToDesignation,
  apiErrorMessage,
} from '@/lib/teacherMappers'
import { isLocalComputerMode } from '@/lib/storageMode'

export type AttendanceStatus = 'present' | 'absent' | 'on-leave'

export interface PunchRecord {
  time: string
  type: 'in' | 'out'
}

export interface DayAttendance {
  status: AttendanceStatus
  punches: PunchRecord[]
}

const ATTENDANCE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000

function pruneAttendance(attendance: Record<string, Record<string, DayAttendance>>): Record<string, Record<string, DayAttendance>> {
  const cutoff = Date.now() - ATTENDANCE_RETENTION_MS
  const pruned: Record<string, Record<string, DayAttendance>> = {}
  for (const [dateStr, dayAtt] of Object.entries(attendance)) {
    const t = new Date(dateStr).getTime()
    if (isNaN(t) || t >= cutoff) pruned[dateStr] = dayAtt
  }
  return pruned
}

/** Where Phase 7 keeps pre-migration local records: a separate key, never deleted. */
function legacyTeachersBackupKey(): string {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  return slug ? `edutech-teachers-legacy_${slug}` : 'edutech-teachers-legacy'
}

function legacyDepartmentsBackupKey(): string {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  return slug ? `edutech-departments-legacy_${slug}` : 'edutech-departments-legacy'
}

function readLegacy<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

interface LegacyTeachersBackup {
  teachers: Teacher[]
  attendance: Record<string, Record<string, DayAttendance>>
  backedUpAt: string
}

interface LegacyDepartmentsBackup {
  departments: Department[]
  backedUpAt: string
}

interface TeacherState {
  /** Server-authoritative rows (Phase 7). Local writes are gone: CRUD goes through the API. */
  teachers: Teacher[]
  /** Server-authoritative departments (Phase 7). */
  departments: Department[]
  /** Local-only domains — no server endpoints exist yet. */
  subjects: Subject[]
  designations: Designation[]
  attendance: Record<string, Record<string, DayAttendance>>

  // --- Phase 7 sync state (transient flags never persist; see partialize) ---
  serverSynced: boolean
  syncing: boolean
  syncError: string | null
  /** One-time backup of pre-migration local records (from the legacy backup key). */
  legacyTeachers: Teacher[]
  legacyDepartments: Department[]

  /** Fetches teachers + departments from the secured API; backs up local data on first successful sync. */
  syncFromServer: () => Promise<void>
  upsertServerTeacher: (teacher: Teacher) => void
  removeServerTeacher: (id: string) => void
  upsertServerDepartment: (dept: Department) => void
  removeServerDepartment: (id: string) => void
  upsertServerSubject: (sub: Subject) => void
  removeServerSubject: (id: string) => void
  upsertServerDesignation: (des: Designation) => void
  removeServerDesignation: (id: string) => void

  addSubject: (sub: Subject) => void
  updateSubject: (id: string, data: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  addDesignation: (des: Designation) => void
  updateDesignation: (id: string, data: Partial<Designation>) => void
  deleteDesignation: (id: string) => void
  markAttendance: (date: string, teacherId: string, status: AttendanceStatus) => void
  markAllPresent: (date: string) => void
  getAttendanceStats: (date: string) => { present: number; absent: number; onLeave: number }
}

/** Page-size cap on the API (max 500) — fetch every page so the list is complete. */
async function fetchAllServerTeachers(): Promise<Teacher[]> {
  const all: TeacherData[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY
  while (all.length < total) {
    const res = await teachersApi.list(page, 500)
    all.push(...res.data)
    total = res.total
    if (res.data.length === 0) break
    page += 1
    if (page > 100) break // safety cap: 50k rows
  }
  return all.map(serverTeacherToTeacher)
}

/** In-flight dedupe: concurrent mounts share one request. */
let syncPromise: Promise<void> | null = null
let lastSyncAt = 0
const SYNC_MIN_INTERVAL_MS = 15_000

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set, get) => ({
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

      syncFromServer: async () => {
        // When in Local Computer mode, cloud database sync is stopped completely;
        // teachers stay in local computer storage (JSON/localStorage).
        if (isLocalComputerMode()) {
          set({ syncing: false, serverSynced: true, syncError: null })
          return
        }

        if (syncPromise) return syncPromise
        const current = get()
        // Fresh server data already on screen: avoid re-fetching on every mount.
        if (current.serverSynced && Date.now() - lastSyncAt < SYNC_MIN_INTERVAL_MS) return
        if (!current.serverSynced) set({ syncing: true, syncError: null })

        syncPromise = (async () => {
          try {
            const [serverTeachers, deptRes, subjectRes, designationRes] = await Promise.all([
              fetchAllServerTeachers(),
              departmentsApi.list(),
              subjectsApi.list().catch(() => ({ data: [], total: 0 })),
              designationsApi.list().catch(() => ({ data: [], total: 0 })),
            ])
            const serverDepts = deptRes.data.map(serverDepartmentToDepartment)
            const serverSubjects = subjectRes.data.map(serverSubjectToSubject)
            const serverDesignations = designationRes.data.map(serverDesignationToDesignation)

            const prev = get()
            let attendance = prev.attendance
            const finalSubjects = serverSubjects.length > 0 ? serverSubjects : prev.subjects
            const finalDesignations = serverDesignations.length > 0 ? serverDesignations : prev.designations

            // One-time legacy backup — only on the first successful sync of a
            // store that has never been server-synced (serverSynced persists),
            // so data that came FROM the server is never saved as "legacy".
            if (!prev.serverSynced) {
              const tKey = legacyTeachersBackupKey()
              if (!localStorage.getItem(tKey) && (prev.teachers.length > 0 || Object.keys(prev.attendance).length > 0)) {
                localStorage.setItem(
                  tKey,
                  JSON.stringify({ teachers: prev.teachers, attendance: prev.attendance, backedUpAt: new Date().toISOString() })
                )
                attendance = {} // legacy ids never match server ids — moved to backup intact
              }
              const dKey = legacyDepartmentsBackupKey()
              if (!localStorage.getItem(dKey) && prev.departments.length > 0) {
                localStorage.setItem(
                  dKey,
                  JSON.stringify({ departments: prev.departments, backedUpAt: new Date().toISOString() })
                )
              }
            }

            lastSyncAt = Date.now()
            set({
              teachers: serverTeachers,
              departments: serverDepts,
              subjects: finalSubjects,
              designations: finalDesignations,
              attendance,
              legacyTeachers: readLegacy<LegacyTeachersBackup>(legacyTeachersBackupKey())?.teachers ?? [],
              legacyDepartments: readLegacy<LegacyDepartmentsBackup>(legacyDepartmentsBackupKey())?.departments ?? [],
              serverSynced: true,
              syncing: false,
              syncError: null,
            })
          } catch (err) {
            // Never replace local rows with an error: a failed sync leaves the
            // store untouched and surfaces syncError instead (pages must not
            // render local rows as if they were server data).
            if (!get().serverSynced) {
              set({ syncing: false, syncError: apiErrorMessage(err, false) })
            }
          } finally {
            syncPromise = null
          }
        })()
        return syncPromise
      },

      upsertServerTeacher: (teacher) =>
        set((state) => ({
          teachers: state.teachers.some((t) => t.id === teacher.id)
            ? state.teachers.map((t) => (t.id === teacher.id ? teacher : t))
            : [teacher, ...state.teachers],
        })),

      removeServerTeacher: (id) =>
        set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),

      upsertServerDepartment: (dept) =>
        set((state) => ({
          departments: state.departments.some((d) => d.id === dept.id)
            ? state.departments.map((d) => (d.id === dept.id ? dept : d))
            : [...state.departments, dept],
        })),

      removeServerDepartment: (id) =>
        set((state) => ({ departments: state.departments.filter((d) => d.id !== id) })),

      upsertServerSubject: (sub) =>
        set((state) => ({
          subjects: state.subjects.some((s) => s.id === sub.id)
            ? state.subjects.map((s) => (s.id === sub.id ? sub : s))
            : [...state.subjects, sub],
        })),

      removeServerSubject: (id) =>
        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),

      upsertServerDesignation: (des) =>
        set((state) => ({
          designations: state.designations.some((d) => d.id === des.id)
            ? state.designations.map((d) => (d.id === des.id ? des : d))
            : [...state.designations, des],
        })),

      removeServerDesignation: (id) =>
        set((state) => ({ designations: state.designations.filter((d) => d.id !== id) })),

      addSubject: (sub) => set((state) => ({ subjects: [...state.subjects, sub] })),

      updateSubject: (id, data) =>
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s)),
        })),

      deleteSubject: (id) => set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),

      addDesignation: (des) => set((state) => ({ designations: [...state.designations, des] })),

      updateDesignation: (id, data) =>
        set((state) => ({
          designations: state.designations.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString().split('T')[0] } : d)),
        })),

      deleteDesignation: (id) => set((state) => ({ designations: state.designations.filter((d) => d.id !== id) })),

      markAttendance: (date, teacherId, status) =>
        set((state) => {
          const dayAtt = state.attendance[date] || {}
          const existing = dayAtt[teacherId]
          const punches = existing?.punches || []
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          const newPunches = status === 'present' ? [...punches, { time, type: 'in' as const }] : punches
          return {
            attendance: pruneAttendance({
              ...state.attendance,
              [date]: {
                ...dayAtt,
                [teacherId]: { status, punches: newPunches },
              },
            }),
          }
        }),

      markAllPresent: (date) =>
        set((state) => {
          const dayAtt: Record<string, DayAttendance> = {}
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          get()
            .teachers.filter((t) => t.status === 'active')
            .forEach((t) => {
              dayAtt[t.id] = { status: 'present', punches: [{ time, type: 'in' }] }
            })
          return { attendance: pruneAttendance({ ...state.attendance, [date]: dayAtt }) }
        }),

      getAttendanceStats: (date) => {
        const dayAtt = get().attendance[date] || {}
        const teachers = get().teachers.filter((t) => t.status === 'active')
        let present = 0,
          absent = 0,
          onLeave = 0
        teachers.forEach((t) => {
          const d = dayAtt[t.id]
          const s = d?.status
          if (s === 'present') present++
          else if (s === 'absent') absent++
          else if (s === 'on-leave') onLeave++
        })
        return { present, absent, onLeave }
      },
    }),
    {
      name: 'edutech-teachers',
      storage: createNamespacedStorage('edutech-teachers', undefined, { debounce: true }),
      version: 3,
      // Transient sync flags and legacy mirrors stay out of localStorage;
      // `serverSynced` persists because it gates the one-time legacy backup.
      partialize: (state) => {
        const rest: Partial<TeacherState> = { ...state }
        delete rest.syncing
        delete rest.syncError
        delete rest.legacyTeachers
        delete rest.legacyDepartments
        return rest
      },
      migrate: (persistedState: unknown, version: number) => {
        const ps = persistedState as Partial<TeacherState>
        if (version < 3) {
          return {
            ...ps,
            teachers: [],
            departments: [],
            subjects: [],
            designations: [],
            attendance: {},
          } as TeacherState
        }
        return ps as TeacherState
      },
    }
  )
)

registerStoreReset(() => {
  syncPromise = null
  lastSyncAt = 0
  useTeacherStore.setState({
    teachers: [],
    subjects: [],
    departments: [],
    designations: [],
    attendance: {},
    serverSynced: false,
    syncing: false,
    syncError: null,
    legacyTeachers: [],
    legacyDepartments: [],
  })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-teachers_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        useTeacherStore.setState({
          ...parsed.state,
          attendance: pruneAttendance(parsed.state.attendance || {}),
          syncing: false,
          syncError: null,
          legacyTeachers: readLegacy<LegacyTeachersBackup>(legacyTeachersBackupKey())?.teachers ?? [],
          legacyDepartments: readLegacy<LegacyDepartmentsBackup>(legacyDepartmentsBackupKey())?.departments ?? [],
        })
      }
    } else {
      useTeacherStore.setState({
        teachers: [], subjects: [], departments: [], designations: [], attendance: {},
        serverSynced: false, syncing: false, syncError: null, legacyTeachers: [], legacyDepartments: [],
      })
    }
  } catch {
    useTeacherStore.setState({
      teachers: [], subjects: [], departments: [], designations: [], attendance: {},
      serverSynced: false, syncing: false, syncError: null, legacyTeachers: [], legacyDepartments: [],
    })
  }
})
