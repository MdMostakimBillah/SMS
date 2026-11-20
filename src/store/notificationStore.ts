import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites } from '@/lib/storage'
import { flushVaultWrites } from '@/lib/vault/vault'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { isLocalComputerMode } from '@/lib/storageMode'
import { notificationsApi } from '@/lib/api'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { useClassStore } from '@/store/classStore'

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

export interface SchoolIdentifiers {
  slug?: string | null
  id?: string | null
  subdomain?: string | null
  schoolId?: string | null
  name?: string | null
  nameBn?: string | null
  eiin?: string | null
  aliases?: string[]
}

/**
 * Resolves all identifiers and aliases for the active institution across all
 * memory stores, session keys, user auth, and persistent local storage.
 */
export function resolveCurrentSchoolIdentifiers(user?: any): SchoolIdentifiers {
  const candidateSet = new Set<string>()
  const rawValues: (string | null | undefined)[] = []

  if (typeof window !== 'undefined') {
    // 1. Session & Local Storage keys
    rawValues.push(
      sessionStorage.getItem('edutech_inst_slug'),
      localStorage.getItem('edutech_inst_slug'),
      sessionStorage.getItem('edutech_viewing_id'),
      sessionStorage.getItem('edutech_school_id'),
      localStorage.getItem('edutech_school_id'),
      sessionStorage.getItem('edutech_school_name'),
      localStorage.getItem('edutech_school_name'),
      sessionStorage.getItem('edutech_school_domain'),
      localStorage.getItem('edutech_school_domain'),
      sessionStorage.getItem('edutech_school_eiin'),
      localStorage.getItem('edutech_school_eiin')
    )

    // 2. Auth user in localStorage
    try {
      const rawUser = localStorage.getItem('edutech_auth_user')
      if (rawUser) {
        const u = JSON.parse(rawUser)
        rawValues.push(
          u.schoolId,
          u.schoolDomain,
          u.subdomain,
          u.schoolName,
          u.school?.id,
          u.school?.name,
          u.school?.nameBn,
          u.school?.domain,
          u.school?.eiin
        )
      }
    } catch { /* ignore */ }

    // 3. Offline session
    try {
      const rawOffline = sessionStorage.getItem('edutech_offline_session') || localStorage.getItem('edutech_offline_session')
      if (rawOffline) {
        const off = JSON.parse(rawOffline)
        rawValues.push(off.schoolId, off.schoolName, off.subdomain, off.schoolDomain)
      }
    } catch { /* ignore */ }
  }

  // 4. Passed user parameter (from useAuth)
  if (user) {
    rawValues.push(
      user.id,
      user.schoolId,
      user.schoolName,
      user.schoolDomain,
      user.subdomain,
      user.school?.id,
      user.school?.name,
      user.school?.nameBn,
      user.school?.domain,
      user.school?.eiin,
      (user as any).institutionId
    )
  }

  // 5. useClassStore institution settings
  let classInst: any = null
  try {
    const rawClassStore = useClassStore.getState?.()?.institution
    if (rawClassStore) {
      classInst = rawClassStore
      rawValues.push(
        classInst.id,
        classInst.name,
        classInst.nameBn,
        classInst.eiin,
        classInst.slug,
        classInst.subdomain,
        classInst.code
      )
    }
  } catch { /* ignore */ }

  // 6. Namespaced classStore in localStorage if useClassStore had empty defaults
  if (typeof window !== 'undefined') {
    try {
      const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
      const keys = [slug ? `edutech-classes_${slug}` : null, 'edutech-classes'].filter(Boolean) as string[]
      for (const k of keys) {
        const raw = localStorage.getItem(k)
        if (raw) {
          const parsed = JSON.parse(raw)
          const inst = parsed.state?.institution
          if (inst) {
            rawValues.push(inst.id, inst.name, inst.nameBn, inst.eiin, inst.slug, inst.subdomain)
          }
        }
      }
    } catch { /* ignore */ }
  }

  // Filter non-empty strings into candidateSet
  for (const v of rawValues) {
    if (v && typeof v === 'string' && v.trim() && v !== 'super-admin') {
      const lower = v.trim().toLowerCase()
      candidateSet.add(lower)
      if (lower.startsWith('inst-')) candidateSet.add(lower.replace('inst-', ''))
      if (lower.startsWith('sch_')) candidateSet.add(lower.replace('sch_', ''))
    }
  }

  // 7. Cross-reference with superAdminStore institutions list
  try {
    const allKnownInstitutions: any[] = []
    if (typeof window !== 'undefined') {
      try {
        const rawSA = localStorage.getItem('edutech_super_admin')
        if (rawSA) {
          const p = JSON.parse(rawSA)
          if (Array.isArray(p.state?.institutions)) allKnownInstitutions.push(...p.state.institutions)
        }
      } catch { /* ignore */ }

      try {
        const rawInsts = localStorage.getItem('edutech-institutions')
        if (rawInsts) {
          const p = JSON.parse(rawInsts)
          const arr = Array.isArray(p) ? p : (p.state?.institutions || [])
          allKnownInstitutions.push(...arr)
        }
      } catch { /* ignore */ }
    }

    try {
      const inMemory = useSuperAdminStore.getState?.()?.institutions
      if (Array.isArray(inMemory)) allKnownInstitutions.push(...inMemory)
    } catch { /* ignore */ }

    // For any institution that matches any discovered identifier, add ALL its other identifiers
    for (const inst of allKnownInstitutions) {
      if (!inst) continue
      const instKeys = [
        inst.id,
        inst.slug,
        inst.subdomain,
        inst.name,
        inst.nameBn,
        inst.eiin,
      ]
        .filter(Boolean)
        .map((k) => String(k).trim().toLowerCase())

      const hasMatch = instKeys.some((k) => {
        if (candidateSet.has(k)) return true
        if (k.startsWith('inst-') && candidateSet.has(k.replace('inst-', ''))) return true
        if (k.startsWith('sch_') && candidateSet.has(k.replace('sch_', ''))) return true
        return false
      })

      if (hasMatch) {
        for (const k of instKeys) {
          candidateSet.add(k)
          if (k.startsWith('inst-')) candidateSet.add(k.replace('inst-', ''))
          if (k.startsWith('sch_')) candidateSet.add(k.replace('sch_', ''))
        }
      }
    }
  } catch { /* ignore */ }

  const activeSlug =
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
      : null) || user?.schoolDomain || user?.subdomain || classInst?.slug || null

  return {
    slug: activeSlug,
    id: (typeof window !== 'undefined' ? sessionStorage.getItem('edutech_viewing_id') || sessionStorage.getItem('edutech_school_id') : null) || user?.schoolId || classInst?.id || activeSlug,
    subdomain: user?.subdomain || user?.schoolDomain || classInst?.subdomain || activeSlug,
    schoolId: user?.schoolId || classInst?.id || null,
    name: user?.schoolName || user?.school?.name || classInst?.name || null,
    nameBn: classInst?.nameBn || null,
    eiin: classInst?.eiin || user?.school?.eiin || null,
    aliases: Array.from(candidateSet),
  }
}

export function isNotificationForSchool(
  notification: Notification,
  schoolIdentifiers?: SchoolIdentifiers | null
): boolean {
  // If broadcast to all or targetType === 'all' or broadcastToAll is true, or no specific targets
  if (notification.broadcastToAll || !notification.targetType || notification.targetType === 'all') {
    return true
  }

  // If specific target type
  if (notification.targetType === 'specific') {
    const rawTargets = notification.targetInstitutions || []
    const rawNames = notification.targetInstitutionNames || []
    if (rawTargets.length === 0 && rawNames.length === 0) return true

    const targets = rawTargets.map((t) => String(t).toLowerCase().trim())
    const targetNames = rawNames.map((t) => String(t).toLowerCase().trim())

    const targetSet = new Set<string>()
    for (const t of targets) {
      targetSet.add(t)
      if (t.startsWith('inst-')) targetSet.add(t.replace('inst-', ''))
      if (t.startsWith('sch_')) targetSet.add(t.replace('sch_', ''))
    }
    for (const n of targetNames) {
      targetSet.add(n)
    }

    const candidateSet = new Set<string>()
    if (schoolIdentifiers) {
      if (schoolIdentifiers.aliases) {
        schoolIdentifiers.aliases.forEach((a) => candidateSet.add(String(a).toLowerCase().trim()))
      }
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
          const lower = c.toLowerCase().trim()
          candidateSet.add(lower)
          if (lower.startsWith('inst-')) candidateSet.add(lower.replace('inst-', ''))
          if (lower.startsWith('sch_')) candidateSet.add(lower.replace('sch_', ''))
        }
      }
    } else {
      const resolved = resolveCurrentSchoolIdentifiers()
      if (resolved.aliases) resolved.aliases.forEach((a) => candidateSet.add(a))
    }

    // Cross-reference with institutions stored in memory and localStorage
    try {
      const allKnownInstitutions: any[] = []
      if (typeof window !== 'undefined') {
        const rawSuperAdmin = localStorage.getItem('edutech_super_admin')
        if (rawSuperAdmin) {
          const parsed = JSON.parse(rawSuperAdmin)
          if (Array.isArray(parsed.state?.institutions)) allKnownInstitutions.push(...parsed.state.institutions)
        }
        const rawInsts = localStorage.getItem('edutech-institutions')
        if (rawInsts) {
          const parsed = JSON.parse(rawInsts)
          const arr = Array.isArray(parsed) ? parsed : (parsed.state?.institutions || [])
          allKnownInstitutions.push(...arr)
        }
      }
      try {
        const inMemory = useSuperAdminStore.getState?.()?.institutions
        if (Array.isArray(inMemory)) allKnownInstitutions.push(...inMemory)
      } catch { /* ignore */ }

      for (const inst of allKnownInstitutions) {
        if (!inst) continue
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

        const hasMatch = instKeys.some((k) => {
          if (candidateSet.has(k)) return true
          if (k.startsWith('inst-') && candidateSet.has(k.replace('inst-', ''))) return true
          if (k.startsWith('sch_') && candidateSet.has(k.replace('sch_', ''))) return true
          return false
        })

        if (hasMatch) {
          for (const k of instKeys) {
            candidateSet.add(k)
            if (k.startsWith('inst-')) candidateSet.add(k.replace('inst-', ''))
            if (k.startsWith('sch_')) candidateSet.add(k.replace('sch_', ''))
          }
        }
      }
    } catch { /* ignore */ }

    // If candidate set has no valid entries, return true as fallback
    if (candidateSet.size === 0) return true

    // 1. Check direct equality
    for (const c of candidateSet) {
      if (targetSet.has(c)) return true
    }

    // 2. Alphanumeric match (ignoring punctuation/spaces)
    const normTargets = Array.from(targetSet).map((t) => t.replace(/[^a-z0-9]/g, ''))
    for (const cand of candidateSet) {
      const normCand = cand.replace(/[^a-z0-9]/g, '')
      if (normCand.length >= 3 && normTargets.includes(normCand)) {
        return true
      }
    }

    // 3. Check substring / fuzzy matching for institution names / slugs (length > 3)
    for (const target of targetSet) {
      for (const cand of candidateSet) {
        if (cand === target) return true
        if (target.length > 3 && cand.length > 3 && (cand.includes(target) || target.includes(cand))) {
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
    const idents = resolveCurrentSchoolIdentifiers()
    const isSuperAdmin =
      idents.slug === 'super-admin' ||
      (!idents.slug && localStorage.getItem('edutech_auth_role') === 'super_admin')

    if (isSuperAdmin || isNotificationForSchool(n, idents)) {
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

            const idents = resolveCurrentSchoolIdentifiers()
            const schoolNotifs = masterNotifs.filter((n) =>
              isNotificationForSchool(n, idents)
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
              // 1. Add raw target identifiers directly (and without 'inst-', 'sch_')
              for (const t of n.targetInstitutions || []) {
                if (t && t !== 'super-admin') {
                  const s = String(t).toLowerCase().trim()
                  destSlugs.add(s)
                  if (s.startsWith('inst-')) destSlugs.add(s.replace('inst-', ''))
                  if (s.startsWith('sch_')) destSlugs.add(s.replace('sch_', ''))
                }
              }

              // 2. Cross-reference with all institutions to resolve slug/id/subdomain
              for (const inst of allInstList) {
                if (!inst) continue
                const instIdentifiers: SchoolIdentifiers = {
                  id: inst.id,
                  slug: inst.slug,
                  subdomain: inst.subdomain,
                  name: inst.name,
                  nameBn: inst.nameBn,
                  eiin: inst.eiin,
                  aliases: [inst.id, inst.slug, inst.subdomain, inst.name, inst.nameBn, inst.eiin].filter(Boolean),
                }

                if (isNotificationForSchool(n, instIdentifiers)) {
                  if (inst.slug) destSlugs.add(String(inst.slug).toLowerCase().trim())
                  if (inst.id) destSlugs.add(String(inst.id).toLowerCase().trim())
                  if (inst.subdomain) destSlugs.add(String(inst.subdomain).toLowerCase().trim())
                }
              }

              // 3. Match against existing edutech-notifications_<slug> and edutech-classes_<slug> keys
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i)
                if (k && (k.startsWith('edutech-notifications_') || k.startsWith('edutech-classes_'))) {
                  const s = k.replace('edutech-notifications_', '').replace('edutech-classes_', '').toLowerCase().trim()
                  if (s && s !== 'super-admin') {
                    let matched = false
                    try {
                      const rawCls = localStorage.getItem(`edutech-classes_${s}`)
                      if (rawCls) {
                        const parsed = JSON.parse(rawCls)
                        const cInst = parsed.state?.institution
                        if (cInst && isNotificationForSchool(n, {
                          slug: s,
                          id: cInst.id,
                          name: cInst.name,
                          nameBn: cInst.nameBn,
                          eiin: cInst.eiin,
                        })) {
                          matched = true
                        }
                      }
                    } catch { /* ignore */ }

                    if (matched || isNotificationForSchool(n, { slug: s, id: s, subdomain: s })) {
                      destSlugs.add(s)
                    }
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
      const idents = resolveCurrentSchoolIdentifiers()
      const schoolNotifs = masterNotifs.filter((n) =>
        isNotificationForSchool(n, idents)
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
