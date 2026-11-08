import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { isRecentExplicitDelete } from '@/lib/vault/bridge'
import { assignmentsApi } from '@/lib/api'

export type AssignmentStatus = 'active' | 'draft' | 'closed' | 'archived'
export type SubmissionStatus = 'submitted' | 'reviewed' | 'returned' | 'late'
export type AssignmentType = 'homework' | 'assignment'

export interface Assignment {
  id: string
  createdAt: string
  updatedAt: string
  type: AssignmentType
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  subjectId: string
  classId: string
  sectionId: string
  teacherId: string
  dueDate: string
  maxMarks: number
  status: AssignmentStatus
  attachments: string[]
}

export interface AssignmentSubmission {
  id: string
  createdAt: string
  updatedAt: string
  assignmentId: string
  studentId: string
  studentName: string
  studentNameBn: string
  submittedAt: string
  fileUrl: string
  marks: number | null
  feedback: string
  feedbackBn: string
  status: SubmissionStatus
}

interface AssignmentState {
  assignments: Assignment[]
  submissions: AssignmentSubmission[]
  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>
  setAssignments: (assignments: Assignment[]) => void
  setSubmissions: (submissions: AssignmentSubmission[]) => void

  addAssignment: (a: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAssignment: (id: string, data: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  addSubmission: (s: Omit<AssignmentSubmission, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSubmission: (id: string, data: Partial<AssignmentSubmission>) => void
  deleteSubmission: (id: string) => void
}

const today = () => new Date().toISOString().split('T')[0]

let serverSyncTimer: any = null
function queueServerSync(get: () => AssignmentState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    if (!state.serverSynced && state.assignments.length === 0 && state.submissions.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.assignments.length === 0 && s.submissions.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await assignmentsApi.update({
          assignments: s.assignments,
          submissions: s.submissions,
        })
      } catch (e) {
        console.warn('[assignments] Background sync failed:', e)
      }
    }, 500)
  } catch {
    /* ignore */
  }
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set, get) => ({
      assignments: [],
      submissions: [],
      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false, syncError: null })
          return
        }
        try {
          set({ syncing: true, syncError: null })
          const res = await assignmentsApi.get(slugOrId)
          if (res?.storageMode === 'local_computer') {
            set({ serverSynced: true, syncing: false })
            return
          }
          if (res && (Array.isArray(res.assignments) || Array.isArray(res.submissions))) {
            set({
              assignments: Array.isArray(res.assignments) ? res.assignments : get().assignments,
              submissions: Array.isArray(res.submissions) ? res.submissions : get().submissions,
              serverSynced: true,
              syncing: false,
              syncError: null,
            })
          } else {
            set({ serverSynced: true, syncing: false })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch assignments from server'
          set({ syncing: false, syncError: msg })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        try {
          set({ syncing: true, syncError: null })
          const s = get()
          await assignmentsApi.update({
            assignments: s.assignments,
            submissions: s.submissions,
          })
          set({ syncing: false, serverSynced: true })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to save assignments to server'
          set({ syncing: false, syncError: msg })
        }
      },

      setAssignments: (assignments) => {
        set({ assignments })
        queueServerSync(get)
      },

      setSubmissions: (submissions) => {
        set({ submissions })
        queueServerSync(get)
      },

      addAssignment: (a) => {
        set((state) => {
          const year = new Date().getFullYear()
          const existing = state.assignments
            .filter((x) => x.id.startsWith(`ASN-${year}-`))
            .map((x) => parseInt(x.id.split('-')[2], 10))
            .filter((n) => !isNaN(n))
          const maxNum = existing.length > 0 ? Math.max(...existing) : 0
          const id = `ASN-${year}-${String(maxNum + 1).padStart(3, '0')}`
          const now = today()
          return {
            assignments: [{ ...a, id, createdAt: now, updatedAt: now }, ...state.assignments],
          }
        })
        queueServerSync(get)
      },

      updateAssignment: (id, data) => {
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: today() } : a
          ),
        }))
        queueServerSync(get)
      },

      deleteAssignment: (id) => {
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
          submissions: state.submissions.filter((s) => s.assignmentId !== id),
        }))
        queueServerSync(get)
      },

      addSubmission: (s) => {
        set((state) => {
          const year = new Date().getFullYear()
          const existing = state.submissions
            .filter((x) => x.id.startsWith(`SUB-${year}-`))
            .map((x) => parseInt(x.id.split('-')[2], 10))
            .filter((n) => !isNaN(n))
          const maxNum = existing.length > 0 ? Math.max(...existing) : 0
          const id = `SUB-${year}-${String(maxNum + 1).padStart(3, '0')}`
          const now = today()
          return {
            submissions: [{ ...s, id, createdAt: now, updatedAt: now }, ...state.submissions],
          }
        })
        queueServerSync(get)
      },

      updateSubmission: (id, data) => {
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: today() } : s
          ),
        }))
        queueServerSync(get)
      },

      deleteSubmission: (id) => {
        set((state) => ({
          submissions: state.submissions.filter((s) => s.id !== id),
        }))
        queueServerSync(get)
      },
    }),
    { name: 'edutech-assignments', storage: createNamespacedStorage('edutech-assignments'), version: 1 }
  )
)

registerStoreReset(() => {
  useAssignmentStore.setState({ assignments: [], submissions: [], serverSynced: false, syncing: false, syncError: null })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-assignments_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useAssignmentStore.setState(parsed.state)
    } else {
      useAssignmentStore.setState({ assignments: [], submissions: [], serverSynced: false, syncing: false, syncError: null })
    }
  } catch {
    useAssignmentStore.setState({ assignments: [], submissions: [], serverSynced: false, syncing: false, syncError: null })
  }
})
