import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BreakTime {
  id: string
  label: string
  start: string
  end: string
}

export interface InstitutionSettings {
  name: string
  nameBn: string
  phone: string
  email: string
  address: string
  website: string
  startTime: string
  endTime: string
  breaks: BreakTime[]
  currentSession: string
  sessions: string[]
}

export interface RoutineSlot {
  subjectId: string
  teacherId: string
  sectionId?: string
}

export interface ClassRoutine {
  classId: string
  sectionId: string
  periodDuration: number
  weekendDays: number[]
  periods: RoutineSlot[][]
}

export interface ClassSection {
  id: string
  name: string
  seatQuantity: number
  classTeacherId: string
  subjectIds: string[]
}

export interface ClassInfo {
  id: string
  name: string
  nameBn: string
  sections: ClassSection[]
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

export function getClassOptions(classes: ClassInfo[]): string[] {
  return classes.map(cls => cls.name)
}

export function buildSectionsMap(classes: ClassInfo[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  classes.forEach(cls => {
    map[cls.name] = cls.sections.map(s => s.name)
  })
  return map
}

export function getAllSections(classes: ClassInfo[]): string[] {
  const sectionSet = new Set<string>()
  classes.forEach(cls => cls.sections.forEach(s => sectionSet.add(s.name)))
  return Array.from(sectionSet).sort()
}

interface ClassState {
  institution: InstitutionSettings
  classes: ClassInfo[]
  routines: ClassRoutine[]
  sessionClasses: Record<string, ClassInfo[]>
  sessionRoutines: Record<string, ClassRoutine[]>
  updateInstitution: (data: Partial<InstitutionSettings>) => void
  addClass: (cls: ClassInfo) => void
  updateClass: (id: string, data: Partial<ClassInfo>) => void
  deleteClass: (id: string) => void
  addSection: (classId: string, section: ClassSection) => void
  updateSection: (classId: string, sectionId: string, data: Partial<ClassSection>) => void
  deleteSection: (classId: string, sectionId: string) => void
  updateRoutine: (classId: string, routine: Partial<ClassRoutine>) => void
  setRoutineSlot: (classId: string, day: number, period: number, slot: RoutineSlot) => void
  clearRoutineSlot: (classId: string, day: number, period: number, sectionId?: string) => void
  switchSession: (session: string) => void
  addSession: (session: string) => void
  removeSession: (session: string) => void
}

const defaultInstitution: InstitutionSettings = {
  name: 'EduTech School Management',
  nameBn: 'এডুটেক স্কুল ম্যানেজমেন্ট',
  phone: '+880-2-1234567',
  email: 'info@edutech.edu.bd',
  address: 'Sunrise Academy, Dhaka, Bangladesh',
  website: 'www.edutech.edu.bd',
  startTime: '07:30',
  endTime: '14:30',
  breaks: [
    { id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' },
  ],
  currentSession: '2025-26',
  sessions: ['2024-25', '2025-26'],
}

const defaultClasses: ClassInfo[] = [
  { id: 'CLS-01', name: 'Class 1', nameBn: 'শ্রেণি ১', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-01-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-005', subjectIds: [] },
    { id: 'SEC-01-B', name: 'B', seatQuantity: 40, classTeacherId: 'TCH-2026-009', subjectIds: [] },
  ]},
  { id: 'CLS-02', name: 'Class 2', nameBn: 'শ্রেণি ২', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-02-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-010', subjectIds: [] },
    { id: 'SEC-02-B', name: 'B', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
  ]},
  { id: 'CLS-03', name: 'Class 3', nameBn: 'শ্রেণি ৩', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-03-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-003', subjectIds: [] },
  ]},
  { id: 'CLS-04', name: 'Class 4', nameBn: 'শ্রেণি ৪', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-04-A', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
    { id: 'SEC-04-B', name: 'B', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
  ]},
  { id: 'CLS-05', name: 'Class 5', nameBn: 'শ্রেণি ৫', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-05-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-016', subjectIds: [] },
  ]},
  { id: 'CLS-06', name: 'Class 6', nameBn: 'শ্রেণি ৬', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-06-A', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
    { id: 'SEC-06-B', name: 'B', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
  ]},
  { id: 'CLS-07', name: 'Class 7', nameBn: 'শ্রেণি ৭', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-07-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-017', subjectIds: [] },
  ]},
  { id: 'CLS-08', name: 'Class 8', nameBn: 'শ্রেণি ৮', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-08-A', name: 'A', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
    { id: 'SEC-08-B', name: 'B', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
  ]},
  { id: 'CLS-09', name: 'Class 9', nameBn: 'শ্রেণি ৯', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-09-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-001', subjectIds: [] },
    { id: 'SEC-09-B', name: 'B', seatQuantity: 40, classTeacherId: 'TCH-2026-004', subjectIds: [] },
    { id: 'SEC-09-C', name: 'C', seatQuantity: 40, classTeacherId: '', subjectIds: [] },
  ]},
      { id: 'CLS-10', name: 'Class 10', nameBn: 'শ্রেণি ১০', startTime: '07:30', endTime: '14:30', createdAt: '2026-01-01', updatedAt: '2026-01-01', sections: [
    { id: 'SEC-10-A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-2026-014', subjectIds: [] },
    { id: 'SEC-10-B', name: 'B', seatQuantity: 40, classTeacherId: 'TCH-2026-015', subjectIds: [] },
  ]},
]

const defaultRoutines: ClassRoutine[] = [
  { classId: 'CLS-09', sectionId: 'SEC-09-A', periodDuration: 40, weekendDays: [5], periods: [
    [{ subjectId: 'SUB-001', teacherId: 'TCH-2026-001' }, { subjectId: 'SUB-003', teacherId: 'TCH-2026-004' }, { subjectId: 'SUB-004', teacherId: 'TCH-2026-016' }, { subjectId: 'SUB-005', teacherId: 'TCH-2026-015' }, { subjectId: 'SUB-008', teacherId: 'TCH-2026-006' }, { subjectId: 'SUB-002', teacherId: 'TCH-2026-003' }, { subjectId: 'SUB-006', teacherId: 'TCH-2026-008' }],
    [{ subjectId: 'SUB-004', teacherId: 'TCH-2026-016' }, { subjectId: 'SUB-001', teacherId: 'TCH-2026-001' }, { subjectId: 'SUB-003', teacherId: 'TCH-2026-004' }, { subjectId: 'SUB-002', teacherId: 'TCH-2026-003' }, { subjectId: 'SUB-005', teacherId: 'TCH-2026-015' }, { subjectId: 'SUB-007', teacherId: 'TCH-2026-011' }, { subjectId: 'SUB-008', teacherId: 'TCH-2026-006' }],
    [{ subjectId: 'SUB-003', teacherId: 'TCH-2026-004' }, { subjectId: 'SUB-005', teacherId: 'TCH-2026-015' }, { subjectId: 'SUB-001', teacherId: 'TCH-2026-001' }, { subjectId: 'SUB-004', teacherId: 'TCH-2026-016' }, { subjectId: 'SUB-006', teacherId: 'TCH-2026-008' }, { subjectId: 'SUB-002', teacherId: 'TCH-2026-003' }, { subjectId: 'SUB-007', teacherId: 'TCH-2026-011' }],
    [{ subjectId: 'SUB-002', teacherId: 'TCH-2026-003' }, { subjectId: 'SUB-008', teacherId: 'TCH-2026-006' }, { subjectId: 'SUB-004', teacherId: 'TCH-2026-016' }, { subjectId: 'SUB-001', teacherId: 'TCH-2026-001' }, { subjectId: 'SUB-003', teacherId: 'TCH-2026-004' }, { subjectId: 'SUB-005', teacherId: 'TCH-2026-015' }, { subjectId: 'SUB-006', teacherId: 'TCH-2026-008' }],
    [{ subjectId: 'SUB-005', teacherId: 'TCH-2026-015' }, { subjectId: 'SUB-004', teacherId: 'TCH-2026-016' }, { subjectId: 'SUB-002', teacherId: 'TCH-2026-003' }, { subjectId: 'SUB-003', teacherId: 'TCH-2026-004' }, { subjectId: 'SUB-001', teacherId: 'TCH-2026-001' }, { subjectId: 'SUB-007', teacherId: 'TCH-2026-011' }, { subjectId: 'SUB-008', teacherId: 'TCH-2026-006' }],
  ]},
]

export const useClassStore = create<ClassState>()(
  persist(
    (set, _get) => ({
      institution: defaultInstitution,
      classes: defaultClasses,
      routines: defaultRoutines,
      sessionClasses: { '2025-26': defaultClasses },
      sessionRoutines: { '2025-26': defaultRoutines },

      updateInstitution: (data) =>
        set((state) => ({ institution: { ...state.institution, ...data } })),

      addClass: (cls) =>
        set((state) => ({ classes: [...state.classes, cls] })),

      updateClass: (id, data) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().split('T')[0] } : c
          ),
        })),

      deleteClass: (id) =>
        set((state) => ({ classes: state.classes.filter((c) => c.id !== id) })),

      addSection: (classId, section) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId ? { ...c, sections: [...c.sections, section], updatedAt: new Date().toISOString().split('T')[0] } : c
          ),
        })),

      updateSection: (classId, sectionId, data) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...data } : s)), updatedAt: new Date().toISOString().split('T')[0] }
              : c
          ),
        })),

      deleteSection: (classId, sectionId) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, sections: c.sections.filter((s) => s.id !== sectionId), updatedAt: new Date().toISOString().split('T')[0] }
              : c
          ),
        })),

      updateRoutine: (classId, routine) =>
        set((state) => {
          const existing = state.routines.find(r => r.classId === classId && r.sectionId === routine.sectionId)
          if (existing) {
            return { routines: state.routines.map(r => r.classId === classId && r.sectionId === routine.sectionId ? { ...r, ...routine, weekendDays: routine.weekendDays ?? r.weekendDays } : r) }
          }
          return { routines: [...state.routines, { classId, sectionId: routine.sectionId || '', periodDuration: 40, weekendDays: [5], periods: [], ...routine }] }
        }),

      setRoutineSlot: (classId, day, period, slot) =>
        set((state) => {
          const routines = [...state.routines]
          const sectionId = slot.sectionId || state.routines.find(r => r.classId === classId)?.sectionId || ''
          let idx = routines.findIndex(r => r.classId === classId && r.sectionId === sectionId)
          if (idx === -1) {
            routines.push({ classId, sectionId, periodDuration: 40, weekendDays: [5], periods: [] })
            idx = routines.length - 1
          }
          const periods = [...routines[idx].periods]
          while (periods.length <= day) periods.push([])
          periods[day] = [...periods[day]]
          while (periods[day].length <= period) periods[day].push({ subjectId: '', teacherId: '' })
          periods[day][period] = slot
          routines[idx] = { ...routines[idx], periods }
          return { routines }
        }),

      clearRoutineSlot: (classId, day, period, sectionId) =>
        set((state) => {
          const routines = [...state.routines]
          const sid = sectionId || state.routines.find(r => r.classId === classId)?.sectionId || ''
          const idx = routines.findIndex(r => r.classId === classId && r.sectionId === sid)
          if (idx === -1) return state
          const periods = [...routines[idx].periods]
          if (!periods[day]) return state
          periods[day] = [...periods[day]]
          periods[day][period] = { subjectId: '', teacherId: '' }
          routines[idx] = { ...routines[idx], periods }
          return { routines }
        }),

      switchSession: (session) =>
        set((state) => {
          const { institution, classes, routines, sessionClasses, sessionRoutines } = state
          const prevSession = institution.currentSession
          const newSessionClasses = { ...sessionClasses, [prevSession]: classes }
          const newSessionRoutines = { ...sessionRoutines, [prevSession]: routines }
          const targetClasses = newSessionClasses[session] || []
          const targetRoutines = newSessionRoutines[session] || []
          return {
            institution: { ...institution, currentSession: session },
            classes: targetClasses,
            routines: targetRoutines,
            sessionClasses: newSessionClasses,
            sessionRoutines: newSessionRoutines,
          }
        }),

      addSession: (session) =>
        set((state) => {
          const { institution } = state
          if (institution.sessions.includes(session)) return state
          return {
            institution: {
              ...institution,
              sessions: [...institution.sessions, session],
            },
          }
        }),

      removeSession: (session) =>
        set((state) => {
          const { institution, sessionClasses, sessionRoutines } = state
          const newSessions = institution.sessions.filter(s => s !== session)
          const newSessionClasses = { ...sessionClasses }
          const newSessionRoutines = { ...sessionRoutines }
          delete newSessionClasses[session]
          delete newSessionRoutines[session]
          const newCurrent = institution.currentSession === session ? newSessions[0] || '' : institution.currentSession
          const targetClasses = newSessionClasses[newCurrent] || state.classes
          const targetRoutines = newSessionRoutines[newCurrent] || state.routines
          return {
            institution: { ...institution, sessions: newSessions, currentSession: newCurrent },
            classes: targetClasses,
            routines: targetRoutines,
            sessionClasses: newSessionClasses,
            sessionRoutines: newSessionRoutines,
          }
        }),
    }),
    {
      name: 'edutech-classes',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const inst = persistedState?.institution
          if (inst && !inst.breaks) {
            inst.breaks = inst.breakStart
              ? [{ id: 'BRK-1', label: 'Tiffin', start: inst.breakStart, end: inst.breakEnd || '11:30' }]
              : [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }]
            delete inst.breakStart
            delete inst.breakEnd
          }
        }
        if (version < 2) {
          const inst = persistedState?.institution
          if (inst && !inst.currentSession) {
            inst.currentSession = '2025-26'
            inst.sessions = ['2024-25', '2025-26']
          }
          if (!persistedState?.sessionClasses) {
            persistedState.sessionClasses = { '2025-26': persistedState.classes || [] }
            persistedState.sessionRoutines = { '2025-26': persistedState.routines || [] }
          }
        }
        return persistedState
      },
    }
  )
)
