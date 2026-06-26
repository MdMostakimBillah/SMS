import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Language } from '@/types'

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
  quickAccessCardsOrder: string[]
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarPosition: () => void
  setCommandPaletteOpen: (open: boolean) => void
  trackVisit: (path: string, label: string, icon: string) => void
  toggleBookmark: (path: string) => void
  removeBookmark: (path: string) => void
  setSidebarOrder: (order: SidebarItem[]) => void
  setTeacherCardsOrder: (order: string[]) => void
  setStudentCardsOrder: (order: string[]) => void
  setQuickAccessCardsOrder: (order: string[]) => void
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
      quickAccessCardsOrder: [],

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
          // If removing, just remove
          if (exists) {
            return { bookmarks: state.bookmarks.filter((p) => p !== path) }
          }
          // If adding, max 5 bookmarks
          if (state.bookmarks.length >= 5) return state
          return { bookmarks: [...state.bookmarks, path] }
        }),

      removeBookmark: (path) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((p) => p !== path),
          pageVisits: state.pageVisits.filter((v) => v.path !== path),
        })),

      setSidebarOrder: (order) => set({ sidebarOrder: order }),

      setTeacherCardsOrder: (order) => set({ teacherCardsOrder: order }),

      setStudentCardsOrder: (order) => set({ studentCardsOrder: order }),

      setQuickAccessCardsOrder: (order) => set({ quickAccessCardsOrder: order }),
    }),
    {
      name: 'edutech-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarPosition: state.sidebarPosition,
        pageVisits: state.pageVisits,
        bookmarks: state.bookmarks,
        sidebarOrder: state.sidebarOrder,
        teacherCardsOrder: state.teacherCardsOrder,
        studentCardsOrder: state.studentCardsOrder,
        quickAccessCardsOrder: state.quickAccessCardsOrder,
      }),
    }
  )
)
