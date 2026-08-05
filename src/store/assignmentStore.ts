import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreRehydrate } from '@/lib/storage'

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
  addAssignment: (a: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateAssignment: (id: string, data: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  addSubmission: (s: Omit<AssignmentSubmission, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSubmission: (id: string, data: Partial<AssignmentSubmission>) => void
  deleteSubmission: (id: string) => void
}

const today = () => new Date().toISOString().split('T')[0]

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set) => ({
      assignments: [],
      submissions: [],
      addAssignment: (a) =>
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
        }),
      updateAssignment: (id, data) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: today() } : a
          ),
        })),
      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
          submissions: state.submissions.filter((s) => s.assignmentId !== id),
        })),
      addSubmission: (s) =>
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
        }),
      updateSubmission: (id, data) =>
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: today() } : s
          ),
        })),
      deleteSubmission: (id) =>
        set((state) => ({
          submissions: state.submissions.filter((s) => s.id !== id),
        })),
    }),
    { name: 'edutech-assignments', storage: createNamespacedStorage('edutech-assignments'), version: 1 }
  )
)

registerStoreRehydrate(() => useAssignmentStore.persist.rehydrate())
