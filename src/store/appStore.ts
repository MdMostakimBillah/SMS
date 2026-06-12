import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Language } from '@/types'

interface AppState {
  theme: Theme
  language: Language
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'bn',
      sidebarOpen: false,
      commandPaletteOpen: false,

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

      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
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
