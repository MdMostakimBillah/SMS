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
  logo: string
  motto: string
  mottoBn: string
  eiin: string
  themeColor: string
  phone: string
  email: string
  address: string
  website: string
  subjects: string[]
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
  periodDurations?: number[]
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
  subjectIds: string[]
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
}

/** Extract class number from name like "Class 1" → "1" */
export function extractClassNumber(className: string): string {
  const match = className.match(/\d+/)
  return match ? match[0] : className
}

export function getClassOptions(classes: ClassInfo[]): string[] {
  return classes.map((cls) => extractClassNumber(cls.name))
}

export function buildSectionsMap(classes: ClassInfo[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  classes.forEach((cls) => {
    const classNum = extractClassNumber(cls.name)
    map[classNum] = cls.sections.map((s) => s.name)
  })
  return map
}

export function getAllSections(classes: ClassInfo[]): string[] {
  const sectionSet = new Set<string>()
  classes.forEach((cls) => cls.sections.forEach((s) => sectionSet.add(s.name)))
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
  importFromSession: (fromSession: string) => void
}

const defaultInstitution: InstitutionSettings = {
  name: 'Sunrise Academy',
  nameBn: 'সানরাইজ একাডেমি',
  logo: '',
  motto: 'Knowledge is Power',
  mottoBn: 'জ্ঞাই হলো শক্তি',
  eiin: '',
  themeColor: '#6366f1',
  phone: '+880-2-1234567',
  email: 'info@sunrise.edu.bd',
  address: 'Sunrise Academy, Dhaka, Bangladesh',
  website: 'www.sunrise.edu.bd',
  subjects: ['Bangla', 'English', 'Mathematics'],
  startTime: '07:30',
  endTime: '14:30',
  breaks: [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
  currentSession: '2025-26',
  sessions: ['2024-25', '2025-26'],
}

const defaultClasses: ClassInfo[] = []

const defaultRoutines: ClassRoutine[] = []

export const useClassStore = create<ClassState>()(
  persist(
    (set, _get) => ({
      institution: defaultInstitution,
      classes: defaultClasses,
      routines: defaultRoutines,
      sessionClasses: { '2025-26': defaultClasses },
      sessionRoutines: { '2025-26': defaultRoutines },

      updateInstitution: (data) => set((state) => ({ institution: { ...state.institution, ...data } })),

      addClass: (cls) => set((state) => ({ classes: [...state.classes, cls] })),

      updateClass: (id, data) =>
        set((state) => ({
          classes: state.classes.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().split('T')[0] } : c)),
        })),

      deleteClass: (id) => set((state) => ({ classes: state.classes.filter((c) => c.id !== id) })),

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
              ? {
                  ...c,
                  sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...data } : s)),
                  updatedAt: new Date().toISOString().split('T')[0],
                }
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
          const existing = state.routines.find((r) => r.classId === classId && r.sectionId === routine.sectionId)
          if (existing) {
            return {
              routines: state.routines.map((r) =>
                r.classId === classId && r.sectionId === routine.sectionId
                  ? { ...r, ...routine, weekendDays: routine.weekendDays ?? r.weekendDays }
                  : r
              ),
            }
          }
          return {
            routines: [
              ...state.routines,
              { classId, sectionId: routine.sectionId || '', periodDuration: 40, weekendDays: [5], periods: [], ...routine },
            ],
          }
        }),

      setRoutineSlot: (classId, day, period, slot) =>
        set((state) => {
          const routines = [...state.routines]
          const sectionId = slot.sectionId || state.routines.find((r) => r.classId === classId)?.sectionId || ''
          let idx = routines.findIndex((r) => r.classId === classId && r.sectionId === sectionId)
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
          const sid = sectionId || state.routines.find((r) => r.classId === classId)?.sectionId || ''
          const idx = routines.findIndex((r) => r.classId === classId && r.sectionId === sid)
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
          const newSessions = institution.sessions.filter((s) => s !== session)
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

      importFromSession: (fromSession) =>
        set((state) => {
          const { institution, sessionClasses, sessionRoutines } = state
          const currentSession = institution.currentSession
          const sourceClasses = sessionClasses[fromSession] || []
          const sourceRoutines = sessionRoutines[fromSession] || []
          if (sourceClasses.length === 0 && sourceRoutines.length === 0) return state

          const now = new Date().toISOString().split('T')[0]
          const newClasses = sourceClasses.map((cls) => ({
            ...cls,
            sections: cls.sections.map((sec) => ({ ...sec, classTeacherId: '' })),
            createdAt: now,
            updatedAt: now,
          }))
          const newRoutines = sourceRoutines.map((r) => ({
            ...r,
            periods: (r.periods || []).map((daySlots: any[]) =>
              (daySlots || []).map((slot: any) => {
                if (!slot?.teacherId) return slot
                return { ...slot, teacherName: slot.teacherName || '' }
              })
            ),
          }))

          return {
            classes: newClasses,
            routines: newRoutines,
            sessionClasses: { ...sessionClasses, [currentSession]: newClasses },
            sessionRoutines: { ...sessionRoutines, [currentSession]: newRoutines },
          }
        }),
    }),
    {
      name: 'edutech-classes',
      version: 6,
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
        if (version < 3) {
          const allClasses = persistedState?.sessionClasses?.['2025-26'] || persistedState?.classes || []
          allClasses.forEach((c: any) => {
            if (!c.subjectIds) c.subjectIds = []
          })
        }
        if (version < 4) {
          const currentSession = persistedState?.institution?.currentSession
          if (currentSession && persistedState?.sessionRoutines?.[currentSession]) {
            const sourceRoutines = persistedState.sessionRoutines[currentSession]
            const sourceClasses = persistedState?.sessionClasses?.[currentSession] || []
            const classIds = new Set(sourceClasses.map((c: any) => c.id))
            const filteredRoutines = sourceRoutines.filter((r: any) => classIds.has(r.classId))
            persistedState.sessionRoutines[currentSession] = filteredRoutines
          }
        }
        if (version < 5) {
          const inst = persistedState?.institution
          if (inst) {
            if (!inst.logo) inst.logo = ''
            if (!inst.motto) inst.motto = ''
            if (!inst.mottoBn) inst.mottoBn = ''
            if (!inst.eiin) inst.eiin = ''
            if (!inst.subjects) inst.subjects = []
          }
        }
        if (version < 6) {
          const inst = persistedState?.institution
          if (inst) {
            if (!inst.themeColor) inst.themeColor = '#6366f1'
          }
        }
        return persistedState
      },
    }
  )
)
