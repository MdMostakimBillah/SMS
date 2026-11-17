import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites, getSlug } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { classesApi } from '@/lib/api'
import { getPermanentStorageModeSync, getPermanentTelegramSync } from '@/lib/permanentConfig'
import { useSuperAdminStore } from '@/store/superAdminStore'

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
  const localSettingMode =
    typeof localStorage !== 'undefined' ? localStorage.getItem('edutech_storage_mode') : null
  const sessSettingMode =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_storage_mode') : null

  const isLocalComp =
    school.storageMode === 'local_computer' ||
    current?.storageMode === 'local_computer' ||
    localSettingMode === 'local_computer' ||
    sessSettingMode === 'local_computer'

  const isLocalServ =
    school.storageMode === 'local_server' ||
    current?.storageMode === 'local_server' ||
    localSettingMode === 'local_server' ||
    sessSettingMode === 'local_server'

  const effectiveStorageMode: 'cloud' | 'local_computer' | 'local_server' = isLocalComp
    ? 'local_computer'
    : isLocalServ
    ? 'local_server'
    : (school.storageMode === 'cloud' || school.storageMode === 'local_computer' || school.storageMode === 'local_server'
        ? school.storageMode
        : current?.storageMode || 'cloud')

  return {
    name: school.name || current?.name || '',
    nameBn: school.nameBn || current?.nameBn || school.name || '',
    logo: isLocalComp
      ? (current?.logo || school.logo || '')
      : (school.logo !== undefined ? (school.logo || '') : (current?.logo || '')),
    banner: isLocalComp
      ? (current?.banner || school.banner || '')
      : (school.banner !== undefined ? (school.banner || '') : (current?.banner || '')),
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
    sessions: Array.from(new Set([
      ...(school.sessions ? (typeof school.sessions === 'string' ? JSON.parse(school.sessions) : school.sessions) : []),
      ...(current?.sessions || []),
      '2025-26',
    ])).filter(Boolean),
    storageMode: effectiveStorageMode,
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
  telegramBackup?: {
    botToken: string
    chatId: string
    autoBackup: boolean
    lastBackupAt?: string
    lastBackupStatus?: string
  }
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
    const state = get()
    const hasAnyClasses = state.classes.length > 0 || Object.values(state.sessionClasses || {}).some((c) => c && c.length > 0)
    const hasAnyRoutines = state.routines.length > 0 || Object.values(state.sessionRoutines || {}).some((r) => r && r.length > 0)
    // Guard: Never push empty classes/routines to the database during startup or unhydrated state
    if (!state.serverSynced && !hasAnyClasses && !hasAnyRoutines) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        const anyClasses = s.classes.length > 0 || Object.values(s.sessionClasses || {}).some((c) => c && c.length > 0)
        const anyRoutines = s.routines.length > 0 || Object.values(s.sessionRoutines || {}).some((r) => r && r.length > 0)
        // Double check: if classes and routines are empty across all sessions, and not an explicit user delete, and not yet synced, abort
        if (!anyClasses && !anyRoutines && !isRecentExplicitDelete() && !s.serverSynced) {
          return
        }
        const effectiveSlug = getSlug() || (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('edutech_viewing_id') || sessionStorage.getItem('edutech_school_id')) : undefined) || undefined
        await classesApi.update({
          classes: s.classes,
          routines: s.routines,
          sessionClasses: s.sessionClasses,
          sessionRoutines: s.sessionRoutines,
          sessions: s.institution.sessions,
          currentSession: s.institution.currentSession,
          schoolId: effectiveSlug,
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

      updateInstitution: (data) => {
        const current = _get().institution
        let hasChanges = false
        for (const [k, v] of Object.entries(data)) {
          if (JSON.stringify((current as any)[k]) !== JSON.stringify(v)) {
            hasChanges = true
            break
          }
        }
        if (!hasChanges) return

        set((state) => {
          const prevSession = state.institution.currentSession
          const targetSession = data.currentSession
          const mergedSessions = data.sessions
            ? Array.from(new Set([...(state.institution.sessions || []), ...data.sessions]))
            : state.institution.sessions
          if (targetSession && targetSession !== prevSession) {
            const finalSessions = mergedSessions.includes(targetSession) ? mergedSessions : [...mergedSessions, targetSession]
            const newSessionClasses = { ...state.sessionClasses, [prevSession]: state.classes }
            const newSessionRoutines = { ...state.sessionRoutines, [prevSession]: state.routines }
            const targetClasses = newSessionClasses[targetSession] || []
            const targetRoutines = newSessionRoutines[targetSession] || []
            return {
              institution: { ...state.institution, ...data, sessions: finalSessions, currentSession: targetSession },
              classes: targetClasses,
              routines: targetRoutines,
              sessionClasses: newSessionClasses,
              sessionRoutines: newSessionRoutines,
            }
          }
          return { institution: { ...state.institution, ...data, ...(data.sessions ? { sessions: mergedSessions } : {}) } }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      addClass: (cls) => {
        set((state) => {
          const newClasses = [...state.classes, cls]
          const curSession = state.institution.currentSession || '2025-26'
          return {
            classes: newClasses,
            sessionClasses: { ...state.sessionClasses, [curSession]: newClasses },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      updateClass: (id, data) => {
        set((state) => {
          const newClasses = state.classes.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().split('T')[0] } : c))
          const curSession = state.institution.currentSession || '2025-26'
          return {
            classes: newClasses,
            sessionClasses: { ...state.sessionClasses, [curSession]: newClasses },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      deleteClass: (id) => {
        markExplicitUserDelete()
        set((state) => {
          const newClasses = state.classes.filter((c) => c.id !== id)
          const curSession = state.institution.currentSession || '2025-26'
          return {
            classes: newClasses,
            sessionClasses: { ...state.sessionClasses, [curSession]: newClasses },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      addSection: (classId, section) => {
        set((state) => {
          const newClasses = state.classes.map((c) =>
            c.id === classId ? { ...c, sections: [...c.sections, section], updatedAt: new Date().toISOString().split('T')[0] } : c
          )
          const curSession = state.institution.currentSession || '2025-26'
          return {
            classes: newClasses,
            sessionClasses: { ...state.sessionClasses, [curSession]: newClasses },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      updateSection: (classId, sectionId, data) => {
        set((state) => {
          const newClasses = state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...data } : s)),
                  updatedAt: new Date().toISOString().split('T')[0],
                }
              : c
          )
          const curSession = state.institution.currentSession || '2025-26'
          return {
            classes: newClasses,
            sessionClasses: { ...state.sessionClasses, [curSession]: newClasses },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      deleteSection: (classId, sectionId) => {
        markExplicitUserDelete()
        set((state) => {
          const newClasses = state.classes.map((c) =>
            c.id === classId
              ? { ...c, sections: c.sections.filter((s) => s.id !== sectionId), updatedAt: new Date().toISOString().split('T')[0] }
              : c
          )
          const curSession = state.institution.currentSession || '2025-26'
          return {
            classes: newClasses,
            sessionClasses: { ...state.sessionClasses, [curSession]: newClasses },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      updateRoutine: (classId, routine) => {
        set((state) => {
          const curSession = state.institution.currentSession || '2025-26'
          const existing = state.routines.find((r) => r.classId === classId && r.sectionId === routine.sectionId)
          let newRoutines: ClassRoutine[]
          if (existing) {
            newRoutines = state.routines.map((r) =>
              r.classId === classId && r.sectionId === routine.sectionId
                ? { ...r, ...routine, weekendDays: routine.weekendDays ?? r.weekendDays }
                : r
            )
          } else {
            newRoutines = [
              ...state.routines,
              { classId, sectionId: routine.sectionId || '', periodDuration: 40, weekendDays: [5], periods: [], ...routine },
            ]
          }
          return {
            routines: newRoutines,
            sessionRoutines: { ...state.sessionRoutines, [curSession]: newRoutines },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      setRoutineSlot: (classId, day, period, slot) => {
        set((state) => {
          const curSession = state.institution.currentSession || '2025-26'
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
          return {
            routines,
            sessionRoutines: { ...state.sessionRoutines, [curSession]: routines },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      clearRoutineSlot: (classId, day, period, sectionId) => {
        set((state) => {
          const curSession = state.institution.currentSession || '2025-26'
          const routines = [...state.routines]
          const sid = sectionId || state.routines.find((r) => r.classId === classId)?.sectionId || ''
          const idx = routines.findIndex((r) => r.classId === classId && r.sectionId === sid)
          if (idx === -1) return state
          const periods = [...routines[idx].periods]
          if (!periods[day]) return state
          periods[day] = [...periods[day]]
          periods[day][period] = { subjectId: '', teacherId: '' }
          routines[idx] = { ...routines[idx], periods }
          return {
            routines,
            sessionRoutines: { ...state.sessionRoutines, [curSession]: routines },
          }
        })
        flushPendingWrites()
        void flushVaultWrites()
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
          const newSessions = institution.sessions.includes(session)
            ? institution.sessions
            : [...institution.sessions, session]
          return {
            institution: { ...institution, sessions: newSessions, currentSession: session },
            classes: targetClasses,
            routines: targetRoutines,
            sessionClasses: newSessionClasses,
            sessionRoutines: newSessionRoutines,
          }
        })
        const slug = getSlug()
        if (slug) {
          const inst = useSuperAdminStore.getState().institutions.find((i) => i.slug === slug || i.subdomain === slug || i.id === slug)
          if (inst) {
            useSuperAdminStore.getState().updateInstitution(inst.id, {
              currentSession: session,
              sessions: Array.from(new Set([...(inst.sessions || []), session])),
            })
          }
        }
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      addSession: (session) => {
        let added = false
        set((state) => {
          const { institution, sessionClasses, sessionRoutines } = state
          if (institution.sessions.includes(session)) return state
          added = true
          return {
            institution: {
              ...institution,
              sessions: [...institution.sessions, session],
            },
            sessionClasses: {
              ...sessionClasses,
              [session]: sessionClasses[session] || [],
            },
            sessionRoutines: {
              ...sessionRoutines,
              [session]: sessionRoutines[session] || [],
            },
          }
        })
        if (added) {
          const slug = getSlug()
          if (slug) {
            const inst = useSuperAdminStore.getState().institutions.find((i) => i.slug === slug || i.subdomain === slug || i.id === slug)
            if (inst) {
              useSuperAdminStore.getState().updateInstitution(inst.id, {
                sessions: Array.from(new Set([...(inst.sessions || []), session])),
              })
            }
          }
          flushPendingWrites()
          void flushVaultWrites()
          queueServerSync(_get)
        }
      },

      removeSession: (session) => {
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
        })
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

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
        flushPendingWrites()
        void flushVaultWrites()
        queueServerSync(_get)
      },

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true })
        try {
          const state = _get()
          const currentSession = state.institution.currentSession || '2025-26'
          const res = await classesApi.get(slugOrId, currentSession)
          if (res) {
            const hasServerSessionClasses = res.sessionClasses && Object.keys(res.sessionClasses).length > 0
            const hasServerClasses = Array.isArray(res.classes) && res.classes.length > 0
            const hasServerRoutines = Array.isArray(res.routines) && res.routines.length > 0

            const normalizeClassList = (list: any[]): ClassInfo[] => {
              if (!Array.isArray(list)) return []
              return list.map((c: any) => ({
                ...c,
                subjectIds: Array.isArray(c.subjectIds) ? c.subjectIds : (Array.isArray(c.subjects) ? c.subjects : []),
                sections: Array.isArray(c.sections)
                  ? c.sections.map((s: any) => ({
                      ...s,
                      subjectIds: Array.isArray(s.subjectIds) ? s.subjectIds : (Array.isArray(s.subjects) ? s.subjects : []),
                    }))
                  : [],
              }))
            }

            const mergeClassLists = (localList: ClassInfo[], serverList: ClassInfo[]): ClassInfo[] => {
              if (!serverList || serverList.length === 0) return localList || []
              if (!localList || localList.length === 0) return serverList || []

              const localMap = new Map(localList.map((c) => [c.id, c]))
              const merged = serverList.map((serverCls) => {
                const localCls = localMap.get(serverCls.id)
                if (!localCls) return serverCls

                const localSecMap = new Map((localCls.sections || []).map((s) => [s.id, s]))
                const mergedSections = (serverCls.sections || []).map((serverSec) => {
                  const localSec = localSecMap.get(serverSec.id)
                  if (!localSec) return serverSec
                  // Merge section subjectIds so locally configured subjects are never lost
                  const mergedSecSubjectIds = Array.from(new Set([
                    ...(serverSec.subjectIds || []),
                    ...(localSec.subjectIds || []),
                  ]))
                  return {
                    ...serverSec,
                    ...localSec,
                    subjectIds: mergedSecSubjectIds,
                  }
                })

                // Include any local sections not yet present on server
                const serverSecIds = new Set((serverCls.sections || []).map((s) => s.id))
                for (const lSec of localCls.sections || []) {
                  if (!serverSecIds.has(lSec.id)) {
                    mergedSections.push(lSec)
                  }
                }

                const mergedClassSubjectIds = Array.from(new Set([
                  ...(serverCls.subjectIds || []),
                  ...(localCls.subjectIds || []),
                ]))

                return {
                  ...serverCls,
                  ...localCls,
                  subjectIds: mergedClassSubjectIds,
                  sections: mergedSections,
                }
              })

              // Include any local classes not yet present on server
              const serverClassIds = new Set(serverList.map((c) => c.id))
              for (const lCls of localList) {
                if (!serverClassIds.has(lCls.id)) {
                  merged.push(lCls)
                }
              }

              return merged
            }

            if (hasServerSessionClasses) {
              const mergedSessions = Array.from(new Set([...(state.institution.sessions || []), ...(res.sessions || [])]))
              const activeSession = state.institution.currentSession || res.currentSession || currentSession
              const normalizedSessionClasses: Record<string, ClassInfo[]> = {}
              let needsPush = false
              for (const [sess, list] of Object.entries(res.sessionClasses || {})) {
                const normalized = normalizeClassList(list)
                const localForSess = state.sessionClasses?.[sess] || (sess === activeSession ? state.classes : [])
                const merged = mergeClassLists(localForSess, normalized)
                normalizedSessionClasses[sess] = merged
                if (localForSess.some((lc) => (lc.subjectIds?.length ?? 0) > 0 || (lc.sections || []).some((ls) => (ls.subjectIds?.length ?? 0) > 0))) {
                  needsPush = true
                }
              }
              const mergedSessionClasses = { ...state.sessionClasses, ...normalizedSessionClasses }
              const mergedSessionRoutines = { ...state.sessionRoutines, ...(res.sessionRoutines || {}) }
              const activeClasses = mergedSessionClasses[activeSession] || []
              const activeRoutines = mergedSessionRoutines[activeSession] || []
              set((prev) => ({
                classes: activeClasses,
                routines: activeRoutines,
                sessionClasses: mergedSessionClasses,
                sessionRoutines: mergedSessionRoutines,
                institution: {
                  ...prev.institution,
                  sessions: mergedSessions,
                  currentSession: activeSession,
                  ...(res.breaks && res.breaks.length > 0 ? { breaks: res.breaks } : {}),
                  ...(res.startTime ? { startTime: res.startTime } : {}),
                  ...(res.endTime ? { endTime: res.endTime } : {}),
                },
                serverSynced: true,
                syncing: false,
              }))
              if (needsPush) {
                void queueServerSync(_get)
              }
            } else if (hasServerClasses || hasServerRoutines) {
              const mergedSessions = Array.from(new Set([...(state.institution.sessions || []), ...(res.sessions || [])]))
              const defaultSession = res.currentSession || res.sessions?.[0] || '2025-26'
              const activeSession = state.institution.currentSession || defaultSession
              const isCurrentSameAsServerDefault = activeSession === defaultSession
              const normalizedServerClasses = normalizeClassList(res.classes || [])
              const mergedActiveClasses = mergeClassLists(state.classes, normalizedServerClasses)
              const newSessionClasses = {
                ...state.sessionClasses,
                [defaultSession]: mergedActiveClasses,
              }
              const newSessionRoutines = {
                ...state.sessionRoutines,
                [defaultSession]: res.routines || [],
              }
              const activeClasses = isCurrentSameAsServerDefault ? mergedActiveClasses : (state.sessionClasses[activeSession] || [])
              const activeRoutines = isCurrentSameAsServerDefault ? (res.routines || []) : (state.sessionRoutines[activeSession] || [])
              set((prev) => ({
                classes: activeClasses,
                routines: activeRoutines,
                sessionClasses: newSessionClasses,
                sessionRoutines: newSessionRoutines,
                institution: {
                  ...prev.institution,
                  sessions: mergedSessions,
                  currentSession: activeSession,
                  ...(res.breaks && res.breaks.length > 0 ? { breaks: res.breaks } : {}),
                  ...(res.startTime ? { startTime: res.startTime } : {}),
                  ...(res.endTime ? { endTime: res.endTime } : {}),
                },
                serverSynced: true,
                syncing: false,
              }))
              if (state.classes.some((lc) => (lc.subjectIds?.length ?? 0) > 0 || (lc.sections || []).some((ls) => (ls.subjectIds?.length ?? 0) > 0))) {
                void queueServerSync(_get)
              }
            } else if (state.classes.length > 0 || Object.keys(state.sessionClasses).length > 0) {
              // Local store has classes/routines but database is empty: push local classes to server
              await classesApi.update({
                classes: state.classes,
                routines: state.routines,
                sessionClasses: state.sessionClasses,
                sessionRoutines: state.sessionRoutines,
                sessions: state.institution.sessions,
                currentSession: state.institution.currentSession,
                schoolId: slugOrId,
              })
              set({ serverSynced: true, syncing: false })
            } else {
              const mergedSessions = Array.from(new Set([...(state.institution.sessions || []), ...(res.sessions || [])]))
              set((prev) => ({
                institution: {
                  ...prev.institution,
                  ...(mergedSessions.length > 0 ? { sessions: mergedSessions } : {}),
                  ...(res.currentSession ? { currentSession: res.currentSession } : {}),
                  ...(res.breaks && res.breaks.length > 0 ? { breaks: res.breaks } : {}),
                  ...(res.startTime ? { startTime: res.startTime } : {}),
                  ...(res.endTime ? { endTime: res.endTime } : {}),
                },
                serverSynced: true,
                syncing: false,
              }))
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
          const effectiveSlug = getSlug() || (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('edutech_viewing_id') || sessionStorage.getItem('edutech_school_id')) : undefined) || undefined
          await classesApi.update({
            classes: state.classes,
            routines: state.routines,
            sessionClasses: state.sessionClasses,
            sessionRoutines: state.sessionRoutines,
            sessions: state.institution.sessions,
            currentSession: state.institution.currentSession,
            schoolId: effectiveSlug,
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
      storage: createNamespacedStorage('edutech-classes'),
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
  const permMode = getPermanentStorageModeSync()
  const permTg = getPermanentTelegramSync()
  useClassStore.setState({
    institution: {
      ...defaultInstitution,
      ...(permMode ? { storageMode: permMode } : {}),
      ...(permTg ? { telegramBackup: permTg } : {}),
    },
    classes: [],
    routines: [],
    sessionClasses: {},
    sessionRoutines: {},
  })
})

registerStoreLoad(() => {
  const slug = getSlug()
  try {
    const key = slug ? `edutech-classes_${slug}` : 'edutech-classes'
    const raw = localStorage.getItem(key) || (slug ? localStorage.getItem('edutech-classes') : null)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.state) useClassStore.setState(parsed.state)
    }
    const permMode = getPermanentStorageModeSync()
    const permTg = getPermanentTelegramSync()
    if (permMode || permTg) {
      const current = useClassStore.getState().institution
      useClassStore.setState({
        institution: {
          ...current,
          ...(permMode ? { storageMode: permMode } : {}),
          ...(permTg ? { telegramBackup: permTg } : {}),
        },
      })
    }
  } catch {
    /* ignore */
  }
})
