import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset } from '@/lib/storage'
import { PERMISSION_TREE, createActionSet, ROLE_TEMPLATES, getPermissionNode, type PermissionAction, type ActionSet, type DataScope, type PermissionNode } from '@/lib/permissionConfig'

export type { PermissionAction, ActionSet, DataScope }

export interface PermissionEntry {
  key: string
  actions: ActionSet
}

export interface RolePerm {
  id: string
  name: string
  nameBn: string
  description: string
  descriptionBn: string
  isSystemRole: boolean
  permissions: PermissionEntry[]
  dataScope: DataScope
  createdAt: string
  updatedAt: string
}

export interface StaffPerm {
  id: string
  staffId: string
  staffName: string
  staffNameBn: string
  roleId: string
  role?: string
  email: string
  defaultPassword: string
  overrides: PermissionEntry[]
  dataScope?: DataScope
}

// Backward compat types (deprecated, kept for existing consumers)
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

function buildDefaultPermissions(): PermissionEntry[] {
  const entries: PermissionEntry[] = []
  function walk(nodes: typeof PERMISSION_TREE, prefix = '') {
    for (const node of nodes) {
      const fullKey = prefix ? `${prefix}.${node.key}` : node.key
      entries.push({ key: fullKey, actions: createActionSet() })
      if (node.children) walk(node.children, fullKey)
    }
  }
  walk(PERMISSION_TREE)
  return entries
}

function buildRolePermissions(templateKey: string): PermissionEntry[] {
  const template = ROLE_TEMPLATES[templateKey]
  if (!template) return buildDefaultPermissions()

  const entries: PermissionEntry[] = []
  function walk(nodes: typeof PERMISSION_TREE, prefix = '') {
    for (const node of nodes) {
      const fullKey = prefix ? `${prefix}.${node.key}` : node.key
      const isViewOnly = template.permissions.includes(fullKey)
      const isFullAccess = template.fullAccess?.includes(fullKey)
      const isParentOfFull = template.fullAccess?.some((fa) => fa.startsWith(fullKey + '.'))

      if (isFullAccess || isParentOfFull) {
        const enabledActions: PermissionAction[] = node.actions
        entries.push({ key: fullKey, actions: createActionSet(enabledActions) })
      } else if (isViewOnly) {
        entries.push({ key: fullKey, actions: createActionSet(['view']) })
      } else {
        entries.push({ key: fullKey, actions: createActionSet() })
      }
      if (node.children) walk(node.children, fullKey)
    }
  }
  walk(PERMISSION_TREE)
  return entries
}

function createDefaultRoles(): RolePerm[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'role-admin',
      name: 'Institution Admin',
      nameBn: 'প্রতিষ্ঠান প্রশাসক',
      description: 'Full institution access with all permissions',
      descriptionBn: 'সম্পূর্ণ প্রতিষ্ঠান অ্যাক্সেস',
      isSystemRole: true,
      permissions: buildDefaultPermissions().map((e) => ({ key: e.key, actions: createActionSet(PERMISSION_TREE.find((n) => e.key === n.key)?.actions || []) })),
      dataScope: 'all',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'role-teacher',
      name: 'Teacher',
      nameBn: 'শিক্ষক',
      description: 'Academic modules — attendance, exams, classes',
      descriptionBn: 'একাডেমিক মডিউল — উপস্থিতি, পরীক্ষা, শ্রেণি',
      isSystemRole: true,
      permissions: buildRolePermissions('teacher'),
      dataScope: 'own_class',
      createdAt: now,
      updatedAt: now,
    },
  ]
}

// Merge role permissions with user overrides
function getEffectiveActions(rolePerms: PermissionEntry[], overrides: PermissionEntry[], key: string): ActionSet {
  const roleEntry = rolePerms.find((e) => e.key === key)
  const overrideEntry = (overrides || []).find((e) => e.key === key)

  const base = roleEntry?.actions || createActionSet()
  if (!overrideEntry) return base

  const merged = { ...base }
  for (const action of Object.keys(overrideEntry.actions) as PermissionAction[]) {
    if (overrideEntry.actions[action]) {
      merged[action] = true
    }
  }
  return merged
}

interface PermissionState {
  roles: RolePerm[]
  staffPermissions: StaffPerm[]

  // Role CRUD
  addRole: (data: Omit<RolePerm, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateRole: (id: string, data: Partial<RolePerm>) => void
  removeRole: (id: string) => void
  duplicateRole: (id: string, newName: string, newNameBn: string) => string | null
  applyPreset: (roleId: string, templateKey: string) => void

  // Staff CRUD
  addStaff: (data: Omit<StaffPerm, 'id' | 'overrides'>) => string
  removeStaff: (id: string) => void
  setStaffRole: (staffId: string, roleId: string) => void

  // Permission mutations (on role or overrides)
  setRolePerm: (roleId: string, key: string, action: PermissionAction, value: boolean) => void
  setRolePermAll: (roleId: string, key: string, value: boolean) => void
  setRoleAllActions: (roleId: string, key: string, value: boolean) => void
  setOverride: (staffId: string, key: string, actions: ActionSet) => void
  removeOverride: (staffId: string, key: string) => void
  clearOverrides: (staffId: string) => void

  // Data scope
  setStaffDataScope: (staffId: string, scope: DataScope) => void
  setRoleDataScope: (roleId: string, scope: DataScope) => void

  // Getters
  getRole: (roleId: string) => RolePerm | undefined
  getStaff: (staffId: string) => StaffPerm | undefined
  getEffectivePerm: (staffId: string, key: string) => ActionSet
  canStaff: (staffId: string, key: string, action: PermissionAction) => boolean
  getStaffDataScope: (staffId: string) => DataScope
  getPermissionSource: (staffId: string, key: string, action: PermissionAction) => 'role' | 'override' | 'admin'

  // Counts
  getRolePermCount: (roleId: string) => number
  getStaffPermCount: (staffId: string) => number

  // Legacy compat (deprecated)
  getPagePermCount: (staffId: string) => number
  getTabPermCount: (staffId: string, pageKey: string) => number
  updateTabPerm: (staffId: string, pageKey: string, tabKey: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => void
  setPagePermAll: (staffId: string, pageKey: string, action: 'create' | 'read' | 'update' | 'delete', value: boolean) => void
  setAllTabsPerm: (staffId: string, pageKey: string, tabKey: string, value: boolean) => void
  getPagePerm: (staffId: string, pageKey: string) => PagePerm
  getTabPerm: (staffId: string, pageKey: string, tabKey: string) => TabPerm
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      roles: createDefaultRoles(),
      staffPermissions: [],

      // ─── Role CRUD ────────────────────────────────────────

      addRole: (data) => {
        const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const now = new Date().toISOString()
        set((state) => ({
          roles: [...state.roles, { ...data, id, createdAt: now, updatedAt: now }],
        }))
        return id
      },

      updateRole: (id, data) =>
        set((state) => ({
          roles: state.roles.map((r) => r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r),
        })),

      removeRole: (id) => {
        if (id === 'role-admin' || id === 'role-teacher') return
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id),
          staffPermissions: state.staffPermissions.map((s) =>
            s.roleId === id ? { ...s, roleId: 'role-teacher' } : s
          ),
        }))
      },

      duplicateRole: (id, newName, newNameBn) => {
        const source = get().roles.find((r) => r.id === id)
        if (!source) return null
        const newId = `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const now = new Date().toISOString()
        const newRole: RolePerm = {
          ...source,
          id: newId,
          name: newName,
          nameBn: newNameBn,
          isSystemRole: false,
          permissions: source.permissions.map((p) => ({ ...p, actions: { ...p.actions } })),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ roles: [...state.roles, newRole] }))
        return newId
      },

      applyPreset: (roleId, templateKey) => {
        const template = ROLE_TEMPLATES[templateKey]
        if (!template) return
        set((state) => ({
          roles: state.roles.map((r) => {
            if (r.id !== roleId) return r
            return {
              ...r,
              permissions: buildRolePermissions(templateKey),
              dataScope: template.dataScope,
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      // ─── Staff CRUD ───────────────────────────────────────

      addStaff: (data) => {
        const id = `SP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const newStaff: StaffPerm = { ...data, id, overrides: [] }
        set((state) => ({
          staffPermissions: [...state.staffPermissions, newStaff],
        }))
        return id
      },

      removeStaff: (id) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.filter((s) => s.id !== id),
        })),

      setStaffRole: (staffId, roleId) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) =>
            s.id === staffId ? { ...s, roleId, overrides: [] } : s
          ),
        })),

      // ─── Permission mutations ─────────────────────────────

      setRolePerm: (roleId, key, action, value) =>
        set((state) => ({
          roles: state.roles.map((r) => {
            if (r.id !== roleId) return r
            const existing = r.permissions.find((p) => p.key === key)
            if (existing) {
              return {
                ...r,
                permissions: r.permissions.map((p) =>
                  p.key === key ? { ...p, actions: { ...p.actions, [action]: value } } : p
                ),
                updatedAt: new Date().toISOString(),
              }
            }
            return {
              ...r,
              permissions: [...r.permissions, { key, actions: createActionSet(value ? [action] : []) }],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      setRolePermAll: (roleId, key, value) =>
        set((state) => ({
          roles: state.roles.map((r) => {
            if (r.id !== roleId) return r
            const node = findNode(key)
            const allActions = node?.actions || (['view', 'create', 'edit', 'delete'] as PermissionAction[])
            const actions = createActionSet(value ? allActions : [])
            const existing = r.permissions.find((p) => p.key === key)
            if (existing) {
              return {
                ...r,
                permissions: r.permissions.map((p) => p.key === key ? { ...p, actions } : p),
                updatedAt: new Date().toISOString(),
              }
            }
            return {
              ...r,
              permissions: [...r.permissions, { key, actions }],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      setRoleAllActions: (roleId, key, value) =>
        set((state) => ({
          roles: state.roles.map((r) => {
            if (r.id !== roleId) return r
            const actions = createActionSet(value ? (findNode(key)?.actions || []) : [])
            const existing = r.permissions.find((p) => p.key === key)
            if (existing) {
              return {
                ...r,
                permissions: r.permissions.map((p) => p.key === key ? { ...p, actions } : p),
                updatedAt: new Date().toISOString(),
              }
            }
            return {
              ...r,
              permissions: [...r.permissions, { key, actions }],
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      setOverride: (staffId, key, actions) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) => {
            if (s.id !== staffId) return s
            const existing = s.overrides.find((o) => o.key === key)
            if (existing) {
              return {
                ...s,
                overrides: s.overrides.map((o) => o.key === key ? { ...o, actions } : o),
              }
            }
            return { ...s, overrides: [...s.overrides, { key, actions }] }
          }),
        })),

      removeOverride: (staffId, key) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) =>
            s.id === staffId ? { ...s, overrides: s.overrides.filter((o) => o.key !== key) } : s
          ),
        })),

      clearOverrides: (staffId) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) =>
            s.id === staffId ? { ...s, overrides: [] } : s
          ),
        })),

      // ─── Data scope ───────────────────────────────────────

      setStaffDataScope: (staffId, scope) =>
        set((state) => ({
          staffPermissions: state.staffPermissions.map((s) =>
            s.id === staffId ? { ...s, dataScope: scope } : s
          ),
        })),

      setRoleDataScope: (roleId, scope) =>
        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === roleId ? { ...r, dataScope: scope, updatedAt: new Date().toISOString() } : r
          ),
        })),

      // ─── Getters ──────────────────────────────────────────

      getRole: (roleId) => get().roles.find((r) => r.id === roleId),

      getStaff: (staffId) => get().staffPermissions.find((s) => s.id === staffId),

      getEffectivePerm: (staffId, key) => {
        const staff = get().staffPermissions.find((s) => s.id === staffId)
        if (!staff) return createActionSet()
        const role = get().roles.find((r) => r.id === staff.roleId)
        return getEffectiveActions(role?.permissions || [], staff.overrides || [], key)
      },

      canStaff: (staffId, key, action) => {
        const perm = get().getEffectivePerm(staffId, key)
        return perm[action]
      },

      getStaffDataScope: (staffId) => {
        const staff = get().staffPermissions.find((s) => s.id === staffId)
        if (staff?.dataScope) return staff.dataScope
        const role = get().roles.find((r) => r.id === staff?.roleId)
        return role?.dataScope || 'all'
      },

      getPermissionSource: (staffId, key, action) => {
        const staff = get().staffPermissions.find((s) => s.id === staffId)
        if (!staff) return 'role'
        const override = (staff.overrides || []).find((o) => o.key === key)
        if (override?.actions[action]) return 'override'
        return 'role'
      },

      // ─── Counts ───────────────────────────────────────────

      getRolePermCount: (roleId) => {
        const role = get().roles.find((r) => r.id === roleId)
        if (!role) return 0
        return role.permissions.filter((p) => Object.values(p.actions).some(Boolean)).length
      },

      getStaffPermCount: (staffId) => {
        const staff = get().staffPermissions.find((s) => s.id === staffId)
        if (!staff) return 0
        const role = get().roles.find((r) => r.id === staff.roleId)
        const keys = new Set<string>()
        for (const p of role?.permissions || []) {
          if (Object.values(p.actions).some(Boolean)) keys.add(p.key)
        }
        for (const o of staff.overrides || []) {
          if (Object.values(o.actions).some(Boolean)) keys.add(o.key)
        }
        return keys.size
      },

      // ─── Legacy compat (deprecated) ───────────────────────

      getPagePermCount: (staffId) => get().getStaffPermCount(staffId),

      getTabPermCount: (staffId, pageKey) => {
        const staff = get().staffPermissions.find((s) => s.id === staffId)
        if (!staff) return 0
        const role = get().roles.find((r) => r.id === staff.roleId)
        const allKeys = (role?.permissions || []).concat(staff.overrides || []).map((p) => p.key)
        return allKeys.filter((k) => k.startsWith(pageKey + '.')).length
      },

      updateTabPerm: (staffId, pageKey, tabKey, action, value) => {
        const key = `${pageKey}.${tabKey}`
        const actionMap: Record<string, PermissionAction> = { create: 'create', read: 'view', update: 'edit', delete: 'delete' }
        const permAction = actionMap[action] || 'view'
        const staff = get().staffPermissions.find((s) => s.id === staffId)
        if (!staff) return
        const role = get().roles.find((r) => r.id === staff.roleId)
        const currentVal = (role?.permissions || []).find((p) => p.key === key)?.actions[permAction] || false
        if (value === currentVal && !(staff.overrides || []).find((o) => o.key === key)) return
        const overrideActions = createActionSet()
        overrideActions[permAction] = value
        get().setOverride(staffId, key, overrideActions)
      },

      setPagePermAll: (staffId, pageKey, action, value) => {
        const actionMap: Record<string, PermissionAction> = { create: 'create', read: 'view', update: 'edit', delete: 'delete' }
        const permAction = actionMap[action] || 'view'
        const page = findNode(pageKey)
        if (!page) return
        const childKeys = collectKeys(pageKey)
        for (const k of childKeys) {
          const overrideActions = createActionSet()
          overrideActions[permAction] = value
          get().setOverride(staffId, k, overrideActions)
        }
      },

      setAllTabsPerm: (staffId, pageKey, tabKey, value) => {
        const key = `${pageKey}.${tabKey}`
        if (value) {
          const node = findNode(key)
          const actions = createActionSet(node?.actions || [])
          get().setOverride(staffId, key, actions)
        } else {
          get().setOverride(staffId, key, createActionSet())
        }
      },

      getPagePerm: (staffId, pageKey) => {
        const perm = get().getEffectivePerm(staffId, pageKey)
        return {
          page: pageKey,
          pageBn: '',
          tabs: {
            '*': {
              create: perm.create,
              read: perm.view,
              update: perm.edit,
              delete: perm.delete,
            },
          },
        }
      },

      getTabPerm: (staffId, pageKey, tabKey) => {
        const key = tabKey === '*' ? pageKey : `${pageKey}.${tabKey}`
        const perm = get().getEffectivePerm(staffId, key)
        return { create: perm.create, read: perm.view, update: perm.edit, delete: perm.delete }
      },
    }),
    {
      name: 'edutech-staff-permissions',
      storage: createNamespacedStorage('edutech-staff-permissions'),
    }
  )
)

// Helpers
function findNode(key: string): PermissionNode | undefined {
  return getPermissionNode(key)
}

function collectKeys(prefix: string): string[] {
  const keys: string[] = [prefix]
  function walk(nodes: typeof PERMISSION_TREE, parentKey: string) {
    for (const node of nodes) {
      const fullKey = parentKey ? `${parentKey}.${node.key}` : node.key
      if (fullKey.startsWith(prefix)) keys.push(fullKey)
      if (node.children) walk(node.children, fullKey)
    }
  }
  walk(PERMISSION_TREE, '')
  return [...new Set(keys.filter((k) => k.startsWith(prefix)))]
}

registerStoreReset(() => {
  usePermissionStore.setState({ roles: createDefaultRoles(), staffPermissions: [] })
})
