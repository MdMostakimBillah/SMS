import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type NoticeTarget = 'all' | 'students' | 'teachers' | 'parents'
export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notice {
  id: string
  title: string
  titleBn: string
  content: string
  contentBn: string
  author: string
  authorBn: string
  target: NoticeTarget
  priority: NoticePriority
  pinned: boolean
  isActive: boolean
  publishedAt: string
  expiresAt: string
}

let counter = 0
export function noticeId(): string {
  counter++
  return `NOTICE-${Date.now()}-${counter}`
}

interface NoticeState {
  notices: Notice[]
  addNotice: (n: Notice) => void
  updateNotice: (id: string, data: Partial<Notice>) => void
  deleteNotice: (id: string) => void
  togglePin: (id: string) => void
  toggleActive: (id: string) => void
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set) => ({
      notices: [],

      addNotice: (n) => set((state) => ({ notices: [n, ...state.notices] })),
      updateNotice: (id, data) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, ...data } : n)) })),
      deleteNotice: (id) =>
        set((state) => ({ notices: state.notices.filter((n) => n.id !== id) })),
      togglePin: (id) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)) })),
      toggleActive: (id) =>
        set((state) => ({ notices: state.notices.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n)) })),
    }),
    { name: 'edutech-notices', storage: createNamespacedStorage('edutech-notices'), version: 1 }
  )
)

registerStoreReset(() => {
  useNoticeStore.setState({ notices: [] })
})
