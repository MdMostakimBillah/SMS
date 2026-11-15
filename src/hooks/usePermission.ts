import { useContext, useMemo, useCallback } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import { usePermissionStore, type TabPerm, type DataScope } from '@/store/permissionStore'
import { getPermissionNode, type PermissionAction, type ActionSet } from '@/lib/permissionConfig'

export type { PermissionAction }

const FULL_ACCESS: TabPerm = { create: true, read: true, update: true, delete: true }
const ALL_FALSE: ActionSet = { view: false, create: false, edit: false, delete: false, approve: false, reject: false, print: false, export: false, import: false, download: false, publish: false, manage: false, configure: false }

export function usePermission() {
  const ctx = useContext(AuthContext)
  const user = ctx?.user ?? null
  const staffPermissions = usePermissionStore((s) => s.staffPermissions) ?? []
  const roles = usePermissionStore((s) => s.roles) ?? []

  const isAdmin = user?.role === 'admin' || user?.role === 'school_admin' || user?.role === 'super_admin'

  const myStaff = useMemo(() => {
    return !isAdmin
      ? staffPermissions.find((s) => s.staffId === user?.staffId || s.staffId === user?.id)
      : undefined
  }, [isAdmin, staffPermissions, user?.staffId, user?.id])

  const myRole = useMemo(() => {
    return myStaff ? roles.find((r) => r.id === myStaff.roleId) : undefined
  }, [myStaff, roles])

  // ─── Core permission check ──────────────────────────────

  const can = useCallback((key: string, action: PermissionAction): boolean => {
    if (isAdmin) return true
    if (!myStaff) return false

    // Merge role + overrides for this key
    const roleEntry = (myRole?.permissions ?? []).find((p) => p.key === key)
    const overrideEntry = (myStaff.overrides ?? []).find((o) => o.key === key)

    const base = roleEntry?.actions || ALL_FALSE
    const override = overrideEntry?.actions

    // Override explicitly denies → false
    if (override && action in override && !override[action]) return false
    // Override explicitly allows → true
    if (override?.[action]) return true
    // Fallback to role permission
    return base[action]
  }, [isAdmin, myStaff, myRole])

  // ─── Convenience methods ────────────────────────────────

  const canView = useCallback((key: string): boolean => can(key, 'view'), [can])
  const canCreate = useCallback((key: string): boolean => can(key, 'create'), [can])
  const canEdit = useCallback((key: string): boolean => can(key, 'edit'), [can])
  const canDelete = useCallback((key: string): boolean => can(key, 'delete'), [can])
  const canApprove = useCallback((key: string): boolean => can(key, 'approve'), [can])
  const canReject = useCallback((key: string): boolean => can(key, 'reject'), [can])
  const canPrint = useCallback((key: string): boolean => can(key, 'print'), [can])
  const canExport = useCallback((key: string): boolean => can(key, 'export'), [can])
  const canImport = useCallback((key: string): boolean => can(key, 'import'), [can])
  const canDownload = useCallback((key: string): boolean => can(key, 'download'), [can])
  const canPublish = useCallback((key: string): boolean => can(key, 'publish'), [can])
  const canManage = useCallback((key: string): boolean => can(key, 'manage'), [can])
  const canConfigure = useCallback((key: string): boolean => can(key, 'configure'), [can])

  // ─── Module-level check (any child has the action) ──────

  const canAccessModule = useCallback((moduleKey: string): boolean => {
    if (isAdmin) return true
    if (!myStaff) return false
    return can(moduleKey, 'view')
  }, [isAdmin, myStaff, can])

  const getModulePermissions = useCallback((moduleKey: string): PermissionEntry[] => {
    if (!myStaff) return []
    const rolePerms = myRole?.permissions || []
    const overrides = myStaff.overrides ?? []
    const result: { key: string; actions: ActionSet }[] = []
    for (const entry of rolePerms) {
      if (entry.key === moduleKey || entry.key.startsWith(moduleKey + '.')) {
        const overrideEntry = overrides.find((o) => o.key === entry.key)
        const merged = { ...entry.actions }
        if (overrideEntry) {
          for (const a of Object.keys(overrideEntry.actions) as PermissionAction[]) {
            if (overrideEntry.actions[a]) merged[a] = true
          }
        }
        result.push({ key: entry.key, actions: merged })
      }
    }
    return result
  }, [myStaff, myRole])

  // ─── Data scope ─────────────────────────────────────────

  const dataScope: DataScope = myStaff?.dataScope || myRole?.dataScope || 'all'

  // ─── Permission source ──────────────────────────────────

  const getPermissionSource = useCallback((key: string, action: PermissionAction): 'role' | 'override' | 'admin' => {
    if (isAdmin) return 'admin'
    if (!myStaff) return 'role'
    const override = (myStaff.overrides ?? []).find((o) => o.key === key)
    if (override?.actions[action]) return 'override'
    return 'role'
  }, [isAdmin, myStaff])

  // ─── Backward-compatible API ────────────────────────────

  const resolveKey = useCallback((pageKey: string, tabKey?: string): string => {
    if (tabKey) return `${pageKey}.${tabKey}`
    return pageKey
  }, [])

  const canRead = useCallback((pageKey: string, tabKey?: string): boolean => {
    const key = resolveKey(pageKey, tabKey)
    if (tabKey) return can(key, 'view') || can(pageKey, 'view')
    const node = getPermissionNode(pageKey)
    if (!node?.children) return can(pageKey, 'view')
    return node.children.some((child) => {
      if (child.children) {
        return child.children.some((gc) => can(`${pageKey}.${child.key}.${gc.key}`, 'view'))
      }
      return can(`${pageKey}.${child.key}`, 'view')
    }) || can(pageKey, 'view')
  }, [resolveKey, can])

  const canUpdate = useCallback((pageKey: string, tabKey?: string): boolean => {
    const key = resolveKey(pageKey, tabKey)
    if (tabKey) return can(key, 'edit') || can(pageKey, 'edit')
    const node = getPermissionNode(pageKey)
    if (!node?.children) return can(pageKey, 'edit')
    return node.children.some((child) => {
      if (child.children) {
        return child.children.some((gc) => can(`${pageKey}.${child.key}.${gc.key}`, 'edit'))
      }
      return can(`${pageKey}.${child.key}`, 'edit')
    }) || can(pageKey, 'edit')
  }, [resolveKey, can])

  const getTabPerm = useCallback((pageKey: string, tabKey: string): TabPerm => {
    if (isAdmin) return FULL_ACCESS
    const key = tabKey === '*' ? pageKey : `${pageKey}.${tabKey}`
    const perm = myStaff ? usePermissionStore.getState().getEffectivePerm(myStaff.id, key) : ALL_FALSE
    return { create: perm.create, read: perm.view, update: perm.edit, delete: perm.delete }
  }, [isAdmin, myStaff])

  return useMemo(() => ({
    // New API
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canPrint,
    canExport,
    canImport,
    canDownload,
    canPublish,
    canManage,
    canConfigure,
    canAccessModule,
    getModulePermissions,
    dataScope,
    getPermissionSource,
    role: myRole || null,
    staff: myStaff || null,
    isAdmin,

    // Backward-compatible API
    canRead,
    canUpdate,
    getTabPerm,
  }), [
    can,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canPrint,
    canExport,
    canImport,
    canDownload,
    canPublish,
    canManage,
    canConfigure,
    canAccessModule,
    getModulePermissions,
    dataScope,
    getPermissionSource,
    myRole,
    myStaff,
    isAdmin,
    canRead,
    canUpdate,
    getTabPerm,
  ])
}

interface PermissionEntry {
  key: string
  actions: ActionSet
}
