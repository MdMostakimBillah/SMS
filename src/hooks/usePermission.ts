import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import { usePermissionStore, type TabPerm } from '@/store/permissionStore'
import { PERMISSION_PAGES } from '@/lib/permissionConfig'

const FULL_ACCESS: TabPerm = { create: true, read: true, update: true, delete: true }

export function usePermission() {
  const ctx = useContext(AuthContext)
  const user = ctx?.user ?? null
  const staffPermissions = usePermissionStore((s) => s.staffPermissions)

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const myPerms = !isAdmin
    ? staffPermissions.find((p) => p.staffId === user?.id)
    : undefined

  const checkTab = (pageKey: string, tabKey: string, action: keyof TabPerm): boolean => {
    if (isAdmin) return true
    if (!myPerms) return false

    const pageConfig = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!pageConfig) return false

    const pagePerm = myPerms.permissions.find((p) => p.page === pageKey)
    if (!pagePerm) return false

    if (!pageConfig.tabs) {
      const wildcard = pagePerm.tabs['*']
      return wildcard ? wildcard[action] : false
    }

    const tabPerm = pagePerm.tabs[tabKey]
    return tabPerm ? tabPerm[action] : false
  }

  const canRead = (pageKey: string, tabKey?: string): boolean => {
    if (tabKey) return checkTab(pageKey, tabKey, 'read')
    const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!page?.tabs) return checkTab(pageKey, '*', 'read')
    return page.tabs.some((t) => checkTab(pageKey, t.key, 'read'))
  }

  const canCreate = (pageKey: string, tabKey?: string): boolean => {
    if (tabKey) return checkTab(pageKey, tabKey, 'create')
    const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!page?.tabs) return checkTab(pageKey, '*', 'create')
    return page.tabs.some((t) => checkTab(pageKey, t.key, 'create'))
  }

  const canUpdate = (pageKey: string, tabKey?: string): boolean => {
    if (tabKey) return checkTab(pageKey, tabKey, 'update')
    const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!page?.tabs) return checkTab(pageKey, '*', 'update')
    return page.tabs.some((t) => checkTab(pageKey, t.key, 'update'))
  }

  const canDelete = (pageKey: string, tabKey?: string): boolean => {
    if (tabKey) return checkTab(pageKey, tabKey, 'delete')
    const page = PERMISSION_PAGES.find((p) => p.key === pageKey)
    if (!page?.tabs) return checkTab(pageKey, '*', 'delete')
    return page.tabs.some((t) => checkTab(pageKey, t.key, 'delete'))
  }

  const getTabPerm = (pageKey: string, tabKey: string): TabPerm => {
    if (isAdmin) return FULL_ACCESS
    if (!myPerms) return { create: false, read: false, update: false, delete: false }
    const pagePerm = myPerms.permissions.find((p) => p.page === pageKey)
    if (!pagePerm) return { create: false, read: false, update: false, delete: false }
    return pagePerm.tabs[tabKey] || { create: false, read: false, update: false, delete: false }
  }

  return { canRead, canCreate, canUpdate, canDelete, getTabPerm, isAdmin }
}
