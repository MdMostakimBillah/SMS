import { create } from 'zustand'

interface LoadingBarState {
  loading: boolean
  progress: number
  start: () => void
  setProgress: (value: number) => void
  complete: () => void
  reset: () => void
}

export const useLoadingBar = create<LoadingBarState>((set, get) => {
  let safetyTimer: ReturnType<typeof setTimeout> | null = null
  let completeTimer: ReturnType<typeof setTimeout> | null = null

  const clearTimers = () => {
    if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null }
    if (completeTimer) { clearTimeout(completeTimer); completeTimer = null }
  }

  return {
    loading: false,
    progress: 0,

    start: () => {
      clearTimers()
      set({ loading: true, progress: 0 })

      // Simulate progress: quick start, slow middle
      setTimeout(() => {
        const s = get()
        if (s.loading && s.progress < 30) set({ progress: 30 })
      }, 50)
      setTimeout(() => {
        const s = get()
        if (s.loading && s.progress < 60) set({ progress: 60 })
      }, 200)
      setTimeout(() => {
        const s = get()
        if (s.loading && s.progress < 80) set({ progress: 80 })
      }, 500)
      setTimeout(() => {
        const s = get()
        if (s.loading && s.progress < 90) set({ progress: 90 })
      }, 1000)

      // Safety: force complete after 5s
      safetyTimer = setTimeout(() => {
        const s = get()
        if (s.loading) get().complete()
      }, 5000)
    },

    setProgress: (value: number) => {
      clearTimers()
      if (value >= 100) {
        get().complete()
      } else {
        set({ progress: Math.min(value, 99) })
      }
    },

    complete: () => {
      clearTimers()
      set({ progress: 100 })
      // Remove bar after animation
      completeTimer = setTimeout(() => {
        set({ loading: false, progress: 0 })
      }, 400)
    },

    reset: () => {
      clearTimers()
      set({ loading: false, progress: 0 })
    },
  }
})
