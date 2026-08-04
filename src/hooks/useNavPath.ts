import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { INSTITUTION_ROLES, type InstitutionRole } from '@/lib/navUtils'

/**
 * Extracts the base navigation path from the current URL.
 * 
 * Examples:
 *   /super-admin/admin/dashboard → /super-admin/admin
 *   /super-admin/admin/teachers/all → /super-admin/admin
 *   /super-admin/viewing/admin/dashboard → /super-admin/viewing/admin
 *   /admin/dashboard → /admin
 *   /i/sunrise/admin/teachers → /i/sunrise/admin
 */
export function useNavBasePath(): string {
  const location = useLocation()

  return useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean)

    // /super-admin/viewing/{role}/{page} → /super-admin/viewing/{role}
    if (parts[0] === 'super-admin' && parts[1] === 'viewing' && parts.length >= 4) {
      return `/super-admin/viewing/${parts[2]}`
    }

    // /super-admin/{role}/{page} → /super-admin/{role}
    if (parts[0] === 'super-admin' && parts.length >= 3 && INSTITUTION_ROLES.includes(parts[1] as InstitutionRole)) {
      return `/super-admin/${parts[1]}`
    }

    // /super-admin/{page} → /super-admin (management pages)
    if (parts[0] === 'super-admin') {
      return '/super-admin'
    }

    // /i/{slug}/{role}/{page} → /i/{slug}/{role}
    if (parts[0] === 'i' && parts.length >= 4 && INSTITUTION_ROLES.includes(parts[2] as InstitutionRole)) {
      return `/i/${parts[1]}/${parts[2]}`
    }

    // /{role}/{page} → /{role}
    if (parts.length >= 2 && INSTITUTION_ROLES.includes(parts[0] as InstitutionRole)) {
      return `/${parts[0]}`
    }

    return ''
  }, [location.pathname])
}

/**
 * Returns a function that prepends the current base path to a relative path.
 * 
 * Usage:
 *   const nav = useNavPath()
 *   nav('/teachers/add') → /super-admin/admin/teachers/add (if on super admin)
 *   nav('/teachers/add') → /admin/teachers/add (if on institution admin)
 */
export function useNavPath(): (relativePath: string) => string {
  const basePath = useNavBasePath()

  return useMemo(() => {
    return (relativePath: string) => {
      if (relativePath.startsWith(basePath)) return relativePath
      return `${basePath}${relativePath}`
    }
  }, [basePath])
}
