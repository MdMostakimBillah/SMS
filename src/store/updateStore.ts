import { create } from 'zustand'

const STORAGE_KEY = 'edutech_app_version'
const CHECK_INTERVAL = 5 * 60 * 1000

interface UpdateStore {
  isUpdateAvailable: boolean
  dismiss: () => void
  checkForUpdate: () => Promise<void>
  startPeriodicCheck: () => void
  stopPeriodicCheck: () => void
}

let intervalId: ReturnType<typeof setInterval> | null = null

export const useUpdateStore = create<UpdateStore>((set) => ({
  isUpdateAvailable: false,

  dismiss: () => set({ isUpdateAvailable: false }),

  checkForUpdate: async () => {
    try {
      const res = await fetch('/version.txt', { cache: 'no-store' })
      if (!res.ok) return
      const remoteVersion = (await res.text()).trim()
      const localVersion = localStorage.getItem(STORAGE_KEY)
      if (localVersion && remoteVersion !== localVersion) {
        set({ isUpdateAvailable: true })
      }
      localStorage.setItem(STORAGE_KEY, remoteVersion)
    } catch {
      // silent — offline or network error
    }
  },

  startPeriodicCheck: () => {
    if (intervalId) return
    intervalId = setInterval(() => {
      useUpdateStore.getState().checkForUpdate()
    }, CHECK_INTERVAL)
  },

  stopPeriodicCheck: () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  },
}))
