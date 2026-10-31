import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMemo } from 'react'
import type { StudentAdmission } from '@/pages/students/admission/types'
import { useClassStore } from './classStore'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { studentsApi } from '@/lib/api'
import { isLocalComputerMode } from '@/lib/storageMode'
import { serverStudentToStudent, studentToPayload } from '@/lib/studentMappers'

function normalizeClassName(raw: string, classes: { id: string; name: string }[]): string {
  if (!raw) return raw
  if (/^\d+$/.test(raw)) {
    const num = raw.replace(/^0+/, '')
    const match = classes.find((cls) => cls.name === `Class ${num}`)
    return match ? match.name : raw
  }
  return raw
}

interface AdmissionState {
  students: StudentAdmission[]
  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: () => Promise<void>
  addStudent: (student: StudentAdmission) => void
  bulkAddStudents: (students: StudentAdmission[]) => void
  updateStudent: (id: string, data: Partial<StudentAdmission>) => void
  deleteStudent: (id: string) => void
  approveStudent: (id: string, billingDate?: string) => void
  rejectStudent: (id: string) => void
  deactivateStudent: (id: string, inactiveAt: string, inactiveReason: string) => void
  reactivateStudent: (id: string, billingDate?: string) => void
  toggleStudentActive: (id: string) => void
  getNextId: () => string
}

let syncPromise: Promise<void> | null = null
let lastSyncAt = 0
const SYNC_MIN_INTERVAL_MS = 1500

export const useAdmissionStore = create<AdmissionState>()(
  persist(
    (set, get) => ({
      students: [],
      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async () => {
        // When in Local Computer mode, cloud database sync is stopped completely;
        // students stay in local computer storage (JSON/localStorage).
        if (isLocalComputerMode()) {
          set({ syncing: false, serverSynced: true, syncError: null })
          return
        }

        if (syncPromise) return syncPromise
        const current = get()
        if (current.serverSynced && Date.now() - lastSyncAt < SYNC_MIN_INTERVAL_MS) return
        if (!current.serverSynced) set({ syncing: true, syncError: null })

        syncPromise = (async () => {
          try {
            const res = await studentsApi.list({ pageSize: 1000 })
            const serverStudents = (res.students || []).map(serverStudentToStudent)

            const prev = get().students
            // If server returned students, update store
            if (serverStudents.length > 0) {
              set({
                students: serverStudents,
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (prev.length > 0) {
              // Local records exist but server is empty: keep local and attempt initial sync
              set({ serverSynced: true, syncing: false, syncError: null })
            } else {
              set({ students: [], serverSynced: true, syncing: false, syncError: null })
            }
            lastSyncAt = Date.now()
          } catch (err: any) {
            console.warn('[admissionStore] syncFromServer failed, falling back to local cache:', err?.message || err)
            set({ syncing: false, serverSynced: true, syncError: err?.message || 'Sync failed' })
          } finally {
            syncPromise = null
          }
        })()

        return syncPromise
      },

      addStudent: (student) => {
        set((state) => ({ students: [student, ...state.students] }))
        if (!isLocalComputerMode()) {
          studentsApi.create(studentToPayload(student)).catch((err) => {
            console.error('[admissionStore] background create failed:', err)
          })
        }
      },

      bulkAddStudents: (newStudents) => {
        set((state) => {
          const map = new Map(state.students.map((s) => [s.id, s]))
          for (const s of newStudents) {
            map.set(s.id, s)
          }
          return { students: Array.from(map.values()) }
        })
        if (!isLocalComputerMode()) {
          studentsApi.bulkSave(newStudents.map(studentToPayload)).catch((err) => {
            console.error('[admissionStore] background bulkSave failed:', err)
          })
        }
      },

      updateStudent: (id, data) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...data, updatedAt: today } : s)),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.update(id, studentToPayload(data)).catch((err) => {
            console.error('[admissionStore] background update failed:', err)
          })
        }
      },

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.delete(id).catch((err) => {
            console.error('[admissionStore] background delete failed:', err)
          })
        }
      },

      approveStudent: (id, billingDate) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: 'approved',
                  active: true,
                  approvedAt: today,
                  updatedAt: today,
                  billingDate: billingDate || s.billingDate,
                }
              : s
          ),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.update(id, {
            status: 'approved',
            active: true,
            approvedAt: today,
            billingDate: billingDate || undefined,
          }).catch((err) => {
            console.error('[admissionStore] background approve failed:', err)
          })
        }
      },

      rejectStudent: (id) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, status: 'rejected', updatedAt: today } : s
          ),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.update(id, { status: 'rejected' }).catch((err) => {
            console.error('[admissionStore] background reject failed:', err)
          })
        }
      },

      toggleStudentActive: (id) => {
        const today = new Date().toISOString().split('T')[0]
        let newActive = true
        set((state) => ({
          students: state.students.map((s) => {
            if (s.id === id) {
              newActive = s.active === false ? true : false
              return { ...s, active: newActive, updatedAt: today }
            }
            return s
          }),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.update(id, { active: newActive }).catch((err) => {
            console.error('[admissionStore] background toggleActive failed:', err)
          })
        }
      },

      deactivateStudent: (id, inactiveAt, inactiveReason) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id
              ? { ...s, active: false, inactiveAt, inactiveReason, updatedAt: today }
              : s
          ),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.update(id, { active: false, inactiveAt, inactiveReason }).catch((err) => {
            console.error('[admissionStore] background deactivate failed:', err)
          })
        }
      },

      reactivateStudent: (id, billingDate) => {
        const today = new Date().toISOString().split('T')[0]
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id
              ? { ...s, active: true, inactiveAt: undefined, inactiveReason: undefined, billingDate: billingDate || s.billingDate, updatedAt: today }
              : s
          ),
        }))
        if (!isLocalComputerMode()) {
          studentsApi.update(id, { active: true, billingDate: billingDate || undefined, inactiveAt: null, inactiveReason: null }).catch((err) => {
            console.error('[admissionStore] background reactivate failed:', err)
          })
        }
      },

      getNextId: () => {
        const year = new Date().getFullYear()
        const existing = get().students
          .filter((s) => s.id.startsWith(`ET-${year}-`))
          .map((s) => parseInt(s.id.split('-')[2], 10))
          .filter((n) => !isNaN(n))
        const maxNum = existing.length > 0 ? Math.max(...existing) : 9999
        const num = String(maxNum + 1).padStart(5, '0')
        return `ET-${year}-${num}`
      },
    }),
    {
      name: 'edutech-admissions',
      storage: createNamespacedStorage('edutech-admissions', undefined, { debounce: true }),
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          persistedState = { ...persistedState, students: [] }
        }
        const classes = useClassStore.getState().classes
        const students = (persistedState?.students || []).map((s: StudentAdmission) => ({
          ...s,
          class: normalizeClassName(s.class, classes),
          active: s.active !== undefined ? s.active : s.status === 'approved',
        }))
        return { ...persistedState, students }
      },
    }
  )
)

export function useSessionStudents() {
  const students = useAdmissionStore((s) => s.students)
  const currentSession = useClassStore((s) => s.institution.currentSession)
  return useMemo(
    () => students.filter((s) => !s.academicYear || s.academicYear === currentSession),
    [students, currentSession]
  )
}

registerStoreReset(() => {
  useAdmissionStore.setState({ students: [], serverSynced: false, syncing: false, syncError: null })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-admissions_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useAdmissionStore.setState(parsed.state)
    } else {
      useAdmissionStore.setState({ students: [] })
    }
  } catch {
    useAdmissionStore.setState({ students: [] })
  }
})
