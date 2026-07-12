import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Teacher, Department, Subject, Designation } from '@/pages/teachers/types'

export type AttendanceStatus = 'present' | 'absent' | 'on-leave'

export interface PunchRecord {
  time: string
  type: 'in' | 'out'
}

export interface DayAttendance {
  status: AttendanceStatus
  punches: PunchRecord[]
}

interface TeacherState {
  teachers: Teacher[]
  departments: Department[]
  subjects: Subject[]
  designations: Designation[]
  attendance: Record<string, Record<string, DayAttendance>>
  addTeacher: (teacher: Teacher) => void
  updateTeacher: (id: string, data: Partial<Teacher>) => void
  deleteTeacher: (id: string) => void
  getNextTeacherId: () => string
  addDepartment: (dept: Department) => void
  updateDepartment: (id: string, data: Partial<Department>) => void
  deleteDepartment: (id: string) => void
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

export const useTeacherStore = create<TeacherState>()(
  persist(
    (set, get) => ({
      teachers: [],
      departments: [],
      subjects: [],
      designations: [],
      attendance: {},

      addTeacher: (teacher) => set((state) => ({ teachers: [teacher, ...state.teachers] })),

      updateTeacher: (id, data) =>
        set((state) => ({
          teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString().split('T')[0] } : t)),
        })),

      deleteTeacher: (id) => set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),

      getNextTeacherId: () => {
        const year = new Date().getFullYear()
        const existing = get().teachers
          .filter((t) => t.id.startsWith(`TCH-${year}-`))
          .map((t) => parseInt(t.id.split('-')[2], 10))
          .filter((n) => !isNaN(n))
        const maxNum = existing.length > 0 ? Math.max(...existing) : 99
        const num = String(maxNum + 1).padStart(3, '0')
        return `TCH-${year}-${num}`
      },

      addDepartment: (dept) => set((state) => ({ departments: [...state.departments, dept] })),

      updateDepartment: (id, data) =>
        set((state) => ({
          departments: state.departments.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString().split('T')[0] } : d)),
        })),

      deleteDepartment: (id) => set((state) => ({ departments: state.departments.filter((d) => d.id !== id) })),

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
            attendance: {
              ...state.attendance,
              [date]: {
                ...dayAtt,
                [teacherId]: { status, punches: newPunches },
              },
            },
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
          return { attendance: { ...state.attendance, [date]: dayAtt } }
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
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          return {
            ...persistedState,
            teachers: [],
            departments: [],
            subjects: [],
            designations: [],
            attendance: {},
          }
        }
        return persistedState
      },
    }
  )
)
