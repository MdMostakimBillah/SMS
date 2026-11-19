import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { notificationsApi } from '@/lib/api'

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

export const SEED_NOTIFICATIONS: Notification[] = []

export const LEGACY_SEED_NOTIFICATION_IDS = new Set([
  'NTF-SEED-001',
  'NTF-SEED-002',
  'NTF-SEED-003',
  'NTF-SEED-004',
  'NTF-SEED-005',
  'NTF-SEED-006',
])

interface NotificationState {
  notifications: Notification[]

  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>

  addNotification: (n: Notification) => void
  updateNotification: (id: string, updates: Partial<Notification>) => void
  markRead: (id: string) => void
  markUnread: (id: string) => void
  markAllRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
}

let serverSyncTimer: any = null
function queueServerSync(get: () => NotificationState) {
  try {
    if (typeof window === 'undefined') return
    if (isLocalComputerMode()) return
    const token = localStorage.getItem('edutech_auth_token') || sessionStorage.getItem('edutech_auth_token')
    if (!token) return
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.notifications.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await notificationsApi.update({
          notifications: s.notifications,
        })
      } catch {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

function onStateMutated(get: () => NotificationState) {
  flushPendingWrites()
  void flushVaultWrites()
  queueServerSync(get)
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true, syncError: null })
        try {
          const res = await notificationsApi.get(slugOrId)
          if (res) {
            const hasNotifs = Array.isArray(res.notifications) && res.notifications.length > 0
            const state = get()

            if (hasNotifs) {
              set({
                notifications: res.notifications!,
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (state.notifications.length > 0) {
              await notificationsApi.update({
                notifications: state.notifications,
                schoolId: slugOrId,
              })
              set({ serverSynced: true, syncing: false, syncError: null })
            } else {
              set({ serverSynced: true, syncing: false, syncError: null })
            }
          } else {
            set({ serverSynced: true, syncing: false, syncError: null })
          }
        } catch (err: any) {
          set({ syncing: false, syncError: err?.message || 'Failed to sync notifications' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true, syncError: null })
        try {
          const state = get()
          await notificationsApi.update({
            notifications: state.notifications,
          })
          set({ syncing: false, serverSynced: true, syncError: null })
        } catch (err: any) {
          set({ syncing: false, syncError: err?.message || 'Failed to push notifications' })
        }
      },

      addNotification: (n) => {
        set((state) => ({ notifications: [n, ...state.notifications] }))
        onStateMutated(get)
      },
      updateNotification: (id, updates) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }))
        onStateMutated(get)
      },
      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }))
        onStateMutated(get)
      },
      markUnread: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: false } : n)),
        }))
        onStateMutated(get)
      },
      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
        onStateMutated(get)
      },
      deleteNotification: (id) => {
        markExplicitUserDelete()
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
        onStateMutated(get)
      },
      clearAll: () => {
        markExplicitUserDelete()
        set({ notifications: [] })
        onStateMutated(get)
      },
    }),
    {
      name: 'edutech-notifications',
      storage: createNamespacedStorage('edutech-notifications'),
      version: 2,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState
        const list = Array.isArray(persistedState.notifications) ? persistedState.notifications : []
        const cleaned = list.filter((n: any) => !LEGACY_SEED_NOTIFICATION_IDS.has(n.id))
        return {
          ...persistedState,
          notifications: cleaned,
        }
      },
    }
  )
)

registerStoreReset(() => {
  useNotificationStore.setState({
    notifications: [],
    serverSynced: false,
    syncing: false,
    syncError: null,
  })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-notifications_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        const state = parsed.state
        const list = Array.isArray(state.notifications) ? state.notifications : []
        const cleaned = list.filter((n: Notification) => !LEGACY_SEED_NOTIFICATION_IDS.has(n.id))
        useNotificationStore.setState({
          ...state,
          notifications: cleaned,
        })
      }
    }
  } catch {
    /* ignore */
  }
})
