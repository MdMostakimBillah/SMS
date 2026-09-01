import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'
import { PERMISSION_PAGES } from '@/lib/permissionConfig'

export interface TabPerm {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

export interface PagePerm {
  page: string
  pageBn: string
  tabs: Record<string, TabPerm>
}

export interface StaffPerm {
  id: string
  staffId: string
  staffName: string
  staffNameBn: string
  role: 'teacher' | 'staff'
  email: string
  defaultPassword: string
  permissions: PagePerm[]
}

function buildDefaultTabs(pageKey: string): Record<string, TabPerm> {
  const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
  if (!page?.tabs) return {}
  const tabs: Record<string, TabPerm> = {}
  for (const tab of page.tabs) {
    tabs[tab.key] = { create: false, read: false, update: false, delete: false }
  }
  return tabs
}

function buildDefaultPermissions(): PagePerm[] {
  return PERMISSION_PAGES.map((p) => ({
    page: p.key,
    pageBn: p.labelBn,
    tabs: buildDefaultTabs(p.key),
  }))
}

function getPagePerm(permissions: PagePerm[], pageKey: string): PagePerm {
  return (
    permissions.find((p) => p.page === pageKey) || {
      page: pageKey,
      pageBn: '',
      tabs: buildDefaultTabs(pageKey),
    }
  )
}

function getTabPerm(permissions: PagePerm[], pageKey: string, tabKey: string): TabPerm {
  const pp = getPagePerm(permissions, pageKey)
  return pp.tabs[tabKey] || { create: false, read: false, update: false, delete: false }
}

interface PermissionState {
  staffPermissions: StaffPerm[]
  addStaff: (data: Omit<StaffPerm, 'id' | 'permissions'>) => string
  removeStaff: (id: string) => void
  updateTabPerm: (staffId: string, pageKey: string, tabKey: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => void
  setPagePermAll: (staffId: string, pageKey: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => void
  setAllTabsPerm: (staffId: string, pageKey: string, tabKey: string, value: boolean) => void
  getPagePerm: (staffId: string, pageKey: string) => PagePerm
  getTabPerm: (staffId: string, pageKey: string, tabKey: string) => TabPerm
  getPagePermCount: (staffId: string) => number
  getTabPermCount: (staffId: string, pageKey: string) => number
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      staffPermissions: [],

      addStaff: (data) => {
        const id = `SP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const newStaff: StaffPerm = {
          ...data,
          id,
          permissions: buildDefaultPermissions(),
        }
        set((state) => ({
          staffPermissions: [...state.staffPermissions, newStaff],
        }))
        return id
      },

      removeStaff: (id) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.filter((s) => s.id !== id),
        })),

      updateTabPerm: (staffId, pageKey, tabKey, action, value) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) => {
            if (s.id !== staffId) return s
            const existing = s.permissions.find((p) => p.page === pageKey)
            if (existing) {
              return {
                ...s,
                permissions: s.permissions.map((p) => {
                  if (p.page !== pageKey) return p
                  const existingTab = p.tabs[tabKey]
                  if (existingTab) {
                    return {
                      ...p,
                      tabs: {
                        ...p.tabs,
                        [tabKey]: { ...existingTab, [action]: value },
                      },
                    }
                  }
                  const page = PERMISSION_PAGES.find((pp) => pp.key === pageKey)
                  const defaultTab = page?.tabs?.find((t) => t.key === tabKey)
                  return {
                    ...p,
                    tabs: {
                      ...p.tabs,
                      [tabKey]: {
                        create: action === 'create' ? value : false,
                        read: action === 'read' ? value : false,
                        update: action === 'update' ? value : false,
                        delete: action === 'delete' ? value : false,
                        ...(defaultTab ? {} : {}),
                      },
                    },
                  }
                }),
              }
            }
            const pageInfo = PERMISSION_PAGES.find((p) => p.key === pageKey)
            return {
              ...s,
              permissions: [
                ...s.permissions,
                {
                  page: pageKey,
                  pageBn: pageInfo?.labelBn || '',
                  tabs: {
                    [tabKey]: {
                      create: action === 'create' ? value : false,
                      read: action === 'read' ? value : false,
                      update: action === 'update' ? value : false,
                      delete: action === 'delete' ? value : false,
                    },
                  },
                },
              ],
            }
          }),
        })),

      setPagePermAll: (staffId, pageKey, action, value) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) => {
            if (s.id !== staffId) return s
            const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
            const tabKeys = page?.tabs?.map((t) => t.key) || []
            const existing = s.permissions.find((p) => p.page === pageKey)
            if (existing) {
              const newTabs = { ...existing.tabs }
              if (tabKeys.length === 0) {
                newTabs['*'] = {
                  ...(newTabs['*'] || { create: false, read: false, update: false, delete: false }),
                  [action]: value,
                }
              } else {
                for (const tk of tabKeys) {
                  newTabs[tk] = {
                    ...(newTabs[tk] || { create: false, read: false, update: false, delete: false }),
                    [action]: value,
                  }
                }
              }
              return {
                ...s,
                permissions: s.permissions.map((p) =>
                  p.page === pageKey ? { ...p, tabs: newTabs } : p
                ),
              }
            }
            const pageInfo = PERMISSION_PAGES.find((p) => p.key === pageKey)
            const tabs: Record<string, TabPerm> = {}
            if (tabKeys.length === 0) {
              tabs['*'] = { create: action === 'create' ? value : false, read: action === 'read' ? value : false, update: action === 'update' ? value : false, delete: action === 'delete' ? value : false }
            } else {
              for (const tk of tabKeys) {
                tabs[tk] = { create: action === 'create' ? value : false, read: action === 'read' ? value : false, update: action === 'update' ? value : false, delete: action === 'delete' ? value : false }
              }
            }
            return {
              ...s,
              permissions: [...s.permissions, { page: pageKey, pageBn: pageInfo?.labelBn || '', tabs }],
            }
          }),
        })),

      setAllTabsPerm: (staffId, pageKey, tabKey, value) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) => {
            if (s.id !== staffId) return s
            const newPerms = s.permissions.map((p) => {
              if (p.page !== pageKey) return p
              return {
                ...p,
                tabs: {
                  ...p.tabs,
                  [tabKey]: {
                    create: value,
                    read: value,
                    update: value,
                    delete: value,
                  },
                },
              }
            })
            const hasPage = newPerms.some((p) => p.page === pageKey)
            if (hasPage) return { ...s, permissions: newPerms }
            const pageInfo = PERMISSION_PAGES.find((p) => p.key === pageKey)
            return {
              ...s,
              permissions: [
                ...newPerms,
                {
                  page: pageKey,
                  pageBn: pageInfo?.labelBn || '',
                  tabs: {
                    [tabKey]: { create: value, read: value, update: value, delete: value },
                  },
                },
              ],
            }
          }),
        })),

      getPagePerm: (staffId, pageKey) => {
        const member = get().staffPermissions.find((s) => s.id === staffId)
        return getPagePerm(member?.permissions || [], pageKey)
      },

      getTabPerm: (staffId, pageKey, tabKey) => {
        const member = get().staffPermissions.find((s) => s.id === staffId)
        return getTabPerm(member?.permissions || [], pageKey, tabKey)
      },

      getPagePermCount: (staffId) => {
        const member = get().staffPermissions.find((s) => s.id === staffId)
        if (!member) return 0
        return member.permissions.filter((p) => {
          const tabValues = Object.values(p.tabs)
          return tabValues.some((t) => t.read || t.create || t.update || t.delete)
        }).length
      },

      getTabPermCount: (staffId, pageKey) => {
        const member = get().staffPermissions.find((s) => s.id === staffId)
        if (!member) return 0
        const pp = member.permissions.find((p) => p.page === pageKey)
        if (!pp) return 0
        return Object.values(pp.tabs).filter((t) => t.read || t.create || t.update || t.delete).length
      },
    }),
    {
      name: 'edutech-staff-permissions',
      storage: createNamespacedStorage('edutech-staff-permissions'),
    }
  )
)

registerStoreReset(() => {
  usePermissionStore.setState({ staffPermissions: [] })
})
