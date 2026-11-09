import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { isRecentExplicitDelete, markExplicitUserDelete } from '@/lib/vault/bridge'
import { onlineClassesApi } from '@/lib/api'

export type Platform = 'youtube' | 'facebook' | 'google-meet' | 'zoom' | 'other'
export type ClassStatus = 'scheduled' | 'live' | 'ended'

export interface OnlineClass {
  id: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  classId: string
  sectionId: string
  subjectId: string
  teacherId: string
  url: string
  platform: Platform
  thumbnailUrl: string
  scheduledAt: string
  status: ClassStatus
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface OnlineState {
  classes: OnlineClass[]
  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>
  setClasses: (classes: OnlineClass[]) => void

  addClass: (c: Omit<OnlineClass, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateClass: (id: string, data: Partial<OnlineClass>) => void
  deleteClass: (id: string) => void
}

export function detectPlatform(url: string): Platform {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/facebook\.com|fb\.watch/.test(url)) return 'facebook'
  if (/meet\.google\.com/.test(url)) return 'google-meet'
  if (/zoom\.us/.test(url)) return 'zoom'
  return 'other'
}

export function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&?/]+)/)
  return m ? m[1] : null
}

export function getFacebookVideoId(url: string): string | null {
  const m = url.match(/(?:facebook\.com\/(?:watch\/?\?v=|share\/v\/|reel\/|videos\/)|fb\.watch\/)([^&?/]+)/)
  return m ? m[1] : null
}

export function getThumbnail(url: string): string {
  const ytId = getYouTubeId(url)
  if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
  return ''
}

export const platformColors: Record<Platform, string> = {
  youtube: '#FF0000',
  facebook: '#1877F2',
  'google-meet': '#00897B',
  zoom: '#2D8CFF',
  other: 'var(--text-muted)',
}

export const platformLabels: Record<Platform, { en: string; bn: string }> = {
  youtube: { en: 'YouTube', bn: 'ইউটিউব' },
  facebook: { en: 'Facebook', bn: 'ফেসবুক' },
  'google-meet': { en: 'Google Meet', bn: 'গুগল মিট' },
  zoom: { en: 'Zoom', bn: 'জুম' },
  other: { en: 'Other', bn: 'অন্যান্য' },
}

let serverSyncTimer: any = null
function queueServerSync(get: () => OnlineState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    if (!state.serverSynced && state.classes.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.classes.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await onlineClassesApi.update({
          classes: s.classes,
        })
      } catch (e) {
        console.warn('[online] Background sync failed:', e)
      }
    }, 500)
  } catch {
    /* ignore */
  }
}

export const useOnlineStore = create<OnlineState>()(
  persist(
    (set, get) => ({
      classes: [],
      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false, syncError: null })
          return
        }
        try {
          set({ syncing: true, syncError: null })
          const res = await onlineClassesApi.get(slugOrId)
          if (res?.storageMode === 'local_computer') {
            set({ serverSynced: true, syncing: false })
            return
          }
          if (res && Array.isArray(res.classes)) {
            set({
              classes: res.classes,
              serverSynced: true,
              syncing: false,
              syncError: null,
            })
          } else {
            set({ serverSynced: true, syncing: false })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch online classes from server'
          set({ syncing: false, syncError: msg })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        try {
          set({ syncing: true, syncError: null })
          const s = get()
          await onlineClassesApi.update({
            classes: s.classes,
          })
          set({ syncing: false, serverSynced: true })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to save online classes to server'
          set({ syncing: false, syncError: msg })
        }
      },

      setClasses: (classes) => {
        set({ classes })
        queueServerSync(get)
      },

      addClass: (c) => {
        set((s) => ({
          classes: [
            { ...c, id: `OC-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ...s.classes,
          ],
        }))
        queueServerSync(get)
      },

      updateClass: (id, data) => {
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c)),
        }))
        queueServerSync(get)
      },

      deleteClass: (id) => {
        markExplicitUserDelete()
        set((s) => ({ classes: s.classes.filter((c) => c.id !== id) }))
        queueServerSync(get)
      },
    }),
    {
      name: 'edutech-online',
      storage: createNamespacedStorage('edutech-online'),
      partialize: (s) => ({ classes: s.classes }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const fixed = state.classes.map((c) => {
          if (!c.thumbnailUrl && c.url) {
            const thumb = getThumbnail(c.url)
            if (thumb) return { ...c, thumbnailUrl: thumb }
          }
          return c
        })
        const needsFix = fixed.some((c, i) => c.thumbnailUrl !== state.classes[i].thumbnailUrl)
        if (needsFix) useOnlineStore.setState({ classes: fixed })
      },
    }
  )
)

registerStoreReset(() => {
  useOnlineStore.setState({ classes: [], serverSynced: false, syncing: false, syncError: null })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-online_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useOnlineStore.setState({ ...parsed.state, serverSynced: false, syncing: false, syncError: null })
    } else {
      useOnlineStore.setState({ classes: [], serverSynced: false, syncing: false, syncError: null })
    }
  } catch {
    useOnlineStore.setState({ classes: [], serverSynced: false, syncing: false, syncError: null })
  }
})
