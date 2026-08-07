import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Language } from '@/types'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'

interface PageVisit {
  path: string
  label: string
  icon: string
  count: number
}

interface SidebarItem {
  key: string
  page: string
}

interface SettingsState {
  timezone: string
  density: 'compact' | 'default' | 'comfortable'
  keyboardShortcuts: boolean
  customShortcuts: Record<string, string[]>
  defaultHomePage: string
  backupEmail: string
  loginAlerts: {
    login: boolean
    failedAttempts: boolean
    passwordChange: boolean
    newDevice: boolean
  }
  loginMethod: 'password' | 'passkey' | '2fa'
  twoFactorEnabled: boolean
}

interface AppState {
  theme: Theme
  language: Language
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  sidebarPosition: 'left' | 'right'
  commandPaletteOpen: boolean
  pageVisits: PageVisit[]
  bookmarks: string[]
  sidebarOrder: SidebarItem[]
  teacherCardsOrder: string[]
  studentCardsOrder: string[]
  feeCardsOrder: string[]
  quickAccessCardsOrder: string[]
  settings: SettingsState
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarPosition: () => void
  setCommandPaletteOpen: (open: boolean) => void
  trackVisit: (path: string, label: string, icon: string) => void
  toggleBookmark: (path: string) => void
  removeBookmark: (path: string) => void
  reorderBookmarks: (fromIndex: number, toIndex: number) => void
  setSidebarOrder: (order: SidebarItem[]) => void
  setTeacherCardsOrder: (order: string[]) => void
  setStudentCardsOrder: (order: string[]) => void
  setFeeCardsOrder: (order: string[]) => void
  setQuickAccessCardsOrder: (order: string[]) => void
  updateSettings: (partial: Partial<SettingsState>) => void
  setTwoFactorEnabled: (enabled: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'bn',
      sidebarOpen: false,
      sidebarCollapsed: false,
      sidebarPosition: 'left',
      commandPaletteOpen: false,
      pageVisits: [],
      bookmarks: [],
      sidebarOrder: [],
      teacherCardsOrder: [],
      studentCardsOrder: [],
      feeCardsOrder: [],
      quickAccessCardsOrder: [],
      settings: {
        timezone: 'UTC+06:00',
        density: 'default',
        keyboardShortcuts: true,
        customShortcuts: {},
        defaultHomePage: 'dashboard',
        backupEmail: '',
        loginAlerts: {
          login: true,
          failedAttempts: true,
          passwordChange: true,
          newDevice: true,
        },
        loginMethod: 'password',
        twoFactorEnabled: false,
      },

      setTheme: (theme) => {
        set({ theme })
        if (theme === 'system') {
          const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
        } else {
          document.documentElement.setAttribute('data-theme', theme)
        }
      },

      setLanguage: (language) => set({ language }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebarPosition: () => set((state) => ({ sidebarPosition: state.sidebarPosition === 'left' ? 'right' : 'left' })),

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      trackVisit: (path, label, icon) =>
        set((state) => {
          const existing = state.pageVisits.find((v) => v.path === path)
          if (existing) {
            return {
              pageVisits: state.pageVisits.map((v) =>
                v.path === path ? { ...v, count: v.count + 1, label, icon } : v
              ),
            }
          }
          return { pageVisits: [...state.pageVisits, { path, label, icon, count: 1 }] }
        }),

      toggleBookmark: (path) =>
        set((state) => {
          const exists = state.bookmarks.includes(path)
          if (exists) {
            return { bookmarks: state.bookmarks.filter((p) => p !== path) }
          }
          if (state.bookmarks.length >= 5) return state
          return { bookmarks: [...state.bookmarks, path] }
        }),

      removeBookmark: (path) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((p) => p !== path),
          pageVisits: state.pageVisits.filter((v) => v.path !== path),
        })),

      reorderBookmarks: (fromIndex: number, toIndex: number) =>
        set((state) => {
          const newBookmarks = [...state.bookmarks]
          const [removed] = newBookmarks.splice(fromIndex, 1)
          newBookmarks.splice(toIndex, 0, removed)
          return { bookmarks: newBookmarks }
        }),

      setSidebarOrder: (order) => set({ sidebarOrder: order }),

      setTeacherCardsOrder: (order) => set({ teacherCardsOrder: order }),

      setStudentCardsOrder: (order) => set({ studentCardsOrder: order }),

      setFeeCardsOrder: (order) => set({ feeCardsOrder: order }),

      setQuickAccessCardsOrder: (order) => set({ quickAccessCardsOrder: order }),

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      setTwoFactorEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, twoFactorEnabled: enabled } })),
    }),
    {
      name: 'edutech-settings',
      storage: createNamespacedStorage('edutech-settings', 'edutech-settings'),
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarPosition: state.sidebarPosition,
        pageVisits: state.pageVisits,
        bookmarks: state.bookmarks,
        sidebarOrder: state.sidebarOrder,
        teacherCardsOrder: state.teacherCardsOrder,
        studentCardsOrder: state.studentCardsOrder,
        feeCardsOrder: state.feeCardsOrder,
        quickAccessCardsOrder: state.quickAccessCardsOrder,
        settings: state.settings,
      }),
    }
  )
)

registerStoreReset(() => {
  useAppStore.setState({ sidebarOpen: false })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-settings_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useAppStore.setState(parsed.state)
    }
  } catch { /* ignore */ }
})
