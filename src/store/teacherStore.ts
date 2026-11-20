import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Teacher, Department, Subject, Designation } from '@/pages/teachers/types'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites, getSlug } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'
import { markExplicitUserDelete } from '@/lib/vault/bridge'
import { teachersApi, departmentsApi, subjectsApi, designationsApi, attendanceApi, type TeacherData } from '@/lib/api'
import {
  serverTeacherToTeacher,
  serverDepartmentToDepartment,
  serverSubjectToSubject,
  serverDesignationToDesignation,
  teacherToPayload,
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

  /** Fetches teachers + departments + subjects + designations from the secured API; backs up local data on first successful sync. */
  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>
  upsertServerTeacher: (teacher: Teacher) => void
  bulkUpdateTeachers: (updates: Array<{ id: string; data: Partial<Teacher> }>) => void
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
async function fetchAllServerTeachers(schoolId?: string): Promise<Teacher[]> {
  const all: TeacherData[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY
  while (all.length < total) {
    const res = await teachersApi.list(page, 500, schoolId)
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

      syncFromServer: async (slugOrId?: string) => {
        // In Local Computer mode, local PC storage is authoritative — do not make server network calls
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false, syncError: null })
          return
        }

        if (syncPromise) return syncPromise
        const current = get()
        // Fresh server data already on screen: avoid re-fetching on every mount unless tenant requested
        if (current.serverSynced && Date.now() - lastSyncAt < SYNC_MIN_INTERVAL_MS && !slugOrId) return
        if (!current.serverSynced) set({ syncing: true, syncError: null })

        syncPromise = (async () => {
          try {
            const [serverTeachers, deptRes, subjectRes, designationRes, attRes] = await Promise.all([
              fetchAllServerTeachers(slugOrId),
              departmentsApi.list(slugOrId),
              subjectsApi.list(slugOrId).catch(() => ({ data: [], total: 0 })),
              designationsApi.list(slugOrId).catch(() => ({ data: [], total: 0 })),
              attendanceApi.get(slugOrId).catch(() => null),
            ])
            const serverDepts = deptRes.data.map(serverDepartmentToDepartment)
            const serverSubjects = subjectRes.data.map(serverSubjectToSubject)
            const serverDesignations = designationRes.data.map(serverDesignationToDesignation)

            const prev = get()
            let attendance = prev.attendance
            if (attRes?.attendance && typeof attRes.attendance === 'object' && Object.keys(attRes.attendance).length > 0) {
              attendance = pruneAttendance({ ...prev.attendance, ...attRes.attendance })
            }

            // Server-authoritative data: replace with server rows while preserving local un-synced drafts
            const localDraftTeachers = prev.teachers.filter(
              (t) => (t.id.startsWith('local-') || t.id.startsWith('loc-')) && !serverTeachers.some((st) => st.id === t.id)
            )
            const finalTeachers = [...serverTeachers, ...localDraftTeachers]

            const localDraftDepts = prev.departments.filter(
              (d) => (d.id.startsWith('local-') || d.id.startsWith('loc-')) && !serverDepts.some((sd) => sd.id === d.id)
            )
            const finalDepartments = [...serverDepts, ...localDraftDepts]

            // Subjects: server-authoritative + un-synced local drafts (e.g. SUB- / local- prefix)
            const localDraftSubjects = prev.subjects.filter(
              (s) => (s.id.startsWith('local-') || s.id.startsWith('SUB-')) && !serverSubjects.some((ss) => ss.id === s.id)
            )
            const finalSubjects = [...serverSubjects, ...localDraftSubjects]

            // Designations: server-authoritative + un-synced local drafts (e.g. DES- / local- prefix)
            const localDraftDesignations = prev.designations.filter(
              (d) => (d.id.startsWith('local-') || d.id.startsWith('DES-')) && !serverDesignations.some((sd) => sd.id === d.id)
            )
            const finalDesignations = [...serverDesignations, ...localDraftDesignations]

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
              teachers: finalTeachers,
              departments: finalDepartments,
              subjects: finalSubjects,
              designations: finalDesignations,
              attendance,
              legacyTeachers: readLegacy<LegacyTeachersBackup>(legacyTeachersBackupKey())?.teachers ?? [],
              legacyDepartments: readLegacy<LegacyDepartmentsBackup>(legacyDepartmentsBackupKey())?.departments ?? [],
              serverSynced: true,
              syncing: false,
              syncError: null,
            })
            // Always update local PC storage & vault with fresh synced state
            flushPendingWrites()
            void flushVaultWrites()
          } catch (err) {
            // Never replace local rows with an error: a failed sync leaves the
            // store untouched and surfaces syncError instead.
            if (!get().serverSynced) {
              set({ syncing: false, syncError: apiErrorMessage(err, false) })
            }
          } finally {
            syncPromise = null
          }
        })()
        return syncPromise
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true })
        try {
          const state = get()
          // Sync any local departments that are not on server
          for (const d of state.departments) {
            if (d.id.startsWith('loc-') || d.id.startsWith('DEP-') || d.id.startsWith('local-')) {
              try {
                const created = await departmentsApi.create({
                  name: d.name,
                  nameBn: d.nameBn || null,
                  head: d.head || null,
                })
                if (created?.id) {
                  get().upsertServerDepartment(serverDepartmentToDepartment(created))
                }
              } catch {}
            }
          }

          // Sync any local subjects
          for (const s of state.subjects) {
            if (s.id.startsWith('SUB-') || s.id.startsWith('local-')) {
              try {
                const created = await subjectsApi.create({
                  name: s.name,
                  nameBn: s.nameBn || null,
                  departmentId: s.departmentId || null,
                  departmentIds: s.departmentIds || (s.departmentId ? [s.departmentId] : []),
                })
                if (created?.id) {
                  get().deleteSubject(s.id)
                  get().upsertServerSubject(serverSubjectToSubject(created))
                }
              } catch {}
            }
          }

          // Sync any local designations
          for (const des of state.designations) {
            if (des.id.startsWith('DES-') || des.id.startsWith('local-')) {
              try {
                const created = await designationsApi.create({
                  name: des.name,
                  nameBn: des.nameBn || null,
                })
                if (created?.id) {
                  get().deleteDesignation(des.id)
                  get().upsertServerDesignation(serverDesignationToDesignation(created))
                }
              } catch {}
            }
          }

          // Sync any local teachers
          for (const t of state.teachers) {
            if (t.id.startsWith('local-') || (t.id.startsWith('ET') && !t.createdAt)) {
              try {
                const created = await teachersApi.create(teacherToPayload(t))
                if (created?.id) {
                  get().removeServerTeacher(t.id)
                  get().upsertServerTeacher(serverTeacherToTeacher(created))
                }
              } catch {}
            }
          }

          set({ serverSynced: true, syncing: false, syncError: null })
          flushPendingWrites()
          void flushVaultWrites()
        } catch (err) {
          console.warn('[teacherStore] syncToServer error:', err)
          set({ syncing: false })
        }
      },

      upsertServerTeacher: (teacher) => {
        set((state) => ({
          teachers: state.teachers.some((t) => t.id === teacher.id)
            ? state.teachers.map((t) => (t.id === teacher.id ? teacher : t))
            : [teacher, ...state.teachers],
        }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      bulkUpdateTeachers: (updates) => {
        if (!updates || updates.length === 0) return
        const today = new Date().toISOString()
        const updateMap = new Map<string, Partial<Teacher>>()
        for (const u of updates) {
          updateMap.set(u.id, u.data)
        }
        set((state) => ({
          teachers: state.teachers.map((t) => {
            const patch = updateMap.get(t.id)
            return patch ? { ...t, ...patch, updatedAt: today } : t
          }),
        }))
        flushPendingWrites()
        void flushVaultWrites()
        if (!isLocalComputerMode()) {
          for (const u of updates) {
            const payload: Partial<TeacherData> = {
              ...(u.data as any),
              ...(u.data.salary !== undefined ? { salary: u.data.salary != null ? String(u.data.salary) : null } : {}),
            }
            Promise.resolve(teachersApi.update(u.id, payload)).catch(() => {})
          }
        }
      },

      removeServerTeacher: (id) => {
        markExplicitUserDelete()
        set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      upsertServerDepartment: (dept) => {
        set((state) => ({
          departments: state.departments.some((d) => d.id === dept.id)
            ? state.departments.map((d) => (d.id === dept.id ? dept : d))
            : [...state.departments, dept],
        }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      removeServerDepartment: (id) => {
        markExplicitUserDelete()
        set((state) => ({ departments: state.departments.filter((d) => d.id !== id) }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      upsertServerSubject: (sub) => {
        set((state) => ({
          subjects: state.subjects.some((s) => s.id === sub.id)
            ? state.subjects.map((s) => (s.id === sub.id ? sub : s))
            : [...state.subjects, sub],
        }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      removeServerSubject: (id) => {
        markExplicitUserDelete()
        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      upsertServerDesignation: (des) => {
        set((state) => ({
          designations: state.designations.some((d) => d.id === des.id)
            ? state.designations.map((d) => (d.id === des.id ? des : d))
            : [...state.designations, des],
        }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      removeServerDesignation: (id) => {
        markExplicitUserDelete()
        set((state) => ({ designations: state.designations.filter((d) => d.id !== id) }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      addSubject: (sub) => {
        set((state) => ({ subjects: [...state.subjects, sub] }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      updateSubject: (id, data) => {
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s)),
        }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      deleteSubject: (id) => {
        markExplicitUserDelete()
        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      addDesignation: (des) => {
        set((state) => ({ designations: [...state.designations, des] }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      updateDesignation: (id, data) => {
        set((state) => ({
          designations: state.designations.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString().split('T')[0] } : d)),
        }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      deleteDesignation: (id) => {
        markExplicitUserDelete()
        set((state) => ({ designations: state.designations.filter((d) => d.id !== id) }))
        flushPendingWrites()
        void flushVaultWrites()
      },

      markAttendance: (date, teacherId, status) => {
        let newAttendance: Record<string, Record<string, DayAttendance>> = {}
        set((state) => {
          const dayAtt = state.attendance[date] || {}
          const existing = dayAtt[teacherId]
          const punches = existing?.punches || []
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          const newPunches = status === 'present' ? [...punches, { time, type: 'in' as const }] : punches
          newAttendance = pruneAttendance({
            ...state.attendance,
            [date]: {
              ...dayAtt,
              [teacherId]: { status, punches: newPunches },
            },
          })
          return { attendance: newAttendance }
        })
        flushPendingWrites()
        void flushVaultWrites()
        if (!isLocalComputerMode()) {
          Promise.resolve(attendanceApi.updateAttendance({ attendance: newAttendance })).catch(() => {})
        }
      },

      markAllPresent: (date) => {
        let newAttendance: Record<string, Record<string, DayAttendance>> = {}
        set((state) => {
          const dayAtt: Record<string, DayAttendance> = {}
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          get()
            .teachers.filter((t) => t.status === 'active')
            .forEach((t) => {
              dayAtt[t.id] = { status: 'present', punches: [{ time, type: 'in' }] }
            })
          newAttendance = pruneAttendance({ ...state.attendance, [date]: dayAtt })
          return { attendance: newAttendance }
        })
        flushPendingWrites()
        void flushVaultWrites()
        if (!isLocalComputerMode()) {
          Promise.resolve(attendanceApi.updateAttendance({ attendance: newAttendance })).catch(() => {})
        }
      },

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
  const slug = getSlug()
  try {
    const key = slug ? `edutech-teachers_${slug}` : 'edutech-teachers'
    const raw = localStorage.getItem(key) || (slug ? localStorage.getItem('edutech-teachers') : null)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) {
        useTeacherStore.setState({
          ...parsed.state,
          attendance: pruneAttendance(parsed.state.attendance || {}),
          syncing: false,
          syncError: null,
          legacyTeachers: readLegacy<LegacyTeachersBackup>(legacyTeachersBackupKey())?.teachers ?? [],
          legacyDepartments: readLegacy<LegacyDepartmentsBackup>(legacyDepartmentsBackupKey())?.departments ?? [],
        })
      }
    }
  } catch {
    /* ignore parse error */
  }
})
