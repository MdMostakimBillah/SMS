import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { classesApi } from '@/lib/api'

export interface BreakTime {
  id: string
  label: string
  start: string
  end: string
}

export interface ThemeColors {
  brand: string
  brand2: string
  brandLight: string
  teal: string
  tealLight: string
  green: string
  greenLight: string
  red: string
  redLight: string
  amber: string
  amberLight: string
  purple: string
  purpleLight: string
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  surface: string
  surface2: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  border: string
  border2: string
  cardBlue: string
  cardYellow: string
  cardGreen: string
  cardPurple: string
}

export const defaultThemeColors: ThemeColors = {
  brand: '#6366f1',
  brand2: '#818cf8',
  brandLight: '#eef2ff',
  teal: '#14b8a6',
  tealLight: '#e6faf7',
  green: '#22c55e',
  greenLight: '#eafbf1',
  red: '#ef4444',
  redLight: '#fef2f2',
  amber: '#f59e0b',
  amberLight: '#fef9ec',
  purple: '#a855f7',
  purpleLight: '#f5f0ff',
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fc',
  bgTertiary: '#f0f2f8',
  surface: '#ffffff',
  surface2: '#f8f9fc',
  textPrimary: '#1a1d2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#e8ecf4',
  border2: '#d5dbe8',
  cardBlue: '#e8f4ff',
  cardYellow: '#fef6d9',
  cardGreen: '#e0f9e8',
  cardPurple: '#f3e8ff',
}

export const defaultThemeColorsDark: ThemeColors = {
  brand: '#818cf8',
  brand2: '#a5b4fc',
  brandLight: 'rgba(129,140,248,0.1)',
  teal: '#2dd4bf',
  tealLight: 'rgba(45,212,191,0.1)',
  green: '#4ade80',
  greenLight: 'rgba(74,222,128,0.1)',
  red: '#f87171',
  redLight: 'rgba(248,113,113,0.1)',
  amber: '#fbbf24',
  amberLight: 'rgba(251,191,36,0.1)',
  purple: '#c084fc',
  purpleLight: 'rgba(192,132,252,0.1)',
  bgPrimary: '#0f0f0f',
  bgSecondary: '#1a1a1a',
  bgTertiary: '#0a0a0a',
  surface: '#1a1a1a',
  surface2: '#242424',
  textPrimary: '#f0f0f0',
  textSecondary: '#a0a0a0',
  textMuted: '#606060',
  border: '#2a2a2a',
  border2: '#3a3a3a',
  cardBlue: 'rgba(129,140,248,0.08)',
  cardYellow: 'rgba(251,191,36,0.08)',
  cardGreen: 'rgba(74,222,128,0.08)',
  cardPurple: 'rgba(192,132,252,0.08)',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('')
}

function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex)
  const factor = amt / 100
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor)
}

function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

export function generateLightColors(brandHex: string): ThemeColors {
  return {
    ...defaultThemeColors,
    brand: brandHex,
    brand2: lighten(brandHex, 20),
    brandLight: withAlpha(brandHex, 0.08),
  }
}

export function generateDarkColors(brandHex: string): ThemeColors {
  const dark = lighten(brandHex, 15)
  return {
    ...defaultThemeColorsDark,
    brand: dark,
    brand2: lighten(brandHex, 30),
    brandLight: withAlpha(dark, 0.12),
  }
}

export function mapSchoolToInstitutionSettings(school: any, current?: InstitutionSettings): InstitutionSettings {
  const brand = school.brandColor || current?.lightColors?.brand || '#6366f1'
  return {
    name: school.name || current?.name || '',
    nameBn: school.nameBn || current?.nameBn || school.name || '',
    logo: school.logo !== undefined ? (school.logo || '') : (current?.logo || ''),
    banner: school.banner !== undefined ? (school.banner || '') : (current?.banner || ''),
    bannerPosition: school.bannerPosition
      ? (typeof school.bannerPosition === 'string' ? JSON.parse(school.bannerPosition) : school.bannerPosition)
      : current?.bannerPosition || { x: 0, y: 0 },
    brandName: school.brandName || current?.brandName || school.name || 'EduTech',
    motto: school.motto !== undefined ? (school.motto || '') : (current?.motto || ''),
    mottoBn: school.mottoBn !== undefined ? (school.mottoBn || '') : (current?.mottoBn || ''),
    eiin: school.eiin !== undefined ? (school.eiin || '') : (current?.eiin || ''),
    phone: school.phone !== undefined ? (school.phone || '') : (current?.phone || ''),
    email: school.email !== undefined ? (school.email || '') : (current?.email || ''),
    address: school.address !== undefined ? (school.address || '') : (current?.address || ''),
    addressBn: school.addressBn !== undefined ? (school.addressBn || '') : (current?.addressBn || ''),
    website: school.website !== undefined ? (school.website || '') : (current?.website || ''),
    subjects: Array.isArray(school.subjects)
      ? school.subjects.map((s: any) => (typeof s === 'string' ? s : s.name))
      : (current?.subjects || []),
    startTime: school.startTime || current?.startTime || '07:30',
    endTime: school.endTime || current?.endTime || '14:30',
    breaks: school.breaks
      ? (typeof school.breaks === 'string' ? JSON.parse(school.breaks) : school.breaks)
      : current?.breaks?.length ? current.breaks : [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
    currentSession: current?.currentSession || '2025-26',
    sessions: school.sessions
      ? (typeof school.sessions === 'string' ? JSON.parse(school.sessions) : school.sessions)
      : current?.sessions?.length ? current.sessions : ['2025-26'],
    storageMode: school.storageMode || current?.storageMode || 'cloud',
    serverUrl: school.serverUrl || current?.serverUrl || '',
    folderName: school.folderName || current?.folderName || '',
    storageBytes: (school as any)?.storageBytes ?? (current as any)?.storageBytes ?? 0,
    mediaCount: (school as any)?.mediaCount ?? (current as any)?.mediaCount ?? 0,
    lightColors: generateLightColors(brand),
    darkColors: generateDarkColors(brand),
  }
}

export interface InstitutionSettings {
  name: string
  nameBn: string
  logo: string
  banner: string
  bannerPosition: { x: number; y: number }
  brandName: string
  motto: string
  mottoBn: string
  eiin: string
  phone: string
  email: string
  address: string
  addressBn?: string
  website: string
  subjects: string[]
  startTime: string
  endTime: string
  breaks: BreakTime[]
  currentSession: string
  sessions: string[]
  storageMode?: string
  serverUrl?: string
  folderName?: string
  storageBytes?: number
  mediaCount?: number
  lightColors: ThemeColors
  darkColors: ThemeColors
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
  serverSynced: boolean
  syncing: boolean
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
  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>
}

let serverSyncTimer: any = null
function queueServerSync(get: () => ClassState) {
  try {
    if (isLocalComputerMode()) return
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const state = get()
        await classesApi.update({
          classes: state.classes,
          routines: state.routines,
        })
      } catch (err) {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

const defaultInstitution: InstitutionSettings = {
  name: '',
  nameBn: '',
  logo: '',
  banner: '',
  bannerPosition: { x: 0, y: 0 },
  brandName: 'EduTech',
  motto: '',
  mottoBn: '',
  eiin: '',
  phone: '',
  email: '',
  address: '',
  website: '',
  subjects: [],
  startTime: '07:30',
  endTime: '14:30',
  breaks: [],
  currentSession: '2025-26',
  sessions: ['2024-25', '2025-26'],
  storageMode: 'cloud',
  serverUrl: '',
  folderName: '',
  lightColors: { ...defaultThemeColors },
  darkColors: { ...defaultThemeColorsDark },
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
      serverSynced: false,
      syncing: false,

      updateInstitution: (data) => set((state) => ({ institution: { ...state.institution, ...data } })),

      addClass: (cls) => {
        set((state) => ({ classes: [...state.classes, cls] }))
        queueServerSync(_get)
      },

      updateClass: (id, data) => {
        set((state) => ({
          classes: state.classes.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().split('T')[0] } : c)),
        }))
        queueServerSync(_get)
      },

      deleteClass: (id) => {
        set((state) => ({ classes: state.classes.filter((c) => c.id !== id) }))
        queueServerSync(_get)
      },

      addSection: (classId, section) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId ? { ...c, sections: [...c.sections, section], updatedAt: new Date().toISOString().split('T')[0] } : c
          ),
        }))
        queueServerSync(_get)
      },

      updateSection: (classId, sectionId, data) => {
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
        }))
        queueServerSync(_get)
      },

      deleteSection: (classId, sectionId) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, sections: c.sections.filter((s) => s.id !== sectionId), updatedAt: new Date().toISOString().split('T')[0] }
              : c
          ),
        }))
        queueServerSync(_get)
      },

      updateRoutine: (classId, routine) => {
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
        })
        queueServerSync(_get)
      },

      setRoutineSlot: (classId, day, period, slot) => {
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
        })
        queueServerSync(_get)
      },

      clearRoutineSlot: (classId, day, period, sectionId) => {
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
        })
        queueServerSync(_get)
      },

      switchSession: (session) => {
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
        })
        queueServerSync(_get)
      },

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

      importFromSession: (fromSession) => {
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
        })
        queueServerSync(_get)
      },

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true })
        try {
          const res = await classesApi.get(slugOrId)
          if (res) {
            const hasServerClasses = Array.isArray(res.classes) && res.classes.length > 0
            const hasServerRoutines = Array.isArray(res.routines) && res.routines.length > 0
            const state = _get()

            if (hasServerClasses || hasServerRoutines) {
              const currentSession = state.institution.currentSession || '2025-26'
              set((prev) => ({
                classes: res.classes || [],
                routines: res.routines || [],
                sessionClasses: { ...prev.sessionClasses, [currentSession]: res.classes || [] },
                sessionRoutines: { ...prev.sessionRoutines, [currentSession]: res.routines || [] },
                institution: {
                  ...prev.institution,
                  ...(res.sessions && res.sessions.length > 0 ? { sessions: res.sessions } : {}),
                  ...(res.breaks && res.breaks.length > 0 ? { breaks: res.breaks } : {}),
                  ...(res.startTime ? { startTime: res.startTime } : {}),
                  ...(res.endTime ? { endTime: res.endTime } : {}),
                },
                serverSynced: true,
                syncing: false,
              }))
            } else if (state.classes.length > 0 || state.routines.length > 0) {
              // Local store has classes/routines but database is empty: push local classes to server
              await classesApi.update({
                classes: state.classes,
                routines: state.routines,
                schoolId: slugOrId,
              })
              set({ serverSynced: true, syncing: false })
            } else {
              set({ serverSynced: true, syncing: false })
            }
          } else {
            set({ serverSynced: true, syncing: false })
          }
        } catch (err) {
          console.warn('[classStore] syncFromServer failed:', err)
          set({ syncing: false })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true })
        try {
          const state = _get()
          await classesApi.update({
            classes: state.classes,
            routines: state.routines,
          })
          set({ serverSynced: true, syncing: false })
        } catch (err) {
          console.warn('[classStore] syncToServer failed:', err)
          set({ syncing: false })
        }
      },
    }),
    {
      name: 'edutech-classes',
      storage: createNamespacedStorage('edutech-classes', undefined, { debounce: true }),
      version: 7,
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
          if (inst && !inst.brandName) inst.brandName = 'EduTech'
        }
        if (version < 7) {
          const inst = persistedState?.institution
          if (inst) {
            if (!inst.lightColors) inst.lightColors = { ...defaultThemeColors }
            if (!inst.darkColors) inst.darkColors = { ...defaultThemeColorsDark }
          }
        }
        return persistedState
      },
    }
  )
)

registerStoreReset(() => {
  useClassStore.setState({
    institution: { ...defaultInstitution },
    classes: [],
    routines: [],
    sessionClasses: {},
    sessionRoutines: {},
  })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-classes_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) useClassStore.setState(parsed.state)
    }
  } catch { /* ignore */ }
})
