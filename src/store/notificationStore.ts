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
    name?: string | null
    nameBn?: string | null
    eiin?: string | null
  }
): boolean {
  // If broadcast to all or targetType === 'all' or broadcastToAll is true, or no specific targets
  if (notification.broadcastToAll || !notification.targetType || notification.targetType === 'all') {
    return true
  }

  // If specific target type
  if (notification.targetType === 'specific') {
    const targets = (notification.targetInstitutions || []).map((t) => String(t).toLowerCase().trim())
    const targetNames = (notification.targetInstitutionNames || []).map((t) => String(t).toLowerCase().trim())
    if (targets.length === 0 && targetNames.length === 0) return true

    const candidateSet = new Set<string>()
    const rawCandidates = [
      schoolIdentifiers.slug,
      schoolIdentifiers.id,
      schoolIdentifiers.subdomain,
      schoolIdentifiers.schoolId,
      schoolIdentifiers.name,
      schoolIdentifiers.nameBn,
      schoolIdentifiers.eiin,
    ]
    for (const c of rawCandidates) {
      if (c && typeof c === 'string' && c.trim()) {
        candidateSet.add(c.toLowerCase().trim())
      }
    }

    // Cross-reference with institutions stored in localStorage
    try {
      if (typeof window !== 'undefined') {
        const rawSuperAdmin = localStorage.getItem('edutech_super_admin')
        if (rawSuperAdmin) {
          const parsed = JSON.parse(rawSuperAdmin)
          const instList: any[] = parsed.state?.institutions || []
          for (const inst of instList) {
            const instKeys = [
              inst.id,
              inst.slug,
              inst.subdomain,
              inst.name,
              inst.nameBn,
              inst.eiin,
            ]
              .filter(Boolean)
              .map((k) => String(k).toLowerCase().trim())

            const hasMatch = instKeys.some((k) => candidateSet.has(k))
            if (hasMatch) {
              instKeys.forEach((k) => candidateSet.add(k))
            }
          }
        }
      }
    } catch { /* ignore */ }

    // If candidate set has no valid entries, return true as fallback
    if (candidateSet.size === 0) return true

    // Check direct equality
    for (const c of candidateSet) {
      if (targets.includes(c)) return true
      if (targetNames.includes(c)) return true
    }

    // Check substring / fuzzy matching for institution names (length > 3)
    for (const target of targets) {
      for (const cand of candidateSet) {
        if (cand === target) return true
        if (target.length > 3 && cand.length > 3 && (cand.includes(target) || target.includes(cand))) {
          return true
        }
      }
    }
    for (const tName of targetNames) {
      for (const cand of candidateSet) {
        if (cand === tName) return true
        if (tName.length > 3 && cand.length > 3 && (cand.includes(tName) || tName.includes(cand))) {
          return true
        }
      }
    }

    return false
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

export const NOTIFICATION_CHANNEL_NAME = 'edutech_notifications_realtime'
export const NOTIFICATION_STORAGE_EVENT_KEY = 'edutech_notification_event'

/**
 * Dispatches notification to all tabs, windows, and in-process subscribers instantly.
 */
export function dispatchRealtimeNotification(n: Notification) {
  try {
    if (typeof window === 'undefined' || !n) return

    // 1. In-process DOM custom event for current window/components
    window.dispatchEvent(new CustomEvent('edutech:new_notification', { detail: n }))

    // 2. BroadcastChannel for cross-tab realtime messaging
    if ('BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(NOTIFICATION_CHANNEL_NAME)
        bc.postMessage({ type: 'NEW_NOTIFICATION', notification: n })
        bc.close()
      } catch { /* ignore */ }
    }

    // 3. localStorage storage event (triggers across all tabs/windows of same origin)
    try {
      localStorage.setItem(
        NOTIFICATION_STORAGE_EVENT_KEY,
        JSON.stringify({ notification: n, timestamp: Date.now() })
      )
    } catch { /* ignore */ }
  } catch { /* ignore */ }
}

/**
 * Handles incoming real-time notification from BroadcastChannel, storage event, or DOM event.
 */
export function handleIncomingRealtimeNotification(n: Notification) {
  try {
    if (typeof window === 'undefined' || !n) return
    const currentSlug =
      sessionStorage.getItem('edutech_inst_slug') ||
      localStorage.getItem('edutech_inst_slug') ||
      null
    const isSuperAdmin =
      currentSlug === 'super-admin' ||
      (!currentSlug && localStorage.getItem('edutech_auth_role') === 'super_admin')

    let instName: string | undefined
    let instNameBn: string | undefined
    let instEiin: string | undefined
    try {
      const rawClass = localStorage.getItem('edutech-classes')
      if (rawClass) {
        const parsed = JSON.parse(rawClass)
        const inst = parsed.state?.institution
        if (inst) {
          instName = inst.name
          instNameBn = inst.nameBn
          instEiin = inst.eiin
        }
      }
    } catch { /* ignore */ }

    const identifiers = {
      slug: currentSlug,
      id: sessionStorage.getItem('edutech_viewing_id') || currentSlug,
      subdomain: currentSlug,
      name: instName,
      nameBn: instNameBn,
      eiin: instEiin,
    }

    if (isSuperAdmin || isNotificationForSchool(n, identifiers)) {
      const state = useNotificationStore.getState()
      const exists = state.notifications.some((item) => item.id === n.id)
      if (!exists) {
        useNotificationStore.setState({
          notifications: [n, ...state.notifications],
        })
        onStateMutated(useNotificationStore.getState)
      }
    }
  } catch { /* ignore */ }
}

if (typeof window !== 'undefined') {
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(NOTIFICATION_CHANNEL_NAME)
      bc.onmessage = (event) => {
        if (event.data?.type === 'NEW_NOTIFICATION' && event.data.notification) {
          handleIncomingRealtimeNotification(event.data.notification)
        }
      }
    }

    window.addEventListener('storage', (e) => {
      if (e.key === NOTIFICATION_STORAGE_EVENT_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (parsed.notification) {
            handleIncomingRealtimeNotification(parsed.notification)
          }
        } catch { /* ignore */ }
      }
    })

    window.addEventListener('edutech:new_notification', ((e: CustomEvent) => {
      if (e.detail) {
        handleIncomingRealtimeNotification(e.detail)
      }
    }) as EventListener)
  } catch { /* ignore */ }
}

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
        const slug =
          slugOrId ||
          (typeof window !== 'undefined'
            ? sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
            : undefined)

        // Cross-namespace sync from master stores for institution contexts
        if (typeof window !== 'undefined' && slug && slug !== 'super-admin') {
          try {
            const rootKeys = ['edutech-notifications', 'edutech-notifications_super-admin']
            const masterNotifs: Notification[] = []
            for (const rk of rootKeys) {
              const rootRaw = localStorage.getItem(rk)
              if (rootRaw) {
                try {
                  const parsed = JSON.parse(rootRaw)
                  if (parsed.state && Array.isArray(parsed.state.notifications)) {
                    masterNotifs.push(...parsed.state.notifications)
                  }
                } catch { /* ignore */ }
              }
            }

            const schoolNotifs = masterNotifs.filter((n) =>
              isNotificationForSchool(n, {
                slug,
                id: sessionStorage.getItem('edutech_viewing_id') || slug,
                subdomain: slug,
              })
            )

            const state = get()
            const notifMap = new Map<string, Notification>()
            schoolNotifs.forEach((n) => notifMap.set(n.id, n))
            state.notifications.forEach((n) => {
              if (notifMap.has(n.id)) {
                notifMap.set(n.id, { ...notifMap.get(n.id)!, read: n.read })
              } else {
                notifMap.set(n.id, n)
              }
            })
            const merged = Array.from(notifMap.values()).filter((n) => !LEGACY_SEED_NOTIFICATION_IDS.has(n.id))
            set({ notifications: merged })
            onStateMutated(get)
          } catch { /* ignore */ }
        }

        // 2. Fetch from backend API (even if in local_computer mode, so institutions receive super admin notices!)
        set({ syncing: true, syncError: null })
        try {
          const res = await notificationsApi.get(slugOrId)
          if (res) {
            const serverNotifs = Array.isArray(res.notifications) ? res.notifications : []
            const state = get()

            if (serverNotifs.length > 0) {
              const notifMap = new Map<string, Notification>()
              serverNotifs.forEach((n) => notifMap.set(n.id, n))
              state.notifications.forEach((n) => {
                if (notifMap.has(n.id)) {
                  notifMap.set(n.id, { ...notifMap.get(n.id)!, read: n.read })
                } else {
                  notifMap.set(n.id, n)
                }
              })
              const merged = Array.from(notifMap.values()).filter((n) => !LEGACY_SEED_NOTIFICATION_IDS.has(n.id))
              set({
                notifications: merged,
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
              onStateMutated(get)
            } else if (state.notifications.length > 0 && !isLocalComputerMode()) {
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
        } catch {
          // In local_computer / offline mode, gracefully keep local state
          set({ syncing: false, serverSynced: true, syncError: null })
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
        dispatchRealtimeNotification(n)
      },
      updateNotification: (id, updates) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }))
        onStateMutated(get)
        const updated = get().notifications.find((n) => n.id === id)
        if (updated) {
          dispatchRealtimeNotification(updated)
        }

        // Also update across root keys and matching storage keys
        try {
          if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i)
              if (k && (k === 'edutech-notifications' || k.startsWith('edutech-notifications_'))) {
                try {
                  const raw = localStorage.getItem(k)
                  if (raw) {
                    const parsed = JSON.parse(raw)
                    if (parsed.state && Array.isArray(parsed.state.notifications)) {
                      const updated = parsed.state.notifications.map((n: any) =>
                        n.id === id ? { ...n, ...updates } : n
                      )
                      localStorage.setItem(k, JSON.stringify({ ...parsed, state: { ...parsed.state, notifications: updated } }))
                    }
                  }
                } catch { /* ignore */ }
              }
            }
          }
        } catch { /* ignore */ }
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

        // Also remove across root keys and matching storage keys
        try {
          if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i)
              if (k && (k === 'edutech-notifications' || k.startsWith('edutech-notifications_'))) {
                try {
                  const raw = localStorage.getItem(k)
                  if (raw) {
                    const parsed = JSON.parse(raw)
                    if (parsed.state && Array.isArray(parsed.state.notifications)) {
                      const filtered = parsed.state.notifications.filter((n: any) => n.id !== id)
                      localStorage.setItem(k, JSON.stringify({ ...parsed, state: { ...parsed.state, notifications: filtered } }))
                    }
                  }
                } catch { /* ignore */ }
              }
            }
          }
        } catch { /* ignore */ }
      },
      clearAll: () => {
        markExplicitUserDelete()
        set({ notifications: [] })
        onStateMutated(get)
      },

      broadcastNotification: async (n) => {
        // 1. Add locally
        set((state) => ({ notifications: [n, ...state.notifications.filter((item) => item.id !== n.id)] }))
        onStateMutated(get)

        // 2. Always persist into root stores: edutech-notifications and edutech-notifications_super-admin
        try {
          if (typeof window !== 'undefined') {
            const rootKeys = ['edutech-notifications', 'edutech-notifications_super-admin']
            for (const rk of rootKeys) {
              const raw = localStorage.getItem(rk)
              let existingState: any = { notifications: [] }
              if (raw) {
                try {
                  const p = JSON.parse(raw)
                  existingState = p.state || existingState
                } catch { /* ignore */ }
              }
              const currentNotifs = Array.isArray(existingState.notifications) ? existingState.notifications : []
              const merged = [n, ...currentNotifs.filter((item: any) => item.id !== n.id)]
              localStorage.setItem(rk, JSON.stringify({ state: { ...existingState, notifications: merged }, version: 2 }))
            }
          }
        } catch { /* ignore */ }

        // 3. Broadcast or target to destination school storage in localStorage
        try {
          if (typeof window !== 'undefined') {
            const isTargeted = n.targetType === 'specific' && Array.isArray(n.targetInstitutions) && n.targetInstitutions.length > 0
            const targetSet = new Set((n.targetInstitutions || []).map((t) => String(t).toLowerCase().trim()))
            if (n.targetInstitutionNames) {
              n.targetInstitutionNames.forEach((name) => targetSet.add(name.toLowerCase().trim()))
            }

            const destSlugs = new Set<string>()

            // Gather all available institutions from superAdminStore and localStorage
            const allInstList: any[] = []
            try {
              const rawSuperAdmin = localStorage.getItem('edutech_super_admin')
              if (rawSuperAdmin) {
                const parsed = JSON.parse(rawSuperAdmin)
                allInstList.push(...(parsed.state?.institutions || []))
              }
            } catch { /* ignore */ }

            try {
              const rawInsts = localStorage.getItem('edutech-institutions')
              if (rawInsts) {
                const parsed = JSON.parse(rawInsts)
                const arr = Array.isArray(parsed) ? parsed : (parsed.state?.institutions || [])
                allInstList.push(...arr)
              }
            } catch { /* ignore */ }

            if (isTargeted) {
              // 1. Add raw target identifiers directly
              for (const t of n.targetInstitutions || []) {
                if (t && t !== 'super-admin') destSlugs.add(String(t).toLowerCase().trim())
              }

              // 2. Cross-reference with super admin store institutions to resolve slug/id/subdomain
              for (const inst of allInstList) {
                const keys = [inst.slug, inst.id, inst.subdomain, inst.name, inst.nameBn, inst.eiin]
                  .filter(Boolean)
                  .map((k) => String(k).toLowerCase().trim())

                const matches = keys.some((k) => targetSet.has(k))
                if (matches) {
                  if (inst.slug) destSlugs.add(String(inst.slug).toLowerCase().trim())
                  if (inst.id) destSlugs.add(String(inst.id).toLowerCase().trim())
                  if (inst.subdomain) destSlugs.add(String(inst.subdomain).toLowerCase().trim())
                }
              }

              // 3. Match against existing edutech-notifications_<slug> keys
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k && k.startsWith('edutech-notifications_')) {
                  const s = k.replace('edutech-notifications_', '').toLowerCase().trim()
                  if (s && s !== 'super-admin' && targetSet.has(s)) {
                    destSlugs.add(s)
                  }
                }
              }
            } else {
              // Broadcast to ALL known institutions
              for (const inst of allInstList) {
                if (inst.slug) destSlugs.add(String(inst.slug).toLowerCase().trim())
                if (inst.id) destSlugs.add(String(inst.id).toLowerCase().trim())
                if (inst.subdomain) destSlugs.add(String(inst.subdomain).toLowerCase().trim())
              }

              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k && k.startsWith('edutech-notifications_')) {
                  const s = k.replace('edutech-notifications_', '').toLowerCase().trim()
                  if (s && s !== 'super-admin') destSlugs.add(s)
                }
              }
            }

            // Distribute to destination school stores
            for (const slug of destSlugs) {
              if (!slug || slug === 'super-admin') continue
              const key = `edutech-notifications_${slug}`
              try {
                const raw = localStorage.getItem(key)
                let existingState: any = { notifications: [] }
                if (raw) {
                  try {
                    const p = JSON.parse(raw)
                    existingState = p.state || existingState
                  } catch { /* ignore */ }
                }
                const currentNotifs = Array.isArray(existingState.notifications) ? existingState.notifications : []
                const merged = [n, ...currentNotifs.filter((item: any) => item.id !== n.id)]
                localStorage.setItem(key, JSON.stringify({ state: { ...existingState, notifications: merged }, version: 2 }))
              } catch { /* ignore */ }
            }
          }
        } catch { /* ignore */ }

        // 4. Server API broadcast
        try {
          await notificationsApi.broadcast(n)
        } catch { /* ignore */ }

        // 5. Instantly dispatch realtime event to all tabs, windows, and in-memory subscribers
        dispatchRealtimeNotification(n)
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
  const slug =
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
      : null) || null
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-notifications_${slug}`)
    let currentNotifs: Notification[] = []
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state && Array.isArray(parsed.state.notifications)) {
        currentNotifs = parsed.state.notifications
      }
    }

    // Pull from master notifications storage if not super-admin
    if (slug !== 'super-admin') {
      const rootKeys = ['edutech-notifications', 'edutech-notifications_super-admin']
      const masterNotifs: Notification[] = []
      for (const rk of rootKeys) {
        const rootRaw = localStorage.getItem(rk)
        if (rootRaw) {
          try {
            const parsed = JSON.parse(rootRaw)
            if (parsed.state && Array.isArray(parsed.state.notifications)) {
              masterNotifs.push(...parsed.state.notifications)
            }
          } catch { /* ignore */ }
        }
      }

      // Filter master notifications that apply to this school
      const schoolNotifs = masterNotifs.filter((n) =>
        isNotificationForSchool(n, {
          slug,
          id: sessionStorage.getItem('edutech_viewing_id') || slug,
          subdomain: slug,
        })
      )

      // Merge into currentNotifs without duplicates, preserving local read state
      const notifMap = new Map<string, Notification>()
      schoolNotifs.forEach((n) => notifMap.set(n.id, n))
      currentNotifs.forEach((n) => {
        if (notifMap.has(n.id)) {
          notifMap.set(n.id, { ...notifMap.get(n.id)!, read: n.read })
        } else {
          notifMap.set(n.id, n)
        }
      })
      currentNotifs = Array.from(notifMap.values())
    }

    const cleaned = currentNotifs.filter((n: Notification) => !LEGACY_SEED_NOTIFICATION_IDS.has(n.id))
    useNotificationStore.setState({
      notifications: cleaned,
    })
  } catch {
    /* ignore */
  }
})
