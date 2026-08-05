import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreRehydrate } from '@/lib/storage'

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

export const useOnlineStore = create<OnlineState>()(
  persist(
    (set) => ({
      classes: [],
      addClass: (c) =>
        set((s) => ({
          classes: [
            { ...c, id: `OC-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ...s.classes,
          ],
        })),
      updateClass: (id, data) =>
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c)),
        })),
      deleteClass: (id) => set((s) => ({ classes: s.classes.filter((c) => c.id !== id) })),
    }),
    {
      name: 'edutech-online',
      storage: createNamespacedStorage('edutech-online'),
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

registerStoreRehydrate(() => useOnlineStore.persist.rehydrate())
