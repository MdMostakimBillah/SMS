import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMemo } from 'react'
import type { StudentAdmission } from '@/pages/students/admission/types'
import { useClassStore } from './classStore'

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
  addStudent: (student: StudentAdmission) => void
  updateStudent: (id: string, data: Partial<StudentAdmission>) => void
  approveStudent: (id: string, billingDate?: string) => void
  rejectStudent: (id: string) => void
  deactivateStudent: (id: string, inactiveAt: string, inactiveReason: string) => void
  reactivateStudent: (id: string, billingDate?: string) => void
  toggleStudentActive: (id: string) => void
  getNextId: () => string
}

export const useAdmissionStore = create<AdmissionState>()(
  persist(
    (set, get) => ({
      students: [],

      addStudent: (student) => set((state) => ({ students: [student, ...state.students] })),

      updateStudent: (id, data) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s)),
        })),

      approveStudent: (id, billingDate) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: 'approved',
                  active: true,
                  approvedAt: new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString().split('T')[0],
                  billingDate: billingDate || s.billingDate,
                }
              : s
          ),
        })),

      rejectStudent: (id) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, status: 'rejected', updatedAt: new Date().toISOString().split('T')[0] } : s
          ),
        })),

      toggleStudentActive: (id) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, active: s.active === false ? true : false, updatedAt: new Date().toISOString().split('T')[0] } : s
          ),
        })),

      deactivateStudent: (id, inactiveAt, inactiveReason) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id
              ? { ...s, active: false, inactiveAt, inactiveReason, updatedAt: new Date().toISOString().split('T')[0] }
              : s
          ),
        })),

      reactivateStudent: (id, billingDate) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id
              ? { ...s, active: true, inactiveAt: undefined, inactiveReason: undefined, billingDate: billingDate || s.billingDate, updatedAt: new Date().toISOString().split('T')[0] }
              : s
          ),
        })),

      getNextId: () => {
        const year = new Date().getFullYear()
        const count = get().students.length + 1
        const num = String(10000 + count).padStart(5, '0')
        return `ET-${year}-${num}`
      },
    }),
    {
      name: 'edutech-admissions',
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
    () => students.filter((s) => s.academicYear === currentSession),
    [students, currentSession]
  )
}
