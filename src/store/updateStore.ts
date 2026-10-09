import { create } from 'zustand'

const CHECK_INTERVAL = 5 * 60 * 1000

/**
 * Version baked into the bundle currently running. Read through `typeof` so a
 * host that never ran the Vite `define` step (unit tests, plain TS tooling)
 * degrades to "unknown" instead of throwing a ReferenceError.
 */
const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : ''

interface UpdateStore {
  isUpdateAvailable: boolean
  latestVersion: string | null
  /** Hide the prompt for the rest of this session only. */
  dismiss: () => void
  /** The user took the update — reload so the new bundle takes over. */
  applyUpdate: () => void
  checkForUpdate: () => Promise<void>
  startPeriodicCheck: () => void
  stopPeriodicCheck: () => void
}

let intervalId: ReturnType<typeof setInterval> | null = null

/**
 * Version the user pressed "Later" on. Deliberately in memory only: declining
 * an update must not be mistaken for having applied it, otherwise the prompt
 * would never be offered again on the next app open.
 */
let dismissedVersion: string | null = null

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  isUpdateAvailable: false,
  latestVersion: null,

  dismiss: () => {
    dismissedVersion = get().latestVersion
    set({ isUpdateAvailable: false, latestVersion: null })
  },

  applyUpdate: () => {
    dismissedVersion = null
    // Everything except /assets is served `no-cache`, so a plain reload picks up
    // the fresh index.html and its hashed bundles.
    window.location.reload()
  },

  checkForUpdate: async () => {
    try {
      const res = await fetch('/version.txt', { cache: 'no-store' })
      if (!res.ok) return
      const remoteVersion = (await res.text()).trim()
      if (!remoteVersion) return

      // No stamp in this build, or the running bundle already matches the
      // server — clear any prompt left over from an earlier deploy.
      if (!APP_VERSION || remoteVersion === APP_VERSION) {
        set({ isUpdateAvailable: false, latestVersion: null })
        return
      }

      // Declined this exact version already; still show it again next open.
      if (remoteVersion === dismissedVersion) return

      set({ isUpdateAvailable: true, latestVersion: remoteVersion })
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
