import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { notificationsApi } from '@/lib/api'

export type NotificationType = 'info' | 'warning' | 'success' | 'error'
export type NotificationCategory = 'system' | 'billing' | 'academic' | 'general'

export interface Notification {
  id: string
  title: string
  titleBn: string
  message: string
  messageBn: string
  type: NotificationType
  category?: NotificationCategory
  read: boolean
  link?: string
  sender?: string
  senderRole?: string
  broadcastToAll?: boolean
  targetType?: 'all' | 'specific'
  targetInstitutions?: string[]
  targetInstitutionNames?: string[]
  createdAt: string
}

export function isNotificationForSchool(
  notification: Notification,
  schoolIdentifiers: {
    slug?: string | null
    id?: string | null
    subdomain?: string | null
    schoolId?: string | null
  }
): boolean {
  // If broadcast to all or targetType === 'all' or broadcastToAll is true, or no specific targets
  if (notification.broadcastToAll || !notification.targetType || notification.targetType === 'all') {
    return true
  }

  // If specific target type
  if (notification.targetType === 'specific') {
    const targets = notification.targetInstitutions || []
    if (targets.length === 0) return true

    const candidates = [
      schoolIdentifiers.slug,
      schoolIdentifiers.id,
      schoolIdentifiers.subdomain,
      schoolIdentifiers.schoolId,
    ]
      .filter((v): v is string => Boolean(v && typeof v === 'string' && v.trim()))
      .map((s) => s.toLowerCase().trim())

    if (candidates.length === 0) return true

    return targets.some((t) => {
      const targetClean = String(t).toLowerCase().trim()
      return candidates.includes(targetClean)
    })
  }

  return true
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

  broadcastNotification: (n: Notification) => Promise<void>
  checkAndGenerateSystemNotifications: (slug?: string) => void
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

      broadcastNotification: async (n) => {
        // 1. Add locally
        set((state) => ({ notifications: [n, ...state.notifications] }))
        onStateMutated(get)

        // 2. Broadcast or target to school storage in localStorage
        try {
          if (typeof window !== 'undefined') {
            const isTargeted = n.targetType === 'specific' && Array.isArray(n.targetInstitutions) && n.targetInstitutions.length > 0
            const targetSet = new Set((n.targetInstitutions || []).map((t) => String(t).toLowerCase().trim()))

            const destSlugs = new Set<string>()

            if (isTargeted) {
              // 1. Add raw target identifiers directly
              for (const t of n.targetInstitutions || []) {
                if (t && t !== 'super-admin') destSlugs.add(t)
              }

              // 2. Cross-reference with super admin store institutions to resolve slug/id/subdomain
              try {
                const rawSuperAdmin = localStorage.getItem('edutech_super_admin')
                if (rawSuperAdmin) {
                  const parsed = JSON.parse(rawSuperAdmin)
                  const instList = parsed.state?.institutions || []
                  for (const inst of instList) {
                    const keys = [inst.slug, inst.id, inst.subdomain].filter(Boolean)
                    const matches = keys.some((k) => targetSet.has(k.toLowerCase().trim()))
                    if (matches) {
                      keys.forEach((k) => destSlugs.add(k))
                    }
                  }
                }
              } catch { /* ignore */ }

              // 3. Match against existing edutech-notifications_<slug> keys
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k && k.startsWith('edutech-notifications_')) {
                  const s = k.replace('edutech-notifications_', '')
                  if (s && targetSet.has(s.toLowerCase().trim())) {
                    destSlugs.add(s)
                  }
                }
              }
            } else {
              // Broadcast to ALL known institutions
              // A. Check edutech_super_admin institutions
              try {
                const rawSuperAdmin = localStorage.getItem('edutech_super_admin')
                if (rawSuperAdmin) {
                  const parsed = JSON.parse(rawSuperAdmin)
                  const instList = parsed.state?.institutions || []
                  for (const inst of instList) {
                    const s = inst.slug || inst.id || inst.subdomain
                    if (s) destSlugs.add(s)
                  }
                }
              } catch { /* ignore */ }

              // B. Check edutech-institutions
              try {
                const rawInsts = localStorage.getItem('edutech-institutions')
                if (rawInsts) {
                  const parsed = JSON.parse(rawInsts)
                  const instList = Array.isArray(parsed) ? parsed : (parsed.state?.institutions || [])
                  for (const inst of instList) {
                    const s = inst.slug || inst.id
                    if (s) destSlugs.add(s)
                  }
                }
              } catch { /* ignore */ }

              // C. Discover all existing notification stores in localStorage
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k && k.startsWith('edutech-notifications_')) {
                  const s = k.replace('edutech-notifications_', '')
                  if (s) destSlugs.add(s)
                }
              }
            }

            // Distribute to destination school stores
            for (const slug of destSlugs) {
              if (slug === 'super-admin') continue
              const key = `edutech-notifications_${slug}`
              try {
                const raw = localStorage.getItem(key)
                let existingState: any = { notifications: [] }
                if (raw) {
                  const p = JSON.parse(raw)
                  existingState = p.state || existingState
                }
                const currentNotifs = Array.isArray(existingState.notifications) ? existingState.notifications : []
                const merged = [n, ...currentNotifs.filter((item: any) => item.id !== n.id)]
                localStorage.setItem(key, JSON.stringify({ state: { ...existingState, notifications: merged }, version: 2 }))
              } catch { /* ignore */ }
            }
          }
        } catch { /* ignore */ }

        // 3. Server API broadcast
        try {
          await notificationsApi.broadcast(n)
        } catch { /* ignore */ }
      },

      checkAndGenerateSystemNotifications: (slugOrId?: string) => {
        const slug = slugOrId || (typeof window !== 'undefined' ? (sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')) : undefined)
        if (!slug || slug === 'super-admin') return

        const state = get()
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const monthStr = `${year}-${String(month).padStart(2, '0')}`

        // 1. Monthly subscription payment reminder
        const billingNotifId = `NTF-BILLING-${monthStr}-${slug}`
        const alreadyHasBilling = state.notifications.some((n) => n.id === billingNotifId)

        const toAdd: Notification[] = []

        if (!alreadyHasBilling) {
          toAdd.push({
            id: billingNotifId,
            title: 'Monthly Subscription Payment Reminder',
            titleBn: 'মাসিক সাবস্ক্রিপশন ফি পরিশোধের তাগিদ',
            message: `Your institution's software subscription payment for ${monthStr} is scheduled. Please ensure prompt clearance to keep all services running smoothly.`,
            messageBn: `${monthStr} মাসের জন্য আপনার প্রতিষ্ঠানের সফটওয়্যার সাবস্ক্রিপশন ফি পরিশোধের সময় হয়েছে। নিরবচ্ছিন্ন সেবার জন্য অনুগ্রহ করে পরিশোধ সম্পন্ন করুন।`,
            type: 'warning',
            category: 'billing',
            sender: 'EduTech Billing & Finance',
            senderRole: 'super_admin',
            read: false,
            link: '/settings?panel=subscription-payment',
            createdAt: now.toISOString(),
          })
        }

        // 2. System update announcement
        const systemUpdateId = 'NTF-SYS-UPDATE-V24'
        const alreadyHasSystemUpdate = state.notifications.some((n) => n.id === systemUpdateId)

        if (!alreadyHasSystemUpdate) {
          toAdd.push({
            id: systemUpdateId,
            title: 'Software System Update: Version 2.4 Released',
            titleBn: 'সফটওয়্যার সিস্টেম আপডেট: সংস্করণ ২.৪ চালু হয়েছে',
            message: 'Super Admin has deployed system updates: Enhanced communications, automatic monthly billing reminders, and local PC storage synchronization.',
            messageBn: 'সুপার অ্যাডমিন নতুন সিস্টেম আপডেট প্রয়োগ করেছেন: আধুনিক যোগাযোগ কেন্দ্র, স্বয়ংক্রিয় মাসিক বিলিং সতর্কতা এবং লোকাল পিসি স্টোরেজ সিঙ্ক।',
            type: 'info',
            category: 'system',
            sender: 'Super Admin (EduTech Core)',
            senderRole: 'super_admin',
            read: false,
            link: '/dashboard',
            createdAt: new Date(now.getTime() - 3600000).toISOString(),
          })
        }

        if (toAdd.length > 0) {
          set((s) => ({ notifications: [...toAdd, ...s.notifications] }))
          onStateMutated(get)
        }
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
