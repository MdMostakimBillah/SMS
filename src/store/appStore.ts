import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Language } from '@/types'

interface AppState {
  theme: Theme
  language: Language
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  searchDivRect: DOMRect | null
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setSearchDivRect: (rect: DOMRect | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'bn',
      sidebarOpen: false,
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      searchDivRect: null,

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

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      setSearchDivRect: (rect) => set({ searchDivRect: rect }),
    }),
    {
      name: 'edutech-settings',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)
