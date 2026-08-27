import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'

export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export interface Notification {
  id: string
  title: string
  titleBn: string
  message: string
  messageBn: string
  type: NotificationType
  read: boolean
  link?: string
  createdAt: string
}

let counter = 0
export function notificationId(): string {
  counter++
  return `NTF-${Date.now()}-${counter}`
}

interface NotificationState {
  notifications: Notification[]
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],

      addNotification: (n) => set((state) => ({ notifications: [n, ...state.notifications] })),
      markRead: (id) =>
        set((state) => ({ notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () =>
        set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) })),
      deleteNotification: (id) =>
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'edutech-notifications', storage: createNamespacedStorage('edutech-notifications'), version: 1 }
  )
)

registerStoreReset(() => {
  useNotificationStore.setState({ notifications: [] })
})
